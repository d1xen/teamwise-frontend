import { type FormEvent, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown, Hand, Loader, AlertTriangle, ArrowLeft } from "lucide-react";
import FaceitIcon from "@/shared/components/FaceitIcon";
import { cn } from "@/design-system";
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
    initialDate?: string | undefined;
    onBack?: (() => void) | undefined;
}

type Mode = "choose" | "manual" | "faceit";

const MATCH_TYPES: MatchType[] = ["OFFICIAL", "SCRIM"];
const MATCH_FORMATS: MatchFormat[] = ["BO1", "BO3", "BO5"];

function chip(active: boolean) {
    return active
        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
        : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700";
}

const LABEL = "block text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-2";
const INPUT = "w-full bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/40 transition-colors";

export default function CreateMatchModal({ onClose, onSubmit, onFaceitImported, initialDate, onBack }: CreateMatchModalProps) {
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
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                        {onBack && (
                            <button type="button" onClick={() => { onClose(); onBack(); }} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        )}
                        <h2 className="text-base font-semibold text-white">
                            {mode === "manual" ? t("matches.create_manual") : t("matches.create_title")}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-600 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {mode === "choose" && (
                    <ChooseScreen
                        isFaceitTeam={isFaceitTeam}
                        canImport={canImport}
                        onManual={() => setMode("manual")}
                        onImportMode={() => setMode("faceit")}
                    />
                )}
                {mode === "manual" && (
                    <ManualForm onClose={onClose} onSubmit={onSubmit} onBack={() => setMode("choose")} teamId={team?.id ?? ""} initialDate={initialDate} />
                )}
                {mode === "faceit" && (
                    <FaceitImportView teamId={team?.id ?? ""} onImported={() => { onFaceitImported?.(); onClose(); }} onBack={() => setMode("choose")} />
                )}
            </div>
        </div>
    );
}

// ── Choose screen with inline FACEIT import ─────────────────────────────────

function ChooseScreen({ isFaceitTeam, canImport, onManual, onImportMode }: {
    isFaceitTeam: boolean; canImport: boolean;
    onManual: () => void; onImportMode: () => void;
}) {
    const { t } = useTranslation();

    return (
        <>
            <div className="px-6 py-5 space-y-2.5">
                <button onClick={onManual}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40 transition-all text-left">
                    <div className="w-9 h-9 rounded-lg bg-neutral-700/40 border border-neutral-600/40 flex items-center justify-center shrink-0 text-neutral-300">
                        <Hand className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-neutral-200">{t("matches.create_manual")}</span>
                </button>

                {isFaceitTeam && (
                    <button onClick={canImport ? onImportMode : undefined}
                        className={cn("w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left",
                            canImport ? "border-orange-500/20 hover:border-orange-500/30 hover:bg-orange-500/[0.03]" : "border-neutral-800 opacity-50 cursor-not-allowed")}>
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                            canImport ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-neutral-800 border-neutral-700 text-neutral-600")}>
                            <FaceitIcon className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className={cn("text-sm font-semibold", canImport ? "text-neutral-200" : "text-neutral-500")}>{t("matches.import_faceit")}</span>
                            {!canImport && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                    </button>
                )}
            </div>
        </>
    );
}

// ── Manual form ─────────────────────────────────────────────────────────────

function ManualForm({ onClose, onSubmit, onBack, teamId, initialDate }: { onClose: () => void; onSubmit: (p: CreateMatchRequest) => Promise<boolean>; onBack: () => void; teamId: string | number; initialDate?: string | undefined }) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const [type, setType] = useState<MatchType>("OFFICIAL");
    const [opponentName, setOpponentName] = useState("");
    const [matchUrl, setMatchUrl] = useState("");
    const [scheduledDate, setScheduledDate] = useState(initialDate ?? "");
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
            <div className="px-6 pt-5 space-y-5">
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

                <div>
                    <label className={LABEL}>{t("matches.match_url")}</label>
                    <input type="url" value={matchUrl} onChange={e => setMatchUrl(e.target.value)} placeholder="https://..." className={INPUT} />
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

// ── FACEIT import view ──────────────────────────────────────────────────────

function FaceitImportView({ teamId, onImported, onBack }: { teamId: string | number; onImported: () => void; onBack: () => void }) {
    const { t } = useTranslation();
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleImport = async () => {
        if (!url.trim()) return;
        setIsLoading(true);
        try {
            const result = await discoverFaceitCompetition(teamId, url.trim());
            if (result.imported > 0) toast.success(t("faceit.discover_success", { count: result.imported }));
            else if (result.skipped > 0) toast(t("faceit.discover_already_exists"), { icon: "ℹ️" });
            else toast.success(t("faceit.discover_competition_added"));
            onImported();
        } catch (err: unknown) {
            const apiErr = err as { message?: string };
            toast.error(t(mapFaceitImportError(apiErr?.message)));
        } finally { setIsLoading(false); }
    };

    return (
        <div className="px-6 pt-5 pb-6 space-y-5">
            <p className="text-sm text-neutral-400 leading-relaxed">{t("matches.import_faceit_info")}</p>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                placeholder={t("faceit.discover_placeholder")} className={INPUT} autoFocus
                onKeyDown={e => e.key === "Enter" && handleImport()} />
            <div className="flex gap-3">
                <button type="button" onClick={onBack}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors">
                    {t("common.back")}
                </button>
                <button onClick={handleImport} disabled={isLoading || !url.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-orange-400 transition-colors flex items-center justify-center gap-2">
                    {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                    {t("common.import")}
                </button>
            </div>
        </div>
    );
}
