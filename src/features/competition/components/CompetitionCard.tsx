import { useTranslation } from "react-i18next";
import { Calendar, ExternalLink, Trophy, DollarSign } from "lucide-react";
import FaceitIcon from "@/shared/components/FaceitIcon";
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
    const isFaceit = c.source === "FACEIT";

    const borderClass = c.status === "ONGOING"
        ? "border-emerald-500/30"
        : "border-neutral-800";

    return (
        <div
            onClick={() => onClick?.(c)}
            className={`bg-neutral-900/50 border rounded-xl p-4 transition-colors cursor-pointer hover:bg-neutral-800/40 ${borderClass}`}
        >
            <div className="flex gap-3">
                {/* Logo */}
                <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                    {c.logoUrl ? (
                        <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                        <Trophy className="w-8 h-8 text-neutral-500" />
                    )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                    {/* Name line + badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base font-semibold text-white truncate">{c.name}</span>

                        <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${TYPE_STYLES[c.type] ?? TYPE_STYLES.TOURNAMENT}`}>
                            {t(`competitions.type_${c.type.toLowerCase()}`)}
                        </span>

                        {isFaceit && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border bg-orange-500/10 border-orange-500/20 text-orange-400">
                                <FaceitIcon className="w-2.5 h-2.5" />
                            </span>
                        )}

                        {c.url && (
                            <a href={c.url} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>

                    {/* Organizer (FACEIT only) */}
                    {isFaceit && c.organizerName && (
                        <p className="text-[11px] text-neutral-600 mb-1">
                            {t("competitions.organized_by")} {c.organizerName}
                        </p>
                    )}

                    {/* Date + format + cashprize */}
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
                            <span className="text-neutral-600">{c.format}</span>
                        )}

                        {c.cashprize && (
                            <span className="flex items-center gap-1 text-emerald-400">
                                <DollarSign className="w-3 h-3" />
                                {c.cashprize}
                            </span>
                        )}

                        {c.matchRecord && (c.matchRecord.wins > 0 || c.matchRecord.losses > 0) && (
                            <span className="font-medium tabular-nums">
                                <span className="text-emerald-400">{c.matchRecord.wins}W</span>
                                {" "}
                                <span className="text-red-400">{c.matchRecord.losses}L</span>
                                {c.matchRecord.draws > 0 && (
                                    <> <span className="text-neutral-500">{c.matchRecord.draws}D</span></>
                                )}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right side — status (top-aligned) */}
                <div className="flex-shrink-0 self-start mt-1">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${STATUS_STYLES[c.status] ?? STATUS_STYLES.UPCOMING}`}>
                        {t(`competitions.status_${c.status.toLowerCase()}`)}
                    </span>
                </div>
            </div>
        </div>
    );
}
