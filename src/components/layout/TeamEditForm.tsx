import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { ImageUploader } from "../../components/ui/ImageUploader";
import { useRequiredUser } from "../../context/AuthContext.tsx";

export interface TeamEditFormProps {
    teamId: string;
    isStaff: boolean;
    isOwner: boolean;
    onSuccess?: () => void;
}

export function TeamEditForm({
                                 teamId,
                                 isStaff,
                                 isOwner,
                                 onSuccess,
                             }: TeamEditFormProps) {
    const { t } = useTranslation();
    const user = useRequiredUser();

    const [formData, setFormData] = useState({
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

    useEffect(() => {
        fetch(`/api/teams/${teamId}`)
            .then((res) => res.json())
            .then((data) => {
                setFormData({
                    name: data.name || "",
                    tag: data.tag || "",
                    game: data.game || "CS2",
                    hltvUrl: data.hltvUrl || "",
                    faceitUrl: data.faceitUrl || "",
                    twitterUrl: data.twitterUrl || "",
                });

                const backendUrl = "http://localhost:8080";
                setLogoPreview(data.logoUrl ? `${backendUrl}${data.logoUrl}` : null);
            })
            .finally(() => setLoading(false));
    }, [teamId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "image/png") {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        } else if (file) {
            toast.error(t("team.logo_invalid_format"));
        }
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
        if (logoFile) body.append("logo", logoFile);

        try {
            const response = await fetch(`/api/teams/${teamId}`, {
                method: "PUT",
                body,
            });

            if (response.ok) {
                toast.success(t("team.update_success"));
                if (onSuccess) onSuccess();
            } else {
                toast.error(t("team.update_error"));
            }
        } catch (err) {
            toast.error(t("common.generic_error"));
        }
    };

    if (loading) {
        return <p className="text-gray-400">{t("common.loading")}...</p>;
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto p-6"
        >
            {/* Infos générales */}
            <div className="bg-neutral-900 p-6 rounded-2xl shadow-xl space-y-6">
                <h2 className="text-xl font-bold border-l-4 border-pink-500 pl-3">
                    {t("team.section_general")}
                </h2>

                <input
                    type="text"
                    name="name"
                    placeholder={t("team.name_placeholder")}
                    value={formData.name}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400 disabled:opacity-50"
                    required
                />

                <input
                    type="text"
                    name="tag"
                    placeholder={t("team.tag_placeholder")}
                    value={formData.tag}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400 disabled:opacity-50"
                />

                <ImageUploader
                    imagePreview={logoPreview}
                    onFileChange={handleLogoChange}
                    onRemove={removeLogo}
                    label={t("team.logo_label")}
                    loading={false}
                    disabled={disabled}
                />

                <select
                    name="game"
                    value={formData.game}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full p-3 rounded bg-neutral-700 text-white disabled:opacity-50"
                >
                    <option value="CS2">{t("team.game_cs2")}</option>
                </select>
            </div>

            {/* Liens externes */}
            <div className="bg-neutral-900 p-6 rounded-2xl shadow-xl space-y-6">
                <h2 className="text-xl font-bold border-l-4 border-blue-500 pl-3">
                    {t("team.section_links")}
                </h2>

                <input
                    type="url"
                    name="hltvUrl"
                    placeholder={t("team.hltv_placeholder")}
                    value={formData.hltvUrl}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400 disabled:opacity-50"
                />

                <input
                    type="url"
                    name="faceitUrl"
                    placeholder={t("team.faceit_placeholder")}
                    value={formData.faceitUrl}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400 disabled:opacity-50"
                />

                <input
                    type="url"
                    name="twitterUrl"
                    placeholder={t("team.twitter_placeholder")}
                    value={formData.twitterUrl}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400 disabled:opacity-50"
                />

                <button
                    type="submit"
                    disabled={disabled}
                    className={`w-full h-12 font-semibold rounded shadow 
                        ${disabled
                        ? "bg-gray-600 text-white/60 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-500 text-white"
                    }`}
                >
                    {t("team.update_button")}
                </button>
            </div>
        </form>
    );
}
