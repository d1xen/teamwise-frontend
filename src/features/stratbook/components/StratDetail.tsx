import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
    ArrowLeft, Star, Megaphone, Layers,
    ExternalLink,
} from "lucide-react";
import type { StratDto, CreateStratRequest } from "@/api/types/stratbook";
import { getStrat, updateStrat as updateStratApi, duplicateStrat, deleteStrat, addStratNote, deleteStratNote, toggleFavorite } from "@/api/endpoints/stratbook.api";
import { useAuth } from "@/contexts/auth/useAuth";
import ConfirmModal from "@/shared/components/ConfirmModal";
import MetaInfo from "@/shared/components/MetaInfo";
import InlineLoader from "@/shared/components/InlineLoader";
import NoteSection from "@/shared/components/NoteSection";
import MapBadge from "@/shared/components/MapBadge";
import StratForm from "./StratForm";
import DropdownMenu from "@/shared/components/DropdownMenu";
import type { DropdownMenuItem } from "@/shared/components/DropdownMenu";

interface StratDetailProps {
    stratId: number;
    isStaff: boolean;
    isIgl: boolean;
    currentSteamId: string;
    onBack: () => void;
    onDeleted: () => void;
}

const SIDE_STYLES = {
    T:  "bg-amber-500/15 text-amber-300 border-amber-500/25",
    CT: "bg-blue-500/15 text-blue-300 border-blue-500/25",
};

const TYPE_STYLES: Record<string, string> = {
    DEFAULT: "bg-neutral-700/30 text-neutral-300 border-neutral-600/30",
    EXECUTE: "bg-red-500/10 text-red-400 border-red-500/20",
    FAKE:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    RUSH:    "bg-orange-500/10 text-orange-400 border-orange-500/20",
    CONTACT: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    RETAKE:  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    SETUP:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STATUS_STYLES: Record<string, string> = {
    DRAFT:       "bg-neutral-800 text-neutral-400 border-neutral-700",
    READY:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    IN_PRACTICE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    DEPRECATED:  "bg-red-500/10 text-red-400 border-red-500/20",
};

const PHASE_LABELS: Record<string, string> = {
    SETUP: "Setup", MID_ROUND: "Mid Round", EXECUTE: "Execute", POST_PLANT: "Post Plant",
};

const UTIL_STYLES: Record<string, string> = {
    SMOKE: "bg-neutral-500/15 text-neutral-300 border-neutral-500/25",
    FLASH: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
    MOLLY: "bg-orange-500/15 text-orange-300 border-orange-500/25",
    HE:    "bg-red-500/15 text-red-300 border-red-500/25",
};

export default function StratDetail({ stratId, isStaff, isIgl, currentSteamId, onBack, onDeleted }: StratDetailProps) {
    const { t } = useTranslation();
    const [strat, setStrat] = useState<StratDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editing, setEditing] = useState(false);
    const { user } = useAuth();

    const load = useCallback(async () => {
        try {
            const data = await getStrat(stratId);
            setStrat(data);
        } catch {
            toast.error(t("stratbook.load_error"));
        } finally {
            setIsLoading(false);
        }
    }, [stratId, t]);

    useEffect(() => { load(); }, [load]);

    const handleToggleFavorite = async () => {
        if (!strat) return;
        const res = await toggleFavorite(strat.id);
        setStrat(prev => prev ? { ...prev, favorited: res.favorited } : null);
    };

    const handleStatusChange = async (status: string) => {
        if (!strat) return;
        try {
            const updated = await updateStratApi(strat.id, { status: status as StratDto["status"] });
            setStrat(updated);
            toast.success(t("stratbook.status_updated"));
        } catch { toast.error(t("common.error")); }
    };

    const handleDuplicate = async () => {
        if (!strat) return;
        await duplicateStrat(strat.id);
        toast.success(t("stratbook.duplicate_success"));
        onBack();
    };

    const handleDelete = async () => {
        if (!strat) return;
        await deleteStrat(strat.id);
        toast.success(t("stratbook.delete_success"));
        onDeleted();
    };

    const handleUpdate = async (payload: CreateStratRequest) => {
        if (!strat) return false;
        try {
            const updated = await updateStratApi(strat.id, payload);
            setStrat(updated);
            setEditing(false);
            toast.success(t("stratbook.update_success"));
            return true;
        } catch {
            toast.error(t("stratbook.update_error"));
            return false;
        }
    };

    const handleNoteAdd = async (content: string) => {
        if (!strat) throw new Error();
        const note = await addStratNote(strat.id, { content });
        setStrat(prev => prev ? { ...prev, notes: [note, ...prev.notes] } : null);
        return note;
    };

    const handleNoteDelete = async (noteId: number) => {
        if (!strat) return;
        await deleteStratNote(strat.id, noteId);
        setStrat(prev => prev ? { ...prev, notes: prev.notes.filter(n => n.id !== noteId) } : null);
    };

    if (isLoading || !strat) return <InlineLoader />;

    if (editing) {
        return (
            <StratForm
                initialData={strat}
                onBack={() => setEditing(false)}
                onSubmit={handleUpdate}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Back + actions bar */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    {t("common.back")}
                </button>
                <div className="ml-auto flex items-center gap-2">
                    {(isStaff || isIgl) ? (
                        <button onClick={handleToggleFavorite} className="p-2 rounded-lg hover:bg-neutral-800 transition-colors">
                            <Star className={`w-4 h-4 ${strat.favorited ? "fill-amber-400 text-amber-400" : "text-neutral-500 hover:text-amber-400"}`} />
                        </button>
                    ) : strat.favorited ? (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400 mx-2" />
                    ) : null}
                    {(() => {
                        const isOwnDraft = strat.createdBySteamId === currentSteamId && strat.status === "DRAFT";
                        const canEdit = isStaff || isOwnDraft;
                        const canDelete = isStaff || isOwnDraft;
                        const canPublish = isStaff || (isIgl && strat.status === "DRAFT");
                        const canChangeStatus = isStaff;
                        const items: DropdownMenuItem[] = [
                            ...(canEdit ? [{ label: t("common.edit"), onClick: () => setEditing(true) }] : []),
                            { label: t("stratbook.duplicate"), onClick: handleDuplicate },
                            ...(canPublish && strat.status === "DRAFT" ? [{ label: t("stratbook.publish"), onClick: () => handleStatusChange("READY") }] : []),
                            ...(canChangeStatus && strat.status !== "DRAFT" ? [
                                ...(strat.status !== "READY" ? [{ label: t("stratbook.status_ready"), onClick: () => handleStatusChange("READY") }] : []),
                                ...(strat.status !== "IN_PRACTICE" ? [{ label: t("stratbook.status_in_practice"), onClick: () => handleStatusChange("IN_PRACTICE") }] : []),
                                ...(strat.status !== "DEPRECATED" ? [{ label: t("stratbook.status_deprecated"), onClick: () => handleStatusChange("DEPRECATED") }] : []),
                                { label: t("stratbook.unpublish"), onClick: () => handleStatusChange("DRAFT") },
                            ] : []),
                            ...(canDelete ? [{ label: t("common.delete"), onClick: () => setShowDeleteConfirm(true), variant: 'danger' as const }] : []),
                        ];
                        return items.length > 0 ? <DropdownMenu items={items} /> : null;
                    })()}
                </div>
            </div>

            {/* Header card */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <MapBadge map={strat.map} size="lg" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h2 className="text-xl font-bold text-white">{strat.name}</h2>
                            <span className={`text-[10px] px-2 py-0.5 rounded-[4px] border font-bold uppercase ${SIDE_STYLES[strat.side]}`}>{strat.side}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${TYPE_STYLES[strat.type]}`}>{t(`stratbook.type_${strat.type.toLowerCase()}`)}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${STATUS_STYLES[strat.status]}`}>{t(`stratbook.status_${strat.status.toLowerCase()}`)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                            {strat.callName && (
                                <span className="flex items-center gap-1.5 text-purple-300/70">
                                    <Megaphone className="w-3.5 h-3.5" />
                                    <span className="font-mono font-semibold">{strat.callName}</span>
                                </span>
                            )}
                            <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{strat.phases.length} phases</span>
                            <span>{strat.utilities.length} utilities</span>
                        </div>
                        {strat.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {strat.tags.map(tag => (
                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-500">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Description / Objective / Conditions */}
                {(strat.description || strat.objective || strat.conditions) && (
                    <div className="mt-4 pt-4 border-t border-neutral-800/60 space-y-3">
                        {strat.objective && (
                            <div>
                                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">{t("stratbook.objective")}</p>
                                <p className="text-sm text-neutral-300">{strat.objective}</p>
                            </div>
                        )}
                        {strat.description && (
                            <div>
                                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">{t("stratbook.description")}</p>
                                <p className="text-sm text-neutral-400 whitespace-pre-line">{strat.description}</p>
                            </div>
                        )}
                        {strat.conditions && (
                            <div>
                                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">{t("stratbook.conditions")}</p>
                                <p className="text-sm text-neutral-500">{strat.conditions}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 pt-3 border-t border-neutral-800/60">
                    <MetaInfo createdAt={strat.createdAt} updatedAt={strat.updatedAt}
                        createdBy={strat.createdByNickname} updatedBy={strat.updatedByNickname} />
                </div>
            </div>

            {/* Phases */}
            {strat.phases.length > 0 && (
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        Phases
                    </h3>
                    <div className="space-y-4">
                        {strat.phases.map((phase) => (
                            <div key={phase.id} className="relative pl-6 border-l-2 border-neutral-700">
                                <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-neutral-700 border-2 border-[#141414]" />
                                <div className="mb-1">
                                    <span className="text-xs font-bold text-indigo-400 uppercase">{PHASE_LABELS[phase.phaseType] ?? phase.phaseType}</span>
                                </div>
                                {phase.description && <p className="text-sm text-neutral-300 whitespace-pre-line">{phase.description}</p>}
                                {phase.playerPositions && (
                                    <p className="text-xs text-neutral-500 mt-1 font-mono">{phase.playerPositions}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Utilities */}
            {strat.utilities.length > 0 && (
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Utilities</h3>
                    <div className="space-y-3">
                        {strat.utilities.map(u => (
                            <div key={u.id} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/30 border border-neutral-800/50">
                                <span className={`text-[10px] px-2 py-0.5 rounded-[4px] border font-bold uppercase shrink-0 mt-0.5 ${UTIL_STYLES[u.utilityType]}`}>
                                    {u.utilityType}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">{u.name}</p>
                                    <div className="text-xs text-neutral-500 space-y-0.5 mt-1">
                                        {u.position && <p><span className="text-neutral-600">From:</span> {u.position}</p>}
                                        {u.target && <p><span className="text-neutral-600">Target:</span> {u.target}</p>}
                                        {u.timing && <p><span className="text-neutral-600">Timing:</span> {u.timing}</p>}
                                        {u.description && <p className="text-neutral-400 mt-1">{u.description}</p>}
                                    </div>
                                </div>
                                {u.videoUrl && (
                                    <a href={u.videoUrl} target="_blank" rel="noopener noreferrer"
                                        className="p-2 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors shrink-0">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <NoteSection
                notes={strat.notes}
                onAdd={handleNoteAdd}
                onDelete={handleNoteDelete}
                canAdd={isStaff}
                currentSteamId={user?.steamId ?? ""}
                maxNotes={10}
            />

            {showDeleteConfirm && (
                <ConfirmModal
                    title={t("common.delete")}
                    description={`${t("common.delete")} "${strat.name}" ?`}
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
