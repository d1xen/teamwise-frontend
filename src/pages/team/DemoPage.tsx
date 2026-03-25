import ComingSoonPage from '@/pages/ComingSoonPage';
import { MonitorPlay } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DemoPage() {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      title={t("pages.demo.title")}
      subtitle={t("pages.demo.subtitle")}
      icon={<MonitorPlay className="w-16 h-16 text-indigo-500" />}
    />
  );
}
