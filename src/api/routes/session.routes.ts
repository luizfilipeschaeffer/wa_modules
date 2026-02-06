import { FastifyInstance } from 'fastify';
import { SessionController } from '../controllers/SessionController';

export async function sessionRoutes(fastify: FastifyInstance, options: { controller: SessionController; authHook: (req: any, reply: any) => Promise<void> }) {
    const { controller, authHook } = options;

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

    // Protected Routes - JWT ou Token de API (validado no banco)
    fastify.register(async (protectedRoutes) => {
        protectedRoutes.addHook('onRequest', authHook);

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

        protectedRoutes.get<{ Params: { sessionId: string }; Querystring: { jids?: string } }>('/session/:sessionId/profiles', {
            schema: {
                description: 'Retorna perfis em cache (nome/foto) para vários JIDs. Não exige sessão ativa.',
                tags: ['Session'],
                security: [{ bearerAuth: [] }],
                params: { type: 'object', properties: { sessionId: { type: 'string' } } },
                querystring: {
                    type: 'object',
                    properties: { jids: { type: 'string', description: 'JIDs separados por vírgula' } }
                },
                response: { 200: { type: 'object', additionalProperties: true } }
            }
        }, controller.getBulkProfiles.bind(controller));

        protectedRoutes.get<{ Params: { sessionId: string; jid: string } }>('/session/:sessionId/contact/:jid', {
            schema: {
                description: 'Retorna nome e foto de perfil do contato (1:1)',
                tags: ['Session'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        sessionId: { type: 'string' },
                        jid: { type: 'string', description: 'JID do contato (ex: 5511999999999 ou 5511999999999@s.whatsapp.net)' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', nullable: true },
                            profilePictureUrl: { type: 'string', nullable: true }
                        }
                    }
                }
            }
        }, controller.getContactInfo.bind(controller));

        protectedRoutes.get<{ Params: { sessionId: string; groupJid: string } }>('/session/:sessionId/group/:groupJid', {
            schema: {
                description: 'Retorna nome e foto do grupo',
                tags: ['Session'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        sessionId: { type: 'string' },
                        groupJid: { type: 'string', description: 'JID do grupo (ex: 120363xxx@g.us)' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            profilePictureUrl: { type: 'string', nullable: true }
                        }
                    }
                }
            }
        }, controller.getGroupInfo.bind(controller));
    });
}
