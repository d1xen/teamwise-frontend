import { useState, useRef, useEffect, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/design-system";

interface DatePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOffset(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function formatDisplay(value: string): string {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function DatePicker({ value, onChange, placeholder = "Sélectionner", className }: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const today = new Date();
    const parsed = value ? new Date(value + "T00:00:00") : null;
    const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

    const updatePos = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.left });
    }, []);

    useEffect(() => {
        if (!open) return;
        updatePos();
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open, updatePos]);

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstOffset = getFirstDayOffset(viewYear, viewMonth);
    const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const navigate = (dir: -1 | 1) => {
        let m = viewMonth + dir;
        let y = viewYear;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setViewMonth(m);
        setViewYear(y);
    };

    const selectDay = (day: number) => {
        const val = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        onChange(val);
        setOpen(false);
    };

    return (
        <div className={cn("relative", className)}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full h-8 flex items-center gap-2 text-sm bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-2.5 outline-none hover:border-neutral-600 focus:border-indigo-500/50 transition-colors cursor-pointer"
            >
                <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className={value ? "text-neutral-100" : "text-neutral-600"}>
                    {value ? formatDisplay(value) : placeholder}
                </span>
            </button>

            {open && (
                <div
                    ref={ref}
                    className="fixed z-[70] bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl shadow-black/50 p-3 w-[260px]"
                    style={{ top: pos.top, left: pos.left }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <button type="button" onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-semibold text-neutral-200 capitalize">{monthLabel}</span>
                        <button type="button" onClick={() => navigate(1)} className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 mb-1">
                        {DAYS.map(d => (
                            <div key={d} className="text-center text-[9px] font-semibold text-neutral-600 uppercase py-1">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {Array.from({ length: firstOffset }, (_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const isSelected = dayStr === value;
                            const isToday = dayStr === todayStr;

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => selectDay(day)}
                                    className={cn(
                                        "w-8 h-8 mx-auto rounded-lg text-xs font-medium transition-colors",
                                        isSelected
                                            ? "bg-indigo-500 text-white"
                                            : isToday
                                                ? "text-indigo-400 hover:bg-neutral-800"
                                                : "text-neutral-300 hover:bg-neutral-800"
                                    )}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
