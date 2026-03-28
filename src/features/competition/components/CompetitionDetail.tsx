import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ArrowLeft, Pencil, Trash2, Calendar, DollarSign, Trophy, ExternalLink, CheckCircle2, Clock, UserCheck } from "lucide-react";
import FaceitIcon from "@/shared/components/FaceitIcon";
import type { CompetitionDto, UpdateCompetitionRequest } from "@/api/types/competition";
import type { NoteDto } from "@/api/types/common";
import { getCompetition, updateCompetition as updateApi, deleteCompetition as deleteApi, getCompetitionNotes, addCompetitionNote, deleteCompetitionNote } from "@/api/endpoints/competition.api";
import { useAuth } from "@/contexts/auth/useAuth";
import MetaInfo from "@/shared/components/MetaInfo";
import InlineLoader from "@/shared/components/InlineLoader";
import ConfirmModal from "@/shared/components/ConfirmModal";
import NoteSection from "@/shared/components/NoteSection";
import EditCompetitionModal from "./EditCompetitionModal";

interface CompetitionDetailProps {
    teamId: string | number;
    competitionId: number;
    isStaff: boolean;
    onBack: () => void;
    onDeleted: () => void;
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

export default function CompetitionDetail({ teamId, competitionId, isStaff, onBack, onDeleted }: CompetitionDetailProps) {
    const { t } = useTranslation();
    const [comp, setComp] = useState<CompetitionDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [notes, setNotes] = useState<NoteDto[]>([]);
    const { user } = useAuth();

    const load = useCallback(async () => {
        try {
            const data = await getCompetition(teamId, competitionId);
            setComp(data);
            getCompetitionNotes(teamId, competitionId).then(setNotes).catch(() => {});
        } catch {
            toast.error(t("competitions.load_error"));
        } finally {
            setIsLoading(false);
        }
    }, [teamId, competitionId, t]);

    useEffect(() => { load(); }, [load]);

    const handleUpdate = async (id: number, payload: UpdateCompetitionRequest) => {
        try {
            const updated = await updateApi(teamId, id, payload);
            setComp(updated);
            setShowEdit(false);
            toast.success(t("competitions.updated"));
            return true;
        } catch {
            toast.error(t("competitions.update_error"));
            return false;
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteApi(teamId, id);
            toast.success(t("competitions.deleted"));
            onDeleted();
            return true;
        } catch {
            toast.error(t("competitions.delete_error"));
            return false;
        }
    };

    if (isLoading || !comp) return <InlineLoader />;

    if (showEdit) {
        return (
            <div className="space-y-6">
                <button onClick={() => { setShowEdit(false); load(); }} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    {t("common.back")}
                </button>
                <EditCompetitionModal
                    competition={comp}
                    isStaff={isStaff}
                    onClose={() => { setShowEdit(false); load(); }}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            </div>
        );
    }

    const isFaceit = comp.source === "FACEIT";
    const canEdit = isStaff && !isFaceit;
    const canDelete = isStaff && !isFaceit && comp.status !== "COMPLETED";
    const isCompleted = comp.status === "COMPLETED";
    const canToggleStatus = isStaff;

    const handleToggleStatus = async () => {
        const newStatus = isCompleted ? "ONGOING" : "COMPLETED";
        try {
            await updateApi(teamId, comp.id, { status: newStatus });
            toast.success(t(isCompleted ? "competitions.marked_ongoing" : "competitions.marked_completed"));
            load();
        } catch { toast.error(t("competitions.update_error")); }
    };

    return (
        <div className="space-y-6">
            {/* Back + actions */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    {t("common.back")}
                </button>
                <div className="ml-auto flex items-center gap-2">
                    {canEdit && (
                        <button onClick={() => setShowEdit(true)}
                            className="px-3 py-1.5 rounded-[4px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5" />
                            {t("common.edit")}
                        </button>
                    )}
                    {canDelete && (
                        <button onClick={() => setShowDeleteConfirm(true)}
                            className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main card */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                {/* Badges + actions */}
                <div className="flex items-center gap-2 mb-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase ${TYPE_STYLES[comp.type] ?? TYPE_STYLES.OTHER}`}>
                        {t(`competitions.type_${comp.type.toLowerCase()}`)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase ${STATUS_STYLES[comp.status]}`}>
                        {t(`competitions.status_${comp.status.toLowerCase()}`)}
                    </span>
                    {comp.source === "FACEIT" && (
                        <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            <FaceitIcon className="w-2.5 h-2.5" />
                        </span>
                    )}
                    {canToggleStatus && (
                        <button onClick={handleToggleStatus}
                            className={`ml-auto px-3 py-1 rounded-lg border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                                isCompleted
                                    ? "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400"
                                    : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                            }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {t(isCompleted ? "competitions.mark_ongoing" : "competitions.mark_completed")}
                        </button>
                    )}
                </div>

                {/* Name + stage */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                        {comp.logoUrl ? (
                            <img src={comp.logoUrl} alt={comp.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <Trophy className="w-6 h-6 text-neutral-500" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-xl font-bold text-white truncate">{comp.name}</p>
                            {comp.url && (
                                <a href={comp.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors shrink-0">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                        {comp.stage && <p className="text-xs text-neutral-400 mt-0.5">{comp.stage}</p>}
                        {isFaceit && comp.organizerName && (
                            <p className="text-[11px] text-neutral-600 mt-0.5">
                                {t("competitions.organized_by")} {comp.organizerName}
                            </p>
                        )}
                    </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-4">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    {comp.startDate ? (
                        <span>{formatDate(comp.startDate)}{comp.endDate && comp.endDate !== comp.startDate && <> → {formatDate(comp.endDate)}</>}</span>
                    ) : (
                        <span className="text-neutral-600">{t("competitions.no_date")}</span>
                    )}
                </div>

                {/* Registration + Check-in */}
                {(comp.registrationDate || comp.checkInDate) && (
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-neutral-500">
                        {comp.registrationDate && (
                            <span className="flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-neutral-600" />
                                {t("competitions.registration")} {new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(comp.registrationDate))}
                            </span>
                        )}
                        {comp.checkInDate && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-500/70" />
                                {t("competitions.check_in")} {new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(comp.checkInDate))}
                            </span>
                        )}
                    </div>
                )}

                {/* Match record */}
                {comp.matchRecord && (comp.matchRecord.wins > 0 || comp.matchRecord.losses > 0) && (
                    <div className="flex items-center gap-3 mt-4 text-sm font-medium tabular-nums">
                        <span className="text-emerald-400">{comp.matchRecord.wins}W</span>
                        <span className="text-red-400">{comp.matchRecord.losses}L</span>
                        {comp.matchRecord.draws > 0 && (
                            <span className="text-neutral-500">{comp.matchRecord.draws}D</span>
                        )}
                    </div>
                )}

                {/* Metadata */}
                {(comp.format || comp.cashprize) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {comp.format && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/50">{comp.format}</span>
                        )}
                        {comp.cashprize && (
                            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                <DollarSign className="w-2.5 h-2.5" />{comp.cashprize}
                            </span>
                        )}
                    </div>
                )}

                {/* FACEIT tags */}
                {(comp.season || comp.region || comp.division || comp.category) && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {comp.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono font-semibold">{comp.category}</span>}
                        {comp.season && <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono font-semibold">{comp.season}</span>}
                        {comp.region && <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono font-semibold">{comp.region}</span>}
                        {comp.division && <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono font-semibold">{comp.division}</span>}
                    </div>
                )}

                {/* Notes */}
                {comp.notes && (
                    <div className="mt-4 pt-3 border-t border-neutral-800/60">
                        <p className="text-sm text-neutral-400 whitespace-pre-line">{comp.notes}</p>
                    </div>
                )}

                {/* Meta */}
                <div className="mt-4 pt-3 border-t border-neutral-800/60">
                    <MetaInfo createdAt={comp.createdAt} updatedAt={comp.updatedAt}
                        createdBy={comp.createdByNickname} updatedBy={comp.updatedByNickname} />
                </div>

            </div>

            <NoteSection
                notes={notes}
                onAdd={async (content) => {
                    const n = await addCompetitionNote(teamId, competitionId, content);
                    setNotes(prev => [n, ...prev]);
                    return n;
                }}
                onDelete={async (noteId) => {
                    await deleteCompetitionNote(teamId, competitionId, noteId);
                    setNotes(prev => prev.filter(n => n.id !== noteId));
                }}
                canAdd={isStaff}
                currentSteamId={user?.steamId ?? ""}
                maxNotes={10}
            />

            {showDeleteConfirm && (
                <ConfirmModal
                    title={t("common.delete")}
                    description={t("competitions.delete_confirm", { name: comp.name })}
                    confirmLabel={t("common.delete")}
                    cancelLabel={t("common.cancel")}
                    variant="danger"
                    onConfirm={async () => { await handleDelete(comp.id); }}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </div>
    );
}
