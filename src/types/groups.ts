/**
 * Tipos relacionados a grupos
 */

/** Origem do chat para filtros na interface: pessoa, grupo standalone, comunidade ou grupo dentro de comunidade */
export type ChatOrigin = 'personal' | 'group' | 'community' | 'group_in_community';

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
    /** JID da comunidade pai quando o grupo pertence a uma comunidade */
    linkedParent?: string;
    /** Se é o canal de anúncios da comunidade */
    isCommunityAnnounce?: boolean;
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
