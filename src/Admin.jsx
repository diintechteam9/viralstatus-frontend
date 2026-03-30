import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AdminAuthLayout from "./component/auth/AdminAuthLayout";
import AdminDashboard from "./component/dashboards/AdminDashboard";

const Admin = ({ role = "admin" }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [user, setUser]                       = useState(null);
  const navigate = useNavigate();

  const tokenKey = role === "superadmin" ? "superadmintoken" : "admintoken";
  const dataKey  = role === "superadmin" ? "superadminData"  : "adminData";
  const basePath = role === "superadmin" ? "/superadmin"     : "/admin";

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    const raw   = localStorage.getItem(dataKey);
    if (token && raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.role === role || parsed.role === "admin" || parsed.role === "superadmin") {
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
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(dataKey);
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleAuthSuccess = (adminData) => {
    const userData = {
      role:  adminData.role  || role,
      name:  adminData.name  || "",
      email: adminData.email || "",
    };
    localStorage.setItem(tokenKey, adminData.token);
    localStorage.setItem(dataKey,  JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    navigate(`${basePath}/dashboard`, { replace: true });
  };

  const handleLogout = () => {
    clearAuth();
    navigate(`${basePath}/login`, { replace: true });
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <Routes>
      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated
            ? <AdminDashboard user={user} onLogout={handleLogout} />
            : <Navigate to={`${basePath}/login`} replace />
        }
      />

      {/* Login + catch all */}
      <Route
        path="/*"
        element={
          isAuthenticated
            ? <Navigate to={`${basePath}/dashboard`} replace />
            : <AdminAuthLayout onLogin={handleAuthSuccess} />
        }
      />
    </Routes>
  );
};

export default Admin;
