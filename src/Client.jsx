import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ClientAuthLayout from "./component/auth/ClientAuthLayout";
import ClientDashboard from "./component/dashboards/ClientDashboard";

const Client = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const clientToken = sessionStorage.getItem("clienttoken");
      const userData = sessionStorage.getItem("userData");

      if (clientToken && userData) {
        try {
          const parsed = JSON.parse(userData);
          if (parsed.role === "client") {
            setIsAuthenticated(true);
            setUser(parsed);
          } else {
            clearAuth();
          }
        } catch (_) {
          clearAuth();
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const clearAuth = () => {
    sessionStorage.removeItem("clienttoken");
    sessionStorage.removeItem("userData");
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleAuthSuccess = (loginData) => {
    // Clear any previous session before saving new one
    sessionStorage.clear();
    sessionStorage.setItem("clienttoken", loginData.token);
    sessionStorage.setItem(
      "userData",
      JSON.stringify({
        role: "client",
        name: loginData.name,
        email: loginData.email,
        clientId: loginData.clientId || loginData._id,
      })
    );

    setIsAuthenticated(true);
    setUser({ role: "client", name: loginData.name, email: loginData.email });
    navigate("/login/dashboard");
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/login/dashboard" replace />
            ) : (
              <ClientAuthLayout onLogin={handleAuthSuccess} />
            )
          }
        />
        {isAuthenticated ? (
          <Route
            path="/dashboard"
            element={<ClientDashboard user={user} onLogout={handleLogout} />}
          />
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </div>
  );
};

export default Client;


