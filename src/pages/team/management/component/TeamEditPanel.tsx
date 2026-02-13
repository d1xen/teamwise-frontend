// src/pages/team/management/component/TeamEditPanel.tsx

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

import { ImageUploader } from "@/components/ui/ImageUploader";

interface TeamEditPanelProps {
    team: {
        id: string;
        name: string;
        logoUrl?: string;
    };
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
    const token = localStorage.getItem("jwt");

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
        if (!token) return;

        fetch(`/api/teams/${team.id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error();
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
            .catch(() => toast.error(t("team.load_error")))
            .finally(() => setLoading(false));
    }, [team.id, token, t]);

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

        const body = new FormData();
        Object.entries(formData).forEach(([k, v]) =>
            body.append(k, v)
        );
        if (logoFile) body.append("logo", logoFile);

        try {
            const res = await fetch(`/api/teams/${team.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body,
            });

            if (!res.ok) throw new Error();
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
