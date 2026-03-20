import type { TeamMemberLink } from "@/api/types/team";

export type UserProfileDto = {
    steamId: string;
    nickname: string;
    /** Avatar Steam (non éditable). */
    avatarUrl: string | null;
    /** Photo de profil personnalisée uploadée (prioritaire sur avatarUrl). */
    profileImageUrl: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    birthDate: string | null;
    address: string | null;
    zipCode: string | null;
    city: string | null;
    countryCode: string | null;
    phone: string | null;
    discord: string | null;
    twitter: string | null;
    hltv: string | null;
    customUsername: string | null;
    profileCompleted: boolean;
};

export type UserProfileUpdateDto = {
    customUsername?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    birthDate?: string | null;
    address?: string | null;
    zipCode?: string | null;
    city?: string | null;
    countryCode?: string | null;
    phone?: string | null;
    twitter?: string | null;
    discord?: string | null;
    hltv?: string | null;
    memberLinks?: {
        links: TeamMemberLink[];
    } | null;
};

