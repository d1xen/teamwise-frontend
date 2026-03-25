import faceitSvg from "@/shared/assets/faceit.svg";

interface FaceitIconProps {
    className?: string | undefined;
}

/**
 * FACEIT logo icon. Accepts className like lucide icons (w-4 h-4 etc.)
 */
export default function FaceitIcon({ className = "w-4 h-4" }: FaceitIconProps) {
    return <img src={faceitSvg} alt="" className={className} />;
}
