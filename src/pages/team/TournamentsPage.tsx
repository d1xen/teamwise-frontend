import ComingSoonPage from '@/pages/ComingSoonPage';
import { Medal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TournamentsPage() {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      title={t('pages.tournaments.title')}
      subtitle={t('pages.tournaments.subtitle')}
      icon={<Medal className="w-16 h-16 text-yellow-500" />}
    />
  );
}

