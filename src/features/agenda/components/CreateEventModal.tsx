import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
    X, Loader, Swords, Coffee, Moon, MessageSquare, Crosshair, Layers,
    Palmtree, Plane, Video, ArrowLeft, Trophy, Search,
    UserX, ChevronDown, AlertTriangle, Hand,
} from "lucide-react";
import FaceitIcon from "@/shared/components/FaceitIcon";
import DatePicker from "@/design-system/components/DatePicker";
import TimePicker from "@/design-system/components/TimePicker";
import { createEvent, createAvailability } from "@/api/endpoints/agenda.api";
import { createMatch } from "@/api/endpoints/match.api";
import { createCompetition, getActiveCompetitions } from "@/api/endpoints/competition.api";
import { discoverFaceitCompetition } from "@/api/endpoints/faceit.api";
import { invalidateMatchSummary } from "@/features/match/hooks/useMatchSummary";
import { mapFaceitImportError } from "@/shared/utils/faceitErrors";
import { getStrats } from "@/api/endpoints/stratbook.api";
import type { StratSummaryDto } from "@/api/types/stratbook";
import type { EventType, ParticipantScope } from "@/api/types/agenda";
import type { MatchType, MatchFormat } from "@/api/types/match";
import type { CompetitionType, CompetitionSummaryDto } from "@/api/types/competition";
import type { TeamMember } from "@/contexts/team/team.types";
import type { Game } from "@/api/types/team";
import { getMapsForGame } from "@/shared/config/gameConfig";
import { cn } from "@/design-system";

// ── Props ────────────────────────────────────────────────────────────────────

interface CreateEventModalProps {
    teamId: string;
    members: TeamMember[];
    game?: Game | undefined;
    initialDate?: string | undefined;
    isStaff: boolean;
    isCaptain?: boolean | undefined;
    onClose: () => void;
    onCreated: () => void;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const LABEL = "text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1 block";
const INPUT_CLS = "w-full h-8 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-2.5 outline-none placeholder:text-neutral-600 focus:border-indigo-500/50 caret-indigo-400 transition-colors";
const TYPE_INACTIVE = "bg-neutral-800/40 border-neutral-700/40 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600";

function chip(active: boolean) {
    return active
        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
        : "text-neutral-500 border-neutral-700/50 hover:text-neutral-300";
}

const TYPE_ACTIVE: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    neutral: "bg-neutral-500/10 border-neutral-600/30 text-neutral-400",
    teal: "bg-teal-500/10 border-teal-500/30 text-teal-400",
    slate: "bg-slate-500/10 border-slate-500/30 text-slate-400",
    red: "bg-red-500/10 border-red-500/30 text-red-400",
};

const SUBTYPE_ACTIVE: Record<string, string> = {
    violet: "bg-violet-500/10 border-violet-500/30 text-violet-400",
    cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    pink: "bg-pink-500/10 border-pink-500/30 text-pink-400",
    zinc: "bg-zinc-500/10 border-zinc-500/30 text-zinc-400",
};

// ── Type config ──────────────────────────────────────────────────────────────

type OptionKey = EventType | "MATCH" | "COMPETITION" | "AVAILABILITY";
type Permission = "staff" | "all";
type TypeOption = { type: OptionKey; icon: React.ElementType; color: string; labelKey: string; perm: Permission };

const ALL_TYPE_OPTIONS: TypeOption[] = [
    { type: "MATCH", icon: Swords, color: "blue", labelKey: "agenda.event_type.MATCH", perm: "staff" },
    { type: "COMPETITION", icon: Trophy, color: "amber", labelKey: "agenda.type_competition", perm: "staff" },
    { type: "STRAT_TIME", icon: Crosshair, color: "yellow", labelKey: "agenda.event_type.STRAT_TIME", perm: "staff" },
    { type: "MEETING", icon: MessageSquare, color: "emerald", labelKey: "agenda.event_type.MEETING", perm: "all" },
    { type: "REST", icon: Moon, color: "neutral", labelKey: "agenda.event_type.REST", perm: "staff" },
    { type: "BREAK", icon: Coffee, color: "teal", labelKey: "agenda.event_type.BREAK", perm: "staff" },
    { type: "CUSTOM", icon: Layers, color: "slate", labelKey: "agenda.event_type.CUSTOM", perm: "staff" },
    { type: "AVAILABILITY", icon: UserX, color: "red", labelKey: "agenda.type_availability", perm: "all" },
];

const CUSTOM_SUBTYPES: { key: string; icon: React.ElementType; color: string }[] = [
    { key: "TRAVEL", icon: Plane, color: "violet" },
    { key: "VACATION", icon: Palmtree, color: "cyan" },
    { key: "MEDIA", icon: Video, color: "pink" },
    { key: "OTHER", icon: Layers, color: "zinc" },
];

const COMPETITION_TYPES: CompetitionType[] = ["LEAGUE", "TOURNAMENT", "CUP", "LAN", "QUALIFIER", "OTHER"];
const MATCH_FORMATS: MatchFormat[] = ["BO1", "BO3", "BO5"];

const DAYS_OF_WEEK = [
    { key: "MONDAY", short: "L" }, { key: "TUESDAY", short: "M" },
    { key: "WEDNESDAY", short: "Me" }, { key: "THURSDAY", short: "J" },
    { key: "FRIDAY", short: "V" }, { key: "SATURDAY", short: "S" },
    { key: "SUNDAY", short: "D" },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function ParticipantSelector({ members, selected, onChange }: { members: TeamMember[]; selected: string[]; onChange: (ids: string[]) => void }) {
    const { t } = useTranslation();
    const allIds = members.map(m => m.steamId);
    const playerIds = members.filter(m => m.role === "PLAYER" && m.activePlayer !== false).map(m => m.steamId);
    const staffIds = members.filter(m => m.isOwner || m.role !== "PLAYER").map(m => m.steamId);
    const eq = (a: string[], b: string[]) => a.length === b.length && a.every(id => b.includes(id));
    const presets = [{ key: "everyone", ids: allIds }, { key: "players", ids: playerIds }, { key: "staff", ids: staffIds }];
    return (
        <div>
            <label className={LABEL}>{t("agenda.field_participants")}</label>
            <div className="flex gap-1.5 mb-3">
                {presets.map(p => (
                    <button key={p.key} type="button" onClick={() => onChange(eq(selected, p.ids) ? [] : p.ids)}
                        className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors",
                            eq(selected, p.ids) ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" : "text-neutral-500 border-neutral-700/50 hover:text-neutral-300")}>{t(`agenda.preset_${p.key}`)}</button>
                ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {members.map(m => {
                    const on = selected.includes(m.steamId);
                    return (
                        <button key={m.steamId} type="button" onClick={() => onChange(on ? selected.filter(id => id !== m.steamId) : [...selected, m.steamId])}
                            className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all",
                                on ? "bg-neutral-800 text-neutral-200 border-neutral-600" : "bg-transparent text-neutral-600 border-neutral-800 hover:text-neutral-400 hover:border-neutral-700")}>
                            {m.customUsername || m.nickname}
                            {on && <X className="w-2.5 h-2.5 text-neutral-500 hover:text-white" />}
                        </button>);
                })}
            </div>
        </div>
    );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5 group">
            <div className={cn("w-8 h-[18px] rounded-full relative transition-colors", checked ? "bg-indigo-500" : "bg-neutral-700")}>
                <div className={cn("absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform", checked ? "translate-x-[16px]" : "translate-x-[2px]")} />
            </div>
            <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}

function StratPicker({ teamId, selectedMaps, selectedIds, onChange }: { teamId: string; selectedMaps: string[]; selectedIds: number[]; onChange: (ids: number[]) => void }) {
    const { t } = useTranslation();
    const [strats, setStrats] = useState<StratSummaryDto[]>([]);
    const [search, setSearch] = useState("");
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        if (selectedMaps.length === 0) { setStrats([]); setLoaded(true); return; }
        getStrats(teamId, { map: "", side: "", type: "", status: "", difficulty: "", search: search.trim(), tag: "", favoritesOnly: false }, 0, 100)
            .then(r => { setStrats(r.content.filter(s => s.status !== "DEPRECATED").filter(s => selectedMaps.includes(s.map))); setLoaded(true); })
            .catch(() => setLoaded(true));
    }, [teamId, selectedMaps, search]);
    if (selectedMaps.length === 0) return null;
    return (
        <div>
            <label className={LABEL}>{t("agenda.strat_picker_label")}</label>
            <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-600" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("agenda.strat_picker_placeholder")} className={cn(INPUT_CLS, "pl-7")} />
            </div>
            {loaded && strats.length === 0 ? (
                <p className="text-[11px] text-neutral-600 py-2">{t(search ? "agenda.strat_picker_empty" : "agenda.strat_picker_none")}</p>
            ) : (
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                    {strats.map(s => {
                        const active = selectedIds.includes(s.id);
                        return (
                            <button key={s.id} type="button" onClick={() => onChange(active ? selectedIds.filter(x => x !== s.id) : [...selectedIds, s.id])}
                                className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                                    active ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300" : TYPE_INACTIVE)}>
                                <span className={cn("font-bold", s.side === "T" ? "text-amber-400" : "text-blue-400")}>{s.side}</span>
                                <span>{s.name}</span>
                                <span className="text-neutral-600">{s.map.replace("de_", "")}</span>
                                {active && <X className="w-2.5 h-2.5 text-yellow-500" />}
                            </button>);
                    })}
                </div>
            )}
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

type Step = 0 | 1 | 2;

export default function CreateEventModal({ teamId, members, game, initialDate, isStaff, isCaptain, onClose, onCreated }: CreateEventModalProps) {
    const { t } = useTranslation();

    const canSeeAll = isStaff || !!isCaptain;
    const typeOptions = ALL_TYPE_OPTIONS.filter(opt => opt.perm === "all" || canSeeAll);

    const [step, setStep] = useState<Step>(0);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedType, setSelectedType] = useState<TypeOption | null>(null);

    const isFaceitTeam = game === "CS2";
    const isMatch = selectedType?.type === "MATCH";
    const isCompetition = selectedType?.type === "COMPETITION";
    const isAvailability = selectedType?.type === "AVAILABILITY";
    const isCustom = selectedType?.type === "CUSTOM";
    const isEventType = !isMatch && !isCompetition && !isAvailability;
    const hasFaceitChoice = (isMatch || isCompetition) && isFaceitTeam;
    const [createMode, setCreateMode] = useState<"manual" | "faceit" | null>(null);

    // Step logic: Match/Compet with FACEIT = 3 steps (type → mode → form), Custom = 3, others = 2
    const isFormStep = hasFaceitChoice
        ? step === 2
        : isAvailability ? step >= 1
        : isMatch || isCompetition ? step >= 1
        : step === (isCustom ? 2 : 1);

    // ── Shared state ──
    const [date, setDate] = useState(initialDate ?? "");
    const [endDate, setEndDate] = useState(initialDate ?? "");
    const [startTime, setStartTime] = useState("20:00");
    const [endTime, setEndTime] = useState("22:00");
    const [allDay, setAllDay] = useState(false);
    const [participantIds, setParticipantIds] = useState<string[]>(() => members.filter(m => m.role === "PLAYER" && m.activePlayer !== false).map(m => m.steamId));

    // ── Match state ──
    const [matchType, setMatchType] = useState<MatchType>("OFFICIAL");
    const [matchFormat, setMatchFormat] = useState<MatchFormat>("BO3");
    const [opponentName, setOpponentName] = useState("");
    const [matchUrl, setMatchUrl] = useState("");
    const [matchNotes, setMatchNotes] = useState("");
    const [matchCompetitionId, setMatchCompetitionId] = useState<number | null>(null);
    const [showMatchOptions, setShowMatchOptions] = useState(false);
    const [activeCompetitions, setActiveCompetitions] = useState<CompetitionSummaryDto[]>([]);

    // ── Competition state ──
    const [compName, setCompName] = useState("");
    const [compType, setCompType] = useState<CompetitionType>("TOURNAMENT");
    const [compStage, setCompStage] = useState("");
    const [compStartDate, setCompStartDate] = useState(initialDate ?? "");
    const [compEndDate, setCompEndDate] = useState("");
    const [compFormat, setCompFormat] = useState("");
    const [compCashprize, setCompCashprize] = useState("");
    const [compUrl, setCompUrl] = useState("");
    const [compNotes, setCompNotes] = useState("");
    const [showCompOptions, setShowCompOptions] = useState(false);

    // ── FACEIT import ──
    const [faceitUrl, setFaceitUrl] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const activePlayers = members.filter(m => m.role === "PLAYER" && m.activePlayer !== false);
    const linkedCount = activePlayers.filter(m => m.faceitNickname != null).length;
    const canImport = linkedCount >= 3;

    // ── Strat state ──
    const [stratMaps, setStratMaps] = useState<string[]>([]);
    const [stratObjectives, setStratObjectives] = useState("");
    const [selectedStratIds, setSelectedStratIds] = useState<number[]>([]);

    // ── Event state ──
    const [type, setType] = useState<EventType | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [link, setLink] = useState("");
    const [customSubtype, setCustomSubtype] = useState<string | null>(null);
    const [breakRecurrence, setBreakRecurrence] = useState(false);
    const [breakWeeks, setBreakWeeks] = useState(1);

    // ── Availability state ──
    const [availStartTime, setAvailStartTime] = useState("09:00");
    const [availEndTime, setAvailEndTime] = useState("18:00");
    const [reason, setReason] = useState("");
    const [recurring, setRecurring] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [recurWeeks, setRecurWeeks] = useState(4);

    const gameMaps = getMapsForGame(game);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    useEffect(() => {
        if (customSubtype === "TRAVEL" || customSubtype === "VACATION") setAllDay(true);
        else if (customSubtype === "MEDIA") setAllDay(false);
    }, [customSubtype]);

    // Fetch active competitions for match form
    useEffect(() => {
        if (isMatch && step >= 1 && teamId) {
            getActiveCompetitions(teamId).then(setActiveCompetitions).catch(() => {});
        }
    }, [isMatch, step, teamId]);

    // ── Navigation ──
    const handleSelectType = (opt: TypeOption) => {
        setSelectedType(opt);
        if (opt.type === "AVAILABILITY") { setStep(1); return; }
        if (opt.type === "CUSTOM") { setType("CUSTOM" as EventType); setStep(1); return; }
        if (opt.type === "MATCH" || opt.type === "COMPETITION") {
            if (isFaceitTeam) { setStep(1); return; } // go to mode selector
            setStep(1); setCreateMode("manual"); return; // skip mode, go to form
        }
        setType(opt.type as EventType);
        setStep(1);
    };

    const handleSelectMode = (mode: "manual" | "faceit") => {
        setCreateMode(mode);
        setStep(2);
    };

    const handleSelectSubtype = (key: string) => {
        setCustomSubtype(key);
        setStep(2);
    };

    const handleBack = () => {
        if (step === 1) { setStep(0); setType(null); setCustomSubtype(null); setCreateMode(null); }
        else if (step === 2) setStep(1);
    };

    // ── Scope detection ──
    const detectScope = (): { scope: ParticipantScope; ids: string[] | undefined } => {
        if (type !== "MEETING" && type !== "CUSTOM") return { scope: "ALL_MEMBERS", ids: undefined };
        const allIds = members.map(m => m.steamId);
        const playerIds = members.filter(m => m.role === "PLAYER" && m.activePlayer !== false).map(m => m.steamId);
        const staffIds = members.filter(m => m.isOwner || m.role !== "PLAYER").map(m => m.steamId);
        const eq = (a: string[], b: string[]) => a.length === b.length && a.every(id => b.includes(id));
        if (eq(participantIds, allIds)) return { scope: "ALL_MEMBERS", ids: undefined };
        if (eq(participantIds, playerIds)) return { scope: "ACTIVE_ROSTER", ids: undefined };
        if (eq(participantIds, staffIds)) return { scope: "STAFF_ONLY", ids: undefined };
        return { scope: "INDIVIDUAL", ids: participantIds };
    };

    // ── FACEIT import ──
    const handleFaceitImport = async () => {
        if (!faceitUrl.trim() || !canImport) return;
        setIsImporting(true);
        try {
            const result = await discoverFaceitCompetition(teamId, faceitUrl.trim());
            if (result.imported > 0) toast.success(t("faceit.discover_success", { count: result.imported }));
            else if (result.skipped > 0) toast(t("faceit.discover_already_exists"), { icon: "ℹ️" });
            else toast.success(t("faceit.discover_competition_added"));
            onCreated();
            onClose();
        } catch (err: unknown) {
            const apiErr = err as { message?: string };
            toast.error(t(mapFaceitImportError(apiErr?.message)));
        } finally { setIsImporting(false); }
    };

    // ── canSave ──
    const canSaveMatch = !!date && !!startTime;
    const canSaveCompetition = !!compName.trim();
    const canSaveAvailability = !!date && !!availStartTime && !!availEndTime && (!recurring || selectedDays.length > 0);
    const canSaveEvent = (() => {
        if (!type || !date) return false;
        if (type === "REST") return true;
        if (!allDay && (!startTime || !endTime)) return false;
        if (type === "MEETING") return !!title.trim();
        if (type === "CUSTOM") return !!title.trim() && !!customSubtype;
        return true;
    })();
    const canSave = isMatch ? canSaveMatch : isCompetition ? canSaveCompetition : isAvailability ? canSaveAvailability : canSaveEvent;

    // ── Save ──
    const handleSave = async () => {
        if (!canSave) return;
        setIsSaving(true);
        try {
            if (isMatch) {
                await createMatch(teamId, {
                    type: matchType, opponentName: opponentName.trim() || null, opponentLogo: null,
                    matchUrl: matchUrl.trim() || null, notes: matchNotes.trim() || null,
                    scheduledAt: new Date(`${date}T${startTime}:00`).toISOString(),
                    format: matchFormat, competitionId: matchCompetitionId || null,
                });
                invalidateMatchSummary();
                toast.success(t("agenda.event_created"));
            } else if (isCompetition) {
                await createCompetition(teamId, {
                    name: compName.trim(), type: compType,
                    startDate: compStartDate || null, endDate: compEndDate || null,
                    stage: compStage.trim() || null, format: compFormat.trim() || null,
                    cashprize: compCashprize.trim() || null, url: compUrl.trim() || null,
                    notes: compNotes.trim() || null,
                });
                toast.success(t("agenda.event_created"));
            } else if (isAvailability) {
                await createAvailability(teamId, {
                    startAt: new Date(`${date}T${availStartTime}:00`).toISOString(),
                    endAt: new Date(`${date}T${availEndTime}:00`).toISOString(),
                    reason: reason.trim() || undefined,
                    recurringDays: recurring ? selectedDays : undefined,
                    recurringWeeks: recurring ? recurWeeks : undefined,
                });
                toast.success(t("agenda.unavailability_created"));
            } else if (type) {
                const isAllDay = type === "REST" || allDay;
                const startAt = isAllDay ? new Date(`${date}T00:00:00`).toISOString() : new Date(`${date}T${startTime}:00`).toISOString();
                const endAt = isAllDay ? new Date(`${endDate || date}T23:59:59`).toISOString() : new Date(`${date}T${endTime}:00`).toISOString();
                let stratDesc = stratObjectives.trim();
                if (selectedStratIds.length > 0) {
                    const ids = selectedStratIds.map(id => `#${id}`).join(", ");
                    stratDesc = stratDesc ? `${stratDesc}\n---\nStrats: ${ids}` : `Strats: ${ids}`;
                }
                const autoTitle = type === "REST" ? t("agenda.event_type.REST") : type === "BREAK" ? t("agenda.event_type.BREAK")
                    : type === "STRAT_TIME" ? `Strat${stratMaps.length ? " — " + stratMaps.map(m => m.replace("de_", "")).join(", ") : ""}` : title.trim();
                const descParts = [type === "STRAT_TIME" ? stratDesc : description.trim(), link.trim() || ""].filter(Boolean);
                const autoTags = type === "STRAT_TIME" && stratMaps.length ? stratMaps.join(",") : type === "CUSTOM" && customSubtype ? customSubtype : undefined;
                const { scope, ids } = detectScope();
                await createEvent(teamId, { type, title: autoTitle, description: descParts.length ? descParts.join("\n") : undefined, startAt, endAt, tags: autoTags, participantScope: scope, participantSteamIds: ids });
                toast.success(t("agenda.event_created"));
            }
            onCreated();
            onClose();
        } catch { toast.error(t("common.error")); }
        finally { setIsSaving(false); }
    };

    // ── Helpers ──
    const isDateRange = customSubtype === "TRAVEL" || customSubtype === "VACATION" || customSubtype === "OTHER";
    const showTimePickers = !allDay && customSubtype !== "TRAVEL" && customSubtype !== "VACATION";
    const showAllDayToggle = customSubtype === "OTHER";
    const showLink = type === "STRAT_TIME" || type === "MEETING" || (type === "CUSTOM" && (customSubtype === "MEDIA" || customSubtype === "OTHER"));
    const showRecurrence = type === "REST" || type === "BREAK" || (type === "CUSTOM" && customSubtype !== "MEDIA");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/85" onClick={onClose} />
            <div className="relative bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-xl mx-4 flex flex-col" style={{ maxHeight: "90vh" }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-800 shrink-0">
                    <h3 className="text-base font-semibold text-white">{t("agenda.create_event")}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"><X className="w-4 h-4" /></button>
                </div>


                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[320px]">

                    {/* ── Step 0: Type selector ───────────────────────────── */}
                    {step === 0 && (
                        <div className="p-5">
                            <div className="grid grid-cols-2 gap-2.5">
                                {typeOptions.map(opt => {
                                    const Icon = opt.icon;
                                    return (
                                        <button key={opt.type} type="button" onClick={() => handleSelectType(opt)}
                                            className={cn("flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left",
                                                TYPE_INACTIVE, "hover:border-neutral-600 hover:bg-neutral-800/40")}>
                                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border", TYPE_ACTIVE[opt.color])}><Icon className="w-4 h-4" /></div>
                                            <span className="text-sm font-semibold text-neutral-200">{t(opt.labelKey)}</span>
                                        </button>);
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Step 1 (Custom): Subtype ────────────────────────── */}
                    {step === 1 && isCustom && (
                        <div className="p-5">
                            <div className="grid grid-cols-2 gap-2.5">
                                {CUSTOM_SUBTYPES.map(st => {
                                    const Icon = st.icon;
                                    return (
                                        <button key={st.key} type="button" onClick={() => handleSelectSubtype(st.key)}
                                            className={cn("flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left",
                                                TYPE_INACTIVE, "hover:border-neutral-600 hover:bg-neutral-800/40")}>
                                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border", SUBTYPE_ACTIVE[st.color])}><Icon className="w-4 h-4" /></div>
                                            <span className="text-sm font-semibold text-neutral-200">{t(`agenda.subtype.${st.key}`)}</span>
                                        </button>);
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Step 1 (Match/Compet): Mode selector ─────────── */}
                    {step === 1 && hasFaceitChoice && (
                        <div className="p-5 space-y-2.5">
                            <button type="button" onClick={() => handleSelectMode("manual")}
                                className={cn("w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left",
                                    createMode === "manual" ? "bg-neutral-700/30 border-neutral-500/30 text-white" : TYPE_INACTIVE,
                                    createMode !== "manual" && "hover:border-neutral-600 hover:bg-neutral-800/40")}>
                                <div className="w-9 h-9 rounded-lg bg-neutral-700/40 border border-neutral-600/40 flex items-center justify-center shrink-0 text-neutral-300">
                                    <Hand className="w-4 h-4" />
                                </div>
                                <span className={cn("text-sm font-semibold", createMode === "manual" ? "text-white" : "text-neutral-200")}>
                                    {isMatch ? t("matches.create_manual") : t("competitions.create_manual")}
                                </span>
                            </button>
                            <button type="button" onClick={() => canImport ? handleSelectMode("faceit") : undefined}
                                className={cn("w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left",
                                    !canImport ? "opacity-50 cursor-not-allowed border-neutral-800 bg-neutral-900/30" :
                                    createMode === "faceit" ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : TYPE_INACTIVE,
                                    canImport && createMode !== "faceit" && "hover:border-neutral-600 hover:bg-neutral-800/40")}>
                                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                                    canImport ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-neutral-800 border-neutral-700 text-neutral-600")}>
                                    <FaceitIcon className="w-4 h-4" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={cn("text-sm font-semibold", createMode === "faceit" ? "text-white" : canImport ? "text-neutral-200" : "text-neutral-500")}>
                                        {isMatch ? t("matches.import_faceit") : t("competitions.import_faceit")}
                                    </span>
                                    {!canImport && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                </div>
                            </button>
                        </div>
                    )}

                    {/* ── MATCH manual form ─────────────────────────────────── */}
                    {isFormStep && isMatch && createMode !== "faceit" && (
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={LABEL}>{t("matches.type")}</label>
                                    <div className="flex gap-1.5">
                                        {(["OFFICIAL", "SCRIM"] as MatchType[]).map(mt => (
                                            <button key={mt} type="button" onClick={() => { setMatchType(mt); if (mt === "SCRIM") setMatchCompetitionId(null); }}
                                                className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors", chip(matchType === mt))}>{t(`matches.type_${mt.toLowerCase()}`)}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className={LABEL}>{t("matches.format")}</label>
                                    <div className="flex gap-1.5">
                                        {MATCH_FORMATS.map(mf => (
                                            <button key={mf} type="button" onClick={() => setMatchFormat(mf)}
                                                className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors font-mono", chip(matchFormat === mf))}>{mf}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-neutral-800/60" />

                            {matchType === "OFFICIAL" && (
                                <div>
                                    <label className={LABEL}>{t("matches.competition_name")}</label>
                                    <select value={matchCompetitionId ?? ""} onChange={e => setMatchCompetitionId(e.target.value ? Number(e.target.value) : null)} className={cn(INPUT_CLS, "cursor-pointer")}>
                                        <option value="">{t("competitions.none")}</option>
                                        {activeCompetitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div><label className={LABEL}>{t("matches.opponent_name")}</label>
                                    <input value={opponentName} onChange={e => setOpponentName(e.target.value)} placeholder={t("matches.opponent_name_placeholder")} className={INPUT_CLS} /></div>
                                <div><label className={LABEL}>{t("matches.scheduled_at")}<span className="ml-1 text-indigo-500">*</span></label>
                                    <div className="flex gap-1.5">
                                        <DatePicker value={date} onChange={setDate} />
                                        <TimePicker value={startTime} onChange={setStartTime} />
                                    </div>
                                </div>
                            </div>

                            <div><label className={LABEL}>{t("matches.match_url")}</label>
                                <input value={matchUrl} onChange={e => setMatchUrl(e.target.value)} placeholder="https://..." className={INPUT_CLS} /></div>

                            <div className="border-t border-neutral-800/60" />

                            <div>
                                <button type="button" onClick={() => setShowMatchOptions(v => !v)}
                                    className="w-full flex items-center justify-between text-[10px] font-semibold text-neutral-600 hover:text-neutral-400 uppercase tracking-wider py-1 transition-colors">
                                    {t("matches.more_options")}
                                    <ChevronDown className={cn("w-3 h-3 transition-transform", showMatchOptions && "rotate-180")} />
                                </button>
                                {showMatchOptions && (
                                    <div className="mt-3 space-y-3">
                                        <div><label className={LABEL}>{t("matches.notes")}</label>
                                            <textarea value={matchNotes} onChange={e => setMatchNotes(e.target.value)} placeholder={t("matches.notes_placeholder")} rows={2} className={cn(INPUT_CLS, "h-auto py-2 resize-none")} /></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── COMPETITION manual form ─────────────────────────────── */}
                    {isFormStep && isCompetition && createMode !== "faceit" && (
                        <div className="p-5 space-y-4">
                            <div><label className={LABEL}>{t("competitions.name")}<span className="ml-1 text-indigo-500">*</span></label>
                                <input value={compName} onChange={e => setCompName(e.target.value)} placeholder={t("competitions.name_placeholder")} autoFocus className={INPUT_CLS} /></div>

                            <div>
                                <label className={LABEL}>{t("competitions.type")}</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {COMPETITION_TYPES.map(ct => (
                                        <button key={ct} type="button" onClick={() => setCompType(ct)}
                                            className={cn("px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors", chip(compType === ct))}>{t(`competitions.type_${ct.toLowerCase()}`)}</button>
                                    ))}
                                </div>
                            </div>

                            <div><label className={LABEL}>{t("competitions.stage")}</label>
                                <input value={compStage} onChange={e => setCompStage(e.target.value)} placeholder="Regular Season, Playoff…" className={INPUT_CLS} /></div>

                            <div className="grid grid-cols-2 gap-2">
                                <div><label className={LABEL}>{t("competitions.start_date")}</label>
                                    <DatePicker value={compStartDate} onChange={setCompStartDate} /></div>
                                <div><label className={LABEL}>{t("competitions.end_date")}</label>
                                    <DatePicker value={compEndDate} onChange={setCompEndDate} /></div>
                            </div>

                            <div>
                                <button type="button" onClick={() => setShowCompOptions(v => !v)}
                                    className="w-full flex items-center justify-between text-[10px] font-semibold text-neutral-600 hover:text-neutral-400 uppercase tracking-wider py-1 transition-colors">
                                    {t("competitions.more_options")}
                                    <ChevronDown className={cn("w-3 h-3 transition-transform", showCompOptions && "rotate-180")} />
                                </button>
                                {showCompOptions && (
                                    <div className="mt-3 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><label className={LABEL}>{t("competitions.format")}</label>
                                                <input value={compFormat} onChange={e => setCompFormat(e.target.value)} placeholder="Swiss BO3, Double Elim…" className={INPUT_CLS} /></div>
                                            <div><label className={LABEL}>{t("competitions.cashprize")}</label>
                                                <input value={compCashprize} onChange={e => setCompCashprize(e.target.value)} placeholder="5 000€" className={INPUT_CLS} /></div>
                                        </div>
                                        <div><label className={LABEL}>{t("competitions.url")}</label>
                                            <input value={compUrl} onChange={e => setCompUrl(e.target.value)} placeholder="https://…" className={INPUT_CLS} /></div>
                                        <div><label className={LABEL}>{t("competitions.notes")}</label>
                                            <textarea rows={2} value={compNotes} onChange={e => setCompNotes(e.target.value)} className={cn(INPUT_CLS, "h-auto py-2 resize-none")} /></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── FACEIT import form (Match or Competition) ───────────── */}
                    {isFormStep && (isMatch || isCompetition) && createMode === "faceit" && (
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-2.5 mb-2">
                                <FaceitIcon className="w-5 h-5 text-orange-400" />
                                <span className="text-sm font-semibold text-white">{isMatch ? t("matches.import_faceit") : t("competitions.import_faceit")}</span>
                            </div>
                            <p className="text-xs text-neutral-500 leading-relaxed">
                                {isMatch ? t("matches.import_faceit_info") : t("competitions.import_faceit_info")}
                            </p>
                            <div className="flex gap-2">
                                <input value={faceitUrl} onChange={e => setFaceitUrl(e.target.value)}
                                    placeholder={t("faceit.discover_placeholder")}
                                    className={cn(INPUT_CLS, "flex-1")}
                                    autoFocus
                                    onKeyDown={e => e.key === "Enter" && handleFaceitImport()} />
                                <button onClick={handleFaceitImport} disabled={isImporting || !faceitUrl.trim()}
                                    className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0">
                                    {isImporting && <Loader className="w-3.5 h-3.5 animate-spin" />}
                                    {t("common.import")}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── AVAILABILITY form ────────────────────────────────── */}
                    {isFormStep && isAvailability && (
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                <div><label className={LABEL}>{t("agenda.field_date")}<span className="ml-1 text-indigo-500">*</span></label>
                                    <DatePicker value={date} onChange={setDate} /></div>
                                <div><label className={LABEL}>{t("agenda.field_start")}</label>
                                    <TimePicker value={availStartTime} onChange={setAvailStartTime} /></div>
                                <div><label className={LABEL}>{t("agenda.field_end")}</label>
                                    <TimePicker value={availEndTime} onChange={setAvailEndTime} /></div>
                            </div>
                            <div><label className={LABEL}>{t("agenda.field_reason")}</label>
                                <input value={reason} onChange={e => setReason(e.target.value)} placeholder={t("agenda.reason_placeholder")} className={INPUT_CLS} /></div>
                            <Toggle checked={recurring} onChange={setRecurring} label={t("agenda.recurring_label")} />
                            {recurring && (
                                <div className="space-y-3 pl-1">
                                    <div>
                                        <label className={LABEL}>{t("agenda.recurring_days")}</label>
                                        <div className="flex gap-1">
                                            {DAYS_OF_WEEK.map(d => (
                                                <button key={d.key} type="button" onClick={() => setSelectedDays(prev => prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key])}
                                                    className={cn("w-8 h-8 rounded-lg text-[10px] font-bold border transition-colors",
                                                        selectedDays.includes(d.key) ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" : "text-neutral-500 border-neutral-700/50 hover:text-neutral-300")}>{d.short}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-neutral-400">{t("agenda.recurring_for")}</label>
                                        <input type="number" min={1} max={52} value={recurWeeks} onChange={e => setRecurWeeks(parseInt(e.target.value) || 1)} className={cn(INPUT_CLS, "w-14 text-center")} />
                                        <span className="text-xs text-neutral-500">{t("agenda.weeks")}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Other event forms ────────────────────────────────── */}
                    {isFormStep && isEventType && (
                        <div className="p-5 space-y-4">
                            {type === "STRAT_TIME" && (<>
                                <div className="grid grid-cols-3 gap-2">
                                    <div><label className={LABEL}>{t("agenda.field_date")}<span className="ml-1 text-indigo-500">*</span></label><DatePicker value={date} onChange={setDate} /></div>
                                    <div><label className={LABEL}>{t("agenda.field_start")}</label><TimePicker value={startTime} onChange={setStartTime} /></div>
                                    <div><label className={LABEL}>{t("agenda.field_end")}</label><TimePicker value={endTime} onChange={setEndTime} /></div>
                                </div>
                                <div><label className={LABEL}>{t("agenda.strat_maps")}</label>
                                    <div className="flex flex-wrap gap-1.5">{gameMaps.map(m => {
                                        const active = stratMaps.includes(m.value);
                                        return (<button key={m.value} type="button" onClick={() => setStratMaps(prev => active ? prev.filter(v => v !== m.value) : [...prev, m.value])}
                                            className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors", active ? "bg-purple-500/15 text-purple-300 border-purple-500/30" : TYPE_INACTIVE)}>{m.label}</button>);
                                    })}</div>
                                </div>
                                <StratPicker teamId={teamId} selectedMaps={stratMaps} selectedIds={selectedStratIds} onChange={setSelectedStratIds} />
                                <div><label className={LABEL}>{t("agenda.strat_objectives")}</label><textarea value={stratObjectives} onChange={e => setStratObjectives(e.target.value)} placeholder={t("agenda.strat_objectives_placeholder")} rows={2} className={cn(INPUT_CLS, "h-auto py-2 resize-none")} /></div>
                                <div><label className={LABEL}>{t("agenda.field_link")}</label><input value={link} onChange={e => setLink(e.target.value)} placeholder={t("agenda.link_placeholder")} className={INPUT_CLS} /></div>
                            </>)}
                            {type === "MEETING" && (<>
                                <div><label className={LABEL}>{t("agenda.field_title")}<span className="ml-1 text-indigo-500">*</span></label><input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("agenda.meeting_placeholder")} autoFocus className={INPUT_CLS} /></div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div><label className={LABEL}>{t("agenda.field_date")}<span className="ml-1 text-indigo-500">*</span></label><DatePicker value={date} onChange={setDate} /></div>
                                    <div><label className={LABEL}>{t("agenda.field_start")}</label><TimePicker value={startTime} onChange={setStartTime} /></div>
                                    <div><label className={LABEL}>{t("agenda.field_end")}</label><TimePicker value={endTime} onChange={setEndTime} /></div>
                                </div>
                                <div><label className={LABEL}>{t("agenda.field_description")}</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("agenda.description_placeholder")} rows={2} className={cn(INPUT_CLS, "h-auto py-2 resize-none")} /></div>
                                <div><label className={LABEL}>{t("agenda.field_link")}</label><input value={link} onChange={e => setLink(e.target.value)} placeholder={t("agenda.link_placeholder")} className={INPUT_CLS} /></div>
                                <ParticipantSelector members={members} selected={participantIds} onChange={setParticipantIds} />
                            </>)}
                            {type === "REST" && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className={LABEL}>{t("agenda.break_start")}<span className="ml-1 text-indigo-500">*</span></label><DatePicker value={date} onChange={d => { setDate(d); if (!endDate) setEndDate(d); }} /></div>
                                    <div><label className={LABEL}>{t("agenda.break_end")}</label><DatePicker value={endDate} onChange={setEndDate} /></div>
                                </div>
                            )}
                            {type === "BREAK" && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div><label className={LABEL}>{t("agenda.field_date")}<span className="ml-1 text-indigo-500">*</span></label><DatePicker value={date} onChange={setDate} /></div>
                                    <div><label className={LABEL}>{t("agenda.field_start")}</label><TimePicker value={startTime} onChange={setStartTime} /></div>
                                    <div><label className={LABEL}>{t("agenda.field_end")}</label><TimePicker value={endTime} onChange={setEndTime} /></div>
                                </div>
                            )}
                            {type === "CUSTOM" && (<>
                                <div><label className={LABEL}>{t("agenda.field_title")}<span className="ml-1 text-indigo-500">*</span></label><input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("agenda.custom_placeholder")} autoFocus className={INPUT_CLS} /></div>
                                {isDateRange ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className={LABEL}>{t("agenda.break_start")}<span className="ml-1 text-indigo-500">*</span></label><DatePicker value={date} onChange={d => { setDate(d); if (!endDate) setEndDate(d); }} /></div>
                                        <div><label className={LABEL}>{t("agenda.break_end")}</label><DatePicker value={endDate} onChange={setEndDate} /></div>
                                    </div>
                                ) : (
                                    <div><label className={LABEL}>{t("agenda.field_date")}<span className="ml-1 text-indigo-500">*</span></label><DatePicker value={date} onChange={setDate} /></div>
                                )}
                                {showAllDayToggle && <Toggle checked={allDay} onChange={setAllDay} label={t("agenda.all_day")} />}
                                {showTimePickers && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className={LABEL}>{t("agenda.field_start")}</label><TimePicker value={startTime} onChange={setStartTime} /></div>
                                        <div><label className={LABEL}>{t("agenda.field_end")}</label><TimePicker value={endTime} onChange={setEndTime} /></div>
                                    </div>
                                )}
                                <div><label className={LABEL}>{t("agenda.field_description")}</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("agenda.description_placeholder")} rows={2} className={cn(INPUT_CLS, "h-auto py-2 resize-none")} /></div>
                                {showLink && (<div><label className={LABEL}>{t("agenda.field_link")}</label><input value={link} onChange={e => setLink(e.target.value)} placeholder={t("agenda.link_placeholder")} className={INPUT_CLS} /></div>)}
                                <ParticipantSelector members={members} selected={participantIds} onChange={setParticipantIds} />
                            </>)}
                            {showRecurrence && type && (
                                <div className="flex items-center gap-3">
                                    <Toggle checked={breakRecurrence} onChange={setBreakRecurrence} label={t("agenda.repeat_weekly")} />
                                    {breakRecurrence && (<div className="flex items-center gap-1.5">
                                        <input type="number" min={1} max={52} value={breakWeeks} onChange={e => setBreakWeeks(parseInt(e.target.value) || 1)} className={cn(INPUT_CLS, "w-14 text-center")} />
                                        <span className="text-xs text-neutral-500">{t("agenda.weeks")}</span>
                                    </div>)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 shrink-0">
                        <button onClick={handleBack} disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" />{t("common.back")}
                        </button>
                        {isFormStep && createMode !== "faceit" ? (
                            <button onClick={handleSave} disabled={!canSave || isSaving}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors">
                                {isSaving && <Loader className="w-3.5 h-3.5 animate-spin" />}{t("common.create")}
                            </button>
                        ) : <span />}
                    </div>
                )}
            </div>
        </div>
    );
}
