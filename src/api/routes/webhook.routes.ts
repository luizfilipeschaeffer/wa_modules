import { FastifyInstance } from 'fastify';
import { WebhookController } from '../controllers/WebhookController';

export async function webhookRoutes(fastify: FastifyInstance, options: { controller: WebhookController; authHook: (req: any, reply: any) => Promise<void> }) {
    const { controller, authHook } = options;

    // Protected Routes - JWT ou Token de API (validado no banco)
    fastify.register(async (protectedRoutes) => {
        protectedRoutes.addHook('onRequest', authHook);

        protectedRoutes.post<{ Params: { sessionId: string }, Body: { url: string, events: string[] } }>('/session/:sessionId/webhooks', {
            schema: {
                description: 'Registra um novo webhook',
                tags: ['Webhooks'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: { sessionId: { type: 'string' } }
                },
                body: {
                    type: 'object',
                    required: ['url', 'events'],
                    properties: {
                        url: { type: 'string', format: 'uri' },
                        events: {
                            type: 'array',
                            items: { type: 'string', enum: ['message', 'connection', 'qr'] },
                            description: 'Eventos para ouvir'
                        }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            url: { type: 'string' },
                            events: { type: 'array', items: { type: 'string' } }
                        }
                    }
                }
            }
        }, controller.register.bind(controller));

        protectedRoutes.get<{ Params: { sessionId: string } }>('/session/:sessionId/webhooks', {
            schema: {
                description: 'Lista webhooks registrados para a sessão',
                tags: ['Webhooks'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: { sessionId: { type: 'string' } }
                }
            }
        }, controller.list.bind(controller));

        protectedRoutes.delete<{ Params: { sessionId: string, webhookId: string } }>('/session/:sessionId/webhooks/:webhookId', {
            schema: {
                description: 'Remove um webhook',
                tags: ['Webhooks'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        sessionId: { type: 'string' },
                        webhookId: { type: 'string' }
                    }
                }
            }
        }, controller.delete.bind(controller));
    });
}
