import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, CalendarPlus, UserCog } from "lucide-react";
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
import AvailabilityModal from "@/features/agenda/components/AvailabilityModal";
import EventDetailModal from "@/features/agenda/components/EventDetailModal";
import UnavailDetailModal from "@/features/agenda/components/UnavailDetailModal";
import FeatureHeader from "@/shared/components/FeatureHeader";
import type { EventDto, AvailabilityDto, ConflictSummaryDto } from "@/api/types/agenda";
import { getEvent } from "@/api/endpoints/agenda.api";

export default function AgendaPage() {
    const { t } = useTranslation();
    const { team, membership, members } = useTeam();
    const teamId = String(team.id);
    const isStaff = (membership?.isOwner ?? false) || membership?.role !== "PLAYER";

    const calendar = useCalendar(teamId);
    const { conflicts: globalConflicts, totalCount: conflictCount, reload: reloadConflicts } = useConflicts(teamId);
    const { events: myScheduleEvents } = useMySchedule(teamId);

    const [showNewMenu, setShowNewMenu] = useState(false);
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [showAvailability, setShowAvailability] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventDto | null>(null);
    const [selectedUnavail, setSelectedUnavail] = useState<AvailabilityDto | null>(null);
    const [selectedConflict, setSelectedConflict] = useState<ConflictSummaryDto | null>(null);
    const newMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showNewMenu) return;
        const handler = (e: MouseEvent) => {
            if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
                setShowNewMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showNewMenu]);

    const handleViewEventFromConflict = useCallback(async (eventId: number) => {
        try {
            const event = await getEvent(teamId, eventId);
            setSelectedEvent(event);
        } catch {
            // silent
        }
    }, [teamId]);

    const handleNavigate = (direction: -1 | 0 | 1) => {
        if (direction === 0) {
            calendar.setCurrentDate(new Date());
            return;
        }
        const d = new Date(calendar.currentDate);
        if (calendar.view === "month") {
            d.setMonth(d.getMonth() + direction);
        } else {
            d.setDate(d.getDate() + direction * 7);
        }
        calendar.setCurrentDate(d);
    };

    const allEvents = calendar.data?.events ?? [];
    const availabilities = calendar.data?.availabilities ?? [];
    const isUnavailFilter = calendar.filterEventType === "UNAVAILABLE";
    const events = isUnavailFilter ? [] : allEvents;

    return (
        <div className="flex flex-col h-full">
            <FeatureHeader
                title={t("pages.planning.title")}
                subtitle={t("agenda.header_subtitle")}
            />

            {/* Toolbar */}
            <div className="flex gap-4 px-4 pt-4 pb-2">
                <div className="flex-1 min-w-0">
                    <CalendarToolbar
                        view={calendar.view}
                        onViewChange={calendar.setView}
                        currentDate={calendar.currentDate}
                        onNavigate={handleNavigate}
                        filterEventType={calendar.filterEventType}
                        onFilterEventType={calendar.setFilterEventType}
                        startHour={calendar.startHour}
                        endHour={calendar.endHour}
                        onTimeRangeChange={calendar.setTimeRange}
                    />
                </div>
                <div className="w-[280px] shrink-0" ref={newMenuRef}>
                    <div className="relative">
                        <button
                            onClick={() => setShowNewMenu(v => !v)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#4338ca] hover:bg-[#4f46e5] text-white text-xs font-semibold transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {t("agenda.new_entry")}
                        </button>
                        {showNewMenu && (
                            <div className="absolute bottom-full left-0 right-0 mb-1.5 z-50 bg-[#141414] border border-neutral-700 rounded-lg overflow-hidden">
                                {isStaff && (
                                    <button
                                        onClick={() => { setShowNewMenu(false); setShowCreateEvent(true); }}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-neutral-800/60 transition-colors text-left"
                                    >
                                        <CalendarPlus className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs font-medium text-neutral-200">{t("agenda.new_team_event")}</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => { setShowNewMenu(false); setShowAvailability(true); }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-neutral-800/60 transition-colors text-left"
                                >
                                    <UserCog className="w-4 h-4 text-orange-400" />
                                    <span className="text-xs font-medium text-neutral-200">{t("agenda.new_personal")}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex gap-4 flex-1 overflow-hidden px-4 pb-4">
                {/* Calendar */}
                <div className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col min-w-0 relative">
                    {calendar.isLoading && (
                        <div className="absolute top-2 right-3 z-30">
                            <div className="w-3.5 h-3.5 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
                        </div>
                    )}
                    {calendar.error && !calendar.data ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm text-red-400">{t("common.error")}</p>
                        </div>
                    ) : calendar.view === "month" ? (
                        <MonthGrid
                            currentDate={calendar.currentDate}
                            events={events}
                            onEventClick={setSelectedEvent}
                        />
                    ) : (
                        <WeekGrid
                            currentDate={calendar.currentDate}
                            events={events}
                            availabilities={availabilities}
                            conflicts={globalConflicts}
                            isStaff={isStaff}
                            onEventClick={setSelectedEvent}
                            onUnavailClick={setSelectedUnavail}
                            startHour={calendar.startHour}
                            endHour={calendar.endHour}
                        />
                    )}
                </div>

                {/* Right panel */}
                <div className="w-[280px] shrink-0 flex flex-col gap-3">
                    <MySchedulePanel
                        events={myScheduleEvents}
                        onEventClick={setSelectedEvent}
                    />
                    <ConflictsPanel
                        conflicts={globalConflicts}
                        onConflictClick={setSelectedConflict}
                    />
                </div>
            </div>

            {/* Modals */}
            {showCreateEvent && (
                <CreateEventModal
                    teamId={teamId}
                    members={members}
                    game={team.game}
                    onClose={() => setShowCreateEvent(false)}
                    onCreated={calendar.load}
                />
            )}
            {showAvailability && (
                <AvailabilityModal
                    teamId={teamId}
                    onClose={() => setShowAvailability(false)}
                    onCreated={calendar.load}
                />
            )}
            {selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    teamId={teamId}
                    isStaff={isStaff}
                    onClose={() => setSelectedEvent(null)}
                    onDeleted={calendar.load}
                />
            )}
            {selectedUnavail && (
                <UnavailDetailModal
                    unavail={selectedUnavail}
                    teamId={teamId}
                    isStaff={isStaff}
                    onClose={() => setSelectedUnavail(null)}
                    onUpdated={calendar.load}
                />
            )}
            {selectedConflict && (
                <ConflictDetailModal
                    conflict={selectedConflict}
                    teamId={teamId}
                    isStaff={isStaff}
                    onClose={() => setSelectedConflict(null)}
                    onViewEvent={handleViewEventFromConflict}
                    onAcknowledged={() => { setSelectedConflict(null); reloadConflicts(); }}
                />
            )}
        </div>
    );
}
