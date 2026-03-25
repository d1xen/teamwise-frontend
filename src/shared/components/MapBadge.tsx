import { useState } from "react";
import { cn } from "@/design-system";
import { getMapLabel, getMapImageUrl } from "@/shared/config/gameConfig";
import type { Game } from "@/api/types/team";

const SIZES = {
    sm: "w-9 h-9 rounded-md text-[10px]",
    md: "w-14 h-14 rounded-xl text-xs",
    lg: "w-20 h-20 rounded-2xl text-sm",
    /** Fixed card-size badge */
    card: "w-20 h-20 rounded-xl text-xs",
};

interface MapBadgeProps {
    map: string;
    game?: Game;
    size?: "sm" | "md" | "lg" | "card";
    className?: string | undefined;
}

export default function MapBadge({ map, game, size = "md", className }: MapBadgeProps) {
    const [imgError, setImgError] = useState(false);
    const label = getMapLabel(map, game);
    const imageUrl = getMapImageUrl(map, game);

    return (
        <div className={cn(
            "flex-shrink-0 overflow-hidden flex items-center justify-center relative",
            SIZES[size],
            className
        )}>
            {!imgError ? (
                <img
                    src={imageUrl}
                    alt={label}
                    onError={() => setImgError(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-neutral-800 border border-neutral-700 rounded-[inherit] flex items-center justify-center">
                    <span className="font-bold text-neutral-400">{label}</span>
                </div>
            )}
        </div>
    );
}
