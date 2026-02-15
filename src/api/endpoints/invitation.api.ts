import { apiClient } from "@/api/client/apiClient";
import type {
    CreateInvitationRequest,
    InvitationUrlResponse,
    JoinTeamRequest,
} from "@/api/types/invitation";

export function createInvitation(
    payload: CreateInvitationRequest
): Promise<InvitationUrlResponse> {
    return apiClient<InvitationUrlResponse>("/api/invitations", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function joinTeam(payload: JoinTeamRequest): Promise<void> {
    return apiClient<void>("/api/teams/join", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

