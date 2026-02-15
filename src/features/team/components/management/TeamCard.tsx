import type { Team } from "@/contexts/team/team.types.ts";

type Props = {
    team: Team;
    ownerNickname?: string | undefined;
    selected: boolean;
    onSelect(): void;
};

export default function TeamCard({
                                     team,
                                     ownerNickname,
                                     selected,
                                     onSelect,
                                 }: Props) {
    return (
        <div
            onClick={onSelect}
            className={[
                "bg-neutral-800 border rounded-lg p-6 cursor-pointer transition",
                selected
                    ? "border-indigo-500 bg-indigo-600/10"
                    : "border-neutral-700 hover:border-neutral-500",
            ].join(" ")}
        >
            <h2 className="text-lg font-medium mb-3">
                Team information
            </h2>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-400">Team name</span>
                    <span className="font-medium">{team.name}</span>
                </div>

                {ownerNickname && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Owner</span>
                        <span className="font-medium">
                            {ownerNickname}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
