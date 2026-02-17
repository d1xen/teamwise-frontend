import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import FeatureHeader from '@/shared/components/FeatureHeader';

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
      <FeatureHeader title={title} {...(subtitle ? { subtitle } : {})} />

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
