import { cn } from "@/design-system";
import type { EventDto } from "@/api/types/agenda";

const TYPE_COLORS: Record<string, string> = {
    MATCH:      "bg-blue-500/20 text-blue-300 border-blue-500/30",
    MEETING:    "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    STRAT_TIME: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
    REST:       "bg-neutral-500/10 text-neutral-400 border-neutral-600/30 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(115,115,115,0.08)_4px,rgba(115,115,115,0.08)_8px)]",
    CUSTOM:     "bg-neutral-700/30 text-neutral-300 border-neutral-600/30",
};

const CUSTOM_SUBTYPE_COLORS: Record<string, string> = {
    LAN:        "bg-orange-500/15 text-orange-300 border-orange-500/25",
    TOURNAMENT: "bg-red-500/15 text-red-300 border-red-500/25",
    QUALIFIER:  "bg-amber-500/15 text-amber-300 border-amber-500/25",
    VACATION:   "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
    TRAVEL:     "bg-violet-500/15 text-violet-300 border-violet-500/25",
};

function getColors(event: EventDto): string {
    if (event.type === "CUSTOM" && event.tags) {
        return CUSTOM_SUBTYPE_COLORS[event.tags] ?? TYPE_COLORS.CUSTOM;
    }
    return TYPE_COLORS[event.type] ?? TYPE_COLORS.CUSTOM;
}

interface EventChipProps {
    event: EventDto;
    allDay?: boolean;
    compact?: boolean;
    /** Where to anchor text when event is stacked behind others */
    textAlign?: "top" | "bottom";
    onClick?: () => void;
}

export default function EventChip({ event, allDay, compact, textAlign = "top", onClick }: EventChipProps) {
    const colors = getColors(event);
    const time = new Date(event.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full h-full text-left rounded-[4px] border transition-all hover:brightness-125 overflow-hidden relative flex flex-col",
                allDay ? "px-1.5 py-0.5 text-[10px]" : compact ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-1 text-[11px]",
                textAlign === "bottom" && "justify-end",
                colors
            )}
        >
            <div className="truncate">
                {allDay ? (
                    <span className="font-semibold">{event.title}</span>
                ) : (
                    <>
                        <span className="font-semibold">{time}</span>
                        {!compact && (
                            <span className="ml-1 font-medium">
                                {event.match?.opponentName ? `vs ${event.match.opponentName}` : event.title}
                            </span>
                        )}
                    </>
                )}
            </div>
            {!allDay && !compact && event.match?.result && (
                <div className="text-[9px] opacity-70 truncate">
                    {event.match.maps.filter(m => m.ourScore != null).map(m => `${m.ourScore}-${m.theirScore}`).join(" / ")}
                </div>
            )}
        </button>
    );
}

export { TYPE_COLORS, CUSTOM_SUBTYPE_COLORS };
