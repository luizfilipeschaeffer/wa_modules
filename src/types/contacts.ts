/**
 * Tipos relacionados a contatos
 */

export interface Contact {
    id: string;
    phoneNumber: string;
    name?: string;
    pushName?: string;
    profilePicture?: string;
    isBlocked: boolean;
    isMyContact: boolean;
    isGroup: boolean;
    lastSeen?: Date;
    status?: string;
}

export interface CheckNumberResult {
    exists: boolean;
    jid?: string;
    phoneNumber: string;
}
