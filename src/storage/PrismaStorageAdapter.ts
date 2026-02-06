import { PrismaClient } from '@prisma/client';
import { IStorage } from '../types';

// Interface auxiliar para aceitar qualquer cliente Prisma compatível
type PrismaClientLike = {
    session: {
        findUnique: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        deleteMany: (args: any) => Promise<any>;
        upsert: (args: any) => Promise<any>;
        count: (args: any) => Promise<number>;
    };
    // Adicionado suporte para message e contact se existirem no schema
    message?: {
        upsert: (args: any) => Promise<any>;
        findUnique: (args: any) => Promise<any>;
    };
    contact?: {
        upsert: (args: any) => Promise<any>;
        findUnique: (args: any) => Promise<any>;
    };
    $transaction: (args: any[]) => Promise<any>;
}

// Utilitário para JSON buffer do Baileys
const BufferJSON = {
    replacer: (_k: any, value: any) => {
        if (Buffer.isBuffer(value) || value instanceof Uint8Array || value?.type === 'Buffer') {
            return { type: 'Buffer', data: Array.from(value?.data || value) };
        }
        return value;
    },
    reviver: (_: any, value: any) => {
        if (typeof value === 'object' && !!value && (value.buffer === true || value.type === 'Buffer')) {
            const val = value.data || value.value;
            return typeof val === 'string' ? Buffer.from(val, 'base64') : Buffer.from(val || []);
        }
        return value;
    }
};

export class PrismaStorageAdapter implements IStorage {
    private prisma: PrismaClientLike;

    constructor(prisma?: PrismaClientLike) {
        if (prisma) {
            this.prisma = prisma;
        } else {
            try {
                // @ts-ignore - PrismaClient pode não estar disponível no escopo global
                this.prisma = new PrismaClient();
            } catch (e) {
                throw new Error('PrismaClient not provided and failed to initialize default client. Please provide a prisma instance.');
            }
        }
    }

    async saveCredentials(sessionId: string, creds: any): Promise<void> {
        const data = JSON.stringify(creds, BufferJSON.replacer);

        await this.prisma.session.upsert({
            where: {
                sessionId_type_id: {
                    sessionId,
                    type: 'creds',
                    id: 'default'
                }
            },
            create: {
                sessionId,
                type: 'creds',
                id: 'default',
                data
            },
            update: {
                data
            }
        });
    }

    async getCredentials(sessionId: string): Promise<any> {
        const session = await this.prisma.session.findUnique({
            where: {
                sessionId_type_id: {
                    sessionId,
                    type: 'creds',
                    id: 'default'
                }
            }
        });

        if (!session) return null;
        return JSON.parse(session.data, BufferJSON.reviver);
    }

    async saveKeys(sessionId: string, keys: any): Promise<void> {
        // Implementação otimizada com transaction se possível, mas upsert individual é mais seguro para consistência parcial
        const transactions = [];

        for (const type in keys) {
            const keyData = keys[type];
            for (const id in keyData) {
                const data = keyData[id];

                if (data) {
                    const stringified = JSON.stringify(data, BufferJSON.replacer);
                    transactions.push(
                        this.prisma.session.upsert({
                            where: {
                                sessionId_type_id: {
                                    sessionId,
                                    type,
                                    id
                                }
                            },
                            create: {
                                sessionId,
                                type,
                                id,
                                data: stringified
                            },
                            update: {
                                data: stringified
                            }
                        })
                    );
                } else {
                    transactions.push(
                        this.prisma.session.deleteMany({
                            where: {
                                sessionId,
                                type,
                                id
                            }
                        })
                    );
                }
            }
        }

        if (transactions.length > 0) {
            await this.prisma.$transaction(transactions);
        }
    }

    async getKeys(sessionId: string): Promise<any> {
        const rows = await this.prisma.session.findMany({
            where: {
                sessionId,
                NOT: {
                    type: 'creds'
                }
            }
        });

        const keys: any = {};

        for (const row of rows) {
            if (!keys[row.type]) {
                keys[row.type] = {};
            }
            keys[row.type][row.id] = JSON.parse(row.data, BufferJSON.reviver);
        }

        return keys;
    }

    async removeSession(sessionId: string): Promise<void> {
        await this.prisma.session.deleteMany({
            where: {
                sessionId
            }
        });
    }

    async hasSession(sessionId: string): Promise<boolean> {
        const count = await this.prisma.session.count({
            where: {
                sessionId,
                type: 'creds' // Verifica apenas se tem credenciais
            }
        });
        return count > 0;
    }

    // --- Métodos de Mensagem ---

    async saveMessage(sessionId: string, message: any): Promise<void> {
        if (!this.prisma.message) {
            console.warn('PrismaStorageAdapter: Message model not found in PrismaClient');
            return;
        }

        const key = message.key;
        const id = key.id;
        if (!id) return; // Mensagem sem ID?

        const jid = key.remoteJid;
        const fromMe = key.fromMe || false;
        const participant = key.participant || jid; // Em grupos, quem enviou
        const timestamp = message.messageTimestamp ? new Date((message.messageTimestamp as number) * 1000) : new Date();

        // Extração simplificada do corpo (texto)
        let body = '';
        const msgContent = message.message;
        if (msgContent) {
            body = msgContent.conversation ||
                msgContent.extendedTextMessage?.text ||
                msgContent.imageMessage?.caption ||
                msgContent.videoMessage?.caption ||
                '';
        }

        const type = Object.keys(msgContent || {})[0] || 'unknown';

        await this.prisma.message.upsert({
            where: { id },
            create: {
                id,
                sessionId,
                chatId: jid,
                sender: participant,
                fromMe,
                timestamp,
                type,
                body,
                jsonData: JSON.stringify(message)
            },
            update: {
                // Atualiza status se mudar, mas aqui simplificado
                updatedAt: new Date()
            }
        });
    }

    async getMessage(sessionId: string, messageId: string): Promise<any | null> {
        if (!this.prisma.message) return null;

        const msg = await this.prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!msg || msg.sessionId !== sessionId) return null;
        return JSON.parse(msg.jsonData);
    }
}
