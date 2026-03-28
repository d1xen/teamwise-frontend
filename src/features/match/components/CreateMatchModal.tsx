import { type FormEvent, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown, PenLine, Loader, AlertTriangle } from "lucide-react";
import FaceitIcon from "@/shared/components/FaceitIcon";
import type { CreateMatchRequest, MatchFormat, MatchType } from "@/api/types/match";
import type { CompetitionSummaryDto } from "@/api/types/competition";
import { getActiveCompetitions } from "@/api/endpoints/competition.api";
import { discoverFaceitCompetition } from "@/api/endpoints/faceit.api";
import { useTeam } from "@/contexts/team/useTeam";
import DatePicker from "@/design-system/components/DatePicker";
import TimePicker from "@/design-system/components/TimePicker";
import toast from "react-hot-toast";
import { mapFaceitImportError } from "@/shared/utils/faceitErrors";

interface CreateMatchModalProps {
    onClose: () => void;
    onSubmit: (payload: CreateMatchRequest) => Promise<boolean>;
    onFaceitImported?: () => void;
}

type Mode = "choose" | "manual";

const MATCH_TYPES: MatchType[] = ["OFFICIAL", "SCRIM"];
const MATCH_FORMATS: MatchFormat[] = ["BO1", "BO3", "BO5"];

function chip(active: boolean) {
    return active
        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
        : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700";
}

const LABEL = "block text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-2";
const INPUT = "w-full bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/40 transition-colors";

export default function CreateMatchModal({ onClose, onSubmit, onFaceitImported }: CreateMatchModalProps) {
    const { t } = useTranslation();
    const { team, members } = useTeam();
    const [mode, setMode] = useState<Mode>("choose");
    const isFaceitTeam = team?.game === "CS2";

    const activePlayers = members.filter(m => m.role === "PLAYER" && m.activePlayer !== false);
    const linkedCount = activePlayers.filter(m => m.faceitNickname != null).length;
    const canImport = linkedCount >= 3;

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 pt-6 pb-5">
                    <h2 className="text-base font-semibold text-white">
                        {mode === "manual" ? t("matches.create_manual") : t("matches.create_title")}
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-600 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {mode === "choose" && (
                    <ChooseScreen
                        teamId={team?.id ?? ""}
                        isFaceitTeam={isFaceitTeam}
                        canImport={canImport}
                        linkedCount={linkedCount}
                        totalPlayers={activePlayers.length}
                        onManual={() => setMode("manual")}
                        onImported={() => { onFaceitImported?.(); onClose(); }}
                    />
                )}
                {mode === "manual" && (
                    <ManualForm onClose={onClose} onSubmit={onSubmit} onBack={() => setMode("choose")} teamId={team?.id ?? ""} />
                )}
            </div>
        </div>
    );
}

// ── Choose screen with inline FACEIT import ─────────────────────────────────

function ChooseScreen({ teamId, isFaceitTeam, canImport, linkedCount, totalPlayers, onManual, onImported }: {
    teamId: string | number; isFaceitTeam: boolean; canImport: boolean;
    linkedCount: number; totalPlayers: number;
    onManual: () => void; onImported: () => void;
}) {
    const { t } = useTranslation();
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleImport = async () => {
        if (!url.trim() || !canImport) return;
        setIsLoading(true);
        try {
            const result = await discoverFaceitCompetition(teamId, url.trim());
            if (result.imported > 0) {
                toast.success(t("faceit.discover_success", { count: result.imported }));
            } else if (result.skipped > 0) {
                toast(t("faceit.discover_already_exists"), { icon: "ℹ️" });
            } else {
                toast.success(t("faceit.discover_competition_added"));
            }
            onImported();
        } catch (err: unknown) {
            const apiErr = err as { message?: string };
            toast.error(t(mapFaceitImportError(apiErr?.message)));
        } finally { setIsLoading(false); }
    };

    return (
        <div className="px-6 pb-6 space-y-3">
            {/* Manual creation */}
            <button onClick={onManual}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40 transition-all text-left">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <PenLine className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">{t("matches.create_manual")}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{t("matches.create_manual_hint")}</p>
                </div>
            </button>

            {/* FACEIT import inline */}
            {isFaceitTeam && (
                <div className={`rounded-xl border p-4 space-y-3 ${canImport ? "border-orange-500/20 bg-orange-500/[0.02]" : "border-neutral-800 bg-neutral-900/30"}`}>
                    <div className="flex items-center gap-2">
                        <FaceitIcon className={`w-4 h-4 ${canImport ? "text-orange-400" : "text-neutral-600"}`} />
                        <span className={`text-sm font-semibold ${canImport ? "text-white" : "text-neutral-500"}`}>{t("matches.import_faceit")}</span>
                        {!canImport && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        {!canImport && <span className="text-[10px] text-amber-400 font-medium ml-auto">{linkedCount}/{totalPlayers} {t("faceit.players_linked_short")}</span>}
                    </div>

                    {canImport ? (
                        <>
                            <p className="text-xs text-neutral-500 leading-relaxed">{t("matches.import_faceit_info")}</p>
                            <div className="flex gap-2">
                                <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                                    placeholder={t("faceit.discover_placeholder")} className={`${INPUT} flex-1`}
                                    onKeyDown={e => e.key === "Enter" && handleImport()} />
                                <button onClick={handleImport} disabled={isLoading || !url.trim()}
                                    className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0">
                                    {isLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <FaceitIcon className="w-3.5 h-3.5" />}
                                    {t("common.import")}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-400/80 leading-relaxed">{t("faceit.import_blocked_tooltip")}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Manual form ─────────────────────────────────────────────────────────────

function ManualForm({ onClose, onSubmit, onBack, teamId }: { onClose: () => void; onSubmit: (p: CreateMatchRequest) => Promise<boolean>; onBack: () => void; teamId: string | number }) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const [type, setType] = useState<MatchType>("OFFICIAL");
    const [opponentName, setOpponentName] = useState("");
    const [matchUrl, setMatchUrl] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("20:00");
    const [format, setFormat] = useState<MatchFormat>("BO1");
    const [competitionId, setCompetitionId] = useState<number | null>(null);
    const [notes, setNotes] = useState("");

    const [activeCompetitions, setActiveCompetitions] = useState<CompetitionSummaryDto[]>([]);
    useEffect(() => {
        if (teamId) getActiveCompetitions(teamId).then(setActiveCompetitions).catch(() => {});
    }, [teamId]);

    const canSubmit = !!scheduledDate;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsSubmitting(true);
        const ok = await onSubmit({
            type, opponentName: opponentName.trim() || null, opponentLogo: null,
            matchUrl: matchUrl.trim() || null,
            scheduledAt: new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString(),
            format, competitionId: competitionId || null, notes: notes.trim() || null,
        });
        setIsSubmitting(false);
        if (ok) onClose();
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <p className={LABEL}>{t("matches.type")}</p>
                        <div className="flex gap-2">
                            {MATCH_TYPES.map(mt => (
                                <button key={mt} type="button" onClick={() => { setType(mt); if (mt === "SCRIM") setCompetitionId(null); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(type === mt)}`}>
                                    {t(`matches.type_${mt.toLowerCase()}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className={LABEL}>{t("matches.format")}</p>
                        <div className="flex gap-2">
                            {MATCH_FORMATS.map(mf => (
                                <button key={mf} type="button" onClick={() => setFormat(mf)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors font-mono ${chip(format === mf)}`}>
                                    {mf}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-neutral-800/60" />

                {type === "OFFICIAL" && (
                    <div>
                        <label className={LABEL}>{t("matches.competition_name")}</label>
                        <select value={competitionId ?? ""} onChange={e => setCompetitionId(e.target.value ? Number(e.target.value) : null)} className={INPUT}>
                            <option value="">{t("competitions.none")}</option>
                            {activeCompetitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={LABEL}>
                                {t("matches.opponent_name")}
                                <span className="ml-1.5 text-neutral-700 normal-case tracking-normal font-normal text-[10px]">{t("matches.tba_hint")}</span>
                            </label>
                            <input type="text" value={opponentName} onChange={e => setOpponentName(e.target.value)}
                                placeholder={t("matches.opponent_name_placeholder")} autoFocus className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>
                                {t("matches.scheduled_at")}<span className="ml-1 text-indigo-500 normal-case tracking-normal font-normal">*</span>
                            </label>
                            <div className="flex gap-2">
                                <DatePicker value={scheduledDate} onChange={setScheduledDate} />
                                <TimePicker value={scheduledTime} onChange={setScheduledTime} className="w-[110px]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-neutral-800/60" />

                <div>
                    <button type="button" onClick={() => setShowOptions(v => !v)}
                        className="w-full flex items-center justify-between text-xs text-neutral-600 hover:text-neutral-400 transition-colors py-0.5">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">{t("matches.more_options")}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showOptions ? "rotate-180" : ""}`} />
                    </button>
                    {showOptions && (
                        <div className="mt-4 space-y-3">
                            <div>
                                <label className={LABEL}>{t("matches.match_url")}</label>
                                <input type="url" value={matchUrl} onChange={e => setMatchUrl(e.target.value)} placeholder="https://..." className={INPUT} />
                            </div>
                            <div>
                                <label className={LABEL}>{t("matches.notes")}</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("matches.notes_placeholder")} rows={2} className={`${INPUT} resize-none`} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 pt-4 pb-6 flex gap-3 mt-2">
                <button type="button" onClick={onBack}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors">
                    {t("common.back")}
                </button>
                <button type="submit" disabled={isSubmitting || !canSubmit}
                    className="flex-1 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors">
                    {isSubmitting ? t("common.saving") : t("matches.create_button")}
                </button>
            </div>
        </form>
    );
}
