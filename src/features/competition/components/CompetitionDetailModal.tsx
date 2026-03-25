import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { X, ExternalLink, Calendar, DollarSign, Trophy } from "lucide-react";
import type { CompetitionDto, UpdateCompetitionRequest } from "@/api/types/competition";
import MetaInfo from "@/shared/components/MetaInfo";
import ConfirmModal from "@/shared/components/ConfirmModal";
import EditCompetitionModal from "./EditCompetitionModal";

interface CompetitionDetailModalProps {
    competition: CompetitionDto;
    isStaff: boolean;
    onClose: () => void;
    onUpdate: (id: number, payload: UpdateCompetitionRequest) => Promise<boolean>;
    onDelete: (id: number) => Promise<boolean>;
}

const STATUS_STYLES: Record<string, string> = {
    UPCOMING:  "bg-blue-500/15 text-blue-300 border-blue-500/25",
    ONGOING:   "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    COMPLETED: "bg-neutral-800 text-neutral-300 border-neutral-700",
    CANCELLED: "bg-red-500/15 text-red-300 border-red-500/25",
};

const TYPE_STYLES: Record<string, string> = {
    LEAGUE:     "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
    TOURNAMENT: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    CUP:        "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    LAN:        "bg-orange-500/15 text-orange-300 border-orange-500/25",
    QUALIFIER:  "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
    OTHER:      "bg-neutral-500/15 text-neutral-300 border-neutral-500/25",
};

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" });
}

export default function CompetitionDetailModal({
    competition, isStaff, onClose, onUpdate, onDelete,
}: CompetitionDetailModalProps) {
    const { t } = useTranslation();
    const [showEdit, setShowEdit] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const c = competition;

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape" && !showEdit) onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose, showEdit]);

    const canDelete = isStaff && c.status !== "COMPLETED";

    const handleDelete = async () => {
        setIsDeleting(true);
        const ok = await onDelete(c.id);
        setIsDeleting(false);
        if (ok) onClose();
    };

    if (showEdit) {
        return (
            <EditCompetitionModal
                competition={c}
                isStaff={isStaff}
                onClose={() => { setShowEdit(false); onClose(); }}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/85" onClick={onClose} />
            <div className="relative bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase ${TYPE_STYLES[c.type] ?? TYPE_STYLES.OTHER}`}>
                            {t(`competitions.type_${c.type.toLowerCase()}`)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase ${STATUS_STYLES[c.status] ?? STATUS_STYLES.UPCOMING}`}>
                            {t(`competitions.status_${c.status.toLowerCase()}`)}
                        </span>
                        {c.source === "FACEIT" && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">FACEIT</span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Name + stage */}
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                            {c.logoUrl ? (
                                <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                                <Trophy className="w-6 h-6 text-neutral-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-white truncate">{c.name}</p>
                            {c.stage && (
                                <p className="text-xs text-neutral-400 mt-0.5">{c.stage}</p>
                            )}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        {c.startDate ? (
                            <span>
                                {formatDate(c.startDate)}
                                {c.endDate && c.endDate !== c.startDate && (
                                    <> → {formatDate(c.endDate)}</>
                                )}
                            </span>
                        ) : (
                            <span className="text-neutral-600">{t("competitions.no_date")}</span>
                        )}
                    </div>

                    {/* Metadata badges */}
                    {(c.format || c.cashprize) && (
                        <div className="flex flex-wrap gap-2">
                            {c.format && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/50">
                                    {c.format}
                                </span>
                            )}
                            {c.cashprize && (
                                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                    <DollarSign className="w-2.5 h-2.5" />
                                    {c.cashprize}
                                </span>
                            )}
                        </div>
                    )}

                    {/* FACEIT metadata */}
                    {(c.season || c.region || c.division) && (
                        <div className="flex flex-wrap gap-1.5">
                            {c.season && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono font-semibold">{c.season}</span>
                            )}
                            {c.region && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono font-semibold">{c.region}</span>
                            )}
                            {c.division && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono font-semibold">{c.division}</span>
                            )}
                        </div>
                    )}

                    {/* URL */}
                    {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                            <ExternalLink className="w-3 h-3" />
                            {t("competitions.url")}
                        </a>
                    )}

                    {/* Notes */}
                    {c.notes && (
                        <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line">{c.notes}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3">
                    <MetaInfo createdAt={c.createdAt} updatedAt={c.updatedAt}
                        createdBy={c.createdByNickname} updatedBy={c.updatedByNickname} />
                    {isStaff && (
                        <div className="flex items-center gap-2">
                            {canDelete && (
                                <button onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}
                                    className="px-3 py-1.5 rounded-[4px] text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                                    {t("common.delete")}
                                </button>
                            )}
                            <button onClick={() => setShowEdit(true)}
                                className="px-3 py-1.5 rounded-[4px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors">
                                {t("common.edit")}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showDeleteConfirm && (
                <ConfirmModal
                    title={t("common.delete")}
                    description={t("competitions.delete_confirm", { name: c.name })}
                    confirmLabel={t("common.delete")}
                    cancelLabel={t("common.cancel")}
                    variant="danger"
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </div>
    );
}
