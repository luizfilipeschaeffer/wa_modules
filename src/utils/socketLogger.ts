import { ILogger } from '../types';

/**
 * Mensagens/erros conhecidos da libzapitu que indicam falha de descriptografia
 * (PreKey/sessão Signal desatualizada). Não são erros da aplicação.
 */
const DECRYPT_MESSAGES = [
    'failed to decrypt message',
    'failed to decrypt poll vote'
];
const DECRYPT_ERROR_NAMES = ['PreKeyError', 'SignalError'];
const DECRYPT_ERROR_MESSAGES = ['Invalid PreKey ID', 'No session found to decrypt message'];

function isDecryptError(bindings: any, msg?: string): boolean {
    if (msg && DECRYPT_MESSAGES.some(m => msg.includes(m))) return true;
    const err = bindings?.err;
    if (!err) return false;
    if (DECRYPT_ERROR_NAMES.includes(err.name)) return true;
    if (typeof err.message === 'string' && DECRYPT_ERROR_MESSAGES.some(m => err.message.includes(m))) return true;
    return false;
}

/**
 * Reduz bindings para log enxuto (sem stack completo)
 */
function sanitizeDecryptBindings(bindings: any): any {
    const key = bindings?.key;
    const reason = bindings?.err?.message || bindings?.err?.name || 'decrypt_failed';
    return key ? { key, reason } : { reason };
}

/**
 * Cria um logger compatível com o socket (libzapitu) que trata erros de
 * descriptografia (PreKey/sessão Signal) como warn e com mensagem resumida,
 * evitando poluição de log com stack traces esperados.
 */
export function createSocketLogger(base: ILogger): ILogger {
    const wrap = (level: 'info' | 'warn' | 'error' | 'debug' | 'trace') => {
        return (messageOrObj: any, ...args: any[]) => {
            const isObjFirst = messageOrObj && typeof messageOrObj === 'object' && !Array.isArray(messageOrObj);
            const bindings = isObjFirst ? messageOrObj : {};
            const msg = (isObjFirst && args[0] && typeof args[0] === 'string') ? args[0] : (typeof messageOrObj === 'string' ? messageOrObj : undefined);

            if (level === 'error' && isDecryptError(bindings, msg)) {
                base.warn(sanitizeDecryptBindings(bindings), 'Message could not be decrypted (key/session out of sync). Sender may need to resend.');
                return;
            }
            if (isObjFirst) base[level](bindings, msg, ...(msg ? args.slice(1) : args));
            else base[level](messageOrObj, ...args);
        };
    };

    return {
        info: wrap('info'),
        warn: wrap('warn'),
        error: wrap('error'),
        debug: wrap('debug'),
        trace: wrap('trace'),
        child(bindings: any): ILogger {
            const childBase = base.child ? base.child(bindings) : base;
            return createSocketLogger(childBase);
        }
    };
}
