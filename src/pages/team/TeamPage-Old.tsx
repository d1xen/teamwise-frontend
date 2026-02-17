import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTeam } from '@/contexts/team/useTeam';
import { useAuth } from '@/contexts/auth/useAuth';
import { useManagementPermissions } from '@/features/team/hooks/useManagementPermissions';
import type { TeamMember } from '@/contexts/team/team.types';
import { Button } from '@/design-system/components';
import { Badge } from '@/design-system/components/Badge';
import {
  Settings,
  Crown,
  Users,
  Shield,
  ExternalLink,
} from 'lucide-react';

/**
 * TeamPage - Page de consultation pure (read-only)
 * Affichage vitrine de l'équipe, sans actions d'édition
 */
export default function TeamPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { team, membership, members, isLoading } = useTeam();

  // Appeler les hooks de manière inconditionnelle (règle React)
  const permissions = useManagementPermissions({
    currentSteamId: user?.steamId ?? '',
    membership: membership ?? { role: 'PLAYER', isOwner: false },
  });

  // Vérifier après les hooks
  if (isLoading || !team || !membership) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-400">{t('common.loading')}</p>
      </div>
    );
  }

  const staffMembers = members.filter((m) => m.role !== 'PLAYER');
  const playerMembers = members.filter((m) => m.role === 'PLAYER');
  const owner = members.find((m) => m.isOwner);

  const canManage = permissions.canEditTeam();

  return (
    <div className="flex flex-col h-full">
      {/* Inline Header */}
      <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm">
        <div className="px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">{team.name}</h1>
              <p className="text-sm text-neutral-400 mt-2">
                {members.length} membres • {playerMembers.length} joueurs • {staffMembers.length} staff
              </p>
            </div>

            {canManage && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/team/${team.id}/management`)}
              >
                <Settings className="w-4 h-4" />
                {t('management.team_settings')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
          {/* Team Info Card */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
            <div className="flex items-start gap-8">
              {/* Logo */}
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="w-24 h-24 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-neutral-800 flex items-center justify-center">
                  <span className="text-3xl font-bold text-neutral-400">
                    {team.name[0]}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                  {team.tag && (
                    <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-sm font-medium">
                      {team.tag}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {team.game && (
                    <div>
                      <span className="text-neutral-500">{t('team.game')}</span>
                      <p className="text-white font-medium mt-1">{team.game}</p>
                    </div>
                  )}
                  {owner && (
                    <div>
                      <span className="text-neutral-500">{t('management.owner')}</span>
                      <p className="text-white font-medium mt-1 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        {owner.nickname}
                      </p>
                    </div>
                  )}
                </div>

                {/* Links */}
                {(team.hltvUrl || team.faceitUrl || team.twitterUrl) && (
                  <div className="flex items-center gap-3 mt-4">
                    {team.hltvUrl && (
                      <a
                        href={team.hltvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        HLTV <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {team.faceitUrl && (
                      <a
                        href={team.faceitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        Faceit <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {team.twitterUrl && (
                      <a
                        href={team.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        Twitter <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Staff Section */}
          {staffMembers.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-neutral-400" />
                <h3 className="text-lg font-semibold text-white">
                  {t('management.staff')} ({staffMembers.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffMembers.map((member) => (
                  <MemberCard key={member.steamId} member={member} />
                ))}
              </div>
            </section>
          )}

          {/* Players Section */}
          {playerMembers.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-neutral-400" />
                <h3 className="text-lg font-semibold text-white">
                  {t('management.players')} ({playerMembers.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerMembers.map((member) => (
                  <MemberCard key={member.steamId} member={member} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// MemberCard Component (read-only version)
function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 transition-all duration-200 hover:border-neutral-700">
      <div className="flex items-start gap-3">
        <img
          src={member.avatarUrl}
          alt={member.nickname}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">
            {member.nickname}
          </h4>
          {(member.firstName || member.lastName) && (
            <p className="text-xs text-neutral-500 truncate">
              {member.firstName} {member.lastName}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {member.isOwner && (
              <Badge variant="OWNER" icon={<Crown className="w-3 h-3" />}>
                Owner
              </Badge>
            )}
            <Badge variant={member.role}>{member.role}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

