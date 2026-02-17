import { useTranslation } from 'react-i18next';
import { Users, Shield } from 'lucide-react';
import type { TeamMember } from '@/contexts/team/team.types';
import { PlayerCard } from './PlayerCard';
import { StaffCard } from './StaffCard';

interface TeamRosterSectionProps {
  playerMembers: TeamMember[];
  staffMembers: TeamMember[];
}

/**
 * TeamRosterSection - Section roster complète
 *
 * Design:
 * - Section Players avec grid responsive
 * - Section Staff avec grid responsive
 * - Headers avec icônes et compteurs
 * - Spacing premium
 */
export function TeamRosterSection({ playerMembers, staffMembers }: TeamRosterSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">

      {/* Section PLAYERS */}
      {playerMembers.length > 0 && (
        <section>
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {t('team.roster')}
              </h2>
              <p className="text-sm text-neutral-500 font-medium">
                {playerMembers.length} {playerMembers.length > 1 ? t('team.players') : t('team.player')}
              </p>
            </div>
          </div>

          {/* Grid Players - 5 par ligne sur grands écrans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {playerMembers.map((member) => (
              <PlayerCard key={member.steamId} member={member} />
            ))}
          </div>
        </section>
      )}

      {/* Section STAFF */}
      {staffMembers.length > 0 && (
        <section>
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {t('team.staff')}
              </h2>
              <p className="text-sm text-neutral-500 font-medium">
                {staffMembers.length} {staffMembers.length > 1 ? t('team.staff_members') : t('team.staff_member')}
              </p>
            </div>
          </div>

          {/* Grid Staff - 5 par ligne sur grands écrans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {staffMembers.map((member) => (
              <StaffCard key={member.steamId} member={member} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state (si aucun membre) */}
      {playerMembers.length === 0 && staffMembers.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500 text-lg font-medium">
            {t('team.no_members')}
          </p>
        </div>
      )}
    </div>
  );
}
