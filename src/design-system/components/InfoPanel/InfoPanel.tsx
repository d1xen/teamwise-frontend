import React, { useState } from 'react';
import { Edit2, X, Save } from 'lucide-react';

interface InfoPanelHeaderProps {
  title: string;
  subtitle?: string | undefined;
  icon?: React.ReactNode | undefined;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
}

/**
 * InfoPanelHeader - Header uniforme avec titre et actions
 * Affiche les boutons Edit/Save/Cancel selon le mode
 */
export function InfoPanelHeader({
  title,
  subtitle,
  icon,
  canEdit,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  isSaving = false,
  isDirty = true,
}: InfoPanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      {/* Left: Title + Subtitle */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          {icon && <div className="text-indigo-400">{icon}</div>}
          <h1 className="text-2xl font-semibold text-white">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-sm text-neutral-400">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Actions */}
      {canEdit && (
        <div className="flex items-center gap-2 shrink-0">
          {isEditing && (
            <>
              <button
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={onSave}
                disabled={!isDirty || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
          {!isEditing && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface InfoPanelProps {
  title: string;
  subtitle?: string | undefined;
  icon?: React.ReactNode | undefined;
  canEdit: boolean;
  viewContent: React.ReactNode;
  editContent: React.ReactNode;
  onSave: () => Promise<void>;
  isSaving?: boolean;
  isDirty?: boolean;
}

/**
 * InfoPanel - Composant principal qui bascule entre vue et édition
 * Gère l'état du mode et les actions
 */
export function InfoPanel({
  title,
  subtitle,
  icon,
  canEdit,
  viewContent,
  editContent,
  onSave,
  isSaving = false,
  isDirty = true,
}: InfoPanelProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);
  const handleSave = async () => {
    await onSave();
    setIsEditing(false);
  };

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 space-y-6">
      <InfoPanelHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        canEdit={canEdit}
        isEditing={isEditing}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={handleSave}
        isSaving={isSaving}
        isDirty={isDirty}
      />

      <div className="border-t border-neutral-700 pt-6">
        {isEditing ? editContent : viewContent}
      </div>
    </div>
  );
}



