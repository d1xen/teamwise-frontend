import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { X, Loader } from "lucide-react";
import { createAvailability } from "@/api/endpoints/agenda.api";
import DatePicker from "@/design-system/components/DatePicker";
import TimePicker from "@/design-system/components/TimePicker";
import { cn } from "@/design-system";

interface AvailabilityModalProps {
    teamId: string;
    initialDate?: string | undefined;
    onClose: () => void;
    onCreated: () => void;
}

const LABEL = "text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1 block";
const INPUT_CLS = "w-full h-8 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-2.5 outline-none placeholder:text-neutral-600 focus:border-indigo-500/50 caret-indigo-400 transition-colors";

const DAYS_OF_WEEK = [
    { key: "MONDAY", short: "L" },
    { key: "TUESDAY", short: "M" },
    { key: "WEDNESDAY", short: "Me" },
    { key: "THURSDAY", short: "J" },
    { key: "FRIDAY", short: "V" },
    { key: "SATURDAY", short: "S" },
    { key: "SUNDAY", short: "D" },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5 group">
            <div className={cn("w-8 h-[18px] rounded-full relative transition-colors", checked ? "bg-indigo-500" : "bg-neutral-700")}>
                <div className={cn("absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform", checked ? "translate-x-[16px]" : "translate-x-[2px]")} />
            </div>
            <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}

export default function AvailabilityModal({ teamId, initialDate, onClose, onCreated }: AvailabilityModalProps) {
    const { t } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const [date, setDate] = useState(initialDate ?? "");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("18:00");
    const [reason, setReason] = useState("");
    const [recurring, setRecurring] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [weeks, setWeeks] = useState(4);

    const toggleDay = (day: string) => {
        setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const canSave = date && startTime && endTime && (!recurring || selectedDays.length > 0);

    const handleSave = async () => {
        if (!canSave) return;
        setIsSaving(true);
        try {
            const startAt = new Date(`${date}T${startTime}:00`).toISOString();
            const endAt = new Date(`${date}T${endTime}:00`).toISOString();

            await createAvailability(teamId, {
                startAt,
                endAt,
                reason: reason.trim() || undefined,
                recurringDays: recurring ? selectedDays : undefined,
                recurringWeeks: recurring ? weeks : undefined,
            });

            toast.success(t("agenda.unavailability_created"));
            onCreated();
            onClose();
        } catch {
            toast.error(t("common.error"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/85" onClick={onClose} />
            <div className="relative bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-sm mx-4">
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                    <h3 className="text-sm font-semibold text-white">{t("agenda.declare_unavailability")}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Date + times */}
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className={LABEL}>{t("agenda.field_date")}</label>
                            <DatePicker value={date} onChange={setDate} />
                        </div>
                        <div>
                            <label className={LABEL}>{t("agenda.field_start")}</label>
                            <TimePicker value={startTime} onChange={setStartTime} />
                        </div>
                        <div>
                            <label className={LABEL}>{t("agenda.field_end")}</label>
                            <TimePicker value={endTime} onChange={setEndTime} />
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className={LABEL}>{t("agenda.field_reason")}</label>
                        <input value={reason} onChange={e => setReason(e.target.value)} placeholder={t("agenda.reason_placeholder")} className={INPUT_CLS} />
                    </div>

                    {/* Recurrence */}
                    <Toggle checked={recurring} onChange={setRecurring} label={t("agenda.recurring_label")} />

                    {recurring && (
                        <div className="space-y-3 pl-1">
                            <div>
                                <label className={LABEL}>{t("agenda.recurring_days")}</label>
                                <div className="flex gap-1">
                                    {DAYS_OF_WEEK.map(d => (
                                        <button key={d.key} type="button" onClick={() => toggleDay(d.key)}
                                            className={cn(
                                                "w-8 h-8 rounded-lg text-[10px] font-bold border transition-colors",
                                                selectedDays.includes(d.key)
                                                    ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                                                    : "text-neutral-500 border-neutral-700/50 hover:text-neutral-300"
                                            )}>
                                            {d.short}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-neutral-400">{t("agenda.recurring_for")}</label>
                                <input type="number" min={1} max={52} value={weeks}
                                    onChange={e => setWeeks(parseInt(e.target.value) || 1)}
                                    className={cn(INPUT_CLS, "w-14 text-center")} />
                                <span className="text-xs text-neutral-500">{t("agenda.weeks")}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-800">
                    <button onClick={onClose} disabled={isSaving}
                        className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                        {t("common.cancel")}
                    </button>
                    <button onClick={handleSave} disabled={!canSave || isSaving}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-[4px] bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-40 text-white text-xs font-semibold transition-colors">
                        {isSaving && <Loader className="w-3 h-3 animate-spin" />}
                        {t("common.save")}
                    </button>
                </div>
            </div>
        </div>
    );
}
