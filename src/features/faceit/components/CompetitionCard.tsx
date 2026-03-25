import {
    Trophy, CheckCircle2, Loader, Calendar,
    Swords, Flame, GitBranch, Award, Undo2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import FaceitIcon from "@/shared/components/FaceitIcon";
import { format } from "date-fns";
import type { CompetitionCategory, CompetitionSummaryDto } from "@/api/types/faceit";
import type { UseFaceitImportReturn } from "../hooks/useFaceitImport";
import type { TeamMemberDto } from "@/api/types/team";
import { cn } from "@/design-system";

type Props = {
    competition: CompetitionSummaryDto;
    importedIds: Set<string>;
    importState: UseFaceitImportReturn;
    isStaff: boolean;
    corePlayers: TeamMemberDto[];
    onDeimport: (competitionId: string, matchIds: string[]) => void;
};

// ── Category visual config ────────────────────────────────────────────────────

type CategoryStyle = {
    icon: React.ElementType;
    bgClass: string;
    iconClass: string;
    badgeClass: string;
};

const CATEGORY_STYLES: Record<CompetitionCategory, CategoryStyle> = {
    ESEA_REGULAR_SEASON: {
        icon: Swords,
        bgClass: "bg-blue-500/10",
        iconClass: "text-blue-400",
        badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    ESEA_PLAYOFF: {
        icon: Flame,
        bgClass: "bg-rose-500/10",
        iconClass: "text-rose-400",
        badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    ESEA_QUALIFIER: {
        icon: GitBranch,
        bgClass: "bg-violet-500/10",
        iconClass: "text-violet-400",
        badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    },
    PLAYOFF: {
        icon: Flame,
        bgClass: "bg-rose-500/10",
        iconClass: "text-rose-400",
        badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    QUALIFIER: {
        icon: GitBranch,
        bgClass: "bg-violet-500/10",
        iconClass: "text-violet-400",
        badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    },
    CUP: {
        icon: Award,
        bgClass: "bg-amber-500/10",
        iconClass: "text-amber-400",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    CHAMPIONSHIP: {
        icon: Trophy,
        bgClass: "bg-orange-500/10",
        iconClass: "text-orange-400",
        badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatEpoch(epochSeconds: number): string {
    return format(new Date(epochSeconds * 1000), "MMM yyyy");
}

function PlayerTag({ player, participated }: { player: TeamMemberDto; participated: boolean }) {
    const label = player.faceitNickname ?? player.customUsername ?? player.nickname ?? "?";
    return (
        <span className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium transition-all shrink-0",
            participated
                ? "bg-orange-500/15 text-orange-400/90"
                : "bg-neutral-800/60 text-neutral-600 line-through decoration-neutral-700"
        )}>
            {label}
        </span>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CompetitionCard({
    competition, importedIds, importState, isStaff, corePlayers, onDeimport,
}: Props) {
    const { t } = useTranslation();

    const localImportedCount = competition.matchIds.filter(id => importedIds.has(id)).length;
    const importedMatchIds   = competition.matchIds.filter(id => importedIds.has(id));

    const isSelected       = importState.selected.has(competition.competitionId);
    const isDeimporting    = importState.deimportingId === competition.competitionId;
    const totalCount       = competition.matchCount + competition.upcomingCount;
    const isFullyDone      = totalCount > 0 && localImportedCount >= totalCount;
    const hasPartialImport = !isFullyDone && localImportedCount > 0;

    const style        = CATEGORY_STYLES[competition.category];
    const CategoryIcon = style.icon;
    const categoryLabel = t(`faceit.category_${competition.category}`);
    const subtitle = [competition.season, competition.region, competition.division].filter(Boolean).join(" · ");

    const participatingSet = new Set(competition.participatingSteamIds ?? []);

    const handleCardClick = () => {
        if (!isStaff || isFullyDone) return;
        importState.toggle(competition.competitionId);
    };

    const handleDeimport = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isDeimporting || importedMatchIds.length === 0) return;
        onDeimport(competition.competitionId, importedMatchIds);
    };

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                "group flex flex-col gap-3 px-5 py-4 rounded-xl border transition-all",
                isFullyDone
                    ? "border-neutral-800 bg-neutral-900/40 cursor-default"
                    : isSelected && isStaff
                        ? "border-indigo-500/40 bg-indigo-500/8 cursor-pointer"
                        : isStaff
                            ? "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-800/30 cursor-pointer"
                            : "border-neutral-800 bg-neutral-900/60 cursor-default"
            )}
        >
            {/* Main row */}
            <div className="flex items-center gap-4">
                {/* Checkbox */}
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {isFullyDone ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                    ) : isStaff ? (
                        <div className={cn(
                            "w-4 h-4 rounded border-2 transition-colors",
                            isSelected ? "bg-indigo-500 border-indigo-500" : "border-neutral-600"
                        )} />
                    ) : (
                        <div className="w-4 h-4 rounded border-2 border-neutral-800" />
                    )}
                </div>

                {/* Category icon */}
                <div className={cn("shrink-0 p-2 rounded-lg", style.bgClass)}>
                    <CategoryIcon className={cn("w-4 h-4", style.iconClass)} />
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">
                            {competition.competitionName ?? competition.competitionId}
                        </span>
                        {competition.isCurrent && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0 uppercase tracking-wide">
                                <FaceitIcon className="w-2.5 h-2.5" />
                                {t("faceit.current_season")}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {subtitle && <span className="text-xs text-neutral-500">{subtitle}</span>}
                        <span className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border",
                            style.badgeClass
                        )}>
                            {categoryLabel}
                        </span>
                    </div>
                </div>

                {/* Right: counts or imported state */}
                <div className="shrink-0 text-right space-y-0.5">
                    {isFullyDone ? (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-emerald-400">
                                {t("faceit.already_imported")}
                            </span>
                            {isStaff && (
                                <button
                                    type="button"
                                    onClick={handleDeimport}
                                    disabled={isDeimporting}
                                    title={t("faceit.deimport_button")}
                                    className={cn(
                                        "flex items-center justify-center w-7 h-7 rounded-lg border transition-all",
                                        "opacity-0 group-hover:opacity-100",
                                        isDeimporting
                                            ? "border-neutral-700 text-neutral-500 cursor-not-allowed"
                                            : "border-amber-500/30 text-amber-500/60 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50"
                                    )}
                                >
                                    {isDeimporting
                                        ? <Loader className="w-3.5 h-3.5 animate-spin" />
                                        : <Undo2 className="w-3.5 h-3.5" />
                                    }
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {competition.matchCount > 0 && (
                                <p className="text-sm font-semibold text-white">
                                    {competition.matchCount}
                                    <span className="text-xs font-normal text-neutral-500 ml-1">{t("faceit.match_count")}</span>
                                </p>
                            )}
                            {competition.upcomingCount > 0 && (
                                <p className="text-sm font-semibold text-amber-400">
                                    {competition.upcomingCount}
                                    <span className="text-xs font-normal text-neutral-500 ml-1">{t("faceit.upcoming_count")}</span>
                                </p>
                            )}
                            {hasPartialImport && (
                                <p className="text-[10px] text-emerald-500">
                                    {t("faceit.import_skipped", { count: localImportedCount })}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Footer: date range + player participation */}
            {(competition.firstMatchAt != null || corePlayers.length > 0) && (
                <div className="flex items-center justify-between gap-3 pl-9">
                    {competition.firstMatchAt != null ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>
                                {formatEpoch(competition.firstMatchAt)}
                                {competition.lastMatchAt != null &&
                                 competition.lastMatchAt !== competition.firstMatchAt && (
                                    <> – {formatEpoch(competition.lastMatchAt)}</>
                                )}
                            </span>
                        </div>
                    ) : (
                        <div />
                    )}

                    {corePlayers.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                            {corePlayers.map(player => (
                                <PlayerTag
                                    key={player.steamId}
                                    player={player}
                                    participated={participatingSet.has(player.steamId)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
