import ComingSoonPage from '@/pages/ComingSoonPage';
import { MessagesSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MessagingPage() {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      title={t('pages.messaging.title')}
      subtitle={t('pages.messaging.subtitle')}
      icon={<MessagesSquare className="w-16 h-16 text-sky-500" />}
    />
  );
}

