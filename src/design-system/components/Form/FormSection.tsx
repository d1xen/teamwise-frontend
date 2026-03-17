import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * FormSection - Section simple et compacte, sans décoration inutile
 */
export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

