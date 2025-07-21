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
import MusicTab from "./MusicTab";
import Calendar from "./CalendarTab";
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
    { name: "Gallery", icon: <GrGallery /> },
    { name: "Reels", icon: <FaVideo /> },
    { name: "Editor", icon: <BsCameraReelsFill /> },
    { name: "User", icon: <FaUser /> },
    { name: "Tools", icon: <FaTools /> },
    { name: "Music", icon: <PiMusicNotesFill /> },
    { name: "Category", icon: <FaPhotoVideo /> },
    { name: "Content Pools", icon: <FaFolderPlus /> },
    { name: "Campaign", icon: <FaPlus /> },
    // { name: "User Campaign", icon: <FaPlus /> },
    // { name: "AI", icon: <FaRobot /> },
    // { name: "Create", icon: <FaPlus /> },
    // { name: "Accounts", icon: <FaUser /> },
    // { name: "Calendar", icon: <FaCalendar /> },
  ];

  const bottomNavItems = [
    { name: "Help", icon: <FaQuestionCircle /> },
    { name: "Settings", icon: <FaCog />, subItems: ["Log out"] },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
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
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          {isSidebarOpen && (
            <h4 className="m-0 font-semibold text-lg truncate">
              Client Dashboard
            </h4>
          )}
          <button
            className="text-black hover:text-gray-700 focus:outline-none"
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
                  className={`flex items-center w-full py-3 px-4 text-left  ${
                    activeTab === item.name
                      ? "bg-green-500 text-white"
                      : "text-black"
                  }`}
                  onClick={() => handleTabClick(item.name)}
                >
                  <span className="mr-3 text-xl flex-shrink-0">
                    {item.icon}
                  </span>
                  {(isSidebarOpen || isMobile) && (
                    <span className="truncate">{item.name}</span>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Bottom navigation items */}
          <div className="border-t border-gray-200">
            {bottomNavItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-3 px-4 text-left hover:bg-gray-100 ${
                    activeTab === item.name
                      ? "bg-green-500 text-white"
                      : "text-black"
                  }`}
                  onClick={() => handleTabClick(item.name)}
                >
                  <span className="mr-3 text-xl flex-shrink-0">
                    {item.icon}
                  </span>
                  {(isSidebarOpen || isMobile) && (
                    <span className="truncate">{item.name}</span>
                  )}
                </button>

                {/* Dropdown for Settings */}
                {isSidebarOpen && item.subItems && activeTab === item.name && (
                  <div className="ml-8 mt-1 mb-2">
                    {item.subItems.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        className="flex items-center w-full py-2 text-left hover:bg-gray-100 text-black"
                        onClick={() => {
                          if (subItem === "Log out") onLogout();
                        }}
                      >
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
          <div className="flex justify-between items-center p-4 bg-white shadow-sm">
            <button
              className="p-2 bg-gray-800 text-white rounded-md"
              onClick={toggleSidebar}
            >
              <FaBars />
            </button>
            <h4 className="m-0 font-bold">Client Dashboard</h4>
          </div>
        )}

        <main className="container mx-auto p-2 sm:p-4">
          {activeTab !== "Editor" && (
            <h2 className="text-xl sm:text-2xl font-bold mb-4">{activeTab}</h2>
          )}
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mt-4">
            {activeTab === "Overview" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                  <h3 className="font-bold text-base sm:text-lg mb-2">
                    Business Profile
                  </h3>
                  <p className="text-sm sm:text-base">
                    View and update your business information
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                  <h3 className="font-bold text-base sm:text-lg mb-2">
                    Transactions
                  </h3>
                  <p className="text-sm sm:text-base">
                    Manage and view transaction history
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                  <h3 className="font-bold text-base sm:text-lg mb-2">
                    Reports
                  </h3>
                  <p className="text-sm sm:text-base">
                    Generate and download business reports
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                  <h3 className="font-bold text-base sm:text-lg mb-2">
                    Tax Information
                  </h3>
                  <p className="text-sm sm:text-base">
                    Manage GST, PAN, and other tax details
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                  <h3 className="font-bold text-base sm:text-lg mb-2">
                    Support
                  </h3>
                  <p className="text-sm sm:text-base">
                    Contact support and view help resources
                  </p>
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

            {activeTab === "Music" && <MusicTab />}

            {activeTab === "Reels" && <ReelVideoEditor />}

            {activeTab === "AI" && <AIAssistantTab />}

            {activeTab === "Tools" && (
              <div className="w-full h-full">
                <VideoOverlayTool />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;
