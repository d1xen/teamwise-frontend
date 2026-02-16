import { Navigate, createBrowserRouter } from "react-router-dom";

import RequireAuth from "@/router/guards/RequireAuth";
import RootRedirect from "@/router/RootRedirect";

import AppLayout from "@/layouts/AppLayout";
import TeamLayout from "@/layouts/TeamLayout";
import TeamProviderLayout from "@/layouts/TeamProviderLayout";

import LoginPage from "@/features/auth/components/LoginPage";
import LoginSuccessPage from "@/features/auth/components/LoginSuccessPage";
import SelectTeamPage from "@/pages/team/SelectTeamPage";
import CompleteProfilePage from "@/features/profile/components/CompleteProfilePage";
import CreateTeamPage from "@/pages/team/CreateTeamPage";
import { TermsOfServicePage } from "@/pages/legal/TermsOfServicePage";

import AgendaPage from "@/pages/agenda/AgendaPage";
import TeamPage from "@/pages/team/TeamPage";
import ManagementPage from "@/pages/team/ManagementPage";
import ScrimsPage from "@/pages/team/ScrimsPage";
import ResultsPage from "@/pages/team/ResultsPage";
import StratbookPage from "@/pages/team/StratbookPage";
import StatsPage from "@/pages/team/StatsPage";

const appRouter = createBrowserRouter([
    // ROOT
    { path: "/", element: <RootRedirect /> },

    // PUBLIC
    { path: "/login", element: <LoginPage /> },
    { path: "/login-success", element: <LoginSuccessPage /> },
    { path: "/terms", element: <TermsOfServicePage /> }, // Accessible publiquement aussi

    // AUTH REQUIRED
    {
        element: <RequireAuth />,
        children: [
            // Terms accessible depuis les pages protégées
            {
                path: "/terms-auth",
                element: <TermsOfServicePage />,
            },
            {
                element: <AppLayout />,
                children: [
                    {
                        path: "/complete-profile",
                        element: <CompleteProfilePage />,
                    },
                    {
                        path: "/select-team",
                        element: <SelectTeamPage />,
                    },
                    // CREATE TEAM - Must be BEFORE /team/:teamId
                    {
                        path: "/team/create",
                        element: <CreateTeamPage />,
                    },

                    // TEAM ROUTES with :teamId
                    {
                        path: "/team/:teamId",
                        element: <TeamProviderLayout />,
                        children: [
                            {
                                element: <TeamLayout />,
                                children: [
                                    {
                                        index: true,
                                        element: <TeamPage />,
                                    },
                                    {
                                        path: "agenda",
                                        element: <AgendaPage />,
                                    },
                                    {
                                        path: "management",
                                        element: <ManagementPage />,
                                    },
                                    {
                                        path: "scrims",
                                        element: <ScrimsPage />,
                                    },
                                    {
                                        path: "results",
                                        element: <ResultsPage />,
                                    },
                                    {
                                        path: "stratbook",
                                        element: <StratbookPage />,
                                    },
                                    {
                                        path: "stats",
                                        element: <StatsPage />,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },

    { path: "*", element: <Navigate to="/" replace /> },
]);

export default appRouter;

