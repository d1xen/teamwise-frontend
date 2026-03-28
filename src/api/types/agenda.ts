export type EventType = "MATCH" | "COMPETITION" | "MEETING" | "STRAT_TIME" | "REST" | "BREAK" | "CUSTOM";
export type AvailabilityType = "UNAVAILABLE";
export type RecurrenceFrequency = "DAILY" | "WEEKLY";
export type ParticipantScope = "INDIVIDUAL" | "ACTIVE_ROSTER" | "ALL_MEMBERS" | "STAFF_ONLY";
export type EventSource = "MANUAL" | "FACEIT";

export type EventParticipantDto = {
    steamId: string;
    nickname: string;
    avatarUrl: string | null;
    profileImageUrl: string | null;
    activePlayer: boolean;
};

export type EventMatchMapDto = {
    id: number;
    orderIndex: number;
    mapName: string | null;
    ourScore: number | null;
    theirScore: number | null;
};

export type EventMatchDto = {
    matchId: number;
    matchType: "OFFICIAL" | "SCRIM";
    opponentName: string | null;
    opponentLogo: string | null;
    format: "BO1" | "BO3" | "BO5";
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    state: "UPCOMING" | "TO_COMPLETE" | "COMPLETED" | "CANCELLED";
    result: "WIN" | "LOSE" | "DRAW" | null;
    competitionName: string | null;
    competitionType: string | null;
    competitionStage: string | null;
    matchUrl: string | null;
    notes: string | null;
    ignored: boolean;
    source: "MANUAL" | "FACEIT";
    playedAt: string | null;
    maps: EventMatchMapDto[];
};

export type EventCompetitionDto = {
    competitionId: number;
    name: string;
    type: string;
    status: string;
    format: string | null;
    region: string | null;
    organizerName: string | null;
    logoUrl: string | null;
    url: string | null;
    registrationDate: string | null;
    checkInDate: string | null;
    source: "MANUAL" | "FACEIT";
};

export type EventDto = {
    id: number;
    teamId: number;
    type: EventType;
    title: string;
    description: string | null;
    startAt: string;
    endAt: string;
    location: string | null;
    tags: string | null;
    source: EventSource;
    faceitMatchId: string | null;
    linkedMatchId: number | null;
    linkedCompetitionId: number | null;
    recurrenceGroupId: string | null;
    participantScope: ParticipantScope | null;
    createdByNickname: string | null;
    updatedByNickname: string | null;
    createdAt: string;
    updatedAt: string;
    participants: EventParticipantDto[];
    match: EventMatchDto | null;
    competition: EventCompetitionDto | null;
};

export type AvailabilityDto = {
    id: number;
    teamId: number;
    steamId: string;
    nickname: string;
    type: AvailabilityType;
    startAt: string;
    endAt: string;
    reason: string | null;
    createdByNickname: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CalendarViewDto = {
    events: EventDto[];
    availabilities: AvailabilityDto[];
};

export type CreateEventRequest = {
    type: EventType;
    title: string;
    description?: string | undefined;
    startAt: string;
    endAt: string;
    location?: string | undefined;
    tags?: string | undefined;
    participantScope: ParticipantScope;
    participantSteamIds?: string[] | undefined;
};

export type UpdateEventRequest = Partial<CreateEventRequest>;

export type CreateRecurringEventRequest = {
    event: CreateEventRequest;
    frequency: RecurrenceFrequency;
    daysOfWeek?: string[];
    untilDate?: string;
    occurrences?: number;
};

export type CreateAvailabilityRequest = {
    startAt: string;
    endAt: string;
    reason?: string | undefined;
    recurringDays?: string[] | undefined;
    recurringWeeks?: number | undefined;
};

export type UpdateAvailabilityRequest = {
    startAt?: string;
    endAt?: string;
    reason?: string;
};

export type ConflictSummaryDto = {
    id: number;
    eventId: number;
    eventTitle: string;
    eventType: string;
    eventStartAt: string;
    eventEndAt: string;
    steamId: string | null;
    nickname: string | null;
    conflictType: "UNAVAILABLE" | "EVENT_OVERLAP";
    sourceId: number;
    sourceDescription: string | null;
    status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
    detectedAt: string;
};

export type CalendarView = "month" | "week";
