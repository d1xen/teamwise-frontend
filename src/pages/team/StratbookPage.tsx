import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    BookOpen, Plus, Search, SlidersHorizontal, X, Star, Loader2, Check,
} from "lucide-react";
import { cn } from "@/design-system";
import { useTeam } from "@/contexts/team/useTeam";
import ConfirmModal from "@/shared/components/ConfirmModal";
import { useAuth } from "@/contexts/auth/useAuth";
import { useStrats } from "@/features/stratbook/hooks/useStrats";
import { toggleFavorite as toggleFavoriteApi } from "@/api/endpoints/stratbook.api";
import { getMapsForGame } from "@/shared/config/gameConfig";
import FeatureHeader from "@/shared/components/FeatureHeader";
import StratCard from "@/features/stratbook/components/StratCard";
import StratDetail from "@/features/stratbook/components/StratDetail";
import StratForm from "@/features/stratbook/components/StratForm";
import type { StratSummaryDto, StratSide, StratType } from "@/api/types/stratbook";
import { PaginationTop, PaginationBottom } from "@/shared/components/Pagination";

const SIDES: StratSide[] = ["T", "CT"];
const TYPES: StratType[] = ["DEFAULT", "EXECUTE", "FAKE", "RUSH", "CONTACT", "RETAKE", "SETUP"];

export default function StratbookPage() {
    const { t } = useTranslation();
    const { team, membership } = useTeam();
    const { user } = useAuth();
    const { stratId: stratIdParam } = useParams<{ stratId?: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const teamId = team?.id?.toString() ?? "";
    const maps = getMapsForGame(team?.game);
    const selectedStratId = stratIdParam ? Number(stratIdParam) : null;

    // Read URL params once for initial filters (avoids double fetch)
    const initialFilters = useMemo(() => {
        const patch: Record<string, unknown> = {};
        const m = searchParams.get("map");
        const s = searchParams.get("side");
        const tp = searchParams.get("type");
        const st = searchParams.get("status");
        const q = searchParams.get("search");
        const fav = searchParams.get("fav");
        if (m) patch.map = m;
        if (s) patch.side = s;
        if (tp) patch.type = tp;
        if (st) patch.status = st;
        if (q) patch.search = q;
        if (fav === "1") patch.favoritesOnly = true;
        return patch;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const {
        content, totalElements, totalPages, currentPage, pageSize,
        isLoading, isRefreshing,
        filters, updateFilters, goToPage, changePageSize,
        createStrat, removeStrat, reload,
    } = useStrats(teamId, initialFilters);

    // Sync filters → URL
    const updateFiltersWithUrl = (patch: Partial<typeof filters>) => {
        updateFilters(patch);
        const next = new URLSearchParams(searchParams);
        const merged = { ...filters, ...patch };
        if (merged.map) next.set("map", merged.map); else next.delete("map");
        if (merged.side) next.set("side", merged.side); else next.delete("side");
        if (merged.type) next.set("type", merged.type); else next.delete("type");
        if (merged.status) next.set("status", merged.status); else next.delete("status");
        if (merged.search) next.set("search", merged.search); else next.delete("search");
        if (merged.favoritesOnly) next.set("fav", "1"); else next.delete("fav");
        setSearchParams(next, { replace: true });
    };

    type StratView = "published" | "drafts";
    const [showForm, setShowForm] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [stratView, setStratView] = useState<StratView>("published");
    const [editMode, setEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isStaff = membership?.isOwner || membership?.role !== "PLAYER";
    const canFavorite = isStaff || membership?.inGameRole === "IGL";

    const hasAdvancedFilters = !!(filters.type || filters.status || filters.search || filters.tag || filters.favoritesOnly);

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    };
    const toggleEditMode = () => { setEditMode(v => !v); setSelectedIds(new Set()); };

    const handleBulkDelete = async () => {
        for (const id of selectedIds) { await removeStrat(id); }
        setSelectedIds(new Set());
        setEditMode(false);
        setShowDeleteConfirm(false);
        reload();
    };

    const handleToggleFavorite = async (stratId: number) => {
        await toggleFavoriteApi(stratId);
        reload();
    };

    const handleStratClick = (strat: StratSummaryDto) => {
        navigate(`/team/${teamId}/stratbook/${strat.id}`);
    };

    const handleBack = () => {
        setShowForm(false);
        navigate(`/team/${teamId}/stratbook`);
        reload();
    };

    // Detail view — replaces the list
    if (selectedStratId) {
        return (
            <div className="flex flex-col h-full">
                <FeatureHeader
                    title={t("pages.stratbook.title")}
                    subtitle={t("pages.stratbook.subtitle")}
                />
                <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                    <div className="max-w-5xl mx-auto px-8 py-6">
                        <StratDetail
                            stratId={selectedStratId}
                            isStaff={isStaff}
                            isIgl={membership?.inGameRole === "IGL"}
                            currentSteamId={user?.steamId ?? ""}
                            onBack={handleBack}
                            onDeleted={handleBack}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Form view — inline creation
    if (showForm) {
        return (
            <div className="flex flex-col h-full">
                <FeatureHeader
                    title={t("pages.stratbook.title")}
                    subtitle={t("pages.stratbook.subtitle")}
                />
                <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                    <div className="max-w-5xl mx-auto px-8 py-6">
                        <StratForm onBack={handleBack} onSubmit={createStrat} />
                    </div>
                </div>
            </div>
        );
    }

    // List view
    return (
        <div className="flex flex-col h-full">
            <FeatureHeader
                title={t("pages.stratbook.title")}
                subtitle={t("pages.stratbook.subtitle")}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                <div className="max-w-5xl mx-auto px-8 py-6 space-y-5">

                    {/* Toolbar: search left, actions right */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                            <input type="text" value={filters.search}
                                onChange={e => updateFiltersWithUrl({ search: e.target.value })}
                                placeholder={t("stratbook.search_placeholder")}
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-colors" />
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            {isLoading && <Loader2 className="w-3.5 h-3.5 text-neutral-600 animate-spin" />}

                            {/* Published / Drafts toggle */}
                            <div className="flex rounded-lg border border-neutral-700/50 overflow-hidden">
                                {(["published", "drafts"] as StratView[]).map(v => (
                                    <button key={v} onClick={() => setStratView(v)}
                                        className={cn("px-3 py-1 text-xs font-medium transition-colors",
                                            stratView === v ? "bg-indigo-500/15 text-indigo-300" : "text-neutral-500 hover:text-neutral-300"
                                        )}>
                                        {t(`stratbook.view_${v}`)}
                                    </button>
                                ))}
                            </div>

                            <button onClick={() => updateFiltersWithUrl({ favoritesOnly: !filters.favoritesOnly })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                                    filters.favoritesOnly ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                                }`}>
                                <Star className={`w-3 h-3 ${filters.favoritesOnly ? "fill-amber-400" : ""}`} />
                            </button>

                            <button onClick={() => setShowForm(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4338ca]/40 bg-[#4338ca]/10 text-[#8b83f7] hover:bg-[#4338ca]/20 text-xs font-medium transition-colors">
                                <Plus className="w-3 h-3" />
                                {t("stratbook.new_strat")}
                            </button>
                        </div>
                    </div>

                    {/* Map chips — always visible */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <FilterChip label={t("stratbook.filter_all")} active={filters.map === ""} onClick={() => updateFiltersWithUrl({ map: "" })} />
                        {maps.map(m => (
                            <FilterChip key={m.value} label={m.label} active={filters.map === m.value} onClick={() => updateFiltersWithUrl({ map: m.value })} />
                        ))}
                    </div>

                    {/* Select + side toggle + filters + result count + pagination */}
                    <div className="flex items-center flex-wrap gap-2">
                        {isStaff && (
                            <button onClick={toggleEditMode}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-colors ${
                                    editMode
                                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                                        : "border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                                }`}>
                                <Check className="w-3 h-3" />
                                {editMode ? t("stratbook.exit_select_mode") : t("stratbook.select_mode")}
                            </button>
                        )}

                        {/* Side toggle (All / T / CT) */}
                        <div className="flex rounded-lg border border-neutral-700/50 overflow-hidden">
                            {[{ value: "", label: t("stratbook.filter_all") }, ...SIDES.map(s => ({ value: s, label: t(`stratbook.side_${s.toLowerCase()}`) }))].map(opt => (
                                <button key={opt.value} onClick={() => updateFiltersWithUrl({ side: opt.value as StratSide | "" })}
                                    className={cn("px-3 py-1 text-xs font-medium transition-colors",
                                        filters.side === opt.value ? "bg-indigo-500/15 text-indigo-300" : "text-neutral-500 hover:text-neutral-300"
                                    )}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className={`flex items-center rounded-lg border text-[11px] transition-colors ${
                            hasAdvancedFilters
                                ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                                : showAdvancedFilters
                                ? "border-neutral-700 bg-neutral-800 text-neutral-300"
                                : "border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                        }`}>
                            <button onClick={() => setShowAdvancedFilters(v => !v)} className="flex items-center gap-1.5 px-2.5 py-1">
                                <SlidersHorizontal className="w-3 h-3" />
                                {t("stratbook.filters")}
                            </button>
                            {hasAdvancedFilters && (
                                <button onClick={() => updateFiltersWithUrl({ type: "", status: "", tag: "", favoritesOnly: false })}
                                    className="pr-2 pl-0.5 py-1 hover:text-white transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        <p className={`text-xs transition-colors duration-150 ${isLoading ? "text-neutral-800" : "text-neutral-600"}`}>
                            {t("stratbook.result_count", { count: totalElements })}
                        </p>

                        <div className="ml-auto">
                        <PaginationTop
                            page={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            onPageChange={goToPage}
                            onPageSizeChange={changePageSize}
                            label={t("stratbook.per_page")}
                        />
                        </div>
                    </div>

                    {/* Advanced filter panel */}
                    {showAdvancedFilters && (
                        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-3">
                            <FilterRow label={t("stratbook.type")} options={[{ value: "", label: t("stratbook.filter_all") }, ...TYPES.map(tp => ({ value: tp, label: t(`stratbook.type_${tp.toLowerCase()}`) }))]} active={filters.type} onChange={v => updateFiltersWithUrl({ type: v as StratType | "" })} />
                        </div>
                    )}

                    {/* Content */}
                    {(() => {
                        const visibleStrats = content.filter(s =>
                            stratView === "drafts" ? s.status === "DRAFT" : s.status !== "DRAFT"
                        );

                        if (!isLoading && visibleStrats.length === 0) return (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4">
                                    <BookOpen className="w-7 h-7 text-neutral-500" />
                                </div>
                                <p className="text-neutral-400 font-medium">
                                    {stratView === "drafts" ? t("stratbook.empty_drafts") : (filters.map || filters.side || hasAdvancedFilters) ? t("stratbook.empty_filtered") : t("stratbook.empty")}
                                </p>
                                <p className="text-neutral-600 text-sm mt-1">{t("stratbook.empty_hint")}</p>
                            </div>
                        );

                        if (isLoading && visibleStrats.length === 0) return null;

                        return (
                            <>
                                <div className={`space-y-3 transition-opacity duration-150 ${isRefreshing ? "opacity-60" : "opacity-100"}`}>
                                    {visibleStrats.map(s => (
                                        <div key={s.id} className="relative">
                                            {editMode && isStaff && (
                                                <div onClick={() => toggleSelect(s.id)}
                                                    className={`absolute -left-7 top-1/2 -translate-y-1/2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer z-10 ${
                                                        selectedIds.has(s.id) ? "bg-indigo-600 border-indigo-600" : "border-neutral-600 hover:border-neutral-400"
                                                    }`}>
                                                    {selectedIds.has(s.id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                </div>
                                            )}
                                            <StratCard strat={s} onClick={handleStratClick} onToggleFavorite={canFavorite ? handleToggleFavorite : undefined} canFavorite={canFavorite} />
                                        </div>
                                    ))}
                                </div>
                                <PaginationBottom
                                    page={currentPage}
                                    totalPages={totalPages}
                                    totalElements={totalElements}
                                    pageSize={pageSize}
                                    onPageChange={goToPage}
                                />
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Bulk action bar */}
            {editMode && selectedIds.size > 0 && (
                <div className="border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-sm px-8 py-3">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <span className="text-sm text-neutral-400">
                            {t("stratbook.selected_count", { count: selectedIds.size })}
                        </span>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedIds(new Set())}
                                className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
                                {t("stratbook.deselect_all")}
                            </button>
                            <button onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold text-white transition-colors">
                                {t("stratbook.bulk_delete", { count: selectedIds.size })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <ConfirmModal
                    title={t("stratbook.bulk_delete_confirm_title")}
                    description={t("stratbook.bulk_delete_confirm_desc", { count: selectedIds.size })}
                    confirmLabel={t("stratbook.bulk_delete", { count: selectedIds.size })}
                    cancelLabel={t("common.cancel")}
                    variant="danger"
                    onConfirm={handleBulkDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </div>
    );
}

// ── Filter components ─────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick, variant }: {
    label: string; active: boolean; onClick: () => void; variant?: "amber" | "blue";
}) {
    const activeClass = variant === "amber"
        ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
        : variant === "blue"
        ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
        : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400";

    return (
        <button
            onClick={onClick}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                active ? activeClass : "bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
            }`}
        >
            {label}
        </button>
    );
}

function FilterRow({ label, options, active, onChange }: {
    label: string; options: { value: string; label: string }[]; active: string; onChange: (value: string) => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wider w-16 shrink-0">{label}</span>
            <div className="flex flex-wrap gap-1.5">
                {options.map(opt => (
                    <FilterChip key={opt.value} label={opt.label} active={active === opt.value} onClick={() => onChange(opt.value)} />
                ))}
            </div>
        </div>
    );
}
