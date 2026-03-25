import { type FormEvent, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown } from "lucide-react";
import type { CompetitionType, CreateCompetitionRequest } from "@/api/types/competition";
import DatePicker from "@/design-system/components/DatePicker";

interface CreateCompetitionModalProps {
    onClose: () => void;
    onSubmit: (payload: CreateCompetitionRequest) => Promise<boolean>;
}

const COMPETITION_TYPES: CompetitionType[] = ["LEAGUE", "TOURNAMENT", "CUP", "LAN", "QUALIFIER", "OTHER"];

function chip(active: boolean) {
    return active
        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
        : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700";
}

const LABEL = "block text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-2";
const INPUT = "w-full bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/40 transition-colors";

export default function CreateCompetitionModal({ onClose, onSubmit }: CreateCompetitionModalProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

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
            name: name.trim(),
            type,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-5">
                    <h2 className="text-base font-semibold text-white">{t("competitions.create_title")}</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-600 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 space-y-5">
                        {/* Name */}
                        <div>
                            <label className={LABEL}>
                                {t("competitions.name")}
                                <span className="ml-1.5 text-indigo-500 normal-case tracking-normal font-normal">*</span>
                            </label>
                            <input type="text" className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("competitions.name_placeholder")} autoFocus />
                        </div>

                        {/* Type chips */}
                        <div>
                            <label className={LABEL}>{t("competitions.type")}</label>
                            <div className="flex flex-wrap gap-2">
                                {COMPETITION_TYPES.map((ct) => (
                                    <button
                                        key={ct}
                                        type="button"
                                        onClick={() => setType(ct)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(type === ct)}`}
                                    >
                                        {t(`competitions.type_${ct.toLowerCase()}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stage */}
                        <div>
                            <label className={LABEL}>{t("competitions.stage")}</label>
                            <input type="text" className={INPUT} value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Regular Season, Playoff…" />
                        </div>

                        <div className="border-t border-neutral-800/60" />

                        {/* Dates */}
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

                        {/* More options toggle */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowOptions(v => !v)}
                                className="w-full flex items-center justify-between text-xs text-neutral-600 hover:text-neutral-400 transition-colors py-0.5"
                            >
                                <span className="font-semibold uppercase tracking-wider text-[10px]">
                                    {t("competitions.more_options")}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showOptions ? "rotate-180" : ""}`} />
                            </button>

                            {showOptions && (
                                <div className="mt-4 space-y-3">
                                    {/* Format & Cashprize */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={LABEL}>{t("competitions.format")}</label>
                                            <input type="text" className={INPUT} value={format} onChange={(e) => setFormat(e.target.value)} placeholder="Swiss BO3, Double Elim…" />
                                        </div>
                                        <div>
                                            <label className={LABEL}>{t("competitions.cashprize")}</label>
                                            <input type="text" className={INPUT} value={cashprize} onChange={(e) => setCashprize(e.target.value)} placeholder="5 000€" />
                                        </div>
                                    </div>

                                    {/* URL */}
                                    <div>
                                        <label className={LABEL}>{t("competitions.url")}</label>
                                        <input type="url" className={INPUT} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className={LABEL}>{t("competitions.notes")}</label>
                                        <textarea rows={2} className={`${INPUT} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pt-4 pb-6 flex gap-3 mt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors">
                            {t("common.cancel")}
                        </button>
                        <button type="submit" disabled={isSubmitting || !canSubmit} className="flex-1 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors">
                            {isSubmitting ? t("common.saving") : t("competitions.create_button")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
