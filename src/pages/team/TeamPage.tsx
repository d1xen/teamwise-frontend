import { useTeam } from '@/contexts/team/useTeam';
import { TeamHeader, TeamRosterSection } from '@/features/team/components';
import FeatureBody from '@/shared/components/FeatureBody';
import InlineLoader from '@/shared/components/InlineLoader';
import { useMinimumLoader } from '@/shared/hooks/useMinimumLoader';

export default function TeamPage() {
  const { team, membership, members, isLoading } = useTeam();
  const showLoader = useMinimumLoader(isLoading || !team || !membership, 800);

  if (showLoader) {
    return (
      <div className="flex items-center justify-center h-full">
        <InlineLoader />
      </div>
    );
  }

  const activeRoster = members
    .filter((m) => m.role === 'PLAYER' && m.activePlayer !== false)
    .sort((a, b) => {
      if (a.inGameRole === 'IGL' && b.inGameRole !== 'IGL') return -1;
      if (b.inGameRole === 'IGL' && a.inGameRole !== 'IGL') return 1;
      return (a.customUsername || a.nickname).localeCompare(b.customUsername || b.nickname);
    });

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
          <TeamRosterSection activeRoster={activeRoster} staffMembers={staffMembers} />
        </FeatureBody>
      </div>
    </div>
  );
}
