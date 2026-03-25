import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    Plus, Clock, CheckCircle2, List,
    SlidersHorizontal, X, Search, Check, Loader2,
} from "lucide-react";
import { useTeam } from "@/contexts/team/useTeam";
import ConfirmModal from "@/shared/components/ConfirmModal";
import { PaginationTop, PaginationBottom } from "@/shared/components/Pagination";
import type { PageSize } from "@/shared/components/Pagination";
import { useCompetitions } from "@/features/competition/hooks/useCompetitions";
import FeatureHeader from "@/shared/components/FeatureHeader";
import CompetitionCard from "@/features/competition/components/CompetitionCard";
import CreateCompetitionModal from "@/features/competition/components/CreateCompetitionModal";
import CompetitionDetail from "@/features/competition/components/CompetitionDetail";
import type { CompetitionDto, CompetitionTab, CompetitionType } from "@/api/types/competition";

// ── Tab config ────────────────────────────────────────────────────────────────

type TabDef = {
    id: CompetitionTab;
    labelKey: string;
    icon: typeof Clock;
    color: string;
    activeColor: string;
};

const TABS: TabDef[] = [
    { id: "active",    labelKey: "competitions.tab_active",    icon: Clock,        color: "text-emerald-400", activeColor: "border-emerald-400 text-emerald-400" },
    { id: "completed", labelKey: "competitions.tab_completed", icon: CheckCircle2, color: "text-neutral-400", activeColor: "border-neutral-400 text-neutral-400" },
    { id: "all",       labelKey: "competitions.tab_all",       icon: List,         color: "text-indigo-400",  activeColor: "border-indigo-400 text-indigo-400" },
];

const COMPETITION_TYPES: CompetitionType[] = ["LEAGUE", "TOURNAMENT", "CUP", "LAN", "QUALIFIER", "OTHER"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompetitionsPage() {
    const { t } = useTranslation();
    const { team, membership } = useTeam();
    const {
        competitions,
        isLoading,
        tab,
        setTab,
        counts,
        createCompetition,
        bulkDeleteCompetitions,
    } = useCompetitions(team?.id?.toString() ?? "");

    const { competitionId: compIdParam } = useParams<{ competitionId?: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [showCreate, setShowCreate] = useState(false);
    const [detailCompetition, setDetailCompetition] = useState<CompetitionDto | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [compPage, setCompPage] = useState(0);
    const [compPageSize, setCompPageSize] = useState<PageSize>(50);

    // Deep-link: load competition from URL param
    useEffect(() => {
        if (compIdParam && !detailCompetition) {
            import("@/api/endpoints/competition.api").then(({ getCompetition }) => {
                getCompetition(team?.id ?? "", Number(compIdParam)).then(setDetailCompetition).catch(() => {
                    navigate(`/team/${team?.id}/competitions`, { replace: true });
                });
            });
        }
    }, [compIdParam, detailCompetition, team?.id, navigate]);

    // Sync URL → tab/filters on mount
    useEffect(() => {
        const urlTab = searchParams.get("tab");
        if (urlTab === "active" || urlTab === "completed" || urlTab === "all") setTab(urlTab);
        const urlType = searchParams.get("type");
        if (urlType) setFilterType(urlType as CompetitionType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [filterType, setFilterTypeState] = useState<CompetitionType | "">("");
    const [filterName, setFilterName] = useState("");

    const setFilterType = (v: CompetitionType | "") => {
        setFilterTypeState(v);
        const next = new URLSearchParams(searchParams);
        if (v) next.set("type", v); else next.delete("type");
        setSearchParams(next, { replace: true });
    };

    const setTabWithUrl = (v: typeof tab) => {
        setTab(v);
        const next = new URLSearchParams(searchParams);
        next.set("tab", v);
        setSearchParams(next, { replace: true });
    };

    // Edit/select mode
    const [editMode, setEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const isStaff = membership?.isOwner || membership?.role !== "PLAYER";
    const hasActiveFilters = !!(filterType || filterName);

    const allFiltered = competitions.filter(c => {
        if (filterType && c.type !== filterType) return false;
        if (filterName && !c.name.toLowerCase().includes(filterName.toLowerCase())) return false;
        return true;
    });

    // Reset page when filters change
    const filteredTotal = allFiltered.length;
    const compTotalPages = Math.max(1, Math.ceil(filteredTotal / compPageSize));
    const safePage = Math.min(compPage, compTotalPages - 1);
    const filtered = allFiltered.slice(safePage * compPageSize, (safePage + 1) * compPageSize);

    const deletableInView = allFiltered.filter(c => c.status !== "COMPLETED");
    const allSelected = deletableInView.length > 0 && deletableInView.every(c => selectedIds.has(c.id));

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(deletableInView.map(c => c.id)));
    };

    const toggleEditMode = () => {
        setEditMode(v => !v);
        setSelectedIds(new Set());
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleBulkDelete = async () => {
        await bulkDeleteCompetitions(Array.from(selectedIds));
        setSelectedIds(new Set());
        setEditMode(false);
        setShowDeleteConfirm(false);
    };

    const handleBackFromDetail = () => {
        setDetailCompetition(null);
        navigate(`/team/${team?.id}/competitions`);
    };

    // Detail view — inline
    if (compIdParam || detailCompetition) {
        const cId = compIdParam ? Number(compIdParam) : detailCompetition?.id;
        if (cId) {
            return (
                <div className="flex flex-col h-full">
                    <FeatureHeader
                        title={t("pages.competitions.title")}
                        subtitle={t("pages.competitions.subtitle")}
                    />
                    <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                        <div className="max-w-5xl mx-auto px-8 py-6">
                            <CompetitionDetail
                                teamId={team?.id ?? ""}
                                competitionId={cId}
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
                title={t("pages.competitions.title")}
                subtitle={t("pages.competitions.subtitle")}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                <div className="max-w-5xl mx-auto px-8 py-6 space-y-5">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 border-b border-neutral-800">
                        {TABS.map(tabDef => {
                            const isActive = tab === tabDef.id;
                            const Icon = tabDef.icon;
                            const count = counts[tabDef.id];

                            return (
                                <button
                                    key={tabDef.id}
                                    onClick={() => setTabWithUrl(tabDef.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
                                        isActive
                                            ? `${tabDef.activeColor} border-current`
                                            : "border-transparent text-neutral-500 hover:text-neutral-300"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {t(tabDef.labelKey)}
                                    {count > 0 && (
                                        <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-neutral-700 text-[10px] font-bold text-neutral-300 flex items-center justify-center tabular-nums">
                                            {count > 99 ? "99+" : count}
                                        </span>
                                    )}
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
                                        onClick={() => { setFilterType(""); setFilterName(""); }}
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
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                                        editMode
                                            ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                                            : "border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                                    }`}
                                >
                                    <Check className="w-3 h-3" />
                                    {editMode ? t("competitions.exit_select_mode") : t("competitions.select_mode")}
                                </button>
                            )}

                            {/* New competition — last */}
                            {isStaff && (
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4338ca]/40 bg-[#4338ca]/10 text-[#8b83f7] hover:bg-[#4338ca]/20 text-xs font-medium transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    {t("competitions.new_competition")}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter panel */}
                    {showFilters && (
                        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={filterName}
                                        onChange={e => setFilterName(e.target.value)}
                                        placeholder={t("competitions.name_placeholder")}
                                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wider w-16 shrink-0">
                                    {t("competitions.type")}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    <FilterChip label={t("matches.filter_all")} active={filterType === ""} onClick={() => setFilterType("")} />
                                    {COMPETITION_TYPES.map(ct => (
                                        <FilterChip
                                            key={ct}
                                            label={t(`competitions.type_${ct.toLowerCase()}`)}
                                            active={filterType === ct}
                                            onClick={() => setFilterType(ct)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results count + pagination */}
                    <div className="flex items-center justify-between">
                        <p className={`text-xs transition-colors duration-150 ${isLoading ? "text-neutral-800" : "text-neutral-600"}`}>
                            {t("matches.result_count", { count: filteredTotal })}
                        </p>
                        <PaginationTop
                            page={safePage}
                            totalPages={compTotalPages}
                            pageSize={compPageSize}
                            onPageChange={setCompPage}
                            onPageSizeChange={s => { setCompPageSize(s); setCompPage(0); }}
                            label={t("competitions.per_page")}
                        />
                    </div>

                    {/* Select-all */}
                    {editMode && deletableInView.length > 0 && (
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
                                {allSelected ? t("competitions.deselect_all") : t("competitions.select_all")}
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    {!isLoading && filtered.length === 0 ? (
                        <EmptyState tab={tab} />
                    ) : isLoading && filtered.length === 0 ? (
                        null
                    ) : (
                        <>
                            <div className={`space-y-3 transition-opacity duration-150 ${isLoading ? "opacity-60" : "opacity-100"}`}>
                                {filtered.map(c => (
                                    <div key={c.id} className="relative">
                                        {editMode && c.status !== "COMPLETED" && (
                                            <div
                                                onClick={() => toggleSelect(c.id)}
                                                className={`absolute -left-7 top-1/2 -translate-y-1/2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer z-10 ${
                                                    selectedIds.has(c.id)
                                                        ? "bg-indigo-600 border-indigo-600"
                                                        : "border-neutral-600 hover:border-neutral-400"
                                                }`}
                                            >
                                                {selectedIds.has(c.id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                            </div>
                                        )}
                                        <CompetitionCard competition={c} onClick={(comp) => navigate(`/team/${team?.id}/competitions/${comp.id}`)} />
                                    </div>
                                ))}
                            </div>
                            <PaginationBottom
                                page={safePage}
                                totalPages={compTotalPages}
                                totalElements={filteredTotal}
                                pageSize={compPageSize}
                                onPageChange={setCompPage}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Bulk action bar */}
            {editMode && selectedIds.size > 0 && (
                <div className="border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-sm px-8 py-3">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <span className="text-sm text-neutral-400">
                            {t("competitions.selected_count", { count: selectedIds.size })}
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
                            >
                                {t("competitions.deselect_all")}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold text-white transition-colors"
                            >
                                {t("competitions.bulk_delete", { count: selectedIds.size })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <ConfirmModal
                    title={t("competitions.bulk_delete_confirm_title")}
                    description={t("competitions.bulk_delete_confirm_desc", { count: selectedIds.size })}
                    confirmLabel={t("competitions.bulk_delete", { count: selectedIds.size })}
                    cancelLabel={t("common.cancel")}
                    variant="danger"
                    onConfirm={handleBulkDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}

            {showCreate && (
                <CreateCompetitionModal
                    onClose={() => setShowCreate(false)}
                    onSubmit={createCompetition}
                />
            )}

        </div>
    );
}

// ── Empty state (same pattern as MatchesPage) ─────────────────────────────────

function EmptyState({ tab }: { tab: CompetitionTab }) {
    const { t } = useTranslation();
    const tabDef = TABS.find(tb => tb.id === tab)!;
    const Icon = tabDef.icon;

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4">
                <Icon className={`w-7 h-7 ${tabDef.color}`} />
            </div>
            <p className="text-neutral-400 font-medium">{t(`competitions.empty_${tab}`)}</p>
            <p className="text-neutral-600 text-sm mt-1">{t("competitions.empty_hint")}</p>
        </div>
    );
}

// ── Filter chip (same component as MatchesPage) ──────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                active
                    ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
            }`}
        >
            {label}
        </button>
    );
}
