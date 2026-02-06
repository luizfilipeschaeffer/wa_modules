import { AuthenticationState, SignalDataTypeMap, initAuthCreds, BufferJSON } from 'libzapitu-rf';
import { IStorage, ILogger } from '../types';

export class SessionManager {
    private storage: IStorage;
    private logger?: ILogger;
    private sessionId: string;

    constructor(sessionId: string, storage: IStorage, logger?: ILogger) {
        this.sessionId = sessionId;
        this.storage = storage;
        this.logger = logger;
    }

    /**
     * Carrega ou cria o estado de autenticação
     */
    async getAuthState(): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
        this.logger?.debug(`Loading auth state for session: ${this.sessionId}`);

        const creds = (await this.storage.getCredentials(this.sessionId)) || initAuthCreds();

        // Recupera chaves se existirem
        const keys = await this.storage.getKeys(this.sessionId);

        return {
            state: {
                creds,
                keys: {
                    get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
                        const data: { [key: string]: SignalDataTypeMap[typeof type] } = {};

                        // Se tivermos chaves armazenadas, tentamos recuperá-las
                        if (keys && keys[type]) {
                            for (const id of ids) {
                                const value = keys[type][id];
                                if (value) {
                                    // @ts-ignore - Tipo complexo do Baileys
                                    data[id] = this.deserialize(value, type);
                                }
                            }
                        }

                        return data;
                    },
                    set: async (data: any) => {
                        // Atualiza o objeto de chaves local
                        const currentKeys = (await this.storage.getKeys(this.sessionId)) || {};

                        for (const category in data) {
                            if (!currentKeys[category]) currentKeys[category] = {};

                            // Cast para any para evitar erro de indexação TS
                            const categoryData = (data as any)[category];

                            for (const id in categoryData) {
                                const value = categoryData[id];
                                if (value) {
                                    // @ts-ignore
                                    currentKeys[category][id] = this.serialize(value, category);
                                } else {
                                    delete currentKeys[category][id];
                                }
                            }
                        }

                        // Salva no storage
                        await this.storage.saveKeys(this.sessionId, currentKeys);
                    }
                }
            },
            saveCreds: async () => {
                await this.storage.saveCredentials(this.sessionId, creds);
            }
        };
    }

    /**
     * Serializa dados para armazenamento
     * Necessário porque o Baileys usa Buffer/Proto e JSON não suporta nativamente
     */
    private serialize(value: any, _type: string) {
        if (value && typeof value === 'object' && Buffer.isBuffer(value)) {
            return { type: 'Buffer', data: Array.from(value) };
        }
        return BufferJSON.replacer(value, value);
    }

    /**
   * Deserializa dados do armazenamento
   */
    private deserialize(value: any, type: string) {
        if (value && typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data)) {
            return Buffer.from(value.data);
        }
        return BufferJSON.reviver(type, value);
    }
}
