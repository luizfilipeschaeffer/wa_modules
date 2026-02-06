/**
 * Tipos relacionados a status/stories
 */

export interface Status {
    id: string;
    sender: string;
    timestamp: Date;
    type: 'text' | 'image' | 'video';
    content?: string;
    mediaUrl?: string;
    caption?: string;
    backgroundColor?: string;
    font?: number;
    viewers: StatusViewer[];
}

export interface StatusViewer {
    phoneNumber: string;
    viewedAt: Date;
}

export interface PostStatusOptions {
    type: 'text' | 'image' | 'video';
    content?: string;
    media?: Buffer | string;
    caption?: string;
    backgroundColor?: string;
    font?: number;
}

export interface StatusResult {
    success: boolean;
    statusId: string;
    timestamp: number;
}
