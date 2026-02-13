import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

import { ImageUploader } from "@/components/ui/ImageUploader";
import { useAuth } from "@/contexts/AuthContext";

export interface TeamEditFormProps {
    teamId: string;
    isStaff: boolean;
    isOwner: boolean;
    onSuccess?: () => void;
}

interface TeamFormData {
    name: string;
    tag: string;
    game: string;
    hltvUrl: string;
    faceitUrl: string;
    twitterUrl: string;
}

export function TeamEditForm({
                                 teamId,
                                 isStaff,
                                 isOwner,
                                 onSuccess,
                             }: TeamEditFormProps) {
    const { t } = useTranslation();
    const { user } = useAuth();

    const [formData, setFormData] = useState<TeamFormData>({
        name: "",
        tag: "",
        game: "CS2",
        hltvUrl: "",
        faceitUrl: "",
        twitterUrl: "",
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const disabled = !isStaff && !isOwner;

    /**
     * 🔄 Load team data
     * ⚠️ Hook toujours appelé (règle React respectée)
     */
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);

        fetch(`/api/teams/${teamId}`, {
            headers: {
                "X-Steam-Id": user.steamId,
            },
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error();
                }
                return res.json();
            })
            .then((data) => {
                setFormData({
                    name: data.name ?? "",
                    tag: data.tag ?? "",
                    game: data.game ?? "CS2",
                    hltvUrl: data.hltvUrl ?? "",
                    faceitUrl: data.faceitUrl ?? "",
                    twitterUrl: data.twitterUrl ?? "",
                });

                setLogoPreview(data.logoUrl ?? null);
            })
            .catch(() => {
                toast.error(t("team.load_error"));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [teamId, user, t]);

    /**
     * 🔐 Guard RENDER (pas de hook après)
     */
    if (!user) {
        return (
            <p className="text-gray-400">
                {t("common.not_authenticated")}
            </p>
        );
    }

    if (loading) {
        return (
            <p className="text-gray-400">
                {t("common.loading")}
            </p>
        );
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    /**
     * 🖼 Logo validation = source de vérité ici
     */
    const handleLogoChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "image/png") {
            toast.error(t("image_uploader.invalid_format"));
            return;
        }

        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (disabled) {
            toast.error(t("team.no_permission_edit"));
            return;
        }

        const body = new FormData();
        body.append("steamId", user.steamId);
        body.append("name", formData.name);
        body.append("tag", formData.tag);
        body.append("game", formData.game);
        body.append("hltvUrl", formData.hltvUrl);
        body.append("faceitUrl", formData.faceitUrl);
        body.append("twitterUrl", formData.twitterUrl);

        if (logoFile) {
            body.append("logo", logoFile);
        }

        try {
            const res = await fetch(`/api/teams/${teamId}`, {
                method: "PUT",
                body,
            });

            if (!res.ok) {
                throw new Error();
            }

            toast.success(t("team.update_success"));
            onSuccess?.();
        } catch {
            toast.error(t("team.update_error"));
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto p-6"
        >
            {/* Infos générales */}
            <div className="bg-neutral-900 p-6 rounded-xl space-y-6">
                <h2 className="text-xl font-semibold">
                    {t("team.section_general")}
                </h2>

                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder={t("team.name_placeholder")}
                    className="w-full p-3 rounded bg-neutral-800 disabled:opacity-50"
                    required
                />

                <input
                    name="tag"
                    value={formData.tag}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder={t("team.tag_placeholder")}
                    className="w-full p-3 rounded bg-neutral-800 disabled:opacity-50"
                />

                <ImageUploader
                    imagePreview={logoPreview}
                    loading={false}
                    onFileChange={handleLogoChange}
                    onRemove={removeLogo}
                    label={t("team.logo_label")}
                    disabled={disabled}
                />

                <select
                    name="game"
                    value={formData.game}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full p-3 rounded bg-neutral-800 disabled:opacity-50"
                >
                    <option value="CS2">CS2</option>
                </select>
            </div>

            {/* Liens */}
            <div className="bg-neutral-900 p-6 rounded-xl space-y-6">
                <h2 className="text-xl font-semibold">
                    {t("team.section_links")}
                </h2>

                <input
                    name="hltvUrl"
                    value={formData.hltvUrl}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="HLTV"
                    className="w-full p-3 rounded bg-neutral-800 disabled:opacity-50"
                />

                <input
                    name="faceitUrl"
                    value={formData.faceitUrl}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="Faceit"
                    className="w-full p-3 rounded bg-neutral-800 disabled:opacity-50"
                />

                <input
                    name="twitterUrl"
                    value={formData.twitterUrl}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="Twitter"
                    className="w-full p-3 rounded bg-neutral-800 disabled:opacity-50"
                />

                <button
                    type="submit"
                    disabled={disabled}
                    className={`h-12 rounded font-semibold ${
                        disabled
                            ? "bg-gray-600 text-white/60 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                >
                    {t("team.update_button")}
                </button>
            </div>
        </form>
    );
}
