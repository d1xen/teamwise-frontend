import ComingSoonPage from '@/pages/ComingSoonPage';
import { BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StratbookPage() {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      title={t("pages.stratbook.title")}
      subtitle={t("pages.stratbook.subtitle")}
      icon={<BookOpen className="w-16 h-16 text-purple-500" />}
    />
  );
}

