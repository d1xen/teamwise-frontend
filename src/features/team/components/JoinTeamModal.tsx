import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { X, LogIn, Link as LinkIcon, Loader } from "lucide-react";
import { joinTeamByInvitation } from "@/api/endpoints/team.api";

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinTeamModal({
  isOpen,
  onClose,
  onSuccess,
}: JoinTeamModalProps) {
  const { t } = useTranslation();
  const [invitationLink, setInvitationLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractTokenFromLink = (link: string): string | null => {
    try {
      // Support full URLs only
      const url = new URL(link);
      const pathname = url.pathname;
      const match = pathname.match(/\/invite\/([a-zA-Z0-9\-_]+)$/);
      return match ? match[1] : null;
    } catch {
      // If it fails to parse as URL, it's invalid
      return null;
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitationLink.trim()) {
      setError(t("team.join.enter_link"));
      return;
    }

    const token = extractTokenFromLink(invitationLink);
    if (!token) {
      setError(t("team.join.invalid_link_format"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await joinTeamByInvitation(token);
      toast.success(t("team.join.success"));
      setInvitationLink("");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : t("team.join.error");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - Plus obscur et avec plus d'effet */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-neutral-900/95 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-cyan-500/20">
              <LogIn className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">
              {t("team.join.title")}
            </h2>
          </div>
          <p className="text-neutral-400 text-sm">
            {t("team.join.subtitle_modal")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-5">
          {/* Input Field */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2.5">
              {t("team.join.invitation_link")}
              <span className="text-red-400 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LinkIcon className="w-4 h-4 text-neutral-500" />
              </div>
              <input
                type="text"
                value={invitationLink}
                onChange={(e) => {
                  setInvitationLink(e.target.value);
                  setError(null);
                }}
                placeholder="https://teamwise.app/invite/..."
                className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                disabled={isLoading}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              {t("team.join.link_help")}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <p className="text-xs text-cyan-300">
              {t("team.join.info_modal")}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading || !invitationLink.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {t("common.joining")}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {t("team.join.join_button")}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          {t("team.join.dont_have_link")}{" "}
          <span className="text-neutral-400">{t("team.join.ask_team_owner")}</span>
        </p>
      </div>
    </div>
  );
}











