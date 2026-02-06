import Fastify, { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { PrismaStorageAdapter } from '../storage/PrismaStorageAdapter';
import { WhatsAppClient } from '../core/WhatsAppClient';
import { ConnectionState } from '../types';
import * as QRCode from 'qrcode';
import { WebhookService } from '../services/WebhookService';

const prisma = new PrismaClient();
const activeSessions = new Map<string, WhatsAppClient>();

// Helper para obter/criar sessão
const getSession = (sessionId: string, server: FastifyInstance, enableTerminalQr: boolean = false): WhatsAppClient => {
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
            terminal: false
        },
        messages: {
            syncFullHistory: false
        }
    });

    // Inicializa Serviço de Webhooks
    new WebhookService(client, prisma);

    // Listeners padrão com tipagem explícita
    client.on('qr', async (qr: string) => {
        (client as any).lastQr = qr;

        server.log.info({ sessionId }, 'QR Code received (Scan required)');

        if (enableTerminalQr) {
            try {
                const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
                process.stdout.write('\n\n');
                process.stdout.write('==================================================\n');
                process.stdout.write(`SESSION: ${sessionId} - SCAN THIS QR CODE:\n`);
                process.stdout.write('==================================================\n\n');
                process.stdout.write(qrString);
                process.stdout.write('\n\n==================================================\n\n');
            } catch (err) {
                server.log.error({ err }, 'Failed to render QR Code in terminal');
            }
        }
    });

    client.on('connected', (info: any) => {
        (client as any).lastQr = null;
        server.log.info({ sessionId, user: info.name }, 'Session connected successfully');
    });

    client.on('disconnected', (reason: any) => {
        server.log.info({ sessionId, reason }, 'Session disconnected');
    });

    client.on('message', (_msg: any) => {
        // server.log.debug({ sessionId, msgId: msg.messages?.[0]?.key?.id }, 'Message received');
    });

    activeSessions.set(sessionId, client);
    return client;
};

const start = async () => {
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

    await server.register(swagger, {
        openapi: {
            info: {
                title: 'WhatsApp Module API',
                description: 'API para gerenciamento de clientes WhatsApp',
                version: '1.1.0',
            },
            servers: [{ url: 'http://localhost:3000' }],
            tags: [
                { name: 'Session', description: 'Gerenciamento de sessões e conexão' },
                { name: 'Messages', description: 'Envio e recebimento de mensagens' },
                { name: 'Webhooks', description: 'Gerenciamento de notificações externas' },
                { name: 'System', description: 'Status do sistema' }
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

    // Rota Health/Ping
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

    // Rota QR Code HTML
    server.get<{ Params: { sessionId: string } }>('/session/:sessionId/qr-code', {
        schema: {
            description: 'Visualiza o QR Code atual para leitura no navegador',
            tags: ['Session'],
            params: {
                type: 'object',
                properties: { sessionId: { type: 'string' } }
            }
        }
    }, async (request, reply) => {
        const { sessionId } = request.params;

        if (!activeSessions.has(sessionId)) {
            return `Session '${sessionId}' not active. Please connect first.`;
        }

        const client = activeSessions.get(sessionId)!;
        const qr = (client as any).lastQr;

        if (!qr) {
            const state = client.getConnectionState();
            return `No QR Code available. Current State: ${state}`;
        }

        try {
            const qrImage = await QRCode.toDataURL(qr);
            reply.type('text/html');
            return `
                <html>
                    <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;flex-direction:column;font-family:sans-serif;">
                        <h1>Scan this QR Code</h1>
                        <img src="${qrImage}" style="border:10px solid white; border-radius:10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 300px; height: 300px;" />
                        <p>Session: <strong>${sessionId}</strong></p>
                        <script>setTimeout(() => location.reload(), 3000);</script>
                    </body>
                </html>
            `;
        } catch (e) {
            return 'Error generating QR image';
        }
    });

    // Endpoint Connect
    server.post<{ Params: { sessionId: string } }>('/session/:sessionId/connect', {
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
    }, async (request, _reply) => { // _reply unused
        const { sessionId } = request.params;
        const client = getSession(sessionId, server, true);

        client.connect().catch(err => server.log.error(err));

        return {
            status: 'connecting',
            message: 'Process started.',
            qrUrl: `http://localhost:3000/session/${sessionId}/qr-code`
        };
    });

    // Endpoint Status
    server.get<{ Params: { sessionId: string } }>('/session/:sessionId/status', {
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
    }, async (request, _reply) => { // _reply unused
        const { sessionId } = request.params;

        if (!activeSessions.has(sessionId)) {
            return { status: 'inactive', state: 'disconnected', user: null };
        }

        const client = activeSessions.get(sessionId)!;
        const state = client.getConnectionState();
        const socket = (client as any).getSocket();

        return { status: 'active', state, user: socket?.user || null };
    });

    // Endpoint Send Message
    server.post<{ Params: { sessionId: string }, Body: { to: string, message: string } }>('/session/:sessionId/message/text', {
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
    }, async (request, reply) => {
        const { sessionId } = request.params;
        const { to, message } = request.body;

        if (!activeSessions.has(sessionId)) {
            reply.code(404);
            throw new Error('Session not active. Connect first.');
        }

        const client = activeSessions.get(sessionId)!;

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
    });

    // ---------------------------------------------------------
    // WEBHOOKS ROUTES
    // ---------------------------------------------------------

    server.post<{ Params: { sessionId: string }, Body: { url: string, events: string[] } }>('/session/:sessionId/webhooks', {
        schema: {
            description: 'Registra um novo webhook',
            tags: ['Webhooks'],
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
    }, async (request, _reply) => { // _reply unused
        const { sessionId } = request.params;
        const { url, events } = request.body;

        const webhook = await (prisma as any).webhook.create({
            data: {
                sessionId,
                url,
                events
            }
        });

        return webhook;
    });

    server.get<{ Params: { sessionId: string } }>('/session/:sessionId/webhooks', {
        schema: {
            description: 'Lista webhooks registrados para a sessão',
            tags: ['Webhooks'],
            params: {
                type: 'object',
                properties: { sessionId: { type: 'string' } }
            }
        }
    }, async (request, _reply) => { // _reply unused
        const { sessionId } = request.params;
        const webhooks = await (prisma as any).webhook.findMany({
            where: { sessionId }
        });
        return webhooks;
    });

    server.delete<{ Params: { sessionId: string, webhookId: string } }>('/session/:sessionId/webhooks/:webhookId', {
        schema: {
            description: 'Remove um webhook',
            tags: ['Webhooks'],
            params: {
                type: 'object',
                properties: {
                    sessionId: { type: 'string' },
                    webhookId: { type: 'string' }
                }
            }
        }
    }, async (request, _reply) => { // _reply unused
        const { sessionId, webhookId } = request.params;

        await (prisma as any).webhook.deleteMany({
            where: {
                id: webhookId,
                sessionId
            }
        });

        return { success: true };
    });

    // Start Server
    try {
        await server.ready();
        await server.listen({ port: 3000, host: '0.0.0.0' });

        console.log('\n==================================================');
        console.log('SERVER RUNNING - v1.1.0');
        console.log('==================================================');
        console.log('API Address: http://localhost:3000');
        console.log('Swagger UI:  http://localhost:3000/docs');
        console.log('==================================================\n');

        const DEFAULT_SESSION = process.env.DEFAULT_SESSION_ID || 'main-session';
        console.log(`🚀 Initializing default session: "${DEFAULT_SESSION}"...\n`);

        const client = getSession(DEFAULT_SESSION, server, true);
        await client.connect();

    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
