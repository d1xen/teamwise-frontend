import { Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface DeleteTeamButton {
    isOwner: boolean;
    onClick: () => void;
}

export default function DeleteTeamButton({ isOwner, onClick }: DeleteTeamButton) {
    const { t } = useTranslation();

    const handleClick = () => {
        if (!isOwner) {
            toast.error(t("management.delete_no_permission"));
            return;
        }
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            disabled={!isOwner}
            className={`w-fit inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow transition
                ${isOwner
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-gray-600 cursor-not-allowed text-white/60"
            }`}
        >
            <Trash2 className="w-4 h-4" />
            {t("management.delete_team")}
        </button>
    );
}
