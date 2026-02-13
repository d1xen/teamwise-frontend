// src/api/userProfile.api.ts
import { apiFetch } from "@/api/api";

/* =====================================================
   Types
   ===================================================== */

export interface UserProfile {
    steamId: string;
    nickname: string;
    avatarUrl: string | null;

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

    profileCompleted: boolean;
}

export type UserProfileUpdate = Partial<
    Omit<
        UserProfile,
        "steamId" | "nickname" | "avatarUrl" | "profileCompleted"
    >
>;

/* =====================================================
   READ
   ===================================================== */

/**
 * Profil de l'utilisateur courant
 * GET /api/users/me/profile
 */
export function fetchMyProfile(): Promise<UserProfile> {
    return apiFetch("/api/users/me/profile");
}

/**
 * Profil d'un autre utilisateur
 * GET /api/users/{steamId}/profile
 */
export function fetchUserProfile(
    steamId: string
): Promise<UserProfile> {
    return apiFetch(`/api/users/${steamId}/profile`);
}

/* =====================================================
   WRITE
   ===================================================== */

/**
 * Mise à jour de son propre profil
 * PUT /api/users/me/profile
 */
export function updateMyProfile(
    payload: UserProfileUpdate
): Promise<UserProfile> {
    return apiFetch("/api/users/me/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

/**
 * Mise à jour du profil d'un autre utilisateur
 * (OWNER / MANAGER uniquement)
 * PUT /api/users/{steamId}/profile
 */
export function updateUserProfile(
    steamId: string,
    payload: UserProfileUpdate
): Promise<UserProfile> {
    return apiFetch(`/api/users/${steamId}/profile`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
