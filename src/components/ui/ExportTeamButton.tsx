import { FileDown } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ExportTeamButtonProps {
    onClick?: () => void;
}

export default function ExportTeamButton({ onClick }: ExportTeamButtonProps) {
    const { t } = useTranslation();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            toast(t("management.export_soon"));
        }
    };

    return (
        <button
            onClick={handleClick}
            className="w-fit inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow transition bg-emerald-600 hover:bg-emerald-500 text-white"
        >
            <FileDown className="w-4 h-4" />
            {t("management.export_team")}
        </button>
    );
}
