import { useTranslation } from "react-i18next";
import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useRequiredUser } from "../../context/AuthContext.tsx";

interface DeleteTeamModalProps {
    isOpen: boolean;
    teamId: string;
    onClose: () => void;
}

export default function DeleteTeamModal({ isOpen, teamId, onClose }: DeleteTeamModalProps) {
    const { t } = useTranslation();
    const modalRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const user = useRequiredUser();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleDeleteTeam = async () => {
        if (!teamId || !user?.steamId) return;

        try {
            const res = await fetch(`/api/teams/${teamId}?steamId=${user.steamId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();

            toast.success(t("management.delete_success"));
            onClose(); // ferme le modal
            navigate("/app/home"); // redirige vers la page d'accueil
        } catch {
            toast.error(t("management.delete_error"));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-50">
            <div
                ref={modalRef}
                className="bg-neutral-800 p-6 rounded-xl shadow-xl w-[90%] max-w-md text-left"
            >
                <h3 className="text-xl font-bold mb-4 text-white">
                    {t("management.delete_confirm_title")}
                </h3>
                <p className="text-gray-300 mb-6">
                    {t("management.delete_confirm")}
                </p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        onClick={handleDeleteTeam}
                        className="px-4 py-2 rounded bg-red-500 hover:bg-red-700 text-white"
                    >
                        {t("common.confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
}
