import type { ReactElement } from 'react';
import { ProfileCompletionBadge } from '@/features/profile/components';
import HeaderTabs from '@/shared/components/HeaderTabs';

export type ManagementTabId = 'overview' | 'staff' | 'players' | 'teams' | 'profile';

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
  profileCompleted?: boolean;
  profileVerifiedLabel?: string;
  profileIncompleteLabel?: string;
}

export default function ManagementTabs({
  tabs,
  activeView,
  onChange,
  profileCompleted,
  profileVerifiedLabel,
  profileIncompleteLabel,
}: ManagementTabsProps): ReactElement {
  const items = tabs.map((tab) => ({
    ...tab,
    suffix: tab.id === 'profile' && profileCompleted !== undefined ? (
      profileCompleted ? (
        <span title={profileVerifiedLabel}>
          <ProfileCompletionBadge
            completed
            variant="inline"
          />
        </span>
      ) : (
        <span title={profileIncompleteLabel}>
          <ProfileCompletionBadge
            completed={false}
            showWhenIncomplete
            className="!px-2 !py-0.5"
          />
        </span>
      )
    ) : undefined,
  }));

  return (
    <HeaderTabs
      items={items}
      activeId={activeView}
      onChange={onChange}
      size="xs"
    />
  );
}
