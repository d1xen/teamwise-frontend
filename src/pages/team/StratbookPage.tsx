import { useParams } from "react-router-dom";
import { useTeamAccessGuard } from "../../hook/useTeamAccessGuard.ts";
import { useTranslation } from "react-i18next";

export default function StratbookPage() {
    const { teamId } = useParams();
    useTeamAccessGuard(teamId);
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-4xl font-bold text-indigo-400 mb-4">
                {t("pages.stratbook.title")}
            </h1>
            <p className="text-gray-400 text-lg animate-pulse">
                {t("pages.common.coming_soon")}
            </p>
        </div>
    );
}