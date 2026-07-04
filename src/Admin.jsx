import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AdminAuthLayout from "./component/auth/AdminAuthLayout";
import AdminDashboard from "./component/dashboards/AdminDashboard";
import UserDashboard from "./component/dashboards/UserDashboard";

const Admin = ({ role = "admin" }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [user, setUser]                       = useState(null);
  // Switch-user state
  const [switchedUser, setSwitchedUser]       = useState(null);
  const [isSwitched,   setIsSwitched]         = useState(false);

  const navigate = useNavigate();

  const tokenKey = role === "superadmin" ? "superadmintoken" : "admintoken";
  const dataKey  = role === "superadmin" ? "superadminData"  : "adminData";
  const basePath = role === "superadmin" ? "/superadmin" : "/admin";

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

  // ── Called from SwitchUsersTab after impersonation token is set ─────────────
  const handleSwitchSuccess = () => {
    const raw = localStorage.getItem("mobileUserData");
    if (!raw) return;
    try {
      setSwitchedUser(JSON.parse(raw));
      setIsSwitched(true);
    } catch {}
  };

  // ── Exit impersonation — restore admin session ───────────────────────────────
  const handleExitSwitch = () => {
    // Restore original admin session
    const backupToken = localStorage.getItem("admintoken_backup");
    const backupData  = localStorage.getItem("adminData_backup");
    if (backupToken) localStorage.setItem(tokenKey, backupToken);
    if (backupData)  localStorage.setItem(dataKey,  backupData);

    // Clear user session
    localStorage.removeItem("mobileUserToken");
    localStorage.removeItem("mobileUserData");
    localStorage.removeItem("admintoken_backup");
    localStorage.removeItem("adminData_backup");
    localStorage.removeItem("isAdminSwitch");
    localStorage.removeItem("googleId");

    setSwitchedUser(null);
    setIsSwitched(false);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  // ── Render switched user view ─────────────────────────────────────────────────
  if (isSwitched && switchedUser) {
    return (
      <div className="relative h-dvh overflow-hidden">
        {/* Admin banner — fixed top, above everything */}
        <div
          className="fixed top-0 left-0 right-0 z-[99999] flex items-center justify-between px-4 py-2.5"
          style={{ background: "linear-gradient(90deg, #7c3aed, #4f46e5)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-extrabold">A</span>
            </div>
            <span className="text-white text-xs font-semibold">
              Admin View — Viewing as&nbsp;
              <span className="font-extrabold">{switchedUser.name || switchedUser.email}</span>
            </span>
            <span className="text-white/60 text-[10px] hidden sm:inline">
              · {switchedUser.email}
            </span>
          </div>
          <button
            onClick={handleExitSwitch}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
          >
            ✕ Exit &amp; Return to Admin
          </button>
        </div>
        {/* Push content down by banner height */}
        <div className="pt-10 h-dvh overflow-hidden">
          <UserDashboard
            user={switchedUser}
            onLogout={handleExitSwitch}
          />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          isAuthenticated
            ? <AdminDashboard
                user={user}
                onLogout={handleLogout}
                onSwitchSuccess={handleSwitchSuccess}
              />
            : <Navigate to={`${basePath}/login`} replace />
        }
      />
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
