

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LandingApp    from "../landing/LandingApp";
import Admin         from "../Admin";
import Client        from "../Client";
import User          from "../User";
import PrivacyPolicy from "../component/PrivacyPolicy";
import DataDeletion  from "../component/DataDeletion";
import PortalSelect  from "../component/PortalSelect";

const AppRoutes = () => (
  <Routes>

    {/* ─── LANDING WEBSITE ─────────────────────────────── */}
    <Route path="/landingpage"              element={<LandingApp />} />
    <Route path="/landingpage/about"        element={<LandingApp />} />
    <Route path="/landingpage/features"     element={<LandingApp />} />
    <Route path="/landingpage/for-brands"   element={<LandingApp />} />
    <Route path="/landingpage/for-creators" element={<LandingApp />} />
    <Route path="/landingpage/contact"      element={<LandingApp />} />
    <Route path="/landingpage/privacy"      element={<LandingApp />} />

    {/* ─── ADMIN  (/admin/login  /admin/dashboard) ─────── */}
    <Route path="/admin/*"                  element={<Admin role="admin" />} />

    {/* ─── SUPERADMIN (/superadmin/login  /superadmin/dashboard) */}
    <Route path="/superadmin/*"             element={<Admin role="superadmin" />} />

    {/* ─── CLIENT  (/client/login  /client/dashboard) ──── */}
    <Route path="/client/*"                 element={<Client />} />

    {/* ─── USER  (/user/login  /user/dashboard) ─────────── */}
    <Route path="/user/*"                   element={<User />} />

    {/* ─── PORTAL SELECT ───────────────────────────────── */}
    <Route path="/dashboard"                element={<PortalSelect />} />

    {/* ─── LEGAL ───────────────────────────────────────── */}
    <Route path="/privacy"                  element={<PrivacyPolicy />} />
    <Route path="/data-deletion"            element={<DataDeletion />} />

    {/* ─── ROOT + FALLBACK ─────────────────────────────── */}
    <Route path="/"                         element={<Navigate to="/landingpage" replace />} />
    <Route path="*"                         element={<Navigate to="/landingpage" replace />} />

  </Routes>
);

export default AppRoutes;
