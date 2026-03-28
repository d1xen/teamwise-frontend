import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { RefreshCw, Info, Loader, ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/design-system";
import toast from "react-hot-toast";
import FaceitIcon from "@/shared/components/FaceitIcon";
import { triggerFaceitSync } from "@/api/endpoints/faceit.api";

interface FaceitSyncButtonProps {
    teamId: string | number;
    onSynced: () => void;
    linkedCount?: number | undefined;
    totalPlayers?: number | undefined;
}

const STORAGE_KEY = (teamId: string | number) => `tw.faceit.lastSync.${teamId}`;
const PERIOD_KEY = (teamId: string | number) => `tw.faceit.period.${teamId}`;

type SyncPeriod = 1 | 3 | 6 | 12;
const PERIODS: { value: SyncPeriod; labelKey: string }[] = [
    { value: 1,  labelKey: "faceit.range_1m" },
    { value: 3,  labelKey: "faceit.range_3m" },
    { value: 6,  labelKey: "faceit.range_6m" },
    { value: 12, labelKey: "faceit.range_1y" },
];

function getSyncPeriod(teamId: string | number): SyncPeriod {
    try { const v = sessionStorage.getItem(PERIOD_KEY(teamId)); return v ? Number(v) as SyncPeriod : 1; } catch { return 1; }
}
function setSyncPeriod(teamId: string | number, months: SyncPeriod) {
    try { sessionStorage.setItem(PERIOD_KEY(teamId), String(months)); } catch { /* silent */ }
}
function getLastSync(teamId: string | number): string | null {
    try { return sessionStorage.getItem(STORAGE_KEY(teamId)); } catch { return null; }
}
function setLastSync(teamId: string | number) {
    try { sessionStorage.setItem(STORAGE_KEY(teamId), new Date().toISOString()); } catch { /* silent */ }
}

function formatRelativeTime(iso: string | null, t: TFunction): string {
    if (!iso) return t("faceit.never_synced");
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t("faceit.just_now");
    if (minutes < 60) return t("faceit.minutes_ago", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("faceit.hours_ago", { count: hours });
    const days = Math.floor(hours / 24);
    return t("faceit.days_ago", { count: days });
}

export default function FaceitSyncButton({ teamId, onSynced, linkedCount, totalPlayers }: FaceitSyncButtonProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [period, setPeriodState] = useState<SyncPeriod>(() => getSyncPeriod(teamId));
    const ref = useRef<HTMLDivElement>(null);

    const changePeriod = (v: SyncPeriod) => { setPeriodState(v); setSyncPeriod(teamId, v); };
    const canSync = (linkedCount ?? 0) >= 3;
    const lastSync = getLastSync(teamId);
    const relativeTime = canSync ? formatRelativeTime(lastSync, t) : null;

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleSync = async () => {
        if (!canSync) return;
        setIsSyncing(true);
        try {
            const result = await triggerFaceitSync(teamId, period);
            setLastSync(teamId);
            if (result.imported > 0) {
                toast.success(t("faceit.sync_done", { count: result.imported }));
            } else {
                toast.success(t("faceit.sync_up_to_date"));
            }
            onSynced();
        } catch { toast.error(t("faceit.sync_failed")); }
        finally { setIsSyncing(false); }
    };

    return (
        <div ref={ref} className="relative">
            {/* Main button group */}
            <div className={`flex items-center rounded-lg border text-xs font-medium transition-colors ${
                open
                    ? "border-orange-500/40 bg-orange-500/15 text-orange-400"
                    : "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
            }`}>
                <button onClick={() => setOpen(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 transition-colors">
                    <FaceitIcon className="w-3 h-3" />
                    {t("faceit.sync_label")}
                    {!canSync && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </button>
                <div className={`w-px h-4 ${canSync ? "bg-orange-500/20" : "bg-neutral-700"}`} />
                <button onClick={(e) => { e.stopPropagation(); handleSync(); }}
                    disabled={isSyncing || !canSync}
                    className="px-2 py-1.5 transition-colors hover:bg-orange-500/10 rounded-r-lg disabled:opacity-30"
                    title={canSync ? t("faceit.sync_button") : t("faceit.need_more_players")}>
                    {isSyncing ? <Loader className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                </button>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-[540px] rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl shadow-black/40 z-50 overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800/50">
                        <div className="flex items-center gap-2">
                            <FaceitIcon className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-semibold text-white">{t("faceit.sync_label")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {linkedCount != null && totalPlayers != null && (
                                <span className={cn("text-xs", canSync ? "text-neutral-500" : "text-amber-400")}>
                                    {linkedCount}/{totalPlayers} {t("faceit.players_linked_short")}
                                </span>
                            )}
                            {relativeTime && <span className="text-xs text-blue-400">{relativeTime}</span>}
                            {!canSync && <span className="text-xs text-amber-400">{t("faceit.never_synced")}</span>}
                        </div>
                    </div>

                    {/* Warning if not enough players */}
                    {!canSync && (
                        <div className="px-5 py-3 border-b border-neutral-800/50">
                            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                <p className="text-xs text-amber-400/80 leading-relaxed">
                                    {t("faceit.need_more_players_detail", { current: linkedCount ?? 0, required: 3 })}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Sync action + period */}
                    {canSync && (
                        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800/50">
                            <div className="flex items-center gap-1">
                                {PERIODS.map(p => (
                                    <button key={p.value} onClick={() => changePeriod(p.value)}
                                        className={cn("px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                                            period === p.value ? "bg-orange-500/20 text-orange-300" : "text-neutral-600 hover:text-neutral-400"
                                        )}>
                                        {t(p.labelKey)}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleSync} disabled={isSyncing}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white text-xs font-semibold transition-colors">
                                {isSyncing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                {t("faceit.sync_button")}
                            </button>
                        </div>
                    )}

                    {/* How it works */}
                    <div className="px-5 py-4 border-b border-neutral-800/50 space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Info className="w-3.5 h-3.5 text-neutral-500" />
                            <span className="text-xs font-semibold text-neutral-400">{t("faceit.how_it_works_title")}</span>
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed">{t("faceit.how_it_works_1")}</p>
                        <p className="text-xs text-neutral-500 leading-relaxed">{t("faceit.how_it_works_2")}</p>
                        <p className="text-xs text-neutral-500 leading-relaxed">{t("faceit.how_it_works_3")}</p>
                        <p className="text-xs text-neutral-500 leading-relaxed">{t("faceit.how_it_works_4")}</p>
                    </div>

                </div>
            )}
        </div>
    );
}
