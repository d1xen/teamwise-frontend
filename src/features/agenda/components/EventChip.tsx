import { cn } from "@/design-system";
import type { EventDto } from "@/api/types/agenda";
import { TYPE_COLORS, CUSTOM_SUBTYPE_COLORS } from "@/features/agenda/constants/eventColors";

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
                "w-full text-left rounded-[4px] border transition-all hover:brightness-125 overflow-hidden relative flex flex-col",
                allDay ? (compact ? "px-1 py-px text-[9px] h-[18px] justify-center" : "px-1.5 py-0.5 text-[10px]") : compact ? "px-1 py-px text-[9px] h-[18px] justify-center" : "h-full px-1.5 py-1 text-[11px]",
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
                        <span className="ml-1 font-medium opacity-80">
                            {event.match?.opponentName ? `vs ${event.match.opponentName}` : event.title}
                        </span>
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

