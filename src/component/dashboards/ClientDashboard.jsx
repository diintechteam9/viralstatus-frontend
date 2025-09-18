import React, { useState, useEffect } from "react";
import { MdCategory } from "react-icons/md";
import { BsCameraReelsFill } from "react-icons/bs";
import { BiSolidCategory } from "react-icons/bi";
import { GrGallery } from "react-icons/gr";
import { PiMusicNotesFill } from "react-icons/pi";
import {
  FaChartBar,
  FaBuilding,
  FaFileInvoiceDollar,
  FaChartLine,
  FaHeadset,
  FaCog,
  FaTools,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHistory,
  FaQuestionCircle,
  FaFileAlt,
  FaUserCircle,
  FaPhotoVideo,
  FaVideo,
  FaAngleLeft,
  FaImage,
  FaTrash,
  FaDownload,
  FaFolderPlus,
  FaCalendar,
  FaUser,
  FaRobot,
  FaPlus,
} from "react-icons/fa";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import CategoryTab from "./CategoryTab";
import GalleryTab from "./GalleryTab";
import ReelVideoEditor from "./ReelVideoEditor";
import VideoEditor from "./VideoEditor";  
import Calendar from "./CalendarTab";
import ManualVideoGeneration from "./ManualVideoGeneration.jsx";


// import AccountsTab from "./AccountsTab";
import AIAssistantTab from "./AIAssistantTab.jsx";
import CreateTab from "./CreateTab";
import VideoOverlayTool from "./VideoOverlayTool";
import UserTab from "./UserTab.jsx";
import ContentPoolTab from "./ContentPoolTab";
import CampaignTab from "./CampaignTab";
import UserCampaignTab from "./UserCampaignTab";

const ClientDashboard = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("clientDashboardActiveTab") || "Overview";
  });
  const [isMobile, setIsMobile] = useState(false);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check for redirect from Instagram auth
  // useEffect(() => {
  //   const searchParams = new URLSearchParams(window.location.search);
  //   if (searchParams.get("instagram") === "success") {
  //     setActiveTab("Accounts");
  //   }
  // }, []);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("clienttoken");
        if (!token) {
          setError("Authentication required");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data && response.data.categories) {
          // Transform the categories data to include subcategories count
          const transformedCategories = response.data.categories.map(
            (category) => ({
              ...category,
              subCategories: category.subCategories || [],
              subCategoriesCount: category.subCategories
                ? category.subCategories.length
                : 0,
            })
          );
          setCategories(transformedCategories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to fetch categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Function to update categories (can be passed to child components)
  const updateCategories = (updatedCategories) => {
    setCategories(updatedCategories);
  };

  // Check if screen is mobile and handle resize events
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("clientDashboardActiveTab", tab);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    const storedTab = localStorage.getItem("clientDashboardActiveTab");
    if (storedTab && storedTab !== activeTab) {
      setActiveTab(storedTab);
    }
  }, []);

  const navItems = [
    { name: "Overview", icon: <FaChartBar /> },
    { name: "AI Video Gen", icon: <FaVideo/>},
    { name: "Reels", icon: <FaVideo /> },
    { name: "Editor", icon: <BsCameraReelsFill /> },
    { name: "Tools", icon: <FaTools /> },
    { name: "Content Pools", icon: <FaFolderPlus /> },
    { name: "Campaign", icon: <FaPlus /> },
    { name: "Category", icon: <FaPhotoVideo /> },
    { name: "Gallery", icon: <GrGallery /> },
  
    // { name: "User Campaign", icon: <FaPlus /> },
    // { name: "AI", icon: <FaRobot /> },
    // { name: "Create", icon: <FaPlus /> },
    // { name: "Accounts", icon: <FaUser /> },
    // { name: "Calendar", icon: <FaCalendar /> },  
  ];

  const bottomNavItems = [
    { name: "Help", icon: <FaQuestionCircle /> },
    { name: "Settings", icon: <FaCog />, subItems: ["Profile", "Log out"] },
  ];

  return (
    <div
      className={`min-h-screen ${
        activeTab === "AI Video Gen"
          ? ""
          : "bg-gradient-to-b from-slate-50 via-white to-emerald-50"
      } text-gray-900`}
    >
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full opacity-50 z-40 bg-black"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-r border-emerald-100 shadow-md z-50 transition-all duration-300 ease-in-out ${
          isMobile
            ? isSidebarOpen
              ? "w-64 translate-x-0"
              : "-translate-x-full w-64"
            : isSidebarOpen
            ? "w-64"
            : "w-20"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-emerald-100 bg-white/70 backdrop-blur-sm">
          {isSidebarOpen && (
            <h4 className="m-0 font-semibold text-lg truncate tracking-tight">
              Client Dashboard
            </h4>
          )}
          <button
            className="text-gray-700 hover:text-black focus:outline-none rounded-md p-1 transition-colors"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <FaAngleLeft size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-64px)]">
          {/* Main navigation items */}
          <div className="flex-1 overflow-y-auto">
            {navItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`group relative flex items-center w-full py-3 px-4 text-left rounded-md my-1 transition-all ${
                    activeTab === item.name
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-800 hover:bg-emerald-50"
                  }`}
                  onClick={() => handleTabClick(item.name)}
                  title={!isSidebarOpen && !isMobile ? item.name : undefined}
                >
                  {activeTab === item.name && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-white/90" />
                  )}
                  <span className="mr-3 text-xl flex-shrink-0">
                    {item.icon}
                  </span>
                  {(isSidebarOpen || isMobile) && (
                    <span className="truncate font-medium tracking-tight">
                      {item.name}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Bottom navigation items */}
          <div className="border-t border-emerald-100 bg-white/60">
            {bottomNavItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-3 px-4 text-left rounded-md my-1 transition-all ${
                    activeTab === item.name
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-800 hover:bg-emerald-50"
                  }`}
                  onClick={() => handleTabClick(item.name)}
                >
                  <span className="mr-3 text-xl flex-shrink-0">
                    {item.icon}
                  </span>
                  {(isSidebarOpen || isMobile) && (
                    <span className="truncate font-medium tracking-tight">
                      {item.name}
                    </span>
                  )}
                </button>

                {/* Dropdown for Settings */}
                {isSidebarOpen && item.subItems && activeTab === item.name && (
                  <div className="ml-8 mt-1 mb-2">
                    {item.subItems.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        className="flex items-center w-full py-2 px-2 text-left hover:bg-emerald-50 text-gray-800 rounded-md transition-colors"
                        onClick={() => {
                          if (subItem === "Log out") {
                            onLogout();
                          }
                          if (subItem === "Profile") {
                            setActiveTab("User");
                          }
                        }}
                      >
                        {subItem === "User" && (
                          <FaUser className="mr-2 flex-shrink-0" />
                        )}
                        {subItem === "Log out" && (
                          <FaSignOutAlt className="mr-2 flex-shrink-0" />
                        )}
                        <span className="truncate">{subItem}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`${
          isMobile ? "ml-0" : isSidebarOpen ? "ml-64" : "ml-20"
        } transition-all duration-300 ease-in-out`}
      >
        {/* Mobile header with toggle button */}
        {isMobile && (
          <div className="flex justify-between items-center p-4 bg-white/90 backdrop-blur border-b border-emerald-100 shadow-sm sticky top-0 z-40">
            <button
              className="p-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors"
              onClick={toggleSidebar}
            >
              <FaBars />
            </button>
            <h4 className="m-0 font-bold tracking-tight">Client Dashboard</h4>
          </div>
        )}

        <main
          className={`container mx-auto ${
            activeTab === "AI Video Gen" ? "" : "p-2 sm:p-4 lg:p-6"
          }`}
        >
          {activeTab !== "Editor" && activeTab !== "AI Video Gen" && (
            <div className="mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                {activeTab}
              </div>
            </div>
          )}
          {activeTab === "AI Video Gen" ? (
            <ManualVideoGeneration />
          ) : (
            <>
              {activeTab === "Overview" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2 sm:mt-4">
                <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-100/60 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Images</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">1,248</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <FaImage />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">Last 7 days: +58</p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-100/60 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Videos</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">362</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <FaVideo />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">In processing: 7</p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-100/60 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Music Tracks</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">48</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <PiMusicNotesFill />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">New this month: 6</p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-100/60 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Reels</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">190</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <BsCameraReelsFill />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">Scheduled: 12</p>
                </div>
              </div>
            )}

            {activeTab === "Create" && <CreateTab />}

            {activeTab === "Transactions" && (
              <div className="space-y-4">
                <p>Transaction history and management will go here</p>
              </div>
            )}

            {activeTab === "Calendar" && <Calendar />}

            {activeTab === "Campaign" && <CampaignTab />}
            {activeTab === "User Campaign" && <UserCampaignTab />}

            {activeTab === "Reports" && (
              <div className="space-y-4">
                <p>Business reports and analytics will go here</p>
              </div>
            )}

            {activeTab === "Help" && (
              <div className="space-y-4">
                <p>Help documentation and guides will go here</p>
              </div>
            )}

            {activeTab === "Settings" && (
              <div className="space-y-4">
                <p>Account settings and preferences will go here</p>
              </div>
            )}

            {activeTab === "Gallery" && (
              <GalleryTab
                categories={categories}
                folders={folders}
                setFolders={setFolders}
                loading={loading}
                error={error}
              />
            )}
            {activeTab === "Category" && (
              <CategoryTab
                user={user}
                categories={categories}
                setCategories={updateCategories}
                loading={loading}
                error={error}
              />
            )}
            {activeTab === "Content Pools" && <ContentPoolTab />}

            {activeTab === "User" && (
              <div className="w-full h-full bg-gray-400">
                <UserTab />
              </div>
            )}

            {activeTab === "Editor" && (
              <div className="w-full h-full bg-gray-400">
                <VideoEditor />
              </div>
            )}

            {activeTab === "Editor" && (
              <div className="w-full h-full bg-gray-400">
                <VideoEditor />
              </div>
            )}


            {activeTab === "Reels" && <ReelVideoEditor />}

            {activeTab === "AI" && <AIAssistantTab />}

      

            {activeTab === "Tools" && (
              <div className="w-full h-full">
                <VideoOverlayTool />
              </div>
            )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;
