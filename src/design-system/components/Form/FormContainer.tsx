import React from 'react';

interface FormContainerProps {
  children: React.ReactNode;
}

/**
 * FormContainer - Container épuré, sans trop de décoration
 */
export function FormContainer({ children }: FormContainerProps) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

interface FormHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * FormHeader - Header simple et épuré
 */
export function FormHeader({ title, subtitle, action }: FormHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6 pb-6 border-b border-neutral-800">
      <div className="flex-1">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface FormActionsProps {
  onCancel: () => void;
  onSave: () => void;
  isDirty: boolean;
  isSaving: boolean;
}

/**
 * FormActions - Boutons Cancel/Save compact
 */
export function FormActions({
  onCancel,
  onSave,
  isDirty,
  isSaving,
}: FormActionsProps) {
  return (
    <div className="flex items-center gap-3 pt-6 border-t border-neutral-800 mt-8">
      <button
        onClick={onCancel}
        className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={!isDirty || isSaving}
        className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

