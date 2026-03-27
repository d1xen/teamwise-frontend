import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { X, Loader2, RotateCcw, ChevronDown } from "lucide-react";
import type {
    MatchDto, MatchFormat, MatchType,
    MatchMapDto, UpdateMapScoreRequest, UpdateMatchRequest,
} from "@/api/types/match";
import type { CompetitionSummaryDto } from "@/api/types/competition";
import { getActiveCompetitions } from "@/api/endpoints/competition.api";
import type { Game } from "@/api/types/team";
import { getMapsForGame, getMapLabel } from "@/shared/config/gameConfig";
import { useTeam } from "@/contexts/team/useTeam";
import DatePicker from "@/design-system/components/DatePicker";
import TimePicker from "@/design-system/components/TimePicker";
import MetaInfo from "@/shared/components/MetaInfo";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MapRow {
    id: number;
    orderIndex: number;
    mapName: string;
    ourScore: string;
    theirScore: string;
}

export interface EditMatchModalProps {
    match: MatchDto;
    teamTag: string;
    game: Game;
    onClose: () => void;
    onUpdateMatch: (matchId: number, payload: UpdateMatchRequest) => Promise<MatchDto | null>;
    onSaveMap: (matchId: number, mapId: number, payload: UpdateMapScoreRequest, silent?: boolean) => Promise<boolean>;
    /** When true, opens directly in score-completion mode */
    completeMode?: boolean | undefined;
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

function requiredWins(format: MatchFormat): number {
    return format === "BO3" ? 2 : format === "BO5" ? 3 : 1;
}

function rowResult(our: string, their: string): "win" | "loss" | "draw" | null {
    if (our === "" || their === "") return null;
    const o = Number(our), t = Number(their);
    if (o > t) return "win";
    if (t > o) return "loss";
    return "draw";
}

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


function toLocalDate(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalTime(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FORMATS: MatchFormat[] = ["BO1", "BO3", "BO5"];

// Grid: [24px index] [1fr map] [64px our] [20px sep] [64px their] [28px badge] [32px action]
const GRID = "24px 1fr 64px 20px 64px 28px 32px";

// ── Component ─────────────────────────────────────────────────────────────────

export default function EditMatchModal({
    match, teamTag, game, onClose, onUpdateMatch, onSaveMap, completeMode,
}: EditMatchModalProps) {
    const { t } = useTranslation();
    const { team } = useTeam();
    const gameMaps = getMapsForGame(game);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    // ── Metadata state ────────────────────────────────────────────────────────
    const [type, setType]                       = useState<MatchType>(match.type);
    const [format, setFormat]                   = useState<MatchFormat>(match.format);
    const [opponentName, setOpponentName]       = useState(match.opponentName ?? "");
    const [scheduledDate, setScheduledDate]     = useState(() => toLocalDate(match.scheduledAt));
    const [scheduledTime, setScheduledTime]     = useState(() => toLocalTime(match.scheduledAt));
    const [matchUrl, setMatchUrl]               = useState(match.matchUrl ?? "");
    const [competitionId, setCompetitionId]       = useState<number | null>(match.competitionId ?? null);
    const [notes, setNotes]                     = useState(match.notes ?? "");
    const [showMore, setShowMore]               = useState(false);

    const [activeCompetitions, setActiveCompetitions] = useState<CompetitionSummaryDto[]>([]);
    useEffect(() => {
        if (team?.id) {
            getActiveCompetitions(team.id).then(setActiveCompetitions).catch(() => {});
        }
    }, [team?.id]);

    // ── Score state (TO_COMPLETE and COMPLETED only) ──────────────────────────
    const hasScores = completeMode || match.state === "TO_COMPLETE" || match.state === "COMPLETED";
    const [showMetadata, setShowMetadata] = useState(!hasScores);
    const [rows, setRows]           = useState<MapRow[]>(match.maps.map(toRow));
    const [validated, setValidated] = useState<Set<number>>(
        () => new Set(match.maps.filter(m => m.ourScore !== null).map(m => m.id))
    );

    // ── Saving state ──────────────────────────────────────────────────────────
    const [saving, setSaving]           = useState(false);
    const [savingFormat, setSavingFormat] = useState(false);
    const [resettingId, setResettingId]   = useState<number | null>(null);

    const isLocked = saving || savingFormat || resettingId !== null;

    // ── Derived score state ───────────────────────────────────────────────────
    const req         = requiredWins(format);
    const deadRows    = computeDeadRows(rows, validated, req);
    const scoredRows  = rows.filter(r => !deadRows.has(r.id) && r.ourScore !== "" && r.theirScore !== "");
    const ourWins     = scoredRows.filter(r => Number(r.ourScore) > Number(r.theirScore)).length;
    const theirWins   = scoredRows.filter(r => Number(r.theirScore) > Number(r.ourScore)).length;
    const matchResult = ourWins >= req ? "win" : theirWins >= req ? "loss" : null;
    const pendingRows = rows.filter(r =>
        !validated.has(r.id) && !deadRows.has(r.id) &&
        r.ourScore !== "" && r.theirScore !== ""
    );

    // ── Sync rows after live format change ────────────────────────────────────
    const syncFromMatch = (updated: MatchDto) => {
        setFormat(updated.format);
        setRows(prev => {
            const existingById = new Map(prev.map(r => [r.id, r]));
            return updated.maps.map(m => existingById.get(m.id) ?? toRow(m));
        });
        setValidated(prev => {
            const validMapIds = new Set(updated.maps.map(m => m.id));
            return new Set([...prev].filter(id => validMapIds.has(id)));
        });
    };

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleFormatChange = async (fmt: MatchFormat) => {
        if (fmt === format || isLocked) return;
        setSavingFormat(true);
        const updated = await onUpdateMatch(match.id, { format: fmt });
        setSavingFormat(false);
        if (updated) syncFromMatch(updated);
    };

    const handleTypeChange = (tp: MatchType) => {
        setType(tp);
    };

    const updateScore = (id: number, field: "ourScore" | "theirScore", raw: string) => {
        const value = raw.replace(/\D/g, "").slice(0, 3);
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
        setValidated(prev => { const s = new Set(prev); s.delete(id); return s; });
    };

    const updateMap = (id: number, value: string) =>
        setRows(prev => prev.map(r => r.id === id ? { ...r, mapName: value } : r));

    const handleReset = async (row: MapRow) => {
        if (isLocked) return;
        setResettingId(row.id);
        const ok = await onSaveMap(
            match.id, row.id,
            { mapName: row.mapName || null, ourScore: null, theirScore: null },
            true
        );
        setResettingId(null);
        if (ok) {
            setRows(prev => prev.map(r => r.id === row.id ? { ...r, ourScore: "", theirScore: "" } : r));
            setValidated(prev => { const s = new Set(prev); s.delete(row.id); return s; });
        }
    };

    const handleSave = async () => {
        if (isLocked) return;
        setSaving(true);

        const payload: UpdateMatchRequest = {
            type,
            opponentName: opponentName.trim() || null,
            matchUrl: matchUrl.trim() || null,
            scheduledAt: scheduledDate ? new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString() : undefined,
            competitionId: competitionId !== match.competitionId
                ? (competitionId ?? -1)
                : undefined,
            notes: notes.trim() || null,
        };

        let metaOk = true;
        let scoresOk = true;

        const updated = await onUpdateMatch(match.id, payload);
        if (!updated) metaOk = false;

        if (pendingRows.length > 0) {
            const results = await Promise.all(
                pendingRows.map(row =>
                    onSaveMap(match.id, row.id, {
                        mapName: row.mapName || null,
                        ourScore: Number(row.ourScore),
                        theirScore: Number(row.theirScore),
                    }, true).then(ok => ({ id: row.id, ok }))
                )
            );
            const savedIds = results.filter(r => r.ok).map(r => r.id);
            if (savedIds.length > 0) setValidated(prev => new Set([...prev, ...savedIds]));
            if (results.some(r => !r.ok)) scoresOk = false;
        }

        setSaving(false);

        if (metaOk && scoresOk) {
            toast.success(t("matches.changes_saved"));
            onClose();
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

                {/* ── Header ────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-800/60 shrink-0">
                    <h2 className="text-base font-semibold text-white">{hasScores && match.state === "TO_COMPLETE" ? t("matches.complete_match") : t("matches.edit_match")}</h2>
                    <button
                        onClick={onClose}
                        disabled={isLocked}
                        className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-600 hover:text-white transition-colors disabled:opacity-40"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Scrollable body ────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">

                    {/* Context summary — always visible when scores shown */}
                    {hasScores && (
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-bold text-white truncate">{opponentName || t("matches.tba")}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] bg-neutral-800 text-neutral-400 border border-neutral-700 font-mono">{format}</span>
                            </div>
                            <div className="text-xs text-neutral-400 tabular-nums shrink-0">
                                {new Date(match.scheduledAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                                {" · "}
                                {new Date(match.scheduledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                            </div>
                        </div>
                    )}

                    {/* Editable metadata — collapsed when scores are the focus */}
                    {hasScores && (
                        <button type="button" onClick={() => setShowMetadata(v => !v)}
                            className="w-full flex items-center justify-between text-[10px] font-semibold text-neutral-600 hover:text-neutral-400 uppercase tracking-wider py-0.5 transition-colors">
                            {t("matches.match_info")}
                            <ChevronDown className={`w-3 h-3 transition-transform ${showMetadata ? "rotate-180" : ""}`} />
                        </button>
                    )}

                    {showMetadata && (<>
                    {/* Type */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">{t("matches.type")}</p>
                        <div className="flex gap-2">
                            {(["OFFICIAL", "SCRIM"] as MatchType[]).map(tp => (
                                <button
                                    key={tp}
                                    type="button"
                                    onClick={() => handleTypeChange(tp)}
                                    disabled={isLocked}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${
                                        type === tp
                                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                                            : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
                                    }`}
                                >
                                    {t(`matches.type_${tp.toLowerCase()}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">{t("matches.format")}</p>
                            {savingFormat && <Loader2 className="w-3 h-3 animate-spin text-neutral-600" />}
                        </div>
                        <div className="flex gap-2">
                            {FORMATS.map(fmt => (
                                <button
                                    key={fmt}
                                    type="button"
                                    onClick={() => handleFormatChange(fmt)}
                                    disabled={isLocked}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono transition-colors disabled:cursor-not-allowed ${
                                        format === fmt
                                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                                            : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 disabled:opacity-40"
                                    }`}
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Opponent + Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">{t("matches.opponent_name")}</p>
                            <input
                                type="text"
                                value={opponentName}
                                onChange={e => setOpponentName(e.target.value)}
                                placeholder={t("matches.opponent_name_placeholder")}
                                disabled={isLocked}
                                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">{t("matches.scheduled_at")}</p>
                            <div className="flex gap-2">
                                <DatePicker value={scheduledDate} onChange={setScheduledDate} />
                                <TimePicker value={scheduledTime} onChange={setScheduledTime} className="w-[110px]" />
                            </div>
                        </div>
                    </div>

                    {/* Match URL */}
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">{t("matches.match_url")}</p>
                        <input
                            type="url"
                            value={matchUrl}
                            onChange={e => setMatchUrl(e.target.value)}
                            placeholder="https://..."
                            disabled={isLocked}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                        />
                    </div>

                    {/* More options */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowMore(v => !v)}
                            className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
                        >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMore ? "rotate-180" : ""}`} />
                            {t("matches.more_options")}
                        </button>

                        {showMore && (
                            <div className="mt-4 space-y-4">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">{t("matches.competition_name")}</p>
                                    <select
                                        value={competitionId ?? ""}
                                        onChange={e => setCompetitionId(e.target.value ? Number(e.target.value) : null)}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                                    >
                                        <option value="">{t("competitions.none")}</option>
                                        {activeCompetitions.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                        {match.competitionId && !activeCompetitions.some(c => c.id === match.competitionId) && (
                                            <option value={match.competitionId}>{match.competitionName ?? `#${match.competitionId}`}</option>
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">{t("matches.notes")}</p>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={2}
                                        disabled={isLocked}
                                        placeholder={t("matches.notes_placeholder")}
                                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    </>)}

                    {/* ── Score section ──────────────────────────────────── */}
                    {hasScores && (
                        <div className="border-t border-neutral-800/60 pt-5 space-y-3">

                            {/* Mini scoreboard */}
                            <div className="px-5 py-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                                <div className="flex items-center justify-between gap-4">
                                    <span className={`flex-1 text-sm font-bold tracking-wide truncate ${ourWins > theirWins ? "text-white" : "text-neutral-500"}`}>
                                        {teamTag}
                                    </span>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <span className={`text-3xl font-black tabular-nums leading-none ${ourWins > theirWins ? "text-white" : "text-neutral-700"}`}>
                                            {ourWins}
                                        </span>
                                        <div className="flex flex-col items-center gap-1">
                                            {matchResult ? (
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
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
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {rows.map(r => {
                                                        const isDead = deadRows.has(r.id);
                                                        const isVal  = validated.has(r.id);
                                                        const res    = rowResult(r.ourScore, r.theirScore);
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
                                        <span className={`text-3xl font-black tabular-nums leading-none ${theirWins > ourWins ? "text-white" : "text-neutral-700"}`}>
                                            {theirWins}
                                        </span>
                                    </div>
                                    <span className={`flex-1 text-sm font-bold tracking-wide truncate text-right ${theirWins > ourWins ? "text-white" : "text-neutral-500"}`}>
                                        {opponentName.trim() || t("matches.tba")}
                                    </span>
                                </div>
                            </div>

                            {/* Column headers */}
                            <div
                                className="px-1 items-center text-[10px] font-semibold text-neutral-600 uppercase tracking-wider"
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

                            <div className="border-t border-neutral-800/50" />

                            {/* Map rows */}
                            <div className="py-1">
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
                                                <span className="text-[10px] font-mono text-neutral-700 text-right">{row.orderIndex}</span>

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
                                                            disabled={saving}
                                                            className="w-full bg-transparent border-0 border-b border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-none px-0 py-0.5 text-sm text-neutral-300 focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
                                                        >
                                                            <option value="" className="bg-neutral-900 text-neutral-500">{t("matches.map_select_placeholder")}</option>
                                                            {gameMaps.map(m => (
                                                                <option key={m.value} value={m.value} className="bg-neutral-900 text-white">{m.label}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>

                                                {val ? (
                                                    <div className={`h-8 rounded-lg flex items-center justify-center text-sm font-bold ${result === "win" ? "bg-emerald-500/15 text-emerald-300" : "bg-neutral-800/60 text-neutral-300"}`}>
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
                                                        disabled={saving}
                                                        className="h-8 w-full rounded-lg border border-neutral-800 bg-neutral-900/80 text-center text-sm font-bold text-neutral-200 focus:outline-none focus:border-indigo-500/40 transition-colors placeholder-neutral-700 disabled:opacity-50"
                                                    />
                                                )}

                                                <span className="text-center text-neutral-700 text-sm select-none">:</span>

                                                {val ? (
                                                    <div className={`h-8 rounded-lg flex items-center justify-center text-sm font-bold ${result === "loss" ? "bg-red-500/15 text-red-300" : "bg-neutral-800/60 text-neutral-300"}`}>
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
                                                        disabled={saving}
                                                        className="h-8 w-full rounded-lg border border-neutral-800 bg-neutral-900/80 text-center text-sm font-bold text-neutral-200 focus:outline-none focus:border-indigo-500/40 transition-colors placeholder-neutral-700 disabled:opacity-50"
                                                    />
                                                )}

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
                        </div>
                    )}
                </div>

                {/* ── Footer ────────────────────────────────────────────── */}
                <div className="px-6 pt-3 pb-5 shrink-0 space-y-3">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLocked}
                            className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors disabled:opacity-40"
                        >
                            {t("common.close")}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLocked}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
                        >
                            {saving
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t("common.saving")}</>
                                : t("matches.save_changes")
                            }
                        </button>
                    </div>
                    <MetaInfo createdAt={match.createdAt} updatedAt={match.updatedAt}
                        createdBy={match.createdByNickname} updatedBy={match.updatedByNickname} />
                </div>
            </div>
        </div>
    );
}
