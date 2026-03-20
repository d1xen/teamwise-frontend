import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    Plus, Clock, AlertCircle, CheckCircle2, Loader2,
    Search, SlidersHorizontal, LayoutList, X,
    Pencil, Trash2, Check,
} from "lucide-react";
import { useTeam } from "@/contexts/team/useTeam";
import { useAuth } from "@/contexts/auth/useAuth";
import FeatureHeader from "@/shared/components/FeatureHeader";
import MatchCard from "@/features/match/components/MatchCard";
import CreateMatchModal from "@/features/match/components/CreateMatchModal";
import EditMatchModal from "@/features/match/components/EditMatchModal";
import { useMatches } from "@/features/match/hooks/useMatches";
import type { MatchDto, MatchFilters } from "@/api/types/match";

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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MatchesPage() {
    const { t } = useTranslation();
    const { team, membership } = useTeam();
    const { user } = useAuth();

    const [showCreate, setShowCreate] = useState(false);
    const [editMatch, setEditMatch] = useState<MatchDto | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Edit mode
    const [editMode, setEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const {
        content,
        contentRevision,
        totalElements,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMore,
        filters,
        updateFilters,
        changeTab,
        createMatch,
        bulkDeleteMatches,
        updateMatch,
        updateMapScore,
    } = useMatches(team?.id ?? "");

    if (!team || !membership || !user) return null;

    const isStaff = membership.isOwner || membership.role !== "PLAYER";

    const hasActiveFilters =
        !!(filters.type || filters.context || filters.format ||
        filters.opponent || filters.dateRange !== "all");

    // ── Edit mode ─────────────────────────────────────────────────────────────

    const handleChangeTab = (tab: MatchFilters["tab"]) => {
        setEditMode(false);
        setSelectedIds(new Set());
        changeTab(tab);
    };

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
    };

    return (
        <div className="flex flex-col h-full">
            <FeatureHeader
                title={t("pages.matches.title")}
                subtitle={t("pages.matches.subtitle")}
                side={
                    isStaff ? (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {t("matches.new_match")}
                        </button>
                    ) : undefined
                }
            />

            <div className="flex-1 overflow-y-auto">
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
                                </button>
                            );
                        })}

                        <div className="ml-auto pb-2 flex items-center gap-2">
                            {isLoading && (
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
                                        onClick={() => updateFilters({ type: "", context: "", format: "", dateRange: "all" })}
                                        className="pr-2 pl-0.5 py-1.5 hover:text-white transition-colors"
                                        title={t("matches.clear_filters")}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* Edit mode toggle */}
                            {isStaff && (
                                <button
                                    onClick={toggleEditMode}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                                        editMode
                                            ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                                            : "border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                                    }`}
                                >
                                    <Pencil className="w-3 h-3" />
                                    {editMode ? t("matches.exit_edit_mode") : t("matches.edit_mode")}
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
                        />
                    )}

                    {/* Edit mode select-all bar */}
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

                    {/* Results count — always rendered to avoid layout shift */}
                    <p className={`text-xs transition-colors duration-150 ${isLoading ? "text-neutral-800" : "text-neutral-600"}`}>
                        {t("matches.result_count", { count: totalElements })}
                    </p>

                    {/* To-complete motivating banner — always rendered when on that tab to avoid layout shift */}
                    {filters.tab === "to_complete" && content.length > 0 && (
                        <div className={`flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-xl transition-opacity duration-150 ${isLoading ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                            <div className="w-0.5 self-stretch bg-amber-500/40 rounded-full shrink-0" />
                            <AlertCircle className="w-4 h-4 text-amber-500/60 shrink-0" />
                            <p className="text-xs text-amber-600/80">
                                {t("matches.to_complete_motivation", { count: totalElements })}
                            </p>
                        </div>
                    )}

                    {/* Content */}
                    <MatchList
                        content={content}
                        contentRevision={contentRevision}
                        isLoading={isLoading}
                        isLoadingMore={isLoadingMore}
                        hasMore={hasMore}
                        loadMore={loadMore}
                        isStaff={isStaff}
                        editMode={editMode}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onEdit={isStaff ? setEditMatch : undefined}
                        tab={filters.tab}
                        onNew={() => setShowCreate(true)}
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
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold text-white transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                {t("matches.bulk_delete", { count: selectedIds.size })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCreate && (
                <CreateMatchModal
                    onClose={() => setShowCreate(false)}
                    onSubmit={createMatch}
                />
            )}

            {editMatch && (
                <EditMatchModal
                    match={editMatch}
                    teamTag={team.tag ?? team.name}
                    game={team.game ?? "CS2"}
                    onClose={() => setEditMatch(null)}
                    onUpdateMatch={updateMatch}
                    onSaveMap={updateMapScore}
                />
            )}
        </div>
    );
}

// ── Match list with infinite scroll ──────────────────────────────────────────

function MatchList({
    content,
    contentRevision,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    isStaff,
    editMode,
    selectedIds,
    onToggleSelect,
    onEdit,
    tab,
    onNew,
}: {
    content: MatchDto[];
    contentRevision: number;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    loadMore: () => void;
    isStaff: boolean;
    editMode: boolean;
    selectedIds: Set<number>;
    onToggleSelect: (id: number) => void;
    onEdit?: (match: MatchDto) => void;
    tab: MatchFilters["tab"];
    onNew: () => void;
}) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Trigger loadMore when sentinel enters viewport
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMore) return;
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) loadMore(); },
            { rootMargin: "150px" }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    // Initial load with no content yet — show skeletons
    if (isLoading && content.length === 0) {
        return <MatchListSkeleton />;
    }

    // Empty state
    if (!isLoading && content.length === 0) {
        return <EmptyState tab={tab} isStaff={isStaff} onNew={onNew} />;
    }

    return (
        <div key={contentRevision} className="space-y-3 animate-fade-in">
            {content.map(m => (
                <MatchCard
                    key={m.id}
                    match={m}
                    isStaff={isStaff}
                    editMode={editMode}
                    selected={selectedIds.has(m.id)}
                    onToggleSelect={onToggleSelect}
                    onEdit={onEdit}
                />
            ))}

            {/* Sentinel + loading indicator for next page */}
            <div ref={sentinelRef} className="space-y-3 pt-0">
                {isLoadingMore && (
                    <>
                        <MatchCardSkeleton />
                        <MatchCardSkeleton />
                    </>
                )}
            </div>
        </div>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function MatchCardSkeleton() {
    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 animate-pulse">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-800/80" />
                <div className="flex-1 min-w-0 space-y-2.5 pt-0.5">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-28 bg-neutral-800/80 rounded" />
                        <div className="h-4 w-10 bg-neutral-800/80 rounded" />
                        <div className="h-4 w-8 bg-neutral-800/80 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-neutral-800/80 rounded" />
                        <div className="h-3 w-20 bg-neutral-800/80 rounded" />
                    </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-2 pt-0.5">
                    <div className="h-5 w-14 bg-neutral-800/80 rounded" />
                    <div className="h-3 w-8 bg-neutral-800/80 rounded" />
                </div>
            </div>
        </div>
    );
}

function MatchListSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <MatchCardSkeleton key={i} />)}
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

const OFFICIAL_CONTEXTS: MatchFilters["context"][] = ["TOURNAMENT", "QUALIFIER", "LAN", "REGULAR_SEASON"];
const MATCH_FORMATS: MatchFilters["format"][]       = ["BO1", "BO3", "BO5"];

function FilterPanel({
    filters,
    onUpdate,
    showDateRange,
}: {
    filters: MatchFilters;
    onUpdate: (patch: Partial<MatchFilters>) => void;
    showDateRange: boolean;
}) {
    const { t } = useTranslation();
    const showContextFilter = filters.type !== "SCRIM";

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
                    <FilterChip label={t("matches.filter_all")}    active={filters.type === ""}         onClick={() => onUpdate({ type: "", context: "" })} />
                    <FilterChip label={t("matches.type_official")} active={filters.type === "OFFICIAL"} onClick={() => onUpdate({ type: "OFFICIAL" })} />
                    <FilterChip label={t("matches.type_scrim")}    active={filters.type === "SCRIM"}    onClick={() => onUpdate({ type: "SCRIM", context: "" })} />
                </div>
            </div>

            {showContextFilter && (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wider w-16 shrink-0">{t("matches.context")}</span>
                    <div className="flex flex-wrap gap-1.5">
                        <FilterChip label={t("matches.filter_all")} active={filters.context === ""} onClick={() => onUpdate({ context: "" })} />
                        {OFFICIAL_CONTEXTS.map(ctx => (
                            <FilterChip
                                key={ctx}
                                label={t(`matches.context_${ctx.toLowerCase()}`)}
                                active={filters.context === ctx}
                                onClick={() => onUpdate({ context: ctx })}
                            />
                        ))}
                    </div>
                </div>
            )}

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

function EmptyState({ tab, isStaff, onNew }: { tab: MatchFilters["tab"]; isStaff: boolean; onNew: () => void }) {
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
            {tab === "upcoming" && isStaff && (
                <button
                    onClick={onNew}
                    className="mt-5 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {t("matches.new_match")}
                </button>
            )}
        </div>
    );
}
