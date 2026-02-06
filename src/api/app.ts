import Fastify, { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { WhatsAppClient } from '../core/WhatsAppClient';
import { PrismaStorageAdapter } from '../storage/PrismaStorageAdapter';
import { WebhookService } from '../services/WebhookService';
import { SessionController } from './controllers/SessionController';
import { MessageController } from './controllers/MessageController';
import { WebhookController } from './controllers/WebhookController';
import { AuthController } from './controllers/AuthController';
import { UserController } from './controllers/UserController';
import { createAuthHook } from './authHook';
import { sessionRoutes } from './routes/session.routes';
import { messageRoutes } from './routes/message.routes';
import { webhookRoutes } from './routes/webhook.routes';
import { authRoutes } from './routes/auth.routes';

export const buildApp = async (): Promise<FastifyInstance> => {
    const server = Fastify({
        logger: {
            level: 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    ignore: 'pid,hostname',
                    translateTime: 'HH:MM:ss Z',
                }
            }
        }
    });

    await server.register(cors);

    // JWT Auth
    await server.register(jwt, {
        secret: process.env.JWT_SECRET || 'supersecret'
    });

    // Static Files (Frontend)
    await server.register(fastifyStatic, {
        root: path.join(__dirname, '../../public'),
        prefix: '/', // Serve static files from root
    });

    // Swagger (Auth Security Definition)
    await server.register(swagger, {
        openapi: {
            info: {
                title: 'WhatsApp Module API',
                description: 'API para gerenciamento de clientes WhatsApp',
                version: '1.2.0',
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            },
            servers: [{ url: 'http://localhost:3000' }],
            tags: [
                { name: 'Session', description: 'Gerenciamento de sessões e conexão' },
                { name: 'Messages', description: 'Envio e recebimento de mensagens' },
                { name: 'Webhooks', description: 'Gerenciamento de notificações externas' },
                { name: 'System', description: 'Status do sistema' },
                { name: 'Auth', description: 'Autenticação' },
                { name: 'Users', description: 'Gerenciamento de usuários' }
            ]
        }
    });

    await server.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false
        },
        staticCSP: true,
        transformStaticCSP: (header) => header
    });

    // Dependency Injection Setup
    const prisma = new PrismaClient();
    const activeSessions = new Map<string, WhatsAppClient>();

    const getSession = (sessionId: string, enableTerminalQr: boolean = false): WhatsAppClient => {
        if (activeSessions.has(sessionId)) {
            return activeSessions.get(sessionId)!;
        }

        const storage = new PrismaStorageAdapter(prisma);
        const client = new WhatsAppClient({
            sessionId,
            storage,
            connection: {
                retries: 5,
                retryInterval: 3000
            },
            qrcode: {
                terminal: enableTerminalQr
            },
            messages: {
                syncFullHistory: false
            }
        });

        // Inicializa Serviço de Webhooks
        new WebhookService(client, prisma);

        // Listeners padrão com tipagem explícita
        client.on('qr', async (qr: string) => {
            server.log.info({ sessionId }, 'QR Code received (Scan required)');
            
            // Se terminal QR está habilitado, exibe no console
            if (enableTerminalQr) {
                const qrcodeTerminal = require('qrcode-terminal');
                console.log('\n' + '='.repeat(50));
                console.log(`📱 QR CODE for session: ${sessionId}`);
                console.log('='.repeat(50));
                qrcodeTerminal.generate(qr, { small: true });
                console.log('='.repeat(50));
                console.log('Scan this QR code with WhatsApp to connect');
                console.log('='.repeat(50) + '\n');
            }
        });

        client.on('connected', (info: any) => {
            server.log.info({ sessionId, user: info.name }, 'Session connected successfully');
        });

        client.on('disconnected', (reason: any) => {
            server.log.info({ sessionId, reason }, 'Session disconnected');
        });

        activeSessions.set(sessionId, client);
        return client;
    };

    // Instantiate Controllers
    const sessionController = new SessionController(activeSessions, (sid) => getSession(sid, true), prisma);
    const messageController = new MessageController(activeSessions, prisma);
    const webhookController = new WebhookController(prisma);
    const authController = new AuthController(prisma);
    const userController = new UserController(prisma);

    const authHook = createAuthHook(prisma);

    // Register Routes
    await server.register(sessionRoutes, { controller: sessionController, authHook });
    await server.register(messageRoutes, { controller: messageController, authHook });
    await server.register(webhookRoutes, { controller: webhookController, authHook });
    await server.register(authRoutes, { authController, userController, authHook });

    // Health Check
    server.get('/health', {
        schema: {
            description: 'Verifica saúde da API',
            tags: ['System'],
            response: {
                200: {
                    type: 'object',
                    properties: { status: { type: 'string' } }
                }
            }
        }
    }, async () => {
        return { status: 'ok' };
    });

    // Default session init logic
    server.decorate('initDefaultSession', async (sessionId: string) => {
        const client = getSession(sessionId, true);
        await client.connect();
    });

    /**
     * Restaura sessões que pertencem a algum usuário (UserSession) e possuem credenciais no banco.
     */
    server.decorate('restoreSessions', async () => {
        try {
            const ownedRows = await (prisma as any).userSession.findMany({
                select: { sessionId: true },
                distinct: ['sessionId']
            });
            const ownedSessionIds = new Set<string>(ownedRows.map((r: { sessionId: string }) => r.sessionId));
            if (ownedSessionIds.size === 0) {
                server.log.info('No user sessions to restore');
                return;
            }
            const toRestoreIds = Array.from(ownedSessionIds) as string[];
            const withCreds = await prisma.session.findMany({
                where: {
                    sessionId: { in: toRestoreIds },
                    type: 'creds',
                    id: 'default'
                },
                select: { sessionId: true }
            });
            const sessionIds = [...new Set(withCreds.map((r) => r.sessionId))];
            if (sessionIds.length === 0) {
                server.log.info('No persisted sessions with credentials to restore');
                return;
            }
            server.log.info({ count: sessionIds.length, sessionIds }, 'Restoring WhatsApp sessions...');
            const results = await Promise.allSettled(
                sessionIds.map(async (sessionId) => {
                    const client = getSession(sessionId, false);
                    await client.connect();
                    server.log.info({ sessionId }, 'Session restored');
                })
            );
            results.forEach((r, i) => {
                if (r.status === 'rejected') {
                    server.log.warn({ sessionId: sessionIds[i], err: r.reason }, 'Session restore failed');
                }
            });
        } catch (err) {
            server.log.error({ err }, 'Error restoring sessions');
        }
    });

    return server;
};
