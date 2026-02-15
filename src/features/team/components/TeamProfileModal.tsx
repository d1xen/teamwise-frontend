import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Team } from "@/contexts/team/team.types.ts";

type Props = {
    team: Team;
    onClose(): void;
};

export default function TeamProfileModal({
                                             team,
                                             onClose,
                                         }: Props) {
    const { t } = useTranslation();

    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Card */}
            <div className="relative z-10 w-full max-w-lg bg-neutral-900 rounded-xl p-6 shadow-xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    {team.logoUrl ? (
                        <img
                            src={team.logoUrl}
                            alt={`${team.name} logo`}
                            className="w-16 h-16 object-contain rounded-md bg-neutral-800"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-md bg-neutral-700 flex items-center justify-center text-xs text-gray-400">
                            {t("common.to_complete")}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-white truncate">
                            {team.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {t("team.team_profile")}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Infos */}
                <div className="space-y-4 text-sm">
                    <Section title={t("team.informations")}>
                        <InfoRow
                            label={t("team.id")}
                            value={team.id}
                        />
                        <InfoRow
                            label={t("team.name")}
                            value={team.name}
                        />
                        <InfoRow
                            label={t("team.logo")}
                            value={
                                team.logoUrl
                                    ? t("team.logo_uploaded")
                                    : t("common.to_complete")
                            }
                        />
                        <InfoRow
                            label={t("team.tag")}
                            value={t("common.to_complete")}
                        />
                    </Section>

                    <Section title={t("team.socials")}>
                        <InfoRow
                            label="HLTV"
                            value={t("common.to_complete")}
                        />
                        <InfoRow
                            label="Faceit"
                            value={t("common.to_complete")}
                        />
                        <InfoRow
                            label="Twitter"
                            value={t("common.to_complete")}
                        />
                    </Section>
                </div>
            </div>
        </div>
    );
}

/* ======================
   UI HELPERS
   ====================== */

function Section({
                     title,
                     children,
                 }: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">
                {title}
            </h4>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    );
}

function InfoRow({
                     label,
                     value,
                 }: {
    label: string;
    value: string | number;
}) {
    const isPlaceholder =
        typeof value === "string" &&
        value.toLowerCase().includes("complet");

    return (
        <div className="flex justify-between gap-4">
            <span className="text-gray-400">
                {label}
            </span>
            <span
                className={
                    isPlaceholder
                        ? "text-gray-500 italic text-right"
                        : "text-white text-right"
                }
            >
                {value}
            </span>
        </div>
    );
}
