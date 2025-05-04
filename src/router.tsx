import { Navigate, createBrowserRouter } from "react-router-dom";
import LandingPage from "./pages/home/LandingPage.tsx";
import LoginSuccessPage from "./pages/auth/LoginSuccessPage.tsx";
import CompleteProfilePage from "./pages/auth/CompleteProfilePage.tsx";
import CreateTeamPage from "./pages/create/CreateTeamPage.tsx";
import AppLayout from "./components/layout/AppLayout";
import ProtectedHomePage from "./pages/home/HomePage.tsx";
import ProtectedLayout from "./ProtectedLayout";
import ManagementPage from "./pages/team/ManagementPage.tsx";
import PlanningPage from "./pages/team/PlanningPage.tsx";
import StratbookPage from "./pages/team/StratbookPage.tsx";
import StatsPage from "./pages/team/StatsPage.tsx";

const router = createBrowserRouter([
    { path: "/landing", element: <LandingPage /> },
    { path: "/login-success", element: <LoginSuccessPage /> },
    { path: "/complete-profile", element: <CompleteProfilePage /> },
    {
        path: "/",
        element: <ProtectedLayout />,
        children: [
            { path: "home", element: <ProtectedHomePage /> },
            { path: "create-team", element: <CreateTeamPage /> },
            {
                path: "team/:teamId",
                element: <AppLayout />,
                children: [
                    { path: "planning", element: <PlanningPage /> },
                    { path: "stratbook", element: <StratbookPage /> },
                    { path: "management", element: <ManagementPage /> },
                    { path: "stats", element: <StatsPage /> },
                ],
            },
        ],
    },
    { path: "*", element: <Navigate to="/landing" replace /> },
]);

export default router;
