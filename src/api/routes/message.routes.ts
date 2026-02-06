import { FastifyInstance } from 'fastify';
import { MessageController } from '../controllers/MessageController';

export async function messageRoutes(fastify: FastifyInstance, options: { controller: MessageController; authHook: (req: any, reply: any) => Promise<void> }) {
    const { controller, authHook } = options;

    // Protected Routes - JWT ou Token de API (validado no banco)
    fastify.register(async (protectedRoutes) => {
        protectedRoutes.addHook('onRequest', authHook);

        protectedRoutes.post<{ Params: { sessionId: string }, Body: { to: string, message: string } }>('/session/:sessionId/message/text', {
            schema: {
                description: 'Envia uma mensagem de texto',
                tags: ['Messages'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: { sessionId: { type: 'string' } }
                },
                body: {
                    type: 'object',
                    required: ['to', 'message'],
                    properties: {
                        to: { type: 'string', description: 'Número do destinatário' },
                        message: { type: 'string', description: 'Conteúdo da mensagem' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            messageId: { type: 'string' }
                        }
                    }
                }
            }
        }, controller.sendText.bind(controller));

        protectedRoutes.post<{
            Params: { sessionId: string };
            Body: { to: string; caption?: string; fileBase64: string; filename?: string; mimetype?: string };
        }>('/session/:sessionId/message/media', {
            schema: {
                description: 'Envia mensagem com arquivo em anexo (imagem, vídeo, áudio ou documento)',
                tags: ['Messages'],
                security: [{ bearerAuth: [] }],
                params: { type: 'object', properties: { sessionId: { type: 'string' } } },
                body: {
                    type: 'object',
                    required: ['to', 'fileBase64'],
                    properties: {
                        to: { type: 'string', description: 'Número do destinatário' },
                        caption: { type: 'string', description: 'Legenda (opcional)' },
                        fileBase64: { type: 'string', description: 'Arquivo em Base64' },
                        filename: { type: 'string', description: 'Nome do arquivo (recomendado para documento)' },
                        mimetype: { type: 'string', description: 'Ex: image/jpeg, application/pdf' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: { success: { type: 'boolean' }, messageId: { type: 'string' } }
                    }
                }
            }
        }, controller.sendMedia.bind(controller));

        protectedRoutes.get<{ Params: { sessionId: string }, Querystring: { limit?: string } }>('/session/:sessionId/messages', {
            schema: {
                description: 'Lista mensagens recebidas de uma sessão',
                tags: ['Messages'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: { sessionId: { type: 'string' } }
                },
                querystring: {
                    type: 'object',
                    properties: {
                        limit: { type: 'string', description: 'Número máximo de mensagens (padrão: 50)' }
                    }
                }
            }
        }, controller.getMessages.bind(controller));
    });
}
