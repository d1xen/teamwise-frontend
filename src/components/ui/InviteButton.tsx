// InviteButton.tsx
import { toast } from "react-hot-toast";

export interface InviteButtonProps {
    isStaff: boolean;
    isOwner: boolean;
    onClick: () => void;
    inviteGenerated: boolean;
}

export default function InviteButton({
                                         isStaff,
                                         isOwner,
                                         onClick,
                                         inviteGenerated,
                                     }: InviteButtonProps) {
    const disabled = !isStaff && !isOwner;

    const handleClick = () => {
        if (disabled) {
            toast.error("Seuls le staff ou les propriétaires peuvent générer une invitation.");
            return;
        }
        onClick();
    };

    return (
        <div className="ml-4">
            <button
                onClick={handleClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition font-medium text-white ${
                    inviteGenerated
                        ? "bg-green-600 hover:bg-green-500"
                        : "bg-indigo-600 hover:bg-indigo-500"
                }`}
            >
                <span className="text-sm">
                    {inviteGenerated ? "Lien copié !" : "Générer un lien d'invitation"}
                </span>
            </button>
        </div>
    );
}
