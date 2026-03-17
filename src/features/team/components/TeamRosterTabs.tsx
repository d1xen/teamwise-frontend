import type { ReactElement } from 'react';
import { Users, Shield } from 'lucide-react';
import HeaderTabs from '@/shared/components/HeaderTabs';

export type TeamRosterTabId = 'roster' | 'staff';

interface TeamRosterTabsProps {
  activeTab: TeamRosterTabId;
  onChange: (tab: TeamRosterTabId) => void;
  rosterCount: number;
  staffCount: number;
  rosterLabel: string;
  staffLabel: string;
}

export default function TeamRosterTabs({
  activeTab,
  onChange,
  rosterCount,
  staffCount,
  rosterLabel,
  staffLabel,
}: TeamRosterTabsProps): ReactElement {
  const items = [
    {
      id: 'roster' as const,
      label: rosterLabel,
      icon: Users,
      count: rosterCount,
    },
    {
      id: 'staff' as const,
      label: staffLabel,
      icon: Shield,
      count: staffCount,
    },
  ];

  return (
    <HeaderTabs
      items={items}
      activeId={activeTab}
      onChange={onChange}
      size="xs"
    />
  );
}
