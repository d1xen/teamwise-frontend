import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormField - Wrapper pour un champ de formulaire en mode édition
 * Affiche le label, le champ input, et les erreurs
 *
 * Usage:
 * <FormField label="Email" required error={errors.email}>
 *   <input type="email" value={form.email} onChange={...} />
 * </FormField>
 */
export function FormField({
  label,
  error,
  required = false,
  disabled = false,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <label className="block text-xs text-neutral-400 font-medium uppercase tracking-wide mb-2.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        {children}
        {error && (
          <p className="text-xs text-red-400 mt-1.5">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

interface FormFieldGroupProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * FormFieldGroup - Groupe de champs en grille
 */
export function FormFieldGroup({ children, columns = 2, className = '' }: FormFieldGroupProps) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-4 ${className}`}>
      {children}
    </div>
  );
}

interface FormActionsProps {
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

/**
 * FormActions - Boutons Save/Cancel uniformes
 */
export function FormActions({
  onSave,
  onCancel,
  isSaving = false,
  isDirty = true,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
}: FormActionsProps) {
  return (
    <div className="flex items-center gap-3 pt-6 border-t border-neutral-700">
      <button
        onClick={onCancel}
        className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {cancelLabel}
      </button>
      <button
        onClick={onSave}
        disabled={!isDirty || isSaving}
        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving...' : saveLabel}
      </button>
    </div>
  );
}



