import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import type { UserProfileDto } from '@/api/endpoints/profile.api';
import { updateMyProfile } from '@/api/endpoints/profile.api';
import type { Game } from '@/api/types/team';
import { getValidLinksForGame } from '@/shared/utils/linksUtils';
import {
  FormContainer,
  FormHeader,
  FormInput,
  FormSelect,
  FormSection,
  FormActions,
} from '@/design-system/components/Form';

interface EditableProfileSectionProps {
  profile: UserProfileDto;
  canEdit: boolean;
  game?: Game | undefined;
  onSuccess?: (() => void) | undefined;
}

const countries = [
  { value: 'FR', label: 'France' },
  { value: 'US', label: 'United States' },
  { value: 'DE', label: 'Germany' },
  { value: 'GB', label: 'United Kingdom' },
];

export default function EditableProfileSection({
  profile,
  canEdit,
  game,
  onSuccess,
}: EditableProfileSectionProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

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
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
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
      const payload = {
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
      };
      await updateMyProfile(payload);
      toast.success(t('profile.saved'));
      setIsDirty(false);
      setIsEditing(false);
      onSuccess?.();
    } catch {
      toast.error(t('profile.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <FormContainer>
        <FormHeader
          title={t('profile.user_profile')}
          subtitle={t('profile.manage_your_profile')}
          action={
            canEdit ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Edit
              </button>
            ) : undefined
          }
        />

        <FormSection title="Personal Information">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Prénom</p>
            <p className="text-neutral-100 text-sm">{profile.firstName || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Nom</p>
            <p className="text-neutral-100 text-sm">{profile.lastName || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Email</p>
            <p className="text-neutral-100 text-sm break-all">{profile.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Pseudo</p>
            <p className="text-neutral-100 text-sm">{profile.customUsername || '-'}</p>
          </div>
        </FormSection>

        <FormSection title="Contact">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Téléphone</p>
            <p className="text-neutral-100 text-sm">{profile.phone || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Date de naissance</p>
            <p className="text-neutral-100 text-sm">{profile.birthDate || '-'}</p>
          </div>
        </FormSection>

        <FormSection title="Location">
          <div className="col-span-2">
            <p className="text-xs text-neutral-500 mb-1">Adresse</p>
            <p className="text-neutral-100 text-sm">{profile.address || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">CP</p>
            <p className="text-neutral-100 text-sm">{profile.zipCode || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Ville</p>
            <p className="text-neutral-100 text-sm">{profile.city || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Pays</p>
            <p className="text-neutral-100 text-sm">{profile.countryCode || '-'}</p>
          </div>
        </FormSection>

        {getValidLinksForGame(game).length > 0 && (
          <FormSection title="Social">
            {getValidLinksForGame(game).map((linkType) => {
              const value = linkType === 'discord' ? profile.discord : linkType === 'twitter' ? profile.twitter : profile.hltv;
              return (
                <div key={linkType} className="col-span-2">
                  <p className="text-xs text-neutral-500 mb-1">{linkType.toUpperCase()}</p>
                  {value ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm break-all">
                      {value}
                    </a>
                  ) : (
                    <p className="text-neutral-500 text-sm">-</p>
                  )}
                </div>
              );
            })}
          </FormSection>
        )}
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <FormHeader title={t('profile.user_profile')} subtitle="Update your information" />

      <FormSection title="Personal Information">
        <FormInput label="Prénom" placeholder="John" value={formData.firstName} onChange={(value) => handleChange('firstName', value)} error={errors.firstName} required />
        <FormInput label="Nom" placeholder="Doe" value={formData.lastName} onChange={(value) => handleChange('lastName', value)} error={errors.lastName} required />
        <FormInput label="Email" type="email" placeholder="john@example.com" value={formData.email} onChange={(value) => handleChange('email', value)} error={errors.email} required />
        <FormInput label="Pseudo" placeholder="john123" value={formData.customUsername} onChange={(value) => handleChange('customUsername', value)} />
      </FormSection>

      <FormSection title="Contact">
        <FormInput label="Téléphone" placeholder="+33 6 12 34 56 78" value={formData.phone} onChange={(value) => handleChange('phone', value)} />
        <FormInput label="Date de naissance" type="date" value={formData.birthDate} onChange={(value) => handleChange('birthDate', value)} />
      </FormSection>

      <FormSection title="Location">
        <div className="col-span-2">
          <FormInput label="Adresse" placeholder="123 Main Street" value={formData.address} onChange={(value) => handleChange('address', value)} />
        </div>
        <FormInput label="CP" placeholder="75001" value={formData.zipCode} onChange={(value) => handleChange('zipCode', value)} />
        <FormInput label="Ville" placeholder="Paris" value={formData.city} onChange={(value) => handleChange('city', value)} />
        <FormSelect label="Pays" value={formData.countryCode} onChange={(value) => handleChange('countryCode', value)} options={countries} placeholder="Select" />
      </FormSection>

      {getValidLinksForGame(game).length > 0 && (
        <FormSection title="Social">
          {getValidLinksForGame(game).includes('discord') && <FormInput label="Discord" placeholder="user#1234" value={formData.discord} onChange={(value) => handleChange('discord', value)} />}
          {getValidLinksForGame(game).includes('twitter') && <FormInput label="Twitter" placeholder="@user" value={formData.twitter} onChange={(value) => handleChange('twitter', value)} />}
          {getValidLinksForGame(game).includes('hltv') && <div className="col-span-2"><FormInput label="HLTV" placeholder="https://hltv.org/..." value={formData.hltv} onChange={(value) => handleChange('hltv', value)} /></div>}
        </FormSection>
      )}

      <FormActions
        onCancel={() => {
          setIsEditing(false);
          setFormData({ firstName: profile.firstName || '', lastName: profile.lastName || '', customUsername: profile.customUsername || '', email: profile.email || '', phone: profile.phone || '', birthDate: profile.birthDate || '', address: profile.address || '', zipCode: profile.zipCode || '', city: profile.city || '', countryCode: profile.countryCode || '', discord: profile.discord || '', twitter: profile.twitter || '', hltv: profile.hltv || '' });
          setErrors({});
          setIsDirty(false);
        }}
        onSave={handleSave}
        isDirty={isDirty}
        isSaving={isSaving}
      />
    </FormContainer>
  );
}
