import { FastifyInstance } from 'fastify';
import { SessionController } from '../controllers/SessionController';

export async function sessionRoutes(fastify: FastifyInstance, options: { controller: SessionController }) {
    const { controller } = options;

    fastify.post<{ Params: { sessionId: string } }>('/session/:sessionId/connect', {
        schema: {
            description: 'Inicia a conexão para uma sessão',
            tags: ['Session'],
            params: {
                type: 'object',
                properties: { sessionId: { type: 'string' } }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        message: { type: 'string' },
                        qrUrl: { type: 'string' }
                    }
                }
            }
        }
    }, controller.connect.bind(controller));

    fastify.get('/sessions', {
        schema: {
            description: 'Lista todas as sessões (ativas e inativas)',
            tags: ['Session'],
            querystring: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['active', 'inactive'] },
                    phoneNumber: { type: 'string', description: 'Filtrar por número de telefone (apenas sessões ativas)' }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            sessionId: { type: 'string' },
                            status: { type: 'string' },
                            state: { type: 'string' },
                            user: { type: 'object', additionalProperties: true },
                            phoneNumber: { type: 'string', nullable: true }
                        }
                    }
                }
            }
        }
    }, controller.listSessions.bind(controller));

    fastify.post('/sessions', {
        schema: {
            description: 'Cria uma nova sessão (dispositivo) automaticamente',
            tags: ['Session'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        sessionId: { type: 'string' },
                        message: { type: 'string' },
                        qrUrl: { type: 'string' }
                    }
                }
            }
        }
    }, controller.createSession.bind(controller));

    fastify.get<{ Params: { sessionId: string } }>('/session/:sessionId/status', {
        schema: {
            description: 'Verifica o status da conexão',
            tags: ['Session'],
            params: {
                type: 'object',
                properties: { sessionId: { type: 'string' } }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        state: { type: 'string' },
                        user: { type: 'object', additionalProperties: true }
                    }
                }
            }
        }
    }, controller.getStatus.bind(controller));

    fastify.get<{ Params: { sessionId: string } }>('/session/:sessionId/qr-code', {
        schema: {
            description: 'Retorna QR Code da sessão (HTML)',
            tags: ['Session'],
            params: {
                type: 'object',
                properties: { sessionId: { type: 'string' } }
            }
        }
    }, controller.getQrCode.bind(controller));

    fastify.post<{ Params: { sessionId: string } }>('/session/:sessionId/logout', {
        schema: {
            description: 'Desconecta e limpa os dados da sessão',
            tags: ['Session'],
            params: {
                type: 'object',
                properties: { sessionId: { type: 'string' } }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, controller.logout.bind(controller));

    fastify.delete<{ Params: { sessionId: string } }>('/session/:sessionId', {
        schema: {
            description: 'Remove sessão inativa do banco de dados',
            tags: ['Session'],
            params: {
                type: 'object',
                properties: { sessionId: { type: 'string' } }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, controller.deleteSession.bind(controller));
}
