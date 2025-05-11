import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link2 } from "lucide-react";

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
    const { t } = useTranslation();
    const disabled = !isStaff && !isOwner;

    const handleClick = () => {
        if (disabled) {
            toast.error(t("invite.permission_error"));
            return;
        }
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`w-fit inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow transition
                ${disabled
                ? "bg-gray-600 cursor-not-allowed text-white/60"
                : inviteGenerated
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
        >
            <Link2 className="w-4 h-4" />
            <span>
                {inviteGenerated
                    ? t("invite.copied")
                    : t("invite.generate")}
            </span>
        </button>
    );
}
