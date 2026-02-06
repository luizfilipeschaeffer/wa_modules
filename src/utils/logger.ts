import pino from 'pino';
import { ILogger } from '../types';

/**
 * Logger padrão usando Pino
 */
export class DefaultLogger implements ILogger {
    private logger: pino.Logger;

    constructor(options?: pino.LoggerOptions | pino.Logger) {
        if (options && (options as any).child) {
            this.logger = options as pino.Logger;
        } else {
            this.logger = pino({
                level: process.env.LOG_LEVEL || 'info', // 'trace' mostra tudo, 'info' esconde trace
                transport: {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname',
                    },
                },
                ...(options as pino.LoggerOptions),
            });
        }
    }

    // Helper para tratar assinatura polimórfica (string vs object)
    private log(level: 'info' | 'warn' | 'error' | 'debug' | 'trace', messageOrObj: any, ...args: any[]): void {
        if (typeof messageOrObj === 'string') {
            // Se for string, passamos direto
            this.logger[level](args.length > 0 ? { data: args } : {}, messageOrObj);
        } else {
            // Se for objeto, verificamos se o próximo arg é mensagem
            const msg = args.length > 0 && typeof args[0] === 'string' ? args[0] : undefined;
            const rest = msg ? args.slice(1) : args;
            this.logger[level](messageOrObj, msg, ...rest);
        }
    }

    info(messageOrObj: any, ...args: any[]): void {
        this.log('info', messageOrObj, ...args);
    }

    warn(messageOrObj: any, ...args: any[]): void {
        this.log('warn', messageOrObj, ...args);
    }

    error(messageOrObj: any, ...args: any[]): void {
        this.log('error', messageOrObj, ...args);
    }

    debug(messageOrObj: any, ...args: any[]): void {
        this.log('debug', messageOrObj, ...args);
    }

    trace(messageOrObj: any, ...args: any[]): void {
        this.log('trace', messageOrObj, ...args);
    }

    child(bindings: any): ILogger {
        return new DefaultLogger(this.logger.child(bindings));
    }
}

/**
 * Logger silencioso (para testes ou quando não se quer logs)
 */
export class SilentLogger implements ILogger {
    info(_message: any, ..._args: any[]): void { }
    warn(_message: any, ..._args: any[]): void { }
    error(_message: any, ..._args: any[]): void { }
    debug(_message: any, ..._args: any[]): void { }
    trace(_message: any, ..._args: any[]): void { }
    child(_bindings: any): ILogger { return this; }
}
