import type { UserProfileDto } from "@/api/types/profile";

/**
 * Retourne l'URL d'avatar à afficher pour un profil utilisateur.
 * Priorité : profileImageUrl (upload custom) → avatarUrl (Steam) → null
 */
export function getAvatarUrl(
    profile: Pick<UserProfileDto, "profileImageUrl" | "avatarUrl">
): string | null {
    return profile.profileImageUrl ?? profile.avatarUrl ?? null;
}
