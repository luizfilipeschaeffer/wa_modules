/**
 * Utilitários para formatação de dados do WhatsApp
 */

/**
 * Formata número de telefone para JID do WhatsApp
 * @param phoneNumber Número de telefone (com ou sem código do país)
 * @param isGroup Se é um grupo
 * @returns JID formatado
 */
export function formatPhoneToJID(phoneNumber: string, isGroup: boolean = false): string {
    // Remove todos os caracteres não numéricos
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Se já termina com @s.whatsapp.net ou @g.us, retorna como está
    if (phoneNumber.includes('@')) {
        return phoneNumber;
    }

    // Adiciona o sufixo apropriado
    const suffix = isGroup ? '@g.us' : '@s.whatsapp.net';
    return `${cleaned}${suffix}`;
}

/**
 * Extrai número de telefone do JID
 * @param jid JID do WhatsApp
 * @returns Número de telefone
 */
export function extractPhoneFromJID(jid: string): string {
    return jid.split('@')[0];
}

/**
 * Verifica se JID é de um grupo
 * @param jid JID do WhatsApp
 * @returns true se for grupo
 */
export function isGroupJID(jid: string): boolean {
    return jid.endsWith('@g.us');
}

/**
 * Verifica se JID é de um contato
 * @param jid JID do WhatsApp
 * @returns true se for contato
 */
export function isContactJID(jid: string): boolean {
    return jid.endsWith('@s.whatsapp.net');
}

/**
 * Formata timestamp para Date
 * @param timestamp Timestamp em segundos ou milissegundos
 * @returns Date object
 */
export function formatTimestamp(timestamp: number): Date {
    // Se timestamp está em segundos (10 dígitos), converte para milissegundos
    const ms = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
    return new Date(ms);
}

/**
 * Gera link para chat do WhatsApp
 * @param phoneNumber Número de telefone
 * @param text Texto pré-preenchido (opcional)
 * @returns URL do WhatsApp
 */
export function generateChatLink(phoneNumber: string, text?: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const baseUrl = `https://wa.me/${cleaned}`;

    if (text) {
        const encodedText = encodeURIComponent(text);
        return `${baseUrl}?text=${encodedText}`;
    }

    return baseUrl;
}

/**
 * Formata tamanho de arquivo para string legível
 * @param bytes Tamanho em bytes
 * @returns String formatada (ex: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Trunca texto com reticências
 * @param text Texto para truncar
 * @param maxLength Tamanho máximo
 * @returns Texto truncado
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
}
