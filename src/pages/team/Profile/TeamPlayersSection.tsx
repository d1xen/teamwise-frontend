interface Player {
    id: number;
    nickname: string;
    playerPictureUrl: string;
    nationality: string;
}

export const TeamPlayersSection: React.FC<{ players: Player[] }> = ({ players }) => {
    if (!players || players.length === 0) return null;

    return (
        <div className="mb-10 text-white">
            <div className="flex justify-center flex-wrap gap-10">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className="flex flex-col items-center w-32 text-center"
                    >
                        {/* Photo */}
                        <div className="w-34 h-34 rounded-md overflow-hidden bg-neutral-800">
                            <img
                                src={player.playerPictureUrl}
                                alt={player.nickname}
                                className="w-[136px] h-[136px] object-cover"
                                style={{backgroundColor: '#111', objectFit: "cover"}}
                            />
                        </div>

                        {/* Nationalité + pseudo */}
                        <div
                            className="mt-2 flex items-center justify-center gap-1 font-semibold text-sm max-w-full truncate">
                            {player.nationality && (
                                <img
                                    src={`https://flagcdn.com/h20/${player.nationality.toLowerCase()}.png`}
                                    alt={player.nationality}
                                    className="w-4 h-3 rounded-sm"
                                />
                            )}
                            <span>{player.nickname}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
