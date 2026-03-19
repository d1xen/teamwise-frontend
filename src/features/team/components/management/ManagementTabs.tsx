import type { ReactElement } from 'react';
import HeaderTabs from '@/shared/components/HeaderTabs';

export type ManagementTabId = 'overview' | 'members' | 'teams' | 'profile';

export interface ManagementTabItem {
  id: ManagementTabId;
  label: string;
  icon: React.ElementType;
  count?: number;
}

interface ManagementTabsProps {
  tabs: ManagementTabItem[];
  activeView: ManagementTabId;
  onChange: (view: ManagementTabId) => void;
}

export default function ManagementTabs({
  tabs,
  activeView,
  onChange,
}: ManagementTabsProps): ReactElement {
  return (
    <HeaderTabs
      items={tabs}
      activeId={activeView}
      onChange={onChange}
      size="xs"
    />
  );
}
