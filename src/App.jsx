import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/index";
import { API_BASE_URL } from "./config";
import "./App.css";

const App = () => {
  // Keep backend alive (free tier ping every 14 min)
  useEffect(() => {
    const ping = () => fetch(`${API_BASE_URL}/api/health`).catch(() => {});
    ping();
    const interval = setInterval(ping, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
