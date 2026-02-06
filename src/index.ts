/**
 * WA-Module - Universal WhatsApp Client for Node.js
 * 
 * Ponto de entrada principal do módulo
 */

// Core
export { WhatsAppClient } from './core/WhatsAppClient';

// Storage
export { MemoryStorage } from './storage/MemoryStorage';
export { FileStorage } from './storage/FileStorage';

// Cache
export { MemoryCache } from './cache/MemoryCache';

// Utils
export {
    DefaultLogger,
    SilentLogger,
    formatPhoneToJID,
    extractPhoneFromJID,
    isGroupJID,
    isContactJID,
    formatTimestamp,
    generateChatLink,
    formatFileSize,
    truncateText,
    isValidPhoneNumber,
    isValidJID,
    isValidURL,
    isValidCoordinates,
    isValidFileSize,
    isValidMimeType,
    isValidEmoji,
    isValidSessionId,
    sleep,
    retryWithBackoff,
    debounce,
    throttle,
    generateId,
    isEmpty,
    deepClone,
    deepMerge,
    sanitizeString,
    chunkArray,
} from './utils';

// Types
export * from './types';
