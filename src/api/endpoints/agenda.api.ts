import { apiClient } from "@/api/client/apiClient";
import type {
    CalendarViewDto,
    EventDto,
    AvailabilityDto,
    CreateEventRequest,
    UpdateEventRequest,
    CreateRecurringEventRequest,
    CreateAvailabilityRequest,
    UpdateAvailabilityRequest,
    ConflictSummaryDto,
    EventType,
} from "@/api/types/agenda";

// ── Calendar ─────────────────────────────────────────────────────────────────

export function getCalendar(
    teamId: string, from: string, to: string,
    steamId?: string, eventType?: EventType
): Promise<CalendarViewDto> {
    const params = new URLSearchParams({ from, to });
    if (steamId) params.set("steamId", steamId);
    if (eventType) params.set("eventType", eventType);
    return apiClient<CalendarViewDto>(`/api/teams/${teamId}/calendar?${params}`);
}

// ── My Schedule ─────────────────────────────────────────────────────────────

export function getMySchedule(teamId: string, limit: number = 5): Promise<EventDto[]> {
    return apiClient<EventDto[]>(`/api/teams/${teamId}/events/my-schedule?limit=${limit}`);
}

// ── Events ───────────────────────────────────────────────────────────────────

export function getEvents(teamId: string, from: string, to: string): Promise<EventDto[]> {
    return apiClient<EventDto[]>(`/api/teams/${teamId}/events?from=${from}&to=${to}`);
}

export function getEvent(teamId: string, eventId: number): Promise<EventDto> {
    return apiClient<EventDto>(`/api/teams/${teamId}/events/${eventId}`);
}

export function createEvent(teamId: string, request: CreateEventRequest): Promise<EventDto> {
    return apiClient<EventDto>(`/api/teams/${teamId}/events`, {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export function createRecurringEvents(teamId: string, request: CreateRecurringEventRequest): Promise<EventDto[]> {
    return apiClient<EventDto[]>(`/api/teams/${teamId}/events/recurring`, {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export function updateEvent(teamId: string, eventId: number, request: UpdateEventRequest): Promise<EventDto> {
    return apiClient<EventDto>(`/api/teams/${teamId}/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify(request),
    });
}

export function updateEventSeries(teamId: string, eventId: number, request: UpdateEventRequest): Promise<EventDto[]> {
    return apiClient<EventDto[]>(`/api/teams/${teamId}/events/${eventId}/series`, {
        method: "PUT",
        body: JSON.stringify(request),
    });
}

export function deleteEvent(teamId: string, eventId: number): Promise<void> {
    return apiClient<void>(`/api/teams/${teamId}/events/${eventId}`, {
        method: "DELETE",
    });
}

export function deleteEventSeries(teamId: string, eventId: number): Promise<void> {
    return apiClient<void>(`/api/teams/${teamId}/events/${eventId}/series`, {
        method: "DELETE",
    });
}

// ── Availabilities ───────────────────────────────────────────────────────────

export function getTeamAvailabilities(teamId: string, from: string, to: string): Promise<AvailabilityDto[]> {
    return apiClient<AvailabilityDto[]>(`/api/teams/${teamId}/availabilities?from=${from}&to=${to}`);
}

export function getMyAvailabilities(teamId: string, from: string, to: string): Promise<AvailabilityDto[]> {
    return apiClient<AvailabilityDto[]>(`/api/teams/${teamId}/availabilities/mine?from=${from}&to=${to}`);
}

export function createAvailability(teamId: string, request: CreateAvailabilityRequest): Promise<AvailabilityDto> {
    return apiClient<AvailabilityDto>(`/api/teams/${teamId}/availabilities`, {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export function updateAvailability(teamId: string, availabilityId: number, request: UpdateAvailabilityRequest): Promise<AvailabilityDto> {
    return apiClient<AvailabilityDto>(`/api/teams/${teamId}/availabilities/${availabilityId}`, {
        method: "PUT",
        body: JSON.stringify(request),
    });
}

export function deleteAvailability(teamId: string, availabilityId: number): Promise<void> {
    return apiClient<void>(`/api/teams/${teamId}/availabilities/${availabilityId}`, {
        method: "DELETE",
    });
}

// ── Conflicts ────────────────────────────────────────────────────────────────

export function getConflicts(teamId: string): Promise<ConflictSummaryDto[]> {
    return apiClient<ConflictSummaryDto[]>(`/api/teams/${teamId}/conflicts`);
}

export function acknowledgeConflict(teamId: string, conflictId: number): Promise<void> {
    return apiClient<void>(`/api/teams/${teamId}/conflicts/${conflictId}/acknowledge`, {
        method: "PATCH",
    });
}
