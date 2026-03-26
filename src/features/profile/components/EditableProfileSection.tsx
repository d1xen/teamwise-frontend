import { useState, useEffect, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import type { UserProfileDto } from '@/api/endpoints/profile.api';
import { updateMyProfile, uploadAvatar, deleteAvatar } from '@/api/endpoints/profile.api';

import type { Game } from '@/api/types/team';
import { getValidLinksForGame } from '@/shared/config/gameConfig';
import { useAuth } from '@/contexts/auth/useAuth';
import ImageUpload from '@/shared/components/ImageUpload';
import BirthDateSelect from '@/shared/components/BirthDateSelect';
import PhoneInput from '@/shared/components/PhoneInput';
import { getAvatarUrl } from '@/shared/utils/avatarUtils';
import FaceitConnectSection from './FaceitConnectSection';
import DropdownMenu from '@/shared/components/DropdownMenu';
import type { DropdownMenuItem } from '@/shared/components/DropdownMenu';
import { cn } from '@/design-system';

const FaceitInline = FaceitConnectSection as unknown as ComponentType<{
  canEdit: boolean;
  variant: 'inline';
}>;

interface EditableProfileSectionProps {
  profile: UserProfileDto;
  canEdit: boolean;
  game?: Game | undefined;
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

const TIMEZONES = [
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)' },
  { value: 'Europe/Rome', label: 'Rome (CET)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)' },
  { value: 'Europe/Brussels', label: 'Brussels (CET)' },
  { value: 'Europe/Zurich', label: 'Zurich (CET)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET)' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen (CET)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET)' },
  { value: 'Europe/Oslo', label: 'Oslo (CET)' },
  { value: 'Europe/Warsaw', label: 'Warsaw (CET)' },
  { value: 'Europe/Prague', label: 'Prague (CET)' },
  { value: 'Europe/Bucharest', label: 'Bucharest (EET)' },
  { value: 'Europe/Athens', label: 'Athens (EET)' },
  { value: 'Europe/Kiev', label: 'Kyiv (EET)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Chicago', label: 'Chicago (CST)' },
  { value: 'America/Denver', label: 'Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'America/Toronto', label: 'Toronto (EST)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];
const TIMEZONE_LABEL: Record<string, string> = Object.fromEntries(TIMEZONES.map(t => [t.value, t.label]));

// Required fields for profile completion (must match backend UserService.isProfileCompleted)
const REQUIRED_FIELDS = [
  'firstName', 'lastName', 'email', 'birthDate', 'countryCode',
  'phone', 'address', 'zipCode', 'city', 'timezone',
] as const;
function isFilled(v: string | null | undefined): boolean {
  return v !== null && v !== undefined && v.trim() !== '';
}

function computeCompletion(profile: UserProfileDto) {
  const filled = REQUIRED_FIELDS.filter(f => isFilled(profile[f])).length;
  const total = REQUIRED_FIELDS.length;
  const pct = Math.round((filled / total) * 100);
  return { filled, total, pct };
}

// ── Circular progress ─────────────────────────────────────────────────────────

function CompletionBadge({ pct, label, completeLabel }: { pct: number; label: string; completeLabel: string }) {
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
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0',
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
        <><CheckCircle2 className="w-3.5 h-3.5" />{completeLabel}</>
      ) : (
        <><span className="text-neutral-400">{label}</span> {pct}%</>
      )}
    </span>
  );
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatDateDisplay(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

// ── Validation ────────────────────────────────────────────────────────────────

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// ── Cell component ────────────────────────────────────────────────────────────

const INPUT_CLS = 'w-full h-7 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-2.5 outline-none placeholder:text-neutral-600 focus:border-indigo-500/50 caret-indigo-400 transition-colors';

function Cell({
  label, value, editing, formValue, onChange, type = 'text', placeholder, full, options, labelMap, locale, defaultCountry, required,
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
  labelMap?: Record<string, string>;
  locale?: string | undefined;
  defaultCountry?: string | undefined;
  required?: boolean | undefined;
}) {
  const displayValue = editing ? formValue : value;
  const filled = isFilled(displayValue);
  const emailError = editing && type === 'email' && formValue && !isValidEmail(formValue);

  const resolvedLabelMap = labelMap ?? (options ? COUNTRY_LABEL : undefined);
  const readValue = type === 'date'
    ? (formatDateDisplay(value, locale ?? 'en') ?? '—')
    : resolvedLabelMap && value
      ? (resolvedLabelMap[value] ?? value)
      : (value || '—');

  // Indicator dot: green=filled, orange=required+empty, no dot=optional
  const dot = required
    ? (filled ? 'bg-emerald-400' : 'bg-amber-400')
    : null;

  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="flex items-center gap-1.5 mb-1">
        {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />}
        <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
        {emailError && <span className="text-[9px] text-red-400">format invalide</span>}
      </div>
      {editing && onChange ? (
        type === 'date' ? (
          <BirthDateSelect value={formValue ?? ''} onChange={onChange} />
        ) : type === 'phone' ? (
          <PhoneInput value={formValue ?? ''} onChange={onChange} defaultCountry={defaultCountry} />
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
  profile: initialProfile, canEdit, game, onSuccess, menuItems,
}: EditableProfileSectionProps & { menuItems?: DropdownMenuItem[] | undefined }) {
  const { t, i18n } = useTranslation();
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfileDto>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when parent provides updated profile (e.g. after re-fetch)
  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  const validLinks = getValidLinksForGame(game);
  const { pct } = computeCompletion(profile);

  const [form, setForm] = useState({
    firstName: profile.firstName ?? '', lastName: profile.lastName ?? '',
    customUsername: profile.customUsername ?? '', email: profile.email ?? '',
    phone: profile.phone ?? '', birthDate: profile.birthDate ?? '',
    address: profile.address ?? '', zipCode: profile.zipCode ?? '',
    city: profile.city ?? '', countryCode: profile.countryCode ?? '',
    discord: profile.discord ?? '', twitter: profile.twitter ?? '',
    hltv: profile.hltv ?? '', timezone: profile.timezone ?? '',
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
        hltv: form.hltv.trim(), timezone: form.timezone,
      });
      setProfile(updated);
      setForm({
        firstName: updated.firstName ?? '', lastName: updated.lastName ?? '',
        customUsername: updated.customUsername ?? '', email: updated.email ?? '',
        phone: updated.phone ?? '', birthDate: updated.birthDate ?? '',
        address: updated.address ?? '', zipCode: updated.zipCode ?? '',
        city: updated.city ?? '', countryCode: updated.countryCode ?? '',
        discord: updated.discord ?? '', twitter: updated.twitter ?? '',
        hltv: updated.hltv ?? '', timezone: updated.timezone ?? '',
      });
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
      hltv: profile.hltv ?? '', timezone: profile.timezone ?? '',
    });
    setIsEditing(false);
  };

  const e = isEditing;

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl">
      {/* ── Header ── */}
      <div className="flex items-start gap-4 px-5 py-4 border-b border-neutral-800">
        <div className="relative shrink-0 mt-1">
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
          {/* Row 1: Nickname + Actions */}
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-bold text-white truncate">{profile.nickname}</h2>
            <div className="flex-1" />
            {e ? (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleSave} disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                  {isSaving ? t('common.saving') : t('common.save')}
                </button>
                <button onClick={handleCancel} disabled={isSaving}
                  className="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <DropdownMenu items={[
                ...(canEdit ? [{ label: t('common.edit'), onClick: () => setIsEditing(true) }] as DropdownMenuItem[] : []),
                ...(menuItems ?? []),
              ]} />
            )}
          </div>
          {/* Row 2: Completion + FACEIT */}
          <div className="flex items-center gap-3 flex-wrap">
            <CompletionBadge pct={pct} label={t('profile.profile_completion')} completeLabel={t('profile.verified')} />
            {game === 'CS2' && <FaceitInline canEdit={canEdit} variant="inline" />}
          </div>
        </div>
      </div>

      {/* ── Fields — 3 columns side by side ── */}
      <div className="grid grid-cols-3 divide-x divide-neutral-800">

        {/* Identity */}
        <div className="p-5 space-y-2.5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">{t('profile.identity')}</p>
          <Cell label={t('profile.first_name')} value={profile.firstName} editing={e} formValue={form.firstName} onChange={v => set('firstName', v)} placeholder="John" required />
          <Cell label={t('profile.last_name')} value={profile.lastName} editing={e} formValue={form.lastName} onChange={v => set('lastName', v)} placeholder="Doe" required />
          <Cell label={t('profile.birth_date')} value={profile.birthDate} editing={e} formValue={form.birthDate} onChange={v => set('birthDate', v)} type="date" locale={i18n.language} required />
          <Cell label={t('profile.country')} value={profile.countryCode} editing={e} formValue={form.countryCode} onChange={v => set('countryCode', v)} options={COUNTRIES} placeholder={t('profile.select_country')} required />
          <Cell label={t('profile.custom_username')} value={profile.customUsername} editing={e} formValue={form.customUsername} onChange={v => set('customUsername', v)} placeholder="s1mple, ZywOo…" />
          {profile.createdAt && (
            <Cell label={t('meta.created_label')} value={new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(profile.createdAt))} />
          )}
          <Cell label={t('meta.updated_label')} value={profile.updatedAt ? new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(profile.updatedAt)) : null} />
        </div>

        {/* Contact */}
        <div className="p-5 space-y-2.5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">{t('profile.contact')}</p>
          <Cell label={t('profile.email')} value={profile.email} editing={e} formValue={form.email} onChange={v => set('email', v)} type="email" placeholder="john@example.com" required />
          <Cell label={t('profile.phone')} value={profile.phone} editing={e} formValue={form.phone} onChange={v => set('phone', v)} type="phone" defaultCountry={profile.countryCode ?? undefined} required />
          <Cell label={t('profile.address')} value={profile.address} editing={e} formValue={form.address} onChange={v => set('address', v)} placeholder="123 Main Street" required />
          <Cell label={t('profile.zip_code')} value={profile.zipCode} editing={e} formValue={form.zipCode} onChange={v => set('zipCode', v)} placeholder="75001" required />
          <Cell label={t('profile.city')} value={profile.city} editing={e} formValue={form.city} onChange={v => set('city', v)} placeholder="Paris" required />
          <Cell label={t('profile.timezone')} value={profile.timezone} editing={e} formValue={form.timezone} onChange={v => set('timezone', v)} options={TIMEZONES} labelMap={TIMEZONE_LABEL} placeholder={t('profile.select_timezone')} required />
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
