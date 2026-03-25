import { ReactNode } from 'react';
import { cn } from '@/design-system';
import type { TeamRole } from '@/contexts/team/team.types';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'neutral'
  | TeamRole
  | 'OWNER';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  primary: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  neutral: 'bg-neutral-700 text-neutral-300 border-neutral-600',
  // Roles — aligned with shared/constants/roleStyles.ts
  PLAYER: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  COACH: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  ANALYST: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  MANAGER: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  OWNER: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
};

export function Badge({ children, variant = 'neutral', icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-3 py-1.5 rounded-lg border',
        'text-sm font-medium',
        variantStyles[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

