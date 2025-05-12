import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type StaffEditFormProps = {
    profileId: string;
    onSuccess: () => void;
};

type StaffProfile = {
    nickname: string;
    country: string;
    teamRole: string;
    faceit?: string;
    hltv?: string;
    twitter?: string;
    discord?: string;
};

export function StaffEditForm({ profileId, onSuccess }: StaffEditFormProps) {
    const { t } = useTranslation();
    const [profile, setProfile] = useState<StaffProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`/api/teams/staff-profile/${profileId}`)
            .then((res) => res.ok ? res.json() : Promise.reject("Failed to load"))
            .then(setProfile)
            .catch(() => setError(t("common.load_error")))
            .finally(() => setLoading(false));
    }, [profileId, t]);

    const handleChange = (field: keyof StaffProfile, value: string) => {
        if (!profile) return;
        setProfile({ ...profile, [field]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/teams/staff-profile/${profileId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });
            if (!res.ok) throw new Error();
            onSuccess();
        } catch {
            setError(t("common.save_error"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p>{t("common.loading")}</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!profile) return <p className="text-white">{t("common.not_found")}</p>;

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
            <div>
                <label className="block mb-1">{t("profile.nickname")}</label>
                <input
                    type="text"
                    value={profile.nickname}
                    onChange={(e) => handleChange("nickname", e.target.value)}
                    className="w-full p-2 rounded bg-neutral-800 text-white"
                    required
                />
            </div>

            <div>
                <label className="block mb-1">{t("profile.country")}</label>
                <input
                    type="text"
                    value={profile.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className="w-full p-2 rounded bg-neutral-800 text-white"
                />
            </div>

            <div>
                <label className="block mb-1">{t("staffs.role_label")}</label>
                <input
                    type="text"
                    value={profile.teamRole}
                    onChange={(e) => handleChange("teamRole", e.target.value)}
                    className="w-full p-2 rounded bg-neutral-800 text-white"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="Faceit"
                    value={profile.faceit || ""}
                    onChange={(e) => handleChange("faceit", e.target.value)}
                    className="p-2 rounded bg-neutral-800 text-white"
                />
                <input
                    type="text"
                    placeholder="HLTV"
                    value={profile.hltv || ""}
                    onChange={(e) => handleChange("hltv", e.target.value)}
                    className="p-2 rounded bg-neutral-800 text-white"
                />
                <input
                    type="text"
                    placeholder="Twitter"
                    value={profile.twitter || ""}
                    onChange={(e) => handleChange("twitter", e.target.value)}
                    className="p-2 rounded bg-neutral-800 text-white"
                />
                <input
                    type="text"
                    placeholder="Discord"
                    value={profile.discord || ""}
                    onChange={(e) => handleChange("discord", e.target.value)}
                    className="p-2 rounded bg-neutral-800 text-white"
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                    {saving ? t("common.saving") : t("common.save")}
                </button>
            </div>
        </form>
    );
}
