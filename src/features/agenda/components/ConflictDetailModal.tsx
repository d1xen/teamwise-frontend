import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Eye, CheckCircle, UserX, CalendarClock } from "lucide-react";
import { Button } from "@/design-system/components";
import type { ConflictSummaryDto } from "@/api/types/agenda";
import { acknowledgeConflict } from "@/api/endpoints/agenda.api";
import { toast } from "react-hot-toast";

interface ConflictDetailModalProps {
    conflict: ConflictSummaryDto;
    teamId: string;
    isStaff: boolean;
    onClose: () => void;
    onViewEvent: (eventId: number) => Promise<void>;
    onAcknowledged: () => void;
}

const LABEL = "text-[10px] font-medium text-neutral-500 uppercase tracking-wide";

export default function ConflictDetailModal({ conflict, teamId, isStaff, onClose, onViewEvent, onAcknowledged }: ConflictDetailModalProps) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [viewingEvent, setViewingEvent] = useState(false);

    const isUnavailable = conflict.conflictType === "UNAVAILABLE";
    const isAcknowledged = conflict.status === "ACKNOWLEDGED";

    const dateFmt = new Intl.DateTimeFormat(i18n.language, {
        weekday: "long", day: "numeric", month: "long",
    });
    const timeFmt = new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" });
    const detectedFmt = new Intl.DateTimeFormat(i18n.language, {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });

    const start = new Date(conflict.eventStartAt);
    const end = new Date(conflict.eventEndAt);
    const detected = new Date(conflict.detectedAt);

    const handleAcknowledge = async () => {
        setLoading(true);
        try {
            await acknowledgeConflict(teamId, conflict.id);
            toast.success(t("agenda.conflict_acknowledged_toast"));
            onAcknowledged();
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/85" onClick={onClose} />
            <div className="relative bg-[#141414] border border-neutral-800 rounded-xl w-[420px] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isUnavailable
                            ? <UserX className="w-4.5 h-4.5 text-orange-400 shrink-0" />
                            : <CalendarClock className="w-4.5 h-4.5 text-red-400 shrink-0" />
                        }
                        <div>
                            <h2 className="text-sm font-bold text-neutral-100">
                                {t(isUnavailable ? "agenda.conflict_section_availability" : "agenda.conflict_section_event")}
                            </h2>
                            {isAcknowledged && (
                                <span className="text-[10px] text-neutral-500">{t("agenda.conflict_acknowledged")}</span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {/* Event info */}
                    <div>
                        <span className={LABEL}>{t("agenda.conflict_event")}</span>
                        <div className="mt-1.5 bg-neutral-900/60 border border-neutral-800 rounded-lg px-3.5 py-2.5">
                            <p className="text-sm font-medium text-neutral-100">{conflict.eventTitle}</p>
                            <p className="text-[11px] text-neutral-400 mt-1 capitalize">
                                {dateFmt.format(start)} · {timeFmt.format(start)} — {timeFmt.format(end)}
                            </p>
                            <span className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase text-neutral-400 bg-neutral-800 border border-neutral-700/50">
                                {t(`agenda.event_type.${conflict.eventType}`)}
                            </span>
                        </div>
                    </div>

                    {/* Conflict-specific info */}
                    {isUnavailable ? (
                        <>
                            <div>
                                <span className={LABEL}>{t("agenda.conflict_player")}</span>
                                <p className="text-sm text-neutral-200 mt-1">{conflict.nickname}</p>
                            </div>
                            {conflict.sourceDescription && (
                                <div>
                                    <span className={LABEL}>{t("agenda.conflict_reason")}</span>
                                    <p className="text-sm text-neutral-400 mt-1">{conflict.sourceDescription}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                            <span className={LABEL}>{t("agenda.conflict_source_event")}</span>
                            <div className="mt-1.5 bg-neutral-900/60 border border-neutral-800 rounded-lg px-3.5 py-2.5">
                                <p className="text-sm font-medium text-neutral-100">{conflict.sourceDescription}</p>
                            </div>
                        </div>
                    )}

                    {/* Detected date */}
                    <div>
                        <span className={LABEL}>{t("agenda.conflict_detected")}</span>
                        <p className="text-[11px] text-neutral-500 mt-1">{detectedFmt.format(detected)}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-3.5 border-t border-neutral-800 flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={viewingEvent}
                        onClick={async () => {
                            setViewingEvent(true);
                            await onViewEvent(conflict.eventId);
                            onClose();
                        }}
                    >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        {t("agenda.conflict_view_event")}
                    </Button>

                    {isStaff && !isAcknowledged && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAcknowledge}
                            disabled={loading}
                        >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            {t("agenda.conflict_acknowledge")}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
