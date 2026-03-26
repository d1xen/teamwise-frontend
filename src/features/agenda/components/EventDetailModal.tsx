import { useTranslation } from "react-i18next";
import { X, Users, Loader } from "lucide-react";
import MetaInfo from "@/shared/components/MetaInfo";
import { cn } from "@/design-system";
import type { EventDto, UpdateEventRequest } from "@/api/types/agenda";
import { TYPE_COLORS } from "@/features/agenda/constants/eventColors";
import { useState, useEffect } from "react";
import { deleteEvent, updateEvent } from "@/api/endpoints/agenda.api";
import { toast } from "react-hot-toast";
import DatePicker from "@/design-system/components/DatePicker";
import TimePicker from "@/design-system/components/TimePicker";

interface EventDetailModalProps {
    event: EventDto;
    teamId: string;
    isStaff: boolean;
    onClose: () => void;
    onDeleted: () => void;
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

export default function EventDetailModal({ event, teamId, isStaff, onClose, onDeleted }: EventDetailModalProps) {
    const { t, i18n } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Edit state
    const [title, setTitle] = useState(event.title);
    const [description, setDescription] = useState(event.description ?? "");
    const [date, setDate] = useState(toDate(event.startAt));
    const [startTime, setStartTime] = useState(toTime(event.startAt));
    const [endTime, setEndTime] = useState(toTime(event.endAt));

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const colors = TYPE_COLORS[event.type] ?? TYPE_COLORS.CUSTOM;
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);

    const dateFmt = new Intl.DateTimeFormat(i18n.language, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const timeFmt = new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" });

    const handleDelete = async () => {
        setIsDeleting(true);
        try { await deleteEvent(teamId, event.id); } catch { /* 404 ok */ }
        toast.success(t("agenda.event_deleted"));
        onDeleted();
        onClose();
        setIsDeleting(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const startAt = new Date(`${date}T${startTime}:00`).toISOString();
            const endAt = new Date(`${date}T${endTime}:00`).toISOString();
            const payload: UpdateEventRequest = {
                title: title.trim(),
                description: description.trim() || undefined,
                startAt,
                endAt,
            };
            await updateEvent(teamId, event.id, payload);
            toast.success(t("agenda.event_updated"));
            onDeleted(); // reload calendar
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
            <div className="relative bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase", colors)}>
                            {t(`agenda.event_type.${event.type}`)}
                        </span>
                        {event.source === "FACEIT" && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">FACEIT</span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {isEditing ? (
                        <>
                            <div>
                                <label className={LABEL}>{t("agenda.field_title")}</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className={INPUT_CLS} />
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
                                <label className={LABEL}>{t("agenda.field_description")}</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)}
                                    rows={2} className={cn(INPUT_CLS, "h-auto py-2 resize-none")} />
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-base font-bold text-white">
                                {event.match?.opponentName ? `vs ${event.match.opponentName}` : event.title}
                            </h2>

                            <div>
                                <p className="text-sm text-neutral-200 capitalize">{dateFmt.format(start)}</p>
                                <p className="text-xs text-neutral-400 tabular-nums">{timeFmt.format(start)} – {timeFmt.format(end)}</p>
                            </div>

                            {/* Match info */}
                            {event.match && (
                                <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg px-3.5 py-3 space-y-2.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase bg-neutral-800 border border-neutral-700/50 text-neutral-400">
                                            {t(`matches.type_${event.match.matchType.toLowerCase()}`)}
                                        </span>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase bg-neutral-800 border border-neutral-700/50 text-neutral-400">
                                            {event.match.format}
                                        </span>
                                        {event.match.competitionName && (
                                            <span className="text-[10px] text-neutral-500">{event.match.competitionName}</span>
                                        )}
                                        {event.match.result && (
                                            <span className={cn(
                                                "text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase",
                                                event.match.result === "WIN" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" :
                                                event.match.result === "LOSE" ? "bg-red-500/15 text-red-400 border border-red-500/25" :
                                                "bg-neutral-800 text-neutral-400 border border-neutral-700/50"
                                            )}>
                                                {t(`matches.result_${event.match.result.toLowerCase()}`)}
                                            </span>
                                        )}
                                    </div>
                                    {event.match.maps.some(m => m.ourScore != null) && (
                                        <div className="flex items-center gap-2">
                                            {event.match.maps.filter(m => m.ourScore != null).map(m => (
                                                <div key={m.id} className="text-center">
                                                    <p className="text-[9px] text-neutral-600 truncate max-w-[60px]">{m.mapName ?? `Map ${m.orderIndex}`}</p>
                                                    <p className="text-xs font-bold text-neutral-200 tabular-nums">{m.ourScore} - {m.theirScore}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {event.description && (
                                <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line">{event.description}</p>
                            )}

                            {/* Participants */}
                            {event.participants.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Users className="w-3.5 h-3.5 text-neutral-500" />
                                        <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                                            {t("agenda.participants")}
                                            {event.participantScope && event.participantScope !== "INDIVIDUAL"
                                                ? ` · ${t(`agenda.scope.${event.participantScope}`)}`
                                                : ` (${event.participants.length})`
                                            }
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {event.participants.map(p => (
                                            <span key={p.steamId} className={cn(
                                                "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                                                p.nickname === "Unknown"
                                                    ? "bg-neutral-900 text-neutral-600 border-neutral-800"
                                                    : "bg-neutral-800 text-neutral-300 border-neutral-700/50"
                                            )}>
                                                {p.nickname === "Unknown" ? t("agenda.former_member") : p.nickname}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}


                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3">
                    <MetaInfo createdAt={event.createdAt} updatedAt={event.updatedAt}
                        createdBy={event.createdByNickname} updatedBy={event.updatedByNickname} />
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
                                    <button onClick={handleSave} disabled={isSaving || !title.trim()}
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
