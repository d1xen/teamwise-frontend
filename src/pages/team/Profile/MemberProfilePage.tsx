import { useEffect, useMemo, useState } from "react";
import {useNavigate, useParams} from "react-router-dom";
import Flag from "react-world-flags";
import { Pencil, ShieldCheck } from "lucide-react";
import { useAuth } from "../../../context/AuthContext.tsx";
import { useTeamContext } from "../../../context/TeamContext.tsx";
import { limitedToast as toast } from "../../../utils/limitedToast.ts";
import faceitIcon from "../../../assets/faceit.svg";
import hltvIcon from "../../../assets/hltv.png";
import { FaTwitter, FaDiscord } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../../components/ui/BackButton.tsx";
import Loader from "../../../components/ui/Loader.tsx";

interface ProfileProps {
    type: "player" | "staff";
}

export default function MemberProfilePage({ type }: ProfileProps) {
    const { t } = useTranslation();
    const { id, teamId } = useParams<{ id: string; teamId: string }>();
    const { user, loading: userLoading } = useAuth();
    const { getMembership } = useTeamContext();

    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const isCurrentUser = user?.steamId === profile?.steamId;
    const currentMembership = teamId ? getMembership(teamId) : null;
    const navigate = useNavigate();

    useEffect(() => {
        if (!id || !user?.steamId) return;

        const endpoint =
            type === "player"
                ? `/api/teams/player-profile/${id}`
                : `/api/teams/staff-profile/${id}`;

        setLoading(true);
        fetch(endpoint)
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(setProfile)
            .catch(() => toast.error(t("profile.load_error")))
            .finally(() => setLoading(false));
    }, [id, user?.steamId, type, t]);

    const canEdit = useMemo(() => {
        if (isCurrentUser) return true;
        if (!currentMembership) return false;
        return currentMembership.role === "MANAGER" || currentMembership.isOwner;
    }, [isCurrentUser, currentMembership]);

    if (userLoading || loading || !user || !profile) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Loader />
            </div>
        );
    }

    return (
        <div className="relative max-w-5xl mx-auto mt-20 px-4">
            <div className="bg-neutral-800 rounded-lg shadow-lg overflow-hidden border border-neutral-700 flex-col md:flex-row flex">
                <div className="absolute">
                    <BackButton />
                </div>
                <div className="bg-neutral-900 p-6 flex items-center justify-center">
                    <img
                        src={profile.playerPictureUrl || profile.staffPictureUrl || profile.avatarUrl}
                        alt={profile.nickname}
                        className="w-40 h-40 object-cover rounded-md border border-neutral-700"
                    />
                </div>

                <div className="relative flex-1 p-8 text-white">
                    {canEdit && (
                        <button
                            onClick={() => navigate(`/app/team/${teamId}/${type}/${profile.steamId}/edit`)}
                            className="absolute top-4 right-4 text-gray-500 opacity-70 hover:opacity-100 hover:text-indigo-400 transition"
                            title={t("profile.edit")}
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    )}

                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            {profile.nickname}
                            {type === "player" && profile.captain && (
                                <span className="text-green-400 text-sm flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4" />
                                    {t("players.captain")}
                                </span>
                            )}
                        </h1>
                    </div>

                    <p className="text-base text-gray-400 mb-6 flex items-center gap-2">
                        <Flag code={profile.nationality} style={{ width: 20, height: 15, borderRadius: 2 }} />
                        {profile.firstName} {profile.lastName}
                    </p>

                    <div className="text-base space-y-4 text-gray-300">
                        <div className="flex justify-between border-b border-neutral-700 pb-2">
                            <span className="font-semibold">{t("common.age")}</span>
                            <span>{profile.age} {t("common.years")}</span>
                        </div>

                        {profile.email && (
                            <div className="flex justify-between border-b border-neutral-700 pb-2">
                                <span className="font-semibold">{t("common.email")}</span>
                                <span>{profile.email}</span>
                            </div>
                        )}

                        {profile.steamId && (
                            <div className="flex justify-between border-b border-neutral-700 pb-2">
                                <span className="font-semibold">SteamID</span>
                                <span className="font-mono text-sm">{profile.steamId}</span>
                            </div>
                        )}

                        {type === "staff" && (
                            <div className="flex justify-between border-b border-neutral-700 pb-2">
                                <span className="font-semibold">{t("staffs.role_label")}</span>
                                <span>{t(`roles.${profile.teamRole}`)}</span>
                            </div>
                        )}

                        {profile.inGameRole && (
                            <div className="flex justify-between border-b border-neutral-700 pb-2">
                                <span className="font-semibold">{t("players.role_label")}</span>
                                <span>{t(`roles.${profile.inGameRole}`)}</span>
                            </div>
                        )}

                        <div className="flex justify-end gap-4 mt-6">
                            {profile.faceit && (
                                <a href={profile.faceit} target="_blank" rel="noopener noreferrer"
                                   className="w-4 h-4 hover:scale-125 transition-transform cursor-pointer">
                                    <img src={faceitIcon} alt="FACEIT" title="FACEIT" className="w-4 h-4" />
                                </a>
                            )}
                            {profile.hltvProfileUrl && (
                                <a href={profile.hltvProfileUrl} target="_blank" rel="noopener noreferrer"
                                   className="w-4 h-4 hover:scale-125 transition-transform cursor-pointer">
                                    <img src={hltvIcon} alt="HLTV" title="HLTV" className="w-4 h-4" />
                                </a>
                            )}
                            {profile.twitter && (
                                <a href={profile.twitter} target="_blank" rel="noopener noreferrer"
                                   className="w-4 h-4 hover:scale-125 transition-transform cursor-pointer">
                                    <FaTwitter title="Twitter" className="w-4 h-4" />
                                </a>
                            )}
                            {profile.discord && (
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(profile.discord);
                                        toast.success(t("common.discord_copied"));
                                    }}
                                    title={t("common.copy_discord")}
                                    className="w-4 h-4 hover:scale-125 transition-transform cursor-pointer"
                                >
                                    <FaDiscord className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
