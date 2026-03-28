import { type FormEvent, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown, PenLine, Loader } from "lucide-react";
import FaceitIcon from "@/shared/components/FaceitIcon";
import type { CompetitionType, CreateCompetitionRequest } from "@/api/types/competition";
import { discoverFaceitCompetition } from "@/api/endpoints/faceit.api";
import { useTeam } from "@/contexts/team/useTeam";
import DatePicker from "@/design-system/components/DatePicker";
import toast from "react-hot-toast";

interface CreateCompetitionModalProps {
    onClose: () => void;
    onSubmit: (payload: CreateCompetitionRequest) => Promise<boolean>;
    onFaceitImported?: () => void;
}

type Mode = "choose" | "manual" | "faceit";

const COMPETITION_TYPES: CompetitionType[] = ["LEAGUE", "TOURNAMENT", "CUP", "LAN", "QUALIFIER", "OTHER"];

function chip(active: boolean) {
    return active
        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
        : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700";
}

const LABEL = "block text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-2";
const INPUT = "w-full bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/40 transition-colors";

export default function CreateCompetitionModal({ onClose, onSubmit, onFaceitImported }: CreateCompetitionModalProps) {
    const { t } = useTranslation();
    const { team } = useTeam();
    const [mode, setMode] = useState<Mode>("choose");

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-5">
                    <h2 className="text-base font-semibold text-white">
                        {mode === "choose" ? t("competitions.create_title") : mode === "faceit" ? t("competitions.import_faceit") : t("competitions.create_manual")}
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-600 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {mode === "choose" && (
                    <ChooseMode
                        onManual={() => setMode("manual")}
                        onFaceit={() => setMode("faceit")}
                        isFaceitTeam={team?.game === "CS2"}
                    />
                )}
                {mode === "manual" && (
                    <ManualForm
                        onClose={onClose}
                        onSubmit={onSubmit}
                        onBack={() => setMode("choose")}
                    />
                )}
                {mode === "faceit" && (
                    <FaceitImport
                        teamId={team?.id ?? ""}
                        onImported={() => { onFaceitImported?.(); onClose(); }}
                        onBack={() => setMode("choose")}
                    />
                )}
            </div>
        </div>
    );
}

// ── Choose mode ─────────────────────────────────────────────────────────────

function ChooseMode({ onManual, onFaceit, isFaceitTeam }: { onManual: () => void; onFaceit: () => void; isFaceitTeam: boolean }) {
    const { t } = useTranslation();
    return (
        <div className="px-6 pb-6 space-y-3">
            <button onClick={onManual}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <PenLine className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">{t("competitions.create_manual")}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{t("competitions.create_manual_hint")}</p>
                </div>
            </button>

            {isFaceitTeam && (
                <button onClick={onFaceit}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-orange-500/20 hover:border-orange-500/30 hover:bg-orange-500/[0.03] transition-all text-left group">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                        <FaceitIcon className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">{t("competitions.import_faceit")}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{t("competitions.import_faceit_hint")}</p>
                    </div>
                </button>
            )}
        </div>
    );
}

// ── FACEIT Import ───────────────────────────────────────────────────────────

function FaceitImport({ teamId, onImported, onBack }: { teamId: string | number; onImported: () => void; onBack: () => void }) {
    const { t } = useTranslation();
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleImport = async () => {
        if (!url.trim()) return;
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
            toast.error(apiErr?.message ?? t("faceit.discover_error"));
        } finally { setIsLoading(false); }
    };

    return (
        <div className="px-6 pb-6 space-y-4">
            <div className="bg-orange-500/[0.03] border border-orange-500/15 rounded-xl p-4 space-y-3">
                <p className="text-xs text-neutral-400 leading-relaxed">
                    {t("competitions.import_faceit_info")}
                </p>
                <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder={t("faceit.discover_placeholder")}
                    className={INPUT}
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleImport()}
                />
            </div>

            <div className="flex gap-3">
                <button type="button" onClick={onBack}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors">
                    {t("common.back")}
                </button>
                <button onClick={handleImport} disabled={isLoading || !url.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-orange-400 transition-colors flex items-center justify-center gap-2">
                    {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <FaceitIcon className="w-4 h-4" />}
                    {t("competitions.import_button")}
                </button>
            </div>
        </div>
    );
}

// ── Manual form (extracted from original) ───────────────────────────────────

function ManualForm({ onClose, onSubmit, onBack }: { onClose: () => void; onSubmit: (p: CreateCompetitionRequest) => Promise<boolean>; onBack: () => void }) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const [name, setName] = useState("");
    const [type, setType] = useState<CompetitionType>("TOURNAMENT");
    const [stage, setStage] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [format, setFormat] = useState("");
    const [cashprize, setCashprize] = useState("");
    const [url, setUrl] = useState("");
    const [notes, setNotes] = useState("");

    const canSubmit = name.trim().length > 0;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!canSubmit || isSubmitting) return;
        setIsSubmitting(true);

        const payload: CreateCompetitionRequest = {
            name: name.trim(), type,
            stage: stage.trim() || null,
            startDate: startDate || null,
            endDate: endDate || null,
            format: format.trim() || null,
            cashprize: cashprize.trim() || null,
            url: url.trim() || null,
            notes: notes.trim() || null,
        };

        const success = await onSubmit(payload);
        setIsSubmitting(false);
        if (success) onClose();
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 space-y-5">
                <div>
                    <label className={LABEL}>{t("competitions.name")}<span className="ml-1.5 text-indigo-500 normal-case tracking-normal font-normal">*</span></label>
                    <input type="text" className={INPUT} value={name} onChange={e => setName(e.target.value)} placeholder={t("competitions.name_placeholder")} autoFocus />
                </div>

                <div>
                    <label className={LABEL}>{t("competitions.type")}</label>
                    <div className="flex flex-wrap gap-2">
                        {COMPETITION_TYPES.map(ct => (
                            <button key={ct} type="button" onClick={() => setType(ct)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(type === ct)}`}>
                                {t(`competitions.type_${ct.toLowerCase()}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className={LABEL}>{t("competitions.stage")}</label>
                    <input type="text" className={INPUT} value={stage} onChange={e => setStage(e.target.value)} placeholder="Regular Season, Playoff…" />
                </div>

                <div className="border-t border-neutral-800/60" />

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={LABEL}>{t("competitions.start_date")}</label>
                        <DatePicker value={startDate} onChange={setStartDate} />
                    </div>
                    <div>
                        <label className={LABEL}>{t("competitions.end_date")}</label>
                        <DatePicker value={endDate} onChange={setEndDate} />
                    </div>
                </div>

                <div className="border-t border-neutral-800/60" />

                <div>
                    <button type="button" onClick={() => setShowOptions(v => !v)}
                        className="w-full flex items-center justify-between text-xs text-neutral-600 hover:text-neutral-400 transition-colors py-0.5">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">{t("competitions.more_options")}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showOptions ? "rotate-180" : ""}`} />
                    </button>
                    {showOptions && (
                        <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={LABEL}>{t("competitions.format")}</label>
                                    <input type="text" className={INPUT} value={format} onChange={e => setFormat(e.target.value)} placeholder="Swiss BO3, Double Elim…" />
                                </div>
                                <div>
                                    <label className={LABEL}>{t("competitions.cashprize")}</label>
                                    <input type="text" className={INPUT} value={cashprize} onChange={e => setCashprize(e.target.value)} placeholder="5 000€" />
                                </div>
                            </div>
                            <div>
                                <label className={LABEL}>{t("competitions.url")}</label>
                                <input type="url" className={INPUT} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
                            </div>
                            <div>
                                <label className={LABEL}>{t("competitions.notes")}</label>
                                <textarea rows={2} className={`${INPUT} resize-none`} value={notes} onChange={e => setNotes(e.target.value)} />
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
                    {isSubmitting ? t("common.saving") : t("competitions.create_button")}
                </button>
            </div>
        </form>
    );
}
