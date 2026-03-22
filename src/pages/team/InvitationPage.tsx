import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/auth/useAuth";
import { joinTeamByInvitation } from "@/api/endpoints/team.api";
import { Loader, CheckCircle, AlertCircle } from "lucide-react";

type InvitationStatus = "loading" | "success" | "error";

export default function InvitationPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [status, setStatus] = useState<InvitationStatus>("loading");
  const [message, setMessage] = useState("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/invite/${token}` } });
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage(t("team.join.invalid_link_format"));
      return;
    }

    const joinTeam = async () => {
      try {
        const team = await joinTeamByInvitation(token);
        setTeamName(team.name);
        setStatus("success");
        setMessage(t("team.join.success"));
        toast.success(t("team.join.success"));

        // Rediriger après 2 secondes
        setTimeout(() => {
          navigate(`/team/${team.id}`, { replace: true });
        }, 2000);
      } catch (err) {
        setStatus("error");
        const errorMessage = err instanceof Error
          ? err.message
          : t("team.join.error");
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    joinTeam();
  }, [token, isAuthenticated, isAuthLoading, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.07),transparent)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl p-8 text-center">
          {status === "loading" && (
            <>
              <div className="mb-6 flex justify-center">
                <Loader className="w-12 h-12 text-indigo-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                {t("team.join.title")}
              </h1>
              <p className="text-neutral-400">{t("common.loading")}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="p-3 rounded-full bg-green-500/20">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                {t("team.join.success")}
              </h1>
              {teamName && (
                <p className="text-neutral-300 mb-4">
                  {t("team.welcome", { nickname: teamName })}
                </p>
              )}
              <p className="text-sm text-neutral-500">
                {t("common.redirecting")}
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="p-3 rounded-full bg-red-500/20">
                  <AlertCircle className="w-12 h-12 text-red-400" />
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                {t("team.join.error")}
              </h1>
              <p className="text-neutral-400 mb-6">{message}</p>
              <button
                onClick={() => navigate("/team/select", { replace: true })}
                className="w-full px-4 py-2.5 bg-[#4338ca] hover:bg-[#4f46e5] text-white rounded-lg font-medium transition-colors"
              >
                {t("common.back")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

