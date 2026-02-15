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

import AgendaPage from "@/pages/agenda/AgendaPage";
import TeamPage from "@/pages/team/TeamPage";
import ManagementPage from "@/pages/team/ManagementPage";

const appRouter = createBrowserRouter([
    // ROOT
    { path: "/", element: <RootRedirect /> },

    // PUBLIC
    { path: "/login", element: <LoginPage /> },
    { path: "/login-success", element: <LoginSuccessPage /> },

    // AUTH REQUIRED
    {
        element: <RequireAuth />,
        children: [
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

                    {
                        path: "/team/:teamId",
                        element: <TeamProviderLayout />,
                        children: [
                            {
                                element: <TeamLayout />,
                                children: [
                                    {
                                        path: "team",
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
