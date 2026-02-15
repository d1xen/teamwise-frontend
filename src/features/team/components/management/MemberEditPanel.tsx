import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

import { useAuth } from "@/contexts/auth/useAuth.ts";
import { useTeam } from "@/contexts/team/useTeam.ts";
import type { TeamMember } from "@/contexts/team/team.types.ts";
import {
    getUserProfile,
    updateMyProfile,
    updateUserProfile,
    type UserProfileDto,
    type UserProfileUpdateDto,
} from "@/api/profile.api";
import { updateMemberRole } from "@/api/endpoints/team.api";
import type { TeamRole } from "@/api/types/team";
import Loader from "@/shared/components/Loader";

/* =====================================================
   Props
   ===================================================== */

interface Props {
    member: TeamMember;
    canEditProfile: boolean;
    canEditRole: boolean;
}

/* =====================================================
   Component
   ===================================================== */

export default function MemberEditPanel({
                                            member,
                                            canEditProfile,
                                            canEditRole,
                                        }: Props) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { team } = useTeam();
    const teamId = team?.id;

    const [profile, setProfile] = useState<UserProfileDto | null>(null);
    const [form, setForm] = useState<UserProfileUpdateDto>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [role, setRole] = useState<TeamRole>(member.role as TeamRole);
    const [isSavingRole, setIsSavingRole] = useState(false);

    const isSelf = user?.steamId === member.steamId;

    /* =====================================================
       Load profile (always)
       ===================================================== */

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);

        if (!teamId) {
            setIsLoading(false);
            return;
        }

        getUserProfile(member.steamId, teamId)
            .then((data) => {
                if (cancelled) return;
                setProfile(data);
                setForm({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    birthDate: data.birthDate,
                    email: data.email,
                    address: data.address,
                    city: data.city,
                    countryCode: data.countryCode,
                    phone: data.phone,
                    discord: data.discord,
                    twitter: data.twitter,
                });
            })
            .catch(() => toast.error(t("common.error")))
            .finally(() => !cancelled && setIsLoading(false));

        return () => {
            cancelled = true;
        };
    }, [member.steamId, teamId, t]);

    /* =====================================================
       Derived
       ===================================================== */

    const age = useMemo(() => {
        if (!profile?.birthDate) return null;
        const birth = new Date(profile.birthDate);
        const today = new Date();
        let a = today.getFullYear() - birth.getFullYear();
        if (
            today.getMonth() < birth.getMonth() ||
            (today.getMonth() === birth.getMonth() &&
                today.getDate() < birth.getDate())
        ) {
            a--;
        }
        return a;
    }, [profile?.birthDate]);

    /* =====================================================
       Guards
       ===================================================== */

    if (!team || !user) return null;

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader />
            </div>
        );
    }

    if (!profile) {
        return (
            <p className="text-sm text-gray-400">
                {t("common.unable_to_load")}
            </p>
        );
    }

    /* =====================================================
       Actions
       ===================================================== */

    const saveProfile = async () => {
        if (!canEditProfile || !teamId) return;

        setIsSavingProfile(true);

        try {
            const payload = form;
            const updated = isSelf
                ? await updateMyProfile(payload)
                : await updateUserProfile(member.steamId, teamId, payload);

            setProfile(updated);
            setIsEditing(false);
            toast.success(t("common.saved"));
        } catch {
            toast.error(t("common.error"));
        } finally {
            setIsSavingProfile(false);
        }
    };

    const saveRole = async () => {
        if (!canEditRole || !teamId) return;

        setIsSavingRole(true);

        try {
            await updateMemberRole(teamId, member.steamId, { role });
            toast.success(t("management.role_updated"));
            window.location.reload();
        } catch {
            toast.error(t("common.error"));
        } finally {
            setIsSavingRole(false);
        }
    };

    /* =====================================================
       Render
       ===================================================== */

    return (
        <div className="space-y-10">
            {/* =====================================================
               Header
               ===================================================== */}
            <div className="flex items-center gap-4">
                {member.avatarUrl ? (
                    <img
                        src={member.avatarUrl}
                        alt={member.nickname}
                        className="w-16 h-16 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-neutral-700" />
                )}

                <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                        {member.nickname}
                    </h3>
                    <div className="text-sm text-gray-400">
                        {member.role}
                        {member.isOwner && ` • ${t("roles.owner")}`}
                    </div>
                    {!profile.profileCompleted && (
                        <div className="text-xs text-yellow-400 mt-1">
                            {t("profile.incomplete")}
                        </div>
                    )}
                </div>

                {canEditProfile && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 text-sm rounded bg-neutral-800 hover:bg-neutral-700"
                    >
                        {t("common.edit")}
                    </button>
                )}
            </div>

            {/* =====================================================
               Profile sections
               ===================================================== */}
            <Section title={t("profile.personal")}>
                <Field label={t("profile.first_name")} value={profile.firstName} />
                <Field label={t("profile.last_name")} value={profile.lastName} />
                <Field
                    label={t("profile.birth_date")}
                    value={
                        profile.birthDate
                            ? `${profile.birthDate} (${age} ${t("profile.years")})`
                            : null
                    }
                />
                <Field label={t("profile.country")} value={profile.countryCode} />
                <Field label={t("profile.city")} value={profile.city} />
            </Section>

            <Section title={t("profile.address")}>
                <Field label={t("profile.address")} value={profile.address} />
            </Section>

            <Section title={t("profile.contact")}>
                <Field label={t("profile.email")} value={profile.email} />
                <Field label={t("profile.phone")} value={profile.phone} />
                <Field label={t("profile.discord")} value={profile.discord} />
            </Section>

            <Section title={t("profile.socials")}>
                <Field label="Twitter" value={profile.twitter} />
            </Section>

            {/* =====================================================
               Edit mode
               ===================================================== */}
            {isEditing && (
                <div className="space-y-4 border-t border-neutral-700 pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(form).map(([key, value]) => (
                            <input
                                key={key}
                                value={String(value ?? "")}
                                onChange={(e) =>
                                    setForm((prev: UserProfileUpdateDto) => ({
                                        ...prev,
                                        [key]: e.target.value || null,
                                    }))
                                }
                                placeholder={key}
                                className="px-3 py-2 rounded bg-neutral-900 border border-neutral-700"
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={saveProfile}
                            disabled={isSavingProfile}
                            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {t("common.save")}
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700"
                        >
                            {t("common.cancel")}
                        </button>
                    </div>
                </div>
            )}

            {/* =====================================================
               Role
               ===================================================== */}
            {canEditRole && (
                <Section title={t("management.role")}>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as TeamRole)}
                        className="w-full max-w-xs p-2 rounded bg-neutral-900 border border-neutral-700"
                    >
                        <option value="PLAYER">Player</option>
                        <option value="COACH">Coach</option>
                        <option value="ANALYST">Analyst</option>
                        <option value="MANAGER">Manager</option>
                    </select>

                    <button
                        onClick={saveRole}
                        disabled={isSavingRole}
                        className="mt-3 px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {t("common.save")}
                    </button>
                </Section>
            )}
        </div>
    );
}

/* =====================================================
   UI helpers
   ===================================================== */

function Section({
                     title,
                     children,
                 }: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                {title}
            </h4>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function Field({
                   label,
                   value,
               }: {
    label: string;
    value: string | null;
}) {
    return (
        <div className="flex justify-between gap-4 text-sm">
            <span className="text-gray-400">{label}</span>
            <span className={value ? "text-white" : "text-gray-500 italic"}>
                {value ?? "(à compléter)"}
            </span>
        </div>
    );
}
