import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { cn } from "@/design-system";
import type { CalendarView, EventType } from "@/api/types/agenda";

const EVENT_TYPES: EventType[] = ["MATCH", "MEETING", "STRAT_TIME", "REST", "CUSTOM"];
const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => i);

interface CalendarToolbarProps {
    view: CalendarView;
    onViewChange: (v: CalendarView) => void;
    currentDate: Date;
    onNavigate: (direction: -1 | 0 | 1) => void;
    filterEventType: string | null;
    onFilterEventType: (t: string | null) => void;
    startHour: number;
    endHour: number;
    onTimeRangeChange: (start: number, end: number) => void;
}

export default function CalendarToolbar({
    view, onViewChange, currentDate, onNavigate, filterEventType, onFilterEventType,
    startHour, endHour, onTimeRangeChange,
}: CalendarToolbarProps) {
    const { t, i18n } = useTranslation();
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showSettings) return;
        const handler = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showSettings]);

    const periodLabel = (() => {
        if (view === "month") {
            return new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric" }).format(currentDate);
        }
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
        const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
        const fmt = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short" });
        return `${fmt.format(mon)} – ${fmt.format(sun)}`;
    })();

    const isCurrentPeriod = (() => {
        const now = new Date();
        if (view === "month") {
            return now.getFullYear() === currentDate.getFullYear() && now.getMonth() === currentDate.getMonth();
        }
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
        const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
        return now >= mon && now <= sun;
    })();

    return (
        <div className="flex items-center justify-between gap-3 px-1">
            {/* Left: type filter + settings */}
            <div className="flex items-center gap-2">
                <select
                    value={filterEventType ?? ""}
                    onChange={e => onFilterEventType(e.target.value ? e.target.value as EventType : null)}
                    className="h-7 text-xs text-neutral-400 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-2 outline-none focus:border-indigo-500/50 cursor-pointer transition-colors"
                >
                    <option value="">{t("agenda.all_types")}</option>
                    {EVENT_TYPES.map(type => (
                        <option key={type} value={type}>{t(`agenda.event_type.${type}`)}</option>
                    ))}
                    <option value="UNAVAILABLE">{t("agenda.filter_unavailable")}</option>
                </select>

                {view === "week" && (
                    <div ref={settingsRef} className="relative">
                        <button
                            onClick={() => setShowSettings(v => !v)}
                            className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                showSettings
                                    ? "bg-neutral-800 text-white"
                                    : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
                            )}
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        {showSettings && (
                            <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#141414] border border-neutral-700 rounded-lg p-3 w-[200px]">
                                <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-2">{t("agenda.time_range")}</p>
                                <div className="flex items-center gap-2">
                                    <select value={startHour} onChange={e => onTimeRangeChange(Number(e.target.value), endHour)}
                                        className="flex-1 h-7 text-xs text-neutral-300 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-1.5 outline-none focus:border-indigo-500/50 cursor-pointer tabular-nums">
                                        {HOUR_OPTIONS.filter(h => h < endHour).map(h => (
                                            <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                                        ))}
                                    </select>
                                    <span className="text-neutral-600 text-xs">–</span>
                                    <select value={endHour} onChange={e => onTimeRangeChange(startHour, Number(e.target.value))}
                                        className="flex-1 h-7 text-xs text-neutral-300 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-1.5 outline-none focus:border-indigo-500/50 cursor-pointer tabular-nums">
                                        {HOUR_OPTIONS.filter(h => h > startHour).map(h => (
                                            <option key={h} value={h}>{String(h % 24).padStart(2, "0")}:00</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right: today, view toggle, navigation */}
            <div className="flex items-center gap-2">
                {!isCurrentPeriod && (
                    <button onClick={() => onNavigate(0)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 transition-colors">
                        {t("agenda.today")}
                    </button>
                )}

                <div className="flex rounded-lg border border-neutral-700/50 overflow-hidden">
                    {(["month", "week"] as CalendarView[]).map(v => (
                        <button key={v} onClick={() => onViewChange(v)}
                            className={cn(
                                "px-3 py-1 text-xs font-medium transition-colors",
                                view === v
                                    ? "bg-indigo-500/15 text-indigo-300"
                                    : "text-neutral-500 hover:text-neutral-300"
                            )}>
                            {t(`agenda.view_${v}`)}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={() => onNavigate(-1)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-sm font-semibold text-white capitalize min-w-[180px] text-center">{periodLabel}</h2>
                    <button onClick={() => onNavigate(1)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
