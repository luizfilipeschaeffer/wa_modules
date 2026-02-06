import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

export class WebhookController {
    constructor(private prisma: PrismaClient) { }

    async register(request: FastifyRequest<{ Params: { sessionId: string }, Body: { url: string, events: string[] } }>, _reply: FastifyReply) {
        const { sessionId } = request.params;
        const { url, events } = request.body;

        // Validar eventos aqui ou deixar para o serviço.
        // Assumindo que PrismaClient está disponível e configurado

        const webhook = await (this.prisma as any).webhook.create({
            data: {
                sessionId,
                url,
                events
            }
        });

        return webhook;
    }

    async list(request: FastifyRequest<{ Params: { sessionId: string } }>, _reply: FastifyReply) {
        const { sessionId } = request.params;
        const webhooks = await (this.prisma as any).webhook.findMany({
            where: { sessionId }
        });
        return webhooks;
    }

    async delete(request: FastifyRequest<{ Params: { sessionId: string, webhookId: string } }>, _reply: FastifyReply) {
        const { sessionId, webhookId } = request.params;

        await (this.prisma as any).webhook.deleteMany({
            where: {
                id: webhookId,
                sessionId
            }
        });

        return { success: true };
    }
}
