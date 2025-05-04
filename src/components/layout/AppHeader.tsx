import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import teamwiseLogo from '../../assets/TeamWiseLogo.png';

interface AppHeaderProps {
    user: {
        avatarUrl: string;
        nickname: string;
        customUsername?: string;
    };
    onLogout: () => void;
    small?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user, onLogout }) => {
    const { teamId } = useParams();
    const [teamName, setTeamName] = useState<string | null>(null);

    useEffect(() => {
        if (!teamId) {
            setTeamName(null);
            return;
        }

        fetch(`/api/teams/${teamId}`)
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (data?.name) {
                    setTeamName(data.name);
                }
            })
            .catch(() => setTeamName(null));
    }, [teamId]);

    return (
        <header className="w-full h-20 px-6 flex justify-between items-center bg-neutral-900 border-b border-neutral-700">
            <div className="flex-1"/>

            <div className="flex-1 flex justify-center items-center">
                {teamName ? (
                    <h1 className="font-bold tracking-tight text-white text-2xl">{teamName}</h1>
                ) : (
                    <div className="flex items-center gap-2">
                        <img
                            src={teamwiseLogo}
                            alt="TeamWise Logo"
                            className="h-8 object-contain -mt-1"
                        />
                        <span className="text-white text-[28px] font-semibold tracking-tight leading-none">TeamWise</span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex justify-end items-center gap-3">
                <div className="flex items-center gap-3 cursor-pointer px-3 py-1.5 rounded-md hover:bg-neutral-800 transition">
                    <img src={user.avatarUrl} alt={user.nickname} className="w-9 h-9 rounded-full"/>
                    <span className="text-white text-[15px] font-medium">
                        {user.customUsername || user.nickname}
                    </span>
                </div>
                <button
                    onClick={onLogout}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-md transition"
                >
                    Se déconnecter
                </button>
            </div>
        </header>
    );
};
