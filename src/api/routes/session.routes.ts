import { FastifyInstance } from 'fastify';
import { SessionController } from '../controllers/SessionController';

export async function sessionRoutes(fastify: FastifyInstance, options: { controller: SessionController }) {
    const { controller } = options;

    // Public endpoint - QR Code (needs to be accessible from browser without auth header)
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

    // Protected Routes - Require JWT Authentication
    fastify.register(async (protectedRoutes) => {
        protectedRoutes.addHook('onRequest', async (request, reply) => {
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.send(err);
            }
        });

        protectedRoutes.post<{ Params: { sessionId: string } }>('/session/:sessionId/connect', {
            schema: {
                description: 'Inicia a conexão para uma sessão',
                tags: ['Session'],
                security: [{ bearerAuth: [] }],
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

        protectedRoutes.get('/sessions', {
            schema: {
                description: 'Lista todas as sessões (ativas e inativas)',
                tags: ['Session'],
                security: [{ bearerAuth: [] }],
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

        protectedRoutes.post('/sessions', {
            schema: {
                description: 'Cria uma nova sessão (dispositivo) automaticamente',
                tags: ['Session'],
                security: [{ bearerAuth: [] }],
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

        protectedRoutes.get<{ Params: { sessionId: string } }>('/session/:sessionId/status', {
            schema: {
                description: 'Verifica o status da conexão',
                tags: ['Session'],
                security: [{ bearerAuth: [] }],
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

        protectedRoutes.post<{ Params: { sessionId: string } }>('/session/:sessionId/logout', {
            schema: {
                description: 'Desconecta e limpa os dados da sessão',
                tags: ['Session'],
                security: [{ bearerAuth: [] }],
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

        protectedRoutes.delete<{ Params: { sessionId: string } }>('/session/:sessionId', {
            schema: {
                description: 'Remove sessão inativa do banco de dados',
                tags: ['Session'],
                security: [{ bearerAuth: [] }],
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
    });
}
