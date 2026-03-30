import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Admin from "./Admin";
import User from "./User";
import Client from "./Client";
import Home from "./component/Home";
import PrivacyPolicy from "./component/PrivacyPolicy";
import DataDeletion from "./component/DataDeletion";
import { API_BASE_URL } from "./config";
import "./App.css";

const App = () => {
  // Keep backend alive (free tier)
  useEffect(() => {
    const ping = () => fetch(`${API_BASE_URL}/api/health`).catch(() => {});
    ping();
    const interval = setInterval(ping, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/"               element={<Home />} />
        <Route path="/privacy"        element={<PrivacyPolicy />} />
        <Route path="/data-deletion"  element={<DataDeletion />} />

        {/* User (mobile user) — /auth/* */}
        <Route path="/auth/*"         element={<User />} />

        {/* Client — /login/* */}
        <Route path="/login/*"        element={<Client />} />

        {/* Admin — /admin/* */}
        <Route path="/admin/*"        element={<Admin role="admin" />} />

        {/* Superadmin — /superadmin/* */}
        <Route path="/superadmin/*"   element={<Admin role="superadmin" />} />

        {/* Fallback */}
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
