import { STEAM_AUTH_URL } from "@/api/endpoints/auth.api";

export function redirectToSteam(): void {
    window.location.assign(STEAM_AUTH_URL);
}

