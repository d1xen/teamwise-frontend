import { apiFetch } from "@/api/api";

export async function fetchMyTeams() {
    return apiFetch("/api/teams");
}
