import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/design-system";
import type { EventDto } from "@/api/types/agenda";
import { TYPE_COLORS } from "./EventChip";

interface MySchedulePanelProps {
    events: EventDto[];
    userSteamId: string;
    onEventClick: (event: EventDto) => void;
}

export default function MySchedulePanel({ events, userSteamId, onEventClick }: MySchedulePanelProps) {
    const { t, i18n } = useTranslation();

    const myEvents = useMemo(() => {
        const now = new Date().toISOString();
        return events
            .filter(e => e.endAt > now && e.participants.some(p => p.steamId === userSteamId))
            .sort((a, b) => a.startAt.localeCompare(b.startAt))
            .slice(0, 5);
    }, [events, userSteamId]);

    const dateFmt = new Intl.DateTimeFormat(i18n.language, { weekday: "short", day: "numeric", month: "short" });
    const timeFmt = new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        {t("agenda.my_schedule")}
                    </p>
                </div>
            </div>

            {myEvents.length === 0 ? (
                <div className="px-4 py-6 text-center">
                    <p className="text-xs text-neutral-600">{t("agenda.no_upcoming")}</p>
                </div>
            ) : (
                <div className="divide-y divide-neutral-800/50">
                    {myEvents.map(event => {
                        const colors = TYPE_COLORS[event.type] ?? TYPE_COLORS.CUSTOM;
                        const hasConflict = event.conflicts.length > 0;
                        const start = new Date(event.startAt);

                        return (
                            <button
                                key={event.id}
                                onClick={() => onEventClick(event)}
                                className="w-full text-left px-4 py-2.5 hover:bg-neutral-800/30 transition-colors flex items-center gap-3"
                            >
                                {/* Date */}
                                <div className="shrink-0 text-center w-10">
                                    <p className="text-[10px] font-semibold text-neutral-500 uppercase">
                                        {dateFmt.format(start).split(" ")[0]}
                                    </p>
                                    <p className="text-sm font-bold text-neutral-200 tabular-nums">
                                        {start.getDate()}
                                    </p>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] border uppercase", colors)}>
                                            {t(`agenda.event_type.${event.type}`)}
                                        </span>
                                        {hasConflict && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                                    </div>
                                    <p className="text-xs font-medium text-neutral-200 truncate mt-0.5">{event.title}</p>
                                    <p className="text-[10px] text-neutral-500 tabular-nums">
                                        {timeFmt.format(start)} – {timeFmt.format(new Date(event.endAt))}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
