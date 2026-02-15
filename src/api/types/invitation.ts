export type CreateInvitationRequest = {
    teamId: number;
    daysValid?: number;
};

export type InvitationUrlResponse = {
    inviteUrl: string;
};

export type JoinTeamRequest = {
    token: string;
};

