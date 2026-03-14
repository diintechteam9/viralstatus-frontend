import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Admin from "./Admin";
import User from "./User";
import Home from "./component/Home";
import ClientDashboard from "./component/dashboards/ClientDashboard";
import Client from "./Client";
import { API_BASE_URL } from "./config";
import "./App.css";

const App = () => {
  useEffect(() => {
    const token = localStorage.getItem("usertoken");
    const admintoken = localStorage.getItem("admintoken");
    console.log("User/Client token:", token);
    console.log("Admin token:", admintoken);
  }, []);

  // Keep Render backend alive (free tier sleeps after 15 min inactivity)
  useEffect(() => {
    const ping = () => fetch(`${API_BASE_URL}/api/health`).catch(() => {});
    ping();
    const interval = setInterval(ping, 14 * 60 * 1000); // every 14 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/*" element={<User />} />
        <Route path="/login/*" element={<Client />} />
        <Route path="/accounts" element={<ClientDashboard />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/superadmin/*" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
