import { useAgenda } from "@/contexts/agenda/useAgenda.ts";
import type { AgendaEvent } from "@/contexts/agenda/agenda.types.ts";

export default function AgendaPage() {
    const { events, isLoading } = useAgenda();

    if (isLoading) {
        return <div className="text-white">Loading agenda…</div>;
    }

    if (events.length === 0) {
        return (
            <div className="text-gray-400 text-center mt-20">
                No events scheduled yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.map((event: AgendaEvent) => (
                <div
                    key={event.id}
                    className="bg-neutral-800 rounded-lg p-4 border border-neutral-700"
                >
                    <div className="font-semibold text-white">
                        {event.title}
                    </div>
                    <div className="text-sm text-gray-400">
                        {new Date(event.startsAt).toLocaleString()}
                    </div>
                    <div className="text-xs mt-1 text-indigo-400">
                        {event.type}
                    </div>
                </div>
            ))}
        </div>
    );
}
