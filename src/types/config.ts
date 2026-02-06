/**
 * Configuração do cliente WhatsApp
 */

// Re-exporta para manter compatibilidade ou define interfaces aqui mesmo.

// Como estou reescrevendo o arquivo, preciso redefinir TUDO ou importar.
// O arquivo original continha tudo. Vou manter tudo.

export interface WhatsAppConfig {
    /** Identificador único da sessão */
    sessionId: string;

    /** Sistema de armazenamento de autenticação */
    storage: IStorage;

    /** Sistema de cache (opcional) */
    cache?: ICache;

    /** Sistema de logs (opcional) */
    logger?: ILogger;

    /** Configurações de conexão */
    connection?: ConnectionConfig;

    /** Configurações de navegador */
    browser?: BrowserConfig;

    /** Configurações de mensagens */
    messages?: MessagesConfig;

    /** Configurações de mídia */
    media?: MediaConfig;

    /** Opções de QR Code */
    qrcode?: QRCodeConfig;

    /** Eventos customizados */
    events?: EventsConfig;
}

export interface ConnectionConfig {
    /** Timeout para operações (ms) */
    timeout?: number;

    /** Número de tentativas de reconexão */
    retries?: number;

    /** Intervalo entre tentativas (ms) */
    retryInterval?: number;

    /** Versão do WhatsApp Web (opcional) */
    waVersion?: [number, number, number];

    /** Proxy (opcional) */
    proxy?: ProxyConfig;
}

export interface ProxyConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
}

export interface BrowserConfig {
    name?: string;
    version?: string;
}

export interface MessagesConfig {
    /** Cache de mensagens (quantidade) */
    cacheSize?: number;

    /** TTL do cache (segundos) */
    cacheTTL?: number;

    /** Auto-marcar como lida */
    autoRead?: boolean;

    /** Sincronizar histórico completo */
    syncFullHistory?: boolean;
}

export interface MediaConfig {
    /** Diretório temporário para downloads */
    tempDir?: string;

    /** Tamanho máximo de upload (bytes) */
    maxUploadSize?: number;

    /** Qualidade de imagens (1-100) */
    imageQuality?: number;
}

export interface QRCodeConfig {
    /** Máximo de tentativas de QR */
    maxRetries?: number;

    /** Terminal (exibir no console) */
    terminal?: boolean;

    /** Tamanho do QR Code */
    size?: number;
}

export interface EventsConfig {
    /** Emitir eventos próprios */
    emitOwn?: boolean;

    /** Filtrar tipos de evento */
    filter?: string[];
}

export interface IStorage {
    /** Salva credenciais de autenticação */
    saveCredentials(sessionId: string, creds: any): Promise<void>;

    /** Recupera credenciais de autenticação */
    getCredentials(sessionId: string): Promise<any>;

    /** Salva chaves de autenticação */
    saveKeys(sessionId: string, keys: any): Promise<void>;

    /** Recupera chaves de autenticação */
    getKeys(sessionId: string): Promise<any>;

    /** Remove sessão completa */
    removeSession(sessionId: string): Promise<void>;

    /** Verifica se sessão existe */
    hasSession(sessionId: string): Promise<boolean>;

    // Métodos opcionais de persistência de dados
    saveMessage?(sessionId: string, message: any): Promise<void>;
    getMessage?(sessionId: string, messageId: string): Promise<any | null>;
    saveContact?(sessionId: string, contact: any): Promise<void>;
    getContact?(sessionId: string, contactId: string): Promise<any | null>;
}

export interface ICache {
    /** Define valor no cache */
    set(key: string, value: any, ttl?: number): Promise<void>;

    /** Obtém valor do cache */
    get(key: string): Promise<any>;

    /** Remove valor do cache */
    delete(key: string): Promise<void>;

    /** Limpa todo o cache */
    clear(): Promise<void>;

    /** Verifica se chave existe */
    has(key: string): Promise<boolean>;
}

export interface ILogger {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    trace(message: string, ...args: any[]): void;
    child?(bindings: any): ILogger;
}

export interface ConnectionResult {
    success: boolean;
    qr?: string;
    session?: SessionInfo;
}

export interface SessionInfo {
    sessionId: string;
    phoneNumber: string;
    name?: string;
    platform?: string;
    connectedAt: Date;
}

export enum ConnectionState {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    QR_REQUIRED = 'qr_required',
    RECONNECTING = 'reconnecting',
}

export interface ConnectionUpdate {
    state: ConnectionState;
    qr?: string;
    error?: Error;
}

export interface DisconnectReason {
    code: number;
    message: string;
    logout: boolean;
}
