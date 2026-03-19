import { useTranslation } from 'react-i18next';
import type { TeamMember } from '@/contexts/team/team.types';
import { PlayerCard } from './PlayerCard';
import { StaffCard } from './StaffCard';

interface TeamRosterSectionProps {
  activeRoster: TeamMember[];
  staffMembers: TeamMember[];
}

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
          {label}
        </h2>
        <span className="text-xs font-bold text-neutral-700 tabular-nums">{count}</span>
      </div>
      <div className="flex-1 h-px bg-neutral-800" />
    </div>
  );
}

export function TeamRosterSection({ activeRoster, staffMembers }: TeamRosterSectionProps) {
  const { t } = useTranslation();

  const isEmpty = activeRoster.length === 0 && staffMembers.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-neutral-600">{t('management.no_members_found')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* Active Roster */}
      {activeRoster.length > 0 && (
        <section className="space-y-5">
          <SectionDivider label={t('team.roster')} count={activeRoster.length} />

          {/* Grid joueurs — 2 à 5 colonnes selon la place */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {activeRoster.map((member) => (
              <PlayerCard key={member.steamId} member={member} />
            ))}
          </div>
        </section>
      )}

      {/* Staff */}
      {staffMembers.length > 0 && (
        <section className="space-y-5">
          <SectionDivider label={t('team.staff')} count={staffMembers.length} />

          {/* Grid staff — 2 colonnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {staffMembers.map((member) => (
              <StaffCard key={member.steamId} member={member} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
