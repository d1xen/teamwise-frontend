import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { X, Loader2, RotateCcw } from "lucide-react";
import type { MatchDto, MatchFormat, MatchMapDto, UpdateMapScoreRequest, UpdateMatchRequest } from "@/api/types/match";
import type { Game } from "@/api/types/team";
import { getMapsForGame, getMapLabel } from "@/shared/config/gameConfig";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MapRow {
    id: number;
    orderIndex: number;
    mapName: string;
    ourScore: string;
    theirScore: string;
}

interface ScoreModalProps {
    match: MatchDto;
    teamTag: string;
    game: Game;
    onClose: () => void;
    onSaveMap: (matchId: number, mapId: number, payload: UpdateMapScoreRequest, silent?: boolean) => Promise<boolean>;
    onUpdateMatch?: (matchId: number, payload: UpdateMatchRequest) => Promise<MatchDto | null>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toRow(map: MatchMapDto): MapRow {
    return {
        id: map.id,
        orderIndex: map.orderIndex,
        mapName: map.mapName ?? "",
        ourScore: map.ourScore != null ? String(map.ourScore) : "",
        theirScore: map.theirScore != null ? String(map.theirScore) : "",
    };
}

function rowResult(our: string, their: string): "win" | "loss" | "draw" | null {
    if (our === "" || their === "") return null;
    const o = Number(our), t = Number(their);
    if (o > t) return "win";
    if (t > o) return "loss";
    return "draw";
}

function requiredWins(format: MatchFormat): number {
    return format === "BO3" ? 2 : format === "BO5" ? 3 : 1;
}


/**
 * A row is dead if it has no scores AND the series is already decided
 * by previous rows that are either validated or have pending scores.
 */
function computeDeadRows(rows: MapRow[], validated: Set<number>, req: number): Set<number> {
    const dead = new Set<number>();
    let ourWins = 0, theirWins = 0;
    for (const row of rows) {
        const hasScores = row.ourScore !== "" && row.theirScore !== "";
        if (validated.has(row.id) || hasScores) {
            if (Number(row.ourScore) > Number(row.theirScore)) ourWins++;
            else if (Number(row.theirScore) > Number(row.ourScore)) theirWins++;
        } else {
            if (ourWins >= req || theirWins >= req) dead.add(row.id);
        }
    }
    return dead;
}

const FORMATS: MatchFormat[] = ["BO1", "BO3", "BO5"];

// Grid: [24px index] [1fr map] [64px our] [20px sep] [64px their] [28px badge] [32px action]
const GRID = "24px 1fr 64px 20px 64px 28px 32px";

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScoreModal({ match, teamTag, game, onClose, onSaveMap, onUpdateMatch }: ScoreModalProps) {
    const { t } = useTranslation();
    const gameMaps = getMapsForGame(game);

    // ── Local state ───────────────────────────────────────────────────────────
    const [rows, setRows]           = useState<MapRow[]>(match.maps.map(toRow));
    const [validated, setValidated] = useState<Set<number>>(
        () => new Set(match.maps.filter(m => m.ourScore !== null).map(m => m.id))
    );
    const [format, setFormat]           = useState<MatchFormat>(match.format);
    const [opponentName, setOpponentName] = useState(match.opponentName ?? "");
    const [savedOpponent, setSavedOpponent] = useState(match.opponentName ?? "");

    const [savingAll, setSavingAll]     = useState(false);
    const [savingMeta, setSavingMeta]   = useState(false);
    const [resettingId, setResettingId] = useState<number | null>(null);

    // ── Derived state ─────────────────────────────────────────────────────────
    const req      = requiredWins(format);
    const deadRows = computeDeadRows(rows, validated, req);

    const scoredRows  = rows.filter(r => !deadRows.has(r.id) && r.ourScore !== "" && r.theirScore !== "");
    const ourWins     = scoredRows.filter(r => Number(r.ourScore)  > Number(r.theirScore)).length;
    const theirWins   = scoredRows.filter(r => Number(r.theirScore) > Number(r.ourScore)).length;
    const matchResult = ourWins >= req ? "win" : theirWins >= req ? "loss" : null;

    const pendingRows = rows.filter(r =>
        !validated.has(r.id) && !deadRows.has(r.id) &&
        r.ourScore !== "" && r.theirScore !== ""
    );
    const hasPending = pendingRows.length > 0;

    const isLocked = savingAll || savingMeta || resettingId !== null;

    // ── Sync state after a match update ──────────────────────────────────────
    const syncFromMatch = (updated: MatchDto) => {
        setFormat(updated.format);
        setRows(prev => {
            const existingById = new Map(prev.map(r => [r.id, r]));
            // Keep editing state for existing rows, create fresh rows for new maps
            return updated.maps.map(m => existingById.get(m.id) ?? toRow(m));
        });
        setValidated(prev => {
            const validMapIds = new Set(updated.maps.map(m => m.id));
            return new Set([...prev].filter(id => validMapIds.has(id)));
        });
    };

    // ── Handlers ──────────────────────────────────────────────────────────────

    const updateScore = (id: number, field: "ourScore" | "theirScore", raw: string) => {
        const value = raw.replace(/\D/g, "").slice(0, 3);
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
        setValidated(prev => { const s = new Set(prev); s.delete(id); return s; });
    };

    const updateMap = (id: number, value: string) =>
        setRows(prev => prev.map(r => r.id === id ? { ...r, mapName: value } : r));

    const handleSaveAll = async () => {
        if (!hasPending || isLocked) return;
        setSavingAll(true);
        const results = await Promise.all(
            pendingRows.map(row =>
                onSaveMap(match.id, row.id, {
                    mapName: row.mapName || null,
                    ourScore: Number(row.ourScore),
                    theirScore: Number(row.theirScore),
                }, true).then(ok => ({ id: row.id, ok }))
            )
        );
        setSavingAll(false);
        const savedIds = results.filter(r => r.ok).map(r => r.id);
        if (savedIds.length > 0) {
            setValidated(prev => new Set([...prev, ...savedIds]));
            toast.success(t("matches.scores_saved", { count: savedIds.length }));
        }
    };

    const handleReset = async (row: MapRow) => {
        if (isLocked) return;
        setResettingId(row.id);
        const ok = await onSaveMap(match.id, row.id, { mapName: row.mapName || null, ourScore: null, theirScore: null }, true);
        setResettingId(null);
        if (ok) {
            setRows(prev => prev.map(r => r.id === row.id ? { ...r, ourScore: "", theirScore: "" } : r));
            setValidated(prev => { const s = new Set(prev); s.delete(row.id); return s; });
        }
    };

    const handleOpponentBlur = async () => {
        const trimmed = opponentName.trim();
        if (trimmed === savedOpponent || !onUpdateMatch) return;
        setSavingMeta(true);
        const updated = await onUpdateMatch(match.id, { opponentName: trimmed || null });
        setSavingMeta(false);
        if (updated) setSavedOpponent(trimmed);
    };

    const handleFormatChange = async (fmt: MatchFormat) => {
        if (fmt === format || !onUpdateMatch || isLocked) return;
        setSavingMeta(true);
        const updated = await onUpdateMatch(match.id, { format: fmt });
        setSavingMeta(false);
        if (updated) syncFromMatch(updated); // live update — modal stays open
    };

    // ── Escape key ────────────────────────────────────────────────────────────
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-xl" onClick={e => e.stopPropagation()}>

                {/* ── Header ────────────────────────────────────────────── */}
                <div className="flex items-start justify-between px-6 pt-6 pb-4 gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-white mb-2">{t("matches.score_title")}</h2>

                        {/* Opponent name */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-indigo-400 shrink-0">{teamTag}</span>
                            <span className="text-neutral-700 text-sm shrink-0">vs</span>
                            {onUpdateMatch ? (
                                <div className="relative flex-1 min-w-[80px]">
                                    <input
                                        type="text"
                                        value={opponentName}
                                        onChange={e => setOpponentName(e.target.value)}
                                        onBlur={handleOpponentBlur}
                                        placeholder={t("matches.tba")}
                                        disabled={isLocked}
                                        className="w-full bg-transparent border-0 border-b border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 text-sm text-neutral-300 placeholder-neutral-700 focus:outline-none transition-colors py-0.5 disabled:opacity-50"
                                    />
                                    {savingMeta && <Loader2 className="absolute right-0 top-1 w-3 h-3 animate-spin text-neutral-600" />}
                                </div>
                            ) : (
                                <span className="text-sm text-neutral-400">{match.opponentName ?? t("matches.tba")}</span>
                            )}
                        </div>

                        {/* Format chips */}
                        {onUpdateMatch && (
                            <div className="flex items-center gap-1.5 mt-3">
                                {FORMATS.map(fmt => (
                                    <button
                                        key={fmt}
                                        type="button"
                                        onClick={() => handleFormatChange(fmt)}
                                        disabled={isLocked}
                                        className={`relative px-2.5 py-1 rounded-lg text-xs font-bold font-mono border transition-colors disabled:cursor-not-allowed ${
                                            fmt === format
                                                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                                                : "bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 disabled:opacity-40"
                                        }`}
                                    >
                                        {savingMeta && fmt !== format ? null : null}
                                        {fmt}
                                    </button>
                                ))}
                                {savingMeta && (
                                    <Loader2 className="w-3 h-3 animate-spin text-neutral-600 ml-1" />
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLocked}
                        className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-600 hover:text-white transition-colors shrink-0 mt-0.5 disabled:opacity-40"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Scoreboard ────────────────────────────────────────── */}
                <div className="mx-6 mb-5 px-5 py-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                    <div className="flex items-center justify-between gap-4">
                        <span className={`flex-1 text-sm font-bold tracking-wide truncate ${ourWins > theirWins ? "text-white" : "text-neutral-500"}`}>
                            {teamTag}
                        </span>

                        <div className="flex items-center gap-4 shrink-0">
                            <span className={`text-4xl font-black tabular-nums leading-none ${ourWins > theirWins ? "text-white" : "text-neutral-700"}`}>
                                {ourWins}
                            </span>
                            <div className="flex flex-col items-center gap-1">
                                {matchResult ? (
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                        matchResult === "win"
                                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                                            : "bg-red-500/15 text-red-400 border-red-500/20"
                                    }`}>
                                        {matchResult === "win" ? t("matches.result_win") : t("matches.result_lose")}
                                    </span>
                                ) : (
                                    <span className="text-neutral-700 text-lg font-light">—</span>
                                )}
                                {rows.length > 1 && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {rows.map(r => {
                                            const isDead  = deadRows.has(r.id);
                                            const isVal   = validated.has(r.id);
                                            const res     = rowResult(r.ourScore, r.theirScore);
                                            return (
                                                <div key={r.id} className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                                    isDead         ? "bg-neutral-800" :
                                                    res === "win"  ? isVal ? "bg-emerald-400" : "bg-emerald-400/40" :
                                                    res === "loss" ? isVal ? "bg-red-400"     : "bg-red-400/40"     :
                                                    res === "draw" ? "bg-neutral-500" :
                                                                     "bg-neutral-800"
                                                }`} />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <span className={`text-4xl font-black tabular-nums leading-none ${theirWins > ourWins ? "text-white" : "text-neutral-700"}`}>
                                {theirWins}
                            </span>
                        </div>

                        <span className={`flex-1 text-sm font-bold tracking-wide truncate text-right ${theirWins > ourWins ? "text-white" : "text-neutral-500"}`}>
                            {opponentName.trim() || t("matches.tba")}
                        </span>
                    </div>
                </div>

                {/* ── Column headers ────────────────────────────────────── */}
                <div
                    className="px-6 pb-2 items-center text-[10px] font-semibold text-neutral-600 uppercase tracking-wider"
                    style={{ display: "grid", gridTemplateColumns: GRID, gap: "0 12px" }}
                >
                    <span />
                    <span>{t("matches.map_name")}</span>
                    <span className="text-right">{teamTag}</span>
                    <span />
                    <span>{opponentName.trim() || t("matches.tba")}</span>
                    <span />
                    <span />
                </div>

                <div className="border-t border-neutral-800/50 mx-6" />

                {/* ── Map rows ──────────────────────────────────────────── */}
                <div className="px-6 py-1">
                    {rows.map((row, i) => {
                        const val         = validated.has(row.id);
                        const dead        = deadRows.has(row.id);
                        const result      = rowResult(row.ourScore, row.theirScore);
                        const isResetting = resettingId === row.id;

                        return (
                            <div key={row.id}>
                                <div
                                    className={`items-center py-3 transition-opacity duration-200 ${dead ? "opacity-20 pointer-events-none" : ""}`}
                                    style={{ display: "grid", gridTemplateColumns: GRID, gap: "0 12px" }}
                                >
                                    {/* [1] Index */}
                                    <span className="text-[10px] font-mono text-neutral-700 text-right">
                                        {row.orderIndex}
                                    </span>

                                    {/* [2] Map name */}
                                    <div className="min-w-0">
                                        {dead ? (
                                            <span className="block text-xs text-neutral-700 italic">{t("matches.map_not_played")}</span>
                                        ) : val ? (
                                            <span className="block text-sm font-medium text-neutral-200 truncate">
                                                {row.mapName
                                                    ? getMapLabel(row.mapName, game)
                                                    : <span className="text-neutral-600 italic">{t("matches.map_unknown")}</span>
                                                }
                                            </span>
                                        ) : (
                                            <select
                                                value={row.mapName}
                                                onChange={e => updateMap(row.id, e.target.value)}
                                                disabled={savingAll}
                                                className="w-full bg-transparent border-0 border-b border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-none px-0 py-0.5 text-sm text-neutral-300 focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
                                            >
                                                <option value="" className="bg-neutral-900 text-neutral-500">{t("matches.map_select_placeholder")}</option>
                                                {gameMaps.map(m => (
                                                    <option key={m.value} value={m.value} className="bg-neutral-900 text-white">{m.label}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* [3] Our score */}
                                    {val ? (
                                        <div className={`h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                            result === "win" ? "bg-emerald-500/15 text-emerald-300" : "bg-neutral-800/60 text-neutral-300"
                                        }`}>
                                            {row.ourScore}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={3}
                                            value={row.ourScore}
                                            onChange={e => updateScore(row.id, "ourScore", e.target.value)}
                                            placeholder="—"
                                            disabled={savingAll}
                                            className="h-8 w-full rounded-lg border border-neutral-800 bg-neutral-900/80 text-center text-sm font-bold text-neutral-200 focus:outline-none focus:border-indigo-500/40 transition-colors placeholder-neutral-700 disabled:opacity-50"
                                        />
                                    )}

                                    {/* [4] Separator */}
                                    <span className="text-center text-neutral-700 text-sm select-none">:</span>

                                    {/* [5] Their score */}
                                    {val ? (
                                        <div className={`h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                            result === "loss" ? "bg-red-500/15 text-red-300" : "bg-neutral-800/60 text-neutral-300"
                                        }`}>
                                            {row.theirScore}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={3}
                                            value={row.theirScore}
                                            onChange={e => updateScore(row.id, "theirScore", e.target.value)}
                                            placeholder="—"
                                            disabled={savingAll}
                                            className="h-8 w-full rounded-lg border border-neutral-800 bg-neutral-900/80 text-center text-sm font-bold text-neutral-200 focus:outline-none focus:border-indigo-500/40 transition-colors placeholder-neutral-700 disabled:opacity-50"
                                        />
                                    )}

                                    {/* [6] Result badge */}
                                    <div className="flex items-center justify-center">
                                        {!dead && result && (
                                            <span className={`text-[9px] font-black w-6 h-5 flex items-center justify-center rounded ${
                                                result === "win"
                                                    ? val ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-500/10 text-emerald-600"
                                                    : result === "loss"
                                                    ? val ? "bg-red-500/15 text-red-400"         : "bg-red-500/10 text-red-600"
                                                    :       "bg-neutral-800 text-neutral-500"
                                            }`}>
                                                {result === "win" ? "W" : result === "loss" ? "L" : "D"}
                                            </span>
                                        )}
                                    </div>

                                    {/* [7] Reset button — only for validated rows */}
                                    <div className="flex items-center justify-center">
                                        {val && (
                                            <button
                                                onClick={() => handleReset(row)}
                                                disabled={isLocked}
                                                title={t("matches.reset_map")}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-700 hover:text-neutral-400 hover:bg-neutral-800 transition-colors disabled:opacity-30"
                                            >
                                                {isResetting
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    : <RotateCcw className="w-3.5 h-3.5" />
                                                }
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {i < rows.length - 1 && <div className="border-t border-neutral-800/30" />}
                            </div>
                        );
                    })}
                </div>

                {/* ── Footer ────────────────────────────────────────────── */}
                <div className="px-6 pt-3 pb-6 space-y-3">
                    <p className="text-[11px] text-neutral-700">{t("matches.score_help")}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLocked}
                            className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors disabled:opacity-40"
                        >
                            {t("common.close")}
                        </button>
                        {hasPending && (
                            <button
                                onClick={handleSaveAll}
                                disabled={isLocked}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
                            >
                                {savingAll
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t("common.saving")}</>
                                    : t("matches.save_scores")
                                }
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
