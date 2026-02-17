import { useTranslation } from 'react-i18next';
import { useTeam } from '@/contexts/team/useTeam';
import { TeamHeader, TeamRosterSection } from '@/features/team/components';
import FeatureBody from '@/shared/components/FeatureBody';
import { useMinimumLoader } from '@/shared/hooks/useMinimumLoader';

/**
 * TeamPage Premium - Page vitrine ultra professionnelle
 *
 * Architecture:
 * - Composants dédiés et réutilisables
 * - Design ultra-premium gaming
 * - Style unique inspiré HLTV + Notion + Design moderne
 * - Responsive et performant
 */
export default function TeamPage() {
  const { t } = useTranslation();
  const { team, membership, members, isLoading } = useTeam();
  const showLoader = useMinimumLoader(isLoading || !team || !membership, 800);

  if (showLoader) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-neutral-700 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-neutral-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const staffMembers = members.filter((m) => m.role !== 'PLAYER');
  const playerMembers = members.filter((m) => m.role === 'PLAYER');

  return (
    <div className="flex flex-col h-full bg-neutral-950">

      {/* Hero Header Premium */}
      <TeamHeader team={team} />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
        <FeatureBody>
          {/* Roster Section */}
          <TeamRosterSection
            playerMembers={playerMembers}
            staffMembers={staffMembers}
          />
        </FeatureBody>
      </div>
    </div>
  );
}
