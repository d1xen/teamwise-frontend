import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import type { Team } from '@/contexts/team/team.types';
import { updateTeam as updateTeamApi } from '@/api/endpoints/team.api';
import type { UpdateTeamRequest } from '@/api/types/team';
import { useTeam } from '@/contexts/team/useTeam';
import {
  FormContainer,
  FormHeader,
  FormInput,
  FormTextarea,
  FormSection,
  FormActions,
} from '@/design-system/components/Form';

interface TeamSettingsPanelProps {
  team: Team;
  canEdit: boolean;
  canInvite: boolean;
}

export default function TeamSettingsPanel({
  team,
  canEdit,
}: TeamSettingsPanelProps) {
  const { t } = useTranslation();
  const { refreshTeam } = useTeam();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: team.name,
    tag: team.tag ?? '',
    logoUrl: team.logoUrl ?? '',
    description: team.description ?? '',
    hltv: team.links?.find((l) => l.type === 'HLTV')?.url ?? '',
    faceit: team.links?.find((l) => l.type === 'FACEIT')?.url ?? '',
    twitter: team.links?.find((l) => l.type === 'TWITTER')?.url ?? '',
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
    if (!formData.name.trim()) newErrors.name = 'Team name required';
    if (!formData.tag.trim()) newErrors.tag = 'Team tag required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const links = [
        formData.hltv && { type: 'HLTV' as const, url: formData.hltv },
        formData.faceit && { type: 'FACEIT' as const, url: formData.faceit },
        formData.twitter && { type: 'TWITTER' as const, url: formData.twitter },
      ].filter(
        (link): link is { type: 'HLTV' | 'FACEIT' | 'TWITTER'; url: string } => Boolean(link)
      );

      const payload: UpdateTeamRequest = {
        name: formData.name,
        ...(formData.tag && { tag: formData.tag }),
        ...(formData.description && { description: formData.description }),
        links,
      };
      await updateTeamApi(team.id, payload);
      toast.success('Team updated!');
      setIsDirty(false);
      setIsEditing(false);
      await refreshTeam();
    } catch {
      toast.error('Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <FormContainer>
        <FormHeader
          title={t('management.teams')}
          subtitle="Manage your team settings"
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

        <FormSection title="Team Info">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Name</p>
            <p className="text-neutral-100 text-sm font-medium">{team.name}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Tag</p>
            <p className="text-neutral-100 text-sm font-mono">{team.tag || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-neutral-500 mb-1">Game</p>
            <p className="text-neutral-100 text-sm">{team.game || '-'}</p>
          </div>
          {team.logoUrl && (
            <div className="col-span-2">
              <p className="text-xs text-neutral-500 mb-1">Logo</p>
              <img src={team.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
            </div>
          )}
        </FormSection>

        {team.description && (
          <FormSection title="Description">
            <div className="col-span-2">
              <p className="text-neutral-300 text-sm">{team.description}</p>
            </div>
          </FormSection>
        )}

        {team.links && team.links.length > 0 && (
          <FormSection title="Links">
            {team.links.map((link) => (
              <div key={link.type} className="col-span-2">
                <p className="text-xs text-neutral-500 mb-1">{link.type}</p>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm break-all">
                  {link.url}
                </a>
              </div>
            ))}
          </FormSection>
        )}
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <FormHeader title={t('management.teams')} subtitle="Update team settings" />

      <FormSection title="Team Info">
        <FormInput label="Name" placeholder="Team Vitality" value={formData.name} onChange={(value) => handleChange('name', value)} error={errors.name} required />
        <FormInput label="Tag" placeholder="VIT" value={formData.tag} onChange={(value) => handleChange('tag', value)} error={errors.tag} required />
        <div className="col-span-2">
          <p className="text-xs text-neutral-500 mb-1">Game</p>
          <p className="text-neutral-400 text-sm">{team.game} (immutable)</p>
        </div>
        <div className="col-span-2">
          <FormInput label="Logo URL" placeholder="https://..." value={formData.logoUrl} onChange={(value) => handleChange('logoUrl', value)} />
        </div>
      </FormSection>

      <FormSection title="Description">
        <div className="col-span-2">
          <FormTextarea label="Description" placeholder="Describe your team..." value={formData.description} onChange={(value) => handleChange('description', value)} rows={3} />
        </div>
      </FormSection>

      <FormSection title="Links">
        <FormInput label="HLTV" placeholder="https://hltv.org/..." value={formData.hltv} onChange={(value) => handleChange('hltv', value)} />
        <FormInput label="FACEIT" placeholder="https://faceit.com/..." value={formData.faceit} onChange={(value) => handleChange('faceit', value)} />
        <div className="col-span-2">
          <FormInput label="Twitter" placeholder="https://twitter.com/..." value={formData.twitter} onChange={(value) => handleChange('twitter', value)} />
        </div>
      </FormSection>

      <FormActions
        onCancel={() => {
          setIsEditing(false);
          setFormData({
            name: team.name,
            tag: team.tag ?? '',
            logoUrl: team.logoUrl ?? '',
            description: team.description ?? '',
            hltv: team.links?.find((l) => l.type === 'HLTV')?.url ?? '',
            faceit: team.links?.find((l) => l.type === 'FACEIT')?.url ?? '',
            twitter: team.links?.find((l) => l.type === 'TWITTER')?.url ?? '',
          });
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
