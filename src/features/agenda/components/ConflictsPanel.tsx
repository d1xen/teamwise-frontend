import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserX, CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import type { ConflictSummaryDto } from "@/api/types/agenda";

const PAGE_SIZE = 5;

interface ConflictsPanelProps {
    conflicts: ConflictSummaryDto[];
    onConflictClick?: (conflict: ConflictSummaryDto) => void;
}

export default function ConflictsPanel({ conflicts, onConflictClick }: ConflictsPanelProps) {
    const { t, i18n } = useTranslation();
    const [page, setPage] = useState(0);

    const totalPages = Math.max(1, Math.ceil(conflicts.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages - 1);
    const pageConflicts = conflicts.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

    const dateFmt = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short" });

    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-3.5 py-2.5 border-b border-blue-400/[0.07] bg-blue-500/[0.035] shrink-0">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        {t("agenda.conflicts")}{conflicts.length > 0 && ` (${conflicts.length})`}
                    </p>
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

            {/* Content */}
            {conflicts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-neutral-600">{t("agenda.no_conflicts")}</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {pageConflicts.map((c, i) => {
                        const start = new Date(c.eventStartAt);
                        const isUnavailable = c.conflictType === "UNAVAILABLE";

                        return (
                            <button
                                key={c.id}
                                onClick={() => onConflictClick?.(c)}
                                className={`w-full text-left px-3.5 py-2.5 hover:bg-neutral-800/30 transition-colors flex items-center${i > 0 ? " border-t border-neutral-800/50" : ""}`}
                            >
                                <div className="flex gap-2 w-full">
                                    <div className="shrink-0">
                                        {isUnavailable
                                            ? <UserX className="w-3.5 h-3.5 text-orange-400/70" />
                                            : <CalendarClock className="w-3.5 h-3.5 text-red-400/70" />
                                        }
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[11px] font-medium text-neutral-200 truncate">{c.eventTitle}</p>
                                            <span className="text-[10px] text-neutral-600 tabular-nums shrink-0">
                                                {dateFmt.format(start)}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-neutral-500 truncate">
                                            {isUnavailable
                                                ? `${c.nickname}${c.sourceDescription ? ` — ${c.sourceDescription}` : ""}`
                                                : `↔ ${c.sourceDescription}`
                                            }
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
