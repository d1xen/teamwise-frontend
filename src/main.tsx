import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import "./index.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
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
    </React.StrictMode>
);
