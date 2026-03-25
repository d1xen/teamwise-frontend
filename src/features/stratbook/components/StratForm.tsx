import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type {
    CreateStratRequest, CreateStratPhaseRequest, CreateStratUtilityRequest,
    StratDto, StratSide, StratType, StratPhaseType, UtilityType,
} from "@/api/types/stratbook";
import { useTeam } from "@/contexts/team/useTeam";
import { getMapsForGame } from "@/shared/config/gameConfig";

interface StratFormProps {
    onBack: () => void;
    onSubmit: (payload: CreateStratRequest) => Promise<boolean>;
    /** If provided, the form is in edit mode and pre-filled with this strat's data. */
    initialData?: StratDto;
}

const SIDES: StratSide[] = ["T", "CT"];
const STRAT_TYPES: StratType[] = ["DEFAULT", "EXECUTE", "FAKE", "RUSH", "CONTACT", "RETAKE", "SETUP"];
const PHASE_TYPES: StratPhaseType[] = ["SETUP", "MID_ROUND", "EXECUTE", "POST_PLANT"];
const UTILITY_TYPES: UtilityType[] = ["SMOKE", "FLASH", "MOLLY", "HE"];

const SIDE_CHIP = { T: "bg-amber-500/20 border-amber-500/40 text-amber-300", CT: "bg-blue-500/20 border-blue-500/40 text-blue-300" };

function chip(active: boolean) {
    return active
        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
        : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700";
}

const LABEL = "block text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-2";
const INPUT = "w-full bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/40 transition-colors";

type PhaseRow = { phaseType: StratPhaseType; description: string; playerPositions: string };
type UtilityRow = { utilityType: UtilityType; name: string; position: string; target: string; description: string; timing: string; videoUrl: string };

export default function StratForm({ onBack, onSubmit, initialData }: StratFormProps) {
    const { t } = useTranslation();
    const { team } = useTeam();
    const maps = getMapsForGame(team?.game);
    const isEdit = !!initialData;
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Core fields — pre-filled from initialData if editing
    const [name, setName] = useState(initialData?.name ?? "");
    const [map, setMap] = useState(initialData?.map ?? maps[0]?.value ?? "");
    const [side, setSide] = useState<StratSide>(initialData?.side ?? "T");
    const [type, setType] = useState<StratType>(initialData?.type ?? "EXECUTE");
    const [callName, setCallName] = useState(initialData?.callName ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [objective, setObjective] = useState(initialData?.objective ?? "");
    const [conditions, setConditions] = useState(initialData?.conditions ?? "");
    const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(", ") ?? "");

    // Phases — pre-filled from initialData
    const [phases, setPhases] = useState<PhaseRow[]>(
        initialData?.phases?.map(p => ({ phaseType: p.phaseType, description: p.description ?? "", playerPositions: p.playerPositions ?? "" })) ?? []
    );
    const addPhase = () => setPhases(p => [...p, { phaseType: "SETUP", description: "", playerPositions: "" }]);
    const removePhase = (i: number) => setPhases(p => p.filter((_, idx) => idx !== i));
    const updatePhase = (i: number, patch: Partial<PhaseRow>) => setPhases(p => p.map((r, idx) => idx === i ? { ...r, ...patch } : r));

    // Utilities — pre-filled from initialData
    const [utilities, setUtilities] = useState<UtilityRow[]>(
        initialData?.utilities?.map(u => ({ utilityType: u.utilityType, name: u.name, position: u.position ?? "", target: u.target ?? "", description: u.description ?? "", timing: u.timing ?? "", videoUrl: u.videoUrl ?? "" })) ?? []
    );
    const addUtility = () => setUtilities(u => [...u, { utilityType: "SMOKE", name: "", position: "", target: "", description: "", timing: "", videoUrl: "" }]);
    const removeUtility = (i: number) => setUtilities(u => u.filter((_, idx) => idx !== i));
    const updateUtility = (i: number, patch: Partial<UtilityRow>) => setUtilities(u => u.map((r, idx) => idx === i ? { ...r, ...patch } : r));

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
            difficulty: "MEDIUM",
            callName: callName.trim() || null,
            description: description.trim() || null,
            objective: objective.trim() || null,
            conditions: conditions.trim() || null,
            tags: tagsInput.trim() ? tagsInput.split(",").map(t => t.trim()).filter(Boolean) : [],
            phases: phases.map((p, i): CreateStratPhaseRequest => ({
                phaseType: p.phaseType,
                orderIndex: i + 1,
                description: p.description.trim() || null,
                playerPositions: p.playerPositions.trim() || null,
            })),
            utilities: utilities.filter(u => u.name.trim()).map((u, i): CreateStratUtilityRequest => ({
                utilityType: u.utilityType,
                name: u.name.trim(),
                position: u.position.trim() || null,
                target: u.target.trim() || null,
                description: u.description.trim() || null,
                timing: u.timing.trim() || null,
                videoUrl: u.videoUrl.trim() || null,
                orderIndex: i + 1,
            })),
        };

        const ok = await onSubmit(payload);
        setIsSubmitting(false);
        if (ok) onBack();
    }

    return (
        <div className="space-y-6">
            {/* Back */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    {t("common.back")}
                </button>
                <h2 className="text-lg font-semibold text-white">{isEdit ? initialData.name : t("stratbook.create_title")}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Core info card */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className={LABEL}>
                            {t("stratbook.name")}
                            <span className="ml-1.5 text-indigo-500 normal-case tracking-normal font-normal">*</span>
                        </label>
                        <input type="text" className={INPUT} value={name} onChange={e => setName(e.target.value)} placeholder={t("stratbook.name_placeholder")} autoFocus />
                    </div>

                    {/* Map + Side */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className={LABEL}>{t("stratbook.map")}</label>
                            <select value={map} onChange={e => setMap(e.target.value)} className={INPUT}>
                                {maps.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL}>{t("stratbook.side")}</label>
                            <div className="flex gap-2">
                                {SIDES.map(s => (
                                    <button key={s} type="button" onClick={() => setSide(s)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${side === s ? SIDE_CHIP[s] : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"}`}>
                                        {t(`stratbook.side_${s.toLowerCase()}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className={LABEL}>{t("stratbook.type")}</label>
                        <div className="flex flex-wrap gap-2">
                            {STRAT_TYPES.map(tp => (
                                <button key={tp} type="button" onClick={() => setType(tp)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${chip(type === tp)}`}>
                                    {t(`stratbook.type_${tp.toLowerCase()}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Call name */}
                    <div>
                        <label className={LABEL}>{t("stratbook.call_name")}</label>
                        <input type="text" className={INPUT} value={callName} onChange={e => setCallName(e.target.value)} placeholder={t("stratbook.call_name_placeholder")} />
                    </div>

                    {/* Description / Objective / Conditions / Tags */}
                    <div className="border-t border-neutral-800/60 pt-4 space-y-4">
                        <div>
                            <label className={LABEL}>{t("stratbook.description")}</label>
                            <textarea rows={3} className={`${INPUT} resize-none`} value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>{t("stratbook.objective")}</label>
                                <textarea rows={2} className={`${INPUT} resize-none`} value={objective} onChange={e => setObjective(e.target.value)} />
                            </div>
                            <div>
                                <label className={LABEL}>{t("stratbook.conditions")}</label>
                                <textarea rows={2} className={`${INPUT} resize-none`} value={conditions} onChange={e => setConditions(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className={LABEL}>{t("stratbook.tags")}</label>
                            <input type="text" className={INPUT} value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder={t("stratbook.tags_placeholder")} />
                        </div>
                    </div>
                </div>

                {/* Phases card */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">Phases ({phases.length})</h3>
                        <button type="button" onClick={addPhase} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            {t("stratbook.add_phase")}
                        </button>
                    </div>

                    {phases.length === 0 ? (
                        <p className="text-xs text-neutral-600">No phases yet. Add phases to structure the strategy execution.</p>
                    ) : (
                        <div className="space-y-4">
                            {phases.map((phase, i) => (
                                <div key={i} className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-800/50 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <select value={phase.phaseType} onChange={e => updatePhase(i, { phaseType: e.target.value as StratPhaseType })}
                                            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-semibold focus:outline-none focus:border-indigo-500/50">
                                            {PHASE_TYPES.map(pt => <option key={pt} value={pt}>{t(`stratbook.phase_${pt.toLowerCase()}`)}</option>)}
                                        </select>
                                        <span className="text-[10px] text-neutral-600 font-mono">#{i + 1}</span>
                                        <button type="button" onClick={() => removePhase(i)} className="ml-auto p-1 text-neutral-600 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <textarea rows={2} value={phase.description} onChange={e => updatePhase(i, { description: e.target.value })}
                                        placeholder="What happens during this phase..."
                                        className={`${INPUT} resize-none text-xs`} />
                                    <input type="text" value={phase.playerPositions} onChange={e => updatePhase(i, { playerPositions: e.target.value })}
                                        placeholder="Entry: Ramp | AWPer: Mid | Support: Palace..."
                                        className={`${INPUT} text-xs font-mono`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Utilities card */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">Utilities ({utilities.length})</h3>
                        <button type="button" onClick={addUtility} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            {t("stratbook.add_utility")}
                        </button>
                    </div>

                    {utilities.length === 0 ? (
                        <p className="text-xs text-neutral-600">No utilities yet. Add smokes, flashes, molotovs, HE grenades.</p>
                    ) : (
                        <div className="space-y-4">
                            {utilities.map((util, i) => (
                                <div key={i} className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-800/50 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <select value={util.utilityType} onChange={e => updateUtility(i, { utilityType: e.target.value as UtilityType })}
                                            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-semibold focus:outline-none focus:border-indigo-500/50">
                                            {UTILITY_TYPES.map(ut => <option key={ut} value={ut}>{t(`stratbook.utility_${ut.toLowerCase()}`)}</option>)}
                                        </select>
                                        <input type="text" value={util.name} onChange={e => updateUtility(i, { name: e.target.value })}
                                            placeholder="Window smoke, Pop flash..."
                                            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50" />
                                        <button type="button" onClick={() => removeUtility(i)} className="p-1 text-neutral-600 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input type="text" value={util.position} onChange={e => updateUtility(i, { position: e.target.value })}
                                            placeholder={t("stratbook.utility_position")} className={`${INPUT} text-xs`} />
                                        <input type="text" value={util.target} onChange={e => updateUtility(i, { target: e.target.value })}
                                            placeholder={t("stratbook.utility_target")} className={`${INPUT} text-xs`} />
                                        <input type="text" value={util.timing} onChange={e => updateUtility(i, { timing: e.target.value })}
                                            placeholder={t("stratbook.utility_timing")} className={`${INPUT} text-xs`} />
                                    </div>
                                    <input type="url" value={util.videoUrl} onChange={e => updateUtility(i, { videoUrl: e.target.value })}
                                        placeholder={`${t("stratbook.utility_video")} (YouTube)`} className={`${INPUT} text-xs`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <button type="button" onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors">
                        {t("common.cancel")}
                    </button>
                    <button type="submit" disabled={isSubmitting || !canSubmit} className="flex-1 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors">
                        {isSubmitting ? t("common.saving") : isEdit ? t("common.save") : t("stratbook.create_button")}
                    </button>
                </div>
            </form>
        </div>
    );
}
