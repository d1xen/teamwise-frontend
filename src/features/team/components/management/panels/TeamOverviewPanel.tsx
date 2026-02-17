import { useTranslation } from "react-i18next";
import type { Team, TeamMember, TeamMembership } from "@/contexts/team/team.types";
import { calculateAverageAge, formatDateShort } from "@/shared/utils/dateUtils";
import {
  Users,
  Shield,
  Crown,
  TrendingUp,
} from "lucide-react";

interface TeamOverviewPanelProps {
  team: Team;
  membership: TeamMembership;
  members: TeamMember[];
  staffCount: number;
  playerCount: number;
}

export default function TeamOverviewPanel({
  team,
  membership,
  members,
  staffCount,
  playerCount,
}: TeamOverviewPanelProps) {
  const { t } = useTranslation();

  const owner = members.find((m) => m.isOwner);
  const averageAge = calculateAverageAge(members.filter((m) => m.role === "PLAYER"));
  const establishedDate = team.createdAt ? formatDateShort(team.createdAt) : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          {t("management.overview")}
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          {t("management.overview_subtitle")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label={t("management.total_members")}
          value={members.length}
          color="text-blue-400"
        />
        <StatCard
          icon={Shield}
          label={t("management.staff_members")}
          value={staffCount}
          color="text-purple-400"
        />
        <StatCard
          icon={TrendingUp}
          label={t("management.players")}
          value={playerCount}
          color="text-green-400"
        />
      </div>

      {/* Main Content - 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-6">
          {/* Team Info Card */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              {t("management.team_information")}
            </h3>
            <div className="space-y-3 text-sm">
              <InfoRow label={t("management.team_name")} value={team.name} />
              <InfoRow label={t("management.team_tag")} value={team.tag} />
              <InfoRow label={t("management.game")} value={team.game} />
              {establishedDate && (
                <InfoRow
                  label={t("team.established")}
                  value={establishedDate}
                />
              )}
              {averageAge && (
                <InfoRow
                  label={t("team.average_age")}
                  value={averageAge}
                />
              )}
              {owner && (
                <InfoRow
                  label={t("management.owner")}
                  value={
                    <div className="flex items-center gap-2">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>{owner.nickname}</span>
                    </div>
                  }
                />
              )}
            </div>
          </div>

          {/* Your Role Card */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-3">
              {t("management.your_role")}
            </h3>
            <div className="flex items-center gap-3">
              {membership.isOwner && (
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm font-medium">
                  <Crown className="w-4 h-4" />
                  Owner
                </span>
              )}
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm font-medium">
                {membership.role}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-3">
              {membership.isOwner
                ? t("management.owner_description")
                : membership.role === "MANAGER"
                  ? t("management.manager_description")
                  : t("management.member_description")}
            </p>
          </div>
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
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-neutral-800 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-neutral-500">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
