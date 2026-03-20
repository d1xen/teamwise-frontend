import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImageUploadProps {
    /** URL de l'image actuellement affichée (null = pas d'image). */
    currentUrl: string | null | undefined;
    /** Texte alternatif pour l'image. */
    alt: string;
    /** Appelée avec le File sélectionné. Retourne la nouvelle URL ou null en cas d'erreur. */
    onUpload: (file: File) => Promise<string | null>;
    /** Appelée quand l'utilisateur demande la suppression. */
    onDelete?: () => Promise<void>;
    /** Types acceptés (ex: "image/jpeg,image/png"). Par défaut: JPEG + PNG. */
    accept?: string;
    /** Taille max en bytes affichée à l'utilisateur. Par défaut: 2 MB. */
    maxBytes?: number;
    /** Forme du preview ("square" | "circle"). Par défaut: "square". */
    shape?: "square" | "circle";
    /** Taille du composant en px. Par défaut: 80. */
    size?: number;
    /** Label optionnel affiché sous le composant. */
    label?: string;
    /** Désactive toute interaction. */
    disabled?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImageUpload({
    currentUrl,
    alt,
    onUpload,
    onDelete,
    accept = "image/jpeg,image/png",
    maxBytes = 2 * 1024 * 1024,
    shape = "square",
    size = 80,
    label,
    disabled = false,
}: ImageUploadProps) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const displayUrl = previewUrl ?? currentUrl ?? null;
    const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";
    const maxMB = Math.round(maxBytes / 1024 / 1024);

    // ── File handling ─────────────────────────────────────────────────────────

    const processFile = async (file: File) => {
        setError(null);

        if (file.size > maxBytes) {
            setError(t("upload.error_too_large", { max: maxMB }));
            return;
        }
        const acceptedTypes = accept.split(",").map((s) => s.trim());
        if (!acceptedTypes.includes(file.type)) {
            setError(t("upload.error_type"));
            return;
        }

        // Immediate local preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setIsUploading(true);

        try {
            const newUrl = await onUpload(file);
            if (newUrl) {
                // Replace preview with definitive URL from server
                URL.revokeObjectURL(objectUrl);
                setPreviewUrl(newUrl);
            } else {
                URL.revokeObjectURL(objectUrl);
                setPreviewUrl(null);
                setError(t("upload.error_generic"));
            }
        } catch {
            URL.revokeObjectURL(objectUrl);
            setPreviewUrl(null);
            setError(t("upload.error_generic"));
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        // Reset input so the same file can be re-selected
        e.target.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled || isUploading) return;
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleDelete = async () => {
        if (!onDelete || isUploading) return;
        setIsUploading(true);
        setError(null);
        try {
            await onDelete();
            setPreviewUrl(null);
        } catch {
            setError(t("upload.error_generic"));
        } finally {
            setIsUploading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className="relative group"
                style={{ width: size, height: size }}
                onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                {/* Image or placeholder */}
                {displayUrl ? (
                    <img
                        src={displayUrl}
                        alt={alt}
                        className={`w-full h-full object-cover ${shapeClass} ring-2 ${isDragging ? "ring-indigo-400" : "ring-neutral-700"} transition-all`}
                        style={{ width: size, height: size }}
                    />
                ) : (
                    <div
                        className={`w-full h-full flex items-center justify-center bg-neutral-800 ${shapeClass} ring-2 ${isDragging ? "ring-indigo-400 bg-indigo-500/10" : "ring-neutral-700"} transition-all`}
                        style={{ width: size, height: size }}
                    >
                        <ImageIcon className="text-neutral-600" style={{ width: size * 0.35, height: size * 0.35 }} />
                    </div>
                )}

                {/* Overlay on hover */}
                {!disabled && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading}
                        className={`absolute inset-0 ${shapeClass} bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all duration-150 cursor-pointer`}
                        title={t("upload.change")}
                    >
                        {isUploading ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <Upload className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </button>
                )}

                {/* Delete button */}
                {!disabled && onDelete && displayUrl && !isUploading && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors z-10"
                        title={t("upload.delete")}
                    >
                        <X className="w-2.5 h-2.5" />
                    </button>
                )}

                {/* Loading spinner (full overlay) */}
                {isUploading && (
                    <div className={`absolute inset-0 ${shapeClass} bg-black/60 flex items-center justify-center`}>
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
            />

            {/* Label */}
            {label && (
                <p className="text-[10px] text-neutral-500 text-center leading-tight">{label}</p>
            )}

            {/* Error */}
            {error && (
                <p className="text-[10px] text-red-400 text-center max-w-[120px] leading-tight">{error}</p>
            )}
        </div>
    );
}
