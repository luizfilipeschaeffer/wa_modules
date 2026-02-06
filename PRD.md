# PRD: Módulo WhatsApp Universal (WA-Module)

## 1. Visão Geral do Produto

### 1.1 Objetivo

Criar um módulo Node.js independente e framework-agnostic para integração completa com WhatsApp, extraindo e aprimorando a funcionalidade do projeto [Ticketz](https://github.com/ticketz-oss/ticketz), permitindo fácil integração em qualquer aplicação JavaScript/TypeScript.

### 1.2 Problema a Resolver

Desenvolvedores precisam integrar WhatsApp em suas aplicações, mas:

- A integração oficial é cara e limitada (WhatsApp Business API)
- Soluções existentes estão fortemente acopladas a frameworks específicos
- Falta documentação clara e exemplos práticos
- Dificuldade em manter múltiplas sessões e reconexões


### 1.3 Solução Proposta

Um módulo npm standalone baseado na implementação do Ticketz, com:

- API simples e intuitiva
- Zero dependências de framework
- Sistema de plugins extensível
- Documentação completa com exemplos
- TypeScript com tipagem completa


## 2. Arquitetura do Módulo

### 2.1 Estrutura de Diretórios

```
wa-module/
├── src/
│   ├── core/
│   │   ├── WhatsAppClient.ts          # Cliente principal
│   │   ├── SessionManager.ts          # Gerenciador de sessões
│   │   ├── ConnectionHandler.ts       # Lógica de conexão (baseado em wbot.ts)
│   │   └── EventEmitter.ts            # Sistema de eventos
│   ├── services/
│   │   ├── MessageService.ts          # Envio/recebimento de mensagens
│   │   ├── MediaService.ts            # Manipulação de mídia
│   │   ├── ContactService.ts          # Gerenciamento de contatos
│   │   ├── GroupService.ts            # Operações de grupo
│   │   ├── StatusService.ts           # Stories/Status
│   │   └── PresenceService.ts         # Presença online/digitando
│   ├── storage/
│   │   ├── IStorage.ts                # Interface de armazenamento
│   │   ├── MemoryStorage.ts           # Implementação em memória
│   │   ├── FileStorage.ts             # Implementação em arquivo
│   │   └── adapters/                  # Adapters para bancos de dados
│   │       ├── PostgresAdapter.ts
│   │       ├── MongoAdapter.ts
│   │       ├── MySQLAdapter.ts
│   │       └── RedisAdapter.ts
│   ├── cache/
│   │   ├── ICache.ts                  # Interface de cache
│   │   ├── MemoryCache.ts             # Cache em memória
│   │   └── RedisCache.ts              # Cache Redis
│   ├── types/
│   │   ├── events.ts                  # Tipos de eventos
│   │   ├── messages.ts                # Tipos de mensagens
│   │   ├── media.ts                   # Tipos de mídia
│   │   └── config.ts                  # Tipos de configuração
│   ├── utils/
│   │   ├── logger.ts                  # Sistema de logs
│   │   ├── formatters.ts              # Formatadores de dados
│   │   ├── validators.ts              # Validadores
│   │   └── helpers.ts                 # Funções auxiliares
│   ├── plugins/
│   │   ├── IPlugin.ts                 # Interface de plugin
│   │   └── examples/
│   │       ├── AutoReplyPlugin.ts
│   │       ├── MessageQueuePlugin.ts
│   │       └── MetricsPlugin.ts
│   └── index.ts                       # Ponto de entrada
├── examples/
│   ├── basic/
│   │   ├── simple-bot.ts
│   │   └── send-message.ts
│   ├── advanced/
│   │   ├── multi-session.ts
│   │   ├── with-express.ts
│   │   ├── with-nestjs.ts
│   │   ├── with-fastify.ts
│   │   └── with-queue.ts
│   └── integrations/
│       ├── postgres-storage.ts
│       ├── redis-cache.ts
│       └── custom-plugin.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── getting-started.md
│   ├── api-reference.md
│   ├── events.md
│   ├── storage.md
│   ├── plugins.md
│   ├── migration-from-ticketz.md
│   └── troubleshooting.md
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```


### 2.2 Camadas da Arquitetura

```
┌─────────────────────────────────────────────┐
│         Aplicação do Usuário                │
│     (Express, NestJS, Fastify, etc.)        │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           WhatsAppClient (API Pública)      │
│  - connect()  - sendMessage()  - on()       │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│              Services Layer                  │
│  MessageService │ MediaService │ etc.       │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          Core Layer (ConnectionHandler)     │
│  Socket Management │ Event Handling         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         libzapitu-rf (Baileys Fork)         │
│         WhatsApp Web Protocol               │
└─────────────────────────────────────────────┘
```


## 3. Especificações Técnicas

### 3.1 Dependências Principais

```json
{
  "dependencies": {
    "libzapitu-rf": "^1.0.0-alpha.9",
    "pino": "^9.6.0",
    "eventemitter3": "^5.0.1",
    "p-queue": "^8.0.1",
    "sharp": "^0.34.2",
    "file-type": "^17.1.6",
    "mime-types": "^2.1.35",
    "qrcode": "^1.5.3",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/node": "^20.0.0",
    "vitest": "^1.6.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0"
  },
  "peerDependencies": {
    "pg": "^8.11.5",
    "mongodb": "^6.0.0",
    "mysql2": "^3.9.0",
    "ioredis": "^5.3.2"
  }
}
```


### 3.2 Interface Principal - WhatsAppClient

```typescript
// src/core/WhatsAppClient.ts
import { EventEmitter } from 'eventemitter3';
import { 
  WhatsAppConfig, 
  ConnectionState,
  WhatsAppEvents 
} from '../types';

export class WhatsAppClient extends EventEmitter<WhatsAppEvents> {
  private sessionManager: SessionManager;
  private connectionHandler: ConnectionHandler;
  private messageService: MessageService;
  private mediaService: MediaService;
  private contactService: ContactService;
  private groupService: GroupService;
  private statusService: StatusService;
  private presenceService: PresenceService;

  constructor(config: WhatsAppConfig) {
    super();
    this.validateConfig(config);
    this.initializeServices(config);
  }

  /**
   * Conecta ao WhatsApp e retorna QR Code ou estado da conexão
   * @returns Promise com QR Code ou sucesso da conexão
   */
  async connect(): Promise<ConnectionResult> {
    return this.connectionHandler.connect();
  }

  /**
   * Desconecta do WhatsApp
   * @param logout - Se true, faz logout completo (remove sessão)
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

  // ========== MENSAGENS ==========

  /**
   * Envia mensagem de texto
   */
  async sendText(options: SendTextOptions): Promise<MessageResult> {
    return this.messageService.sendText(options);
  }

  /**
   * Envia mensagem com mídia (imagem, vídeo, áudio, documento)
   */
  async sendMedia(options: SendMediaOptions): Promise<MessageResult> {
    return this.mediaService.sendMedia(options);
  }

  /**
   * Envia mensagem de localização
   */
  async sendLocation(options: SendLocationOptions): Promise<MessageResult> {
    return this.messageService.sendLocation(options);
  }

  /**
   * Envia contato (vCard)
   */
  async sendContact(options: SendContactOptions): Promise<MessageResult> {
    return this.messageService.sendContact(options);
  }

  /**
   * Envia lista interativa (botões)
   */
  async sendList(options: SendListOptions): Promise<MessageResult> {
    return this.messageService.sendList(options);
  }

  /**
   * Envia botões interativos
   */
  async sendButtons(options: SendButtonsOptions): Promise<MessageResult> {
    return this.messageService.sendButtons(options);
  }

  /**
   * Responde a uma mensagem (quoted/reply)
   */
  async replyToMessage(options: ReplyOptions): Promise<MessageResult> {
    return this.messageService.reply(options);
  }

  /**
   * Encaminha mensagem
   */
  async forwardMessage(options: ForwardOptions): Promise<MessageResult> {
    return this.messageService.forward(options);
  }

  /**
   * Edita mensagem enviada
   */
  async editMessage(options: EditMessageOptions): Promise<MessageResult> {
    return this.messageService.edit(options);
  }

  /**
   * Deleta mensagem
   */
  async deleteMessage(options: DeleteMessageOptions): Promise<boolean> {
    return this.messageService.delete(options);
  }

  /**
   * Marca mensagem como lida
   */
  async markAsRead(chatId: string, messageId: string): Promise<void> {
    return this.messageService.markAsRead(chatId, messageId);
  }

  /**
   * Reage a uma mensagem com emoji
   */
  async reactToMessage(options: ReactionOptions): Promise<void> {
    return this.messageService.react(options);
  }

  /**
   * Envia indicador de gravação de áudio
   */
  async sendRecording(chatId: string, duration?: number): Promise<void> {
    return this.presenceService.sendRecording(chatId, duration);
  }

  /**
   * Envia indicador de digitação
   */
  async sendTyping(chatId: string, duration?: number): Promise<void> {
    return this.presenceService.sendTyping(chatId, duration);
  }

  /**
   * Define presença (online/offline)
   */
  async setPresence(presence: 'available' | 'unavailable'): Promise<void> {
    return this.presenceService.setPresence(presence);
  }

  // ========== CONTATOS ==========

  /**
   * Busca contato por número
   */
  async getContact(phoneNumber: string): Promise<Contact> {
    return this.contactService.getContact(phoneNumber);
  }

  /**
   * Lista todos os contatos
   */
  async getContacts(): Promise<Contact[]> {
    return this.contactService.getAll();
  }

  /**
   * Verifica se número está no WhatsApp
   */
  async checkNumberExists(phoneNumber: string): Promise<CheckNumberResult> {
    return this.contactService.checkExists(phoneNumber);
  }

  /**
   * Busca foto de perfil
   */
  async getProfilePicture(phoneNumber: string): Promise<string | null> {
    return this.contactService.getProfilePicture(phoneNumber);
  }

  /**
   * Bloqueia contato
   */
  async blockContact(phoneNumber: string): Promise<void> {
    return this.contactService.block(phoneNumber);
  }

  /**
   * Desbloqueia contato
   */
  async unblockContact(phoneNumber: string): Promise<void> {
    return this.contactService.unblock(phoneNumber);
  }

  // ========== GRUPOS ==========

  /**
   * Cria grupo
   */
  async createGroup(options: CreateGroupOptions): Promise<Group> {
    return this.groupService.create(options);
  }

  /**
   * Busca informações do grupo
   */
  async getGroup(groupId: string): Promise<Group> {
    return this.groupService.getInfo(groupId);
  }

  /**
   * Lista todos os grupos
   */
  async getGroups(): Promise<Group[]> {
    return this.groupService.getAll();
  }

  /**
   * Adiciona participantes ao grupo
   */
  async addGroupParticipants(
    groupId: string, 
    participants: string[]
  ): Promise<AddParticipantsResult> {
    return this.groupService.addParticipants(groupId, participants);
  }

  /**
   * Remove participantes do grupo
   */
  async removeGroupParticipants(
    groupId: string, 
    participants: string[]
  ): Promise<void> {
    return this.groupService.removeParticipants(groupId, participants);
  }

  /**
   * Promove participantes a admin
   */
  async promoteGroupParticipants(
    groupId: string, 
    participants: string[]
  ): Promise<void> {
    return this.groupService.promoteParticipants(groupId, participants);
  }

  /**
   * Remove admin de participantes
   */
  async demoteGroupParticipants(
    groupId: string, 
    participants: string[]
  ): Promise<void> {
    return this.groupService.demoteParticipants(groupId, participants);
  }

  /**
   * Atualiza nome do grupo
   */
  async updateGroupName(groupId: string, name: string): Promise<void> {
    return this.groupService.updateName(groupId, name);
  }

  /**
   * Atualiza descrição do grupo
   */
  async updateGroupDescription(
    groupId: string, 
    description: string
  ): Promise<void> {
    return this.groupService.updateDescription(groupId, description);
  }

  /**
   * Atualiza foto do grupo
   */
  async updateGroupPicture(
    groupId: string, 
    imagePath: string
  ): Promise<void> {
    return this.groupService.updatePicture(groupId, imagePath);
  }

  /**
   * Sai do grupo
   */
  async leaveGroup(groupId: string): Promise<void> {
    return this.groupService.leave(groupId);
  }

  /**
   * Busca convite do grupo
   */
  async getGroupInviteCode(groupId: string): Promise<string> {
    return this.groupService.getInviteCode(groupId);
  }

  /**
   * Revoga convite do grupo
   */
  async revokeGroupInvite(groupId: string): Promise<string> {
    return this.groupService.revokeInvite(groupId);
  }

  /**
   * Entra em grupo via convite
   */
  async joinGroupViaInvite(inviteCode: string): Promise<Group> {
    return this.groupService.joinViaInvite(inviteCode);
  }

  /**
   * Configura restrições do grupo
   */
  async setGroupSettings(
    groupId: string, 
    settings: GroupSettings
  ): Promise<void> {
    return this.groupService.setSettings(groupId, settings);
  }

  // ========== STATUS/STORIES ==========

  /**
   * Posta status (story)
   */
  async postStatus(options: PostStatusOptions): Promise<StatusResult> {
    return this.statusService.post(options);
  }

  /**
   * Busca status de contatos
   */
  async getStatuses(): Promise<Status[]> {
    return this.statusService.getAll();
  }

  /**
   * Visualiza status
   */
  async viewStatus(statusId: string): Promise<void> {
    return this.statusService.view(statusId);
  }

  // ========== PLUGINS ==========

  /**
   * Registra plugin
   */
  use(plugin: IPlugin): void {
    plugin.install(this);
  }

  // ========== UTILITÁRIOS ==========

  /**
   * Baixa mídia de mensagem
   */
  async downloadMedia(message: Message): Promise<Buffer> {
    return this.mediaService.download(message);
  }

  /**
   * Gera link para chat
   */
  generateChatLink(phoneNumber: string, text?: string): string {
    return this.messageService.generateChatLink(phoneNumber, text);
  }

  /**
   * Formata número para WhatsApp JID
   */
  formatPhoneNumber(phoneNumber: string): string {
    return this.contactService.formatNumber(phoneNumber);
  }
}
```


### 3.3 Tipos e Interfaces

```typescript
// src/types/config.ts
export interface WhatsAppConfig {
  // Identificador único da sessão
  sessionId: string;

  // Sistema de armazenamento de autenticação
  storage: IStorage;

  // Sistema de cache (opcional)
  cache?: ICache;

  // Sistema de logs (opcional)
  logger?: ILogger;

  // Configurações de conexão
  connection?: {
    // Timeout para operações (ms)
    timeout?: number;
    
    // Número de tentativas de reconexão
    retries?: number;
    
    // Intervalo entre tentativas (ms)
    retryInterval?: number;
    
    // Versão do WhatsApp Web (opcional)
    waVersion?: [number, number, number];
    
    // Proxy (opcional)
    proxy?: {
      host: string;
      port: number;
      username?: string;
      password?: string;
    };
  };

  // Configurações de navegador
  browser?: {
    name?: string;
    version?: string;
  };

  // Configurações de mensagens
  messages?: {
    // Cache de mensagens (quantidade)
    cacheSize?: number;
    
    // TTL do cache (segundos)
    cacheTTL?: number;
    
    // Auto-marcar como lida
    autoRead?: boolean;
    
    // Sincronizar histórico completo
    syncFullHistory?: boolean;
  };

  // Configurações de mídia
  media?: {
    // Diretório temporário para downloads
    tempDir?: string;
    
    // Tamanho máximo de upload (bytes)
    maxUploadSize?: number;
    
    // Qualidade de imagens (1-100)
    imageQuality?: number;
  };

  // Opções de QR Code
  qrcode?: {
    // Máximo de tentativas de QR
    maxRetries?: number;
    
    // Terminal (exibir no console)
    terminal?: boolean;
    
    // Tamanho do QR Code
    size?: number;
  };

  // Eventos customizados
  events?: {
    // Emitir eventos próprios
    emitOwn?: boolean;
    
    // Filtrar tipos de evento
    filter?: string[];
  };
}

// src/types/events.ts
export interface WhatsAppEvents {
  // Conexão
  'qr': (qr: string) => void;
  'connected': (session: SessionInfo) => void;
  'connecting': () => void;
  'disconnected': (reason: DisconnectReason) => void;
  'connection:update': (update: ConnectionUpdate) => void;

  // Mensagens
  'message': (message: Message) => void;
  'message:sent': (message: Message) => void;
  'message:received': (message: Message) => void;
  'message:updated': (message: Message) => void;
  'message:deleted': (message: MessageDeleted) => void;
  'message:reaction': (reaction: Reaction) => void;

  // Presença
  'presence:update': (presence: PresenceUpdate) => void;
  'typing': (data: TypingData) => void;
  'recording': (data: RecordingData) => void;

  // Contatos
  'contact:update': (contact: Contact) => void;
  'contact:added': (contact: Contact) => void;
  'contact:blocked': (phoneNumber: string) => void;

  // Grupos
  'group:created': (group: Group) => void;
  'group:updated': (group: Group) => void;
  'group:participant:added': (data: GroupParticipantChange) => void;
  'group:participant:removed': (data: GroupParticipantChange) => void;
  'group:participant:promoted': (data: GroupParticipantChange) => void;
  'group:participant:demoted': (data: GroupParticipantChange) => void;

  // Status
  'status:posted': (status: Status) => void;
  'status:viewed': (status: Status) => void;

  // Chamadas
  'call': (call: Call) => void;

  // Erros
  'error': (error: Error) => void;
  'auth:failure': (error: AuthError) => void;
}

// src/types/messages.ts
export interface SendTextOptions {
  to: string;
  text: string;
  quotedMessageId?: string;
  mentions?: string[];
  linkPreview?: boolean;
}

export interface SendMediaOptions {
  to: string;
  media: Buffer | string; // Buffer ou caminho do arquivo
  type: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  filename?: string;
  mimetype?: string;
  quotedMessageId?: string;
  mentions?: string[];
  gifPlayback?: boolean; // Para vídeos
  ptt?: boolean; // Push-to-talk para áudio
}

export interface SendLocationOptions {
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface SendContactOptions {
  to: string;
  contacts: VCard[];
}

export interface SendListOptions {
  to: string;
  title: string;
  description?: string;
  buttonText: string;
  sections: ListSection[];
  footer?: string;
}

export interface SendButtonsOptions {
  to: string;
  text: string;
  buttons: Button[];
  footer?: string;
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    content: string | Buffer;
  };
}

export interface ReplyOptions {
  to: string;
  text: string;
  quotedMessageId: string;
}

export interface ForwardOptions {
  to: string | string[];
  messageId: string;
}

export interface EditMessageOptions {
  chatId: string;
  messageId: string;
  newText: string;
}

export interface DeleteMessageOptions {
  chatId: string;
  messageId: string;
  forEveryone?: boolean;
}

export interface ReactionOptions {
  chatId: string;
  messageId: string;
  emoji: string; // Pode ser string vazia para remover reação
}

export interface Message {
  id: string;
  chatId: string;
  fromMe: boolean;
  sender: string;
  timestamp: number;
  type: MessageType;
  body?: string;
  hasMedia: boolean;
  mediaType?: string;
  mediaUrl?: string;
  caption?: string;
  quotedMessage?: Message;
  mentions?: string[];
  isForwarded: boolean;
  forwardingScore?: number;
  location?: Location;
  vCards?: string[];
  links?: LinkPreview[];
  buttons?: Button[];
  listResponse?: ListResponse;
  buttonResponse?: ButtonResponse;
  raw: any; // Dados brutos do Baileys
}

export type MessageType = 
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'list'
  | 'buttons'
  | 'reaction'
  | 'poll'
  | 'unknown';

export interface MessageResult {
  success: boolean;
  messageId: string;
  timestamp: number;
  message: Message;
}
```


### 3.4 Sistema de Storage (Baseado no Ticketz)

```typescript
// src/storage/IStorage.ts
export interface IStorage {
  /**
   * Salva credenciais de autenticação
   */
  saveCredentials(sessionId: string, creds: any): Promise<void>;

  /**
   * Recupera credenciais de autenticação
   */
  getCredentials(sessionId: string): Promise<any>;

  /**
   * Salva chaves de autenticação
   */
  saveKeys(sessionId: string, keys: any): Promise<void>;

  /**
   * Recupera chaves de autenticação
   */
  getKeys(sessionId: string): Promise<any>;

  /**
   * Remove sessão completa
   */
  removeSession(sessionId: string): Promise<void>;

  /**
   * Verifica se sessão existe
   */
  hasSession(sessionId: string): Promise<boolean>;
}

// src/storage/adapters/PostgresAdapter.ts
import { Pool } from 'pg';

export class PostgresStorageAdapter implements IStorage {
  private pool: Pool;
  private tableName: string;

  constructor(config: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    tableName?: string;
  }) {
    this.pool = new Pool(config);
    this.tableName = config.tableName || 'whatsapp_sessions';
    this.initializeTable();
  }

  private async initializeTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        session_id VARCHAR(255) PRIMARY KEY,
        creds JSONB,
        keys JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async saveCredentials(sessionId: string, creds: any): Promise<void> {
    await this.pool.query(
      `INSERT INTO ${this.tableName} (session_id, creds, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (session_id)
       DO UPDATE SET creds = $2, updated_at = NOW()`,
      [sessionId, JSON.stringify(creds)]
    );
  }

  async getCredentials(sessionId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT creds FROM ${this.tableName} WHERE session_id = $1`,
      [sessionId]
    );
    return result.rows[0]?.creds || null;
  }

  async saveKeys(sessionId: string, keys: any): Promise<void> {
    await this.pool.query(
      `INSERT INTO ${this.tableName} (session_id, keys, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (session_id)
       DO UPDATE SET keys = $2, updated_at = NOW()`,
      [sessionId, JSON.stringify(keys)]
    );
  }

  async getKeys(sessionId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT keys FROM ${this.tableName} WHERE session_id = $1`,
      [sessionId]
    );
    return result.rows[0]?.keys || null;
  }

  async removeSession(sessionId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE session_id = $1`,
      [sessionId]
    );
  }

  async hasSession(sessionId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM ${this.tableName} WHERE session_id = $1`,
      [sessionId]
    );
    return result.rows.length > 0;
  }
}
```


### 3.5 Sistema de Plugins

```typescript
// src/plugins/IPlugin.ts
export interface IPlugin {
  name: string;
  version: string;
  install(client: WhatsAppClient): void;
  uninstall?(): void;
}

// Exemplo: Auto Reply Plugin
export class AutoReplyPlugin implements IPlugin {
  name = 'auto-reply';
  version = '1.0.0';
  
  private rules: ReplyRule[] = [];

  constructor(rules: ReplyRule[]) {
    this.rules = rules;
  }

  install(client: WhatsAppClient): void {
    client.on('message', async (message) => {
      if (message.fromMe) return;

      for (const rule of this.rules) {
        if (this.matchesRule(message, rule)) {
          await client.sendText({
            to: message.chatId,
            text: rule.reply
          });
          break;
        }
      }
    });
  }

  private matchesRule(message: Message, rule: ReplyRule): boolean {
    if (rule.type === 'exact') {
      return message.body === rule.trigger;
    }
    if (rule.type === 'contains') {
      return message.body?.includes(rule.trigger) || false;
    }
    if (rule.type === 'regex') {
      return new RegExp(rule.trigger).test(message.body || '');
    }
    return false;
  }
}

interface ReplyRule {
  type: 'exact' | 'contains' | 'regex';
  trigger: string;
  reply: string;
}
```


## 4. Exemplos de Uso

### 4.1 Exemplo Básico

```typescript
// examples/basic/simple-bot.ts
import { WhatsAppClient, MemoryStorage } from 'wa-module';

async function main() {
  const client = new WhatsAppClient({
    sessionId: 'my-session',
    storage: new MemoryStorage(),
    qrcode: {
      terminal: true
    }
  });

  // Evento de QR Code
  client.on('qr', (qr) => {
    console.log('Escaneie o QR Code:');
    console.log(qr);
  });

  // Evento de conexão
  client.on('connected', (session) => {
    console.log('Conectado!', session);
  });

  // Evento de mensagem
  client.on('message', async (message) => {
    console.log('Nova mensagem:', message.body);

    if (message.body === '!ping') {
      await client.sendText({
        to: message.chatId,
        text: 'Pong! 🏓'
      });
    }
  });

  // Conectar
  await client.connect();
}

main();
```


### 4.2 Exemplo com Express

```typescript
// examples/advanced/with-express.ts
import express from 'express';
import { WhatsAppClient, PostgresStorageAdapter } from 'wa-module';

const app = express();
app.use(express.json());

const storage = new PostgresStorageAdapter({
  host: 'localhost',
  port: 5432,
  database: 'whatsapp',
  user: 'postgres',
  password: 'postgres'
});

const client = new WhatsAppClient({
  sessionId: 'express-session',
  storage
});

// Rota para obter QR Code
app.get('/qr', async (req, res) => {
  const state = client.getConnectionState();
  
  if (state.qr) {
    res.json({ qr: state.qr });
  } else {
    res.json({ status: state.status });
  }
});

// Rota para enviar mensagem
app.post('/send', async (req, res) => {
  try {
    const { to, text } = req.body;
    
    const result = await client.sendText({
      to,
      text
    });
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Rota para enviar mídia
app.post('/send-media', async (req, res) => {
  try {
    const { to, mediaUrl, caption, type } = req.body;
    
    // Baixar mídia
    const response = await fetch(mediaUrl);
    const buffer = await response.arrayBuffer();
    
    const result = await client.sendMedia({
      to,
      media: Buffer.from(buffer),
      type,
      caption
    });
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Rota para criar grupo
app.post('/group/create', async (req, res) => {
  try {
    const { name, participants } = req.body;
    
    const group = await client.createGroup({
      name,
      participants
    });
    
    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Rota para webhook de mensagens
app.post('/webhook', (req, res) => {
  // Esta rota receberá mensagens via webhook
  res.json({ received: true });
});

// Configurar webhook interno
client.on('message', async (message) => {
  // Enviar para webhook externo
  await fetch('http://seu-sistema.com/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
});

// Iniciar
client.connect();
app.listen(3000, () => {
  console.log('API rodando na porta 3000');
});
```


### 4.3 Exemplo com NestJS

```typescript
// examples/advanced/with-nestjs.ts
import { Injectable, Module } from '@nestjs/common';
import { WhatsAppClient, PostgresStorageAdapter } from 'wa-module';

@Injectable()
export class WhatsAppService {
  private client: WhatsAppClient;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    const storage = new PostgresStorageAdapter({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    this.client = new WhatsAppClient({
      sessionId: 'nestjs-session',
      storage
    });

    this.setupListeners();
    await this.client.connect();
  }

  private setupListeners() {
    this.client.on('message', (message) => {
      console.log('Nova mensagem:', message);
    });
  }

  async sendMessage(to: string, text: string) {
    return this.client.sendText({ to, text });
  }

  async sendMedia(to: string, media: Buffer, type: string, caption?: string) {
    return this.client.sendMedia({ to, media, type, caption });
  }

  getClient(): WhatsAppClient {
    return this.client;
  }
}

@Module({
  providers: [WhatsAppService],
  exports: [WhatsAppService]
})
export class WhatsAppModule {}
```


### 4.4 Exemplo Multi-Sessão

```typescript
// examples/advanced/multi-session.ts
import { WhatsAppClient, PostgresStorageAdapter } from 'wa-module';

class WhatsAppManager {
  private clients: Map<string, WhatsAppClient> = new Map();
  private storage: PostgresStorageAdapter;

  constructor() {
    this.storage = new PostgresStorageAdapter({
      host: 'localhost',
      port: 5432,
      database: 'whatsapp',
      user: 'postgres',
      password: 'postgres'
    });
  }

  async createSession(sessionId: string): Promise<WhatsAppClient> {
    if (this.clients.has(sessionId)) {
      throw new Error('Sessão já existe');
    }

    const client = new WhatsAppClient({
      sessionId,
      storage: this.storage
    });

    client.on('connected', () => {
      console.log(`Sessão ${sessionId} conectada`);
    });

    client.on('disconnected', () => {
      console.log(`Sessão ${sessionId} desconectada`);
      this.clients.delete(sessionId);
    });

    await client.connect();
    this.clients.set(sessionId, client);
    
    return client;
  }

  getSession(sessionId: string): WhatsAppClient | undefined {
    return this.clients.get(sessionId);
  }

  async removeSession(sessionId: string): Promise<void> {
    const client = this.clients.get(sessionId);
    
    if (client) {
      await client.disconnect(true);
      this.clients.delete(sessionId);
    }
  }

  getAllSessions(): string[] {
    return Array.from(this.clients.keys());
  }
}

// Uso
const manager = new WhatsAppManager();

// Criar múltiplas sessões
await manager.createSession('vendas');
await manager.createSession('suporte');
await manager.createSession('marketing');

// Enviar mensagem pela sessão de vendas
const vendas = manager.getSession('vendas');
await vendas.sendText({
  to: '5511999999999',
  text: 'Olá da equipe de vendas!'
});

// Enviar mensagem pela sessão de suporte
const suporte = manager.getSession('suporte');
await suporte.sendText({
  to: '5511999999999',
  text: 'Olá da equipe de suporte!'
});
```


### 4.5 Exemplo com Fila de Mensagens

```typescript
// examples/advanced/with-queue.ts
import { WhatsAppClient, MemoryStorage } from 'wa-module';
import PQueue from 'p-queue';

class WhatsAppQueue {
  private client: WhatsAppClient;
  private queue: PQueue;

  constructor(concurrency: number = 1) {
    this.client = new WhatsAppClient({
      sessionId: 'queue-session',
      storage: new MemoryStorage()
    });

    this.queue = new PQueue({
      concurrency,
      interval: 1000, // 1 segundo
      intervalCap: 1 // 1 mensagem por segundo
    });
  }

  async connect() {
    await this.client.connect();
  }

  async sendText(to: string, text: string) {
    return this.queue.add(async () => {
      console.log(`Enviando mensagem para ${to}...`);
      return this.client.sendText({ to, text });
    });
  }

  async sendBulk(messages: Array<{ to: string; text: string }>) {
    const promises = messages.map(msg => 
      this.sendText(msg.to, msg.text)
    );
    
    return Promise.all(promises);
  }

  getQueueSize(): number {
    return this.queue.size;
  }

  getPendingCount(): number {
    return this.queue.pending;
  }
}

// Uso
const whatsappQueue = new WhatsAppQueue(1);
await whatsappQueue.connect();

// Enviar 100 mensagens (serão enfileiradas)
const messages = Array.from({ length: 100 }, (_, i) => ({
  to: '5511999999999',
  text: `Mensagem ${i + 1}`
}));

await whatsappQueue.sendBulk(messages);
console.log('Todas as mensagens foram enviadas!');
```


## 5. Documentação

### 5.1 Estrutura da Documentação

```markdown
# wa-module Documentation

## Table of Contents
1. [Getting Started](docs/getting-started.md)
2. [Configuration](docs/configuration.md)
3. [API Reference](docs/api-reference.md)
4. [Events](docs/events.md)
5. [Storage Adapters](docs/storage.md)
6. [Plugins](docs/plugins.md)
7. [Examples](docs/examples.md)
8. [Migration Guide](docs/migration-from-ticketz.md)
9. [Troubleshooting](docs/troubleshooting.md)
10. [FAQ](docs/faq.md)
```


### 5.2 Getting Started

```markdown
# Getting Started

## Installation

```bash
npm install wa-module
# ou
yarn add wa-module
```


## Quick Start

```typescript
import { WhatsAppClient, MemoryStorage } from 'wa-module';

const client = new WhatsAppClient({
  sessionId: 'my-first-session',
  storage: new MemoryStorage()
});

client.on('qr', (qr) => {
  console.log('Scan this QR code:', qr);
});

client.on('connected', () => {
  console.log('Connected!');
});

client.on('message', async (message) => {
  console.log('Received:', message.body);
});

await client.connect();
```


## Next Steps

- [Complete Configuration Guide](configuration.md)
- [API Reference](api-reference.md)
- [More Examples](examples.md)

```

### 5.3 API Reference

```markdown
# API Reference

## WhatsAppClient

Main class for interacting with WhatsApp.

### Constructor

```typescript
new WhatsAppClient(config: WhatsAppConfig)
```


#### Parameters

- `config` (WhatsAppConfig): Configuration object
    - `sessionId` (string): Unique session identifier
    - `storage` (IStorage): Storage adapter for auth data
    - `cache?` (ICache): Optional cache adapter
    - `logger?` (ILogger): Optional custom logger
    - `connection?` (object): Connection settings
    - `messages?` (object): Message settings
    - `media?` (object): Media settings
    - `qrcode?` (object): QR code settings


### Methods

#### connect()

Connects to WhatsApp.

```typescript
client.connect(): Promise<ConnectionResult>
```

**Returns:** Promise resolving to connection result

**Example:**

```typescript
const result = await client.connect();
console.log('Connected:', result);
```


#### sendText()

Sends a text message.

```typescript
client.sendText(options: SendTextOptions): Promise<MessageResult>
```

**Parameters:**

- `to` (string): Recipient phone number or group ID
- `text` (string): Message text
- `quotedMessageId?` (string): ID of message to quote
- `mentions?` (string[]): Phone numbers to mention
- `linkPreview?` (boolean): Enable link preview

**Returns:** Promise resolving to message result

**Example:**

```typescript
await client.sendText({
  to: '5511999999999',
  text: 'Hello, World!'
});
```

[... documentação completa de todos os métodos ...]

```

### 5.4 Events Documentation

```markdown
# Events

## Connection Events

### `qr`

Emitted when QR code is generated.

```typescript
client.on('qr', (qr: string) => {
  console.log('QR Code:', qr);
});
```


### `connected`

Emitted when connection is established.

```typescript
client.on('connected', (session: SessionInfo) => {
  console.log('Connected as:', session.phoneNumber);
});
```

[... documentação completa de todos os eventos ...]

```

## 6. Testing

### 6.1 Estrutura de Testes

```typescript
// tests/unit/MessageService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from '../../src/services/MessageService';
import { WhatsAppClient } from '../../src/core/WhatsAppClient';

describe('MessageService', () => {
  let messageService: MessageService;
  let mockClient: WhatsAppClient;

  beforeEach(() => {
    mockClient = {
      sendMessage: vi.fn()
    } as any;
    
    messageService = new MessageService(mockClient);
  });

  it('should send text message', async () => {
    const result = await messageService.sendText({
      to: '5511999999999',
      text: 'Test message'
    });

    expect(result.success).toBe(true);
    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      '5511999999999@s.whatsapp.net',
      { text: 'Test message' },
      {}
    );
  });

  it('should format phone number correctly', () => {
    const formatted = messageService.formatPhoneNumber('11999999999');
    expect(formatted).toBe('5511999999999@s.whatsapp.net');
  });
});
```


## 7. Roadmap de Desenvolvimento

### Fase 1: Core (Semanas 1-4)

- [ ] Implementar WhatsAppClient básico
- [ ] Sistema de conexão e autenticação
- [ ] Envio/recebimento de mensagens de texto
- [ ] Sistema de eventos
- [ ] Storage em memória e arquivo
- [ ] Documentação básica


### Fase 2: Mensagens Avançadas (Semanas 5-7)

- [ ] Envio de mídia (imagem, vídeo, áudio, documento)
- [ ] Mensagens com botões
- [ ] Listas interativas
- [ ] Localização
- [ ] Contatos (vCard)
- [ ] Reações
- [ ] Edição e exclusão


### Fase 3: Contatos e Grupos (Semanas 8-10)

- [ ] Gerenciamento de contatos
- [ ] Criação e administração de grupos
- [ ] Convites de grupo
- [ ] Foto de perfil
- [ ] Status/Stories


### Fase 4: Storage Adapters (Semanas 11-12)

- [ ] PostgreSQL adapter
- [ ] MySQL adapter
- [ ] MongoDB adapter
- [ ] Redis cache


### Fase 5: Recursos Avançados (Semanas 13-15)

- [ ] Sistema de plugins
- [ ] Fila de mensagens
- [ ] Rate limiting
- [ ] Métricas e monitoring
- [ ] Webhook system


### Fase 6: Documentação e Exemplos (Semanas 16-17)

- [ ] Documentação completa da API
- [ ] Exemplos práticos
- [ ] Guias de integração
- [ ] Migration guide do Ticketz


### Fase 7: Testes e Qualidade (Semanas 18-20)

- [ ] Testes unitários (>80% coverage)
- [ ] Testes de integração
- [ ] Testes E2E
- [ ] CI/CD pipeline


## 8. Métricas de Sucesso

### 8.1 Técnicas

- **Coverage de Testes**: Mínimo 80%
- **Performance**:
    - Tempo de conexão < 10s
    - Envio de mensagem < 500ms
    - Reconexão automática < 5s
- **Estabilidade**:
    - Uptime > 99%
    - Taxa de erro < 1%


### 8.2 Documentação

- 100% dos métodos públicos documentados
- Mínimo 20 exemplos práticos
- Guia completo de troubleshooting


### 8.3 Comunidade

- Mínimo 100 stars no GitHub em 3 meses
- Tempo de resposta a issues < 48h
- Releases mensais com changelog detalhado


## 9. Considerações de Segurança

### 9.1 Armazenamento de Credenciais

- Credenciais devem ser sempre criptografadas
- Suporte a variáveis de ambiente
- Documentar rotação de sessões


### 9.2 Rate Limiting

- Implementar limites de mensagens por segundo
- Prevenir banimento por spam
- Sistema de backoff exponencial


### 9.3 Validação

- Validar todos os inputs
- Sanitizar números de telefone
- Prevenir injection attacks


## 10. Licenciamento

### 10.1 Licença Proposta

**MIT License** - Permitir uso comercial e modificações

### 10.2 Atribuições

- Creditar Ticketz como projeto base
- Creditar libzapitu-rf (Baileys fork)
- Incluir disclaimer sobre uso não oficial


## 11. Deploy e Distribuição

### 11.1 NPM Package

```json
{
  "name": "wa-module",
  "version": "1.0.0",
  "description": "Universal WhatsApp client for Node.js",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": [
    "whatsapp",
    "whatsapp-api",
    "whatsapp-bot",
    "baileys",
    "messaging"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/seu-usuario/wa-module"
  }
}
```


### 11.2 GitHub Repository Structure

```
README.md - Documentação principal
CHANGELOG.md - Histórico de versões
CONTRIBUTING.md - Guia de contribuição
CODE_OF_CONDUCT.md - Código de conduta
LICENSE - Licença MIT
.github/
  - workflows/ci.yml
  - ISSUE_TEMPLATE/
  - PULL_REQUEST_TEMPLATE.md
```


## 12. Próximos Passos

1. **Setup Inicial** (Semana 1)
    - Criar repositório no GitHub
    - Configurar TypeScript e build
    - Setup de testes com Vitest
    - Configurar ESLint e Prettier
2. **Implementação Core** (Semanas 2-4)
    - Extrair código relevante do Ticketz
    - Implementar WhatsAppClient básico
    - Sistema de conexão e QR Code
    - Envio/recebimento básico
3. **Testes e Documentação** (Contínuo)
    - Escrever testes para cada feature
    - Documentar API conforme desenvolvimento
    - Criar exemplos práticos
4. **Release Alpha** (Semana 8)
    - Versão 0.1.0-alpha
    - Funcionalidades básicas
    - Documentação inicial
5. **Release Beta** (Semana 15)
    - Versão 0.8.0-beta
    - Todas as funcionalidades principais
    - Documentação completa
6. **Release 1.0.0** (Semana 20)
    - Versão estável
    - Produção ready
    - Suporte da comunidade

***

Este PRD fornece uma visão completa de como criar o módulo WhatsApp Universal baseado no Ticketz, garantindo:

- ✅ Framework-agnostic (funciona com Express, NestJS, Fastify, etc)
- ✅ Altamente desacoplado e modular
- ✅ Documentação completa
- ✅ Fácil integração
- ✅ Todos os tipos de interação do WhatsApp
- ✅ Sistema de storage flexível
- ✅ Sistema de plugins extensível

