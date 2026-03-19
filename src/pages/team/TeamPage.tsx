import { useTranslation } from 'react-i18next';
import { useTeam } from '@/contexts/team/useTeam';
import { TeamHeader, TeamRosterSection } from '@/features/team/components';
import FeatureBody from '@/shared/components/FeatureBody';
import { useMinimumLoader } from '@/shared/hooks/useMinimumLoader';

export default function TeamPage() {
  const { t } = useTranslation();
  const { team, membership, members, isLoading } = useTeam();
  const showLoader = useMinimumLoader(isLoading || !team || !membership, 800);

  if (showLoader) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-neutral-800 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Roster actif : joueurs PLAYER avec activePlayer !== false
  const activeRoster = members
    .filter((m) => m.role === 'PLAYER' && m.activePlayer !== false)
    .sort((a, b) => {
      // IGL en premier, puis alphabétique par pseudo
      if (a.inGameRole === 'IGL' && b.inGameRole !== 'IGL') return -1;
      if (b.inGameRole === 'IGL' && a.inGameRole !== 'IGL') return 1;
      return (a.customUsername || a.nickname).localeCompare(b.customUsername || b.nickname);
    });

  // Staff : tous les rôles non-PLAYER, triés par rôle puis pseudo
  const ROLE_ORDER = ['MANAGER', 'COACH', 'ANALYST'];
  const staffMembers = members
    .filter((m) => m.role !== 'PLAYER')
    .sort((a, b) => {
      const orderA = ROLE_ORDER.indexOf(a.role);
      const orderB = ROLE_ORDER.indexOf(b.role);
      if (orderA !== orderB) return orderA - orderB;
      return (a.customUsername || a.nickname).localeCompare(b.customUsername || b.nickname);
    });

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      <TeamHeader team={team!} />

      <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
        <FeatureBody className="max-w-5xl">
          <TeamRosterSection
            activeRoster={activeRoster}
            staffMembers={staffMembers}
          />
        </FeatureBody>
      </div>
    </div>
  );
}
