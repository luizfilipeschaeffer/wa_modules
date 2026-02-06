/**
 * Tipos relacionados a mensagens
 */

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

export interface MessageResult {
    success: boolean;
    messageId: string;
    timestamp: number;
    message: Message;
}

export interface MessageDeleted {
    chatId: string;
    messageId: string;
    deletedBy: string;
    timestamp: number;
}

export interface Reaction {
    chatId: string;
    messageId: string;
    emoji: string;
    sender: string;
    timestamp: number;
}

// ========== OPÇÕES DE ENVIO ==========

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

// ========== TIPOS AUXILIARES ==========

export interface Location {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
}

export interface VCard {
    displayName: string;
    phoneNumber: string;
    organization?: string;
    email?: string;
}

export interface LinkPreview {
    url: string;
    title?: string;
    description?: string;
    thumbnail?: string;
}

export interface Button {
    id: string;
    text: string;
    type?: 'quick_reply' | 'url' | 'call';
    url?: string;
    phoneNumber?: string;
}

export interface ListSection {
    title: string;
    rows: ListRow[];
}

export interface ListRow {
    id: string;
    title: string;
    description?: string;
}

export interface ListResponse {
    listType: string;
    singleSelectReply: {
        selectedRowId: string;
    };
}

export interface ButtonResponse {
    selectedButtonId: string;
    selectedDisplayText: string;
}
