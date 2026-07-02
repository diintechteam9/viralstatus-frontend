import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "./config";
import AppClientDashboard from "./component/dashboards/AppClientDashboard";

function AppClientLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/apps/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Login failed");
      }
      onLogin(json.data);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 50%, #fff 100%)" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: 32, background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 12px 40px rgba(109,40,217,0.12)" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#4c1d95" }}>App Client Login</h1>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "#6b7280" }}>Sign in to manage your app clients</p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", marginBottom: 16, borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, boxSizing: "border-box" }}
            placeholder="you@company.com"
          />
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>Password</label>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 40px 10px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, boxSizing: "border-box" }}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#7c3aed", fontSize: 12 }}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
          {error && <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "11px 16px", borderRadius: 8, border: "none",
              background: loading ? "#a78bfa" : "linear-gradient(135deg, #6d28d9, #5b21b6)",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const AppClient = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("appClientToken");
    const raw = localStorage.getItem("appClientData");
    if (token && raw) {
      try {
        let parsed = JSON.parse(raw);
        if (parsed.role === "appclient") {
          const hasHexId = parsed._id && /^[a-f0-9]{24}$/i.test(String(parsed._id).trim());
          if (!hasHexId) {
            try {
              const p = jwtDecode(token);
              if (p.role === "appclient" && p.id) {
                parsed = { ...parsed, _id: String(p.id), appId: String(p.appId || p.id) };
                localStorage.setItem("appClientData", JSON.stringify(parsed));
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
    localStorage.removeItem("appClientToken");
    localStorage.removeItem("appClientData");
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleAuthSuccess = (loginData) => {
    const appData = loginData.app || loginData;
    const token = loginData.token;
    let appId = appData.appId || appData._id;
    if (token) {
      try {
        const p = jwtDecode(token);
        if (p.appId) appId = String(p.appId);
        else if (p.id) appId = String(p.id);
      } catch {
        /* ignore */
      }
    }
    const userData = {
      role: "appclient",
      name: appData.name || appData.businessName || "",
      email: appData.email || "",
      _id: appId != null ? String(appId) : "",
      appId: appId != null ? String(appId) : "",
      logoUrl: appData.logoUrl || null,
      businessName: appData.businessName || appData.name || "",
    };
    localStorage.setItem("appClientToken", token);
    localStorage.setItem("appClientData", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    navigate("/appclient/dashboard", { replace: true });
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/appclient/login", { replace: true });
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #ede9fe", borderTopColor: "#6d28d9", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/appclient/dashboard" replace />
            : <AppClientLogin onLogin={handleAuthSuccess} />
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated
            ? <AppClientDashboard user={user} onLogout={handleLogout} />
            : <Navigate to="/appclient/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/appclient/login" replace />} />
    </Routes>
  );
};

export default AppClient;
