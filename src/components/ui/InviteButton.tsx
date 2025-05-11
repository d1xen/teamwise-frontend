import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

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
                    {inviteGenerated
                        ? t("invite.copied")
                        : t("invite.generate")}
                </span>
            </button>
        </div>
    );
}
