import { useTranslation } from "react-i18next";
import { CalendarPlus, Clock } from "lucide-react";

interface AgendaActionsPanelProps {
    isStaff: boolean;
    onCreateEvent: () => void;
    onDeclareAvailability: () => void;
}

export default function AgendaActionsPanel({ isStaff, onCreateEvent, onDeclareAvailability }: AgendaActionsPanelProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    {t("agenda.actions")}
                </p>
            </div>
            <div className="p-3 space-y-2">
                {isStaff && (
                    <button
                        onClick={onCreateEvent}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-xs font-semibold transition-colors"
                    >
                        <CalendarPlus className="w-4 h-4" />
                        {t("agenda.create_event")}
                    </button>
                )}
                <button
                    onClick={onDeclareAvailability}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/50 text-neutral-300 text-xs font-medium transition-colors"
                >
                    <Clock className="w-4 h-4" />
                    {t("agenda.declare_unavailability")}
                </button>
            </div>
        </div>
    );
}
