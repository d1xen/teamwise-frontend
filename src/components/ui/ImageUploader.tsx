import React from "react";
import { useTranslation } from "react-i18next";
import {toast} from "react-hot-toast";

interface ImageUploaderProps {
    imagePreview: string | null;
    loading: boolean;
    onRemove: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label?: string; // Optionnel pour contextualiser (ex: "Logo d'équipe", "Photo joueur")
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
                                                                imagePreview,
                                                                loading,
                                                                onRemove,
                                                                onFileChange,
                                                                label
                                                            }) => {
    const { t } = useTranslation();

    return (
        <div className="flex gap-6 items-end w-full max-w-3xl">
            {/* Aperçu étendu */}
            {!imagePreview ? (
                <div className="relative w-[183px] h-[183px] border border-dashed border-gray-600 flex items-center justify-center text-center">
                    {imagePreview ? (
                        <>
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-[183px] h-[183px] object-cover"
                            />
                            <button
                                type="button"
                                onClick={onRemove}
                                className="absolute top-1 right-1 text-red-500 hover:text-red-400 text-2xl font-bold"
                                title={t("image_uploader.remove")}
                            >
                                ×
                            </button>
                        </>
                    ) : (
                        <span className="text-sm text-gray-500">
                        {label || "Image"}
                    </span>
                    )}
                </div>
            ) : (
                <div className="relative w-[183px] h-[183px] flex items-center justify-center text-center">
                    <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-[183px] h-[183px] object-cover"
                    />
                    <button
                        type="button"
                        onClick={onRemove}
                        className="absolute top-1 right-1 text-red-500 hover:text-red-400 text-2xl font-bold"
                        title={t("image_uploader.remove")}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Upload */}
            <div className="flex flex-col flex-1 justify-end gap-2">
                <span className="text-xs italic text-gray-500">{t("image_uploader.hint")}</span>

                <input
                    key={imagePreview || 'empty'}
                    id="imageUpload"
                    type="file"
                    accept="image/png"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.type !== "image/png") {
                            toast.error(t("image_uploader.invalid_format"));
                            return;
                        }
                        onFileChange(e);
                    }}
                    className="hidden"
                    disabled={loading}
                />

                <label
                    htmlFor="imageUpload"
                    className="w-full max-w-sm h-12 flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-500 font-semibold text-sm rounded shadow cursor-pointer"
                >
                    {t("image_uploader.import")}
                </label>
            </div>
        </div>
    );
};
