import { Navigate, createBrowserRouter } from "react-router-dom";
import AutoRedirect from "./pages/home/AutoRedirect";
import LandingPage from "./pages/home/LandingPage";
import LoginSuccessPage from "./pages/auth/LoginSuccessPage";
import CompleteProfilePage from "./pages/auth/CompleteProfilePage";
import CreateTeamPage from "./pages/create/CreateTeamPage";
import ProtectedLayout from "./ProtectedLayout";
import AppLayout from "./components/layout/AppLayout";
import ProtectedHomePage from "./pages/home/HomePage";
import ManagementPage from "./pages/team/ManagementPage";
import PlanningPage from "./pages/team/PlanningPage";
import StratbookPage from "./pages/team/StratbookPage";
import StatsPage from "./pages/team/StatsPage";
import PlayersPage from "./pages/team/PlayersPage";

const router = createBrowserRouter([
    { path: "/", element: <AutoRedirect /> },
    { path: "/landing", element: <LandingPage /> },
    { path: "/login-success", element: <LoginSuccessPage /> },
    { path: "/complete-profile", element: <CompleteProfilePage /> },
    {
        path: "/app",
        element: <ProtectedLayout />,
        children: [
            { path: "home", element: <ProtectedHomePage /> },
            { path: "create-team", element: <CreateTeamPage /> },
            {
                path: "team/:teamId",
                element: <AppLayout />,
                children: [
                    { path: "players", element: <PlayersPage /> },
                    { path: "planning", element: <PlanningPage /> },
                    { path: "stratbook", element: <StratbookPage /> },
                    { path: "management", element: <ManagementPage /> },
                    { path: "stats", element: <StatsPage /> },
                ],
            },
        ],
    },
    { path: "*", element: <Navigate to="/" replace /> },
]);

export default router;
