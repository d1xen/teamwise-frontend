import { useMemo, useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, CalendarPlus, UserCog } from "lucide-react";
import { cn } from "@/design-system";
import type { EventDto } from "@/api/types/agenda";
import EventChip from "./EventChip";

interface MonthGridProps {
    currentDate: Date;
    events: EventDto[];
    isStaff?: boolean;
    onEventClick: (event: EventDto) => void;
    onQuickAdd?: (date: string, type: "event" | "availability") => void;
}

function getMonthDays(date: Date): Date[][] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0

    const weeks: Date[][] = [];
    const current = new Date(year, month, 1 - startOffset);

    for (let w = 0; w < 6; w++) {
        const week: Date[] = [];
        for (let d = 0; d < 7; d++) {
            week.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        weeks.push(week);
        if (current.getMonth() !== month && w >= 4) break;
    }

    return weeks;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isMultiDayEvent(event: EventDto): boolean {
    if (event.type === "COMPETITION") return true;
    const s = new Date(event.startAt);
    const e = new Date(event.endAt);
    const diffHours = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
    return diffHours >= 23;
}

type SpanningItem = { event: EventDto; startCol: number; span: number };
type SpanningRow = SpanningItem[];

function layoutSpanningEvents(events: EventDto[], weekDays: Date[]): SpanningRow[] {
    const items: SpanningItem[] = [];
    for (const event of events) {
        const s = new Date(event.startAt);
        const e = new Date(event.endAt);
        let startCol = weekDays.findIndex(d => isSameDay(d, s));
        if (startCol < 0) {
            if (s < weekDays[0]) startCol = 0;
            else continue;
        }
        let endDay = new Date(e);
        if (endDay.getHours() === 0 && endDay.getMinutes() === 0) {
            endDay = new Date(endDay.getTime() - 1);
        }
        let endCol = weekDays.findIndex(d => isSameDay(d, endDay));
        if (endCol < 0) endCol = endDay > weekDays[6] ? 6 : -1;
        if (endCol < 0) continue;
        const span = Math.max(endCol - startCol + 1, 1);
        items.push({ event, startCol, span });
    }
    items.sort((a, b) => a.startCol - b.startCol || b.span - a.span);

    const rows: SpanningRow[] = [];
    for (const item of items) {
        let placed = false;
        for (const row of rows) {
            const overlaps = row.some(r => !(item.startCol >= r.startCol + r.span || item.startCol + item.span <= r.startCol));
            if (!overlaps) { row.push(item); placed = true; break; }
        }
        if (!placed) rows.push([item]);
    }
    return rows;
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function OverflowPopover({ events, onEventClick, onClose }: { events: EventDto[]; onEventClick: (e: EventDto) => void; onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <div ref={ref} className="absolute left-0 top-full mt-1 z-50 bg-[#141414] border border-neutral-700 rounded-lg p-1.5 min-w-[160px] max-w-[220px] space-y-1">
            {events.map(ev => (
                <button key={ev.id} onClick={() => { onEventClick(ev); onClose(); }}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-neutral-800/60 transition-colors flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500 tabular-nums shrink-0">{timeFmt.format(new Date(ev.startAt))}</span>
                    <span className="text-[11px] text-neutral-200 truncate font-medium">
                        {ev.match?.opponentName ? `vs ${ev.match.opponentName}` : ev.title}
                    </span>
                </button>
            ))}
        </div>
    );
}

function QuickAddMenu({ date, isStaff, onSelect, onClose }: {
    date: string; isStaff: boolean;
    onSelect: (date: string, type: "event" | "availability") => void;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <div ref={ref} className="absolute left-0 top-full mt-0.5 z-50 bg-[#141414] border border-neutral-700 rounded-lg overflow-hidden min-w-[150px]">
            {isStaff && (
                <button onClick={() => { onSelect(date, "event"); onClose(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-800/60 transition-colors text-left">
                    <CalendarPlus className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-medium text-neutral-200">{t("agenda.new_team_event")}</span>
                </button>
            )}
            <button onClick={() => { onSelect(date, "availability"); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-800/60 transition-colors text-left">
                <UserCog className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] font-medium text-neutral-200">{t("agenda.new_personal")}</span>
            </button>
        </div>
    );
}

export default function MonthGrid({ currentDate, events, isStaff = false, onEventClick, onQuickAdd }: MonthGridProps) {
    const { t } = useTranslation();
    const today = new Date();
    const month = currentDate.getMonth();
    const [overflowKey, setOverflowKey] = useState<string | null>(null);
    const [quickAddKey, setQuickAddKey] = useState<string | null>(null);
    const [hoveredDay, setHoveredDay] = useState<string | null>(null);

    const weeks = useMemo(() => getMonthDays(currentDate), [currentDate]);

    // Separate spanning (multi-day) events from timed events
    const { spanningEvents, timedEvents } = useMemo(() => {
        const spanning: EventDto[] = [];
        const timed: EventDto[] = [];
        for (const ev of events) {
            if (isMultiDayEvent(ev)) spanning.push(ev);
            else timed.push(ev);
        }
        return { spanningEvents: spanning, timedEvents: timed };
    }, [events]);

    // Timed events by date
    const timedByDate = useMemo(() => {
        const map = new Map<string, EventDto[]>();
        for (const event of timedEvents) {
            const s = new Date(event.startAt);
            const key = `${s.getFullYear()}-${s.getMonth()}-${s.getDate()}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(event);
        }
        return map;
    }, [timedEvents]);

    return (
        <div className="flex flex-col flex-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-blue-400/[0.07] bg-blue-500/[0.035]">
                {DAY_KEYS.map(d => (
                    <div key={d} className="py-2 text-center text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        {t(`agenda.day_${d}`)}
                    </div>
                ))}
            </div>

            {/* Weeks */}
            <div className="grid flex-1" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
                {weeks.map((week, wi) => {
                    const spanRows = layoutSpanningEvents(spanningEvents, week);

                    return (
                        <div key={wi} className="border-b border-neutral-800/50 last:border-b-0 flex flex-col min-h-[68px]">
                            {/* Day numbers row */}
                            <div className="grid grid-cols-7">
                                {week.map((day, di) => {
                                    const isToday = isSameDay(day, today);
                                    const isCurrentMonth = day.getMonth() === month;
                                    const dateStr = toDateStr(day);
                                    const isHovered = hoveredDay === dateStr && isCurrentMonth;
                                    return (
                                        <div
                                            key={di}
                                            onMouseEnter={() => isCurrentMonth && setHoveredDay(dateStr)}
                                            onMouseLeave={() => hoveredDay === dateStr && setHoveredDay(null)}
                                            className={cn(
                                                "border-r border-neutral-800/30 last:border-r-0 px-0.5 pt-0.5 relative transition-colors",
                                                !isCurrentMonth && "opacity-30",
                                                isHovered && "bg-white/[0.02]"
                                            )}
                                        >
                                            {onQuickAdd && isHovered && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setQuickAddKey(quickAddKey === dateStr ? null : dateStr); }}
                                                        className="absolute left-0.5 top-0.5 w-4 h-4 rounded flex items-center justify-center text-neutral-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all z-10"
                                                    >
                                                        <Plus className="w-2.5 h-2.5" />
                                                    </button>
                                                    {quickAddKey === dateStr && (
                                                        <QuickAddMenu
                                                            date={dateStr}
                                                            isStaff={isStaff}
                                                            onSelect={(d, type) => { onQuickAdd(d, type); setQuickAddKey(null); }}
                                                            onClose={() => setQuickAddKey(null)}
                                                        />
                                                    )}
                                                </>
                                            )}
                                            <span className={cn(
                                                "text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full ml-auto",
                                                isToday ? "bg-indigo-500 text-white" : "text-neutral-400"
                                            )}>
                                                {day.getDate()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Spanning event bars */}
                            {spanRows.map((row, ri) => (
                                <div key={`span-${ri}`} className="grid grid-cols-7 px-0.5" style={{ height: "20px" }}>
                                    {row.map(item => (
                                        <div
                                            key={item.event.id}
                                            className="px-0.5"
                                            style={{ gridColumn: `${item.startCol + 1} / span ${item.span}` }}
                                        >
                                            <EventChip event={item.event} allDay compact onClick={() => onEventClick(item.event)} />
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {/* Timed events per day */}
                            <div className="grid grid-cols-7 flex-1">
                                {week.map((day, di) => {
                                    const isCurrentMonth = day.getMonth() === month;
                                    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                                    const dateStr = toDateStr(day);
                                    const dayEvents = timedByDate.get(key) ?? [];
                                    const maxShow = 2;
                                    const isHovered = hoveredDay === dateStr && isCurrentMonth;

                                    return (
                                        <div
                                            key={di}
                                            onMouseEnter={() => isCurrentMonth && setHoveredDay(dateStr)}
                                            onMouseLeave={() => hoveredDay === dateStr && setHoveredDay(null)}
                                            className={cn(
                                                "border-r border-neutral-800/30 last:border-r-0 px-1 pb-1 flex flex-col gap-0.5 relative transition-colors",
                                                !isCurrentMonth && "opacity-30",
                                                isHovered && "bg-white/[0.02]"
                                            )}
                                        >
                                            {dayEvents.slice(0, maxShow).map(ev => (
                                                <EventChip key={ev.id} event={ev} compact onClick={() => onEventClick(ev)} />
                                            ))}
                                            {dayEvents.length > maxShow && (
                                                <>
                                                    <button
                                                        onClick={() => setOverflowKey(overflowKey === key ? null : key)}
                                                        className="text-[9px] text-neutral-500 hover:text-indigo-400 text-center transition-colors cursor-pointer"
                                                    >
                                                        +{dayEvents.length - maxShow}
                                                    </button>
                                                    {overflowKey === key && (
                                                        <OverflowPopover
                                                            events={dayEvents.slice(maxShow)}
                                                            onEventClick={onEventClick}
                                                            onClose={() => setOverflowKey(null)}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
