import { useState, useRef, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/design-system";

interface TimePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    step?: number;
}

function generateTimes(step: number): string[] {
    const times: string[] = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += step) {
            times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
    }
    return times;
}

export default function TimePicker({ value, onChange, placeholder = "Heure", className, step = 15 }: TimePickerProps) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const times = generateTimes(step);

    const updatePos = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.left });
    }, []);

    useEffect(() => {
        if (!open) return;
        updatePos();
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open, updatePos]);

    // Scroll to selected time when opened
    useEffect(() => {
        if (!open || !dropdownRef.current || !value) return;
        const idx = times.indexOf(value);
        if (idx >= 0) {
            const el = dropdownRef.current.children[idx] as HTMLElement;
            el?.scrollIntoView({ block: "center" });
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const select = (t: string) => {
        onChange(t);
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
                <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className={cn("tabular-nums", value ? "text-neutral-100" : "text-neutral-600")}>
                    {value || placeholder}
                </span>
            </button>

            {open && (
                <div
                    ref={dropdownRef}
                    className="fixed z-[70] bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl shadow-black/50 w-[100px] max-h-[200px] overflow-y-auto custom-scrollbar py-1"
                    style={{ top: pos.top, left: pos.left }}
                >
                    {times.map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => select(t)}
                            className={cn(
                                "w-full px-3 py-1.5 text-xs tabular-nums text-left transition-colors",
                                t === value
                                    ? "bg-indigo-500/15 text-indigo-300 font-semibold"
                                    : "text-neutral-300 hover:bg-neutral-800"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
