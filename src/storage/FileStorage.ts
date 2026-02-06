import * as fs from 'fs/promises';
import * as path from 'path';
import { IStorage } from '../types';

/**
 * Implementação de storage em arquivo
 * Persiste dados em arquivos JSON no sistema de arquivos
 */
export class FileStorage implements IStorage {
    private baseDir: string;

    constructor(baseDir: string = './sessions') {
        this.baseDir = baseDir;
        this.ensureBaseDir();
    }

    private async ensureBaseDir(): Promise<void> {
        try {
            await fs.mkdir(this.baseDir, { recursive: true });
        } catch (error) {
            // Ignora erro se diretório já existe
        }
    }

    private getSessionDir(sessionId: string): string {
        return path.join(this.baseDir, sessionId);
    }

    private getCredsPath(sessionId: string): string {
        return path.join(this.getSessionDir(sessionId), 'creds.json');
    }

    private getKeysPath(sessionId: string): string {
        return path.join(this.getSessionDir(sessionId), 'keys.json');
    }

    async saveCredentials(sessionId: string, creds: any): Promise<void> {
        const sessionDir = this.getSessionDir(sessionId);
        await fs.mkdir(sessionDir, { recursive: true });

        const credsPath = this.getCredsPath(sessionId);
        await fs.writeFile(credsPath, JSON.stringify(creds, null, 2), 'utf-8');
    }

    async getCredentials(sessionId: string): Promise<any> {
        try {
            const credsPath = this.getCredsPath(sessionId);
            const data = await fs.readFile(credsPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    async saveKeys(sessionId: string, keys: any): Promise<void> {
        const sessionDir = this.getSessionDir(sessionId);
        await fs.mkdir(sessionDir, { recursive: true });

        const keysPath = this.getKeysPath(sessionId);
        await fs.writeFile(keysPath, JSON.stringify(keys, null, 2), 'utf-8');
    }

    async getKeys(sessionId: string): Promise<any> {
        try {
            const keysPath = this.getKeysPath(sessionId);
            const data = await fs.readFile(keysPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    async removeSession(sessionId: string): Promise<void> {
        try {
            const sessionDir = this.getSessionDir(sessionId);
            await fs.rm(sessionDir, { recursive: true, force: true });
        } catch (error) {
            // Ignora erro se diretório não existe
        }
    }

    async hasSession(sessionId: string): Promise<boolean> {
        try {
            const credsPath = this.getCredsPath(sessionId);
            await fs.access(credsPath);
            return true;
        } catch {
            return false;
        }
    }
}
