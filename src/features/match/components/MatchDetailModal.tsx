import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { X, ExternalLink } from "lucide-react";
import type { MatchDto } from "@/api/types/match";
import type { Game } from "@/api/types/team";
import MetaInfo from "@/shared/components/MetaInfo";
import EditMatchModal from "./EditMatchModal";
import type { EditMatchModalProps } from "./EditMatchModal";

interface MatchDetailModalProps {
    match: MatchDto;
    teamTag: string;
    game: Game;
    isStaff: boolean;
    onClose: () => void;
    onUpdateMatch: EditMatchModalProps["onUpdateMatch"];
    onSaveMap: EditMatchModalProps["onSaveMap"];
    onDelete?: (matchId: number) => Promise<void>;
}

export default function MatchDetailModal({
    match, teamTag, game, isStaff, onClose, onUpdateMatch, onSaveMap, onDelete,
}: MatchDetailModalProps) {
    const { t, i18n } = useTranslation();
    const [showEdit, setShowEdit] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [logoError, setLogoError] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape" && !showEdit) onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose, showEdit]);

    const dateFmt = new Intl.DateTimeFormat(i18n.language, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const timeFmt = new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" });
    const start = new Date(match.scheduledAt);

    const resultColor = match.result === "WIN"
        ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
        : match.result === "LOSE"
            ? "text-red-400 bg-red-400/10 border-red-400/20"
            : match.result === "DRAW"
                ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                : "";

    const ourWins = match.maps.filter(m => (m.ourScore ?? 0) > (m.theirScore ?? 0)).length;
    const theirWins = match.maps.filter(m => (m.theirScore ?? 0) > (m.ourScore ?? 0)).length;
    const scoredMaps = match.maps.filter(m => m.ourScore != null);
    const canDelete = isStaff && (match.state === "UPCOMING" || match.state === "TO_COMPLETE");

    const handleDelete = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(match.id);
            toast.success(t("matches.deleted"));
            onClose();
        } catch {
            toast.error(t("common.error"));
        } finally {
            setIsDeleting(false);
        }
    };

    if (showEdit) {
        return (
            <EditMatchModal
                match={match}
                teamTag={teamTag}
                game={game}
                onClose={() => { setShowEdit(false); onClose(); }}
                onUpdateMatch={onUpdateMatch}
                onSaveMap={onSaveMap}
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
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase bg-blue-500/15 text-blue-300 border-blue-500/25">
                            {t(`matches.type_${match.type.toLowerCase()}`)}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase bg-neutral-800 text-neutral-300 border-neutral-700 font-mono">
                            {match.format}
                        </span>
                        {match.source === "FACEIT" && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">FACEIT</span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Opponent block — logo + name + result */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                            {match.opponentLogo && !logoError ? (
                                <img src={match.opponentLogo} alt={match.opponentName ?? ""} className="w-full h-full object-cover"
                                    onError={() => setLogoError(true)} />
                            ) : (
                                <span className="text-lg font-black text-neutral-600">
                                    {(match.opponentName ?? "?").slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-white truncate">{match.opponentName ?? t("matches.tba")}</p>
                            <p className="text-xs text-neutral-400 capitalize mt-0.5">{dateFmt.format(start)}</p>
                            <p className="text-xs text-neutral-500 tabular-nums">{timeFmt.format(start)}</p>
                        </div>
                        {match.result && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold shrink-0 ${resultColor}`}>
                                <span className="tabular-nums">{ourWins}–{theirWins}</span>
                                <span>{t(`matches.result_${match.result.toLowerCase()}`)}</span>
                            </div>
                        )}
                    </div>

                    {/* Status indicator */}
                    {match.state === "TO_COMPLETE" && (
                        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2">
                            <p className="text-xs text-amber-400 font-medium">{t("matches.to_complete_hint")}</p>
                        </div>
                    )}
                    {match.state === "UPCOMING" && (
                        <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 px-3 py-2">
                            <p className="text-xs text-blue-400 font-medium">{t("matches.upcoming_hint")}</p>
                        </div>
                    )}

                    {/* Competition */}
                    {match.competitionName && (
                        <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/50">
                                {match.competitionName}
                                {match.competitionStage && ` · ${match.competitionStage}`}
                            </span>
                        </div>
                    )}

                    {/* Match URL */}
                    {match.matchUrl && (
                        <a href={match.matchUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                            <ExternalLink className="w-3 h-3" />
                            {t("matches.match_url")}
                        </a>
                    )}

                    {/* Map scores */}
                    {scoredMaps.length > 0 && (
                        <div>
                            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">{t("matches.maps")}</p>
                            <div className="space-y-1">
                                {match.maps.map((m, i) => {
                                    const hasScore = m.ourScore != null;
                                    const won = hasScore && (m.ourScore ?? 0) > (m.theirScore ?? 0);
                                    return (
                                        <div key={m.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-neutral-800/50">
                                            <span className="text-neutral-400 w-20">{m.mapName ? m.mapName.replace("de_", "") : `Map ${i + 1}`}</span>
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

                    {/* Notes */}
                    {match.notes && (
                        <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line">{match.notes}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3">
                    <MetaInfo createdAt={match.createdAt} updatedAt={match.updatedAt}
                        createdBy={match.createdByNickname} updatedBy={match.updatedByNickname} />
                    {isStaff && (
                        <div className="flex items-center gap-2">
                            {canDelete && (
                                <button onClick={handleDelete} disabled={isDeleting}
                                    className="px-3 py-1.5 rounded-[4px] text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                                    {t("common.delete")}
                                </button>
                            )}
                            {match.state === "TO_COMPLETE" ? (
                                <button onClick={() => setShowEdit(true)}
                                    className="px-3 py-1.5 rounded-[4px] bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-colors">
                                    {t("matches.complete")}
                                </button>
                            ) : (
                                <button onClick={() => setShowEdit(true)}
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
