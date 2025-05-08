import { Navigate, createBrowserRouter } from "react-router-dom";
import AutoRedirect from "./pages/home/AutoRedirect";
import LandingPage from "./pages/home/LandingPage";
import LoginSuccessPage from "./pages/auth/LoginSuccessPage";
import CompleteProfilePage from "./pages/auth/CompleteProfilePage";
import CreateTeamPage from "./pages/create/CreateTeamPage";
import ProtectedLayout from "./ProtectedLayout";
import AppLayout from "./components/layout/AppLayout";
import ProtectedHomePage from "./pages/home/HomePage";

import PlanningPage from "./pages/team/PlanningPage";
import ManagementPage from "./pages/team/ManagementPage";
import StratbookPage from "./pages/team/StratbookPage";
import StatsPage from "./pages/team/StatsPage";
import PlayersPage from "./pages/team/PlayersPage";
import StaffsPage from "./pages/team/StaffsPage";
import ScrimPage from "./pages/team/Scrim";
import ResultsPage from "./pages/team/Results";
import ProfilePage from "./pages/team/Profile/ProfilePage";

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
                    // Joueurs
                    { path: "players", element: <PlayersPage /> },
                    { path: "players/:id", element: <ProfilePage type="player" /> },

                    // Staff
                    { path: "staffs", element: <StaffsPage /> },
                    { path: "staffs/:id", element: <ProfilePage type="staff" /> },

                    // Autres sections
                    { path: "planning", element: <PlanningPage /> },
                    { path: "scrim", element: <ScrimPage /> },
                    { path: "results", element: <ResultsPage /> },
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
