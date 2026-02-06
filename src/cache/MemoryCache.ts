import { ICache } from '../types';

/**
 * Implementação de cache em memória
 */
export class MemoryCache implements ICache {
    private cache: Map<string, CacheEntry> = new Map();
    private cleanupInterval: NodeJS.Timeout;

    constructor(cleanupIntervalMs: number = 60000) {
        // Limpa entradas expiradas a cada intervalo
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, cleanupIntervalMs);
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;

        this.cache.set(key, {
            value,
            expiresAt,
        });
    }

    async get(key: string): Promise<any> {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Verifica se expirou
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }

    async has(key: string): Promise<boolean> {
        const entry = this.cache.get(key);

        if (!entry) {
            return false;
        }

        // Verifica se expirou
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Limpa entradas expiradas
     */
    private cleanup(): void {
        const now = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt && now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Destrói o cache e para o cleanup
     */
    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.cache.clear();
    }
}

interface CacheEntry {
    value: any;
    expiresAt?: number;
}
