import React, { useState, useEffect } from "react";
import {
  FaUser, FaComments, FaCog, FaSignOutAlt, FaBars, FaTimes,
  FaBell, FaHistory, FaQuestionCircle, FaLayerGroup, FaTasks, FaWallet,
} from "react-icons/fa";
import UserTab from "./UserTab.jsx";
import UserCampaignTab from "./UserCampaignTab";
import UserTask from "./UserTask.jsx";
import CreditWallet from "./CreditWallet.jsx";

const NAV_ITEMS = [
  { name: "Campaign",      icon: <FaLayerGroup /> },
  { name: "Task",          icon: <FaTasks /> },
  { name: "Credit Wallet", icon: <FaWallet /> },
  { name: "Messages",      icon: <FaComments /> },
  { name: "Notifications", icon: <FaBell /> },
  { name: "History",       icon: <FaHistory /> },
  { name: "Profile",       icon: <FaUser /> },
  { name: "Help",          icon: <FaQuestionCircle /> },
  { name: "Settings",      icon: <FaCog /> },
];

const UserDashboard = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("userDashboardActiveTab") || "Campaign"
  );

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen text-xl text-gray-500">
      Loading...
    </div>
  );

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("userDashboardActiveTab", tab);
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div className="h-dvh max-h-dvh w-full max-w-full overflow-hidden bg-gray-100">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-[60] bg-white shadow-sm border-b border-gray-200 h-14 flex items-center px-4 justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            {isSidebarOpen && !isMobile ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
          <span className="font-bold text-gray-800 text-base tracking-tight">User Panel</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-700 leading-tight">
              {user?.name || user?.email?.split("@")[0] || "User"}
            </span>
            <span className="text-xs text-gray-400 leading-tight">{user?.email || ""}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold uppercase">
            {(user?.name || user?.email || "U")[0]}
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            title="Logout"
          >
            <FaSignOutAlt size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ── MOBILE OVERLAY ── */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[45]"
          onClick={() => setIsSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed top-14 left-0 h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] bg-white shadow-md border-r border-gray-200 z-50
          transition-all duration-300 ease-in-out overflow-y-auto
          ${isMobile
            ? isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full w-64"
            : isSidebarOpen ? "w-64" : "w-16"
          }`}
      >
        {/* Nav */}
        <nav className="py-2">
          {NAV_ITEMS.map((item, idx) => (
            <div key={idx}>
              <button
                onClick={() => handleTabClick(item.name)}
                className={`flex items-center w-full py-3 px-4 text-left transition-colors duration-150
                  ${activeTab === item.name
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                  }
                  ${!isSidebarOpen ? "justify-center" : "gap-3"}
                `}
                title={!isSidebarOpen ? item.name : ""}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {isSidebarOpen && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </button>


            </div>
          ))}
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div
        className={`box-border flex h-dvh min-h-0 flex-col overflow-hidden pt-14 transition-all duration-300 ease-in-out
          ${isMobile ? "ml-0" : isSidebarOpen ? "ml-64" : "ml-16"}
        `}
      >
        {/* Page title bar */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-800">{activeTab}</h2>
        </div>

        {/* Content */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            {activeTab === "Campaign"      && <UserCampaignTab />}
            {activeTab === "Task"          && <UserTask />}
            {activeTab === "Credit Wallet" && <CreditWallet />}
            {activeTab === "Profile"       && <UserTab />}
            {activeTab === "Settings" && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <span className="text-4xl">⚙️</span>
                <p className="text-base font-medium text-gray-500">Settings</p>
                <p className="text-sm">Coming soon</p>
              </div>
            )}
            {["Messages", "Notifications", "History", "Help"].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <span className="text-4xl">🚧</span>
                <p className="text-base font-medium text-gray-500">{activeTab}</p>
                <p className="text-sm">Coming soon</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
