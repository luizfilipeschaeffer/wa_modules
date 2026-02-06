import { FastifyReply, FastifyRequest } from 'fastify';
import { WhatsAppClient } from '../../core/WhatsAppClient';
import { ConnectionState } from '../../types';
import { PrismaClient } from '@prisma/client';

export class MessageController {
    constructor(
        private activeSessions: Map<string, WhatsAppClient>,
        private prisma: PrismaClient
    ) { }

    async sendText(request: FastifyRequest<{ Params: { sessionId: string }, Body: { to: string, message: string } }>, reply: FastifyReply) {
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

    async getMessages(request: FastifyRequest<{ Params: { sessionId: string }, Querystring: { limit?: string } }>, _reply: FastifyReply) {
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
