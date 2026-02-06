import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

export class WebhookController {
    constructor(private prisma: PrismaClient) { }

    private getUserId(request: FastifyRequest): string | null {
        return (request as any).user?.id ?? null;
    }

    private async userOwnsSession(sessionId: string, userId: string): Promise<boolean> {
        const row = await (this.prisma as any).userSession.findFirst({ where: { sessionId, userId } });
        return !!row;
    }

    async register(request: FastifyRequest<{ Params: { sessionId: string }, Body: { url: string, events: string[] } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId } = request.params;
        const { url, events } = request.body;

        const webhook = await (this.prisma as any).webhook.create({
            data: {
                sessionId,
                url,
                events
            }
        });

        return webhook;
    }

    async list(request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
        const { sessionId } = request.params;
        const webhooks = await (this.prisma as any).webhook.findMany({
            where: { sessionId }
        });
        return webhooks;
    }

    async delete(request: FastifyRequest<{ Params: { sessionId: string, webhookId: string } }>, reply: FastifyReply) {
        const userId = this.getUserId(request);
        if (!userId || !(await this.userOwnsSession(request.params.sessionId, userId))) {
            return reply.status(userId ? 403 : 401).send({ message: userId ? 'Session does not belong to you' : 'Unauthorized' });
        }
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
