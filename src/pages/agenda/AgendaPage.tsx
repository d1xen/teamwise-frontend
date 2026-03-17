import { useTranslation } from 'react-i18next';
import { useAgenda } from "@/contexts/agenda/useAgenda";
import type { AgendaEvent } from "@/contexts/agenda/agenda.types";
import { Card } from '@/design-system/components/Card';
import { Button } from '@/design-system/components';
import { Calendar, Plus, Clock } from 'lucide-react';
import FeatureHeader from '@/shared/components/FeatureHeader';
import FeatureBody from '@/shared/components/FeatureBody';
import { useMinimumLoader } from '@/shared/hooks/useMinimumLoader';

export default function AgendaPage() {
    const { t } = useTranslation();
    const { events, isLoading } = useAgenda();
    const showLoader = useMinimumLoader(isLoading, 800);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <FeatureHeader
                title={t("pages.planning.title")}
                subtitle="Gérez vos événements, scrims et compétitions"
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                <FeatureBody>
                    {showLoader ? (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-neutral-400">{t('common.loading')}</p>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <Calendar className="w-16 h-16 text-neutral-600 mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Aucun événement planifié
                            </h3>
                            <p className="text-sm text-neutral-400 mb-6">
                                Commencez par créer votre premier événement
                            </p>
                            <Button variant="primary">
                                <Plus className="w-4 h-4" />
                                Créer un événement
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.map((event: AgendaEvent) => (
                                <Card key={event.id} hover>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-indigo-500/10 rounded-lg">
                                            <Clock className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white mb-1">
                                                {event.title}
                                            </h3>
                                            <p className="text-sm text-neutral-400">
                                                {new Date(event.startsAt).toLocaleString('fr-FR', {
                                                    dateStyle: 'full',
                                                    timeStyle: 'short'
                                                })}
                                            </p>
                                            {event.description && (
                                                <p className="text-sm text-neutral-300 mt-2">
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </FeatureBody>
            </div>
        </div>
    );
}
