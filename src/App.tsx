import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import appRouter from "@/router/AppRouter.tsx";
import React from "react";

export default function App() {
    return (
        <React.StrictMode>
            <AuthProvider>
                <RouterProvider router={appRouter} />
            </AuthProvider>
        </React.StrictMode>
    );
}