import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ExternalLink, Pencil, Trash2, Trophy, RefreshCw, CheckCircle2, ClipboardEdit } from "lucide-react";
import FaceitIcon from "@/shared/components/FaceitIcon";
import type { MatchDto, UpdateMatchRequest, UpdateMapScoreRequest } from "@/api/types/match";
import type { NoteDto } from "@/api/types/common";
import type { Game } from "@/api/types/team";
import { getMatch, updateMatch as updateMatchApi, updateMapScore as updateMapScoreApi, deleteMatch as deleteMatchApi, syncMatch as syncMatchApi, getMatchNotes, addMatchNote, deleteMatchNote } from "@/api/endpoints/match.api";
import { invalidateMatchSummary } from "@/features/match/hooks/useMatchSummary";
import { invalidateCompetitions } from "@/features/competition/hooks/useCompetitions";
import { useAuth } from "@/contexts/auth/useAuth";
import MetaInfo from "@/shared/components/MetaInfo";
import InlineLoader from "@/shared/components/InlineLoader";
import ConfirmModal from "@/shared/components/ConfirmModal";
import NoteSection from "@/shared/components/NoteSection";
import EditMatchModal from "./EditMatchModal";

interface MatchDetailProps {
    matchId: number;
    teamTag: string;
    game: Game;
    isStaff: boolean;
    onBack: () => void;
    onDeleted: () => void;
}

export default function MatchDetail({ matchId, teamTag, game, isStaff, onBack, onDeleted }: MatchDetailProps) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { teamId } = useParams<{ teamId: string }>();
    const [match, setMatch] = useState<MatchDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [editCompleteMode, setEditCompleteMode] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [notes, setNotes] = useState<NoteDto[]>([]);
    const { user } = useAuth();

    const load = useCallback(async () => {
        try {
            const data = await getMatch(matchId);
            setMatch(data);
            getMatchNotes(matchId).then(setNotes).catch(() => {});
        } catch {
            toast.error(t("matches.load_error"));
        } finally {
            setIsLoading(false);
        }
    }, [matchId, t]);

    useEffect(() => { load(); }, [load]);

    const handleUpdateMatch = async (id: number, payload: UpdateMatchRequest) => {
        try {
            const updated = await updateMatchApi(id, payload);
            setMatch(updated);
            invalidateMatchSummary();
            invalidateCompetitions();
            return updated;
        } catch {
            toast.error(t("matches.update_error"));
            return null;
        }
    };

    const handleSaveMap = async (mId: number, mapId: number, payload: UpdateMapScoreRequest, silent?: boolean) => {
        try {
            await updateMapScoreApi(mId, mapId, payload);
            await load();
            invalidateMatchSummary();
            invalidateCompetitions();
            if (!silent) toast.success(t("matches.score_saved"));
            return true;
        } catch {
            if (!silent) toast.error(t("matches.score_error"));
            return false;
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteMatchApi(matchId);
            toast.success(t("matches.deleted"));
            invalidateMatchSummary();
            invalidateCompetitions();
            onDeleted();
        } catch {
            toast.error(t("matches.delete_error"));
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading || !match) return <InlineLoader />;

    if (showEdit) {
        return (
            <div className="space-y-6">
                <button onClick={() => { setShowEdit(false); load(); }} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    {t("common.back")}
                </button>
                <EditMatchModal
                    match={match}
                    teamTag={teamTag}
                    game={game}
                    onClose={() => { setShowEdit(false); setEditCompleteMode(false); load(); }}
                    onUpdateMatch={handleUpdateMatch}
                    onSaveMap={handleSaveMap}
                    completeMode={editCompleteMode}
                />
            </div>
        );
    }

    const dateFmt = new Intl.DateTimeFormat(i18n.language, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const timeFmt = new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" });
    const start = new Date(match.scheduledAt);
    const ourWins = match.maps.filter(m => (m.ourScore ?? 0) > (m.theirScore ?? 0)).length;
    const theirWins = match.maps.filter(m => (m.theirScore ?? 0) > (m.ourScore ?? 0)).length;
    const isFaceit = match.source === "FACEIT";
    const isOngoingManual = !isFaceit && match.state === "ONGOING";
    const canEdit = isStaff && !isFaceit;
    const canDelete = isStaff && !isFaceit;

    const resultColor = match.result === "WIN"
        ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
        : match.result === "LOSE"
            ? "text-red-400 bg-red-400/10 border-red-400/20"
            : match.result === "DRAW"
                ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                : "";

    return (
        <div className="space-y-6">
            {/* Back + actions */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    {t("common.back")}
                </button>
                <div className="ml-auto flex items-center gap-2">
                    {isFaceit && isStaff && (
                        <button onClick={async () => {
                                setIsSyncing(true);
                                try {
                                    const result = await syncMatchApi(matchId);
                                    await load();
                                    if (result.status === "FINISHED") {
                                        toast.success(t("matches.sync_success"));
                                    } else {
                                        toast(t("matches.sync_not_finished"), { icon: "⏳" });
                                    }
                                } catch { toast.error(t("matches.sync_error")); }
                                finally { setIsSyncing(false); }
                            }}
                            disabled={isSyncing}
                            className="px-3 py-1.5 rounded-[4px] bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50">
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                            {t("matches.sync")}
                        </button>
                    )}
                    {canEdit && (
                        <button onClick={() => setShowEdit(true)}
                            className="px-3 py-1.5 rounded-[4px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5" />
                            {t("common.edit")}
                        </button>
                    )}
                    {canDelete && (
                        <button onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}
                            className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main card */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase ${
                        match.type === "OFFICIAL"
                            ? "bg-blue-500/15 text-blue-300 border-blue-500/25"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/25"
                    }`}>
                        {t(`matches.type_${match.type.toLowerCase()}`)}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase bg-neutral-800 text-neutral-300 border-neutral-700 font-mono">
                        {match.format}
                    </span>
                    {isFaceit && (
                        <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            <FaceitIcon className="w-2.5 h-2.5" />
                        </span>
                    )}
                </div>

                {/* Opponent + result */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                        {match.opponentLogo && !logoError ? (
                            <img src={match.opponentLogo} alt={match.opponentName ?? ""} className="w-full h-full object-cover" onError={() => setLogoError(true)} />
                        ) : (
                            <span className="text-lg font-black text-neutral-600">{(match.opponentName ?? "?").slice(0, 2).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-xl font-bold text-white truncate">{match.opponentName ?? t("matches.tba")}</p>
                            {match.matchUrl && (
                                <a href={match.matchUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors shrink-0">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                        {match.competitionName && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Trophy className="w-3 h-3 text-amber-500/70" />
                                {match.competitionId ? (
                                    <button
                                        onClick={() => navigate(`/team/${teamId}/competitions/${match.competitionId}`)}
                                        className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors text-left"
                                    >
                                        {match.competitionName}
                                        {match.competitionStage && <span className="text-neutral-600"> · {match.competitionStage}</span>}
                                    </button>
                                ) : (
                                    <span className="text-[11px] text-neutral-500">
                                        {match.competitionName}
                                        {match.competitionStage && <span className="text-neutral-600"> · {match.competitionStage}</span>}
                                    </span>
                                )}
                            </div>
                        )}
                        <p className="text-xs text-neutral-400 capitalize mt-0.5">{dateFmt.format(start)} · <span className="text-neutral-500 tabular-nums">{timeFmt.format(start)}</span></p>
                    </div>
                    {match.result && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-base font-bold shrink-0 ${resultColor}`}>
                            {match.forfeit ? (
                                <span>{t(match.result === "WIN" ? "matches.forfeit_win" : "matches.forfeit_lose")}</span>
                            ) : (
                                <>
                                    <span className="tabular-nums">{ourWins}–{theirWins}</span>
                                    <span>{t(`matches.result_${match.result.toLowerCase()}`)}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Status hints */}
                {match.state === "TO_COMPLETE" && (
                    <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2 mt-4">
                        <p className="text-xs text-amber-400 font-medium">{t("matches.to_complete_hint")}</p>
                    </div>
                )}
                {match.state === "UPCOMING" && (
                    <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 px-3 py-2 mt-4">
                        <p className="text-xs text-blue-400 font-medium">{t("matches.upcoming_hint")}</p>
                    </div>
                )}

                {/* Meta */}
                <div className="mt-4 pt-3 border-t border-neutral-800/60">
                    <MetaInfo createdAt={match.createdAt} updatedAt={match.updatedAt}
                        createdBy={match.createdByNickname} updatedBy={match.updatedByNickname} />
                </div>

                {/* Primary action — contextual next step */}
                {canEdit && isOngoingManual && (
                    <div className="mt-4 pt-3 border-t border-neutral-800/60 flex justify-center">
                        <button onClick={() => { setEditCompleteMode(true); setShowEdit(true); }}
                            className="px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium transition-colors flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {t("matches.mark_completed")}
                        </button>
                    </div>
                )}
                {canEdit && match.state === "TO_COMPLETE" && (
                    <div className="mt-4 pt-3 border-t border-neutral-800/60 flex justify-center">
                        <button onClick={() => { setEditCompleteMode(true); setShowEdit(true); }}
                            className="px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium transition-colors flex items-center gap-2">
                            <ClipboardEdit className="w-4 h-4" />
                            {t("matches.complete")}
                        </button>
                    </div>
                )}
            </div>

            {/* Maps */}
            {match.maps.length > 0 && (
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-3">{t("matches.maps")}</h3>
                    <div className="space-y-1.5">
                        {match.maps.map((m, i) => {
                            const hasScore = m.ourScore != null;
                            const won = hasScore && (m.ourScore ?? 0) > (m.theirScore ?? 0);
                            return (
                                <div key={m.id} className="flex items-center justify-between text-sm py-2 px-4 rounded-lg bg-neutral-800/50">
                                    <span className="text-neutral-400">{m.mapName ? m.mapName.replace("de_", "").charAt(0).toUpperCase() + m.mapName.replace("de_", "").slice(1) : `Map ${i + 1}`}</span>
                                    {hasScore ? (
                                        <span className={`tabular-nums font-bold ${won ? "text-emerald-400" : "text-red-400"}`}>
                                            {m.ourScore} – {m.theirScore}
                                        </span>
                                    ) : (
                                        <span className="text-neutral-600">—</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Match notes field */}
            {match.notes && (
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-2">Notes</h3>
                    <p className="text-sm text-neutral-400 whitespace-pre-line">{match.notes}</p>
                </div>
            )}

            <NoteSection
                notes={notes}
                onAdd={async (content) => {
                    const n = await addMatchNote(matchId, content);
                    setNotes(prev => [n, ...prev]);
                    return n;
                }}
                onDelete={async (noteId) => {
                    await deleteMatchNote(matchId, noteId);
                    setNotes(prev => prev.filter(n => n.id !== noteId));
                }}
                canAdd={isStaff}
                currentSteamId={user?.steamId ?? ""}
                maxNotes={10}
            />

            {showDeleteConfirm && (
                <ConfirmModal
                    title={t("common.delete")}
                    description={`${t("common.delete")} vs ${match.opponentName ?? "TBD"} ?`}
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
