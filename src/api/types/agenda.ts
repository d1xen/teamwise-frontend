export type EventType = "MATCH" | "MEETING" | "STRAT_TIME" | "REST" | "CUSTOM";
export type AvailabilityType = "UNAVAILABLE";
export type RecurrenceFrequency = "DAILY" | "WEEKLY";
export type ParticipantScope = "INDIVIDUAL" | "ACTIVE_ROSTER" | "ALL_MEMBERS" | "STAFF_ONLY";
export type EventSource = "MANUAL" | "FACEIT";

export type EventParticipantDto = {
    steamId: string;
    nickname: string;
    avatarUrl: string | null;
    activePlayer: boolean;
};

export type ConflictDto = {
    steamId: string;
    nickname: string;
    conflictType: "UNAVAILABLE" | "EVENT_OVERLAP";
    conflictSourceId: number;
    reason: string | null;
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
    recurrenceGroupId: string | null;
    createdByNickname: string | null;
    updatedByNickname: string | null;
    createdAt: string;
    updatedAt: string;
    participants: EventParticipantDto[];
    conflicts: ConflictDto[];
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
    description?: string;
    startAt: string;
    endAt: string;
    location?: string;
    tags?: string;
    participantScope: ParticipantScope;
    participantSteamIds?: string[];
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
    reason?: string;
    recurringDays?: string[];
    recurringWeeks?: number;
};

export type UpdateAvailabilityRequest = {
    startAt?: string;
    endAt?: string;
    reason?: string;
};

export type CalendarView = "month" | "week";
