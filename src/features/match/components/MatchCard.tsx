import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, ChevronDown, Check, ClipboardCheck, Pencil, ExternalLink } from "lucide-react";
import type { MatchDto } from "@/api/types/match";

interface MatchCardProps {
    match: MatchDto;
    isStaff: boolean;
    editMode?: boolean;
    selected?: boolean;
    onToggleSelect?: (id: number) => void;
    onEdit?: (match: MatchDto) => void;
}

function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
        + " · "
        + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function getTimeUntil(iso: string): { value: number; unit: "hours" | "days"; urgency: "high" | "medium" | "low" } {
    const diff = new Date(iso).getTime() - Date.now();
    const totalHours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
    const days = Math.floor(totalHours / 24);
    if (totalHours < 24) return { value: totalHours, unit: "hours", urgency: "high" };
    if (days < 7)        return { value: days,       unit: "days",  urgency: "medium" };
    return                      { value: days,       unit: "days",  urgency: "low" };
}

export default function MatchCard({
    match,
    isStaff,
    editMode = false,
    selected = false,
    onToggleSelect,
    onEdit,
}: MatchCardProps) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

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

    const isScheduled  = match.status === "SCHEDULED";
    const isCompleted  = match.state === "COMPLETED";
    const isUpcoming   = match.state === "UPCOMING";
    const isToComplete = match.state === "TO_COMPLETE";

    const isCardClickable = editMode && isStaff && isScheduled && !!onToggleSelect;

    const handleCardClick = () => {
        if (editMode && isScheduled) onToggleSelect?.(match.id);
    };

    const borderClass = editMode && isScheduled && selected
        ? "border-indigo-500/40 bg-indigo-500/5"
        : isCardClickable
        ? "border-neutral-800 hover:border-neutral-700"
        : "border-neutral-800";

    const timeUntil = isUpcoming ? getTimeUntil(match.scheduledAt) : null;
    const timeUntilColor = timeUntil?.urgency === "high"
        ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
        : timeUntil?.urgency === "medium"
        ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
        : "text-neutral-500 bg-neutral-800/60 border-neutral-700/40";

    return (
        <div
            className={`bg-neutral-900/50 border rounded-xl p-4 transition-colors ${borderClass} ${isCardClickable ? "cursor-pointer" : ""}`}
            onClick={handleCardClick}
        >
            <div className="flex items-start gap-3">

                {/* Checkbox — SCHEDULED in edit mode only */}
                {editMode && isScheduled && isStaff && (
                    <div className="flex-shrink-0 pt-[3px]">
                        <div
                            onClick={e => { e.stopPropagation(); onToggleSelect?.(match.id); }}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                                selected
                                    ? "bg-indigo-600 border-indigo-600"
                                    : "border-neutral-600 hover:border-neutral-400"
                            }`}
                        >
                            {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                    </div>
                )}

                {/* Opponent logo */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                    {match.opponentLogo ? (
                        <img src={match.opponentLogo} alt={match.opponentName ?? "TBA"} className="w-full h-full object-contain p-1" />
                    ) : match.opponentName ? (
                        <span className="text-lg font-bold text-neutral-400">
                            {match.opponentName.charAt(0).toUpperCase()}
                        </span>
                    ) : (
                        <span className="text-sm font-bold text-neutral-600">?</span>
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
                        <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                            match.type === "OFFICIAL"
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        }`}>
                            {t(`matches.type_${match.type.toLowerCase()}`)}
                        </span>
                        {match.context && (
                            <span className="text-xs text-neutral-500">
                                {t(`matches.context_${match.context.toLowerCase()}`)}
                            </span>
                        )}
                        {match.level && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono font-bold">
                                {match.level}
                            </span>
                        )}
                    </div>

                    {match.competitionName && (
                        <p className="text-xs text-neutral-500 mb-1">
                            {match.competitionName}{match.competitionStage && ` · ${match.competitionStage}`}
                        </p>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDateTime(match.playedAt ?? match.scheduledAt)}</span>
                        </div>
                        {match.matchUrl && (
                            <a
                                href={match.matchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                <ExternalLink className="w-3 h-3" />
                                {t("matches.match_url_link")}
                            </a>
                        )}
                    </div>
                </div>

                {/* Right side */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">

                    {/* Time remaining badge — UPCOMING */}
                    {timeUntil && (
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${timeUntilColor}`}>
                            {t(timeUntil.unit === "hours" ? "matches.in_hours" : "matches.in_days", { count: timeUntil.value })}
                        </span>
                    )}

                    {/* Complete button — TO_COMPLETE, not in edit mode */}
                    {isToComplete && !editMode && isStaff && onEdit && (
                        <button
                            onClick={e => { e.stopPropagation(); onEdit(match); }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-colors"
                        >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            {t("matches.complete")}
                        </button>
                    )}

                    {/* Edit button — only in edit mode, for all statuses */}
                    {editMode && isStaff && onEdit && (
                        <button
                            onClick={e => { e.stopPropagation(); onEdit(match); }}
                            className="p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
                            title={t("matches.edit_match")}
                        >
                            <Pencil className="w-3 h-3" />
                        </button>
                    )}

                    {/* Result badge — static, uniform width */}
                    {match.result && (
                        <div className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold w-36 ${resultColor}`}>
                            <span className="tabular-nums">{ourWins}–{theirWins}</span>
                            <span>{t(`matches.result_${match.result.toLowerCase()}`)}</span>
                        </div>
                    )}

                </div>
            </div>

            {/* Expand trigger — bottom right, only when maps are available */}
            {canExpand && (
                <div className="flex justify-end mt-2">
                    <button
                        onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                        className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
                    >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                    </button>
                </div>
            )}

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
    );
}
