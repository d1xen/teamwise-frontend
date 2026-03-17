import { CheckCircle, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProfileCompletionBadgeProps {
    completed: boolean;
    className?: string;
    variant?: "badge" | "inline";
    showWhenIncomplete?: boolean;
}

/**
 * Badge de statut de profil complet
 * Affiche une pastille bleue avec checkbox si profil complet
 * Variant "badge" pour petit badge, "inline" pour intégration inline
 */
export default function ProfileCompletionBadge({
    completed,
    className = "",
    variant = "badge",
    showWhenIncomplete = false,
}: ProfileCompletionBadgeProps) {
    const { t } = useTranslation();

    if (!completed && !showWhenIncomplete) {
        return null;
    }

    if (variant === "inline") {
        return (
            <div
                className={`inline-flex items-center gap-0.5 ${className}`}
                aria-label={completed ? t("profile.verified") : t("profile.not_verified")}
            >
                {completed ? (
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                )}
            </div>
        );
    }

    // Default badge variant
    return (
        <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                completed
                    ? "bg-blue-500/15 border border-blue-500/30"
                    : "bg-amber-500/10 border border-amber-500/30"
            } ${className}`}
        >
            {completed ? (
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
            ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className={`text-xs font-medium ${completed ? "text-blue-300" : "text-amber-300"}`}>
                {completed ? t("profile.verified") : t("profile.not_verified")}
            </span>
        </div>
    );
}
