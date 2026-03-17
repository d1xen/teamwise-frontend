/**
 * Toggle.tsx
 * Composant toggle simple et réutilisable
 */

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  className = "",
  label,
}: ToggleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked
            ? "bg-green-600 hover:bg-green-500"
            : "bg-neutral-700 hover:bg-neutral-600"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      {label && <span className="text-xs text-neutral-400">{label}</span>}
    </div>
  );
}

