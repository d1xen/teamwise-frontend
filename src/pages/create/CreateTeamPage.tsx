import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../../components/layout/AppHeader.tsx";
import { useAuth, useRequiredUser } from "../../context/AuthContext.tsx";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../components/ui/BackButton.tsx";
import { ImageUploader } from "../../components/ui/ImageUploader.tsx";

export default function CreateTeamPage() {
    const navigate = useNavigate();
    const steamId = localStorage.getItem("steamId");
    const { logout } = useAuth();
    const user = useRequiredUser();
    const { t } = useTranslation();

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
    const [loading, setLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "image/png") {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        } else if (file) {
            alert(t("team.logo_invalid_format"));
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const body = new FormData();
        body.append("name", formData.name);
        body.append("tag", formData.tag);
        body.append("game", formData.game);
        if (formData.hltvUrl) body.append("hltvUrl", formData.hltvUrl);
        if (formData.faceitUrl) body.append("faceitUrl", formData.faceitUrl);
        if (formData.twitterUrl) body.append("twitterUrl", formData.twitterUrl);
        if (logoFile) body.append("logo", logoFile);

        const response = await fetch(`/api/teams?steamId=${steamId}`, {
            method: "POST",
            body,
        });

        setLoading(false);

        if (response.ok) {
            navigate("/app/home");
        } else {
            alert(t("team.create_error"));
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-neutral-900 text-white">
            <AppHeader user={user} onLogout={logout} />

            <div className="flex justify-center pt-20 px-4">
                <div className="relative max-w-3xl w-full">
                    <div className="absolute">
                        <BackButton/>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="bg-neutral-800 p-8 rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <h2 className="text-3xl font-bold md:col-span-2">
                            {t("team.create_title")}
                        </h2>

                        {/* Colonne gauche */}
                        <div className="space-y-5">
                            <input
                                type="text"
                                name="name"
                                placeholder={t("team.name_placeholder")}
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full max-w-sm p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                                required
                                disabled={loading}
                            />

                            <input
                                type="text"
                                name="tag"
                                placeholder={t("team.tag_placeholder")}
                                value={formData.tag}
                                onChange={handleChange}
                                className="w-full max-w-sm p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                                disabled={loading}
                            />

                            <ImageUploader
                                imagePreview={logoPreview}
                                loading={loading}
                                onRemove={removeLogo}
                                onFileChange={handleLogoChange}
                                label={t("team.logo_label")}
                            />
                        </div>

                        {/* Colonne droite */}
                        <div className="space-y-5">
                            <select
                                name="game"
                                value={formData.game}
                                onChange={handleChange}
                                className="w-full max-w-sm p-3 rounded bg-neutral-700 text-white"
                                disabled={loading}
                            >
                                <option value="CS2">{t("team.game_cs2")}</option>
                            </select>

                            <input
                                type="url"
                                name="hltvUrl"
                                placeholder={t("team.hltv_placeholder")}
                                value={formData.hltvUrl}
                                onChange={handleChange}
                                className="w-full max-w-sm p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                                disabled={loading}
                            />

                            <input
                                type="url"
                                name="faceitUrl"
                                placeholder={t("team.faceit_placeholder")}
                                value={formData.faceitUrl}
                                onChange={handleChange}
                                className="w-full max-w-sm p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                                disabled={loading}
                            />

                            <input
                                type="url"
                                name="twitterUrl"
                                placeholder={t("team.twitter_placeholder")}
                                value={formData.twitterUrl}
                                onChange={handleChange}
                                className="w-full max-w-sm p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                                disabled={loading}
                            />

                            <button
                                type="submit"
                                className="w-full max-w-sm h-12 bg-green-600 hover:bg-green-500 text-white font-semibold rounded shadow mt-4"
                                disabled={loading}
                            >
                                {t("team.create_button")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
