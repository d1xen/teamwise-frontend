import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useTeam } from "@/contexts/team/useTeam";
import { useCalendar } from "@/features/agenda/hooks/useCalendar";
import { useConflicts } from "@/features/agenda/hooks/useConflicts";
import { useMySchedule } from "@/features/agenda/hooks/useMySchedule";
import CalendarToolbar from "@/features/agenda/components/CalendarToolbar";
import MonthGrid from "@/features/agenda/components/MonthGrid";
import WeekGrid from "@/features/agenda/components/WeekGrid";
import MySchedulePanel from "@/features/agenda/components/MySchedulePanel";
import ConflictsPanel from "@/features/agenda/components/ConflictsPanel";
import ConflictDetailModal from "@/features/agenda/components/ConflictDetailModal";
import CreateEventModal from "@/features/agenda/components/CreateEventModal";
import EventDetailModal from "@/features/agenda/components/EventDetailModal";
import UnavailDetailModal from "@/features/agenda/components/UnavailDetailModal";
import FeatureHeader from "@/shared/components/FeatureHeader";
import type { EventDto, AvailabilityDto, ConflictSummaryDto } from "@/api/types/agenda";
import { getEvent } from "@/api/endpoints/agenda.api";

export default function AgendaPage() {
    const { t } = useTranslation();
    const { team, membership, members } = useTeam();
    const { eventId: eventIdParam } = useParams<{ eventId?: string }>();
    const navigate = useNavigate();

    const teamId = team ? String(team.id) : "";
    const isStaff = membership ? (membership.isOwner || membership.role !== "PLAYER") : false;
    const isCaptain = membership?.inGameRole === "IGL";

    const calendar = useCalendar(teamId);
    const { conflicts: globalConflicts, reload: reloadConflicts } = useConflicts(teamId);
    const { events: myScheduleEvents, reload: reloadMySchedule } = useMySchedule(teamId);

    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventDto | null>(null);
    const [selectedUnavail, setSelectedUnavail] = useState<AvailabilityDto | null>(null);
    const [selectedConflict, setSelectedConflict] = useState<ConflictSummaryDto | null>(null);

    useEffect(() => {
        if (!team) return;
        if (eventIdParam && !selectedEvent) {
            getEvent(teamId, Number(eventIdParam)).then(setSelectedEvent).catch(() => {
                navigate(`/team/${team.id}/agenda`, { replace: true });
            });
        }
    }, [eventIdParam, selectedEvent, teamId, team, navigate]);

    const handleQuickAdd = useCallback((date: string) => {
        setQuickAddDate(date);
        setShowCreateEvent(true);
    }, []);

    const reloadAll = useCallback(() => {
        calendar.load();
        reloadMySchedule();
        reloadConflicts();
    }, [calendar, reloadMySchedule, reloadConflicts]);

    const handleEventClick = useCallback((event: EventDto) => {
        if (!team) return;
        setSelectedEvent(event);
        navigate(`/team/${team.id}/agenda/event/${event.id}`);
    }, [navigate, team]);

    const handleEventClose = useCallback(() => {
        if (!team) return;
        setSelectedEvent(null);
        navigate(`/team/${team.id}/agenda`);
    }, [navigate, team]);

    const handleViewEventFromConflict = useCallback(async (eventId: number) => {
        try {
            const event = await getEvent(teamId, eventId);
            handleEventClick(event);
        } catch { /* silent */ }
    }, [teamId, handleEventClick]);

    const handleNavigate = useCallback((direction: -1 | 0 | 1) => {
        if (direction === 0) { calendar.setCurrentDate(new Date()); return; }
        const d = new Date(calendar.currentDate);
        if (calendar.view === "month") d.setMonth(d.getMonth() + direction);
        else d.setDate(d.getDate() + direction * 7);
        calendar.setCurrentDate(d);
    }, [calendar]);

    if (!team || !membership) return null;

    const allEvents = calendar.data?.events ?? [];
    const availabilities = calendar.data?.availabilities ?? [];
    const isUnavailFilter = calendar.filterEventType === "UNAVAILABLE";
    const events = isUnavailFilter ? [] : allEvents;

    return (
        <div className="flex flex-col h-full">
            <FeatureHeader title={t("pages.planning.title")} subtitle={t("pages.planning.subtitle")} />

            <div className="flex gap-4 flex-1 overflow-hidden px-4 pb-4 pt-4">
                <div className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col min-w-0 relative">
                    <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                        <div className="flex-1 min-w-0">
                            <CalendarToolbar
                                view={calendar.view} onViewChange={calendar.setView}
                                currentDate={calendar.currentDate} onNavigate={handleNavigate}
                                filterEventType={calendar.filterEventType} onFilterEventType={calendar.setFilterEventType}
                                startHour={calendar.startHour} endHour={calendar.endHour} onTimeRangeChange={calendar.setTimeRange}
                            />
                        </div>
                        <button onClick={() => setShowCreateEvent(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4338ca]/40 bg-[#4338ca]/10 text-[#8b83f7] hover:bg-[#4338ca]/20 text-xs font-medium transition-colors shrink-0">
                            <Plus className="w-3 h-3" />{t("agenda.new_entry")}
                        </button>
                    </div>
                    <div className="border-t border-neutral-800/60" />
                    {calendar.isLoading && (
                        <div className="absolute top-2 right-3 z-30">
                            <div className="w-3.5 h-3.5 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
                        </div>
                    )}
                    {calendar.error && !calendar.data ? (
                        <div className="flex-1 flex items-center justify-center"><p className="text-sm text-red-400">{t("common.error")}</p></div>
                    ) : calendar.view === "month" ? (
                        <MonthGrid key={calendar.currentDate.getTime()} currentDate={calendar.currentDate} events={events} conflicts={globalConflicts} onEventClick={handleEventClick} onQuickAdd={handleQuickAdd} />
                    ) : (
                        <WeekGrid key={calendar.currentDate.getTime()} currentDate={calendar.currentDate} events={events} availabilities={availabilities}
                            conflicts={globalConflicts} isStaff={isStaff} onEventClick={handleEventClick}
                            onUnavailClick={setSelectedUnavail} onQuickAdd={handleQuickAdd}
                            startHour={calendar.startHour} endHour={calendar.endHour} />
                    )}
                </div>

                <div className="w-[280px] shrink-0 flex flex-col gap-3">
                    <MySchedulePanel events={myScheduleEvents} onEventClick={handleEventClick} />
                    <ConflictsPanel conflicts={globalConflicts} onConflictClick={setSelectedConflict} />
                </div>
            </div>

            {showCreateEvent && (
                <CreateEventModal
                    teamId={teamId} members={members} game={team.game}
                    initialDate={quickAddDate ?? undefined} isStaff={isStaff} isCaptain={isCaptain}
                    onClose={() => { setShowCreateEvent(false); setQuickAddDate(null); }}
                    onCreated={reloadAll}
                />
            )}
            {selectedEvent && (
                <EventDetailModal event={selectedEvent} teamId={teamId} isStaff={isStaff} onClose={handleEventClose} onDeleted={reloadAll} />
            )}
            {selectedUnavail && (
                <UnavailDetailModal unavail={selectedUnavail} teamId={teamId} isStaff={isStaff} onClose={() => setSelectedUnavail(null)} onUpdated={reloadAll} />
            )}
            {selectedConflict && (
                <ConflictDetailModal conflict={selectedConflict} teamId={teamId} isStaff={isStaff}
                    onClose={() => setSelectedConflict(null)} onViewEvent={handleViewEventFromConflict}
                    onAcknowledged={() => { setSelectedConflict(null); reloadConflicts(); }} />
            )}
        </div>
    );
}
