import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Flag from "react-world-flags";
import { Pencil } from "lucide-react";
import { useAuth } from "../../../context/AuthContext.tsx";
import { useTeamContext } from "../../../context/TeamContext.tsx";
import { toast } from "react-hot-toast";

interface ProfileProps {
    type: "player" | "staff";
}

export default function ProfilePage({ type }: ProfileProps) {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { teamRole } = useTeamContext();
    console.log("Mon rôle dans l'équipe :", teamRole);
    const [profile, setProfile] = useState<any | null>(null);

    useEffect(() => {
        if (!id || !user?.steamId) return;

        const endpoint =
            type === "player"
                ? `/api/teams/player-profile/${id}`
                : `/api/teams/staff-profile/${id}`;

        fetch(endpoint)
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(setProfile)
            .catch(() => toast.error("Impossible de charger le profil."));
    }, [id, user, type]);

    if (!profile) return <div className="text-white p-6">Chargement...</div>;

    const canEdit =
        user?.steamId === profile.steamId ||
        ["OWNER", "MANAGER"].includes(teamRole ?? "");

    return (
        <div className="flex max-w-4xl mx-auto mt-20 bg-neutral-800 rounded-lg shadow-lg overflow-hidden border border-neutral-700">
            {/* Photo à gauche */}
            <div className="bg-neutral-900 p-6 flex items-center justify-center">
            <img
                    src={profile.playerPictureUrl || profile.staffPictureUrl || profile.avatarUrl}
                    alt={profile.nickname}
                    className="w-40 h-40 object-cover rounded-md border border-neutral-700"
                />
            </div>

            {/* Infos à droite */}
            <div className="relative flex-1 p-8 text-white">
                {/* Bouton crayon en haut à droite */}
                {canEdit && (
                    <button
                        className="absolute top-4 right-4 text-gray-500 opacity-70 hover:opacity-100 hover:text-indigo-400 transition"
                        title="Modifier le profil"
                    >
                        <Pencil className="w-4 h-4"/>
                    </button>
                )}

                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold">{profile.nickname}</h1>
                </div>

                <p className="text-base text-gray-400 mb-6 flex items-center gap-2">
                    <Flag code={profile.nationality} style={{width: 20, height: 15, borderRadius: 2}}/>
                    {profile.firstName} {profile.lastName}
                </p>

                <div className="text-base space-y-4 text-gray-300">

                    <div className="flex justify-between border-b border-neutral-700 pb-2">
                        <span className="font-semibold">Âge</span>
                        <span>{profile.age} ans</span>
                    </div>

                    {type === "staff" && (
                        <div className="flex justify-between border-b border-neutral-700 pb-2">
                            <span className="font-semibold">Rôle équipe</span>
                            <span>{profile.teamRole}</span>
                        </div>
                    )}

                    {profile.faceit && (
                        <div className="flex justify-between border-b border-neutral-700 pb-2">
                            <span className="font-semibold">Faceit</span>
                            <span>{profile.faceit}</span>
                        </div>
                    )}

                    {profile.twitter && (
                        <div className="flex justify-between">
                            <span className="font-semibold">Twitter</span>
                            <span>{profile.twitter}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
