import { useTranslation } from "react-i18next";
import { Calendar, ExternalLink, Trophy, DollarSign } from "lucide-react";
import type { CompetitionDto } from "@/api/types/competition";

interface CompetitionCardProps {
    competition: CompetitionDto;
    onClick?: (competition: CompetitionDto) => void;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
    UPCOMING:  "bg-blue-500/10 border-blue-500/20 text-blue-400",
    ONGOING:   "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    COMPLETED: "bg-neutral-800 border-neutral-700 text-neutral-400",
    CANCELLED: "bg-red-500/10 border-red-500/20 text-red-400",
};

const TYPE_STYLES: Record<string, string> = {
    LEAGUE:     "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    TOURNAMENT: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    CUP:        "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    LAN:        "bg-orange-500/10 border-orange-500/20 text-orange-400",
    QUALIFIER:  "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    OTHER:      "bg-neutral-500/10 border-neutral-500/20 text-neutral-400",
};

export default function CompetitionCard({ competition, onClick }: CompetitionCardProps) {
    const { t } = useTranslation();
    const c = competition;

    const borderClass = c.status === "ONGOING"
        ? "border-emerald-500/30"
        : "border-neutral-800";

    return (
        <div
            onClick={() => onClick?.(c)}
            className={`bg-neutral-900/50 border rounded-xl p-4 transition-colors cursor-pointer hover:bg-neutral-800/40 ${borderClass}`}
        >
            <div className="flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                    {c.logoUrl ? (
                        <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                        <Trophy className="w-5 h-5 text-neutral-500" />
                    )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base font-semibold text-white truncate">{c.name}</span>

                        <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${TYPE_STYLES[c.type] ?? TYPE_STYLES.TOURNAMENT}`}>
                            {t(`competitions.type_${c.type.toLowerCase()}`)}
                        </span>

                        {c.stage && (
                            <span className="text-xs text-neutral-500">
                                {c.stage}
                            </span>
                        )}

                        {c.source === "FACEIT" && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium">
                                FACEIT
                            </span>
                        )}
                    </div>

                    {/* Meta line */}
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {c.startDate ? (
                                <>
                                    {formatDate(c.startDate)}
                                    {c.endDate && c.endDate !== c.startDate && (
                                        <> → {formatDate(c.endDate)}</>
                                    )}
                                </>
                            ) : (
                                t("competitions.no_date")
                            )}
                        </span>

                        {c.format && (
                            <span className="text-neutral-600">
                                {c.format}
                            </span>
                        )}

                        {c.cashprize && (
                            <span className="flex items-center gap-1 text-emerald-400">
                                <DollarSign className="w-3 h-3" />
                                {c.cashprize}
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    {(c.season || c.region || c.division) && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                            {c.season && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono font-semibold">
                                    {c.season}
                                </span>
                            )}
                            {c.region && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono font-semibold">
                                    {c.region}
                                </span>
                            )}
                            {c.division && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono font-semibold">
                                    {c.division}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Right side — status + link */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${STATUS_STYLES[c.status] ?? STATUS_STYLES.UPCOMING}`}>
                        {t(`competitions.status_${c.status.toLowerCase()}`)}
                    </span>

                    {c.url && (
                        <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-neutral-600 hover:text-neutral-300 transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
