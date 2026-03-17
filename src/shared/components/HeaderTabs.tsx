import type { ReactElement, ReactNode } from 'react';
import { cn } from '@/design-system';

export interface HeaderTabItem<T extends string> {
  id: T;
  label: string;
  icon: React.ElementType;
  count?: number;
  suffix?: ReactNode;
}

interface HeaderTabsProps<T extends string> {
  items: HeaderTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  size?: 'xs' | 'sm' | 'md';
}

const sizeClasses = {
  xs: {
    button: 'px-3 py-2 rounded-md text-sm',
    icon: 'w-3.5 h-3.5',
    badge: 'px-2 py-0.5 text-xs',
  },
  sm: {
    button: 'px-3.5 py-2 rounded-md text-[15px]',
    icon: 'w-4 h-4',
    badge: 'px-2 py-0.5 text-xs',
  },
  md: {
    button: 'px-4 py-2.5 rounded-lg text-base',
    icon: 'w-4.5 h-4.5',
    badge: 'px-2.5 py-0.5 text-sm',
  },
} as const;

export default function HeaderTabs<T extends string>({
  items,
  activeId,
  onChange,
  size = 'sm',
}: HeaderTabsProps<T>): ReactElement {
  const classes = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex items-center gap-2 font-medium transition-all',
              classes.button,
              isActive
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            )}
          >
            <Icon className={classes.icon} />
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  'ml-1 rounded-full',
                  classes.badge,
                  isActive
                    ? 'bg-neutral-700 text-white'
                    : 'bg-neutral-800 text-neutral-400'
                )}
              >
                {item.count}
              </span>
            )}
            {item.suffix}
          </button>
        );
      })}
    </div>
  );
}

