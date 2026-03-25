import { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";
import { cn } from "@/design-system";

interface ConfirmModalProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** "danger" = red (destructive), "warning" = neutral (logout, leave), "default" = indigo. */
  variant?: "danger" | "warning" | "default";
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title, description, children, confirmLabel, cancelLabel,
  variant = "default", onConfirm, onCancel,
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel, isLoading]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try { await onConfirm(); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isLoading && onCancel()} />
      <div className="relative w-full max-w-sm bg-[#141414] border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <button onClick={() => !isLoading && onCancel()}
              className="p-1 hover:bg-neutral-800 rounded-lg transition-colors shrink-0 -mt-0.5 -mr-1">
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          </div>
          {description && <p className="text-xs text-neutral-400 leading-relaxed mb-4">{description}</p>}
          {children && <div className="mb-4">{children}</div>}
        </div>
        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onCancel} disabled={isLoading}
            className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-[4px] transition-colors">
            {cancelLabel}
          </button>
          <button onClick={handleConfirm} disabled={isLoading}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-[4px] transition-colors disabled:opacity-50",
              variant === "danger"
                ? "bg-red-600 hover:bg-red-500"
                : variant === "warning"
                  ? "bg-neutral-700 hover:bg-neutral-600"
                  : "bg-[#4338ca] hover:bg-[#4f46e5]"
            )}>
            {isLoading && <Loader className="w-3 h-3 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
