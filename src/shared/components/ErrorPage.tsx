import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import TeamWiseLogo from "@/shared/components/TeamWiseLogo";

type ErrorVariant = "404" | "403" | "500" | "network" | "unknown";

interface ErrorPageProps {
  variant?: ErrorVariant | undefined;
  title?: string | undefined;
  description?: string | undefined;
}

export default function ErrorPage({ variant = "unknown", title, description }: ErrorPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const defaultTitle = t(`error.${variant}_title`);
  const defaultDescription = t(`error.${variant}_description`);
  const showCode = variant === "404" || variant === "403" || variant === "500";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/select-team", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs text-center">
        <div className="mb-12">
          <TeamWiseLogo size={40} />
        </div>

        {variant === "403" && (
          <Lock className="w-10 h-10 text-neutral-700 mx-auto mb-6" />
        )}

        {showCode && (
          <p className="text-6xl font-black text-neutral-700 tabular-nums mb-6">{variant}</p>
        )}

        <h1 className="text-base text-white mb-3">
          {title ?? defaultTitle}
        </h1>

        <p className="text-sm text-neutral-500 leading-relaxed mb-12">
          {description ?? defaultDescription}
        </p>

        <button
          onClick={handleBack}
          className="w-full px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-colors"
        >
          {t("error.go_back")}
        </button>
      </div>
    </div>
  );
}
