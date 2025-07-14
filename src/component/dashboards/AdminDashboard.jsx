import React, { useState, useEffect } from "react";
import { useAsyncError, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import {
  FaChartBar,
  FaDatabase,
  FaRobot,
  FaComments,
  FaHeadset,
  FaCog,
  FaShieldAlt,
  FaQuestionCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaSearch,
  FaEdit,
  FaTrash,
  FaExternalLinkAlt,
  FaAngleLeft,
  FaPlus,
} from "react-icons/fa";
import LoginForm from "../auth/LoginForm";

const AdminDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("adminDashboardActiveTab") || "Overview";
  });
  const [isMobile, setIsMobile] = useState(false);
  const [clients, setclients] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [clientcount, setclientcount] = useState(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [loggedInClients, setLoggedInClients] = useState(new Set());
  const [Auth, setAuth] = useState("Authenticate");
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    websiteUrl: "",
    city: "",
    pincode: "",
    gstNo: "",
    panNo: "",
    aadharNo: "",
  });
  const [loadingClientId, setLoadingClientId] = useState(null);

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

    // Check on initial load
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("adminDashboardActiveTab", tab);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    const storedTab = localStorage.getItem("adminDashboardActiveTab");
    if (storedTab && storedTab !== activeTab) {
      setActiveTab(storedTab);
    }
  }, []);

  const getclients = async (req, res) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/getclients`);
      const data = await response.json();
      console.log(data.data);
      setclients(data.data);
      setclientcount(data.count);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(activeTab);
    if (activeTab == "Client" || activeTab == "Overview") {
      getclients();
    }
  }, [activeTab]);

  // Open login modal for a specific client
  const openClientLogin = async (clientId, clientEmail, clientName) => {
    try {
      setLoadingClientId(clientId);
      console.log("Starting client login process for:", clientId);

      // Get admin token from localStorage
      const adminToken = localStorage.getItem("admintoken");
      if (!adminToken) {
        console.error("No admin token found");
        alert("Admin session expired. Please login again.");
        return;
      }

      // Make API call to get client token
      const response = await fetch(
        `${API_BASE_URL}/api/admin/get-client-token/${clientId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to get client access token"
        );
      }

      const data = await response.json();

      if (data.token) {
        // First open a blank window
        setAuth("Login");
        const clientWindow = window.open("about:blank", "_blank");

        if (!clientWindow) {
          throw new Error(
            "Failed to open new window. Please allow popups for this site."
          );
        }

        // Add client to logged in set
        setLoggedInClients((prev) => new Set([...prev, clientId]));

        // Write the HTML content that will set sessionStorage and redirect
        const html = `
          <html>
            <head>
              <title>Loading...</title>
              <script>
                // Clear any existing session data
                sessionStorage.clear();
                
                // Set the credentials in sessionStorage
                sessionStorage.setItem('clienttoken', '${data.token}');
                sessionStorage.setItem('userData', JSON.stringify({
                  role: 'client',
                  userType: 'client',
                  name: '${clientName}',
                  email: '${clientEmail}',
                  clientId: '${clientId}'
                }));
                
                // Redirect to client dashboard
                window.location.href = '/auth/dashboard';
              </script>
            </head>
            <body>
              <p>Loading client dashboard...</p>
            </body>
          </html>
        `;

        // Write the HTML to the new window
        clientWindow.document.open();
        clientWindow.document.write(html);
        clientWindow.document.close();

        // Add event listener for window close
        clientWindow.onbeforeunload = () => {
          setLoggedInClients((prev) => {
            const newSet = new Set(prev);
            newSet.delete(clientId);
            return newSet;
          });
        };
      } else {
        throw new Error("No token received from server");
      }
    } catch (error) {
      console.error("Error in openClientLogin:", error);
      alert(error.message || "Failed to access client dashboard");
    } finally {
      setLoadingClientId(null);
    }
  };

  // Filter clients based on search term
  const filteredClients = clients
    ? clients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.businessName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const navItems = [
    { name: "Overview", icon: <FaChartBar /> },
    { name: "Client", icon: <FaChartBar /> },
    { name: "Datastore", icon: <FaDatabase /> },
    { name: "AI Agent", icon: <FaRobot /> },
    { name: "Conversation", icon: <FaComments /> },
    { name: "Support", icon: <FaHeadset /> },
    { name: "Configuration", icon: <FaCog /> },
    { name: "Security", icon: <FaShieldAlt /> },
    { name: "Help", icon: <FaQuestionCircle /> },
    { name: "Settings", icon: <FaCog />, subItems: ["Log out"] },
  ];

  const sidebarWidth = isSidebarOpen ? "16rem" : "5rem";

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleAddClient = async () => {
    try {
      if (newClient.password !== newClient.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/registerclient`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: newClient.name,
          email: newClient.email,
          password: newClient.password,
          businessName: newClient.businessName,
          websiteUrl: newClient.websiteUrl,
          city: newClient.city,
          pincode: newClient.pincode,
          gstNo: newClient.gstNo,
          panNo: newClient.panNo,
          aadharNo: newClient.aadharNo,
        }),
      });

      const data = await response.json();

      // if (!response.ok) {
      //   throw new Error(data.message || 'Failed to create client');
      // }

      setShowAddClientModal(false);
      setNewClient({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        businessName: "",
        websiteUrl: "",
        city: "",
        pincode: "",
        gstNo: "",
        panNo: "",
        aadharNo: "",
      });
      alert("Client created successfully");
      await getclients();
    } catch (error) {
      console.error("Error creating client:", error);
      alert(error.message || "Failed to create client. Please try again.");
    }
  };

  const handleDeleteClient = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/deleteclient/${clientToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete client");
      }

      setShowDeleteModal(false);
      setClientToDelete(null);
      await getclients();
      alert("Client deleted successfully");
    } catch (error) {
      console.error("Error deleting client:", error);
      alert(error.message || "Failed to delete client. Please try again.");
    }
  };

  const confirmDelete = (clientId) => {
    setClientToDelete(clientId);
    setShowDeleteModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h4 className="font-semibold text-lg">Admin Dashboard</h4>
            <button
              className="text-black hover:text-gray-700 focus:outline-none p-2"
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowAddClientModal(false)}
            >
              <FaTimes size={20} />
            </button>
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">
                Add New Client
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={newClient.name}
                    onChange={(e) =>
                      setNewClient({ ...newClient, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({ ...newClient, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={newClient.password}
                    onChange={(e) =>
                      setNewClient({ ...newClient, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={newClient.confirmPassword}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={newClient.businessName}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        businessName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website URL
                  </label>
                  <input
                    type="url"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={newClient.websiteUrl}
                    onChange={(e) =>
                      setNewClient({ ...newClient, websiteUrl: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={newClient.city}
                    onChange={(e) =>
                      setNewClient({ ...newClient, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pincode
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={newClient.pincode}
                    onChange={(e) =>
                      setNewClient({ ...newClient, pincode: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    GST Number
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={newClient.gstNo}
                    onChange={(e) =>
                      setNewClient({ ...newClient, gstNo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={newClient.panNo}
                    onChange={(e) =>
                      setNewClient({ ...newClient, panNo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Aadhar Number
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    value={newClient.aadharNo}
                    onChange={(e) =>
                      setNewClient({ ...newClient, aadharNo: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm"
                  onClick={handleAddClient}
                >
                  Add Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
            <div className="p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">
                Confirm Delete
              </h2>
              <p className="text-center text-gray-600 mb-4 text-sm sm:text-base">
                Are you sure you want to delete this client? This action cannot
                be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  onClick={handleDeleteClient}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        } ${isMobile ? "top-16" : ""}`}
      >
        {!isMobile && (
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            {isSidebarOpen && (
              <h4 className="m-0 font-semibold text-lg">Admin Dashboard</h4>
            )}
            <button
              className="text-black hover:text-gray-700 focus:outline-none"
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <FaAngleLeft size={20} /> : <FaBars size={20} />}
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
                      className="flex items-center w-full py-2 text-left hover:bg-gray-100 text-black transition-colors duration-200"
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

      {/* Main content */}
      <div
        className={`${
          isMobile ? "ml-0 pt-16" : isSidebarOpen ? "ml-64" : "ml-20"
        } transition-all duration-300 ease-in-out`}
      >
        <div className="p-3 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{activeTab}</h2>
                <nav className="text-xs sm:text-sm">
                  <ol className="flex">
                    <li className="mr-2">
                      <a href="#" className="text-blue-500 hover:text-blue-700">
                        Dashboard
                      </a>
                    </li>
                    <li className="mr-2">/</li>
                    <li className="text-gray-500">{activeTab}</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          {/* Dashboard Content based on active tab */}
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-blue-500 text-white rounded-lg p-3 sm:p-4 h-full shadow">
                <h5 className="text-base sm:text-lg font-semibold">
                  Total Clients
                </h5>
                <h2 className="text-2xl sm:text-3xl my-2">{clientcount}</h2>
                <p className="text-xs sm:text-sm">
                  12% increase from last month
                </p>
              </div>
              <div className="bg-green-500 text-white rounded-lg p-3 sm:p-4 h-full shadow">
                <h5 className="text-base sm:text-lg font-semibold">
                  Active Sessions
                </h5>
                <h2 className="text-2xl sm:text-3xl my-2">423</h2>
                <p className="text-xs sm:text-sm">5% increase from yesterday</p>
              </div>
              <div className="bg-yellow-500 text-white rounded-lg p-3 sm:p-4 h-full shadow">
                <h5 className="text-base sm:text-lg font-semibold">
                  AI Interactions
                </h5>
                <h2 className="text-2xl sm:text-3xl my-2">8,732</h2>
                <p className="text-xs sm:text-sm">
                  18% increase from last week
                </p>
              </div>
            </div>
          )}

          {/* Client Table */}
          {activeTab == "Client" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Search and filters */}
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                  <h3 className="text-lg sm:text-xl font-semibold">
                    Client List
                  </h3>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <button
                      onClick={() => setShowAddClientModal(true)}
                      className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                    >
                      <FaPlus className="mr-2" />
                      Add Client
                    </button>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search clients..."
                        className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <FaSearch className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="p-6 sm:p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500 text-sm sm:text-base">
                      Loading clients...
                    </p>
                  </div>
                ) : !clients || clients.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <p className="text-gray-500 text-sm sm:text-base">
                      No clients found.
                    </p>
                  </div>
                ) : (
                  <div className="min-w-full">
                    {/* Mobile Card View */}
                    <div className="block sm:hidden">
                      {filteredClients.map((client, index) => (
                        <div
                          key={index}
                          className="border-b border-gray-200 p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-semibold text-sm">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {client.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Client since {formatDate(client.createdAt)}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                openClientLogin(
                                  client._id,
                                  client.email,
                                  client.name
                                )
                              }
                              className={`${
                                loggedInClients.has(client._id)
                                  ? "bg-green-500 hover:bg-green-600"
                                  : "bg-red-500 hover:bg-red-600"
                              } text-white px-3 py-1 rounded-lg transition-colors text-xs`}
                              title={
                                loggedInClients.has(client._id)
                                  ? "Client Logged In"
                                  : "Client Login"
                              }
                            >
                              {loggedInClients.has(client._id)
                                ? "Logged In"
                                : "Auth"}
                            </button>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div>
                              <strong>Business:</strong> {client.businessName}
                            </div>
                            <div>
                              <strong>Email:</strong> {client.email}
                            </div>
                            <div>
                              <strong>Location:</strong> {client.city},{" "}
                              {client.pincode}
                            </div>
                            {client.websiteUrl && (
                              <div>
                                <strong>Website:</strong>
                                <a
                                  href={client.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline ml-1"
                                >
                                  Visit{" "}
                                  <FaExternalLinkAlt className="inline ml-1 text-xs" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Business Details
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact Info
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID Details
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClients.map((client, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-semibold text-sm">
                                  {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-3 sm:ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {client.name}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500">
                                    Client since {formatDate(client.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {client.businessName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.websiteUrl ? (
                                  <a
                                    href={client.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-blue-500 hover:underline"
                                  >
                                    Website{" "}
                                    <FaExternalLinkAlt className="ml-1 text-xs" />
                                  </a>
                                ) : (
                                  "No website"
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {client.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.city}, {client.pincode}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              <div className="text-xs sm:text-sm text-gray-900">
                                <p>GST: {client.gstNo}</p>
                                <p>PAN: {client.panNo}</p>
                                <p>Aadhar: {client.aadharNo}</p>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-sm font-medium">
                              <button
                                onClick={() =>
                                  openClientLogin(
                                    client._id,
                                    client.email,
                                    client.name
                                  )
                                }
                                className={`${
                                  loggedInClients.has(client._id)
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-red-500 hover:bg-red-600"
                                } text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm`}
                                title={
                                  loggedInClients.has(client._id)
                                    ? "Client Logged In"
                                    : "Client Login"
                                }
                              >
                                {loggedInClients.has(client._id)
                                  ? "Logged In"
                                  : "Authenticate"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
