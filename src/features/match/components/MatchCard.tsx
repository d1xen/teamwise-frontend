import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, ChevronDown, Check, ExternalLink, Trophy } from "lucide-react";
import FaceitIcon from "@/shared/components/FaceitIcon";
import { useCountdown } from "@/shared/hooks/useCountdown";
import type { MatchDto } from "@/api/types/match";

interface MatchCardProps {
    match: MatchDto;
    isStaff: boolean;
    editMode?: boolean;
    selected?: boolean;
    onToggleSelect?: (id: number) => void;
    onClick?: ((match: MatchDto) => void) | undefined;
}

function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
        + " · "
        + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function MatchCard({
    match,
    isStaff,
    editMode = false,
    selected = false,
    onToggleSelect,
    onClick,
}: MatchCardProps) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const [logoError, setLogoError] = useState(false);

    const resultColor = match.result === "WIN"
        ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
        : match.result === "LOSE"
        ? "text-red-400 bg-red-400/10 border-red-400/20"
        : match.result === "DRAW"
        ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
        : "";

    const ourWins   = match.maps.filter(m => (m.ourScore ?? 0) > (m.theirScore ?? 0)).length;
    const theirWins = match.maps.filter(m => (m.theirScore ?? 0) > (m.ourScore ?? 0)).length;

    const scoredMaps = match.maps.filter(m => m.ourScore != null);
    const canExpand  = !editMode && match.status === "COMPLETED" && scoredMaps.length > 0;

    const isFaceit     = match.source === "FACEIT";
    const isUpcoming   = match.state === "UPCOMING";

    const isCardClickable = true;

    const handleCardClick = () => {
        if (editMode && !isFaceit) {
            onToggleSelect?.(match.id);
        } else if (!editMode) {
            onClick?.(match);
        }
    };

    const borderClass = editMode && selected
        ? "border-indigo-500/40 bg-indigo-500/5"
        : isCardClickable
        ? "border-neutral-800 hover:border-neutral-700"
        : "border-neutral-800";

    const countdown = useCountdown(isUpcoming ? match.scheduledAt : null, t);
    const countdownColor = countdown?.urgency === "high"
        ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
        : countdown?.urgency === "medium"
        ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
        : "text-neutral-500 bg-neutral-800/60 border-neutral-700/40";

    return (
        <div className="relative">
            {/* Checkbox — absolute left, vertically centered */}
            {editMode && isStaff && (
                isFaceit ? (
                    <div className="absolute -left-7 top-1/2 -translate-y-1/2 z-10 group/tip">
                        <div className="w-5 h-5 rounded border-2 border-neutral-800 bg-neutral-900/50 cursor-not-allowed" />
                        <div className="absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-400 opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-50">
                            {t("matches.faceit_no_delete")}
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={e => { e.stopPropagation(); onToggleSelect?.(match.id); }}
                        className={`absolute -left-7 top-1/2 -translate-y-1/2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer z-10 ${
                            selected
                                ? "bg-indigo-600 border-indigo-600"
                                : "border-neutral-600 hover:border-neutral-400"
                        }`}
                    >
                        {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                )
            )}

            <div
                className={`bg-neutral-900/50 border rounded-xl p-4 transition-colors ${borderClass} ${isCardClickable ? "cursor-pointer" : ""}`}
                onClick={handleCardClick}
            >
            <div className="flex gap-3">

                {/* Opponent logo */}
                <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                    {match.opponentLogo && !logoError ? (
                        <img
                            src={match.opponentLogo}
                            alt={match.opponentName ?? "TBA"}
                            className="w-full h-full object-cover"
                            onError={() => setLogoError(true)}
                        />
                    ) : match.opponentName ? (
                        <span className="text-xl font-bold text-neutral-300 uppercase tracking-wide">
                            {match.opponentName.split(" ").map(w => w[0]).join("").slice(0, 3)}
                        </span>
                    ) : (
                        <span className="text-2xl font-bold text-neutral-600">?</span>
                    )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-base font-semibold truncate ${match.opponentName ? "text-white" : "text-neutral-500 italic"}`}>
                            {match.opponentName ?? t("matches.tba")}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono font-semibold">
                            {match.format}
                        </span>
                        {isFaceit && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border bg-orange-500/10 border-orange-500/20 text-orange-400">
                                <FaceitIcon className="w-2.5 h-2.5" />
                            </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                            match.type === "OFFICIAL"
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        }`}>
                            {t(`matches.type_${match.type.toLowerCase()}`)}
                        </span>
                        {match.matchUrl && (
                            <a href={match.matchUrl} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>

                    {match.competitionName && (
                        <div className="flex items-center gap-1.5 mb-1">
                            <Trophy className="w-3 h-3 text-amber-500/70" />
                            <span className="text-xs text-neutral-400">
                                {match.competitionName}
                            </span>
                            {match.competitionStage && (
                                <span className="text-xs text-neutral-600">· {match.competitionStage}</span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDateTime(match.scheduledAt)}</span>
                        {match.playedAt && match.status === "COMPLETED" && (
                            <>
                                <span className="text-neutral-700">→</span>
                                <span className="text-neutral-400">{formatTime(match.playedAt)}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right side — top-aligned badge */}
                <div className="flex-shrink-0 self-start mt-1">

                    {countdown && !countdown.isPast && countdown.label && (
                        <span className={`text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap ${countdownColor} ${countdown.isLive ? "font-mono font-bold tabular-nums" : "font-medium"}`}>
                            {countdown.label}
                        </span>
                    )}


                    {match.result && (
                        <button
                            onClick={canExpand ? (e) => { e.stopPropagation(); setExpanded(v => !v); } : undefined}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap ${resultColor} ${canExpand ? "cursor-pointer hover:brightness-125 transition-all" : ""}`}
                        >
                            {match.forfeit ? (
                                <span>{t(match.result === "WIN" ? "matches.forfeit_win" : "matches.forfeit_lose")}</span>
                            ) : (
                                <>
                                    <span className="tabular-nums">{ourWins}–{theirWins}</span>
                                    <span>{t(`matches.result_${match.result.toLowerCase()}`)}</span>
                                </>
                            )}
                            {canExpand && (
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                            )}
                        </button>
                    )}

                </div>
            </div>

            {/* Expanded: map details + notes */}
            {expanded && canExpand && (
                <div className="mt-2 pt-3 border-t border-neutral-800/60 space-y-3">
                    <div className="space-y-0.5">
                        {scoredMaps.map(m => {
                            const won  = (m.ourScore ?? 0) > (m.theirScore ?? 0);
                            const lost = (m.theirScore ?? 0) > (m.ourScore ?? 0);
                            return (
                                <div key={m.id} className="flex items-center gap-3 px-1 py-1.5 rounded-lg hover:bg-neutral-800/40 transition-colors">
                                    <span className="w-4 shrink-0 text-[10px] font-mono text-neutral-700 text-right">{m.orderIndex}</span>
                                    <span className="flex-1 text-sm text-neutral-400 font-medium truncate">
                                        {m.mapName ?? <span className="text-neutral-700 italic">{t("matches.map_unknown")}</span>}
                                    </span>
                                    <span className={`font-mono text-sm font-bold tabular-nums ${won ? "text-emerald-400" : lost ? "text-red-400" : "text-neutral-400"}`}>
                                        {m.ourScore} : {m.theirScore}
                                    </span>
                                    <span className={`w-5 shrink-0 text-[10px] font-black text-center ${won ? "text-emerald-500" : lost ? "text-red-500" : "text-neutral-600"}`}>
                                        {won ? "W" : lost ? "L" : "D"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {match.notes && (
                        <p className="text-xs text-neutral-500 border-t border-neutral-800/60 pt-3">{match.notes}</p>
                    )}
                </div>
            )}
        </div>
        </div>
    );
}
