import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type PlayerEditFormProps = {
    profileId: string;
    onSuccess: () => void;
};

type PlayerProfile = {
    nickname: string;
    country: string;
    role: string;
    faceit?: string;
    hltv?: string;
    twitter?: string;
    discord?: string;
};

export function PlayerEditForm({ profileId, onSuccess }: PlayerEditFormProps) {
    const { t } = useTranslation();
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`/api/profiles/player/${profileId}`)
            .then(res => res.ok ? res.json() : Promise.reject("Failed to load"))
            .then(setProfile)
            .catch(() => setError(t("common.load_error")))
            .finally(() => setLoading(false));
    }, [profileId, t]);

    const handleChange = (field: keyof PlayerProfile, value: string) => {
        if (!profile) return;
        setProfile({ ...profile, [field]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/profiles/player/${profileId}`, {
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
                <label className="block mb-1">{t("profile.role")}</label>
                <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className="w-full p-2 rounded bg-neutral-800 text-white"
                />
            </div>
            <div>
                <label className="block mb-1">Faceit</label>
                <input
                    type="text"
                    value={profile.faceit || ""}
                    onChange={(e) => handleChange("faceit", e.target.value)}
                    className="w-full p-2 rounded bg-neutral-800 text-white"
                />
            </div>
            <div>
                <label className="block mb-1">HLTV</label>
                <input
                    type="text"
                    value={profile.hltv || ""}
                    onChange={(e) => handleChange("hltv", e.target.value)}
                    className="w-full p-2 rounded bg-neutral-800 text-white"
                />
            </div>
            <div>
                <label className="block mb-1">Twitter</label>
                <input
                    type="text"
                    value={profile.twitter || ""}
                    onChange={(e) => handleChange("twitter", e.target.value)}
                    className="w-full p-2 rounded bg-neutral-800 text-white"
                />
            </div>
            <div>
                <label className="block mb-1">Discord</label>
                <input
                    type="text"
                    value={profile.discord || ""}
                    onChange={(e) => handleChange("discord", e.target.value)}
                    className="w-full p-2 rounded bg-neutral-800 text-white"
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
