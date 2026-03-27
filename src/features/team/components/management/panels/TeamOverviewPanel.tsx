import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { Team, TeamMember, TeamMembership } from "@/contexts/team/team.types";
import type { ConflictSummaryDto } from "@/api/types/agenda";
import type { CompetitionSummaryDto } from "@/api/types/competition";
import { calculateAverageAge, formatDateShort } from "@/shared/utils/dateUtils";
import { NationalityBadge } from "@/shared/components/NationalityBadge";
import { useMatchSummary } from "@/features/match/hooks/useMatchSummary";
import { useMySchedule } from "@/features/agenda/hooks/useMySchedule";
import { getConflicts } from "@/api/endpoints/agenda.api";
import { getActiveCompetitions } from "@/api/endpoints/competition.api";
import { getStrats } from "@/api/endpoints/stratbook.api";
import {
  Users, UserCog, Crown, CheckCircle2, Calendar, AlertCircle, ArrowRight, Clock,
  Swords, Trophy, BookOpen, AlertTriangle, Gamepad2,
} from "lucide-react";
import FaceitIcon from "@/shared/components/FaceitIcon";
import { useCountdown } from "@/shared/hooks/useCountdown";

interface Props {
  team: Team; membership: TeamMembership; members: TeamMember[];
  staffCount: number; playerCount: number; onNavigateToFaceit?: () => void;
}

function countdownColor(urgency: string): string {
  if (urgency === "high") return "text-amber-400 bg-amber-400/10 border-amber-400/20";
  if (urgency === "medium") return "text-blue-400 bg-blue-400/10 border-blue-400/20";
  return "text-neutral-400 bg-neutral-800/60 border-neutral-700/30";
}

function fmtDt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" }) + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const DOT: Record<string, string> = { MATCH: "bg-blue-500", MEETING: "bg-emerald-500", STRAT_TIME: "bg-yellow-500", BREAK: "bg-teal-500", CUSTOM: "bg-neutral-500" };

export default function TeamOverviewPanel({ team, membership, members, staffCount, playerCount, onNavigateToFaceit }: Props) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const go = (p: string) => nav(`/team/${team.id}/${p}`);

  const owner = members.find(m => m.isOwner);
  const avgAge = calculateAverageAge(members.filter(m => m.role === "PLAYER"));
  const est = team.createdAt ? formatDateShort(team.createdAt) : null;

  const { nextMatch, toCompleteCount, summary } = useMatchSummary(team.id);
  const nextMatchCountdown = useCountdown(nextMatch?.scheduledAt ?? null, t);
  const { events: sched } = useMySchedule(String(team.id));

  const [rawConflicts, setRawConflicts] = useState<ConflictSummaryDto[]>([]);
  const conflictCount = useMemo(() => {
    const seen = new Set<string>();
    for (const c of rawConflicts) {
      if (c.conflictType === "EVENT_OVERLAP") {
        const lo = Math.min(c.eventId, c.sourceId);
        const hi = Math.max(c.eventId, c.sourceId);
        seen.add(`overlap:${lo}:${hi}`);
      } else {
        seen.add(`unavail:${c.id}`);
      }
    }
    return seen.size;
  }, [rawConflicts]);
  const [comps, setComps] = useState<CompetitionSummaryDto[]>([]);
  const [stratCount, setStratCount] = useState(0);

  useEffect(() => {
    const id = String(team.id);
    getConflicts(id).then(setRawConflicts).catch(() => {});
    getActiveCompetitions(id).then(setComps).catch(() => {});
    getStrats(id, { map: "", side: "", type: "", status: "", difficulty: "", search: "", tag: "", favoritesOnly: false }, 0, 1)
      .then(r => setStratCount(r.totalElements)).catch(() => {});
  }, [team.id]);

  const done = summary?.completed ?? [];
  const wins = done.filter(m => m.result === "WIN").length;
  const losses = done.filter(m => m.result === "LOSE").length;
  const draws = done.length - wins - losses;
  const wr = done.length > 0 ? Math.round((wins / done.length) * 100) : null;

  const upcoming = sched.filter(e => e.type !== "COMPETITION" && e.type !== "REST").slice(0, 4);

  return (
    <div className="grid grid-cols-12 gap-2.5">

      {/* ── Record ── 8 cols */}
      <div className="col-span-8 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center gap-1.5 text-neutral-500 mb-3">
          <Swords className="w-4 h-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">{t("management.record")}</span>
        </div>
        <div className="flex items-end gap-6 mb-3">
          <div>
            <p className="text-4xl font-black text-white tabular-nums leading-none">{wr ?? 0}<span className="text-lg text-neutral-600 font-bold">%</span></p>
            <p className="text-[10px] text-neutral-600 mt-1">{t("management.win_rate")}</p>
          </div>
          <div className="flex items-end gap-4 mb-0.5">
            <div><p className="text-lg font-bold text-emerald-400 tabular-nums leading-none">{wins}</p><p className="text-[9px] text-emerald-600 mt-0.5">WIN</p></div>
            <div><p className="text-lg font-bold text-red-400 tabular-nums leading-none">{losses}</p><p className="text-[9px] text-red-600 mt-0.5">LOSE</p></div>
            <div><p className="text-lg font-bold text-neutral-500 tabular-nums leading-none">{draws}</p><p className="text-[9px] text-neutral-700 mt-0.5">DRAW</p></div>
          </div>
        </div>
        {done.length > 0 && (
          <div>
            <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
              {wins > 0 && <div className="bg-emerald-500 rounded-full" style={{ flex: wins }} />}
              {draws > 0 && <div className="bg-neutral-600 rounded-full" style={{ flex: draws }} />}
              {losses > 0 && <div className="bg-red-500 rounded-full" style={{ flex: losses }} />}
            </div>
            <p className="text-[10px] text-neutral-700 mt-1 text-right tabular-nums">{done.length} played</p>
          </div>
        )}
      </div>

      {/* ── Next match ── 4 cols */}
      {nextMatch ? (
          <button onClick={() => go("matches?tab=upcoming")} className="col-span-4 group text-left bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{t("management.next_match")}</span>
              <ArrowRight className="w-3 h-3 text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-base font-bold text-white truncate mb-1">vs {nextMatch.opponentName ?? t("matches.tba")}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-2">
              <Clock className="w-3 h-3" /><span>{fmtDt(nextMatch.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400">{nextMatch.format}</span>
              {nextMatchCountdown && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${countdownColor(nextMatchCountdown.urgency)} ${nextMatchCountdown.isLive ? "font-mono tabular-nums" : ""}`}>
                  {nextMatchCountdown.label}
                </span>
              )}
            </div>
          </button>
        ) : (
        <div className="col-span-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center">
          <Calendar className="w-4 h-4 text-neutral-800 mb-1.5" />
          <p className="text-[11px] text-neutral-700">{t("management.no_upcoming_match")}</p>
        </div>
      )}

      {/* ── Middle row: Alert + Role + FACEIT ── 4+4+4 */}
      {/* Alert / Status */}
      {toCompleteCount > 0 ? (
        <button onClick={() => go("matches?tab=to_complete")} className="col-span-4 text-left bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 rounded-xl p-3.5 transition-all">
          <div className="flex items-center gap-1.5 text-amber-500/70 mb-1.5">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t("management.to_complete")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-amber-400 tabular-nums">{toCompleteCount}</span>
            <span className="text-xs text-amber-600">{t("management.to_complete_hint", { count: toCompleteCount })}</span>
          </div>
        </button>
      ) : (
        <div className="col-span-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-emerald-500/60 mb-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t("management.up_to_date")}</span>
          </div>
          <p className="text-xs text-emerald-700/70">{t("management.up_to_date_hint")}</p>
        </div>
      )}

      {/* Role */}
      <div className="col-span-4 bg-gradient-to-br from-indigo-500/[0.06] to-purple-500/[0.06] border border-indigo-500/15 rounded-xl p-3.5">
        <p className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{t("management.your_role")}</p>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {membership.isOwner && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium">
              <Crown className="w-3 h-3" /> Owner
            </span>
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-medium">{membership.role}</span>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed">
          {membership.isOwner ? t("management.owner_description") : membership.role === "MANAGER" ? t("management.manager_description") : t("management.member_description")}
        </p>
      </div>

      {/* FACEIT */}
      {onNavigateToFaceit && team.game === "CS2" ? (() => {
        const stored = sessionStorage.getItem(`tw.faceit.lastSync.${team.id}`);
        const lastSync = stored ? new Date(stored) : null;
        const linked = members.filter(m => m.role === "PLAYER" && m.activePlayer !== false && m.faceitNickname != null).length;
        return (
          <button onClick={onNavigateToFaceit} className="col-span-4 group text-left bg-orange-500/[0.03] border border-orange-500/15 hover:border-orange-500/25 rounded-xl p-3.5 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-orange-500/70">
                <FaceitIcon className="w-4 h-4" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">{t("management.faceit_sync")}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-orange-700/40 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-neutral-400">{t("management.faceit_linked_count", { count: linked })}</p>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              {lastSync ? t("faceit.last_sync_full", { date: new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(lastSync) }) : t("management.faceit_never_synced")}
            </p>
          </button>
        );
      })() : (
        <div className="col-span-4 bg-neutral-900/50 border border-neutral-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-neutral-600 mb-1.5">
            <FaceitIcon className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t("management.faceit_sync")}</span>
          </div>
          <p className="text-xs text-neutral-600">{t("management.faceit_not_available")}</p>
        </div>
      )}

      {/* ── Team info ── 5 cols */}
      <div className="col-span-5 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center gap-1.5 text-neutral-500 mb-3">
          <Users className="w-4 h-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">{t("management.team_information")}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <MiniStat icon={Users} value={members.length} label={t("management.total_members")} color="text-blue-400" />
          <MiniStat icon={UserCog} value={staffCount} label={t("management.staff_members")} color="text-purple-400" />
          <MiniStat icon={Gamepad2} value={playerCount} label={t("management.players")} color="text-green-400" />
          <MiniStat icon={BookOpen} value={stratCount} label={t("management.strats_count")} color="text-indigo-400" />
        </div>
        <div className="space-y-2">
          <Row label={t("management.owner")} value={owner ? <span className="flex items-center gap-1.5"><Crown className="w-3.5 h-3.5 text-amber-400" />{owner.customUsername ?? owner.nickname}</span> : "—"} />
          <Row label={t("management.game")} value={team.game} />
          {team.tag && <Row label={t("management.team_tag")} value={<span className="px-2 py-0.5 bg-neutral-800 rounded text-[11px] font-bold text-neutral-300 border border-neutral-700">{team.tag}</span>} />}
          {est && <Row label={t("team.established")} value={est} />}
          {avgAge && <Row label={t("team.average_age")} value={avgAge} />}
          {team.nationality && <Row label={t("team.nationality")} value={<NationalityBadge nationality={team.nationality} size="sm" />} />}
          <Row label={t("management.profiles_completed")} value={
            <span>{members.filter(m => m.profileCompleted).length}/{members.length}</span>
          } />
        </div>
      </div>

      {/* ── Competitions + Conflicts ── 4 cols stacked */}
      <div className="col-span-4 flex flex-col gap-2.5 self-start">
        <button onClick={() => go("competitions")} className="group text-left bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <Trophy className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">{t("management.active_competitions")}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          {comps.length > 0 ? (
            <div className="space-y-2">
              {comps.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm text-neutral-200 font-medium truncate">{c.name}</span>
                </div>
              ))}
              {comps.length > 3 && <p className="text-xs text-neutral-600 pl-3.5">+{comps.length - 3} {t("common.more")}</p>}
            </div>
          ) : (
            <p className="text-xs text-neutral-600">{t("competitions.empty_active")}</p>
          )}
        </button>

        {conflictCount > 0 ? (
          <button onClick={() => go("agenda")} className="group text-left bg-orange-500/5 border border-orange-500/20 hover:border-orange-500/30 rounded-2xl p-4 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-orange-500/70">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">{t("management.scheduling_conflicts")}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-orange-700/40 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-center gap-2.5">
              <p className="text-2xl font-black text-orange-400 tabular-nums">{conflictCount}</p>
              <p className="text-xs text-orange-600 leading-snug">{t("management.conflicts_hint")}</p>
            </div>
          </button>
        ) : (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-neutral-600 mb-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">{t("management.scheduling_conflicts")}</span>
            </div>
            <p className="text-xs text-neutral-600">{t("management.no_conflicts")}</p>
          </div>
        )}

      </div>

      {/* ── Schedule ── 3 cols */}
      <button onClick={() => go("agenda")} className="col-span-3 group text-left bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 transition-all self-start">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <Calendar className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t("management.upcoming_schedule")}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all" />
        </div>
        {upcoming.length > 0 ? (
          <div className="space-y-2.5">
            {upcoming.slice(0, 3).map(ev => (
              <div key={ev.id} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${DOT[ev.type] ?? "bg-neutral-500"}`} />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-300 font-medium truncate">{ev.match?.opponentName ? `vs ${ev.match.opponentName}` : ev.title}</p>
                  <p className="text-[11px] text-neutral-600 tabular-nums">{fmtDt(ev.startAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-600">{t("agenda.no_upcoming")}</p>
        )}
      </button>

    </div>
  );
}

function MiniStat({ icon: Icon, value, label, color }: { icon: React.ElementType; value: number | string; label: string; color: string }) {
  return (
    <div className="bg-neutral-800/40 rounded-xl p-3 text-center">
      <Icon className={`w-4 h-4 ${color} mx-auto mb-2`} />
      <p className="text-xl font-bold text-white tabular-nums leading-none">{value}</p>
      <p className="text-[10px] text-neutral-500 mt-1.5 leading-tight truncate">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-neutral-500 text-sm">{label}</span>
      <span className="text-white font-medium text-sm">{value}</span>
    </div>
  );
}
