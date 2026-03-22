import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { X, Loader } from "lucide-react";
import MetaInfo from "@/shared/components/MetaInfo";
import { updateAvailability, deleteAvailability } from "@/api/endpoints/agenda.api";
import DatePicker from "@/design-system/components/DatePicker";
import TimePicker from "@/design-system/components/TimePicker";
import type { AvailabilityDto } from "@/api/types/agenda";
import { cn } from "@/design-system";

interface UnavailDetailModalProps {
    unavail: AvailabilityDto;
    teamId: string;
    isStaff: boolean;
    onClose: () => void;
    onUpdated: () => void;
}

const LABEL = "text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1 block";
const INPUT_CLS = "w-full h-8 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-2.5 outline-none placeholder:text-neutral-600 focus:border-indigo-500/50 caret-indigo-400 transition-colors";

function toDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTime(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function UnavailDetailModal({ unavail, teamId, isStaff, onClose, onUpdated }: UnavailDetailModalProps) {
    const { t, i18n } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [date, setDate] = useState(toDate(unavail.startAt));
    const [startTime, setStartTime] = useState(toTime(unavail.startAt));
    const [endTime, setEndTime] = useState(toTime(unavail.endAt));
    const [reason, setReason] = useState(unavail.reason ?? "");

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const start = new Date(unavail.startAt);
    const end = new Date(unavail.endAt);
    const dateFmt = new Intl.DateTimeFormat(i18n.language, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const timeFmt = new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const startAt = new Date(`${date}T${startTime}:00`).toISOString();
            const endAt = new Date(`${date}T${endTime}:00`).toISOString();
            await updateAvailability(teamId, unavail.id, {
                startAt,
                endAt,
                reason: reason.trim() || "",
            });
            toast.success(t("agenda.unavailability_updated"));
            onUpdated();
            onClose();
        } catch {
            toast.error(t("common.error"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteAvailability(teamId, unavail.id);
        } catch {
            // 404 = already deleted
        }
        toast.success(t("agenda.unavailability_deleted"));
        onUpdated();
        onClose();
        setIsDeleting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/85" onClick={onClose} />
            <div className="relative bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-sm mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                    <h3 className="text-sm font-semibold text-white">{t("agenda.unavail_detail")}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3">
                    {isEditing ? (
                        /* ── Edit mode ── */
                        <>
                            <div>
                                <label className={LABEL}>{unavail.nickname}</label>
                            </div>
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
                            <div>
                                <label className={LABEL}>{t("agenda.field_reason")}</label>
                                <input value={reason} onChange={e => setReason(e.target.value)}
                                    placeholder={t("agenda.reason_placeholder")} className={INPUT_CLS} />
                            </div>
                        </>
                    ) : (
                        /* ── Read mode ── */
                        <>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                                <p className="text-sm font-semibold text-white">{unavail.nickname}</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-300 capitalize">{dateFmt.format(start)}</p>
                                <p className="text-xs text-neutral-500 tabular-nums mt-0.5">{timeFmt.format(start)} – {timeFmt.format(end)}</p>
                            </div>
                            {unavail.reason && (
                                <div>
                                    <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-0.5">{t("agenda.field_reason")}</p>
                                    <p className="text-xs text-neutral-300">{unavail.reason}</p>
                                </div>
                            )}
                            {!unavail.reason && (
                                <p className="text-xs text-neutral-600 italic">{t("agenda.no_reason")}</p>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3">
                    <MetaInfo createdAt={unavail.createdAt} updatedAt={unavail.updatedAt}
                        createdBy={unavail.createdByNickname} />
                    {isStaff && (
                        <div className="flex items-center gap-2">
                            <button onClick={handleDelete} disabled={isDeleting || isSaving}
                                className="px-3 py-1.5 rounded-[4px] text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                                
                                {t("common.delete")}
                            </button>
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} disabled={isSaving}
                                        className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                                        {t("common.cancel")}
                                    </button>
                                    <button onClick={handleSave} disabled={isSaving}
                                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-[4px] bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-40 text-white text-xs font-semibold transition-colors">
                                        {isSaving && <Loader className="w-3 h-3 animate-spin" />}
                                        {t("common.save")}
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setIsEditing(true)}
                                    className="px-3 py-1.5 rounded-[4px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors">
                                    {t("common.edit")}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
