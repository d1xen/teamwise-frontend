import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { Team, TeamMember, TeamMembership } from "@/contexts/team/team.types";
import { calculateAverageAge, formatDateShort } from "@/shared/utils/dateUtils";
import { NationalityBadge } from "@/shared/components/NationalityBadge";
import { useMatchSummary } from "@/features/match/hooks/useMatchSummary";
import {
  Users,
  Shield,
  Crown,
  TrendingUp,
  CheckCircle,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ArrowRight,
  Clock,
  Swords,
} from "lucide-react";

interface TeamOverviewPanelProps {
  team: Team;
  membership: TeamMembership;
  members: TeamMember[];
  staffCount: number;
  playerCount: number;
}

function formatTimeUntil(iso: string): { label: string; urgency: "high" | "medium" | "low" } {
  const diff = new Date(iso).getTime() - Date.now();
  const totalHours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  const days = Math.floor(totalHours / 24);
  if (totalHours === 0) return { label: "< 1h", urgency: "high" };
  if (totalHours < 24) return { label: `${totalHours}h`, urgency: "high" };
  if (days < 7)        return { label: `${days}j`, urgency: "medium" };
  return                      { label: `${days}j`, urgency: "low" };
}

function formatMatchDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" })
    + " · "
    + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function TeamOverviewPanel({
  team,
  membership,
  members,
  staffCount,
  playerCount,
}: TeamOverviewPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const owner = members.find((m) => m.isOwner);
  const averageAge = calculateAverageAge(members.filter((m) => m.role === "PLAYER"));
  const establishedDate = team.createdAt ? formatDateShort(team.createdAt) : null;
  const verifiedProfiles = team.membersOverview?.verifiedProfilesCount ?? 0;
  const totalMembersFromOverview = team.membersOverview?.totalMembers ?? members.length;

  const { nextMatch, toCompleteCount, completedCount, hasData } = useMatchSummary(team.id);

  const goToMatches = (tab?: string) =>
    navigate(`/team/${team.id}/matches${tab ? `?tab=${tab}` : ""}`);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">
          {t("management.overview")}
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          {t("management.overview_subtitle")}
        </p>
      </div>

      {/* Stats strip — 5 cards in a single row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard icon={Users}       label={t("management.total_members")} value={members.length}    color="text-blue-400"   />
        <StatCard icon={Shield}      label={t("management.staff_members")} value={staffCount}        color="text-purple-400" />
        <StatCard icon={TrendingUp}  label={t("management.players")}       value={playerCount}       color="text-green-400"  />
        <StatCard icon={CheckCircle} label={t("profile.verified")}         value={verifiedProfiles}  color="text-teal-400"   subtitle={`/ ${totalMembersFromOverview}`} />
        <StatCard icon={Swords}      label={t("management.matches_played")} value={completedCount}   color="text-orange-400" />
      </div>

      {/* Main grid — equal split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Team info */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-2.5">
            {t("management.team_information")}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <InfoCell label={t("management.team_name")} value={team.name} />
            <InfoCell label={t("management.team_tag")}  value={team.tag} />
            <InfoCell label={t("management.game")}      value={team.game} />
            {owner && (
              <InfoCell
                label={t("management.owner")}
                value={
                  <div className="flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    <span className="truncate">{owner.customUsername ?? owner.nickname}</span>
                  </div>
                }
              />
            )}
            {establishedDate && (
              <InfoCell label={t("team.established")} value={establishedDate} />
            )}
            {averageAge && (
              <InfoCell label={t("team.average_age")} value={averageAge} />
            )}
            {team.nationality && (
              <div className="col-span-2 flex items-center justify-between py-1 border-t border-neutral-800/50 mt-0.5">
                <span className="text-neutral-500">{t("team.nationality")}</span>
                <NationalityBadge nationality={team.nationality} size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3">

          {/* Your Role */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4">
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-3">
              {t("management.your_role")}
            </p>
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              {membership.isOwner && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
                  <Crown className="w-3.5 h-3.5" />
                  Owner
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-medium">
                {membership.role}
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {membership.isOwner
                ? t("management.owner_description")
                : membership.role === "MANAGER"
                  ? t("management.manager_description")
                  : t("management.member_description")}
            </p>
          </div>

          {/* Next match */}
          {nextMatch && (() => {
            const { label, urgency } = formatTimeUntil(nextMatch.scheduledAt);
            const urgencyClass = urgency === "high"
              ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
              : urgency === "medium"
              ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
              : "text-neutral-400 bg-neutral-800/60 border-neutral-700/30";
            return (
              <button
                onClick={() => goToMatches()}
                className="group text-left bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">{t("management.next_match")}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all duration-150" />
                </div>
                <p className="text-sm font-semibold text-white truncate mb-2">
                  {t("matches.vs")} {nextMatch.opponentName ?? t("matches.tba")}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatMatchDate(nextMatch.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400">
                      {nextMatch.format}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${urgencyClass}`}>
                      {label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })()}

          {/* To complete / Up to date */}
          {toCompleteCount > 0 ? (
            <button
              onClick={() => goToMatches("to_complete")}
              className="group text-left bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/10 rounded-2xl p-4 transition-all duration-150"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-amber-500/70">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{t("management.to_complete")}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-700/50 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all duration-150" />
              </div>
              <p className="text-2xl font-black text-amber-400 tabular-nums mb-1">{toCompleteCount}</p>
              <p className="text-xs text-amber-600">
                {t("management.to_complete_hint", { count: toCompleteCount })}
              </p>
            </button>
          ) : hasData && (
            <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-500/60 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-400/80">{t("management.up_to_date")}</p>
                <p className="text-[11px] text-emerald-700/70 mt-0.5 leading-snug">{t("management.up_to_date_hint")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2 truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
            {subtitle && <p className="text-xs text-neutral-600">{subtitle}</p>}
          </div>
        </div>
        <div className={`p-2 rounded-lg bg-neutral-800/80 ${color} flex-shrink-0 ml-2`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-1 border-t border-neutral-800/50">
      <span className="text-neutral-500">{label}</span>
      <span className="text-white font-medium truncate">{value}</span>
    </div>
  );
}
