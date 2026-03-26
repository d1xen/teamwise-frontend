import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { AlertTriangle, X, Loader, Eye, EyeOff } from 'lucide-react';
import DropdownMenu from '@/shared/components/DropdownMenu';
import type { DropdownMenuItem } from '@/shared/components/DropdownMenu';
import type { Team } from '@/contexts/team/team.types';
import { updateTeam as updateTeamApi, createInvitation, uploadTeamLogo, deleteTeamLogo } from '@/api/endpoints/team.api';
import type { UpdateTeamRequest } from '@/api/types/team';
import { useTeam } from '@/contexts/team/useTeam';
import type { useTeamActions } from '@/features/team/hooks/useTeamActions';
import ImageUpload from '@/shared/components/ImageUpload';
import { cn } from '@/design-system';

interface TeamSettingsPanelProps {
  team: Team;
  canEdit: boolean;
  canInvite: boolean;
  canDelete: boolean;
  actions: ReturnType<typeof useTeamActions>;
}

const GAME_BADGE: Record<string, string> = {
  CS2: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  VALORANT: 'bg-red-500/10 text-red-300 border-red-500/20',
};

const INPUT_CLS = 'w-full h-7 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-2.5 outline-none placeholder:text-neutral-600 focus:border-indigo-500/50 caret-indigo-400 transition-colors';

function Cell({ label, value, editing, formValue, onChange, placeholder, full, multiline }: {
  label: string; value: string | null | undefined; editing?: boolean; formValue?: string;
  onChange?: (v: string) => void; placeholder?: string; full?: boolean; multiline?: boolean;
}) {
  const { t } = useTranslation();
  const filled = Boolean(value);
  const [expanded, setExpanded] = useState(false);
  const truncated = multiline && value && value.length > 60 && !expanded;
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1">{label}</p>
      {editing && onChange ? (
        multiline ? (
          <textarea value={formValue ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? '—'} rows={3}
            className={cn(INPUT_CLS, 'h-auto py-1.5 resize-none')} />
        ) : (
          <input type="text" value={formValue ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? '—'} className={INPUT_CLS} />
        )
      ) : multiline && value ? (
        <div>
          <p className={cn('text-sm leading-relaxed px-1', filled ? 'text-neutral-200' : 'text-neutral-700')}>
            {truncated ? value.slice(0, 60) + '…' : value}
          </p>
          {value.length > 60 && (
            <button onClick={() => setExpanded(e => !e)} className="text-[10px] text-indigo-400 hover:text-indigo-300 px-1 mt-0.5 transition-colors">
              {expanded ? t('common.show_less') : t('common.show_more')}
            </button>
          )}
        </div>
      ) : (
        <p className={cn('h-7 flex items-center text-sm truncate px-1', filled ? 'text-neutral-200' : 'text-neutral-700')}>{value || '—'}</p>
      )}
    </div>
  );
}

function PasswordCell({ label, value, editing, formValue, onChange, placeholder }: {
  label: string; value: string | null | undefined; editing?: boolean; formValue?: string;
  onChange?: (v: string) => void; placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const filled = Boolean(value);
  return (
    <div>
      <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1">{label}</p>
      {editing && onChange ? (
        <div className="relative">
          <input type={visible ? 'text' : 'password'} value={formValue ?? ''} onChange={e => onChange(e.target.value)}
            placeholder={placeholder ?? '—'} className={cn(INPUT_CLS, 'pr-8')} />
          <button type="button" onClick={() => setVisible(v => !v)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-600 hover:text-neutral-400 transition-colors">
            {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      ) : (
        <div className="h-7 flex items-center gap-2 px-1">
          <span className={cn('text-sm', filled ? 'text-neutral-200 font-mono tracking-wide' : 'text-neutral-700')}>
            {filled ? (visible ? value : '••••••••') : '—'}
          </span>
          {filled && (
            <button type="button" onClick={() => setVisible(v => !v)}
              className="p-0.5 text-neutral-600 hover:text-neutral-400 transition-colors">
              {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeamSettingsPanel({ team, canEdit, canInvite, canDelete, actions }: TeamSettingsPanelProps) {
  const { t, i18n } = useTranslation();
  const { refreshTeam } = useTeam();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: team.name, tag: team.tag ?? '', description: team.description ?? '',
    hltv: team.links?.find(l => l.type === 'HLTV')?.url ?? '',
    faceit: team.links?.find(l => l.type === 'FACEIT')?.url ?? '',
    twitter: team.links?.find(l => l.type === 'TWITTER')?.url ?? '',
    tsAddress: team.serverInfo?.teamspeakAddress ?? '',
    tsPassword: team.serverInfo?.teamspeakPassword ?? '',
    gsAddress: team.serverInfo?.gameServerAddress ?? '',
    gsPassword: team.serverInfo?.gameServerPassword ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInviteCopied, setIsInviteCopied] = useState(false);
  const inviteTimer = useRef<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const e = isEditing;
  const gameBadge = team.game ? GAME_BADGE[team.game] : null;

  const handleSave = async () => {
    if (!form.name.trim() || !form.tag.trim()) return;
    setIsSaving(true);
    try {
      const links = [
        form.hltv && { type: 'HLTV' as const, url: form.hltv },
        form.faceit && { type: 'FACEIT' as const, url: form.faceit },
        form.twitter && { type: 'TWITTER' as const, url: form.twitter },
      ].filter((l): l is { type: 'HLTV' | 'FACEIT' | 'TWITTER'; url: string } => Boolean(l));
      const payload: UpdateTeamRequest = {
        name: form.name,
        tag: form.tag,
        description: form.description,
        links,
        teamspeakAddress: form.tsAddress,
        teamspeakPassword: form.tsPassword,
        gameServerAddress: form.gsAddress,
        gameServerPassword: form.gsPassword,
      };
      await updateTeamApi(team.id, payload);
      toast.success(t('management.team_updated'));
      setIsEditing(false);
      await refreshTeam();
    } catch { toast.error(t('common.error')); }
    finally { setIsSaving(false); }
  };

  const handleCancel = () => {
    setForm({
      name: team.name, tag: team.tag ?? '', description: team.description ?? '',
      hltv: team.links?.find(l => l.type === 'HLTV')?.url ?? '',
      faceit: team.links?.find(l => l.type === 'FACEIT')?.url ?? '',
      twitter: team.links?.find(l => l.type === 'TWITTER')?.url ?? '',
      tsAddress: team.serverInfo?.teamspeakAddress ?? '',
      tsPassword: team.serverInfo?.teamspeakPassword ?? '',
      gsAddress: team.serverInfo?.gameServerAddress ?? '',
      gsPassword: team.serverInfo?.gameServerPassword ?? '',
    });
    setIsEditing(false);
  };

  const handleQuickInvite = async () => {
    setIsGenerating(true);
    try {
      let url = inviteUrl;
      if (!url) { const r = await createInvitation(team.id); url = r.inviteUrl; setInviteUrl(url); }
      await navigator.clipboard.writeText(url);
      toast.success(t('management.invite_copied'));
      setIsInviteCopied(true);
      if (inviteTimer.current !== null) window.clearTimeout(inviteTimer.current);
      inviteTimer.current = window.setTimeout(() => { setIsInviteCopied(false); inviteTimer.current = null; }, 1500);
    } catch { toast.error(t('common.error')); }
    finally { setIsGenerating(false); }
  };

  const handleConfirmDelete = async () => {
    if (deleteInput !== team.name) return;
    setIsDeleting(true);
    await actions.deleteTeamConfirmed();
    setIsDeleting(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl">
        {/* ── Header ── */}
        <div className="flex items-start gap-4 px-5 py-4 border-b border-neutral-800">
          <div className="shrink-0 mt-1">
            <ImageUpload currentUrl={team.logoUrl ?? null} alt={team.name} shape="square" size={64}
              accept="image/jpeg,image/png,image/webp,image/svg+xml" maxBytes={5 * 1024 * 1024} disabled={!canEdit}
              onUpload={async (file) => {
                try { const u = await uploadTeamLogo(team.id, file); toast.success(t('upload.logo_updated')); await refreshTeam(); return u.logoUrl ?? null; }
                catch { toast.error(t('upload.error_generic')); return null; }
              }}
              {...(canEdit ? { onDelete: async () => { await deleteTeamLogo(team.id); toast.success(t('upload.logo_deleted')); await refreshTeam(); } } : {})}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{team.name}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              {team.tag && <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-[4px] text-xs font-bold border border-neutral-700">{team.tag}</span>}
              {gameBadge && team.game && <span className={cn('px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wide border', gameBadge)}>{team.game}</span>}
            </div>
          </div>

          {/* Top-right actions */}
          <div className="flex items-start gap-2 shrink-0">
            {e ? (
              <>
                <button onClick={handleSave} disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                  {isSaving && <Loader className="w-3 h-3 animate-spin" />}
                  {isSaving ? t('common.saving') : t('common.save')}
                </button>
                <button onClick={handleCancel} disabled={isSaving}
                  className="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <>
                {canInvite && (
                  <span className="relative group/tip">
                    <button onClick={handleQuickInvite} disabled={isGenerating}
                      className={cn('inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-colors disabled:opacity-50',
                        isInviteCopied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                      )}>
                      {isGenerating ? t('common.loading') : isInviteCopied ? t('common.copied') : t('management.invitation_link')}
                    </button>
                    <span className="absolute top-full right-0 mt-2 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-[11px] text-neutral-300 whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity shadow-lg z-10">
                      {t('management.invitation_info')}
                    </span>
                  </span>
                )}
                <DropdownMenu items={[
                  ...(canEdit ? [{ label: t('common.edit'), onClick: () => setIsEditing(true) }] as DropdownMenuItem[] : []),
                  ...(canDelete ? [{ label: t('management.delete_cta'), onClick: () => setShowDeleteModal(true), variant: 'danger' as const }] : []),
                ]} />
              </>
            )}
          </div>
        </div>

        {/* ── Fields — 3 columns ── */}
        <div className="grid grid-cols-3 divide-x divide-neutral-800">
          {/* Information */}
          <div className="p-5 space-y-2.5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">{t('management.team_information')}</p>
            <Cell label={t('management.team_name')} value={team.name} editing={e} formValue={form.name} onChange={v => set('name', v)} placeholder="Team Vitality" />
            <Cell label={t('management.team_tag')} value={team.tag} editing={e} formValue={form.tag} onChange={v => set('tag', v)} placeholder="VIT" />
            <Cell label={t('management.team_description')} value={team.description} editing={e} formValue={form.description} onChange={v => set('description', v)} placeholder={t('management.team_description_placeholder')} multiline />
            {team.createdAt && (
              <Cell label={t('meta.created_label')} value={new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(team.createdAt))} />
            )}
            <Cell label={t('meta.updated_label')} value={team.updatedAt ? new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(team.updatedAt)) : null} />
          </div>

          {/* Links + Servers */}
          <div className="p-5 space-y-2.5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">{t('management.links')}</p>
            <Cell label="HLTV" value={team.links?.find(l => l.type === 'HLTV')?.url} editing={e} formValue={form.hltv} onChange={v => set('hltv', v)} placeholder="https://hltv.org/..." />
            <Cell label="FACEIT" value={team.links?.find(l => l.type === 'FACEIT')?.url} editing={e} formValue={form.faceit} onChange={v => set('faceit', v)} placeholder="https://faceit.com/..." />
            <Cell label="Twitter / X" value={team.links?.find(l => l.type === 'TWITTER')?.url} editing={e} formValue={form.twitter} onChange={v => set('twitter', v)} placeholder="https://twitter.com/..." />
          </div>

          {/* Servers + Danger */}
          <div className="p-5 space-y-2.5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">{t('management.servers')}</p>
            <Cell label="TeamSpeak" value={team.serverInfo?.teamspeakAddress} editing={e} formValue={form.tsAddress} onChange={v => set('tsAddress', v)} placeholder="ts.vitality.gg:9987" />
            <PasswordCell label={t('management.ts_password')} value={team.serverInfo?.teamspeakPassword} editing={e} formValue={form.tsPassword} onChange={v => set('tsPassword', v)} placeholder="••••••" />
            <Cell label={t('management.game_server')} value={team.serverInfo?.gameServerAddress} editing={e} formValue={form.gsAddress} onChange={v => set('gsAddress', v)} placeholder="192.168.1.1:27015" />
            <PasswordCell label={t('management.gs_password')} value={team.serverInfo?.gameServerPassword} editing={e} formValue={form.gsPassword} onChange={v => set('gsPassword', v)} placeholder="••••••" />
          </div>
        </div>
      </div>

      {/* ── Delete modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141414] border border-red-900/40 rounded-2xl overflow-hidden">
            <div className="flex items-start gap-3 px-6 py-5 bg-red-950/30 border-b border-red-900/30">
              <div className="p-2 bg-red-500/15 rounded-lg shrink-0 mt-0.5"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-white">{t('management.delete_confirm_title')}</h2>
                <p className="text-xs text-red-400/80 mt-0.5">{t('management.danger_zone_description')}</p>
              </div>
              <button onClick={() => { setShowDeleteModal(false); setDeleteInput(''); }} className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-neutral-400">{t('management.delete_confirm')}</p>
              <ul className="space-y-2">
                {(['delete_consequence_1', 'delete_consequence_2', 'delete_consequence_3'] as const).map(key => (
                  <li key={key} className="flex items-center gap-2.5 text-xs text-neutral-500">
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />{t(`management.${key}`)}
                  </li>
                ))}
              </ul>
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs text-neutral-400">
                  {t('management.delete_type_to_confirm')}{' '}
                  <span className="font-mono font-semibold text-neutral-200">{team.name}</span>
                </label>
                <input value={deleteInput} onChange={ev => setDeleteInput(ev.target.value)} placeholder={team.name} autoFocus
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-[4px] text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowDeleteModal(false); setDeleteInput(''); }}
                className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-[4px] transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleConfirmDelete} disabled={deleteInput !== team.name || isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-[4px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {isDeleting ? '…' : t('management.delete_cta')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
