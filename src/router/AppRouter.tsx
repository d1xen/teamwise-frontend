import { Navigate, createBrowserRouter } from "react-router-dom";

import RequireAuth from "@/router/guards/RequireAuth";
import RootRedirect from "@/router/RootRedirect";

import AppLayout from "@/layouts/AppLayout";
import TeamLayout from "@/layouts/TeamLayout";
import TeamProviderLayout from "@/layouts/TeamProviderLayout";

import LoginPage from "@/features/auth/components/LoginPage";
import LoginSuccessPage from "@/features/auth/components/LoginSuccessPage";
import SelectTeamPage from "@/pages/team/SelectTeamPage";
import CreateTeamPage from "@/pages/team/CreateTeamPage";
import InvitationPage from "@/pages/team/InvitationPage";
import { TermsOfServicePage } from "@/pages/legal/TermsOfServicePage";

import AgendaPage from "@/pages/agenda/AgendaPage";
import TeamPage from "@/pages/team/TeamPage";
import ManagementPage from "@/pages/team/ManagementPage";
import ScrimsPage from "@/pages/team/ScrimsPage";
import ResultsPage from "@/pages/team/ResultsPage";
import StratbookPage from "@/pages/team/StratbookPage";
import StatsPage from "@/pages/team/StatsPage";
import MatchesPage from "@/pages/team/MatchesPage";
import TournamentsPage from "@/pages/team/TournamentsPage";
import MessagingPage from "@/pages/team/MessagingPage";

const appRouter = createBrowserRouter([
    // ROOT
    { path: "/", element: <RootRedirect /> },

    // PUBLIC
    { path: "/login", element: <LoginPage /> },
    { path: "/login-success", element: <LoginSuccessPage /> },
    { path: "/invite/:token", element: <InvitationPage /> },
    { path: "/terms", element: <TermsOfServicePage /> },

    // AUTH REQUIRED
    {
        element: <RequireAuth />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    {
                        path: "/terms-auth",
                        element: <TermsOfServicePage />,
                    },
                    {
                        path: "/select-team",
                        element: <SelectTeamPage />,
                    },
                    {
                        path: "/team/create",
                        element: <CreateTeamPage />,
                    },
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
                                        path: "matches",
                                        element: <MatchesPage />,
                                    },
                                    {
                                        path: "tournaments",
                                        element: <TournamentsPage />,
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
                                    {
                                        path: "messaging",
                                        element: <MessagingPage />,
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
