import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "./component/auth/AuthLayout";
import UserDashboard from "./component/dashboards/UserDashboard";

const User = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [user, setUser]                       = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("mobileUserToken");
    const raw   = localStorage.getItem("mobileUserData");
    if (token && raw) {
      try {
        setUser(JSON.parse(raw));
        setIsAuthenticated(true);
      } catch {
        clearAuth();
      }
    }
    setIsLoading(false);
  }, []);

  const clearAuth = () => {
    localStorage.removeItem("mobileUserToken");
    localStorage.removeItem("mobileUserData");
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleAuthSuccess = (loginData) => {
    const userData = {
      role:     "mobileuser",
      name:     loginData.name     || "",
      email:    loginData.email    || "",
      clientId: loginData.clientId || "",
      userId:   loginData.userId   || "",
    };
    localStorage.setItem("mobileUserToken", loginData.token);
    localStorage.setItem("mobileUserData",  JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    navigate("/auth/dashboard", { replace: true });
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/auth", { replace: true });
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
    </div>
  );

  return (
    <Routes>
      {/* Login page */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to="/auth/dashboard" replace />
            : <AuthLayout onLogin={handleAuthSuccess} />
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated
            ? <UserDashboard user={user} onLogout={handleLogout} />
            : <Navigate to="/auth" replace />
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
};

export default User;
