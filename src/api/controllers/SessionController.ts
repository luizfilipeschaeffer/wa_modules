import { FastifyReply, FastifyRequest } from 'fastify';
import { WhatsAppClient } from '../../core/WhatsAppClient';
import * as QRCode from 'qrcode';

import { PrismaClient } from '@prisma/client';

import { v4 as uuidv4 } from 'uuid';
import type { ChatOrigin } from '../../types';

/** Prisma client incluindo delegate groupProfile (garante tipagem após prisma generate). */
type PrismaWithGroupProfile = PrismaClient & {
    groupProfile: {
        findMany: (args: { where: { sessionId: string; id?: { in: string[] } }; select: object }) => Promise<{ id: string; name: string | null; profilePicture: string | null; isCommunity: boolean; linkedParent: string | null; isCommunityAnnounce: boolean }[]>;
        findFirst: (args: { where: { sessionId: string; id: string }; select: object }) => Promise<{ name: string | null; profilePicture: string | null; isCommunity: boolean; linkedParent: string | null; isCommunityAnnounce: boolean } | null>;
        upsert: (args: object) => Promise<unknown>;
        deleteMany: (args: { where: { sessionId: string } }) => Promise<unknown>;
    };
};

function groupChatOrigin(linkedParent: string | null | undefined, isCommunity: boolean, isCommunityAnnounce: boolean): ChatOrigin {
    if (linkedParent) return 'group_in_community';
    if (isCommunity || isCommunityAnnounce) return 'community';
    return 'group';
}

export class SessionController {
    constructor(
        private activeSessions: Map<string, WhatsAppClient>,
        private getSessionFn: (sessionId: string) => WhatsAppClient,
        private prisma: PrismaClient
    ) { }

    private get db(): PrismaWithGroupProfile {
        return this.prisma as PrismaWithGroupProfile;
    }

    private getUserId(request: FastifyRequest): string | null {
        const user = (request as any).user;
        return user?.id ?? null;
    }

    private async userOwnsSession(sessionId: string, userId: string): Promise<boolean> {
        const row = await (this.prisma as any).userSession.findFirst({
            where: { sessionId, userId }
        });
        return !!row;
    }

    async createSession(request: FastifyRequest, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId) {
            return reply.status(401).send({ message: 'Unauthorized' });
        }
        const sessionId = uuidv4();
        await (this.prisma as any).userSession.create({
            data: { userId, sessionId }
        });
        const client = this.getSessionFn(sessionId);
        client.connect().catch(err => request.log.error(err));
        return {
            status: 'created',
            sessionId,
            message: 'Session created and process started.',
            qrUrl: `http://localhost:3000/session/${sessionId}/qr-code`
        };
    }

    async listSessions(request: FastifyRequest<{ Querystring: { status?: string, phoneNumber?: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId) {
            return reply.status(401).send({ message: 'Unauthorized' });
        }
        const owned = await (this.prisma as any).userSession.findMany({
            where: { userId },
            select: { sessionId: true }
        });
        const ownedSessionIds = new Set<string>(owned.map((r: { sessionId: string }) => r.sessionId));

        const { status, phoneNumber } = request.query;
        const sessions: { sessionId: string; status: string; state: string; user: any; phoneNumber: string | null }[] = [];
        const activeIds = new Set(this.activeSessions.keys());

        for (const [id, client] of this.activeSessions.entries()) {
            if (!ownedSessionIds.has(id)) continue;
            const user = client.getUser();
            const userPhone = user?.id ? user.id.split(':')[0] : null;
            sessions.push({
                sessionId: id,
                status: 'active',
                state: client.getConnectionState(),
                user: user,
                phoneNumber: userPhone
            });
        }

        const ownedIdsArray = Array.from(ownedSessionIds) as string[];
        const dbSessions = await this.prisma.session.findMany({
            where: {
                sessionId: { notIn: Array.from(activeIds), in: ownedIdsArray }
            },
            distinct: ['sessionId'],
            select: { sessionId: true }
        });

        for (const s of dbSessions) {
            sessions.push({
                sessionId: s.sessionId,
                status: 'inactive',
                state: 'disconnected',
                user: null,
                phoneNumber: null
            });
        }

        // Incluir sessões do usuário que ainda não têm credenciais (só criadas, sem QR)
        for (const sid of ownedSessionIds) {
            if (sessions.some((s) => s.sessionId === sid)) continue;
            sessions.push({
                sessionId: sid,
                status: 'inactive',
                state: 'disconnected',
                user: null,
                phoneNumber: null
            });
        }

        let result: typeof sessions = sessions.sort((a, b) => a.sessionId.localeCompare(b.sessionId));
        if (status) result = result.filter(s => s.status === status);
        if (phoneNumber) result = result.filter(s => s.phoneNumber && s.phoneNumber.includes(phoneNumber));
        return result;
    }

    async connect(request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId } = request.params;
        const client = this.getSessionFn(sessionId);
        client.connect().catch(err => request.log.error(err));
        return {
            status: 'connecting',
            message: 'Process started.',
            qrUrl: `http://localhost:3000/session/${sessionId}/qr-code`
        };
    }

    async getStatus(request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId } = request.params;
        if (!this.activeSessions.has(sessionId)) {
            return { status: 'inactive', state: 'disconnected', user: null };
        }
        const client = this.activeSessions.get(sessionId)!;
        const state = client.getConnectionState();
        const user = client.getUser();
        return { status: 'active', state, user };
    }

    async getQrCode(request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) {
        const { sessionId } = request.params;
        if (!this.activeSessions.has(sessionId)) {
            return `Session '${sessionId}' not active. Please connect first.`;
        }
        const client = this.activeSessions.get(sessionId)!;
        const qr = client.lastQr;

        if (!qr) {
            const state = client.getConnectionState();
            return `No QR Code available. Current State: ${state}`;
        }

        try {
            const qrImage = await QRCode.toDataURL(qr);
            reply.type('text/html');
            return `
                <html>
                    <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;flex-direction:column;font-family:sans-serif;">
                        <h1>Scan this QR Code</h1>
                        <img src="${qrImage}" style="border:10px solid white; border-radius:10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 300px; height: 300px;" />
                        <p>Session: <strong>${sessionId}</strong></p>
                        <script>setTimeout(() => location.reload(), 3000);</script>
                    </body>
                </html>
            `;
        } catch (e) {
            return 'Error generating QR image';
        }
    }

    async logout(request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId } = request.params;
        if (!this.activeSessions.has(sessionId)) {
            return reply.status(404).send({ message: `Session '${sessionId}' not active. Call /connect first to load it, then logout.` });
        }
        const client = this.activeSessions.get(sessionId)!;
        await client.disconnect(true);
        this.activeSessions.delete(sessionId);
        return { success: true, message: 'Session logged out and data cleared.' };
    }

    async deleteSession(request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId } = request.params;
        if (this.activeSessions.has(sessionId)) {
            return reply.status(400).send({ message: 'Cannot delete active session. Logout first.' });
        }
        await (this.prisma as any).userSession.deleteMany({ where: { userId, sessionId } });
        await this.prisma.session.deleteMany({ where: { sessionId } });
        await this.prisma.message.deleteMany({ where: { sessionId } });
        await this.prisma.contact.deleteMany({ where: { sessionId } });
        await this.db.groupProfile.deleteMany({ where: { sessionId } });
        await this.prisma.webhook.deleteMany({ where: { sessionId } });
        return { status: 'deleted', message: 'Session data removed from database.' };
    }

    /**
     * Retorna perfis em cache do banco (nome/foto) para vários JIDs. Não exige sessão ativa.
     * Query: jids = JIDs separados por vírgula (URL-encoded).
     */
    async getBulkProfiles(request: FastifyRequest<{ Params: { sessionId: string }; Querystring: { jids?: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId } = request.params;
        const jidsRaw = request.query.jids || '';
        const jids = jidsRaw.split(',').map((j) => j.trim()).filter(Boolean);
        if (jids.length === 0) {
            return reply.send({});
        }
        try {
            const contacts = jids.filter((j) => j.includes('@s.whatsapp.net'));
            const groups = jids.filter((j) => j.includes('@g.us'));
            const result: Record<string, { name?: string; profilePictureUrl?: string; isCommunity?: boolean; chatOrigin?: ChatOrigin }> = {};

            if (contacts.length > 0) {
                const rows = await this.prisma.contact.findMany({
                    where: { sessionId, id: { in: contacts } },
                    select: { id: true, name: true, pushName: true, profilePicture: true }
                });
                for (const r of rows) {
                    result[r.id] = {
                        name: r.name || r.pushName || undefined,
                        profilePictureUrl: r.profilePicture || undefined,
                        chatOrigin: 'personal'
                    };
                }
            }
            if (groups.length > 0) {
                const rows = await this.db.groupProfile.findMany({
                    where: { sessionId, id: { in: groups } },
                    select: { id: true, name: true, profilePicture: true, isCommunity: true, linkedParent: true, isCommunityAnnounce: true }
                });
                for (const r of rows) {
                    result[r.id] = {
                        name: r.name || undefined,
                        profilePictureUrl: r.profilePicture || undefined,
                        isCommunity: r.isCommunity,
                        chatOrigin: groupChatOrigin(r.linkedParent, r.isCommunity, r.isCommunityAnnounce)
                    };
                }
            }
            return reply.send(result);
        } catch (err) {
            request.log.error(err);
            return reply.status(500).send({ message: 'Failed to get bulk profiles' });
        }
    }

    /**
     * Retorna nome e foto de perfil do contato (1:1). Lê/grava cache no banco e atualiza com dados do WhatsApp.
     */
    async getContactInfo(request: FastifyRequest<{ Params: { sessionId: string; jid: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId, jid } = request.params;
        const fullJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;
        try {
            const cached = await this.prisma.contact.findFirst({
                where: { sessionId, id: fullJid },
                select: { name: true, pushName: true, profilePicture: true }
            });
            let name: string | undefined = cached?.name || cached?.pushName || undefined;
            let profilePictureUrl: string | undefined = cached?.profilePicture || undefined;

            if (this.activeSessions.has(sessionId)) {
                const client = this.activeSessions.get(sessionId)!;
                try {
                    profilePictureUrl = (await client.getProfilePicture(fullJid)) || profilePictureUrl;
                } catch { /* keep cached */ }
                let nameFromMsg: string | undefined;
                const lastMsg = await this.prisma.message.findFirst({
                    where: { sessionId, sender: fullJid },
                    orderBy: { timestamp: 'desc' },
                    select: { jsonData: true }
                });
                if (lastMsg?.jsonData) {
                    try {
                        const raw = JSON.parse(lastMsg.jsonData) as { pushName?: string };
                        if (raw.pushName) nameFromMsg = raw.pushName;
                    } catch { /* ignore */ }
                }
                if (nameFromMsg) name = nameFromMsg;
                await this.prisma.contact.upsert({
                    where: { sessionId_id: { sessionId, id: fullJid } },
                    create: {
                        id: fullJid,
                        sessionId,
                        name: name || null,
                        pushName: name || null,
                        profilePicture: profilePictureUrl || null
                    },
                    update: {
                        ...(name && { name, pushName: name }),
                        ...(profilePictureUrl && { profilePicture: profilePictureUrl }),
                        updatedAt: new Date()
                    }
                });
            }
            return { name: name || undefined, profilePictureUrl: profilePictureUrl || undefined };
        } catch (err) {
            request.log.error(err);
            return reply.status(500).send({ message: 'Failed to get contact info' });
        }
    }

    /**
     * Retorna nome e foto do grupo. Lê/grava cache no banco e atualiza com dados do WhatsApp.
     */
    async getGroupInfo(request: FastifyRequest<{ Params: { sessionId: string; groupJid: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId, groupJid } = request.params;
        const fullJid = groupJid.includes('@g.us') ? groupJid : `${groupJid}@g.us`;
        try {
            const cached = await this.db.groupProfile.findFirst({
                where: { sessionId, id: fullJid },
                select: { name: true, profilePicture: true, isCommunity: true, linkedParent: true, isCommunityAnnounce: true }
            });
            let name = cached?.name;
            let profilePictureUrl = cached?.profilePicture || undefined;
            let isCommunity = cached?.isCommunity ?? false;
            let linkedParent = cached?.linkedParent ?? null;
            let isCommunityAnnounce = cached?.isCommunityAnnounce ?? false;

            if (this.activeSessions.has(sessionId)) {
                const client = this.activeSessions.get(sessionId)!;
                try {
                    const group = await client.getGroup(fullJid);
                    name = group.name;
                    isCommunity = group.isCommunity;
                    linkedParent = group.linkedParent ?? null;
                    isCommunityAnnounce = group.isCommunityAnnounce ?? false;
                    profilePictureUrl = (await client.getProfilePicture(fullJid)) || profilePictureUrl;
                } catch { /* keep cached */ }
                await this.db.groupProfile.upsert({
                    where: { sessionId_id: { sessionId, id: fullJid } },
                    create: {
                        id: fullJid,
                        sessionId,
                        name: name || null,
                        profilePicture: profilePictureUrl || null,
                        isCommunity,
                        linkedParent: linkedParent || null,
                        isCommunityAnnounce
                    },
                    update: {
                        ...(name != null && { name }),
                        ...(profilePictureUrl != null && { profilePicture: profilePictureUrl }),
                        isCommunity,
                        linkedParent: linkedParent || null,
                        isCommunityAnnounce,
                        updatedAt: new Date()
                    }
                });
            }
            const chatOrigin = groupChatOrigin(linkedParent, isCommunity, isCommunityAnnounce);
            return {
                name: name || undefined,
                profilePictureUrl: profilePictureUrl || undefined,
                isCommunity,
                chatOrigin,
                linkedParent: linkedParent || undefined,
                isCommunityAnnounce
            };
        } catch (err) {
            request.log.error(err);
            return reply.status(500).send({ message: 'Failed to get group info' });
        }
    }
}
