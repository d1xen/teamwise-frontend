import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TeamMember } from "@/contexts/TeamContext";
import type { UserProfile } from "@/api/userProfile.api";
import { fetchUserProfile } from "@/api/userProfile.api";
import Loader from "@/components/ui/Loader";

type Props = {
    member: TeamMember;
    onClose(): void;
};

export default function MemberProfileModal({
                                               member,
                                               onClose,
                                           }: Props) {
    const { t } = useTranslation();

    const [profile, setProfile] =
        useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] =
        useState(true);

    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [onClose]);

    useEffect(() => {
        let cancelled = false;

        setIsLoading(true);

        fetchUserProfile(member.steamId)
            .then((data) => {
                if (!cancelled) {
                    setProfile(data);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [member.steamId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Card */}
            <div className="relative z-10 w-full max-w-2xl bg-neutral-900 rounded-xl p-6 shadow-xl">
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <Loader />
                    </div>
                )}

                {!isLoading && profile && (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            {profile.avatarUrl ? (
                                <img
                                    src={profile.avatarUrl}
                                    alt={profile.nickname}
                                    className="w-20 h-20 rounded-full"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-neutral-700" />
                            )}

                            <div className="flex-1 min-w-0">
                                <h3 className="text-2xl font-semibold text-white truncate">
                                    {profile.nickname}
                                </h3>

                                <div className="flex gap-2 mt-1">
                                    {member.isOwner && (
                                        <Badge>
                                            {t("team.owner")}
                                        </Badge>
                                    )}
                                    <Badge muted>
                                        {member.role}
                                    </Badge>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Sections */}
                        <div className="space-y-6 text-sm">
                            <Section title={t("profile.identity")}>
                                <InfoRow
                                    label={t("profile.first_name")}
                                    value={profile.firstName}
                                />
                                <InfoRow
                                    label={t("profile.last_name")}
                                    value={profile.lastName}
                                />
                                <InfoRow
                                    label={t("profile.age")}
                                    value={formatAge(profile.birthDate)}
                                />
                            </Section>

                            <Section title={t("profile.location")}>
                                <InfoRow
                                    label={t("profile.address")}
                                    value={profile.address}
                                />
                                <InfoRow
                                    label={t("profile.city")}
                                    value={profile.city}
                                />
                                <InfoRow
                                    label={t("profile.zip_code")}
                                    value={profile.zipCode}
                                />
                                <InfoRow
                                    label={t("profile.country")}
                                    value={profile.countryCode}
                                />
                            </Section>

                            <Section title={t("profile.contact")}>
                                <InfoRow
                                    label={t("profile.email")}
                                    value={profile.email}
                                />
                                <InfoRow
                                    label={t("profile.phone")}
                                    value={profile.phone}
                                />
                            </Section>

                            <Section title={t("profile.socials")}>
                                <InfoRow
                                    label="Discord"
                                    value={profile.discord}
                                />
                                <InfoRow
                                    label="Twitter"
                                    value={profile.twitter}
                                />
                                <InfoRow
                                    label="HLTV"
                                    value={profile.hltv}
                                />
                            </Section>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ======================
   HELPERS UI
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
    value: string | null;
}) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-gray-400">
                {label}
            </span>
            <span
                className={
                    value
                        ? "text-white text-right"
                        : "text-gray-500 italic text-right"
                }
            >
                {value ?? "(à compléter)"}
            </span>
        </div>
    );
}

function Badge({
                   children,
                   muted,
               }: {
    children: React.ReactNode;
    muted?: boolean;
}) {
    return (
        <span
            className={`px-2 py-0.5 rounded text-xs ${
                muted
                    ? "bg-neutral-700 text-gray-300"
                    : "bg-indigo-600/20 text-indigo-400"
            }`}
        >
            {children}
        </span>
    );
}

function formatAge(birthDate: string | null): string {
    if (!birthDate) return "(à compléter)";

    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return `${age} ${age > 1 ? "ans" : "an"}`;
}
