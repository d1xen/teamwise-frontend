import { type FormEvent, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown } from "lucide-react";
import type { CreateStratRequest, StratSide, StratType, StratDifficulty } from "@/api/types/stratbook";
import { useTeam } from "@/contexts/team/useTeam";
import { getMapsForGame } from "@/shared/config/gameConfig";

interface CreateStratModalProps {
    onClose: () => void;
    onSubmit: (payload: CreateStratRequest) => Promise<boolean>;
}

const SIDES: StratSide[] = ["T", "CT"];
const STRAT_TYPES: StratType[] = ["DEFAULT", "EXECUTE", "FAKE", "RUSH", "CONTACT", "RETAKE", "SETUP"];
const DIFFICULTIES: StratDifficulty[] = ["EASY", "MEDIUM", "HARD"];

function chip(active: boolean) {
    return active
        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
        : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700";
}

const LABEL = "block text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-2";
const INPUT = "w-full bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/40 transition-colors";

export default function CreateStratModal({ onClose, onSubmit }: CreateStratModalProps) {
    const { t } = useTranslation();
    const { team } = useTeam();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const maps = getMapsForGame(team?.game);

    const [name, setName] = useState("");
    const [map, setMap] = useState("");
    const [side, setSide] = useState<StratSide>("T");
    const [type, setType] = useState<StratType>("DEFAULT");
    const [difficulty, setDifficulty] = useState<StratDifficulty>("MEDIUM");
    const [callName, setCallName] = useState("");
    const [description, setDescription] = useState("");
    const [objective, setObjective] = useState("");
    const [conditions, setConditions] = useState("");
    const [tagsInput, setTagsInput] = useState("");

    const canSubmit = name.trim().length > 0 && !!map;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!canSubmit || isSubmitting) return;
        setIsSubmitting(true);

        const payload: CreateStratRequest = {
            name: name.trim(),
            map,
            side,
            type,
            difficulty,
            callName: callName.trim() || null,
            description: description.trim() || null,
            objective: objective.trim() || null,
            conditions: conditions.trim() || null,
            tags: tagsInput.trim() ? tagsInput.split(",").map(t => t.trim()).filter(Boolean) : [],
        };

        const success = await onSubmit(payload);
        setIsSubmitting(false);
        if (success) onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-5">
                    <h2 className="text-base font-semibold text-white">{t("stratbook.create_title")}</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-600 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 space-y-5">

                        {/* ── Name ─────────────────────────────────────── */}
                        <div>
                            <label className={LABEL}>
                                {t("stratbook.name")}
                                <span className="ml-1.5 text-indigo-500 normal-case tracking-normal font-normal">*</span>
                            </label>
                            <input
                                type="text"
                                className={INPUT}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t("stratbook.name_placeholder")}
                                autoFocus
                            />
                        </div>

                        {/* ── Map ──────────────────────────────────────── */}
                        <div>
                            <label className={LABEL}>
                                {t("stratbook.map")}
                                <span className="ml-1.5 text-indigo-500 normal-case tracking-normal font-normal">*</span>
                            </label>
                            <select
                                value={map}
                                onChange={(e) => setMap(e.target.value)}
                                className={INPUT}
                            >
                                <option value="">{t("stratbook.select_map")}</option>
                                {maps.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* ── Side ─────────────────────────────────────── */}
                        <div>
                            <label className={LABEL}>{t("stratbook.side")}</label>
                            <div className="flex gap-2">
                                {SIDES.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSide(s)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(side === s)}`}
                                    >
                                        {t(`stratbook.side_${s.toLowerCase()}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Type ─────────────────────────────────────── */}
                        <div>
                            <label className={LABEL}>{t("stratbook.type")}</label>
                            <div className="flex flex-wrap gap-2">
                                {STRAT_TYPES.map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setType(st)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(type === st)}`}
                                    >
                                        {t(`stratbook.type_${st.toLowerCase()}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Difficulty ───────────────────────────────── */}
                        <div>
                            <label className={LABEL}>{t("stratbook.difficulty")}</label>
                            <div className="flex gap-2">
                                {DIFFICULTIES.map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDifficulty(d)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(difficulty === d)}`}
                                    >
                                        {t(`stratbook.difficulty_${d.toLowerCase()}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-neutral-800/60" />

                        {/* ── Call name ────────────────────────────────── */}
                        <div>
                            <label className={LABEL}>{t("stratbook.call_name")}</label>
                            <input
                                type="text"
                                className={INPUT}
                                value={callName}
                                onChange={(e) => setCallName(e.target.value)}
                                placeholder="A split 1"
                            />
                        </div>

                        <div className="border-t border-neutral-800/60" />

                        {/* ── More options toggle ─────────────────────── */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowOptions(v => !v)}
                                className="w-full flex items-center justify-between text-xs text-neutral-600 hover:text-neutral-400 transition-colors py-0.5"
                            >
                                <span className="font-semibold uppercase tracking-wider text-[10px]">
                                    {t("stratbook.more_options")}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showOptions ? "rotate-180" : ""}`} />
                            </button>

                            {showOptions && (
                                <div className="mt-4 space-y-3">
                                    {/* Description */}
                                    <div>
                                        <label className={LABEL}>{t("stratbook.description")}</label>
                                        <textarea
                                            rows={3}
                                            className={`${INPUT} resize-none`}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder={t("stratbook.description_placeholder")}
                                        />
                                    </div>

                                    {/* Objective */}
                                    <div>
                                        <label className={LABEL}>{t("stratbook.objective")}</label>
                                        <textarea
                                            rows={2}
                                            className={`${INPUT} resize-none`}
                                            value={objective}
                                            onChange={(e) => setObjective(e.target.value)}
                                            placeholder={t("stratbook.objective_placeholder")}
                                        />
                                    </div>

                                    {/* Conditions */}
                                    <div>
                                        <label className={LABEL}>{t("stratbook.conditions")}</label>
                                        <textarea
                                            rows={2}
                                            className={`${INPUT} resize-none`}
                                            value={conditions}
                                            onChange={(e) => setConditions(e.target.value)}
                                            placeholder={t("stratbook.conditions_placeholder")}
                                        />
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className={LABEL}>{t("stratbook.tags")}</label>
                                        <input
                                            type="text"
                                            className={INPUT}
                                            value={tagsInput}
                                            onChange={(e) => setTagsInput(e.target.value)}
                                            placeholder="fast, pistol, anti-eco"
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
                            className="flex-1 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
                        >
                            {isSubmitting ? t("common.saving") : t("stratbook.create_button")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
