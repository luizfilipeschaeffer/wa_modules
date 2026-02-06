/**
 * Utilitários para validação de dados
 */

/**
 * Valida número de telefone
 * @param phoneNumber Número de telefone
 * @returns true se válido
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove todos os caracteres não numéricos
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Número deve ter entre 10 e 15 dígitos
    return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Valida JID do WhatsApp
 * @param jid JID para validar
 * @returns true se válido
 */
export function isValidJID(jid: string): boolean {
    return (
        jid.includes('@') &&
        (jid.endsWith('@s.whatsapp.net') ||
            jid.endsWith('@g.us') ||
            jid.endsWith('@broadcast'))
    );
}

/**
 * Valida URL
 * @param url URL para validar
 * @returns true se válido
 */
export function isValidURL(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Valida se string é base64
 * @param str String para validar
 * @returns true se for base64 válido
 */
export function isBase64(str: string): boolean {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str;
    } catch {
        return false;
    }
}

/**
 * Valida coordenadas geográficas
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns true se válido
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
}

/**
 * Valida tamanho de arquivo
 * @param size Tamanho em bytes
 * @param maxSize Tamanho máximo permitido
 * @returns true se válido
 */
export function isValidFileSize(size: number, maxSize: number): boolean {
    return size > 0 && size <= maxSize;
}

/**
 * Valida tipo MIME
 * @param mimetype Tipo MIME
 * @param allowedTypes Tipos permitidos
 * @returns true se válido
 */
export function isValidMimeType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.some((type) => {
        if (type.endsWith('/*')) {
            const prefix = type.slice(0, -2);
            return mimetype.startsWith(prefix);
        }
        return mimetype === type;
    });
}

/**
 * Valida emoji
 * @param emoji String para validar
 * @returns true se for emoji válido
 */
export function isValidEmoji(emoji: string): boolean {
    // Regex simples para emojis
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
    return emojiRegex.test(emoji) || emoji === ''; // String vazia é válida (remove reação)
}

/**
 * Valida session ID
 * @param sessionId Session ID para validar
 * @returns true se válido
 */
export function isValidSessionId(sessionId: string): boolean {
    // Session ID deve ter entre 3 e 50 caracteres alfanuméricos, hífens ou underscores
    const sessionIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    return sessionIdRegex.test(sessionId);
}
