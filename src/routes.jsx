import React from "react";
import { Routes, Route } from 'react-router-dom'
import OrganizerDashboard from "./pages/OrganizerDashboard";
import UserDashboard from "./pages/UserDashboard";
import LandingPage from "./pages/LandingPage";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/organizer" element={<OrganizerDashboard />} />
        </Routes>
    )
}