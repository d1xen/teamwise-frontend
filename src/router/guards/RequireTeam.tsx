import { Navigate, Outlet, useParams } from "react-router-dom";

export default function RequireTeam() {
    const { teamId } = useParams();

    if (!teamId) {
        return <Navigate to="/select-team" replace />;
    }

    return <Outlet />;
}
