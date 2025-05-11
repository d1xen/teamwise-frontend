import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface BackButtonProps {
    onClick?: () => void;
    className?: string;
    title?: string;
}

export function BackButton({
                               onClick,
                               className = "mb-4",
                               title,
                           }: BackButtonProps) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className={className}>
            <button
                onClick={onClick ?? (() => navigate(-1))}
                className="w-11 h-11 -ml-6 md:-ml-16 rounded-full bg-neutral-700 hover:bg-neutral-600 text-white flex items-center justify-center transition"
                title={title ?? t("common.back")}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                </svg>
            </button>
        </div>
    );
}
