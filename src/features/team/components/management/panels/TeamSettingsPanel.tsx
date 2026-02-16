import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import type { Team } from "@/contexts/team/team.types";
import { updateTeam as updateTeamApi } from "@/api/endpoints/team.api";
import { Save, Link as LinkIcon, Copy, RotateCw } from "lucide-react";

interface TeamSettingsPanelProps {
  team: Team;
  canEdit: boolean;
  canInvite: boolean;
}

export default function TeamSettingsPanel({
  team,
  canEdit,
  canInvite,
}: TeamSettingsPanelProps) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: team.name,
    tag: team.tag ?? "",
    game: team.game ?? "",
    logoUrl: team.logoUrl,
    hltvUrl: team.hltvUrl ?? "",
    faceitUrl: team.faceitUrl ?? "",
    twitterUrl: team.twitterUrl ?? "",
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!canEdit || !isDirty) return;
    setIsSaving(true);
    try {
      await updateTeamApi(team.id, {
        name: formData.name,
        ...(formData.tag && { tag: formData.tag }),
        ...(formData.game && { game: formData.game }),
        hltvUrl: formData.hltvUrl || null,
        faceitUrl: formData.faceitUrl || null,
        twitterUrl: formData.twitterUrl || null,
      });
      toast.success(t("management.team_updated"));
      setIsDirty(false);
      // Reload pour refléter les changements
      window.location.reload();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (team.invitationToken) {
      const link = `${window.location.origin}/invite/${team.invitationToken}`;
      navigator.clipboard.writeText(link);
      toast.success(t("management.link_copied"));
    }
  };

  const handleRegenerateLink = async () => {
    // TODO: Implement regenerate invite link API call
    toast.success(t("management.feature_coming_soon"));
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {t("management.settings")}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            {t("management.settings_subtitle")}
          </p>
        </div>
        {canEdit && isDirty && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? t("common.saving") : t("common.save")}
          </button>
        )}
      </div>

      {/* Team Identity */}
      <section className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-6">
          {t("management.team_identity")}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <FormField
              label={t("management.team_logo")}
              disabled={!canEdit}
            >
              <div className="space-y-3">
                {formData.logoUrl && (
                  <img
                    src={formData.logoUrl}
                    alt="Team logo"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                )}
                <input
                  type="url"
                  value={formData.logoUrl ?? ""}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={t("management.logo_url_placeholder")}
                />
              </div>
            </FormField>

            <FormField
              label={t("management.team_name")}
              required
              disabled={!canEdit}
            >
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t("management.team_name_placeholder")}
              />
            </FormField>

            <FormField
              label={t("management.team_tag")}
              required
              disabled={!canEdit}
            >
              <input
                type="text"
                value={formData.tag}
                onChange={(e) => handleChange("tag", e.target.value)}
                disabled={!canEdit}
                maxLength={10}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t("management.team_tag_placeholder")}
              />
            </FormField>

            <FormField
              label={t("management.game")}
              required
              disabled={!canEdit}
            >
              <input
                type="text"
                value={formData.game}
                onChange={(e) => handleChange("game", e.target.value)}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Counter-Strike 2"
              />
            </FormField>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <FormField label={t("management.hltv_url")} disabled={!canEdit}>
              <input
                type="url"
                value={formData.hltvUrl ?? ""}
                onChange={(e) => handleChange("hltvUrl", e.target.value)}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="https://hltv.org/team/..."
              />
            </FormField>

            <FormField label={t("management.faceit_url")} disabled={!canEdit}>
              <input
                type="url"
                value={formData.faceitUrl ?? ""}
                onChange={(e) => handleChange("faceitUrl", e.target.value)}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="https://faceit.com/team/..."
              />
            </FormField>

            <FormField label={t("management.twitter_url")} disabled={!canEdit}>
              <input
                type="url"
                value={formData.twitterUrl ?? ""}
                onChange={(e) => handleChange("twitterUrl", e.target.value)}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="https://twitter.com/..."
              />
            </FormField>
          </div>
        </div>
      </section>

      {/* Invitation Link */}
      {canInvite && (
        <section className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-4 h-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-white">
              {t("management.invitation_link")}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            {t("management.invitation_link_description")}
          </p>

          <div className="flex gap-2">
            <div className="flex-1 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-300 truncate">
              {team.invitationToken
                ? `${window.location.origin}/invite/${team.invitationToken}`
                : t("management.no_invitation_link")}
            </div>
            <button
              onClick={handleCopyInviteLink}
              disabled={!team.invitationToken}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t("management.copy_link")}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleRegenerateLink}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-lg transition-colors"
              title={t("management.regenerate_link")}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function FormField({
  label,
  required,
  disabled,
  children,
}: {
  label: string;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className={`block text-xs font-medium mb-2 ${disabled ? "text-neutral-600" : "text-neutral-400"}`}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

