import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

/**
 * ComingSoonPage - Page placeholder premium pour features à venir
 */
export default function ComingSoonPage({ title, subtitle, icon }: ComingSoonPageProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-neutral-400 mt-2">{subtitle}</p>}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="flex justify-center">
            {icon || <Clock className="w-16 h-16 text-neutral-600" />}
          </div>
          <h2 className="text-xl font-semibold text-white">
            {t('coming_soon.title')}
          </h2>
          <p className="text-sm text-neutral-400">
            {t('coming_soon.subtitle')}
          </p>
        </div>
      </div>
    </div>
  );
}

