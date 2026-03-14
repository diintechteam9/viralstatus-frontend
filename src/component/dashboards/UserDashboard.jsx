import React, { useState, useEffect } from "react";
import {
  FaChartBar,
  FaUser,
  FaComments,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaBell,
  FaHistory,
  FaQuestionCircle,
  FaLayerGroup,
  FaTasks,
  FaWallet,
  FaGlobe,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";
import UserTab from "./UserTab.jsx";
import UserCampaignTab from "./UserCampaignTab";
import UserTask from "./UserTask.jsx";
import CreditWallet from "./CreditWallet.jsx";
import WebsiteTab from "./WebsiteTab.jsx";

const UserDashboard = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    // On first render, default to 'Campaign', then use localStorage if available
    const storedTab = localStorage.getItem("userDashboardActiveTab");
    return storedTab ? storedTab : "Campaign";
  });
  // const [activeTab, setActiveTab] = useState('Campaign');
  const [isMobile, setIsMobile] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        Loading...
      </div>
    );
  }

  // Check if screen is mobile and handle resize events
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth < 992) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Restore active tab on mount (in case localStorage changes externally)
  useEffect(() => {
    const storedTab = localStorage.getItem("userDashboardActiveTab");
    if (storedTab && storedTab !== activeTab) {
      setActiveTab(storedTab);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("userDashboardActiveTab", tab);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    { name: "Campaign", icon: <FaLayerGroup /> },
    { name: "Profile", icon: <FaUser /> },
    { name: "Task", icon: <FaTasks /> },
    { name: "Credit Wallet", icon: <FaWallet /> },
    { name: "Website", icon: <FaGlobe /> },
    { name: "Messages", icon: <FaComments /> },
    { name: "Notifications", icon: <FaBell /> },
    { name: "History", icon: <FaHistory /> },
    { name: "Help", icon: <FaQuestionCircle /> },
    { name: "Settings", icon: <FaCog />, subItems: ["Log out"] },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h4 className="font-semibold text-lg">User Panel</h4>
            <button
              className="text-black hover:text-gray-700 focus:outline-none p-2"
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      )}

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black opacity-50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-all duration-300 ease-in-out ${
          isMobile
            ? isSidebarOpen
              ? "w-64 translate-x-0"
              : "-translate-x-full w-64"
            : isSidebarOpen
            ? "w-64"
            : "w-20"
        } ${isMobile ? "top-16" : ""}`}
      >
        {!isMobile && (
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            {isSidebarOpen && (
              <h4 className="m-0 font-semibold text-lg">User Panel</h4>
            )}
            <button
              className="text-black hover:text-gray-700 focus:outline-none"
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        )}

        <div
          className={`flex flex-col overflow-y-auto ${
            isMobile ? "mt-0" : "mt-3"
          }`}
          style={{
            maxHeight: isMobile ? "calc(100vh - 64px)" : "calc(100vh - 60px)",
          }}
        >
          {navItems.map((item, index) => (
            <div key={index}>
              <button
                className={`flex items-center w-full py-3 px-4 sm:px-5 text-left transition-colors duration-200 ${
                  activeTab === item.name
                    ? "bg-blue-500 text-white"
                    : "text-black hover:bg-gray-100"
                }`}
                onClick={() => handleTabClick(item.name)}
              >
                <span className="mr-3 text-lg sm:text-xl">{item.icon}</span>
                {(isSidebarOpen || isMobile) && (
                  <span className="text-sm sm:text-base">{item.name}</span>
                )}
              </button>

              {/* Dropdown for Settings */}
              {isSidebarOpen && item.subItems && activeTab === item.name && (
                <div className="ml-8 mt-1 mb-2">
                  {item.subItems.map((subItem, subIndex) => (
                    <button
                      key={subIndex}
                      className="flex items-center w-full py-2 text-left text-black hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => {
                        if (subItem === "Log out") onLogout();
                      }}
                    >
                      {subItem === "Log out" && (
                        <FaSignOutAlt className="mr-2 text-sm" />
                      )}
                      <span className="text-sm">{subItem}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isMobile ? "ml-0 pt-16" : isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <main className="container mx-auto p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mt-2 sm:mt-4">
            {activeTab === "Campaign" && <UserCampaignTab />}

            {activeTab === "Task" && <UserTask />}

            {activeTab === "Credit Wallet" && <CreditWallet />}

            {activeTab === "Profile" && <UserTab />}

            {activeTab === "Website" && <WebsiteTab />}

            {activeTab === "Messages" && (
              <div className="space-y-4">
                <p className="text-sm sm:text-base">
                  Messages content will go here
                </p>
              </div>
            )}

            {activeTab === "Notifications" && (
              <div className="space-y-4">
                <p className="text-sm sm:text-base">
                  Notifications content will go here
                </p>
              </div>
            )}

            {activeTab === "History" && (
              <div className="space-y-4">
                <p className="text-sm sm:text-base">
                  History content will go here
                </p>
              </div>
            )}

            {activeTab === "Help" && (
              <div className="space-y-4">
                <p className="text-sm sm:text-base">
                  Help content will go here
                </p>
              </div>
            )}

            {activeTab === "Settings" && (
              <div className="space-y-4">
                <p className="text-sm sm:text-base">
                  Settings content will go here
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
