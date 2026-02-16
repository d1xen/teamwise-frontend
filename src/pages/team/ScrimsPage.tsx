import ComingSoonPage from '@/pages/ComingSoonPage';
import { Swords } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ScrimsPage() {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      title={t("pages.scrims.title")}
      subtitle={t("pages.scrims.subtitle")}
      icon={<Swords className="w-16 h-16 text-indigo-500" />}
    />
  );
}

