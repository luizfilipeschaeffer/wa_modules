/**
 * Tipos relacionados a grupos
 */

export interface Group {
    id: string;
    name: string;
    description?: string;
    owner: string;
    createdAt: Date;
    participants: GroupParticipant[];
    admins: string[];
    isCommunity: boolean;
    isAnnouncement: boolean;
    profilePicture?: string;
    inviteCode?: string;
}

export interface GroupParticipant {
    id: string;
    phoneNumber: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}

export interface CreateGroupOptions {
    name: string;
    participants: string[];
    description?: string;
}

export interface GroupSettings {
    onlyAdminsCanMessage?: boolean;
    onlyAdminsCanEditInfo?: boolean;
    locked?: boolean;
}

export interface AddParticipantsResult {
    success: string[];
    failed: Array<{
        phoneNumber: string;
        reason: string;
    }>;
}

export interface GroupParticipantChange {
    groupId: string;
    participants: string[];
    action: 'add' | 'remove' | 'promote' | 'demote';
    author: string;
    timestamp: Date;
}
