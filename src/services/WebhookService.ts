import { PrismaClient } from '@prisma/client';
import { WhatsAppClient } from '../core/WhatsAppClient';

export class WebhookService {
    private prisma: PrismaClient;
    private client: WhatsAppClient;
    private sessionId: string;

    constructor(client: WhatsAppClient, prisma: PrismaClient) {
        this.client = client;
        this.prisma = prisma;
        this.sessionId = client.getSessionId(); // Uso do método público

        this.initializeListeners();
    }

    private initializeListeners() {
        // Evento de QR Code
        this.client.on('qr', (qr: string) => this.dispatch('qr', { qr }));

        // Evento de Conexão
        this.client.on('connected', (info: any) => this.dispatch('connection', { status: 'connected', info }));
        this.client.on('disconnected', (reason: any) => this.dispatch('connection', { status: 'disconnected', reason }));

        // Evento de Mensagem
        this.client.on('message', (msg: any) => this.dispatch('message', msg));
    }

    private async dispatch(event: string, payload: any) {
        try {
            // Busca webhooks configurados para este evento e sessão
            // Cast 'as any' para evitar erro enquanto Prisma Client atualiza tipagem
            if (!(this.prisma as any).webhook) return;

            const hooks = await (this.prisma as any).webhook.findMany({
                where: {
                    sessionId: this.sessionId,
                    enabled: true,
                    events: {
                        has: event
                    }
                }
            });

            if (hooks.length === 0) return;

            // Dispara requisições em paralelo (sem await para não bloquear o bot)
            hooks.forEach((hook: any) => {
                this.sendWebhook(hook.url, event, payload).catch(err => {
                    const errorMsg = err instanceof Error ? err.message : String(err);
                    console.warn(`[Webhook Warning] Failed to send '${event}' to '${hook.url}': ${errorMsg}`);
                });
            });

        } catch (error) {
            console.error(`Error dispatching webhook for event ${event}:`, error);
        }
    }

    private async sendWebhook(url: string, event: string, data: any) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Event-Type': event,
                    'X-Session-ID': this.sessionId,
                    'User-Agent': 'WhatsAppModule/1.0'
                },
                body: JSON.stringify({
                    event,
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString(),
                    data
                })
            });

            if (!response.ok) {
                console.warn(`Webhook ${url} returned ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            // Erros de rede
            throw error;
        }
    }
}
