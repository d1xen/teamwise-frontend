import ComingSoonPage from '@/pages/ComingSoonPage';
import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ResultsPage() {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      title={t("pages.results.title")}
      subtitle={t("pages.results.subtitle")}
      icon={<Trophy className="w-16 h-16 text-amber-500" />}
    />
  );
}

