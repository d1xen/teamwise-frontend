import type { TeamNationality } from "@/shared/utils/countryUtils";
import Flag from "react-world-flags";

interface NationalityBadgeProps {
  nationality: TeamNationality | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "w-4 h-3",
  md: "w-5 h-3.5",
  lg: "w-6 h-4",
};

export function NationalityBadge({
  nationality,
  size = "md",
  className = "",
}: NationalityBadgeProps) {
  if (!nationality) return null;

  const flagCode = nationality.type === "country"
    ? nationality.code
    : nationality.code === "EU" ? "EU" : null;

  if (!flagCode) {
    return (
      <span title={nationality.tooltipLabel} className={`text-xs text-neutral-400 ${className}`}>
        {nationality.displayLabel}
      </span>
    );
  }

  return (
    <span title={nationality.tooltipLabel} className={`inline-block cursor-help ${className}`}>
      <Flag code={flagCode} className={`${SIZE_MAP[size]} rounded-none`} />
    </span>
  );
}
