import { FastifyReply, FastifyRequest } from 'fastify';
import { WhatsAppClient } from '../../core/WhatsAppClient';
import { ConnectionState } from '../../types';
import { PrismaClient } from '@prisma/client';

export class MessageController {
    constructor(
        private activeSessions: Map<string, WhatsAppClient>,
        private prisma: PrismaClient
    ) { }

    private getUserId(request: FastifyRequest): string | null {
        return (request as any).user?.id ?? null;
    }

    private async userOwnsSession(sessionId: string, userId: string): Promise<boolean> {
        const row = await (this.prisma as any).userSession.findFirst({ where: { sessionId, userId } });
        return !!row;
    }

    async sendText(request: FastifyRequest<{ Params: { sessionId: string }, Body: { to: string, message: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId } = request.params;
        const { to, message } = request.body;

        if (!this.activeSessions.has(sessionId)) {
            reply.code(404);
            throw new Error('Session not active. Connect first.');
        }

        const client = this.activeSessions.get(sessionId)!;

        if (client.getConnectionState() !== ConnectionState.CONNECTED) {
            reply.code(400);
            throw new Error('Session not connected');
        }

        let jid = to;
        if (!jid.includes('@')) {
            jid = `${jid}@s.whatsapp.net`;
        }

        const result = await client.sendText({ to: jid, text: message });
        return { success: true, messageId: result.messageId };
    }

    async sendMedia(request: FastifyRequest<{
        Params: { sessionId: string };
        Body: { to: string; caption?: string; fileBase64: string; filename?: string; mimetype?: string };
    }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId } = request.params;
        const { to, caption, fileBase64, filename, mimetype } = request.body;

        if (!this.activeSessions.has(sessionId)) {
            reply.code(404);
            throw new Error('Session not active. Connect first.');
        }

        const client = this.activeSessions.get(sessionId)!;
        if (client.getConnectionState() !== ConnectionState.CONNECTED) {
            reply.code(400);
            throw new Error('Session not connected');
        }

        let jid = to;
        if (!jid.includes('@')) jid = `${jid}@s.whatsapp.net`;

        const mediaBuffer = Buffer.from(fileBase64, 'base64');
        const type = this.inferMediaType(mimetype);
        const result = await client.sendMedia({
            to: jid,
            media: mediaBuffer,
            type,
            caption: caption || undefined,
            filename: filename || undefined,
            mimetype: mimetype || undefined
        });
        return { success: true, messageId: result.messageId };
    }

    private inferMediaType(mimetype?: string): 'image' | 'video' | 'audio' | 'document' {
        if (!mimetype) return 'document';
        const m = mimetype.toLowerCase();
        if (m.startsWith('image/')) return 'image';
        if (m.startsWith('video/')) return 'video';
        if (m.startsWith('audio/')) return 'audio';
        return 'document';
    }

    async getMessages(request: FastifyRequest<{ Params: { sessionId: string }, Querystring: { limit?: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId } = request.params;
        const limit = parseInt(request.query.limit || '50');

        const messages = await this.prisma.message.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'desc' },
            take: limit
        });

        return messages.map(msg => ({
            id: msg.id,
            chatId: msg.chatId,
            sender: msg.sender,
            fromMe: msg.fromMe,
            timestamp: msg.timestamp,
            type: msg.type,
            body: msg.body
        }));
    }
}
