/**
 * Tipos de mídia
 */

export interface MediaInfo {
    mimetype: string;
    size: number;
    filename?: string;
    width?: number;
    height?: number;
    duration?: number;
}

export interface DownloadedMedia {
    buffer: Buffer;
    mimetype: string;
    filename?: string;
}
