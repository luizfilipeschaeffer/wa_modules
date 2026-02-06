import { IStorage } from '../types';

/**
 * Implementação de storage em memória (volátil)
 * Útil para testes e desenvolvimento
 */
export class MemoryStorage implements IStorage {
    private sessions: Map<string, SessionData> = new Map();

    async saveCredentials(sessionId: string, creds: any): Promise<void> {
        const session = this.sessions.get(sessionId) || { creds: null, keys: null };
        session.creds = creds;
        this.sessions.set(sessionId, session);
    }

    async getCredentials(sessionId: string): Promise<any> {
        const session = this.sessions.get(sessionId);
        return session?.creds || null;
    }

    async saveKeys(sessionId: string, keys: any): Promise<void> {
        const session = this.sessions.get(sessionId) || { creds: null, keys: null };
        session.keys = keys;
        this.sessions.set(sessionId, session);
    }

    async getKeys(sessionId: string): Promise<any> {
        const session = this.sessions.get(sessionId);
        return session?.keys || null;
    }

    async removeSession(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId);
    }

    async hasSession(sessionId: string): Promise<boolean> {
        return this.sessions.has(sessionId);
    }
}

interface SessionData {
    creds: any;
    keys: any;
}
