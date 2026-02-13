import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext.tsx";
import { useTeam } from "@/contexts/TeamContext.tsx";

export default function InviteLinkPanel() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { team, membership } = useTeam();

    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Guards stricts (V1)
    if (!user || !team || !membership) {
        return null;
    }

    if (!membership.isOwner) {
        return null;
    }

    const generateInvite = async () => {
        setIsLoading(true);

        try {
            const res = await fetch("/api/invitations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Steam-Id": user.steamId,
                },
                body: JSON.stringify({
                    teamId: team.id,
                }),
            });

            if (!res.ok) {
                throw new Error();
            }

            const data: { inviteUrl: string } = await res.json();

            // 🧠 Backend renvoie un TOKEN → on construit l’URL ici
            const fullUrl = `${window.location.origin}/join?token=${data.inviteUrl}`;

            setInviteUrl(fullUrl);
            toast.success(t("management.invite_generated"));
        } catch {
            toast.error(t("common.error"));
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!inviteUrl) return;

        await navigator.clipboard.writeText(inviteUrl);
        toast.success(t("management.invite_copied"));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">
                {t("management.invitation")}
            </h3>

            {!inviteUrl ? (
                <button
                    onClick={generateInvite}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                >
                    {isLoading
                        ? t("common.loading")
                        : t("management.generate_invite")}
                </button>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <input
                            value={inviteUrl}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm rounded bg-neutral-900 border border-neutral-700"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="px-3 py-2 text-sm rounded bg-green-600 hover:bg-green-500"
                        >
                            {t("common.copy")}
                        </button>
                    </div>

                    <button
                        onClick={generateInvite}
                        disabled={isLoading}
                        className="text-xs text-indigo-400 hover:underline disabled:opacity-50"
                    >
                        {t("management.regenerate_invite")}
                    </button>
                </div>
            )}
        </div>
    );
}
