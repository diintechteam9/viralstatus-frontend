import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import ClientAuthLayout from "./component/auth/ClientAuthLayout";
import ClientDashboard from "./component/dashboards/ClientDashboard";

const Client = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [user, setUser]                       = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("clienttoken");
    const raw   = localStorage.getItem("clientData");
    if (token && raw) {
      try {
        let parsed = JSON.parse(raw);
        if (parsed.role === "client") {
          const hasHexId = parsed._id && /^[a-f0-9]{24}$/i.test(String(parsed._id).trim());
          if (!hasHexId) {
            try {
              const p = jwtDecode(token);
              let mid = null;
              if (p.role === "client" && p.id) mid = String(p.id);
              else if (p.role === "mobileuser" && p.clientObjectId) mid = String(p.clientObjectId);
              if (mid) {
                parsed = { ...parsed, _id: mid };
                localStorage.setItem("clientData", JSON.stringify(parsed));
              }
            } catch {
              /* ignore */
            }
          }
          setUser(parsed);
          setIsAuthenticated(true);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    }
    setIsLoading(false);
  }, []);

  const clearAuth = () => {
    localStorage.removeItem("clienttoken");
    localStorage.removeItem("clientData");
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleAuthSuccess = (loginData) => {
    let mongoClientId = loginData._id || loginData.id;
    if (loginData.token) {
      try {
        const p = jwtDecode(loginData.token);
        if (p.role === "client" && p.id) mongoClientId = p.id;
        else if (p.role === "mobileuser" && p.clientObjectId) mongoClientId = p.clientObjectId;
      } catch {
        /* ignore */
      }
    }
    const userData = {
      role:     "client",
      name:     loginData.name         || loginData.businessName || "",
      email:    loginData.email        || "",
      clientId: loginData.clientId     || "",
      _id:      mongoClientId != null && mongoClientId !== "" ? String(mongoClientId) : "",
    };
    localStorage.setItem("clienttoken", loginData.token);
    localStorage.setItem("clientData",  JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    navigate("/client/dashboard", { replace: true });
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/client/login", { replace: true });
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <Routes>
      {/* Login page */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to="/client/dashboard" replace />
            : <ClientAuthLayout onLogin={handleAuthSuccess} />
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated
            ? <ClientDashboard user={user} onLogout={handleLogout} />
            : <Navigate to="/client/login" replace />
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/client/login" replace />} />
    </Routes>
  );
};

export default Client;
