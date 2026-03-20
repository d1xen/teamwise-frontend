import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
  Copy, Link, RefreshCw, Trash2, AlertTriangle,
  CheckCircle2, Circle, Pencil, Save, X,
} from 'lucide-react';
import type { Team } from '@/contexts/team/team.types';
import { updateTeam as updateTeamApi, createInvitation, uploadTeamLogo, deleteTeamLogo } from '@/api/endpoints/team.api';
import type { UpdateTeamRequest } from '@/api/types/team';
import { useTeam } from '@/contexts/team/useTeam';
import type { useTeamActions } from '@/features/team/hooks/useTeamActions';
import { FormInput, FormTextarea } from '@/design-system/components/Form';
import ImageUpload from '@/shared/components/ImageUpload';
import { TeamAvatar } from '@/shared/components/TeamAvatar';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TeamSettingsPanelProps {
  team: Team;
  canEdit: boolean;
  canInvite: boolean;
  canDelete: boolean;
  actions: ReturnType<typeof useTeamActions>;
}

// ─── Completion helpers ─────────────────────────────────────────────────────────

const GAME_BADGE_STYLE: Record<string, string> = {
  CS2:      'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  VALORANT: 'bg-red-500/10 text-red-300 border-red-500/20',
};

function isFilled(v: string | null | undefined): boolean {
  return v !== null && v !== undefined && v.trim() !== '';
}

function computeCompletion(team: Team) {
  const values = [
    team.name,
    team.tag,
    team.logoUrl,
    team.description,
    team.links?.find((l) => l.type === 'HLTV')?.url,
    team.links?.find((l) => l.type === 'FACEIT')?.url,
    team.links?.find((l) => l.type === 'TWITTER')?.url,
  ];
  const filled = values.filter(isFilled).length;
  const total = values.length;
  const pct = Math.round((filled / total) * 100);
  return { filled, total, pct };
}

function completionColor(pct: number) {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function completionTextColor(pct: number) {
  if (pct >= 80) return 'text-emerald-400';
  if (pct >= 40) return 'text-amber-400';
  return 'text-red-400';
}

// ─── TeamField ─────────────────────────────────────────────────────────────────

function TeamField({ label, value }: { label: string; value: string | null | undefined }) {
  const filled = isFilled(value);
  return (
    <div className="flex items-start gap-2.5 py-2">
      {filled
        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
        : <Circle className="w-3.5 h-3.5 text-neutral-700 mt-0.5 shrink-0" />
      }
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
        <p className={`text-sm truncate ${filled ? 'text-neutral-100' : 'text-neutral-600 italic'}`}>
          {filled ? value : '—'}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function TeamSettingsPanel({
  team,
  canEdit,
  canInvite,
  canDelete,
  actions,
}: TeamSettingsPanelProps) {
  const { t } = useTranslation();
  const { refreshTeam } = useTeam();

  // ── Edit mode ──────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name:        team.name,
    tag:         team.tag ?? '',
    description: team.description ?? '',
    hltv:        team.links?.find((l) => l.type === 'HLTV')?.url   ?? '',
    faceit:      team.links?.find((l) => l.type === 'FACEIT')?.url  ?? '',
    twitter:     team.links?.find((l) => l.type === 'TWITTER')?.url ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Invitation ─────────────────────────────────────────────────────────────
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Delete modal ───────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  const { filled, total, pct } = computeCompletion(team);
  const gameBadgeStyle = team.game ? GAME_BADGE_STYLE[team.game] : null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('management.team_name') + ' required';
    if (!formData.tag.trim())  newErrors.tag  = t('management.team_tag')  + ' required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const links = [
        formData.hltv    && { type: 'HLTV'    as const, url: formData.hltv    },
        formData.faceit  && { type: 'FACEIT'  as const, url: formData.faceit  },
        formData.twitter && { type: 'TWITTER' as const, url: formData.twitter },
      ].filter((l): l is { type: 'HLTV' | 'FACEIT' | 'TWITTER'; url: string } => Boolean(l));

      const payload: UpdateTeamRequest = {
        name:        formData.name,
        tag:         formData.tag || undefined,
        description: formData.description || null,
        links,
      };
      await updateTeamApi(team.id, payload);
      toast.success(t('management.team_updated'));
      setIsDirty(false);
      setIsEditing(false);
      await refreshTeam();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name:        team.name,
      tag:         team.tag ?? '',
      description: team.description ?? '',
      hltv:        team.links?.find((l) => l.type === 'HLTV')?.url   ?? '',
      faceit:      team.links?.find((l) => l.type === 'FACEIT')?.url  ?? '',
      twitter:     team.links?.find((l) => l.type === 'TWITTER')?.url ?? '',
    });
    setErrors({});
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleGenerateInvite = async () => {
    setIsGenerating(true);
    try {
      const response = await createInvitation(team.id);
      setInviteUrl(response.inviteUrl);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t('management.invite_copied'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteInput('');
  };

  const handleConfirmDelete = async () => {
    if (deleteInput !== team.name) return;
    setIsDeleting(true);
    await actions.deleteTeamConfirmed();
    setIsDeleting(false);
  };

  // ── Edit view ──────────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/70">
          <div className="flex items-center gap-3">
            <TeamAvatar
              logoUrl={team.logoUrl}
              name={team.name}
              tag={team.tag}
              size={36}
              className="ring-1 ring-neutral-700"
            />
            <div>
              <p className="text-sm font-semibold text-white">{team.name}</p>
              <p className="text-xs text-neutral-500">{t('management.edit_team_settings')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-sm transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? '…' : t('common.save')}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Identity */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              {t('management.team_information')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label={t('management.team_name')}
                placeholder="Team Vitality"
                value={formData.name}
                onChange={(v) => handleChange('name', v)}
                error={errors.name}
                required
              />
              <FormInput
                label={t('management.team_tag')}
                placeholder="VIT"
                value={formData.tag}
                onChange={(v) => handleChange('tag', v)}
                error={errors.tag}
                required
              />
              <div className="col-span-2">
                <p className="text-xs text-neutral-500 mb-1">{t('management.game')}</p>
                <p className="text-sm text-neutral-500 italic">{team.game ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              {t('management.team_appearance')}
            </p>
            <div className="grid grid-cols-1 gap-4">
              <FormTextarea
                label={t('management.team_description')}
                placeholder={t('management.team_description_placeholder')}
                value={formData.description}
                onChange={(v) => handleChange('description', v)}
                rows={3}
              />
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              {t('management.links')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="HLTV"
                placeholder="https://hltv.org/..."
                value={formData.hltv}
                onChange={(v) => handleChange('hltv', v)}
              />
              <FormInput
                label="FACEIT"
                placeholder="https://faceit.com/..."
                value={formData.faceit}
                onChange={(v) => handleChange('faceit', v)}
              />
              <div className="col-span-2">
                <FormInput
                  label="Twitter / X"
                  placeholder="https://twitter.com/..."
                  value={formData.twitter}
                  onChange={(v) => handleChange('twitter', v)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Read view ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Identity card ── */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="relative shrink-0">
            <ImageUpload
              currentUrl={team.logoUrl ?? null}
              alt={team.name}
              shape="square"
              size={64}
              accept="image/jpeg,image/png,image/svg+xml"
              maxBytes={5 * 1024 * 1024}
              disabled={!canEdit}
              onUpload={async (file) => {
                try {
                  const updated = await uploadTeamLogo(team.id, file);
                  toast.success(t('upload.logo_updated'));
                  await refreshTeam();
                  return updated.logoUrl ?? null;
                } catch {
                  toast.error(t('upload.error_generic'));
                  return null;
                }
              }}
              onDelete={canEdit ? async () => {
                await deleteTeamLogo(team.id);
                toast.success(t('upload.logo_deleted'));
                await refreshTeam();
              } : undefined}
            />
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-neutral-900 ${completionColor(pct)}`} />
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white truncate">{team.name}</h2>
              {team.tag && (
                <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs font-bold border border-neutral-700">
                  {team.tag}
                </span>
              )}
              {gameBadgeStyle && team.game && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${gameBadgeStyle}`}>
                  {team.game}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-600 mt-1">{t('management.teams_subtitle')}</p>
          </div>

          {/* Edit button */}
          {canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white text-sm font-medium transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t('common.edit')}
            </button>
          )}
        </div>

        {/* Completion bar */}
        <div className="mt-5 pt-5 border-t border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400">
              {t('management.team_profile_completion')}
            </span>
            <span className={`text-xs font-bold ${completionTextColor(pct)}`}>
              {filled}/{total} · {pct}%
            </span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completionColor(pct)}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Field cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Identity */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            {t('management.team_information')}
          </p>
          <div className="divide-y divide-neutral-800/60">
            <TeamField label={t('management.team_name')} value={team.name} />
            <TeamField label={t('management.team_tag')}  value={team.tag} />
            <TeamField label={t('management.game')}      value={team.game} />
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            {t('management.team_appearance')}
          </p>
          <div className="divide-y divide-neutral-800/60">
            <TeamField label={t('upload.logo')} value={team.logoUrl ? '✓' : null} />
            <TeamField label={t('management.team_description')} value={team.description} />
          </div>
        </div>

        {/* Links */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            {t('management.links')}
          </p>
          <div className="divide-y divide-neutral-800/60">
            <TeamField label="HLTV"       value={team.links?.find((l) => l.type === 'HLTV')?.url} />
            <TeamField label="FACEIT"     value={team.links?.find((l) => l.type === 'FACEIT')?.url} />
            <TeamField label="Twitter / X" value={team.links?.find((l) => l.type === 'TWITTER')?.url} />
          </div>
        </div>
      </div>

      {/* ── Actions block (invite + delete) ── */}
      {(canInvite || canDelete) && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl divide-y divide-neutral-800">

          {/* Invite */}
          {canInvite && (
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                  <Link className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white mb-0.5">{t('management.invitation_link')}</h3>
                  <p className="text-xs text-neutral-500 mb-4">{t('management.invitation_link_description')}</p>

                  {inviteUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 bg-neutral-800/60 border border-neutral-700/50 rounded-lg px-3 py-2">
                        <span className="flex-1 text-xs text-neutral-300 truncate font-mono">{inviteUrl}</span>
                        <button
                          onClick={handleCopyInvite}
                          className="shrink-0 p-1.5 hover:bg-neutral-700 rounded transition-colors"
                          title={t('management.copy_invite')}
                        >
                          <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        </button>
                      </div>
                      <button
                        onClick={handleGenerateInvite}
                        disabled={isGenerating}
                        className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                        {t('management.regenerate_link')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateInvite}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Link className="w-4 h-4" />
                      {isGenerating ? t('common.loading') : t('management.generate_invite')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delete team */}
          {canDelete && (
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg shrink-0">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-0.5">{t('management.delete_team_title')}</h3>
                  <p className="text-xs text-neutral-500 mb-4">{t('management.danger_zone_description')}</p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/15 hover:bg-red-600/25 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg border border-red-600/25 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('management.delete_cta')} «{team.name}»
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-red-900/40 rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal header */}
            <div className="flex items-start gap-3 px-6 py-5 bg-red-950/30 border-b border-red-900/30">
              <div className="p-2 bg-red-500/15 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-white">{t('management.delete_confirm_title')}</h2>
                <p className="text-xs text-red-400/80 mt-0.5">{t('management.danger_zone_description')}</p>
              </div>
              <button
                onClick={closeDeleteModal}
                className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-neutral-400">{t('management.delete_confirm')}</p>

              {/* Consequences */}
              <ul className="space-y-2">
                {(['delete_consequence_1', 'delete_consequence_2', 'delete_consequence_3'] as const).map((key) => (
                  <li key={key} className="flex items-center gap-2.5 text-xs text-neutral-500">
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    {t(`management.${key}`)}
                  </li>
                ))}
              </ul>

              {/* Type to confirm */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs text-neutral-400">
                  {t('management.delete_type_to_confirm')}{' '}
                  <span className="font-mono font-semibold text-neutral-200">{team.name}</span>
                </label>
                <input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={team.name}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteInput !== team.name || isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? '…' : t('management.delete_cta')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
