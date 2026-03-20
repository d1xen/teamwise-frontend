import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown } from "lucide-react";
import type { CreateMatchRequest, MatchContext, MatchFormat, MatchLevel, MatchType } from "@/api/types/match";

interface CreateMatchModalProps {
    onClose: () => void;
    onSubmit: (payload: CreateMatchRequest) => Promise<boolean>;
}

const MATCH_TYPES: MatchType[]         = ["OFFICIAL", "SCRIM"];
const OFFICIAL_CONTEXTS: MatchContext[] = ["TOURNAMENT", "QUALIFIER", "LAN", "REGULAR_SEASON"];
const MATCH_FORMATS: MatchFormat[]      = ["BO1", "BO3", "BO5"];
const MATCH_LEVELS: MatchLevel[]        = ["S", "A", "B", "C"];

function chip(active: boolean) {
    return active
        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
        : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700";
}

const LABEL = "block text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-2";
const INPUT  = "w-full bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/40 transition-colors";

export default function CreateMatchModal({ onClose, onSubmit }: CreateMatchModalProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const [type, setType]                   = useState<MatchType>("OFFICIAL");
    const [context, setContext]             = useState<MatchContext>("TOURNAMENT");
    const [opponentName, setOpponentName]   = useState("");
    const [opponentLogo, setOpponentLogo]   = useState("");
    const [matchUrl, setMatchUrl]           = useState("");
    const [scheduledAt, setScheduledAt]     = useState("");
    const [format, setFormat]               = useState<MatchFormat>("BO3");
    const [competitionName, setCompetitionName] = useState("");
    const [competitionStage, setCompetitionStage] = useState("");
    const [level, setLevel]                 = useState<MatchLevel | "">("");
    const [notes, setNotes]                 = useState("");

    const handleTypeChange = (t: MatchType) => {
        setType(t);
        if (t === "SCRIM") setContext("TOURNAMENT"); // reset, won't be sent
    };

    const canSubmit = !!scheduledAt;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsSubmitting(true);
        const ok = await onSubmit({
            type,
            context: type === "OFFICIAL" ? context : null,
            opponentName: opponentName.trim() || null,
            opponentLogo: opponentLogo.trim() || null,
            matchUrl: matchUrl.trim() || null,
            scheduledAt: new Date(scheduledAt).toISOString(),
            format,
            competitionName: competitionName.trim() || null,
            competitionStage: competitionStage.trim() || null,
            level: level || null,
            notes: notes.trim() || null,
        });
        setIsSubmitting(false);
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-5">
                    <h2 className="text-base font-semibold text-white">{t("matches.create_title")}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-600 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 space-y-5">

                        {/* ── Type + Format ─────────────────────────────── */}
                        <div className="grid grid-cols-2 gap-5">
                            {/* Type */}
                            <div>
                                <p className={LABEL}>{t("matches.type")}</p>
                                <div className="flex gap-2">
                                    {MATCH_TYPES.map(mt => (
                                        <button
                                            key={mt}
                                            type="button"
                                            onClick={() => handleTypeChange(mt)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(type === mt)}`}
                                        >
                                            {t(`matches.type_${mt.toLowerCase()}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Format */}
                            <div>
                                <p className={LABEL}>{t("matches.format")}</p>
                                <div className="flex gap-2">
                                    {MATCH_FORMATS.map(mf => (
                                        <button
                                            key={mf}
                                            type="button"
                                            onClick={() => setFormat(mf)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors font-mono ${chip(format === mf)}`}
                                        >
                                            {mf}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Context — OFFICIAL only ────────────────────── */}
                        {type === "OFFICIAL" && (
                            <div>
                                <p className={LABEL}>{t("matches.context")}</p>
                                <div className="flex gap-2">
                                    {OFFICIAL_CONTEXTS.map(mc => (
                                        <button
                                            key={mc}
                                            type="button"
                                            onClick={() => setContext(mc)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(context === mc)}`}
                                        >
                                            {t(`matches.context_${mc.toLowerCase()}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t border-neutral-800/60" />

                        {/* ── Required fields ───────────────────────────── */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={LABEL}>
                                        {t("matches.opponent_name")}
                                        <span className="ml-1.5 text-neutral-700 normal-case tracking-normal font-normal text-[10px]">{t("matches.tba_hint")}</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={opponentName}
                                        onChange={e => setOpponentName(e.target.value)}
                                        placeholder={t("matches.opponent_name_placeholder")}
                                        autoFocus
                                        className={INPUT}
                                    />
                                </div>

                                <div>
                                    <label className={LABEL}>
                                        {t("matches.scheduled_at")}
                                        <span className="ml-1 text-indigo-500 normal-case tracking-normal font-normal">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={e => setScheduledAt(e.target.value)}
                                        required
                                        className={`${INPUT} [color-scheme:dark]`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={LABEL}>{t("matches.match_url")}</label>
                                <input
                                    type="url"
                                    value={matchUrl}
                                    onChange={e => setMatchUrl(e.target.value)}
                                    placeholder="https://..."
                                    className={INPUT}
                                />
                            </div>
                        </div>

                        <div className="border-t border-neutral-800/60" />

                        {/* ── Optional section ──────────────────────────── */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowOptions(v => !v)}
                                className="w-full flex items-center justify-between text-xs text-neutral-600 hover:text-neutral-400 transition-colors py-0.5"
                            >
                                <span className="font-semibold uppercase tracking-wider text-[10px]">
                                    {t("matches.more_options")}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showOptions ? "rotate-180" : ""}`} />
                            </button>

                            {showOptions && (
                                <div className="mt-4 space-y-3">
                                    {/* Competition */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={LABEL}>{t("matches.competition_name")}</label>
                                            <input
                                                type="text"
                                                value={competitionName}
                                                onChange={e => setCompetitionName(e.target.value)}
                                                placeholder={t("matches.optional")}
                                                className={INPUT}
                                            />
                                        </div>
                                        <div>
                                            <label className={LABEL}>{t("matches.competition_stage")}</label>
                                            <input
                                                type="text"
                                                value={competitionStage}
                                                onChange={e => setCompetitionStage(e.target.value)}
                                                placeholder={t("matches.optional")}
                                                className={INPUT}
                                            />
                                        </div>
                                    </div>

                                    {/* Level + Logo */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={LABEL}>{t("matches.level")}</label>
                                            <div className="flex gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setLevel("")}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(level === "")}`}
                                                >
                                                    —
                                                </button>
                                                {MATCH_LEVELS.map(ml => (
                                                    <button
                                                        key={ml}
                                                        type="button"
                                                        onClick={() => setLevel(ml)}
                                                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors font-mono ${chip(level === ml)}`}
                                                    >
                                                        {ml}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className={LABEL}>{t("matches.opponent_logo")}</label>
                                            <input
                                                type="url"
                                                value={opponentLogo}
                                                onChange={e => setOpponentLogo(e.target.value)}
                                                placeholder="https://..."
                                                className={INPUT}
                                            />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className={LABEL}>{t("matches.notes")}</label>
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder={t("matches.notes_placeholder")}
                                            rows={2}
                                            className={`${INPUT} resize-none`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pt-4 pb-6 flex gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !canSubmit}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
                        >
                            {isSubmitting ? t("common.saving") : t("matches.create_button")}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
