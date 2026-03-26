import { useTranslation } from "react-i18next";
import { Star, Layers, Bomb, MessageSquare } from "lucide-react";
import type { StratSummaryDto } from "@/api/types/stratbook";
import MapBadge from "@/shared/components/MapBadge";
import { getMapLabel } from "@/shared/config/gameConfig";

interface StratCardProps {
    strat: StratSummaryDto;
    onClick?: (strat: StratSummaryDto) => void;
    onToggleFavorite?: ((stratId: number) => void) | undefined;
    canFavorite?: boolean | undefined;
}

const SIDE_STYLES = {
    T:  "bg-amber-500/15 text-amber-300 border-amber-500/25",
    CT: "bg-blue-500/15 text-blue-300 border-blue-500/25",
};

const TYPE_STYLES: Record<string, string> = {
    DEFAULT:  "bg-neutral-700/30 text-neutral-300 border-neutral-600/30",
    EXECUTE:  "bg-red-500/10 text-red-400 border-red-500/20",
    FAKE:     "bg-purple-500/10 text-purple-400 border-purple-500/20",
    RUSH:     "bg-orange-500/10 text-orange-400 border-orange-500/20",
    CONTACT:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    RETAKE:   "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    SETUP:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STATUS_STYLES: Record<string, string> = {
    DRAFT:        "bg-neutral-800 text-neutral-400 border-neutral-700",
    READY:        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    IN_PRACTICE:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
    DEPRECATED:   "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function StratCard({ strat, onClick, onToggleFavorite, canFavorite }: StratCardProps) {
    const { t } = useTranslation();

    return (
        <div
            onClick={() => onClick?.(strat)}
            className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 transition-colors cursor-pointer hover:bg-neutral-800/40"
        >
            <div className="flex gap-4">
                <MapBadge map={strat.map} size="card" />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                    {/* Name + counters */}
                    <div className="flex items-center gap-3 mb-1">
                        <p className="text-base font-semibold text-white truncate">{strat.name}</p>
                        <div className="flex items-center gap-3 shrink-0">
                            {strat.phaseCount > 0 && (
                                <span className="flex items-center gap-1 text-xs text-neutral-400 font-medium">
                                    <Layers className="w-3.5 h-3.5" />
                                    {strat.phaseCount}
                                </span>
                            )}
                            {strat.utilityCount > 0 && (
                                <span className="flex items-center gap-1 text-xs text-neutral-400 font-medium">
                                    <Bomb className="w-3.5 h-3.5" />
                                    {strat.utilityCount}
                                </span>
                            )}
                            {strat.noteCount > 0 && (
                                <span className="flex items-center gap-1 text-xs text-neutral-400 font-medium">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {strat.noteCount}
                                </span>
                            )}
                        </div>
                    </div>

                    {strat.description && (
                        <p className="text-xs text-neutral-500 line-clamp-1 mb-2">{strat.description}</p>
                    )}

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] border font-bold uppercase ${SIDE_STYLES[strat.side]}`}>
                            {strat.side}
                        </span>

                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${TYPE_STYLES[strat.type] ?? TYPE_STYLES.DEFAULT}`}>
                            {t(`stratbook.type_${strat.type.toLowerCase()}`)}
                        </span>

                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800/60 text-neutral-500 font-medium">
                            {getMapLabel(strat.map)}
                        </span>

                        {strat.callName && (
                            <span className="text-[10px] font-mono font-semibold text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-800/60">
                                {strat.callName}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right side */}
                <div className="flex-shrink-0 flex items-center gap-3 self-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${STATUS_STYLES[strat.status]}`}>
                        {t(`stratbook.status_${strat.status.toLowerCase()}`)}
                    </span>

                    {canFavorite ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(strat.id); }}
                            className="p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                        >
                            <Star className={`w-4 h-4 ${strat.favorited ? "fill-amber-400 text-amber-400" : "text-neutral-600 hover:text-amber-400"}`} />
                        </button>
                    ) : strat.favorited ? (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
