import { type FormEvent, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown } from "lucide-react";
import type { CompetitionDto, CompetitionType, CompetitionStatus, UpdateCompetitionRequest } from "@/api/types/competition";
import DatePicker from "@/design-system/components/DatePicker";

interface EditCompetitionModalProps {
    competition: CompetitionDto;
    isStaff: boolean;
    onClose: () => void;
    onUpdate: (id: number, payload: UpdateCompetitionRequest) => Promise<boolean>;
    onDelete: (id: number) => Promise<boolean>;
}

const COMPETITION_TYPES: CompetitionType[] = ["LEAGUE", "TOURNAMENT", "CUP", "LAN", "QUALIFIER", "OTHER"];
const COMPETITION_STATUSES: CompetitionStatus[] = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"];

function chip(active: boolean) {
    return active
        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
        : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700";
}

const LABEL = "block text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-2";
const INPUT = "w-full bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/40 transition-colors disabled:opacity-50";

export default function EditCompetitionModal({ competition, isStaff, onClose, onUpdate }: EditCompetitionModalProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMore, setShowMore] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const [name, setName] = useState(competition.name);
    const [type, setType] = useState<CompetitionType>(competition.type);
    const [status, setStatus] = useState<CompetitionStatus>(competition.status);
    const [stage, setStage] = useState(competition.stage ?? "");
    const [startDate, setStartDate] = useState(competition.startDate ?? "");
    const [endDate, setEndDate] = useState(competition.endDate ?? "");
    const [format, setFormat] = useState(competition.format ?? "");
    const [cashprize, setCashprize] = useState(competition.cashprize ?? "");
    const [url, setUrl] = useState(competition.url ?? "");
    const [notes, setNotes] = useState(competition.notes ?? "");

    const canSubmit = name.trim().length > 0;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!canSubmit || isSubmitting || !isStaff) return;
        setIsSubmitting(true);

        const payload: UpdateCompetitionRequest = {
            name: name.trim(),
            type,
            status,
            stage: stage.trim() || null,
            startDate: startDate || null,
            endDate: endDate || null,
            format: format.trim() || null,
            cashprize: cashprize.trim() || null,
            url: url.trim() || null,
            notes: notes.trim() || null,
        };

        const ok = await onUpdate(competition.id, payload);
        setIsSubmitting(false);
        if (ok) onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-5 flex-shrink-0">
                    <h2 className="text-base font-semibold text-white">{competition.name}</h2>
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-600 hover:text-white transition-colors disabled:opacity-50">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">
                        {/* Name */}
                        <div>
                            <label className={LABEL}>
                                {t("competitions.name")}
                                <span className="ml-1.5 text-indigo-500 normal-case tracking-normal font-normal">*</span>
                            </label>
                            <input type="text" className={INPUT} value={name} onChange={e => setName(e.target.value)} disabled={!isStaff} />
                        </div>

                        {/* Type chips */}
                        <div>
                            <label className={LABEL}>{t("competitions.type")}</label>
                            <div className="flex flex-wrap gap-2">
                                {COMPETITION_TYPES.map(ct => (
                                    <button key={ct} type="button" onClick={() => isStaff && setType(ct)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(type === ct)} ${!isStaff ? "opacity-50 cursor-default" : ""}`}>
                                        {t(`competitions.type_${ct.toLowerCase()}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status chips */}
                        <div>
                            <label className={LABEL}>{t("competitions.status_label")}</label>
                            <div className="flex flex-wrap gap-2">
                                {COMPETITION_STATUSES.map(s => (
                                    <button key={s} type="button" onClick={() => isStaff && setStatus(s)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(status === s)} ${!isStaff ? "opacity-50 cursor-default" : ""}`}>
                                        {t(`competitions.status_${s.toLowerCase()}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stage */}
                        <div>
                            <label className={LABEL}>{t("competitions.stage")}</label>
                            <input type="text" className={INPUT} value={stage} onChange={e => setStage(e.target.value)} disabled={!isStaff} placeholder="Regular Season, Playoff…" />
                        </div>

                        <div className="border-t border-neutral-800/60" />

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL}>{t("competitions.start_date")}</label>
                                <DatePicker value={startDate} onChange={v => isStaff && setStartDate(v)} />
                            </div>
                            <div>
                                <label className={LABEL}>{t("competitions.end_date")}</label>
                                <DatePicker value={endDate} onChange={v => isStaff && setEndDate(v)} />
                            </div>
                        </div>

                        <div className="border-t border-neutral-800/60" />

                        {/* More options */}
                        <div>
                            <button type="button" onClick={() => setShowMore(v => !v)}
                                className="w-full flex items-center justify-between text-xs text-neutral-600 hover:text-neutral-400 transition-colors py-0.5">
                                <span className="font-semibold uppercase tracking-wider text-[10px]">
                                    {t("competitions.more_options")}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMore ? "rotate-180" : ""}`} />
                            </button>

                            {showMore && (
                                <div className="mt-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={LABEL}>{t("competitions.format")}</label>
                                            <input type="text" className={INPUT} value={format} onChange={e => setFormat(e.target.value)} disabled={!isStaff} placeholder="Swiss BO3, Double Elim…" />
                                        </div>
                                        <div>
                                            <label className={LABEL}>{t("competitions.cashprize")}</label>
                                            <input type="text" className={INPUT} value={cashprize} onChange={e => setCashprize(e.target.value)} disabled={!isStaff} placeholder="5 000€" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={LABEL}>{t("competitions.url")}</label>
                                        <input type="url" className={INPUT} value={url} onChange={e => setUrl(e.target.value)} disabled={!isStaff} placeholder="https://…" />
                                    </div>

                                    <div>
                                        <label className={LABEL}>{t("competitions.notes")}</label>
                                        <textarea rows={2} className={`${INPUT} resize-none`} value={notes} onChange={e => setNotes(e.target.value)} disabled={!isStaff} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* FACEIT info */}
                        {competition.source === "FACEIT" && (
                            <div className="flex items-center gap-2 py-2">
                                <span className="text-xs px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium">FACEIT</span>
                                {competition.season && <span className="text-xs text-neutral-500">{competition.season}</span>}
                                {competition.region && <span className="text-xs text-neutral-500">{competition.region}</span>}
                                {competition.division && <span className="text-xs text-neutral-500">{competition.division}</span>}
                            </div>
                        )}
                    </div>

                    {/* Footer — always visible, buttons disabled for non-staff */}
                    <div className="px-6 pt-4 pb-6 flex gap-3 mt-2 flex-shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors">
                            {t("common.cancel")}
                        </button>
                        <button type="submit" disabled={isSubmitting || !canSubmit || !isStaff} className="flex-1 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors">
                            {isSubmitting ? t("common.saving") : t("common.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
