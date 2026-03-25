import { useState, useEffect, useRef } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Plus, Clock, AlertCircle, CheckCircle2, Loader2,
    Search, SlidersHorizontal, LayoutList, X,
    Check,
} from "lucide-react";
import { useTeam } from "@/contexts/team/useTeam";
import { useAuth } from "@/contexts/auth/useAuth";
import { useMatchSummary } from "@/features/match/hooks/useMatchSummary";
import FeatureHeader from "@/shared/components/FeatureHeader";
import MatchCard from "@/features/match/components/MatchCard";
import CreateMatchModal from "@/features/match/components/CreateMatchModal";
import MatchDetail from "@/features/match/components/MatchDetail";
import { useMatches } from "@/features/match/hooks/useMatches";
import type { MatchDto, MatchFilters } from "@/api/types/match";
import ConfirmModal from "@/shared/components/ConfirmModal";
import { PaginationTop, PaginationBottom } from "@/shared/components/Pagination";
import type { CompetitionDto } from "@/api/types/competition";
import { getCompetitions } from "@/api/endpoints/competition.api";

// ── Tab config ────────────────────────────────────────────────────────────────

type TabDef = {
    id: MatchFilters["tab"];
    labelKey: string;
    icon: typeof Clock;
    color: string;
    activeColor: string;
};

const TABS: TabDef[] = [
    { id: "upcoming",    labelKey: "matches.tab_upcoming",    icon: Clock,        color: "text-blue-400",    activeColor: "border-blue-400 text-blue-400" },
    { id: "to_complete", labelKey: "matches.tab_to_complete", icon: AlertCircle,  color: "text-amber-400",   activeColor: "border-amber-400 text-amber-400" },
    { id: "results",     labelKey: "matches.tab_completed",   icon: CheckCircle2, color: "text-emerald-400", activeColor: "border-emerald-400 text-emerald-400" },
    { id: "all",         labelKey: "matches.tab_all",         icon: LayoutList,   color: "text-neutral-400", activeColor: "border-neutral-300 text-neutral-300" },
];

function isMatchTab(value: string | null): value is MatchFilters["tab"] {
    return value === "upcoming" || value === "to_complete" || value === "results" || value === "all";
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MatchesPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { matchId: matchIdParam } = useParams<{ matchId?: string }>();
    const navigate = useNavigate();
    const { team, membership } = useTeam();
    const { user } = useAuth();
    const { toCompleteCount } = useMatchSummary(team?.id ?? "");

    const [showCreate, setShowCreate] = useState(false);
    const [detailMatch, setDetailMatch] = useState<MatchDto | null>(null);

    // Deep-link: load match from URL param
    useEffect(() => {
        if (matchIdParam && !detailMatch) {
            import("@/api/endpoints/match.api").then(({ getMatch }) => {
                getMatch(Number(matchIdParam)).then(setDetailMatch).catch(() => {
                    navigate(`/team/${team?.id}/matches`, { replace: true });
                });
            });
        }
    }, [matchIdParam, detailMatch, team?.id, navigate]);
    const [showFilters, setShowFilters] = useState(false);
    const [allCompetitions, setAllCompetitions] = useState<CompetitionDto[]>([]);
    useEffect(() => {
        if (team?.id) {
            getCompetitions(team.id).then(setAllCompetitions).catch(() => {});
        }
    }, [team?.id]);

    // Edit mode
    const [editMode, setEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const scrollByTabRef = useRef<Record<MatchFilters["tab"], number>>({
        upcoming: 0,
        to_complete: 0,
        results: 0,
        all: 0,
    });

    const {
        content, totalElements, totalPages, currentPage, pageSize,
        isLoading, isRefreshing,
        filters, updateFilters, changeTab,
        goToPage, changePageSize,
        reload, createMatch, bulkDeleteMatches,
    } = useMatches(team?.id ?? "");

    const tabFromUrl = searchParams.get("tab");

    // URL -> state: permet aux liens depuis Team Overview de forcer l'onglet cible.
    useEffect(() => {
        if (!isMatchTab(tabFromUrl)) return;
        if (tabFromUrl === filters.tab) return;
        changeTab(tabFromUrl);
    }, [changeTab, filters.tab, tabFromUrl]);

    const hasActiveFilters =
        !!(filters.type || filters.format ||
        filters.opponent || filters.competitionId || filters.dateRange !== "all");

    // ── Edit mode ─────────────────────────────────────────────────────────────

    const handleChangeTab = (tab: MatchFilters["tab"]) => {
        if (scrollContainerRef.current) {
            scrollByTabRef.current[filters.tab] = scrollContainerRef.current.scrollTop;
        }

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("tab", tab);
        setSearchParams(nextParams, { replace: true });

        setEditMode(false);
        setSelectedIds(new Set());
        changeTab(tab);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const saved = scrollByTabRef.current[filters.tab] ?? 0;
        requestAnimationFrame(() => {
            container.scrollTop = saved;
        });
    }, [filters.tab]);

    if (!team || !membership || !user) return null;

    const isStaff = membership.isOwner || membership.role !== "PLAYER";

    const toggleEditMode = () => {
        setEditMode(v => !v);
        setSelectedIds(new Set());
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const scheduledInView = content.filter(m => m.status === "SCHEDULED");
    const allSelected = scheduledInView.length > 0 && scheduledInView.every(m => selectedIds.has(m.id));

    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(scheduledInView.map(m => m.id)));
    };

    const handleBulkDelete = async () => {
        await bulkDeleteMatches(Array.from(selectedIds));
        setSelectedIds(new Set());
        setEditMode(false);
        setShowDeleteConfirm(false);
    };

    const handleBackFromDetail = () => {
        setDetailMatch(null);
        navigate(`/team/${team?.id}/matches`);
        reload();
    };

    // Detail view — inline, replaces list
    if (matchIdParam || detailMatch) {
        const mId = matchIdParam ? Number(matchIdParam) : detailMatch?.id;
        if (mId) {
            return (
                <div className="flex flex-col h-full">
                    <FeatureHeader
                        title={t("pages.matches.title")}
                        subtitle={t("pages.matches.subtitle")}
                    />
                    <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                        <div className="max-w-5xl mx-auto px-8 py-6">
                            <MatchDetail
                                matchId={mId}
                                teamTag={team?.tag ?? team?.name ?? ""}
                                game={team?.game ?? "CS2"}
                                isStaff={isStaff}
                                onBack={handleBackFromDetail}
                                onDeleted={handleBackFromDetail}
                            />
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="flex flex-col h-full">
            <FeatureHeader
                title={t("pages.matches.title")}
                subtitle={t("pages.matches.subtitle")}
            />

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                <div className="max-w-5xl mx-auto px-8 py-6 space-y-5">

                    {/* Tabs */}
                    <div className="flex items-center gap-1 border-b border-neutral-800">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = filters.tab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleChangeTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
                                        isActive
                                            ? `${tab.activeColor} border-current`
                                            : "border-transparent text-neutral-500 hover:text-neutral-300"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {t(tab.labelKey)}
                                    {tab.id === "to_complete" && toCompleteCount > 0 && (
                                        <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500/90 text-[10px] font-bold text-neutral-950 flex items-center justify-center tabular-nums">
                                            {toCompleteCount > 99 ? "99+" : toCompleteCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        <div className="ml-auto pb-2 flex items-center gap-2">
                            {(isLoading || isRefreshing) && (
                                <Loader2 className="w-3.5 h-3.5 text-neutral-600 animate-spin" />
                            )}

                            {/* Filters button */}
                            <div className={`flex items-center rounded-lg border text-xs transition-colors ${
                                hasActiveFilters
                                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                                    : showFilters
                                    ? "border-neutral-700 bg-neutral-800 text-neutral-300"
                                    : "border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                            }`}>
                                <button
                                    onClick={() => setShowFilters(v => !v)}
                                    className="flex items-center gap-1.5 px-3 py-1.5"
                                >
                                    <SlidersHorizontal className="w-3 h-3" />
                                    {t("matches.filters")}
                                </button>
                                {hasActiveFilters && (
                                    <button
                                        onClick={() => updateFilters({ type: "", format: "", opponent: "", competitionId: "", dateRange: "all" })}
                                        className="pr-2 pl-0.5 py-1.5 hover:text-white transition-colors"
                                        title={t("matches.clear_filters")}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* Select mode toggle */}
                            {isStaff && (
                                <button
                                    onClick={toggleEditMode}
                                    disabled={filters.tab === "results"}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                        editMode
                                            ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                                            : "border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                                    }`}
                                >
                                    <Check className="w-3 h-3" />
                                    {editMode ? t("matches.exit_select_mode") : t("matches.select_mode")}
                                </button>
                            )}

                            {/* New match — last */}
                            {isStaff && (
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4338ca]/40 bg-[#4338ca]/10 text-[#8b83f7] hover:bg-[#4338ca]/20 text-xs font-medium transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    {t("matches.new_match")}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter panel */}
                    {showFilters && (
                        <FilterPanel
                            filters={filters}
                            onUpdate={updateFilters}
                            showDateRange={filters.tab === "results" || filters.tab === "all"}
                            competitions={allCompetitions}
                        />
                    )}

                    {/* Results count + pagination */}
                    <div className="flex items-center justify-between">
                        <p className={`text-xs transition-colors duration-150 ${isLoading || isRefreshing ? "text-neutral-800" : "text-neutral-600"}`}>
                            {t("matches.result_count", { count: totalElements })}
                        </p>
                        <PaginationTop
                            page={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            onPageChange={goToPage}
                            onPageSizeChange={changePageSize}
                            label={t("matches.per_page")}
                        />
                    </div>

                    {/* Select-all — below count, only in select mode */}
                    {editMode && scheduledInView.length > 0 && (
                        <div className="flex items-center gap-3 px-1">
                            <button
                                onClick={toggleSelectAll}
                                className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                            >
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                    allSelected
                                        ? "bg-indigo-600 border-indigo-600"
                                        : "border-neutral-600 hover:border-neutral-400"
                                }`}>
                                    {allSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                </div>
                                {allSelected ? t("matches.deselect_all") : t("matches.select_all")}
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <MatchList
                        content={content}
                        isLoading={isLoading}
                        isRefreshing={isRefreshing}
                        isStaff={isStaff}
                        editMode={editMode}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onClick={(m: MatchDto) => navigate(`/team/${team?.id}/matches/${m.id}`)}
                        tab={filters.tab}
                        onNew={() => setShowCreate(true)}
                    />
                    <PaginationBottom
                        page={currentPage}
                        totalPages={totalPages}
                        totalElements={totalElements}
                        pageSize={pageSize}
                        onPageChange={goToPage}
                    />
                </div>
            </div>

            {/* Bulk action bar */}
            {editMode && selectedIds.size > 0 && (
                <div className="border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-sm px-8 py-3">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <span className="text-sm text-neutral-400">
                            {t("matches.selected_count", { count: selectedIds.size })}
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
                            >
                                {t("matches.deselect_all")}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold text-white transition-colors"
                            >
                                {t("matches.bulk_delete", { count: selectedIds.size })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <ConfirmModal
                    title={t("matches.bulk_delete_confirm_title")}
                    description={t("matches.bulk_delete_confirm_desc", { count: selectedIds.size, tab: t(`matches.tab_${filters.tab}`) })}
                    confirmLabel={t("matches.bulk_delete", { count: selectedIds.size })}
                    cancelLabel={t("common.cancel")}
                    variant="danger"
                    onConfirm={handleBulkDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}

            {showCreate && (
                <CreateMatchModal
                    onClose={() => setShowCreate(false)}
                    onSubmit={createMatch}
                />
            )}

        </div>
    );
}

// ── Match list with pagination ───────────────────────────────────────────────

function MatchList({
    content, isLoading, isRefreshing,
    isStaff, editMode, selectedIds, onToggleSelect, onClick, tab, onNew,
}: {
    content: MatchDto[];
    isLoading: boolean;
    isRefreshing: boolean;
    isStaff: boolean;
    editMode: boolean;
    selectedIds: Set<number>;
    onToggleSelect: (id: number) => void;
    onClick?: (match: MatchDto) => void;
    tab: MatchFilters["tab"];
    onNew: () => void;
}) {
    if (isLoading && content.length === 0) return null;

    if (!isLoading && content.length === 0) {
        return <EmptyState tab={tab} isStaff={isStaff} onNew={onNew} />;
    }

    return (
        <div className={`space-y-3 transition-opacity duration-150 ${isRefreshing ? "opacity-60" : "opacity-100"}`}>
            {content.map(m => (
                <MatchCard
                    key={m.id}
                    match={m}
                    isStaff={isStaff}
                    editMode={editMode}
                    selected={selectedIds.has(m.id)}
                    onToggleSelect={onToggleSelect}
                    onClick={onClick}
                />
            ))}
        </div>
    );
}

// ── Filter Panel ──────────────────────────────────────────────────────────────

type FilterChipProps = { label: string; active: boolean; onClick: () => void };

function FilterChip({ label, active, onClick }: FilterChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                active
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
            }`}
        >
            {label}
        </button>
    );
}

const MATCH_FORMATS: MatchFilters["format"][] = ["BO1", "BO3", "BO5"];

function FilterPanel({
    filters,
    onUpdate,
    showDateRange,
    competitions,
}: {
    filters: MatchFilters;
    onUpdate: (patch: Partial<MatchFilters>) => void;
    showDateRange: boolean;
    competitions: CompetitionDto[];
}) {
    const { t } = useTranslation();

    return (
        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                    <input
                        type="text"
                        value={filters.opponent}
                        onChange={e => onUpdate({ opponent: e.target.value })}
                        placeholder={t("matches.filter_opponent")}
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </div>
                <select
                    value={filters.competitionId}
                    onChange={e => onUpdate({ competitionId: e.target.value ? Number(e.target.value) : "" })}
                    className="flex-1 max-w-xs px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-neutral-400 focus:outline-none focus:border-indigo-500/50 transition-colors"
                >
                    <option value="">{t("competitions.select_placeholder")}</option>
                    {competitions.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                {showDateRange && (
                    <select
                        value={filters.dateRange}
                        onChange={e => onUpdate({ dateRange: e.target.value as MatchFilters["dateRange"] })}
                        className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-neutral-400 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    >
                        <option value="all">{t("matches.date_range_all")}</option>
                        <option value="1m">{t("matches.date_range_1m")}</option>
                        <option value="3m">{t("matches.date_range_3m")}</option>
                        <option value="6m">{t("matches.date_range_6m")}</option>
                        <option value="1y">{t("matches.date_range_1y")}</option>
                    </select>
                )}
            </div>

            <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wider w-16 shrink-0">{t("matches.type")}</span>
                <div className="flex flex-wrap gap-1.5">
                    <FilterChip label={t("matches.filter_all")}    active={filters.type === ""}         onClick={() => onUpdate({ type: "" })} />
                    <FilterChip label={t("matches.type_official")} active={filters.type === "OFFICIAL"} onClick={() => onUpdate({ type: "OFFICIAL" })} />
                    <FilterChip label={t("matches.type_scrim")}    active={filters.type === "SCRIM"}    onClick={() => onUpdate({ type: "SCRIM" })} />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wider w-16 shrink-0">{t("matches.format")}</span>
                <div className="flex flex-wrap gap-1.5">
                    <FilterChip label={t("matches.filter_all")} active={filters.format === ""} onClick={() => onUpdate({ format: "" })} />
                    {MATCH_FORMATS.map(fmt => (
                        <FilterChip key={fmt} label={fmt} active={filters.format === fmt} onClick={() => onUpdate({ format: fmt })} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: MatchFilters["tab"]; isStaff: boolean; onNew: () => void }) {
    const { t } = useTranslation();
    const tabDef = TABS.find(tb => tb.id === tab)!;
    const Icon = tabDef.icon;

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4">
                <Icon className={`w-7 h-7 ${tabDef.color}`} />
            </div>
            <p className="text-neutral-400 font-medium">{t(`matches.empty_${tab}`)}</p>
            <p className="text-neutral-600 text-sm mt-1">{t("matches.empty_hint")}</p>
        </div>
    );
}
