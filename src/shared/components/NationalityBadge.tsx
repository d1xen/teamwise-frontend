/**
 * NationalityBadge.tsx
 * Composant pour afficher la nationalité d'une équipe ou d'un joueur
 * Affiche uniquement le drapeau avec tooltip au survol
 */

import type { TeamNationality } from "@/shared/utils/countryUtils";
import { getNationalityFlag } from "@/shared/utils/countryUtils";

interface NationalityBadgeProps {
  nationality: TeamNationality | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function NationalityBadge({
  nationality,
  size = "md",
  className = "",
}: NationalityBadgeProps) {
  if (!nationality) {
    return <span className={className}>—</span>;
  }

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <span
      title={nationality.tooltipLabel}
      className={`inline-block cursor-help ${sizeClasses[size]} ${className}`}
    >
      {getNationalityFlag(nationality)}
    </span>
  );
}

