import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/design-system";
import type { EventDto } from "@/api/types/agenda";
import EventChip from "./EventChip";

interface MonthGridProps {
    currentDate: Date;
    events: EventDto[];
    onEventClick: (event: EventDto) => void;
}

function getMonthDays(date: Date): Date[][] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0

    const weeks: Date[][] = [];
    let current = new Date(year, month, 1 - startOffset);

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

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default function MonthGrid({ currentDate, events, onEventClick }: MonthGridProps) {
    const { t } = useTranslation();
    const today = new Date();
    const month = currentDate.getMonth();

    const weeks = useMemo(() => getMonthDays(currentDate), [currentDate]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, EventDto[]>();
        for (const event of events) {
            const s = new Date(event.startAt);
            const e = new Date(event.endAt);
            // Place event on each day it spans
            const cursor = new Date(s.getFullYear(), s.getMonth(), s.getDate());
            while (cursor <= e) {
                const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
                if (!map.has(key)) map.set(key, []);
                const arr = map.get(key)!;
                if (!arr.some(ev => ev.id === event.id)) arr.push(event);
                cursor.setDate(cursor.getDate() + 1);
            }
        }
        return map;
    }, [events]);

    return (
        <div className="flex flex-col flex-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-neutral-800">
                {DAY_KEYS.map(d => (
                    <div key={d} className="py-2 text-center text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        {t(`agenda.day_${d}`)}
                    </div>
                ))}
            </div>

            {/* Weeks */}
            <div className="grid flex-1" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
                {weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 border-b border-neutral-800/50 last:border-b-0">
                        {week.map((day, di) => {
                            const isToday = isSameDay(day, today);
                            const isCurrentMonth = day.getMonth() === month;
                            const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                            const dayEvents = eventsByDate.get(key) ?? [];
                            const maxShow = 3;

                            return (
                                <div
                                    key={di}
                                    className={cn(
                                        "border-r border-neutral-800/30 last:border-r-0 p-1 flex flex-col gap-0.5 min-h-[80px]",
                                        !isCurrentMonth && "opacity-30"
                                    )}
                                >
                                    <span className={cn(
                                        "text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded-full self-end",
                                        isToday ? "bg-indigo-500 text-white" : "text-neutral-400"
                                    )}>
                                        {day.getDate()}
                                    </span>
                                    {dayEvents.slice(0, maxShow).map(ev => (
                                        <EventChip key={ev.id} event={ev} compact={dayEvents.length > 2} onClick={() => onEventClick(ev)} />
                                    ))}
                                    {dayEvents.length > maxShow && (
                                        <span className="text-[9px] text-neutral-500 text-center">
                                            +{dayEvents.length - maxShow}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
