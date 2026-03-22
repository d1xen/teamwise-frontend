import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/design-system";
import type { EventDto } from "@/api/types/agenda";
import { TYPE_COLORS } from "./EventChip";

interface ConflictsPanelProps {
    events: EventDto[];
    onEventClick: (event: EventDto) => void;
}

export default function ConflictsPanel({ events, onEventClick }: ConflictsPanelProps) {
    const { t, i18n } = useTranslation();

    const conflictEvents = useMemo(() => {
        const now = new Date().toISOString();
        return events
            .filter(e => e.endAt > now && e.conflicts.length > 0)
            .sort((a, b) => a.startAt.localeCompare(b.startAt))
            .slice(0, 5);
    }, [events]);

    const dateFmt = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short" });
    const timeFmt = new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        {t("agenda.conflicts")}
                    </p>
                    {conflictEvents.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            {conflictEvents.length}
                        </span>
                    )}
                </div>
            </div>

            {conflictEvents.length === 0 ? (
                <div className="px-4 py-6 text-center">
                    <p className="text-xs text-neutral-600">{t("agenda.no_conflicts")}</p>
                </div>
            ) : (
                <div className="divide-y divide-neutral-800/50">
                    {conflictEvents.map(event => {
                        const colors = TYPE_COLORS[event.type] ?? TYPE_COLORS.CUSTOM;
                        const start = new Date(event.startAt);

                        return (
                            <button
                                key={event.id}
                                onClick={() => onEventClick(event)}
                                className="w-full text-left px-4 py-2.5 hover:bg-neutral-800/30 transition-colors"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] border uppercase", colors)}>
                                        {t(`agenda.event_type.${event.type}`)}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 tabular-nums">
                                        {dateFmt.format(start)} · {timeFmt.format(start)}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-neutral-200 truncate">{event.title}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {event.conflicts.map(c => (
                                        <span key={c.steamId} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                            {c.nickname}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
