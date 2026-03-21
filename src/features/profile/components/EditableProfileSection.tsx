import { useState, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { Loader, CheckCircle2 } from 'lucide-react';
import type { UserProfileDto } from '@/api/endpoints/profile.api';
import { updateMyProfile, uploadAvatar, deleteAvatar } from '@/api/endpoints/profile.api';
import type { UserProfileUpdateDto } from '@/api/types/profile';
import type { Game } from '@/api/types/team';
import { getValidLinksForGame } from '@/shared/config/gameConfig';
import { useAuth } from '@/contexts/auth/useAuth';
import ImageUpload from '@/shared/components/ImageUpload';
import { getAvatarUrl } from '@/shared/utils/avatarUtils';
import FaceitConnectSection from './FaceitConnectSection';
import { cn } from '@/design-system';

const FaceitInline = FaceitConnectSection as unknown as ComponentType<{
  canEdit: boolean;
  variant: 'inline';
}>;

interface EditableProfileSectionProps {
  profile: UserProfileDto;
  canEdit: boolean;
  game?: Game;
  onSuccess?: () => void;
}

const COUNTRIES = [
  { value: 'FR', label: 'France' }, { value: 'BE', label: 'Belgium' },
  { value: 'CH', label: 'Switzerland' }, { value: 'DE', label: 'Germany' },
  { value: 'GB', label: 'United Kingdom' }, { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' }, { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' }, { value: 'NL', label: 'Netherlands' },
  { value: 'PT', label: 'Portugal' }, { value: 'PL', label: 'Poland' },
  { value: 'SE', label: 'Sweden' }, { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' }, { value: 'NO', label: 'Norway' },
  { value: 'BR', label: 'Brazil' }, { value: 'RU', label: 'Russia' },
  { value: 'TR', label: 'Turkey' }, { value: 'UA', label: 'Ukraine' },
  { value: 'CZ', label: 'Czech Republic' }, { value: 'RO', label: 'Romania' },
  { value: 'HU', label: 'Hungary' }, { value: 'AU', label: 'Australia' },
];
const COUNTRY_LABEL: Record<string, string> = Object.fromEntries(COUNTRIES.map(c => [c.value, c.label]));

const MONTHS = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' }, { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' }, { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
];

const REQUIRED_FIELDS = ['firstName', 'lastName', 'email'] as const;
const TRACKED_FIELDS = [
  'firstName', 'lastName', 'email', 'birthDate', 'countryCode',
  'phone', 'customUsername', 'discord', 'twitter', 'hltv',
] as const;
type TrackedField = typeof TRACKED_FIELDS[number];

function isFilled(v: string | null | undefined): boolean {
  return v !== null && v !== undefined && v.trim() !== '';
}

function computeCompletion(profile: UserProfileDto, validLinks: string[]) {
  const fields: TrackedField[] = TRACKED_FIELDS.filter(f => {
    if (f === 'hltv') return validLinks.includes('hltv');
    if (f === 'twitter') return validLinks.includes('twitter');
    if (f === 'discord') return validLinks.includes('discord');
    return true;
  });
  const filled = fields.filter(f => isFilled(profile[f])).length;
  const total = fields.length;
  const pct = total === 0 ? 100 : Math.round((filled / total) * 100);
  return { filled, total, pct };
}

// ── Circular progress ─────────────────────────────────────────────────────────

function CompletionBadge({ pct, completeLabel }: { pct: number; completeLabel: string }) {
  const size = 18;
  const stroke = 2;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const complete = pct >= 100;
  const color = complete ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const textColor = complete ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400';
  const borderColor = complete ? 'border-emerald-500/30' : pct >= 40 ? 'border-amber-500/30' : 'border-red-500/30';
  const bgColor = complete ? 'bg-emerald-500/10' : pct >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10';

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0',
      bgColor, borderColor, textColor
    )}>
      {!complete && (
        <svg width={size} height={size} className="rotate-[-90deg] shrink-0">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#262626" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-500" />
        </svg>
      )}
      {complete ? (
        <><CheckCircle2 className="w-3 h-3" />{completeLabel}</>
      ) : (
        <>{pct}%</>
      )}
    </span>
  );
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatDateDisplay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  const month = MONTHS[parseInt(m, 10) - 1];
  return `${parseInt(d, 10)} ${month?.label ?? m} ${y}`;
}

function DateEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = (value || '').split('-');
  const year = parts[0] ?? '', month = parts[1] ?? '', day = parts[2] ?? '';
  const update = (y: string, m: string, d: string) => {
    if (y.length === 4 && m && d) onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    else if (!y && !m && !d) onChange('');
  };
  const numCls = 'h-7 text-sm text-center text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] outline-none focus:border-indigo-500/50 caret-indigo-400 transition-colors placeholder:text-neutral-600 tabular-nums';
  const selCls = 'h-7 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-1.5 outline-none focus:border-indigo-500/50 cursor-pointer transition-colors';

  return (
    <div className="flex items-center gap-1.5">
      <input value={day} onChange={e => update(year, month, e.target.value.replace(/\D/g, '').slice(0, 2))}
        placeholder="DD" maxLength={2} className={cn(numCls, 'w-[40px]')} />
      <select value={month} onChange={e => update(year, e.target.value, day)} className={cn(selCls, 'w-[64px]')}>
        <option value="">—</option>
        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <input value={year} onChange={e => update(e.target.value.replace(/\D/g, '').slice(0, 4), month, day)}
        placeholder="YYYY" maxLength={4} className={cn(numCls, 'w-[52px]')} />
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// ── Cell component ────────────────────────────────────────────────────────────

const INPUT_CLS = 'w-full h-7 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-2.5 outline-none placeholder:text-neutral-600 focus:border-indigo-500/50 caret-indigo-400 transition-colors';

function Cell({
  label, value, editing, formValue, onChange, type = 'text', placeholder, full, options,
}: {
  label: string;
  value: string | null | undefined;
  editing?: boolean;
  formValue?: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  full?: boolean;
  options?: { value: string; label: string }[];
}) {
  const displayValue = editing ? formValue : value;
  const filled = isFilled(displayValue);
  const emailError = editing && type === 'email' && formValue && !isValidEmail(formValue);

  const readValue = type === 'date'
    ? (formatDateDisplay(value) ?? '—')
    : options && value
      ? (COUNTRY_LABEL[value] ?? value)
      : (value || '—');

  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
        {emailError && <span className="text-[9px] text-red-400">format invalide</span>}
      </div>
      {editing && onChange ? (
        type === 'date' ? (
          <DateEditor value={formValue ?? ''} onChange={onChange} />
        ) : options ? (
          <select value={formValue ?? ''} onChange={e => onChange(e.target.value)}
            className={cn(INPUT_CLS, 'cursor-pointer')}>
            <option value="">{placeholder ?? '—'}</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input type="text" value={formValue ?? ''} onChange={e => onChange(e.target.value)}
            placeholder={placeholder ?? '—'}
            className={cn(INPUT_CLS, emailError && 'border-red-500/50 focus:border-red-500/50')} />
        )
      ) : (
        <p className={cn('h-7 flex items-center text-sm truncate px-1', filled ? 'text-neutral-200' : 'text-neutral-700')}>
          {readValue}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EditableProfileSection({
  profile: initialProfile, canEdit, game, onSuccess,
}: EditableProfileSectionProps) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfileDto>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);

  const validLinks = getValidLinksForGame(game);
  const { pct } = computeCompletion(profile, validLinks);

  const [form, setForm] = useState({
    firstName: profile.firstName ?? '', lastName: profile.lastName ?? '',
    customUsername: profile.customUsername ?? '', email: profile.email ?? '',
    phone: profile.phone ?? '', birthDate: profile.birthDate ?? '',
    address: profile.address ?? '', zipCode: profile.zipCode ?? '',
    city: profile.city ?? '', countryCode: profile.countryCode ?? '',
    discord: profile.discord ?? '', twitter: profile.twitter ?? '',
    hltv: profile.hltv ?? '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateMyProfile({
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        email: form.email.trim(), customUsername: form.customUsername.trim(),
        birthDate: form.birthDate, countryCode: form.countryCode,
        address: form.address.trim(), zipCode: form.zipCode.trim(),
        city: form.city.trim(), phone: form.phone.trim(),
        discord: form.discord.trim(), twitter: form.twitter.trim(),
        hltv: form.hltv.trim(),
      });
      setProfile(updated);
      if (updated.profileCompleted !== undefined) updateUser({ profileCompleted: updated.profileCompleted });
      toast.success(t('profile.save_profile'));
      setIsEditing(false);
      onSuccess?.();
    } catch { toast.error(t('profile.update_error')); }
    finally { setIsSaving(false); }
  };

  const handleCancel = () => {
    setForm({
      firstName: profile.firstName ?? '', lastName: profile.lastName ?? '',
      customUsername: profile.customUsername ?? '', email: profile.email ?? '',
      phone: profile.phone ?? '', birthDate: profile.birthDate ?? '',
      address: profile.address ?? '', zipCode: profile.zipCode ?? '',
      city: profile.city ?? '', countryCode: profile.countryCode ?? '',
      discord: profile.discord ?? '', twitter: profile.twitter ?? '',
      hltv: profile.hltv ?? '',
    });
    setIsEditing(false);
  };

  const e = isEditing;

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-neutral-800">
        <div className="relative shrink-0">
          {canEdit ? (
            <ImageUpload currentUrl={getAvatarUrl(profile)} alt={profile.nickname} shape="square" size={64} disabled={false}
              onUpload={async (file) => {
                try {
                  const u = await uploadAvatar(file);
                  setProfile(u);
                  updateUser({ profileImageUrl: u.profileImageUrl ?? null, ...(u.profileCompleted !== undefined ? { profileCompleted: u.profileCompleted } : {}) });
                  toast.success(t('profile.avatar_updated'));
                  return u.profileImageUrl ?? u.avatarUrl ?? null;
                } catch { toast.error(t('upload.error_generic')); return null; }
              }}
              onDelete={async () => {
                const u = await deleteAvatar();
                setProfile(u); updateUser({ profileImageUrl: null }); toast.success(t('profile.avatar_deleted'));
              }}
            />
          ) : (
            <ImageUpload currentUrl={getAvatarUrl(profile)} alt={profile.nickname} shape="square" size={64} disabled
              onUpload={async () => null} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-white truncate">{profile.nickname}</h2>
            {game === 'CS2' && <FaceitInline canEdit={canEdit} variant="inline" />}
            <CompletionBadge pct={pct} completeLabel={t('profile.verified')} />
          </div>
        </div>

        {canEdit && (
          e ? (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                {isSaving ? t('common.saving') : t('common.save')}
              </button>
              <button onClick={handleCancel} disabled={isSaving}
                className="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)}
              className="shrink-0 px-3 py-1.5 rounded-[4px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors">
              {t('common.edit')}
            </button>
          )
        )}
      </div>

      {/* ── Fields — 3 columns side by side ── */}
      <div className="grid grid-cols-3 divide-x divide-neutral-800">

        {/* Identity */}
        <div className="p-5 space-y-2.5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">{t('profile.identity')}</p>
          <Cell label={t('profile.first_name')} value={profile.firstName} editing={e} formValue={form.firstName} onChange={v => set('firstName', v)} placeholder="John" />
          <Cell label={t('profile.last_name')} value={profile.lastName} editing={e} formValue={form.lastName} onChange={v => set('lastName', v)} placeholder="Doe" />
          <Cell label={t('profile.birth_date')} value={profile.birthDate} editing={e} formValue={form.birthDate} onChange={v => set('birthDate', v)} type="date" />
          <Cell label={t('profile.country')} value={profile.countryCode} editing={e} formValue={form.countryCode} onChange={v => set('countryCode', v)} options={COUNTRIES} placeholder={t('profile.select_country')} />
          <Cell label={t('profile.custom_username')} value={profile.customUsername} editing={e} formValue={form.customUsername} onChange={v => set('customUsername', v)} placeholder="s1mple, ZywOo…" />
        </div>

        {/* Contact */}
        <div className="p-5 space-y-2.5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">{t('profile.contact')}</p>
          <Cell label={t('profile.email')} value={profile.email} editing={e} formValue={form.email} onChange={v => set('email', v)} type="email" placeholder="john@example.com" />
          <Cell label={t('profile.phone')} value={profile.phone} editing={e} formValue={form.phone} onChange={v => set('phone', v)} placeholder="+33 6 12 34 56 78" />
          <Cell label={t('profile.address')} value={profile.address} editing={e} formValue={form.address} onChange={v => set('address', v)} placeholder="123 Main Street" />
          <Cell label={t('profile.zip_code')} value={profile.zipCode} editing={e} formValue={form.zipCode} onChange={v => set('zipCode', v)} placeholder="75001" />
          <Cell label={t('profile.city')} value={profile.city} editing={e} formValue={form.city} onChange={v => set('city', v)} placeholder="Paris" />
        </div>

        {/* Gaming */}
        <div className="p-5 space-y-2.5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">{t('profile.gaming')}</p>
          {validLinks.includes('discord') && <Cell label="Discord" value={profile.discord} editing={e} formValue={form.discord} onChange={v => set('discord', v)} placeholder={t('profile.discord_placeholder')} />}
          {validLinks.includes('twitter') && <Cell label="Twitter / X" value={profile.twitter} editing={e} formValue={form.twitter} onChange={v => set('twitter', v)} placeholder={t('profile.twitter_placeholder')} />}
          {validLinks.includes('hltv') && <Cell label="HLTV" value={profile.hltv} editing={e} formValue={form.hltv} onChange={v => set('hltv', v)} placeholder={t('profile.hltv_placeholder')} />}
        </div>
      </div>
    </div>
  );
}
