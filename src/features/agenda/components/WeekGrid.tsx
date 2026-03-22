import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/design-system";
import type { EventDto, AvailabilityDto, ConflictSummaryDto } from "@/api/types/agenda";
import EventChip from "./EventChip";

interface WeekGridProps {
    currentDate: Date;
    events: EventDto[];
    availabilities: AvailabilityDto[];
    conflicts?: ConflictSummaryDto[];
    isStaff?: boolean;
    onEventClick: (event: EventDto) => void;
    onUnavailClick?: (a: AvailabilityDto) => void;
    startHour?: number;
    endHour?: number;
}

const HOUR_HEIGHT = 56;

function getWeekDays(date: Date): Date[] {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    return Array.from({ length: 7 }, (_, i) => {
        const dd = new Date(monday);
        dd.setDate(monday.getDate() + i);
        return dd;
    });
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function minutesFromMidnight(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
}

function isAllDayEvent(event: EventDto): boolean {
    const s = new Date(event.startAt);
    const e = new Date(event.endAt);
    // All-day if starts at midnight and ends at 23:59 or later, or spans multiple days
    const startsAtMidnight = s.getHours() === 0 && s.getMinutes() === 0;
    const diffMs = e.getTime() - s.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return startsAtMidnight && diffHours >= 23;
}

function getDayIndex(day: Date, weekDays: Date[]): number {
    return weekDays.findIndex(wd => isSameDay(wd, day));
}

// ── All-day event layout (spanning columns like Google Calendar) ──────────────

type AllDayRow = { event: EventDto; startCol: number; span: number }[];

function layoutAllDayEvents(events: EventDto[], weekDays: Date[]): AllDayRow[] {
    const items = events.map(event => {
        const s = new Date(event.startAt);
        const e = new Date(event.endAt);
        let startCol = getDayIndex(s, weekDays);
        if (startCol < 0) startCol = 0;
        let endDay = new Date(e);
        // If ends at midnight, it means the day before
        if (endDay.getHours() === 0 && endDay.getMinutes() === 0) {
            endDay = new Date(endDay.getTime() - 1);
        }
        let endCol = getDayIndex(endDay, weekDays);
        if (endCol < 0) endCol = 6;
        const span = Math.max(endCol - startCol + 1, 1);
        return { event, startCol, span };
    }).sort((a, b) => a.startCol - b.startCol || b.span - a.span);

    const rows: AllDayRow[] = [];
    for (const item of items) {
        let placed = false;
        for (const row of rows) {
            const overlaps = row.some(r => !(item.startCol >= r.startCol + r.span || item.startCol + item.span <= r.startCol));
            if (!overlaps) {
                row.push(item);
                placed = true;
                break;
            }
        }
        if (!placed) rows.push([item]);
    }
    return rows;
}

// ── Timed event layout (overlapping columns) ─────────────────────────────────

type LayoutedEvent = { event: EventDto; top: number; height: number; depth: number; maxDepth: number };

const STACK_OFFSET = 16;

function layoutOverlappingEvents(events: EventDto[], startMin: number, endMin: number, totalH: number, totalMin: number): LayoutedEvent[] {
    if (events.length === 0) return [];
    const items = events.map(event => {
        const s = minutesFromMidnight(new Date(event.startAt));
        const e = minutesFromMidnight(new Date(event.endAt));
        const cs = Math.max(s, startMin);
        const ce = Math.min(e, endMin);
        return { event, cs, ce };
    }).filter(i => i.ce > i.cs).sort((a, b) => a.cs - b.cs || (b.ce - b.cs) - (a.ce - a.cs));

    const placed: { cs: number; ce: number; idx: number }[] = [];
    const depths: number[] = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let depth = 0;
        for (const p of placed) {
            if (item.cs < p.ce && item.ce > p.cs) depth++;
        }
        depths.push(depth);
        placed.push({ cs: item.cs, ce: item.ce, idx: i });
    }

    // Compute maxDepth for each event (how many total overlaps in its group)
    const maxDepths: number[] = new Array(items.length).fill(0);
    for (let i = 0; i < items.length; i++) {
        let groupMax = depths[i];
        for (let j = 0; j < items.length; j++) {
            if (i === j) continue;
            if (items[i].cs < items[j].ce && items[i].ce > items[j].cs) {
                groupMax = Math.max(groupMax, depths[j]);
            }
        }
        maxDepths[i] = groupMax;
    }

    return items.map((item, i) => {
        const top = ((item.cs - startMin) / totalMin) * totalH;
        const height = Math.max(((item.ce - item.cs) / totalMin) * totalH, 18);
        return { event: item.event, top, height, depth: depths[i], maxDepth: maxDepths[i] };
    });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function WeekGrid({ currentDate, events, availabilities, conflicts = [], isStaff, onEventClick, onUnavailClick, startHour = 10, endHour = 24 }: WeekGridProps) {
    const { t, i18n } = useTranslation();
    const today = new Date();
    const days = useMemo(() => getWeekDays(currentDate), [currentDate]);
    const hours = useMemo(() => Array.from({ length: endHour - startHour }, (_, i) => i + startHour), [startHour, endHour]);

    const totalMinutes = (endHour - startHour) * 60;
    const totalHeight = hours.length * HOUR_HEIGHT;
    const startMinutes = startHour * 60;

    const dayFmt = new Intl.DateTimeFormat(i18n.language, { weekday: "short", day: "numeric" });

    // Separate all-day vs timed events, and expand multi-day timed events
    const { allDayEvents, timedByDay } = useMemo(() => {
        const allDay: EventDto[] = [];
        const timed = new Map<string, EventDto[]>();
        for (const day of days) timed.set(dayKey(day), []);

        for (const event of events) {
            if (isAllDayEvent(event)) {
                allDay.push(event);
            } else {
                // Place timed event on each day it spans
                const s = new Date(event.startAt);
                const e = new Date(event.endAt);
                for (const day of days) {
                    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
                    if (s < dayEnd && e > dayStart) {
                        timed.get(dayKey(day))!.push(event);
                    }
                }
            }
        }
        return { allDayEvents: allDay, timedByDay: timed };
    }, [events, days]);

    const allDayRows = useMemo(() => layoutAllDayEvents(allDayEvents, days), [allDayEvents, days]);
    const hasAllDay = allDayRows.length > 0;

    // Unavailabilities per day
    const unavailByDay = useMemo(() => {
        const map = new Map<string, AvailabilityDto[]>();
        for (const day of days) map.set(dayKey(day), []);
        for (const a of availabilities) {
            if (a.type !== "UNAVAILABLE") continue;
            const s = new Date(a.startAt);
            const e = new Date(a.endAt);
            for (const day of days) {
                const ds = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                const de = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
                if (s < de && e > ds) {
                    map.get(dayKey(day))!.push(a);
                }
            }
        }
        return map;
    }, [availabilities, days]);

    // Conflicts per day
    const conflictsByDay = useMemo(() => {
        const map = new Map<string, ConflictSummaryDto[]>();
        for (const day of days) map.set(dayKey(day), []);
        for (const c of conflicts) {
            const s = new Date(c.eventStartAt);
            const dk = dayKey(s);
            if (map.has(dk)) {
                map.get(dk)!.push(c);
            }
        }
        return map;
    }, [conflicts, days]);

    // Scrollbar compensation
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollbarWidth, setScrollbarWidth] = useState(0);
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        setScrollbarWidth(el.offsetWidth - el.clientWidth);
    }, [startHour, endHour]);

    // Current time line
    const [nowMinutes, setNowMinutes] = useState(() => minutesFromMidnight(new Date()));
    useEffect(() => {
        const interval = setInterval(() => setNowMinutes(minutesFromMidnight(new Date())), 60_000);
        return () => clearInterval(interval);
    }, []);

    const isCurrentWeek = days.some(d => isSameDay(d, today));
    const nowInRange = nowMinutes >= startMinutes && nowMinutes < endHour * 60;
    const nowTop = ((nowMinutes - startMinutes) / totalMinutes) * totalHeight;

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Day headers */}
            <div
                className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-blue-400/[0.07] bg-blue-500/[0.035] shrink-0"
                style={{ paddingRight: scrollbarWidth }}
            >
                <div className="border-r border-neutral-800/30" />
                {days.map((day, i) => {
                    const isToday = isSameDay(day, today);
                    const dayConflicts = conflictsByDay.get(dayKey(day)) ?? [];
                    const timeFmt = new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" });

                    return (
                        <div key={i} className={cn(
                            "py-2.5 text-center border-l border-neutral-800/30 relative",
                            isToday && "bg-indigo-500/10"
                        )}>
                            <div className="flex items-center justify-center gap-1.5">
                                <span className={cn(
                                    "text-[11px] font-semibold uppercase tracking-wide",
                                    isToday ? "text-indigo-400" : "text-neutral-500"
                                )}>
                                    {dayFmt.format(day)}
                                </span>
                                {dayConflicts.length > 0 && (() => {
                                    const unavailConflicts = dayConflicts.filter(c => c.conflictType === "UNAVAILABLE");
                                    const overlapConflicts = dayConflicts.filter(c => c.conflictType === "EVENT_OVERLAP");

                                    // Group UNAVAILABLE by player
                                    const byPlayer = new Map<string, { nickname: string; events: string[] }>();
                                    for (const c of unavailConflicts) {
                                        const key = c.steamId ?? "unknown";
                                        if (!byPlayer.has(key)) {
                                            byPlayer.set(key, { nickname: c.nickname ?? "?", events: [] });
                                        }
                                        const label = `${timeFmt.format(new Date(c.eventStartAt))} ${c.eventTitle}`;
                                        const entry = byPlayer.get(key)!;
                                        if (!entry.events.includes(label)) entry.events.push(label);
                                    }

                                    // Group EVENT_OVERLAP as pairs
                                    const overlapPairs: { eventA: string; eventB: string }[] = [];
                                    for (const c of overlapConflicts) {
                                        overlapPairs.push({
                                            eventA: c.eventTitle,
                                            eventB: c.sourceDescription ?? "?",
                                        });
                                    }

                                    const playerEntries = [...byPlayer.entries()];

                                    return (
                                        <div className="group/conflict relative">
                                            <div className="flex items-center gap-0.5">
                                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                <span className="text-[9px] font-bold text-amber-400 tabular-nums">{dayConflicts.length}</span>
                                            </div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[70] hidden group-hover/conflict:block">
                                                <div className="bg-[#141414] border border-neutral-700 rounded-xl w-[340px] overflow-hidden">
                                                    {/* Header */}
                                                    <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between">
                                                        <span className="text-[13px] font-bold text-neutral-100">{t("agenda.conflicts")}</span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                                            {dayConflicts.length}
                                                        </span>
                                                    </div>

                                                    {/* Availability conflicts */}
                                                    {byPlayer.size > 0 && (
                                                        <div className="px-5 pt-4 pb-3">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="w-1 h-3.5 rounded-full bg-orange-400 shrink-0" />
                                                                <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">{t("agenda.conflict_section_availability")}</span>
                                                            </div>
                                                            {playerEntries.map(([steamId, { nickname, events }], pi) => (
                                                                <div key={steamId}>
                                                                    {pi > 0 && <div className="border-t border-neutral-800/60 my-2.5" />}
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <div className="w-[5px] h-[5px] rounded-full bg-orange-400 shrink-0" />
                                                                        <span className="text-[11px] font-semibold text-orange-300">{nickname}</span>
                                                                    </div>
                                                                    <div className="pl-[13px] space-y-0.5">
                                                                        {events.map((ev, ei) => (
                                                                            <div key={ei} className="flex items-center gap-2">
                                                                                <div className="w-[3px] h-[3px] rounded-full bg-neutral-600 shrink-0" />
                                                                                <span className="text-[10px] text-neutral-400 truncate">{ev}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Separator between sections */}
                                                    {byPlayer.size > 0 && overlapPairs.length > 0 && (
                                                        <div className="border-t border-neutral-700/50 mx-5" />
                                                    )}

                                                    {/* Event conflicts */}
                                                    {overlapPairs.length > 0 && (
                                                        <div className="px-5 pt-4 pb-3">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="w-1 h-3.5 rounded-full bg-red-400 shrink-0" />
                                                                <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">{t("agenda.conflict_section_event")}</span>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                {overlapPairs.map((pair, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2">
                                                                        <div className="w-[3px] h-[3px] rounded-full bg-neutral-600 shrink-0" />
                                                                        <span className="text-[10px] text-neutral-300 truncate">{pair.eventA}</span>
                                                                        <span className="text-[10px] text-red-400/50 shrink-0">↔</span>
                                                                        <span className="text-[10px] text-neutral-300 truncate">{pair.eventB}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* All-day event banners */}
            {hasAllDay && (
                <div
                    className="border-b border-neutral-800 shrink-0"
                    style={{ paddingRight: scrollbarWidth }}
                >
                    {allDayRows.map((row, ri) => (
                        <div key={ri} className="grid grid-cols-[50px_repeat(7,1fr)] h-6">
                            <div className="border-r border-neutral-800/30" />
                            {days.map((_, di) => {
                                const item = row.find(r => r.startCol === di);
                                if (!item) {
                                    // Check if this cell is covered by a spanning event
                                    const covered = row.some(r => di > r.startCol && di < r.startCol + r.span);
                                    if (covered) return null;
                                    return <div key={di} className="border-l border-neutral-800/30" />;
                                }
                                return (
                                    <div
                                        key={di}
                                        className="border-l border-neutral-800/30 px-0.5 py-0.5"
                                        style={{ gridColumn: `${di + 2} / span ${item.span}` }}
                                    >
                                        <EventChip event={item.event} allDay onClick={() => onEventClick(item.event)} />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* Scrollable time grid */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="relative grid grid-cols-[50px_repeat(7,1fr)]" style={{ height: totalHeight }}>
                    {/* Current time indicator — uses same grid as columns for perfect alignment */}
                    {isCurrentWeek && nowInRange && (() => {
                        const todayIdx = days.findIndex(d => isSameDay(d, today));
                        if (todayIdx < 0) return null;
                        return (
                            <div className="absolute left-0 right-0 z-[2] pointer-events-none grid grid-cols-[50px_repeat(7,1fr)]"
                                style={{ top: nowTop }}>
                                <div />
                                {days.map((day, i) => (
                                    <div key={i} className="relative">
                                        {i === todayIdx && (
                                            <div className="absolute inset-x-0 flex items-center">
                                                <div className="w-[7px] h-[7px] rounded-full bg-red-500 -ml-[3px] shrink-0" />
                                                <div className="flex-1 h-[1.5px] bg-red-500/30" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                    {/* Hour labels */}
                    <div className="relative border-r border-neutral-800/30">
                        {hours.map(hour => (
                            <div key={hour} className="absolute right-0 pr-2 text-[10px] text-neutral-600 tabular-nums"
                                style={{ top: (hour - startHour) * HOUR_HEIGHT - 6 }}>
                                {String(hour % 24).padStart(2, "0")}:00
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    {days.map((day, di) => {
                        const dayEvents = timedByDay.get(dayKey(day)) ?? [];
                        const dayUnavailabilities = unavailByDay.get(dayKey(day)) ?? [];
                        const isToday = isSameDay(day, today);

                        return (
                            <div key={di} className={cn(
                                "relative",
                                isToday
                                    ? "border-x border-neutral-700/30 bg-indigo-500/[0.03]"
                                    : "border-l border-neutral-800/30"
                            )}>
                                {/* Unavailability blocks — always visible, behind events */}
                                {dayUnavailabilities.filter(a => a.type === "UNAVAILABLE").map((a, ai) => {
                                    const s = new Date(a.startAt);
                                    const e = new Date(a.endAt);
                                    const aStart = Math.max(minutesFromMidnight(s), startMinutes);
                                    const aEnd = Math.min(minutesFromMidnight(e) || endHour * 60, endHour * 60);
                                    if (aEnd <= aStart) return null;
                                    const uTop = ((aStart - startMinutes) / totalMinutes) * totalHeight;
                                    const uHeight = ((aEnd - aStart) / totalMinutes) * totalHeight;

                                    return (
                                        <div key={`unavail-${ai}`}
                                            onClick={isStaff && onUnavailClick ? () => onUnavailClick(a) : undefined}
                                            className={cn(
                                                "absolute left-0.5 right-0.5 z-[3] rounded-[3px] border border-orange-500/15 overflow-hidden bg-orange-400/[0.04] bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(251,191,36,0.06)_4px,rgba(251,191,36,0.06)_8px)]",
                                                isStaff && "cursor-pointer hover:border-orange-500/30 hover:bg-orange-400/[0.08] transition-colors"
                                            )}
                                            style={{ top: uTop, height: uHeight }}>
                                            <div className="px-1.5 py-0.5">
                                                <span className="text-[10px] font-semibold text-white/70 truncate block">{a.nickname}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {hours.map(hour => (
                                    <div key={hour} className="absolute left-0 right-0 border-t border-neutral-800/30"
                                        style={{ top: (hour - startHour) * HOUR_HEIGHT }} />
                                ))}

                                {(() => {
                                    const laid = layoutOverlappingEvents(dayEvents, startMinutes, endHour * 60, totalHeight, totalMinutes);
                                    const hasOverlaps = laid.some(l => l.maxDepth > 0);
                                    return (
                                        <div className={hasOverlaps ? "group/stack" : ""}>
                                            {laid.map(({ event, top, height, depth, maxDepth }) => (
                                                <div key={event.id}
                                                    className={cn(
                                                        "absolute transition-opacity duration-150",
                                                        maxDepth > 0 && "group-hover/stack:opacity-30 hover:!opacity-100"
                                                    )}
                                                    style={{
                                                        top,
                                                        height,
                                                        left: depth * STACK_OFFSET,
                                                        right: Math.max(2, 4 - depth * 2),
                                                        zIndex: 10 + depth,
                                                    }}>
                                                    <EventChip event={event} onClick={() => onEventClick(event)} textAlign={depth > 0 ? "bottom" : "top"} />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
