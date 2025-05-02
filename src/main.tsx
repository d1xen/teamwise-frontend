// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import LoginSuccessPage from "./pages/LoginSuccessPage";
import CreateTeamPage from "./pages/CreateTeamPage.tsx";
import './styles/index.css';

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/login-success" element={<LoginSuccessPage />} />
                <Route path="/create-team" element={<CreateTeamPage />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
