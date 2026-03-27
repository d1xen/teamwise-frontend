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
import DashboardPage from "@/pages/team/DashboardPage";
import ManagementPage from "@/pages/team/ManagementPage";
import ScrimsPage from "@/pages/team/ScrimsPage";
import ResultsPage from "@/pages/team/ResultsPage";
import StratbookPage from "@/pages/team/StratbookPage";
import StatsPage from "@/pages/team/StatsPage";
import MatchesPage from "@/pages/team/MatchesPage";
import CompetitionsPage from "@/pages/team/CompetitionsPage";
import MessagingPage from "@/pages/team/MessagingPage";
import DemoPage from "@/pages/team/DemoPage";
import FaceitPopupCallbackPage from "@/pages/auth/FaceitPopupCallbackPage";
import ErrorPage from "@/shared/components/ErrorPage";

const appRouter = createBrowserRouter([
    // ROOT
    { path: "/", element: <RootRedirect /> },

    // PUBLIC
    { path: "/login", element: <LoginPage /> },
    { path: "/login-success", element: <LoginSuccessPage /> },
    { path: "/faceit/popup-callback", element: <FaceitPopupCallbackPage /> },
    { path: "/invite/:token", element: <InvitationPage /> },
    { path: "/terms", element: <TermsOfServicePage /> },

    // AUTH REQUIRED
    {
        element: <RequireAuth />,
        errorElement: <ErrorPage variant="500" />,
        children: [
            {
                element: <AppLayout />,
                errorElement: <ErrorPage variant="500" />,
                children: [
                    {
                        path: "/terms-auth",
                        element: <Navigate to="/terms" replace />,
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
                                        element: <DashboardPage />,
                                    },
                                    {
                                        path: "dashboard",
                                        element: <DashboardPage />,
                                    },
                                    {
                                        path: "team",
                                        element: <TeamPage />,
                                    },
                                    {
                                        path: "agenda",
                                        element: <AgendaPage />,
                                    },
                                    {
                                        path: "agenda/event/:eventId",
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
                                        path: "matches/:matchId",
                                        element: <MatchesPage />,
                                    },
                                    {
                                        path: "competitions",
                                        element: <CompetitionsPage />,
                                    },
                                    {
                                        path: "competitions/:competitionId",
                                        element: <CompetitionsPage />,
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
                                        path: "stratbook/:stratId",
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
                                    {
                                        path: "demo",
                                        element: <DemoPage />,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },

    // 404 — catch all unmatched routes
    { path: "*", element: <ErrorPage variant="404" /> },
]);

export default appRouter;
