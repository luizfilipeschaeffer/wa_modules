/**
 * Tipos de eventos do WhatsApp
 */
export interface WhatsAppEvents {
    // ========== CONEXÃO ==========
    /** QR Code gerado */
    qr: (qr: string) => void;

    /** Conectado com sucesso */
    connected: (session: SessionInfo) => void;

    /** Conectando */
    connecting: () => void;

    /** Desconectado */
    disconnected: (reason: DisconnectReason) => void;

    /** Atualização de conexão */
    'connection:update': (update: ConnectionUpdate) => void;

    // ========== MENSAGENS ==========
    /** Nova mensagem (recebida ou enviada) */
    message: (message: Message) => void;

    /** Mensagem enviada */
    'message:sent': (message: Message) => void;

    /** Mensagem recebida */
    'message:received': (message: Message) => void;

    /** Mensagem atualizada */
    'message:updated': (message: Message) => void;

    /** Mensagem deletada */
    'message:deleted': (message: MessageDeleted) => void;

    /** Reação a mensagem */
    'message:reaction': (reaction: Reaction) => void;

    // ========== PRESENÇA ==========
    /** Atualização de presença */
    'presence:update': (presence: PresenceUpdate) => void;

    /** Usuário digitando */
    typing: (data: TypingData) => void;

    /** Usuário gravando áudio */
    recording: (data: RecordingData) => void;

    // ========== CONTATOS ==========
    /** Contato atualizado */
    'contact:update': (contact: Contact) => void;

    /** Contato adicionado */
    'contact:added': (contact: Contact) => void;

    /** Contato bloqueado */
    'contact:blocked': (phoneNumber: string) => void;

    // ========== GRUPOS ==========
    /** Grupo criado */
    'group:created': (group: Group) => void;

    /** Grupo atualizado */
    'group:updated': (group: Group) => void;

    /** Participante adicionado ao grupo */
    'group:participant:added': (data: GroupParticipantChange) => void;

    /** Participante removido do grupo */
    'group:participant:removed': (data: GroupParticipantChange) => void;

    /** Participante promovido a admin */
    'group:participant:promoted': (data: GroupParticipantChange) => void;

    /** Admin rebaixado a participante */
    'group:participant:demoted': (data: GroupParticipantChange) => void;

    // ========== STATUS ==========
    /** Status postado */
    'status:posted': (status: Status) => void;

    /** Status visualizado */
    'status:viewed': (status: Status) => void;

    // ========== CHAMADAS ==========
    /** Chamada recebida */
    call: (call: Call) => void;

    // ========== ERROS ==========
    /** Erro genérico */
    error: (error: Error) => void;

    /** Falha de autenticação */
    'auth:failure': (error: AuthError) => void;
}

import { SessionInfo, DisconnectReason, ConnectionUpdate } from './config';
import { Message, MessageDeleted, Reaction } from './messages';
import { Contact } from './contacts';
import { Group, GroupParticipantChange } from './groups';
import { Status } from './status';

export interface PresenceUpdate {
    chatId: string;
    presence: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused';
    lastSeen?: Date;
}

export interface TypingData {
    chatId: string;
    participant?: string;
    isTyping: boolean;
}

export interface RecordingData {
    chatId: string;
    participant?: string;
    isRecording: boolean;
}

export interface Call {
    id: string;
    from: string;
    timestamp: Date;
    isVideo: boolean;
    isGroup: boolean;
    status: 'ringing' | 'accepted' | 'rejected' | 'missed';
}

export interface AuthError extends Error {
    code: string;
    reason: string;
}
