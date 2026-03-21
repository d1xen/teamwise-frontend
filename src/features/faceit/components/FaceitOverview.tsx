import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    RefreshCw, Download, Loader, Zap,
    Settings2, ChevronDown, ChevronUp, Clock,
    Link2, Check, ArrowRight, Users, HelpCircle,
} from "lucide-react";
import { useTeam } from "@/contexts/team/useTeam";
import { useFaceitOverview } from "../hooks/useFaceitOverview";
import { useFaceitImport } from "../hooks/useFaceitImport";
import CompetitionCard from "./CompetitionCard";
import { cn } from "@/design-system";
import type { CompetitionCategory, CompetitionSummaryDto, SyncConfig } from "@/api/types/faceit";
import type { TeamMemberDto } from "@/api/types/team";

const MIN_LINKED = 3;
const MIN_CORE   = 3;
const MAX_CORE   = 5;

// ── Filters ───────────────────────────────────────────────────────────────────

type Filter = "all" | "esea" | "playoffs" | "cups";

const ESEA_CATEGORIES: CompetitionCategory[]    = ["ESEA_REGULAR_SEASON", "ESEA_PLAYOFF", "ESEA_QUALIFIER"];
const PLAYOFF_CATEGORIES: CompetitionCategory[] = ["ESEA_PLAYOFF", "PLAYOFF"];
const CUP_CATEGORIES: CompetitionCategory[]     = ["QUALIFIER", "CUP", "CHAMPIONSHIP"];

function applyFilter(competitions: CompetitionSummaryDto[], filter: Filter): CompetitionSummaryDto[] {
    if (filter === "all")      return competitions;
    if (filter === "esea")     return competitions.filter(c => ESEA_CATEGORIES.includes(c.category));
    if (filter === "playoffs") return competitions.filter(c => PLAYOFF_CATEGORIES.includes(c.category));
    return competitions.filter(c => CUP_CATEGORIES.includes(c.category));
}

// ── Time range ────────────────────────────────────────────────────────────────

const TIME_RANGE_OPTIONS = [
    { months: 3,  labelKey: "faceit.range_3m" },
    { months: 6,  labelKey: "faceit.range_6m" },
    { months: 12, labelKey: "faceit.range_1y" },
];

// ── Workflow ──────────────────────────────────────────────────────────────────

type StepState = "done" | "active" | "pending";

function WorkflowBar({ linkedCount, hasLoaded }: { linkedCount: number; hasLoaded: boolean }) {
    const { t } = useTranslation();
    const s1: StepState = linkedCount >= MIN_LINKED ? "done" : "active";
    const s2: StepState = linkedCount >= MIN_LINKED ? (hasLoaded ? "done" : "active") : "pending";
    const s3: StepState = hasLoaded ? "active" : "pending";

    const steps: { state: StepState; icon: React.ElementType; label: string }[] = [
        { state: s1, icon: Link2,     label: t("faceit.workflow_step1_title") },
        { state: s2, icon: RefreshCw, label: t("faceit.workflow_step2_title") },
        { state: s3, icon: Download,  label: t("faceit.workflow_step3_title") },
    ];

    return (
        <div className="flex items-center gap-1">
            {steps.map((s, i) => {
                const Icon = s.icon;
                const done = s.state === "done";
                const active = s.state === "active";
                return (
                    <div key={i} className="flex items-center gap-1">
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors",
                            done
                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                : active
                                    ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-300"
                                    : "bg-neutral-900/40 border-neutral-800 text-neutral-600"
                        )}>
                            {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                            {s.label}
                        </div>
                        {i < steps.length - 1 && (
                            <ArrowRight className={cn("w-3 h-3 shrink-0", done ? "text-emerald-500/30" : "text-neutral-800")} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Inline player row ─────────────────────────────────────────────────────────

function PlayerRow({
    player, inCore, canToggle, onToggle,
}: {
    player: TeamMemberDto; inCore: boolean; canToggle: boolean; onToggle: () => void;
}) {
    const { t } = useTranslation();
    const linked   = player.faceitNickname != null;
    const teamName = player.customUsername ?? player.nickname;

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 group">
            <button type="button" onClick={() => canToggle && onToggle()} disabled={!canToggle}
                className={cn(
                    "w-5 h-5 rounded shrink-0 border flex items-center justify-center transition-all",
                    !linked ? "border-neutral-800 bg-neutral-900/30 cursor-not-allowed"
                        : inCore
                            ? canToggle ? "bg-indigo-500/25 border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/35"
                                        : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400/50 cursor-not-allowed"
                            : canToggle ? "bg-neutral-800/50 border-neutral-700 hover:border-indigo-500/40 cursor-pointer"
                                        : "bg-neutral-900/30 border-neutral-800 cursor-not-allowed"
                )}>
                {inCore && <Check className="w-3 h-3" />}
            </button>
            <span className={cn("text-[13px] font-medium min-w-[80px] truncate", linked ? "text-neutral-200" : "text-neutral-600")}>
                {teamName}
            </span>
            <ArrowRight className={cn("w-3.5 h-3.5 shrink-0", linked ? "text-neutral-700" : "text-neutral-800")} />
            {linked ? (
                <span className="text-[13px] font-medium text-orange-400/80 truncate flex-1">{player.faceitNickname}</span>
            ) : (
                <span className="text-xs text-neutral-700 italic flex-1">{t("faceit.not_linked_short")}</span>
            )}
            <span className={cn("w-2 h-2 rounded-full shrink-0", linked ? "bg-emerald-500" : "bg-neutral-700")} />
        </div>
    );
}

// ── Formatted sync date ───────────────────────────────────────────────────────

function useSyncDateLabel(date: Date | null, lang: string): string | null {
    if (!date) return null;
    return new Intl.DateTimeFormat(lang, {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    }).format(date);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FaceitOverview({ teamId }: { teamId: string }) {
    const { t, i18n } = useTranslation();
    const { membership, members } = useTeam();
    const { overview, isLoading, hasLoaded, error, config, setConfig, lastSyncedAt, sync, reload, patchImportedIds } =
        useFaceitOverview(teamId);
    const importState                 = useFaceitImport();
    const [filter, setFilter]         = useState<Filter>("all");
    const [configOpen, setConfigOpen] = useState(false);
    const [guideOpen, setGuideOpen]   = useState(true);
    const prevHasLoaded               = useRef(hasLoaded);

    const isStaff = (membership?.isOwner ?? false) || membership?.role !== "PLAYER";

    const activePlayers = members.filter(m => m.role === "PLAYER" && m.activePlayer !== false);
    const linkedPlayers = activePlayers.filter(m => m.faceitNickname != null);
    const linkedCount   = linkedPlayers.length;
    const canSync       = isStaff && linkedCount >= MIN_LINKED && config.corePlayerSteamIds.length >= MIN_CORE;

    const coreSet   = new Set(config.corePlayerSteamIds);
    const coreCount = config.corePlayerSteamIds.length;

    const syncDateLabel = useSyncDateLabel(lastSyncedAt, i18n.language);

    // Auto-collapse guide when data first loads
    useEffect(() => {
        if (hasLoaded && !prevHasLoaded.current) {
            setGuideOpen(false);
        }
        prevHasLoaded.current = hasLoaded;
    }, [hasLoaded]);

    // Init core from linked roster
    useEffect(() => {
        if (linkedPlayers.length > 0 && config.corePlayerSteamIds.length === 0) {
            setConfig({ ...config, corePlayerSteamIds: linkedPlayers.slice(0, MAX_CORE).map(p => p.steamId) });
        }
    }, [linkedPlayers.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleCore = (steamId: string) => {
        const set = new Set(config.corePlayerSteamIds);
        if (set.has(steamId)) { if (set.size <= MIN_CORE) return; set.delete(steamId); }
        else { if (set.size >= MAX_CORE) return; set.add(steamId); }
        setConfig({ ...config, corePlayerSteamIds: [...set] });
    };

    const handleImport = async () => {
        if (!overview) return;
        const importedSet = new Set(overview.importedFaceitMatchIds);
        const matchIds = overview.competitions
            .filter(c => importState.selected.has(c.competitionId))
            .flatMap(c => c.matchIds)
            .filter(id => !importedSet.has(id));
        const result = await importState.importSelected(teamId, matchIds);
        if (result && result.failed === 0) patchImportedIds(matchIds, []);
        else if (result) reload();
    };

    const handleDeimport = async (competitionId: string, matchIds: string[]) => {
        importState.setDeimportingId(competitionId);
        const removed = await importState.deimport(teamId, matchIds);
        importState.setDeimportingId(null);
        if (removed) patchImportedIds([], removed);
    };

    const rangeLabel = TIME_RANGE_OPTIONS.find(o => o.months === config.months);
    const coreNames  = linkedPlayers
        .filter(p => config.corePlayerSteamIds.includes(p.steamId))
        .map(p => p.faceitNickname ?? p.customUsername ?? p.nickname)
        .join(", ");

    // Loaded data
    const competitions         = overview?.competitions ?? [];
    const importedFaceitIds    = overview?.importedFaceitMatchIds ?? [];
    const importedIds          = new Set(importedFaceitIds);
    const filtered             = applyFilter(competitions, filter);
    const selectedCompetitions = competitions.filter(c => importState.selected.has(c.competitionId));
    const pendingMatchCount    = selectedCompetitions.flatMap(c => c.matchIds).filter(id => !importedIds.has(id)).length;

    const FILTERS: { id: Filter; label: string }[] = [
        { id: "all",      label: t("faceit.filter_all") },
        { id: "esea",     label: t("faceit.filter_esea") },
        { id: "playoffs", label: t("faceit.filter_playoffs") },
        { id: "cups",     label: t("faceit.filter_cups") },
    ];

    return (
        <div className="flex flex-col gap-5 pb-28">
            {/* Header */}
            <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-orange-400 shrink-0" />
                <h3 className="text-base font-semibold text-white">{t("faceit.idle_title")}</h3>
            </div>

            <WorkflowBar linkedCount={linkedCount} hasLoaded={hasLoaded} />

            {/* ── Guide section (collapsible) ─────────────────────────────────── */}
            {isStaff && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
                    {/* Toggle header */}
                    <button
                        type="button"
                        onClick={() => setGuideOpen(o => !o)}
                        className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-neutral-800/30 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <HelpCircle className="w-3.5 h-3.5 text-neutral-600" />
                            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                {t("faceit.guide_title")}
                            </span>
                        </div>
                        {guideOpen
                            ? <ChevronUp className="w-3.5 h-3.5 text-neutral-600" />
                            : <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
                        }
                    </button>

                    {/* Collapsible content: guide + config side by side */}
                    {guideOpen && (
                        <div className="border-t border-neutral-800/50">
                            <div className="grid grid-cols-[1fr_300px] gap-0 items-stretch">
                                {/* Left: guide tips */}
                                <div className="p-5 space-y-5 border-r border-neutral-800/50">
                                    <div className="flex gap-3">
                                        <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mt-0.5">
                                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold text-neutral-300">{t("faceit.guide_core_title")}</p>
                                            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed whitespace-pre-line">{t("faceit.guide_core_body")}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="shrink-0 w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mt-0.5">
                                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold text-neutral-300">{t("faceit.guide_changes_title")}</p>
                                            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed whitespace-pre-line">{t("faceit.guide_changes_body")}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mt-0.5">
                                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold text-neutral-300">{t("faceit.guide_range_title")}</p>
                                            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed whitespace-pre-line">{t("faceit.guide_range_body")}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="shrink-0 w-7 h-7 rounded-full bg-orange-500/15 border border-orange-500/25 flex items-center justify-center mt-0.5">
                                            <Download className="w-3.5 h-3.5 text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold text-neutral-300">{t("faceit.guide_result_title")}</p>
                                            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed whitespace-pre-line">{t("faceit.guide_result_body")}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: config */}
                                <div className="flex flex-col">
                                    {/* Period */}
                                    <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-neutral-800/50">
                                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                            {t("faceit.range_label")}
                                        </span>
                                        <div className="flex gap-1">
                                            {TIME_RANGE_OPTIONS.map(opt => (
                                                <button key={opt.months} type="button"
                                                    onClick={() => setConfig({ ...config, months: opt.months })}
                                                    className={cn(
                                                        "px-3 py-1 rounded-md text-xs font-semibold transition-all",
                                                        config.months === opt.months
                                                            ? "bg-indigo-500/20 text-indigo-300"
                                                            : "text-neutral-600 hover:text-neutral-400"
                                                    )}>
                                                    {t(opt.labelKey)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Core header */}
                                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800/30">
                                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                            {t("faceit.core_players_label")}
                                        </span>
                                        <span className={cn("text-[11px] font-bold tabular-nums", coreCount < MIN_CORE ? "text-red-400" : "text-neutral-600")}>
                                            {coreCount}/{MAX_CORE}
                                        </span>
                                    </div>

                                    {/* Player rows */}
                                    <div className="divide-y divide-neutral-800/20 flex-1">
                                        {activePlayers.map(player => {
                                            const linked    = player.faceitNickname != null;
                                            const inCore    = coreSet.has(player.steamId);
                                            const canToggle = linked && (inCore ? coreCount > MIN_CORE : coreCount < MAX_CORE);
                                            return (
                                                <PlayerRow key={player.steamId} player={player} inCore={inCore}
                                                    canToggle={canToggle} onToggle={() => toggleCore(player.steamId)} />
                                            );
                                        })}
                                    </div>

                                    {/* Sync footer */}
                                    <div className="px-4 py-3.5 border-t border-neutral-800/50 space-y-3 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                                            <p className="text-[11px] text-neutral-600">{t("faceit.sync_duration_short")}</p>
                                        </div>
                                        <button type="button" onClick={sync} disabled={isLoading || !canSync}
                                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
                                            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                            {t("faceit.sync_button")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Sync info bar (when guide collapsed + data loaded) ──────────── */}
            {!guideOpen && hasLoaded && isStaff && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/30">
                    {/* Sync date */}
                    {syncDateLabel && (
                        <span className="text-[11px] text-neutral-500 shrink-0">
                            {t("faceit.last_sync_full", { date: syncDateLabel })}
                        </span>
                    )}

                    <span className="text-neutral-800">·</span>

                    {/* Resync tip */}
                    <span className="text-[11px] text-indigo-400/60 truncate flex-1">
                        {t("faceit.resync_tip_short")}
                    </span>

                    {/* Config summary */}
                    <span className="text-[10px] text-neutral-600 shrink-0" title={coreNames}>
                        {rangeLabel ? t(rangeLabel.labelKey) : `${config.months}M`}
                    </span>

                    {/* Config toggle */}
                    <button type="button" onClick={() => setConfigOpen(o => !o)}
                        className={cn(
                            "p-1 rounded-md transition-all shrink-0",
                            configOpen ? "text-indigo-400 bg-indigo-500/10" : "text-neutral-600 hover:text-neutral-300"
                        )}>
                        <Settings2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Reload */}
                    <button type="button" onClick={reload} title={t("faceit.reload_tooltip")}
                        className="p-1 rounded-md text-neutral-600 hover:text-neutral-300 transition-colors shrink-0">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* ── Inline config panel (expandable from the sync bar) ──────────── */}
            {!guideOpen && configOpen && isStaff && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-neutral-800/30">
                        <div className="flex items-center gap-1.5">
                            {TIME_RANGE_OPTIONS.map(opt => (
                                <button key={opt.months} type="button"
                                    onClick={() => setConfig({ ...config, months: opt.months })}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                                        config.months === opt.months
                                            ? "bg-indigo-500/20 text-indigo-300"
                                            : "text-neutral-600 hover:text-neutral-400"
                                    )}>
                                    {t(opt.labelKey)}
                                </button>
                            ))}
                        </div>
                        <span className={cn("text-[11px] font-bold tabular-nums", coreCount < MIN_CORE ? "text-red-400" : "text-neutral-600")}>
                            {coreCount}/{MAX_CORE}
                        </span>
                    </div>
                    <div className="divide-y divide-neutral-800/20">
                        {activePlayers.map(player => {
                            const linked    = player.faceitNickname != null;
                            const inCore    = coreSet.has(player.steamId);
                            const canToggle = linked && (inCore ? coreCount > MIN_CORE : coreCount < MAX_CORE);
                            return (
                                <PlayerRow key={player.steamId} player={player} inCore={inCore}
                                    canToggle={canToggle} onToggle={() => toggleCore(player.steamId)} />
                            );
                        })}
                    </div>
                    <div className="px-4 py-2.5 border-t border-neutral-800/50 flex items-center gap-3">
                        <button type="button" onClick={() => { setConfigOpen(false); reload(); }}
                            disabled={isLoading || coreCount < MIN_CORE}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors">
                            {isLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            {t("faceit.reload_with_config")}
                        </button>
                        <button type="button" onClick={() => setConfigOpen(false)}
                            className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors">
                            {t("common.cancel")}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Loading ──────────────────────────────────────────────────────── */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                        <span className="text-sm font-medium">{t("faceit.loading")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-neutral-700" />
                        <p className="text-[11px] text-neutral-600">{t("faceit.sync_duration_warning")}</p>
                    </div>
                </div>
            )}

            {/* ── Error ────────────────────────────────────────────────────────── */}
            {!isLoading && error && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <p className="text-sm text-red-400">{t("common.error")}</p>
                    {isStaff && (
                        <button type="button" onClick={sync} className="text-xs text-neutral-500 hover:text-neutral-300 underline">
                            {t("common.try_again")}
                        </button>
                    )}
                </div>
            )}

            {/* ── Competitions ─────────────────────────────────────────────────── */}
            {hasLoaded && !isLoading && !error && overview && (
                <>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {FILTERS.map(f => {
                            const count = f.id === "all" ? competitions.length : applyFilter(competitions, f.id).length;
                            return (
                                <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                                        filter === f.id
                                            ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                                            : "text-neutral-500 bg-neutral-800/40 border-neutral-800 hover:text-neutral-300"
                                    )}>
                                    {f.label}
                                    <span className={cn(
                                        "text-[10px] font-semibold px-1 py-0.5 rounded",
                                        filter === f.id ? "bg-indigo-500/20 text-indigo-300" : "bg-neutral-700 text-neutral-500"
                                    )}>{count}</span>
                                </button>
                            );
                        })}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="px-4 py-8 rounded-xl bg-neutral-900/40 border border-neutral-800 text-center space-y-1">
                            <p className="text-sm font-medium text-neutral-400">{t("faceit.no_competitions")}</p>
                            <p className="text-xs text-neutral-600">{t("faceit.no_competitions_hint")}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map(comp => (
                                <CompetitionCard
                                    key={comp.competitionId}
                                    competition={comp}
                                    importedIds={importedIds}
                                    importState={importState}
                                    isStaff={isStaff}
                                    corePlayers={linkedPlayers}
                                    onDeimport={handleDeimport}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Import footer ────────────────────────────────────────────────── */}
            {isStaff && importState.selected.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-4 px-5 py-3 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl shadow-black/60">
                        <div className="text-xs">
                            <span className="font-semibold text-white">{importState.selected.size}</span>
                            <span className="text-neutral-400 ml-1">{t("faceit.selected_competitions", { count: importState.selected.size })}</span>
                            {pendingMatchCount > 0 && (
                                <span className="text-neutral-600 ml-2">
                                    · <span className="text-neutral-400 font-medium">{pendingMatchCount}</span> {t("faceit.pending_matches")}
                                </span>
                            )}
                        </div>
                        <button type="button" onClick={importState.clearSelection}
                            className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors">
                            {t("common.cancel")}
                        </button>
                        <button type="button" onClick={handleImport}
                            disabled={importState.isImporting || pendingMatchCount === 0}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                            {importState.isImporting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            {t("faceit.import_button", { count: pendingMatchCount })}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
