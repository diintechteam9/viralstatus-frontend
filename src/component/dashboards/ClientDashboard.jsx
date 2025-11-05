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
import ImageContentPoolTab from "./ImageContentPoolTab.jsx";
// import ContentPoolReels from "./ContentPoolReelscommented.jsx";


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
    // { name: "Reels", icon: <FaVideo /> },
    { name: "Editor", icon: <BsCameraReelsFill /> },
    { name: "Tools", icon: <FaTools /> },
    { name: "Image Content Pools", icon: <GrGallery/>},
    { name: "Reel Content Pools", icon: <FaFolderPlus /> },
    { name: "Campaign", icon: <FaPlus /> },
    // { name: "Category", icon: <FaPhotoVideo /> },
    { name: "Gallery", icon: <GrGallery /> },
    // { name: "Content Pools Reels", icon: <FaFolderPlus /> },
  
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

  // Derived client info for sidebar card
  const clientName =
    (user && (user.name || user.fullName || user.username)) || "Client";
  const clientEmail = (user && (user.email || user.primaryEmail)) || "";
  const [clientLogoUrl, setClientLogoUrl] = useState(null);
  const [clientBusinessLogoKey, setClientBusinessLogoKey] = useState(
    (user && (user.businessLogoKey || user.logoKey)) || null
  );
  const [clientProfile, setClientProfile] = useState(null);
  const clientInitials = (clientName || "C")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Fetch client profile to get businessLogoKey (mirrors AdminDashboard data source)
  useEffect(() => {
    const loadClientProfile = async () => {
      try {
        // Try to get businessLogoKey from user prop first (if available)
        if (user && (user.businessLogoKey || user.logoKey)) {
          const key = user.businessLogoKey || user.logoKey;
          setClientBusinessLogoKey(key);
          return;
        }

        // Check if businessLogoKey is stored in sessionStorage from login
        const userData = sessionStorage.getItem("userData");
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            if (parsed.businessLogoKey || parsed.logoKey) {
              const key = parsed.businessLogoKey || parsed.logoKey;
              setClientBusinessLogoKey(key);
              return;
            }
          } catch (e) {
            // Invalid JSON, continue
          }
        }

        // Note: The endpoints /api/client/me, /api/client/profile, and /api/client/details 
        // do not exist in the backend, so we skip fetching from them to avoid 404 errors.
        // If you need to fetch client profile data, create the appropriate endpoint in the backend.
      } catch (error) {
        // Silently handle errors
        console.debug("Client profile fetch failed:", error);
      }
    };

    // Only fetch if we don't already have a key
    if (!clientBusinessLogoKey) {
      loadClientProfile();
    }
  }, [clientBusinessLogoKey, user]);

  // Fetch presigned URL for client's business logo (reference: AdminDashboard)
  useEffect(() => {
    const fetchClientBusinessLogoUrl = async () => {
      try {
        if (!clientBusinessLogoKey) {
          setClientLogoUrl(null);
          return;
        }

        const token = sessionStorage.getItem("clienttoken");
        if (!token) return;

        // Client-side endpoint to get presigned URL for their own business logo
        const response = await fetch(
          `${API_BASE_URL}/api/client/get-business-logo-url`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ businessLogoKey: clientBusinessLogoKey }),
          }
        );

        if (!response.ok) {
          setClientLogoUrl(null);
          return;
        }

        const data = await response.json();
        setClientLogoUrl(data.url || null);
      } catch (err) {
        setClientLogoUrl(null);
      }
    };

    fetchClientBusinessLogoUrl();
  }, [clientBusinessLogoKey]);

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
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-all duration-300 ease-in-out ${
          isMobile
            ? isSidebarOpen
              ? "w-64 translate-x-0"
              : "-translate-x-full w-64"
            : isSidebarOpen
            ? "w-64"
            : "w-20"
        }`}
      >
        {/* Header aligned with Admin style but YovoAI colors */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-3 overflow-hidden">
              <img src="/Yovoai-logo.jpg" alt="YovoAI" className="w-full h-full object-cover" />
            </div>
            {isSidebarOpen && (
              <span className="text-white font-semibold text-xl">YovoAI</span>
            )}
          </div>
          {!isMobile && (
            <button
              className="text-white hover:text-gray-200 focus:outline-none"
              onClick={toggleSidebar}
            >
              <FaAngleLeft size={20} />
            </button>
          )}
        </div>

        {/* Client card below header */}
        {(isSidebarOpen || isMobile) && (
          <div className="px-3 py-3 border-b border-gray-100">
            <div className="rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 p-3 shadow-sm border border-orange-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-200 text-orange-900 flex items-center justify-center font-semibold shrink-0">
                {clientLogoUrl ? (
                  <img
                    src={clientLogoUrl}
                    alt={clientName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm">{clientInitials}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {clientName}
                </div>
                {clientEmail && (
                  <div className="text-xs text-gray-600 truncate">{clientEmail}</div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col h-[calc(100vh-64px)]">
          <div className="flex-1 py-1 overflow-y-auto">
            {navItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-3 px-3 text-left transition-colors duration-200 relative ${
                    activeTab === item.name
                      ? "bg-gradient-to-r from-yellow-50 to-orange-100 text-orange-900 border-r-4 border-orange-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabClick(item.name)}
                  title={!isSidebarOpen && !isMobile ? item.name : undefined}
                >
                  <span className={`mr-2 text-lg ${
                    activeTab === item.name ? "text-orange-700" : "text-gray-700"
                  }`}>{item.icon}</span>
                  {(isSidebarOpen || isMobile) && (
                    <span className={`text-sm font-medium ${
                      activeTab === item.name ? "text-orange-900" : "text-gray-700"
                    }`}>{item.name}</span>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Bottom navigation items */}
          <div className="border-t border-gray-200 mx-3 mb-2 sticky bottom-2 bg-white/80 rounded-md shadow-sm">
            {bottomNavItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-2.5 px-3 text-left transition-colors duration-200 ${
                    activeTab === item.name
                      ? "bg-gradient-to-r from-yellow-50 to-orange-100 text-orange-900 border-r-4 border-orange-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabClick(item.name)}
                >
                  <span className={`mr-2 text-lg ${
                    activeTab === item.name ? "text-orange-700" : "text-gray-700"
                  }`}>{item.icon}</span>
                  {(isSidebarOpen || isMobile) && (
                    <span className={`text-sm font-medium ${
                      activeTab === item.name ? "text-orange-900" : "text-gray-700"
                    }`}>{item.name}</span>
                  )}
                </button>

                {/* Dropdown for Settings */}
                {isSidebarOpen && item.subItems && activeTab === item.name && (
                  <div className="ml-6 mt-1 mb-2">
                    {item.subItems.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        className="flex items-center w-full py-2 text-left hover:bg-gray-100 text-gray-700 transition-colors duration-200 text-sm"
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
                          <FaUser className="mr-2 text-xs" />
                        )}
                        {subItem === "Log out" && (
                          <FaSignOutAlt className="mr-2 text-xs" />
                        )}
                        <span className="text-xs">{subItem}</span>
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
            <div className="flex items-center gap-2">
              <img src="/Yovoai-logo.jpg" alt="YovoAI" className="h-6 w-6 rounded object-cover" />
              <h4 className="m-0 font-bold tracking-tight">YovoAI</h4>
            </div>
          </div>
        )}

        <main
          className={`container mx-auto ${
            activeTab === "AI Video Gen" ? "" : "p-2 sm:p-4 lg:p-6"
          }`}
        >
          {activeTab !== "Editor" && activeTab !== "AI Video Gen" && (
            <div className="mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 text-orange-800 text-sm font-medium">
                <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
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
                <div className="group relative overflow-hidden rounded-2xl border border-orange-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-100/60 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Images</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">1,248</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-orange-600">
                      <FaImage />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">Last 7 days: +58</p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl border border-orange-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-100/60 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Videos</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">362</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-orange-600">
                      <FaVideo />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">In processing: 7</p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl border border-orange-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-100/60 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Music Tracks</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">48</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-orange-600">
                      <PiMusicNotesFill />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">New this month: 6</p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl border border-orange-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-100/60 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Reels</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">190</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-orange-600">
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
            {/* {activeTab === "Category" && (
              <CategoryTab
                user={user}
                categories={categories}
                setCategories={updateCategories}
                loading={loading}
                error={error}
              />
            )} */}
            {activeTab === "Reel Content Pools" && <ContentPoolTab />}

            {activeTab === "Image Content Pools" && <ImageContentPoolTab />}

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


            {/* {activeTab === "Reels" && <ReelVideoEditor />} */}

            {activeTab === "AI" && <AIAssistantTab />}

            {/* {activeTab === "Content Pools Reels" && <ContentPoolReels />} */}

      

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
