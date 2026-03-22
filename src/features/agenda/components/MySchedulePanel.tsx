import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Swords, MessageSquare, Crosshair, Coffee, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import type { EventDto } from "@/api/types/agenda";

const PAGE_SIZE = 5;

const TYPE_ICON: Record<string, React.ElementType> = {
    MATCH: Swords,
    MEETING: MessageSquare,
    STRAT_TIME: Crosshair,
    REST: Coffee,
    CUSTOM: Layers,
};

const TYPE_ICON_COLOR: Record<string, string> = {
    MATCH: "text-blue-400/70",
    MEETING: "text-emerald-400/70",
    STRAT_TIME: "text-yellow-400/70",
    REST: "text-neutral-500",
    CUSTOM: "text-neutral-500",
};

interface MySchedulePanelProps {
    events: EventDto[];
    onEventClick: (event: EventDto) => void;
}

export default function MySchedulePanel({ events, onEventClick }: MySchedulePanelProps) {
    const { t, i18n } = useTranslation();
    const [page, setPage] = useState(0);

    const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages - 1);
    const pageEvents = events.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

    const dateFmt = new Intl.DateTimeFormat(i18n.language, { weekday: "short", day: "numeric", month: "short" });
    const timeFmt = new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="h-[calc(50%-6px)] bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-3.5 py-2.5 border-b border-blue-400/[0.07] bg-blue-500/[0.035] shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                            {t("agenda.my_schedule")}{events.length > 0 && ` (${events.length})`}
                        </p>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-neutral-600 tabular-nums mr-1">
                                {safePage + 1}/{totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={safePage === 0}
                                className="p-0.5 text-neutral-500 hover:text-neutral-300 disabled:text-neutral-700 disabled:cursor-default transition-colors"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={safePage >= totalPages - 1}
                                className="p-0.5 text-neutral-500 hover:text-neutral-300 disabled:text-neutral-700 disabled:cursor-default transition-colors"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {events.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-neutral-600">{t("agenda.no_upcoming")}</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    {pageEvents.map((event, i) => {
                        const start = new Date(event.startAt);
                        const Icon = TYPE_ICON[event.type] ?? Layers;
                        const iconColor = TYPE_ICON_COLOR[event.type] ?? "text-neutral-500";

                        return (
                            <button
                                key={event.id}
                                onClick={() => onEventClick(event)}
                                className={`flex-1 text-left px-3.5 hover:bg-neutral-800/30 transition-colors flex items-center${i > 0 ? " border-t border-neutral-800/50" : ""}`}
                            >
                                <div className="flex gap-2 w-full">
                                    <div className="shrink-0">
                                        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[11px] font-medium text-neutral-200 truncate">
                                                {event.match?.opponentName ? `vs ${event.match.opponentName}` : event.title}
                                            </p>
                                            <span className="text-[10px] text-neutral-600 tabular-nums shrink-0">
                                                {dateFmt.format(start)}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-neutral-500 truncate">
                                            {timeFmt.format(start)} – {timeFmt.format(new Date(event.endAt))}
                                            {event.match?.format && <span className="ml-1 text-neutral-600">· {event.match.format}</span>}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
