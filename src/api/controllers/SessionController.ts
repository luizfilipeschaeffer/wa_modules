import { FastifyReply, FastifyRequest } from 'fastify';
import { WhatsAppClient } from '../../core/WhatsAppClient';
import * as QRCode from 'qrcode';

import { PrismaClient } from '@prisma/client';

import { v4 as uuidv4 } from 'uuid';

export class SessionController {
    constructor(
        private activeSessions: Map<string, WhatsAppClient>,
        private getSessionFn: (sessionId: string) => WhatsAppClient,
        private prisma: PrismaClient
    ) { }

    async createSession(request: FastifyRequest, _reply: FastifyReply) {
        const sessionId = uuidv4();
        const client = this.getSessionFn(sessionId);

        client.connect().catch(err => request.log.error(err));

        return {
            status: 'created',
            sessionId,
            message: 'Session created and process started.',
            qrUrl: `http://localhost:3000/session/${sessionId}/qr-code`
        };
    }

    async listSessions(request: FastifyRequest<{ Querystring: { status?: string, phoneNumber?: string } }>, _reply: FastifyReply) {
        const { status, phoneNumber } = request.query;

        // 1. Get active sessions from memory
        const sessions = [];
        const activeIds = new Set(this.activeSessions.keys());

        for (const [id, client] of this.activeSessions.entries()) {
            const user = client.getUser();
            // user.id usually looks like "5511999999999:0@s.whatsapp.net" or similar
            const userPhone = user?.id ? user.id.split(':')[0] : null;

            sessions.push({
                sessionId: id,
                status: 'active',
                state: client.getConnectionState(),
                user: user,
                phoneNumber: userPhone
            });
        }

        // 2. Get persisted sessions from DB (that are not active)
        const dbSessions = await this.prisma.session.findMany({
            where: {
                sessionId: { notIn: Array.from(activeIds) }
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

        // Filter if requested
        let result = sessions;

        if (status) {
            result = result.filter(s => s.status === status);
        }

        if (phoneNumber) {
            // Simple includes check for flexibility
            result = result.filter(s => s.phoneNumber && s.phoneNumber.includes(phoneNumber));
        }

        return result;
    }

    async connect(request: FastifyRequest<{ Params: { sessionId: string } }>, _reply: FastifyReply) {
        const { sessionId } = request.params;
        const client = this.getSessionFn(sessionId);

        client.connect().catch(err => request.log.error(err));

        return {
            status: 'connecting',
            message: 'Process started.',
            qrUrl: `http://localhost:3000/session/${sessionId}/qr-code`
        };
    }

    async getStatus(request: FastifyRequest<{ Params: { sessionId: string } }>, _reply: FastifyReply) {
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
        const { sessionId } = request.params;

        if (!this.activeSessions.has(sessionId)) {
            // Se não está ativo na memória, tenta remover do banco direto via storage logout? 
            // Mas o controller não tem acesso direto ao storage aqui facilmente sem instanciar novo cliente.
            // Por simplicidade, assumimos que precisa estar carregado ou o usuário deve reiniciar.
            // ALTERNATIVA: Instanciar um cliente temporário para fazer logout?

            // Vamos apenas retornar erro por enquanto, pedindo para conectar primeiro (o connect carrega a sessão)
            return reply.status(404).send({ message: `Session '${sessionId}' not active. Call /connect first to load it, then logout.` });
        }

        const client = this.activeSessions.get(sessionId)!;
        await client.disconnect(true); // true = logout & clear storage
        this.activeSessions.delete(sessionId);

        return { success: true, message: 'Session logged out and data cleared.' };
    }

    async deleteSession(request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) {
        const { sessionId } = request.params;

        // Check if session is active
        if (this.activeSessions.has(sessionId)) {
            reply.code(400);
            throw new Error('Cannot delete active session. Logout first.');
        }

        // Delete all session data from database
        await this.prisma.session.deleteMany({
            where: { sessionId }
        });

        await this.prisma.message.deleteMany({
            where: { sessionId }
        });

        await this.prisma.contact.deleteMany({
            where: { sessionId }
        });

        return { status: 'deleted', message: 'Session data removed from database.' };
    }
}
