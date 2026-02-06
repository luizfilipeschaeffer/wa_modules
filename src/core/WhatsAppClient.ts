import { EventEmitter } from 'eventemitter3';
import {
    WhatsAppConfig,
    WhatsAppEvents,
    ConnectionResult,
    ConnectionState,
    SendTextOptions,
    MessageResult,
    SendMediaOptions,
    SendLocationOptions,
    SendContactOptions,
    SendListOptions,
    SendButtonsOptions,
    ReplyOptions,
    ForwardOptions,
    EditMessageOptions,
    DeleteMessageOptions,
    ReactionOptions,
    Contact,
    CheckNumberResult,
    Group,
    CreateGroupOptions,
    AddParticipantsResult,
    PostStatusOptions,
    StatusResult,
    Status,
    Message,
    ILogger,
} from '../types';
import { DefaultLogger, isValidSessionId } from '../utils';
import { ConnectionHandler } from './ConnectionHandler';
import { SessionManager } from './SessionManager';
import { WASocket } from 'libzapitu-rf';

/**
 * Cliente principal do WhatsApp
 * 
 * Esta é a classe principal que você usa para interagir com o WhatsApp.
 * Ela fornece uma API simples e intuitiva para todas as operações.
 */
export class WhatsAppClient extends EventEmitter<WhatsAppEvents> {
    private config: WhatsAppConfig;
    private logger: ILogger;

    // Services
    private sessionManager: SessionManager;
    private connectionHandler: ConnectionHandler;

    // TODO: Futuros serviços com MessageService

    constructor(config: WhatsAppConfig) {
        super();
        this.validateConfig(config);
        this.config = this.mergeDefaultConfig(config);
        this.logger = config.logger || new DefaultLogger();

        // Inicializa services core
        this.sessionManager = new SessionManager(this.config.sessionId, this.config.storage, this.logger);
        this.connectionHandler = new ConnectionHandler(this, this.config, this.sessionManager, this.logger);

        this.initializeServices();
    }

    getSessionId(): string {
        return this.config.sessionId;
    }

    /**
     * Valida a configuração fornecida
     */
    private validateConfig(config: WhatsAppConfig): void {
        if (!config.sessionId) {
            throw new Error('sessionId is required');
        }

        if (!isValidSessionId(config.sessionId)) {
            throw new Error(
                'sessionId must be 3-50 characters long and contain only alphanumeric characters, hyphens, or underscores'
            );
        }

        if (!config.storage) {
            throw new Error('storage is required');
        }
    }

    /**
     * Mescla configuração com valores padrão
     */
    private mergeDefaultConfig(config: WhatsAppConfig): WhatsAppConfig {
        return {
            ...config,
            connection: {
                timeout: 60000,
                retries: 3,
                retryInterval: 5000,
                ...config.connection,
            },
            browser: {
                name: 'WA-Module',
                version: '0.1.0',
                ...config.browser,
            },
            messages: {
                cacheSize: 100,
                cacheTTL: 3600,
                autoRead: false,
                syncFullHistory: false,
                ...config.messages,
            },
            media: {
                tempDir: './temp',
                maxUploadSize: 64 * 1024 * 1024, // 64MB
                imageQuality: 80,
                ...config.media,
            },
            qrcode: {
                maxRetries: 5,
                terminal: false,
                size: 300,
                ...config.qrcode,
            },
            events: {
                emitOwn: false,
                filter: [],
                ...config.events,
            },
        };
    }

    /**
     * Inicializa os serviços internos
     */
    private initializeServices(): void {
        this.logger.info('Services initialized successfully');
    }

    // ========== CONEXÃO ==========

    /**
     * Conecta ao WhatsApp
     * @returns Promise com resultado da conexão
     */
    async connect(): Promise<ConnectionResult> {
        return this.connectionHandler.connect();
    }

    /**
     * Desconecta do WhatsApp
     * @param logout Se true, faz logout completo (remove sessão)
     */
    async disconnect(logout: boolean = false): Promise<void> {
        return this.connectionHandler.disconnect(logout);
    }

    /**
     * Retorna o estado atual da conexão
     */
    getConnectionState(): ConnectionState {
        return this.connectionHandler.getState();
    }

    /**
     * Helper para garantir que socket existe
     */
    private getSocket(): WASocket {
        const socket = this.connectionHandler.getSocket();
        if (!socket) {
            throw new Error('Client not connected');
        }
        return socket;
    }

    // ========== MENSAGENS ==========

    /**
     * Envia mensagem de texto
     */
    /**
     * Envia mensagem de texto com verificação de número
     */
    async sendText(options: SendTextOptions): Promise<MessageResult> {
        this.logger.debug('Sending text message', options);
        const socket = this.getSocket();

        let jid = this.formatPhoneNumber(options.to);

        // Verifica existência (essencial para números BR com/sem 9º dígito)
        if (jid.endsWith('@s.whatsapp.net')) {
            try {
                const [result] = await socket.onWhatsApp(jid);
                if (result?.exists) {
                    jid = result.jid;
                } else {
                    // Tenta variação comum para BR: se tem 13 dígitos (55+2+9+8), tenta remover o 9.
                    // Ou se tem 12, tenta adicionar.
                    // Mas onWhatsApp geralmente resolve se o formato base estiver ok.

                    // Fallback manual para BR se onWhatsApp falhou no primeiro tente
                    /* 
                       Se enviou 5548999999999 (com 9), e falhou, pode ser que o whats espere sem.
                       Mas onWhatsApp deveria retornar vazio.
                       Vamos confiar no usuário se onWhatsApp não retornar nada, ou falhar?
                       Melhor logar warning e tentar enviar mesmo assim, ou lançar erro?
                       O Baileys envia mesmo se não existir, mas não chega.
                    */
                    this.logger.warn(`Number ${jid} not found on check, sending anyway...`);
                }
            } catch (e) {
                this.logger.warn('Failed to check number existence', e);
            }
        }

        const result = await socket.sendMessage(jid, { text: options.text });

        // Isso é temporário, idealmente teremos um mapper de Message
        return {
            success: true,
            messageId: result?.key.id || '',
            timestamp: (result?.messageTimestamp as number) || Date.now(),
            message: {} as Message // Mock por enquanto
        };
    }

    /**
     * Envia mensagem com mídia
     */
    async sendMedia(options: SendMediaOptions): Promise<MessageResult> {
        this.logger.debug('Sending media message', options);

        // TODO: Implementar
        throw new Error('sendMedia not yet implemented');
    }

    /**
     * Envia mensagem de localização
     */
    async sendLocation(options: SendLocationOptions): Promise<MessageResult> {
        this.logger.debug('Sending location message', options);

        // TODO: Implementar
        throw new Error('sendLocation not yet implemented');
    }

    /**
     * Envia contato (vCard)
     */
    async sendContact(options: SendContactOptions): Promise<MessageResult> {
        this.logger.debug('Sending contact message', options);

        // TODO: Implementar
        throw new Error('sendContact not yet implemented');
    }

    /**
     * Envia lista interativa
     */
    async sendList(options: SendListOptions): Promise<MessageResult> {
        this.logger.debug('Sending list message', options);

        // TODO: Implementar
        throw new Error('sendList not yet implemented');
    }

    /**
     * Envia botões interativos
     */
    async sendButtons(options: SendButtonsOptions): Promise<MessageResult> {
        this.logger.debug('Sending buttons message', options);

        // TODO: Implementar
        throw new Error('sendButtons not yet implemented');
    }

    /**
     * Responde a uma mensagem
     */
    async replyToMessage(options: ReplyOptions): Promise<MessageResult> {
        this.logger.debug('Replying to message', options);

        // TODO: Implementar
        throw new Error('replyToMessage not yet implemented');
    }

    /**
     * Encaminha mensagem
     */
    async forwardMessage(options: ForwardOptions): Promise<MessageResult> {
        this.logger.debug('Forwarding message', options);

        // TODO: Implementar
        throw new Error('forwardMessage not yet implemented');
    }

    /**
     * Edita mensagem enviada
     */
    async editMessage(options: EditMessageOptions): Promise<MessageResult> {
        this.logger.debug('Editing message', options);

        // TODO: Implementar
        throw new Error('editMessage not yet implemented');
    }

    /**
     * Deleta mensagem
     */
    async deleteMessage(options: DeleteMessageOptions): Promise<boolean> {
        this.logger.debug('Deleting message', options);

        // TODO: Implementar
        throw new Error('deleteMessage not yet implemented');
    }

    /**
     * Marca mensagem como lida
     */
    async markAsRead(chatId: string, messageId: string): Promise<void> {
        this.logger.debug('Marking message as read', { chatId, messageId });

        // TODO: Implementar
        throw new Error('markAsRead not yet implemented');
    }

    /**
     * Reage a uma mensagem com emoji
     */
    async reactToMessage(options: ReactionOptions): Promise<void> {
        this.logger.debug('Reacting to message', options);

        // TODO: Implementar
        throw new Error('reactToMessage not yet implemented');
    }

    // ========== CONTATOS ==========

    /**
     * Busca contato por número
     */
    async getContact(phoneNumber: string): Promise<Contact> {
        this.logger.debug('Getting contact', { phoneNumber });

        // TODO: Implementar
        throw new Error('getContact not yet implemented');
    }

    /**
     * Lista todos os contatos
     */
    async getContacts(): Promise<Contact[]> {
        this.logger.debug('Getting all contacts');

        // TODO: Implementar
        throw new Error('getContacts not yet implemented');
    }

    /**
     * Verifica se número está no WhatsApp
     */
    async checkNumberExists(phoneNumber: string): Promise<CheckNumberResult> {
        this.logger.debug('Checking if number exists', { phoneNumber });

        // TODO: Implementar
        throw new Error('checkNumberExists not yet implemented');
    }

    /**
     * Busca foto de perfil
     */
    async getProfilePicture(phoneNumber: string): Promise<string | null> {
        this.logger.debug('Getting profile picture', { phoneNumber });

        // TODO: Implementar
        throw new Error('getProfilePicture not yet implemented');
    }

    // ========== GRUPOS ==========

    /**
     * Cria grupo
     */
    async createGroup(options: CreateGroupOptions): Promise<Group> {
        this.logger.debug('Creating group', options);

        // TODO: Implementar
        throw new Error('createGroup not yet implemented');
    }

    /**
     * Busca informações do grupo
     */
    async getGroup(groupId: string): Promise<Group> {
        this.logger.debug('Getting group info', { groupId });

        // TODO: Implementar
        throw new Error('getGroup not yet implemented');
    }

    /**
     * Lista todos os grupos
     */
    async getGroups(): Promise<Group[]> {
        this.logger.debug('Getting all groups');

        // TODO: Implementar
        throw new Error('getGroups not yet implemented');
    }

    /**
     * Adiciona participantes ao grupo
     */
    async addGroupParticipants(
        groupId: string,
        participants: string[]
    ): Promise<AddParticipantsResult> {
        this.logger.debug('Adding group participants', { groupId, participants });

        // TODO: Implementar
        throw new Error('addGroupParticipants not yet implemented');
    }

    /**
     * Atualiza nome do grupo
     */
    async updateGroupName(groupId: string, name: string): Promise<void> {
        this.logger.debug('Updating group name', { groupId, name });

        // TODO: Implementar
        throw new Error('updateGroupName not yet implemented');
    }

    /**
     * Sai do grupo
     */
    async leaveGroup(groupId: string): Promise<void> {
        this.logger.debug('Leaving group', { groupId });

        // TODO: Implementar
        throw new Error('leaveGroup not yet implemented');
    }

    // ========== STATUS/STORIES ==========

    /**
     * Posta status (story)
     */
    async postStatus(options: PostStatusOptions): Promise<StatusResult> {
        this.logger.debug('Posting status', options);

        // TODO: Implementar
        throw new Error('postStatus not yet implemented');
    }

    /**
     * Busca status de contatos
     */
    async getStatuses(): Promise<Status[]> {
        this.logger.debug('Getting statuses');

        // TODO: Implementar
        throw new Error('getStatuses not yet implemented');
    }

    // ========== UTILITÁRIOS ==========

    /**
     * Baixa mídia de mensagem
     */
    async downloadMedia(message: Message): Promise<Buffer> {
        this.logger.debug('Downloading media', { messageId: message.id });

        // TODO: Implementar
        throw new Error('downloadMedia not yet implemented');
    }

    /**
     * Gera link para chat
     */
    generateChatLink(phoneNumber: string, text?: string): string {
        // Implementação já existe em utils/formatters
        const { generateChatLink } = require('../utils/formatters');
        return generateChatLink(phoneNumber, text);
    }

    /**
     * Formata número para WhatsApp JID
     */
    formatPhoneNumber(phoneNumber: string): string {
        // Implementação já existe em utils/formatters
        const { formatPhoneToJID } = require('../utils/formatters');
        return formatPhoneToJID(phoneNumber);
    }
}
