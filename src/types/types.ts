export interface Member {
    steamId: string;
    nickname: string;
    avatarUrl: string;
    role: string;
    isOwner: boolean;
    customUsername?: string;
}