import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    WASocket,
    ConnectionState as BaileysConnectionState,
    UserFacingSocketConfig,
} from 'libzapitu-rf';
import { Boom } from '@hapi/boom';
import { WhatsAppConfig, ConnectionState, SessionInfo, ILogger } from '../types';
import { SessionManager } from './SessionManager';
import { WhatsAppClient } from './WhatsAppClient'; // Para emitir eventos


export class ConnectionHandler {
    private socket: WASocket | null = null;
    private config: WhatsAppConfig;
    private logger: ILogger;
    private sessionManager: SessionManager;
    private client: WhatsAppClient;
    private reconnectAttempts: number = 0;
    private isConnecting: boolean = false;
    private shouldReconnect: boolean = true;

    constructor(client: WhatsAppClient, config: WhatsAppConfig, sessionManager: SessionManager, logger: ILogger) {
        this.client = client;
        this.config = config;
        this.sessionManager = sessionManager;
        this.logger = logger;
    }

    /**
     * Inicia a conexão com o WhatsApp
     */
    async connect(): Promise<{ success: boolean; qr?: string }> {
        if (this.isConnecting) return { success: false };
        this.isConnecting = true;
        this.shouldReconnect = true;

        try {
            const { state, saveCreds } = await this.sessionManager.getAuthState();
            const { version, isLatest } = await fetchLatestBaileysVersion();

            this.logger.info(`Using WA version v${version.join('.')}, isLatest: ${isLatest}`);

            // Configuração do Socket
            const socketConfig: UserFacingSocketConfig = {
                version,
                logger: this.logger as any, // Pino logger compatible
                printQRInTerminal: this.config.qrcode?.terminal || false,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, this.logger as any),
                },
                browser: [
                    this.config.browser?.name || 'WA-Module',
                    this.config.browser?.name || 'Chrome',
                    this.config.browser?.version || '1.0.0'
                ],
                generateHighQualityLinkPreview: true,
                // Outras configurações podem ser adicionadas aqui
            };

            // Se houver proxy
            if (this.config.connection?.proxy) {
                // TODO: Implementar agente de proxy se necessário
            }

            this.socket = makeWASocket(socketConfig);

            // Listener para salvar credenciais
            this.socket.ev.on('creds.update', saveCreds);

            // Handler de conexão
            this.socket.ev.on('connection.update', (update: Partial<BaileysConnectionState>) => this.handleConnectionUpdate(update));

            // Handler de mensagens
            this.socket.ev.on('messages.upsert', async (m: any) => {
                if (m.type === 'notify' || m.type === 'append') {
                    // Persistência
                    if (this.config.storage.saveMessage) {
                        for (const msg of m.messages) {
                            try {
                                if (msg.key.remoteJid === 'status@broadcast') continue;
                                await this.config.storage.saveMessage(this.config.sessionId, msg);
                            } catch (e) {
                                this.logger.error('Failed to save message', e);
                            }
                        }
                    }
                    this.client.emit('message', m);
                }
            });

            return new Promise((resolve) => {
                // Resolvemos a promise inicial quando tivermos QR ou conexão
                // Os eventos continuarão sendo emitidos
                const listener = (update: Partial<BaileysConnectionState>) => {
                    const { connection, qr } = update;

                    if (qr) {
                        resolve({ success: false, qr });
                        this.socket?.ev.off('connection.update', listener);
                    }

                    if (connection === 'open') {
                        resolve({ success: true });
                        this.socket?.ev.off('connection.update', listener);
                    }
                };

                this.socket?.ev.on('connection.update', listener);
            });

        } catch (error) {
            this.logger.error('Error connecting to WhatsApp', error);
            this.isConnecting = false;
            throw error;
        }
    }

    /**
     * Trata atualizações de conexão do Baileys
     */
    private async handleConnectionUpdate(update: Partial<BaileysConnectionState>) {
        const { connection, lastDisconnect, qr } = update;

        // Emite evento de QR Code
        if (qr) {
            this.client.emit('qr', qr);
        }

        // Conexão fechada
        if (connection === 'close') {
            const reason = (lastDisconnect?.error as Boom)?.output?.statusCode || 0;
            const shouldReconnect = this.shouldReconnect && reason !== DisconnectReason.loggedOut;

            this.logger.warn(`Connection closed. Reason: ${reason}. Reconnecting: ${shouldReconnect}`);

            this.client.emit('disconnected', {
                code: reason,
                message: 'Connection closed',
                logout: reason === DisconnectReason.loggedOut
            });

            // Limpa referência do socket
            this.socket = null;
            this.isConnecting = false;

            if (shouldReconnect) {
                this.reconnect();
            } else {
                if (reason === DisconnectReason.loggedOut) {
                    await this.storageLogout();
                }
            }
        }

        // Conexão aberta
        if (connection === 'open') {
            this.logger.info('Connection opened successfully');
            this.reconnectAttempts = 0;
            this.isConnecting = false;

            const user = this.socket?.user;
            const sessionInfo: SessionInfo = {
                sessionId: this.config.sessionId,
                phoneNumber: user?.id ? user.id.split(':')[0] : '',
                name: user?.name,
                connectedAt: new Date(),
                platform: 'whatsapp'
            };

            this.client.emit('connected', sessionInfo);
        }

        // Conectando
        if (connection === 'connecting') {
            this.client.emit('connecting');
        }

        // Debug raw update
        this.client.emit('connection:update', {
            state: this.mapConnectionState(connection),
            qr,
            error: lastDisconnect?.error as Error
        });
    }

    /**
     * Tenta reconectar com backoff
     */
    private async reconnect() {
        const maxRetries = this.config.connection?.retries || 3;
        const retryInterval = this.config.connection?.retryInterval || 5000;

        if (this.reconnectAttempts >= maxRetries) {
            this.logger.error(`Max reconnection attempts (${maxRetries}) reached. Giving up.`);
            return;
        }

        this.reconnectAttempts++;
        const delay = retryInterval * Math.pow(2, this.reconnectAttempts - 1); // Backoff exponencial

        this.logger.info(`Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts}/${maxRetries})...`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Desconecta
     */
    async disconnect(logout: boolean = false): Promise<void> {
        this.shouldReconnect = false;

        if (logout) {
            await this.socket?.logout();
            await this.storageLogout();
        } else {
            this.socket?.end(undefined);
        }
    }

    /**
     * Remove sessão do storage
     */
    private async storageLogout() {
        await this.config.storage.removeSession(this.config.sessionId);
    }

    /**
     * Mapeia estado do Baileys para nosso enum
     */
    private mapConnectionState(state?: 'open' | 'connecting' | 'close'): ConnectionState {
        switch (state) {
            case 'open': return ConnectionState.CONNECTED;
            case 'connecting': return ConnectionState.CONNECTING;
            case 'close': return ConnectionState.DISCONNECTED;
            default: return ConnectionState.DISCONNECTED;
        }
    }

    /**
     * Retorna o socket atual (para uso interno dos services)
     */
    getSocket(): WASocket | null {
        return this.socket;
    }

    getState(): ConnectionState {
        // Simplificado, idealmente verificaria o socket
        if (this.isConnecting) return ConnectionState.CONNECTING;
        if (this.socket?.user) return ConnectionState.CONNECTED;
        return ConnectionState.DISCONNECTED;
    }
}
