import ComingSoonPage from '@/pages/ComingSoonPage';
import { Crosshair } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MatchesPage() {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      title={t('pages.matches.title')}
      subtitle={t('pages.matches.subtitle')}
      icon={<Crosshair className="w-16 h-16 text-cyan-500" />}
    />
  );
}

