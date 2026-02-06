declare module 'libzapitu-rf' {
    export type AuthenticationState = any;
    export type SignalDataTypeMap = any;
    export type WASocket = any;
    export type ConnectionState = any;
    export type UserFacingSocketConfig = any;
    export type DisconnectReason = any;

    export const initAuthCreds: any;
    export const BufferJSON: any;
    export const fetchLatestBaileysVersion: any;
    export const makeCacheableSignalKeyStore: any;
    export const DisconnectReason: any;

    export default function makeWASocket(config: any): any;
}

declare module 'eventemitter3' {
    export class EventEmitter<Events = any> {
        constructor();
        on(event: string | symbol, fn: Function, context?: any): this;
        once(event: string | symbol, fn: Function, context?: any): this;
        off(event: string | symbol, fn?: Function, context?: any, once?: boolean): this;
        emit(event: string | symbol, ...args: any[]): boolean;
        removeAllListeners(event?: string | symbol): this;
    }
}
