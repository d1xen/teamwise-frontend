import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link2 } from "lucide-react";
import { useRequiredUser } from "../../context/AuthContext";

interface GenerateInvitButtonProps {
    teamId: string;
    isStaff: boolean;
    isOwner: boolean;
}

export default function GenerateInviteButton({ teamId, isStaff, isOwner }: GenerateInvitButtonProps) {
    const { t } = useTranslation();
    const user = useRequiredUser();
    const [inviteGenerated, setInviteGenerated] = useState(false);

    const disabled = !isStaff && !isOwner;

    const handleGenerateInvite = async () => {
        if (disabled || !teamId || !user?.steamId) {
            toast.error(t("management.invite_error"));
            return;
        }

        try {
            const res = await fetch(`/api/invitations?teamId=${teamId}&steamId=${user.steamId}`, {
                method: "POST"
            });

            if (!res.ok) throw new Error();

            const data = await res.json();
            const baseUrl = window.location.origin;
            await navigator.clipboard.writeText(`${baseUrl}/invite/${data.inviteUrl}`);
            setInviteGenerated(true);
            setTimeout(() => setInviteGenerated(false), 1600);
            toast.success(t("management.invite_success"));
        } catch {
            toast.error(t("management.invite_error"));
        }
    };

    return (
        <button
            onClick={handleGenerateInvite}
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
