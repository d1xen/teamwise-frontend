import {useParams} from "react-router-dom";
import {useTeamAccessGuard} from "../../hook/useTeamAccessGuard.ts";

export default function ScrimPage() {
    const { teamId } = useParams();
    useTeamAccessGuard(teamId);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-4xl font-bold text-indigo-400 mb-4">Scrim</h1>
            <p className="text-gray-400 text-lg animate-pulse">Coming soon...</p>
        </div>
    );
}