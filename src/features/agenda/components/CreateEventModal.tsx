import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { X, Loader, ChevronDown, Swords, Coffee, MessageSquare, Crosshair, Layers, Palmtree, Monitor, Trophy, Award, Plane } from "lucide-react";
import DatePicker from "@/design-system/components/DatePicker";
import TimePicker from "@/design-system/components/TimePicker";
import { createEvent } from "@/api/endpoints/agenda.api";
import { createMatch, getMaps, updateMapScore } from "@/api/endpoints/match.api";
import type { EventType, ParticipantScope } from "@/api/types/agenda";
import type { MatchType, MatchContext, MatchFormat, MatchLevel } from "@/api/types/match";
import type { TeamMember } from "@/contexts/team/team.types";
import type { Game } from "@/api/types/team";
import { getMapsForGame } from "@/shared/config/gameConfig";
import { cn } from "@/design-system";

// ── Constants ────────────────────────────────────────────────────────────────

const OFFICIAL_CONTEXTS: MatchContext[] = ["TOURNAMENT", "QUALIFIER", "LAN", "REGULAR_SEASON"];
const MATCH_FORMATS: MatchFormat[] = ["BO1", "BO3", "BO5"];
const MATCH_LEVELS: MatchLevel[] = ["S", "A", "B", "C"];

interface CreateEventModalProps {
    teamId: string;
    members: TeamMember[];
    game?: Game;
    onClose: () => void;
    onCreated: () => void;
}

const LABEL = "text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1 block";
const INPUT_CLS = "w-full h-8 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-2.5 outline-none placeholder:text-neutral-600 focus:border-indigo-500/50 caret-indigo-400 transition-colors";

function chip(active: boolean) {
    return active
        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
        : "text-neutral-500 border-neutral-700/50 hover:text-neutral-300";
}

function formatCount(f: MatchFormat): number {
    return f === "BO1" ? 1 : f === "BO3" ? 3 : 5;
}

// ── Type selector ────────────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS: { type: EventType; icon: React.ElementType; color: string }[] = [
    { type: "MATCH", icon: Swords, color: "blue" },
    { type: "STRAT_TIME", icon: Crosshair, color: "yellow" },
    { type: "MEETING", icon: MessageSquare, color: "emerald" },
    { type: "REST", icon: Coffee, color: "neutral" },
    { type: "CUSTOM", icon: Layers, color: "slate" },
];

const TYPE_ACTIVE: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    neutral: "bg-neutral-500/10 border-neutral-600/30 text-neutral-400",
    slate: "bg-slate-500/10 border-slate-500/30 text-slate-400",
};
const TYPE_INACTIVE = "bg-neutral-800/40 border-neutral-700/40 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600";

const CUSTOM_SUBTYPES: { key: string; icon: React.ElementType; color: string }[] = [
    { key: "LAN", icon: Monitor, color: "orange" },
    { key: "TOURNAMENT", icon: Trophy, color: "red" },
    { key: "QUALIFIER", icon: Award, color: "amber" },
    { key: "VACATION", icon: Palmtree, color: "cyan" },
    { key: "TRAVEL", icon: Plane, color: "violet" },
    { key: "OTHER", icon: Layers, color: "neutral" },
];

const SUBTYPE_ACTIVE: Record<string, string> = {
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    red: "bg-red-500/10 border-red-500/30 text-red-400",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    violet: "bg-violet-500/10 border-violet-500/30 text-violet-400",
    neutral: "bg-neutral-700/30 border-neutral-600/30 text-neutral-400",
};

// ── Participant selector ─────────────────────────────────────────────────────

function ParticipantSelector({ members, selected, onChange }: {
    members: TeamMember[];
    selected: string[];
    onChange: (ids: string[]) => void;
}) {
    const { t } = useTranslation();

    const allIds = members.map(m => m.steamId);
    const playerIds = members.filter(m => m.role === "PLAYER" && m.activePlayer !== false).map(m => m.steamId);
    const staffIds = members.filter(m => m.isOwner || m.role !== "PLAYER").map(m => m.steamId);

    const isPreset = (ids: string[]) => ids.length === selected.length && ids.every(id => selected.includes(id));
    const available = members.filter(m => !selected.includes(m.steamId));
    const selectedMembers = members.filter(m => selected.includes(m.steamId));

    type Preset = { key: string; ids: string[] };
    const presets: Preset[] = [
        { key: "everyone", ids: allIds },
        { key: "players", ids: playerIds },
        { key: "staff", ids: staffIds },
    ];

    return (
        <div>
            <label className={LABEL}>{t("agenda.field_participants")}</label>
            {/* Presets */}
            <div className="flex gap-1.5 mb-2">
                {presets.map(p => (
                    <button key={p.key} type="button" onClick={() => onChange(p.ids)}
                        className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors",
                            isPreset(p.ids) ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" : "text-neutral-500 border-neutral-700/50 hover:text-neutral-300")}>
                        {t(`agenda.preset_${p.key}`)}
                    </button>
                ))}
            </div>
            {/* Selected badges */}
            {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedMembers.map(m => (
                        <span key={m.steamId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700/50">
                            {m.customUsername || m.nickname}
                            <button type="button" onClick={() => onChange(selected.filter(id => id !== m.steamId))}
                                className="text-neutral-500 hover:text-white transition-colors">
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            {/* Add individual */}
            {available.length > 0 && (
                <select value="" onChange={e => { if (e.target.value) onChange([...selected, e.target.value]); }}
                    className={cn(INPUT_CLS, "cursor-pointer text-neutral-500")}>
                    <option value="">{t("agenda.add_participant")}</option>
                    {available.map(m => (
                        <option key={m.steamId} value={m.steamId}>{m.customUsername || m.nickname}</option>
                    ))}
                </select>
            )}
        </div>
    );
}

// ── Toggle component (replaces native checkbox) ──────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5 group">
            <div className={cn(
                "w-8 h-[18px] rounded-full relative transition-colors",
                checked ? "bg-indigo-500" : "bg-neutral-700"
            )}>
                <div className={cn(
                    "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform",
                    checked ? "translate-x-[16px]" : "translate-x-[2px]"
                )} />
            </div>
            <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function CreateEventModal({ teamId, members, game, onClose, onCreated }: CreateEventModalProps) {
    const { t } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);
    const [type, setType] = useState<EventType | null>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    // Common
    const [date, setDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("20:00");
    const [endTime, setEndTime] = useState("22:00");
    const [allDay, setAllDay] = useState(false);
    const [participantIds, setParticipantIds] = useState<string[]>(() =>
        members.filter(m => m.role === "PLAYER" && m.activePlayer !== false).map(m => m.steamId)
    );

    // Match
    const [matchType, setMatchType] = useState<MatchType>("OFFICIAL");
    const [matchFormat, setMatchFormat] = useState<MatchFormat>("BO3");
    const [matchContext, setMatchContext] = useState<MatchContext>("TOURNAMENT");
    const [opponentName, setOpponentName] = useState("");
    const [showMatchOptions, setShowMatchOptions] = useState(false);
    const [competitionName, setCompetitionName] = useState("");
    const [competitionStage, setCompetitionStage] = useState("");
    const [matchLevel, setMatchLevel] = useState<MatchLevel | "">("");
    const [matchUrl, setMatchUrl] = useState("");
    const [notes, setNotes] = useState("");
    const [scores, setScores] = useState<{ mapName: string; ourScore: string; theirScore: string }[]>([]);

    // Strat
    const [stratMaps, setStratMaps] = useState<string[]>([]);
    const [stratObjectives, setStratObjectives] = useState("");

    // Meeting / Custom
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [link, setLink] = useState("");
    const [customSubtype, setCustomSubtype] = useState<string | null>(null);

    // Break
    const [breakRecurrence, setBreakRecurrence] = useState(false);
    const [breakWeeks, setBreakWeeks] = useState(1);

    const gameMaps = getMapsForGame(game);

    const isPast = useMemo(() => {
        if (!date || !startTime) return false;
        return new Date(`${date}T${startTime}:00`) < new Date();
    }, [date, startTime]);

    const handleFormatChange = (f: MatchFormat) => {
        setMatchFormat(f);
        if (isPast) setScores(Array.from({ length: formatCount(f) }, () => ({ mapName: "", ourScore: "", theirScore: "" })));
    };

    const handleDateChange = (d: string) => {
        setDate(d);
        if (!endDate) setEndDate(d);
        if (type === "MATCH" && d && startTime) {
            const past = new Date(`${d}T${startTime}:00`) < new Date();
            if (past && scores.length === 0) setScores(Array.from({ length: formatCount(matchFormat) }, () => ({ mapName: "", ourScore: "", theirScore: "" })));
            else if (!past) setScores([]);
        }
    };

    const updateScore = (i: number, field: string, value: string) => {
        setScores(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
    };

    const canSave = (() => {
        if (!type || !date) return false;
        if (!allDay && (!startTime || !endTime)) return false;
        if (type === "MEETING") return !!title.trim();
        if (type === "CUSTOM") return !!title.trim() && !!customSubtype;
        return true;
    })();

    const handleSave = async () => {
        if (!canSave || !type) return;
        setIsSaving(true);
        try {
            if (type === "MATCH") await handleCreateMatch();
            else await handleCreateEvent();
            toast.success(t("agenda.event_created"));
            onCreated();
            onClose();
        } catch { toast.error(t("common.error")); }
        finally { setIsSaving(false); }
    };

    const handleCreateMatch = async () => {
        const scheduledAt = new Date(`${date}T${startTime}:00`).toISOString();
        const match = await createMatch(teamId, {
            type: matchType, context: matchType === "OFFICIAL" ? matchContext : null,
            opponentName: opponentName.trim() || null, opponentLogo: null,
            matchUrl: matchUrl.trim() || null, scheduledAt, format: matchFormat,
            competitionName: competitionName.trim() || null, competitionStage: competitionStage.trim() || null,
            level: matchLevel || null, notes: notes.trim() || null,
        });
        if (isPast && scores.some(s => s.ourScore || s.theirScore)) {
            const maps = await getMaps(match.id);
            for (let i = 0; i < maps.length && i < scores.length; i++) {
                const s = scores[i];
                if (s.ourScore && s.theirScore) {
                    await updateMapScore(match.id, maps[i].id, { mapName: s.mapName || null, ourScore: parseInt(s.ourScore, 10), theirScore: parseInt(s.theirScore, 10) });
                }
            }
        }
    };

    const handleCreateEvent = async () => {
        const startAt = allDay ? new Date(`${date}T00:00:00`).toISOString() : new Date(`${date}T${startTime}:00`).toISOString();
        const endAt = allDay ? new Date(`${endDate || date}T23:59:59`).toISOString() : new Date(`${date}T${endTime}:00`).toISOString();
        const autoTitle = type === "REST" ? "Break"
            : type === "STRAT_TIME" ? `Strat${stratMaps.length ? " — " + stratMaps.map(m => m.replace("de_", "")).join(", ") : ""}`
            : title.trim();
        const descParts = [
            type === "STRAT_TIME" ? stratObjectives.trim() : description.trim(),
            link.trim() ? link.trim() : "",
        ].filter(Boolean);
        const autoDesc = descParts.length ? descParts.join("\n") : undefined;
        const autoTags = type === "STRAT_TIME" && stratMaps.length
            ? stratMaps.join(",")
            : type === "CUSTOM" && customSubtype
                ? customSubtype
                : undefined;

        await createEvent(teamId, {
            type: type!, title: autoTitle, description: autoDesc, startAt, endAt, tags: autoTags,
            participantScope: "INDIVIDUAL" as ParticipantScope, participantSteamIds: participantIds,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/85" onClick={onClose} />
            <div className="relative bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 sticky top-0 bg-neutral-900 z-10">
                    <h3 className="text-sm font-semibold text-white">{t("agenda.create_event")}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Type selector */}
                    <div className="grid grid-cols-5 gap-2">
                        {EVENT_TYPE_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            const active = type === opt.type;
                            return (
                                <button key={opt.type} type="button" onClick={() => setType(opt.type)}
                                    className={cn("flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all", active ? TYPE_ACTIVE[opt.color] : TYPE_INACTIVE)}>
                                    <Icon className="w-4 h-4" />
                                    <span className="text-[9px] font-semibold uppercase tracking-wide">{t(`agenda.event_type.${opt.type}`)}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── MATCH ──────────────────────────────────────────── */}
                    {type === "MATCH" && (<>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={LABEL}>{t("matches.type")}</label>
                                <div className="flex gap-1.5">
                                    {(["OFFICIAL", "SCRIM"] as MatchType[]).map(mt => (
                                        <button key={mt} type="button" onClick={() => setMatchType(mt)}
                                            className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors", chip(matchType === mt))}>
                                            {t(`matches.type_${mt.toLowerCase()}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={LABEL}>{t("matches.format")}</label>
                                <div className="flex gap-1.5">
                                    {MATCH_FORMATS.map(mf => (
                                        <button key={mf} type="button" onClick={() => handleFormatChange(mf)}
                                            className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors font-mono", chip(matchFormat === mf))}>
                                            {mf}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {matchType === "OFFICIAL" && (
                            <div>
                                <label className={LABEL}>{t("matches.context")}</label>
                                <div className="flex gap-1.5">
                                    {OFFICIAL_CONTEXTS.map(mc => (
                                        <button key={mc} type="button" onClick={() => setMatchContext(mc)}
                                            className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors", chip(matchContext === mc))}>
                                            {t(`matches.context_${mc.toLowerCase()}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className={LABEL}>{t("matches.opponent_name")}</label>
                                <input value={opponentName} onChange={e => setOpponentName(e.target.value)} placeholder={t("matches.opponent_name_placeholder")} autoFocus className={INPUT_CLS} /></div>
                            <div><label className={LABEL}>{t("agenda.field_date")}<span className="ml-1 text-indigo-500">*</span></label>
                                <DatePicker value={date} onChange={handleDateChange} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className={LABEL}>{t("agenda.field_start")}<span className="ml-1 text-indigo-500">*</span></label>
                                <TimePicker value={startTime} onChange={setStartTime} /></div>
                            <div><label className={LABEL}>{t("agenda.estimated_duration")}</label>
                                <p className="h-8 flex items-center text-xs text-neutral-500">~{matchFormat === "BO1" ? "1h" : matchFormat === "BO3" ? "3h" : "5h"}</p></div>
                        </div>
                        {isPast && date && (
                            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2">
                                <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide mb-0.5">{t("agenda.past_match")}</p>
                                <p className="text-[11px] text-neutral-400">{t("agenda.past_match_hint")}</p>
                            </div>
                        )}
                        {isPast && scores.length > 0 && (
                            <div className="space-y-2">
                                <label className={LABEL}>{t("agenda.scores")}</label>
                                {scores.map((s, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_60px_20px_60px] gap-2 items-center">
                                        <select value={s.mapName} onChange={e => updateScore(i, "mapName", e.target.value)} className={cn(INPUT_CLS, "cursor-pointer")}>
                                            <option value="">Map {i + 1}</option>
                                            {gameMaps.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </select>
                                        <input type="number" min="0" max="99" value={s.ourScore} onChange={e => updateScore(i, "ourScore", e.target.value)} placeholder="—" className={cn(INPUT_CLS, "text-center tabular-nums")} />
                                        <span className="text-neutral-600 text-center text-xs">–</span>
                                        <input type="number" min="0" max="99" value={s.theirScore} onChange={e => updateScore(i, "theirScore", e.target.value)} placeholder="—" className={cn(INPUT_CLS, "text-center tabular-nums")} />
                                    </div>
                                ))}
                            </div>
                        )}
                        <div>
                            <button type="button" onClick={() => setShowMatchOptions(v => !v)}
                                className="w-full flex items-center justify-between text-[10px] font-semibold text-neutral-600 hover:text-neutral-400 uppercase tracking-wider py-1 transition-colors">
                                {t("matches.more_options")}
                                <ChevronDown className={cn("w-3 h-3 transition-transform", showMatchOptions && "rotate-180")} />
                            </button>
                            {showMatchOptions && (
                                <div className="mt-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className={LABEL}>{t("matches.competition_name")}</label>
                                            <input value={competitionName} onChange={e => setCompetitionName(e.target.value)} placeholder={t("matches.optional")} className={INPUT_CLS} /></div>
                                        <div><label className={LABEL}>{t("matches.competition_stage")}</label>
                                            <input value={competitionStage} onChange={e => setCompetitionStage(e.target.value)} placeholder={t("matches.optional")} className={INPUT_CLS} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className={LABEL}>{t("matches.level")}</label>
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => setMatchLevel("")} className={cn("px-2 py-1 rounded-lg text-xs font-medium border transition-colors", chip(matchLevel === ""))}>—</button>
                                                {MATCH_LEVELS.map(ml => (<button key={ml} type="button" onClick={() => setMatchLevel(ml)} className={cn("flex-1 py-1 rounded-lg text-xs font-bold border transition-colors font-mono", chip(matchLevel === ml))}>{ml}</button>))}
                                            </div></div>
                                        <div><label className={LABEL}>{t("matches.match_url")}</label>
                                            <input value={matchUrl} onChange={e => setMatchUrl(e.target.value)} placeholder="https://..." className={INPUT_CLS} /></div>
                                    </div>
                                    <div><label className={LABEL}>{t("matches.notes")}</label>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("matches.notes_placeholder")} rows={2} className={cn(INPUT_CLS, "h-auto py-2 resize-none")} /></div>
                                </div>
                            )}
                        </div>
                    </>)}

                    {/* ── STRAT TIME ─────────────────────────────────────── */}
                    {type === "STRAT_TIME" && (<>
                        <div className="grid grid-cols-3 gap-2">
                            <div><label className={LABEL}>{t("agenda.field_date")}<span className="ml-1 text-indigo-500">*</span></label>
                                <DatePicker value={date} onChange={setDate} /></div>
                            <div><label className={LABEL}>{t("agenda.field_start")}</label>
                                <TimePicker value={startTime} onChange={setStartTime} /></div>
                            <div><label className={LABEL}>{t("agenda.field_end")}</label>
                                <TimePicker value={endTime} onChange={setEndTime} /></div>
                        </div>
                        <div>
                            <label className={LABEL}>{t("agenda.strat_maps")}</label>
                            <div className="flex flex-wrap gap-1.5">
                                {gameMaps.map(m => {
                                    const active = stratMaps.includes(m.value);
                                    return (<button key={m.value} type="button"
                                        onClick={() => setStratMaps(prev => active ? prev.filter(v => v !== m.value) : [...prev, m.value])}
                                        className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors",
                                            active ? "bg-purple-500/15 text-purple-300 border-purple-500/30" : TYPE_INACTIVE)}>
                                        {m.label}
                                    </button>);
                                })}
                            </div>
                        </div>
                        <div><label className={LABEL}>{t("agenda.strat_objectives")}</label>
                            <textarea value={stratObjectives} onChange={e => setStratObjectives(e.target.value)}
                                placeholder={t("agenda.strat_objectives_placeholder")} rows={2} className={cn(INPUT_CLS, "h-auto py-2 resize-none")} /></div>
                        <div><label className={LABEL}>{t("agenda.field_link")}</label>
                            <input value={link} onChange={e => setLink(e.target.value)} placeholder={t("agenda.link_placeholder")} className={INPUT_CLS} /></div>
                        <ParticipantSelector members={members} selected={participantIds} onChange={setParticipantIds} />
                    </>)}

                    {/* ── MEETING ────────────────────────────────────────── */}
                    {type === "MEETING" && (<>
                        <div><label className={LABEL}>{t("agenda.field_title")}<span className="ml-1 text-indigo-500">*</span></label>
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("agenda.meeting_placeholder")} autoFocus className={INPUT_CLS} /></div>
                        <div className="grid grid-cols-3 gap-2">
                            <div><label className={LABEL}>{t("agenda.field_date")}<span className="ml-1 text-indigo-500">*</span></label>
                                <DatePicker value={date} onChange={setDate} /></div>
                            <div><label className={LABEL}>{t("agenda.field_start")}</label>
                                <TimePicker value={startTime} onChange={setStartTime} /></div>
                            <div><label className={LABEL}>{t("agenda.field_end")}</label>
                                <TimePicker value={endTime} onChange={setEndTime} /></div>
                        </div>
                        <div><label className={LABEL}>{t("agenda.field_description")}</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("agenda.description_placeholder")} rows={2} className={cn(INPUT_CLS, "h-auto py-2 resize-none")} /></div>
                        <div><label className={LABEL}>{t("agenda.field_link")}</label>
                            <input value={link} onChange={e => setLink(e.target.value)} placeholder={t("agenda.link_placeholder")} className={INPUT_CLS} /></div>
                        <ParticipantSelector members={members} selected={participantIds} onChange={setParticipantIds} />
                    </>)}

                    {/* ── BREAK ──────────────────────────────────────────── */}
                    {type === "REST" && (<>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className={LABEL}>{t("agenda.break_start")}<span className="ml-1 text-indigo-500">*</span></label>
                                <DatePicker value={date} onChange={d => { setDate(d); if (!endDate) setEndDate(d); }} /></div>
                            <div><label className={LABEL}>{t("agenda.break_end")}</label>
                                <DatePicker value={endDate} onChange={setEndDate} /></div>
                        </div>
                        <Toggle checked={allDay} onChange={setAllDay} label={t("agenda.all_day")} />
                        {!allDay && (
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className={LABEL}>{t("agenda.field_start")}</label>
                                    <TimePicker value={startTime} onChange={setStartTime} /></div>
                                <div><label className={LABEL}>{t("agenda.field_end")}</label>
                                    <TimePicker value={endTime} onChange={setEndTime} /></div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Toggle checked={breakRecurrence} onChange={setBreakRecurrence} label={t("agenda.repeat_weekly")} />
                            {breakRecurrence && (
                                <div className="flex items-center gap-1.5">
                                    <input type="number" min={1} max={52} value={breakWeeks}
                                        onChange={e => setBreakWeeks(parseInt(e.target.value) || 1)}
                                        className={cn(INPUT_CLS, "w-14 text-center")} />
                                    <span className="text-xs text-neutral-500">{t("agenda.weeks")}</span>
                                </div>
                            )}
                        </div>
                        <ParticipantSelector members={members} selected={participantIds} onChange={setParticipantIds} />
                    </>)}

                    {/* ── CUSTOM ─────────────────────────────────────────── */}
                    {type === "CUSTOM" && (<>
                        {/* Sub-type */}
                        <div>
                            <label className={LABEL}>{t("agenda.custom_category")}</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {CUSTOM_SUBTYPES.map(st => {
                                    const Icon = st.icon;
                                    const active = customSubtype === st.key;
                                    return (
                                        <button key={st.key} type="button" onClick={() => setCustomSubtype(st.key)}
                                            className={cn("flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all text-[10px] font-semibold",
                                                active ? SUBTYPE_ACTIVE[st.color] : TYPE_INACTIVE)}>
                                            <Icon className="w-3.5 h-3.5 shrink-0" />
                                            {t(`agenda.subtype.${st.key}`)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div><label className={LABEL}>{t("agenda.field_title")}<span className="ml-1 text-indigo-500">*</span></label>
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("agenda.custom_placeholder")} autoFocus className={INPUT_CLS} /></div>

                        <div className="grid grid-cols-2 gap-2">
                            <div><label className={LABEL}>{t("agenda.break_start")}<span className="ml-1 text-indigo-500">*</span></label>
                                <DatePicker value={date} onChange={d => { setDate(d); if (!endDate) setEndDate(d); }} /></div>
                            <div><label className={LABEL}>{t("agenda.break_end")}</label>
                                <DatePicker value={endDate} onChange={setEndDate} /></div>
                        </div>

                        <Toggle checked={allDay} onChange={setAllDay} label={t("agenda.all_day")} />

                        {!allDay && (
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className={LABEL}>{t("agenda.field_start")}</label>
                                    <TimePicker value={startTime} onChange={setStartTime} /></div>
                                <div><label className={LABEL}>{t("agenda.field_end")}</label>
                                    <TimePicker value={endTime} onChange={setEndTime} /></div>
                            </div>
                        )}

                        <div><label className={LABEL}>{t("agenda.field_description")}</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("agenda.description_placeholder")} rows={2} className={cn(INPUT_CLS, "h-auto py-2 resize-none")} /></div>

                        <div><label className={LABEL}>{t("agenda.field_link")}</label>
                            <input value={link} onChange={e => setLink(e.target.value)} placeholder={t("agenda.link_placeholder")} className={INPUT_CLS} /></div>

                        <ParticipantSelector members={members} selected={participantIds} onChange={setParticipantIds} />
                    </>)}
                </div>

                {/* Footer */}
                {type && (
                    <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-800 sticky bottom-0 bg-neutral-900">
                        <button onClick={onClose} disabled={isSaving} className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">{t("common.cancel")}</button>
                        <button onClick={handleSave} disabled={!canSave || isSaving}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-[4px] bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-40 text-white text-xs font-semibold transition-colors">
                            {isSaving && <Loader className="w-3 h-3 animate-spin" />}
                            {t("common.create")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
