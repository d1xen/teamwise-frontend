import ComingSoonPage from '@/pages/ComingSoonPage';
import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StatsPage() {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      title={t("pages.stats.title")}
      subtitle={t("pages.stats.subtitle")}
      icon={<BarChart3 className="w-16 h-16 text-green-500" />}
    />
  );
}

