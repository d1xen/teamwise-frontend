export interface AgendaEvent {
    id: string;
    title: string;
    type: "MATCH" | "SCRIM" | "PRACTICE";
    startsAt: string;
    endsAt?: string;
    description?: string;
}

