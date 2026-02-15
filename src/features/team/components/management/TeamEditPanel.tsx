// src/pages/team/management/component/TeamEditPanel.tsx

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

import { ImageUploader } from "@/shared/components/ImageUploader";
import { getTeam, updateTeam } from "@/api/endpoints/team.api";
import type { TeamDto, UpdateTeamRequest } from "@/api/types/team";
import type { Team } from "@/contexts/team/team.types";

interface TeamEditPanelProps {
    team: Team;
}

interface TeamFormData {
    name: string;
    tag: string;
    game: string;
    hltvUrl: string;
    faceitUrl: string;
    twitterUrl: string;
}

export default function TeamEditPanel({ team }: TeamEditPanelProps) {
    const { t } = useTranslation();

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

    /* ------------------------------------------------------------------ */
    /* Load team                                                            */
    /* ------------------------------------------------------------------ */

    useEffect(() => {
        getTeam(team.id)
            .then((data: TeamDto) => {
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
            .catch(() => toast.error(t("team.load_error")))
            .finally(() => setLoading(false));
    }, [team.id, t]);

    if (loading) {
        return <p className="text-gray-400">{t("common.loading")}</p>;
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload: UpdateTeamRequest = {
                name: formData.name,
                tag: formData.tag,
                game: formData.game,
                hltvUrl: formData.hltvUrl,
                faceitUrl: formData.faceitUrl,
                twitterUrl: formData.twitterUrl,
                logo: logoFile,
            };

            await updateTeam(team.id, payload);

            toast.success(t("team.update_success"));
        } catch {
            toast.error(t("team.update_error"));
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-neutral-900 p-6 rounded-xl space-y-6"
        >
            <h2 className="text-xl font-semibold">
                {t("team.section_general")}
            </h2>

            <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 rounded bg-neutral-800"
                required
            />

            <input
                name="tag"
                value={formData.tag}
                onChange={handleChange}
                className="w-full p-3 rounded bg-neutral-800"
            />

            <ImageUploader
                imagePreview={logoPreview}
                loading={false}
                onFileChange={handleLogoChange}
                onRemove={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                }}
                label={t("team.logo_label")}
            />

            <button className="h-12 bg-indigo-600 hover:bg-indigo-500 rounded font-semibold">
                {t("team.update_button")}
            </button>
        </form>
    );
}
