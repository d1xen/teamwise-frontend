import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Circle, Pencil, X, Save } from 'lucide-react';
import type { UserProfileDto } from '@/api/endpoints/profile.api';
import { updateMyProfile } from '@/api/endpoints/profile.api';
import type { Game } from '@/api/types/team';
import { getValidLinksForGame } from '@/shared/utils/linksUtils';
import { useAuth } from '@/contexts/auth/useAuth';
import {
  FormInput,
  FormSelect,
} from '@/design-system/components/Form';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditableProfileSectionProps {
  profile: UserProfileDto;
  canEdit: boolean;
  game?: Game | undefined;
  onSuccess?: (() => void) | undefined;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'BE', label: '🇧🇪 Belgium' },
  { value: 'CH', label: '🇨🇭 Switzerland' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'ES', label: '🇪🇸 Spain' },
  { value: 'IT', label: '🇮🇹 Italy' },
  { value: 'NL', label: '🇳🇱 Netherlands' },
  { value: 'PT', label: '🇵🇹 Portugal' },
  { value: 'PL', label: '🇵🇱 Poland' },
  { value: 'SE', label: '🇸🇪 Sweden' },
  { value: 'DK', label: '🇩🇰 Denmark' },
  { value: 'FI', label: '🇫🇮 Finland' },
  { value: 'NO', label: '🇳🇴 Norway' },
  { value: 'BR', label: '🇧🇷 Brazil' },
  { value: 'RU', label: '🇷🇺 Russia' },
  { value: 'TR', label: '🇹🇷 Turkey' },
  { value: 'UA', label: '🇺🇦 Ukraine' },
];

const COUNTRY_LABEL: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.value, c.label])
);

// Required fields for profileCompleted (backend logic)
const REQUIRED_FIELDS = ['firstName', 'lastName', 'email'] as const;
// All tracked fields for local completion score
const TRACKED_FIELDS = [
  'firstName', 'lastName', 'email',
  'birthDate', 'countryCode', 'phone',
  'customUsername', 'discord', 'twitter', 'hltv',
] as const;

type TrackedField = typeof TRACKED_FIELDS[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isFilled(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim() !== '';
}

function computeCompletion(
  profile: UserProfileDto,
  validLinks: string[],
): { filled: number; total: number; pct: number; requiredDone: boolean[] } {
  const fields: TrackedField[] = TRACKED_FIELDS.filter((f) => {
    // Only count hltv if game supports it
    if (f === 'hltv') return validLinks.includes('hltv');
    if (f === 'twitter') return validLinks.includes('twitter');
    if (f === 'discord') return validLinks.includes('discord');
    return true;
  });

  const filled = fields.filter((f) => isFilled(profile[f])).length;
  const total = fields.length;
  const pct = total === 0 ? 100 : Math.round((filled / total) * 100);
  const requiredDone = REQUIRED_FIELDS.map((f) => isFilled(profile[f]));
  return { filled, total, pct, requiredDone };
}

function completionColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function completionTextColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-400';
  if (pct >= 40) return 'text-amber-400';
  return 'text-red-400';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  const filled = isFilled(value);
  return (
    <div className="flex items-start gap-2.5 py-2">
      {filled ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-neutral-700 mt-0.5 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
        <p className={`text-sm truncate ${filled ? 'text-neutral-100' : 'text-neutral-600 italic'}`}>
          {filled ? value : '—'}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EditableProfileSection({
  profile: initialProfile,
  canEdit,
  game,
  onSuccess,
}: EditableProfileSectionProps) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  // Local copy so the read view reflects saved data immediately without waiting for parent refresh
  const [profile, setProfile] = useState<UserProfileDto>(initialProfile);

  const validLinks = getValidLinksForGame(game);
  const { filled, total, pct, requiredDone } = computeCompletion(profile, validLinks);

  // ── Form state ────────────────────────────────────────────────────────────

  const [formData, setFormData] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    customUsername: profile.customUsername || '',
    email: profile.email || '',
    phone: profile.phone || '',
    birthDate: profile.birthDate || '',
    address: profile.address || '',
    zipCode: profile.zipCode || '',
    city: profile.city || '',
    countryCode: profile.countryCode || '',
    discord: profile.discord || '',
    twitter: profile.twitter || '',
    hltv: profile.hltv || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = t('profile.first_name_required');
    if (!formData.lastName.trim()) newErrors.lastName = t('profile.last_name_required');
    if (!formData.email.trim()) newErrors.email = t('profile.email_required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('profile.email_invalid');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const updated = await updateMyProfile({
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        email: formData.email || null,
        customUsername: formData.customUsername || null,
        birthDate: formData.birthDate || null,
        countryCode: formData.countryCode || null,
        address: formData.address || null,
        zipCode: formData.zipCode || null,
        city: formData.city || null,
        phone: formData.phone || null,
        discord: formData.discord || null,
        twitter: formData.twitter || null,
        hltv: formData.hltv || null,
      });
      // Update local profile so read view reflects new data immediately
      setProfile(updated);
      // Sync profileCompleted status to AuthContext so the badge in the nav updates
      if (updated.profileCompleted !== undefined) {
        updateUser({ profileCompleted: updated.profileCompleted });
      }
      toast.success(t('profile.save_profile'));
      setIsDirty(false);
      setIsEditing(false);
      onSuccess?.();
    } catch {
      toast.error(t('profile.update_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to last saved state (local profile, not initial prop)
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      customUsername: profile.customUsername || '',
      email: profile.email || '',
      phone: profile.phone || '',
      birthDate: profile.birthDate || '',
      address: profile.address || '',
      zipCode: profile.zipCode || '',
      city: profile.city || '',
      countryCode: profile.countryCode || '',
      discord: profile.discord || '',
      twitter: profile.twitter || '',
      hltv: profile.hltv || '',
    });
    setErrors({});
    setIsDirty(false);
    setIsEditing(false);
  };

  // ── Read view ─────────────────────────────────────────────────────────────

  if (!isEditing) {
    return (
      <div className="space-y-4">

        {/* ── Identity card ── */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={profile.avatarUrl ?? ''}
                alt={profile.nickname}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-neutral-700"
              />
              {/* Verified overlay dot */}
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-neutral-900 ${profile.profileCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>

            {/* Name + status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white truncate">{profile.nickname}</h2>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  profile.profileCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {profile.profileCompleted ? (
                    <><CheckCircle2 className="w-3 h-3" />{t('profile.verified')}</>
                  ) : (
                    <><Circle className="w-3 h-3" />{t('profile.not_verified')}</>
                  )}
                </span>
              </div>
              {profile.customUsername && (
                <p className="text-sm text-neutral-400 mt-0.5">@{profile.customUsername}</p>
              )}
              <p className="text-xs text-neutral-600 mt-1">{profile.steamId}</p>
            </div>

            {/* Edit button */}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white text-sm font-medium transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                {t('profile.edit') ?? 'Edit'}
              </button>
            )}
          </div>

          {/* ── Completion bar ── */}
          <div className="mt-5 pt-5 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-400">
                {t('profile.completion_tooltip') ?? 'Profile completion'}
              </span>
              <span className={`text-xs font-bold ${completionTextColor(pct)}`}>
                {filled}/{total} &middot; {pct}%
              </span>
            </div>

            {/* Bar */}
            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${completionColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Required fields checklist */}
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              {(
                [
                  [0, t('profile.first_name')],
                  [1, t('profile.last_name')],
                  [2, t('profile.email')],
                ] as [number, string][]
              ).map(([i, label]) => (
                <div key={i} className="flex items-center gap-1.5">
                  {requiredDone[i] ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-neutral-600" />
                  )}
                  <span className={`text-xs ${requiredDone[i] ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Field sections ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Identity */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              {t('profile.identity')}
            </p>
            <div className="divide-y divide-neutral-800/60">
              <ProfileField label={t('profile.first_name')} value={profile.firstName} />
              <ProfileField label={t('profile.last_name')} value={profile.lastName} />
              <ProfileField label={t('profile.birth_date')} value={profile.birthDate} />
              <ProfileField label={t('profile.country')} value={profile.countryCode ? (COUNTRY_LABEL[profile.countryCode] ?? profile.countryCode) : null} />
            </div>
          </div>

          {/* Contact */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              {t('profile.contact')}
            </p>
            <div className="divide-y divide-neutral-800/60">
              <ProfileField label={t('profile.email')} value={profile.email} />
              <ProfileField label={t('profile.phone')} value={profile.phone} />
              <ProfileField label={t('profile.address')} value={profile.address} />
              <ProfileField label={`${t('profile.zip_code')} / ${t('profile.city')}`} value={[profile.zipCode, profile.city].filter(Boolean).join(' ')} />
            </div>
          </div>

          {/* Gaming */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              {t('profile.gaming')}
            </p>
            <div className="divide-y divide-neutral-800/60">
              <ProfileField label={t('profile.custom_username')} value={profile.customUsername} />
              {validLinks.includes('discord') && <ProfileField label="Discord" value={profile.discord} />}
              {validLinks.includes('twitter') && <ProfileField label="Twitter" value={profile.twitter} />}
              {validLinks.includes('hltv') && <ProfileField label="HLTV" value={profile.hltv} />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Edit view ─────────────────────────────────────────────────────────────

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/70">
        <div className="flex items-center gap-3">
          <img src={profile.avatarUrl ?? ''} alt={profile.nickname} className="w-9 h-9 rounded-lg object-cover" />
          <div>
            <p className="text-sm font-semibold text-white">{profile.nickname}</p>
            <p className="text-xs text-neutral-500">{t('profile.edit_profile')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-sm transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {t('common.cancel') ?? 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? '…' : (t('common.save') ?? 'Save')}
          </button>
        </div>
      </div>

      {/* Form body */}
      <div className="p-6 space-y-6">

        {/* Identity */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            {t('profile.identity')}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label={t('profile.first_name')}
              placeholder="John"
              value={formData.firstName}
              onChange={(v) => handleChange('firstName', v)}
              error={errors.firstName}
              required
            />
            <FormInput
              label={t('profile.last_name')}
              placeholder="Doe"
              value={formData.lastName}
              onChange={(v) => handleChange('lastName', v)}
              error={errors.lastName}
              required
            />
            <FormInput
              label={t('profile.birth_date')}
              type="date"
              value={formData.birthDate}
              onChange={(v) => handleChange('birthDate', v)}
            />
            <FormSelect
              label={t('profile.country')}
              value={formData.countryCode}
              onChange={(v) => handleChange('countryCode', v)}
              options={COUNTRIES}
              placeholder={t('profile.select_country')}
            />
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            {t('profile.contact')}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label={t('profile.email')}
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(v) => handleChange('email', v)}
              error={errors.email}
              required
            />
            <FormInput
              label={t('profile.phone')}
              placeholder="+33 6 12 34 56 78"
              value={formData.phone}
              onChange={(v) => handleChange('phone', v)}
            />
            <div className="col-span-2">
              <FormInput
                label={t('profile.address')}
                placeholder="123 Main Street"
                value={formData.address}
                onChange={(v) => handleChange('address', v)}
              />
            </div>
            <FormInput
              label={t('profile.zip_code')}
              placeholder="75001"
              value={formData.zipCode}
              onChange={(v) => handleChange('zipCode', v)}
            />
            <FormInput
              label={t('profile.city')}
              placeholder="Paris"
              value={formData.city}
              onChange={(v) => handleChange('city', v)}
            />
          </div>
        </div>

        {/* Gaming */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            {t('profile.gaming')}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label={t('profile.custom_username')}
              placeholder="neo, s1mple…"
              value={formData.customUsername}
              onChange={(v) => handleChange('customUsername', v)}
            />
            {validLinks.includes('discord') && (
              <FormInput
                label="Discord"
                placeholder={t('profile.discord_placeholder')}
                value={formData.discord}
                onChange={(v) => handleChange('discord', v)}
              />
            )}
            {validLinks.includes('twitter') && (
              <FormInput
                label="Twitter"
                placeholder={t('profile.twitter_placeholder')}
                value={formData.twitter}
                onChange={(v) => handleChange('twitter', v)}
              />
            )}
            {validLinks.includes('hltv') && (
              <FormInput
                label="HLTV"
                placeholder={t('profile.hltv_placeholder')}
                value={formData.hltv}
                onChange={(v) => handleChange('hltv', v)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
