import React, { useState, useEffect } from "react";
import {
  FaUser, FaComments, FaCog, FaSignOutAlt, FaBars, FaTimes,
  FaBell, FaHistory, FaQuestionCircle, FaLayerGroup,
  FaTasks, FaWallet, FaNewspaper, FaRobot, FaChevronLeft, FaBook,
  FaChartBar, FaRupeeSign, FaShieldAlt, FaStar, FaBolt,
} from "react-icons/fa";

import UserTab            from "./UserTab.jsx";
import UserCampaignTab    from "./UserCampaignTab";
import UserTask           from "./UserTask.jsx";
import CreditWallet       from "./CreditWallet.jsx";
import UserNewsBlogTasks  from "./UserNewsBlogTasks.jsx";
import UserUGCPage        from "./UserUGCPage.jsx";
import UserTutorialsPage  from "./UserTutorialsPage.jsx";
import KYCFlow            from "./KYCFlow.jsx";
import WithdrawFlow       from "./WithdrawFlow.jsx";
import OverviewPage       from "./OverviewPage.jsx";
import TestimonialsPage   from "./TestimonialsPage.jsx";
import LiveActivityFeed   from "./LiveActivityFeed.jsx";
import HomeBannerSlider   from "./HomeBannerSlider.jsx";

// ── Nav groups ────────────────────────────────────────────────────────────────
const MAIN_NAV = [
  { name: "Overview",          icon: FaChartBar },
  { name: "Campaign",          icon: FaLayerGroup },
  { name: "Task",              icon: FaTasks },
  { name: "News & Blog Tasks", icon: FaNewspaper },
  { name: "Credit Wallet",     icon: FaWallet },
  { name: "Withdraw",          icon: FaRupeeSign },
  { name: "KYC",               icon: FaShieldAlt },
  { name: "UGC Scripts",       icon: FaRobot },
  { name: "Tutorials",         icon: FaBook },
  { name: "Testimonials",      icon: FaStar },
  { name: "Live Activity",     icon: FaBolt },
  { name: "Messages",          icon: FaComments },
  { name: "Notifications",     icon: FaBell },
  { name: "History",           icon: FaHistory },
  { name: "Profile",           icon: FaUser },
];

const BOTTOM_NAV = [
  { name: "Help",     icon: FaQuestionCircle },
  { name: "Settings", icon: FaCog },
];

// ── Placeholder ───────────────────────────────────────────────────────────────
const ComingSoon = ({ name }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
    <span className="text-5xl">🚧</span>
    <p className="text-base font-semibold text-gray-500">{name}</p>
    <p className="text-sm">Coming soon</p>
  </div>
);

// ── Sidebar nav item ──────────────────────────────────────────────────────────
const NavItem = ({ item, active, collapsed, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onClick(item.name)}
      title={collapsed ? item.name : ""}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-150 group relative
        ${active
          ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }
        ${collapsed ? "justify-center px-0" : ""}
      `}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.name}</span>}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="absolute left-14 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg
          opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50
          shadow-lg transition-opacity duration-150">
          {item.name}
        </span>
      )}
    </button>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const UserDashboard = ({ user, onLogout }) => {
  const [collapsed,  setCollapsed]  = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab,  setActiveTab]  = useState(
    () => localStorage.getItem("userDashboardActiveTab") || "Overview"
  );

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) { setCollapsed(false); setMobileOpen(false); }
      else { setMobileOpen(false); }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("userDashboardActiveTab", tab);
    if (isMobile) setMobileOpen(false);
  };

  // Sidebar width values
  const SIDEBAR_FULL      = 240;
  const SIDEBAR_COLLAPSED = 64;
  const sidebarW = isMobile ? SIDEBAR_FULL : (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL);
  const mainML   = isMobile ? 0 : sidebarW;

  const userInitial = (user?.name || user?.email || "U")[0].toUpperCase();

  return (
    <div className="h-dvh max-h-dvh w-full overflow-hidden bg-[#f5f6fa] flex flex-col">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center px-4 gap-3 z-[60] relative">
        {/* Hamburger */}
        <button
          onClick={() => isMobile ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition shrink-0"
        >
          {isMobile
            ? (mobileOpen ? <FaTimes size={17} /> : <FaBars size={17} />)
            : (collapsed   ? <FaBars size={17} />  : <FaChevronLeft size={15} />)
          }
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-extrabold">Y</span>
          </div>
          <span className="font-bold text-gray-800 text-base hidden sm:block">YovoAI</span>
          <span className="text-gray-300 hidden sm:block">·</span>
          <span className="text-sm font-semibold text-gray-600 hidden sm:block">{activeTab}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-semibold text-gray-700">{user?.name || user?.email?.split("@")[0]}</span>
            <span className="text-[11px] text-gray-400">{user?.email}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
            {userInitial}
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition"
            title="Logout"
          >
            <FaSignOutAlt size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ══ BODY (sidebar + main) ════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 relative">

        {/* Mobile overlay */}
        {isMobile && mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-[45]"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ── SIDEBAR ── */}
        <aside
          style={{ width: sidebarW }}
          className={`
            bg-white border-r border-gray-200 flex flex-col shrink-0 z-50
            transition-all duration-300 ease-in-out overflow-hidden
            ${isMobile
              ? `fixed top-14 left-0 h-[calc(100dvh-3.5rem)] shadow-xl ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`
              : "relative h-full"
            }
          `}
        >
          {/* Logo area (collapsed state) */}
          {collapsed && !isMobile && (
            <div className="flex justify-center py-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-white text-xs font-extrabold">Y</span>
              </div>
            </div>
          )}

          {/* Main nav — scrollable */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {!collapsed && !isMobile && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">
                Main Menu
              </p>
            )}
            {MAIN_NAV.map(item => (
              <NavItem
                key={item.name}
                item={item}
                active={activeTab === item.name}
                collapsed={collapsed && !isMobile}
                onClick={handleTabClick}
              />
            ))}
          </nav>

          {/* Bottom nav — pinned */}
          <div className="shrink-0 border-t border-gray-100 py-3 px-2 space-y-0.5">
            {!collapsed && !isMobile && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">
                General
              </p>
            )}
            {BOTTOM_NAV.map(item => (
              <NavItem
                key={item.name}
                item={item}
                active={activeTab === item.name}
                collapsed={collapsed && !isMobile}
                onClick={handleTabClick}
              />
            ))}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 min-h-full">
            {activeTab === "Overview"          && (
              <div className="space-y-4">
                <HomeBannerSlider />
                <OverviewPage />
              </div>
            )}
            {activeTab === "Campaign"          && <UserCampaignTab onGoToTask={() => handleTabClick("Task")} />}
            {activeTab === "Task"              && <UserTask onGoToCampaign={() => handleTabClick("Campaign")} />}
            {activeTab === "News & Blog Tasks" && <UserNewsBlogTasks />}
            {activeTab === "Credit Wallet"     && <CreditWallet />}
            {activeTab === "Withdraw"          && <WithdrawFlow onGoToKYC={() => handleTabClick("KYC")} />}
            {activeTab === "KYC"               && <KYCFlow />}
            {activeTab === "UGC Scripts"       && <UserUGCPage />}
            {activeTab === "Tutorials"         && <UserTutorialsPage />}
            {activeTab === "Testimonials"      && <TestimonialsPage />}
            {activeTab === "Live Activity"     && <LiveActivityFeed />}
            {activeTab === "Profile"           && <UserTab />}
            {activeTab === "Settings"          && <ComingSoon name="Settings" />}
            {activeTab === "Help"              && <ComingSoon name="Help & Support" />}
            {["Messages", "Notifications", "History"].includes(activeTab) && <ComingSoon name={activeTab} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
