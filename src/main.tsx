import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import appRouter from "./router/AppRouter";
import { AuthProvider } from "./contexts/AuthContext";

import "./styles/globals.css";
import "./i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <AuthProvider>
        <RouterProvider router={appRouter} />
        <Toaster
            position="bottom-right"
            toastOptions={{
                duration: 3000,
                style: {
                    background: "#1f2937",
                    color: "#fff",
                    border: "1px solid #3f3f46",
                    fontSize: "0.875rem",
                },
                success: {
                    iconTheme: { primary: "#4f46e5", secondary: "#fff" },
                },
                error: {
                    iconTheme: { primary: "#ef4444", secondary: "#fff" },
                },
            }}
        />
    </AuthProvider>
);
