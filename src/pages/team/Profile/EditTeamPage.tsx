import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {Loader} from "lucide-react";
import {ImageUploader} from "../../../components/ui/ImageUploader.tsx";

export default function EditTeamPage() {
    const { teamId } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();

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

    useEffect(() => {
        if (!teamId) return;

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
                setLogoPreview(data.logoUrl || null);
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
            alert(t("team.logo_invalid_format"));
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamId) return;

        const body = new FormData();
        body.append("name", formData.name);
        body.append("tag", formData.tag);
        body.append("game", formData.game);
        body.append("hltvUrl", formData.hltvUrl);
        body.append("faceitUrl", formData.faceitUrl);
        body.append("twitterUrl", formData.twitterUrl);
        if (logoFile) body.append("logo", logoFile);

        const response = await fetch(`/api/teams/${teamId}`, {
            method: "PUT",
            body,
        });

        if (response.ok) {
            navigate(`/app/team/${teamId}/profile`);
        } else {
            alert(t("team.update_error"));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex justify-center pt-20 px-4">
            <form
                onSubmit={handleSubmit}
                className="bg-neutral-800 p-8 rounded-xl shadow-lg max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-8"
            >
                <h2 className="text-3xl font-bold md:col-span-2">{t("team.edit_title")}</h2>

                <div className="space-y-5">
                    <input
                        type="text"
                        name="name"
                        placeholder={t("team.name_placeholder")}
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full max-w-sm p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                        required
                    />

                    <input
                        type="text"
                        name="tag"
                        placeholder={t("team.tag_placeholder")}
                        value={formData.tag}
                        onChange={handleChange}
                        className="w-full max-w-sm p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                    />

                    <ImageUploader
                        imagePreview={logoPreview}
                        onFileChange={handleLogoChange}
                        onRemove={removeLogo}
                        label={t("team.logo_label")}
                        loading={false}
                    />
                </div>

                <div className="space-y-5">
                    <select
                        name="game"
                        value={formData.game}
                        onChange={handleChange}
                        className="w-full max-w-sm p-3 rounded bg-neutral-700 text-white"
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
                    />

                    <input
                        type="url"
                        name="faceitUrl"
                        placeholder={t("team.faceit_placeholder")}
                        value={formData.faceitUrl}
                        onChange={handleChange}
                        className="w-full max-w-sm p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                    />

                    <input
                        type="url"
                        name="twitterUrl"
                        placeholder={t("team.twitter_placeholder")}
                        value={formData.twitterUrl}
                        onChange={handleChange}
                        className="w-full max-w-sm p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                    />

                    <button
                        type="submit"
                        className="w-full max-w-sm h-12 bg-green-600 hover:bg-green-500 text-white font-semibold rounded shadow mt-4"
                    >
                        {t("team.update_button")}
                    </button>
                </div>
            </form>
        </div>
    );
}
