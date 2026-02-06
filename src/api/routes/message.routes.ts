import { FastifyInstance } from 'fastify';
import { MessageController } from '../controllers/MessageController';

export async function messageRoutes(fastify: FastifyInstance, options: { controller: MessageController }) {
    const { controller } = options;

    fastify.post<{ Params: { sessionId: string }, Body: { to: string, message: string } }>('/session/:sessionId/message/text', {
        schema: {
            description: 'Envia uma mensagem de texto',
            tags: ['Messages'],
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

    fastify.get<{ Params: { sessionId: string }, Querystring: { limit?: string } }>('/session/:sessionId/messages', {
        schema: {
            description: 'Lista mensagens recebidas de uma sessão',
            tags: ['Messages'],
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
}
