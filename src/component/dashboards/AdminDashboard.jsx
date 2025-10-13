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
  FaUsers,
  FaRupeeSign,
  FaTools,
} from "react-icons/fa";
import LoginForm from "../auth/LoginForm";
import AdminTools from "../admintools/AdminTools";
import TelegramTool from "../admintools/TelegramTool";

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
  const [businessLogoFile, setBusinessLogoFile] = useState(null);
  const [businessLogoPreview, setBusinessLogoPreview] = useState(null);
  const [loadingClientId, setLoadingClientId] = useState(null);
  const [clientFilter, setClientFilter] = useState("All");
  const [clientLogoUrls, setClientLogoUrls] = useState({});

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
      console.log("Clients data:", data.data);
      setclients(data.data);
      setclientcount(data.count);
      setIsLoading(false);
    } catch (error) {
      console.log("Error fetching clients:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(activeTab);
    if (activeTab == "Client" || activeTab == "Overview") {
      getclients();
    }
  }, [activeTab]);

  // Fetch presigned URLs for business logos when clients data changes
  useEffect(() => {
    const fetchBusinessLogoUrls = async () => {
      if (!clients || clients.length === 0) return;

      const logoUrlPromises = clients
        .filter(client => client.businessLogoKey)
        .map(async (client) => {
          const presignedUrl = await getBusinessLogoUrl(client.businessLogoKey);
          return { clientId: client._id, url: presignedUrl };
        });

      const logoUrls = await Promise.all(logoUrlPromises);
      const urlMap = {};
      logoUrls.forEach(({ clientId, url }) => {
        if (url) {
          urlMap[clientId] = url;
        }
      });
      setClientLogoUrls(urlMap);
    };

    fetchBusinessLogoUrls();
  }, [clients]);

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

  // Filter clients based on search term and filter selection
  const filteredClients = clients
    ? clients.filter((client) => {
        // Search filter - check if search term is empty or matches any field
        const matchesSearch = searchTerm === "" || 
          (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (client.businessName && client.businessName.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Date filter
        let matchesDate = true;
        if (clientFilter === "New") {
          const clientDate = new Date(client.createdAt);
          const currentDate = new Date();
          const isSameMonth = 
            clientDate.getMonth() === currentDate.getMonth() &&
            clientDate.getFullYear() === currentDate.getFullYear();
          matchesDate = isSameMonth;
        }
        
        return matchesSearch && matchesDate;
      })
    : [];

  // Debug logging
  useEffect(() => {
    if (searchTerm) {
      console.log("Search term:", searchTerm);
      console.log("Filtered clients:", filteredClients);
      console.log("Total clients:", clients?.length);
    }
  }, [searchTerm, filteredClients, clients]);

  const navItems = [
    { name: "Overview", icon: <FaChartBar /> },
    { name: "Client", icon: <FaUsers /> },
    { name: "Accounts", icon: <FaRupeeSign /> },
    { name: "Tools", icon: <FaTools /> },
    { name: "Statistics", icon: <FaDatabase /> },
  ];

  const utilityItems = [
    { name: "Support", icon: <FaHeadset /> },
    { name: "Help", icon: <FaQuestionCircle /> },
    { name: "Settings", icon: <FaCog />, subItems: ["Log out"] },
  ];

  const sidebarWidth = isSidebarOpen ? "16rem" : "5rem";

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getBusinessLogoUrl = async (businessLogoKey) => {
    try {
      const token = localStorage.getItem("admintoken");
      if (!token || !businessLogoKey) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/get-business-logo-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessLogoKey: businessLogoKey,
        }),
      });

      if (!response.ok) {
        console.error("Failed to get business logo URL");
        return null;
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error getting business logo URL:", error);
      return null;
    }
  };

  const handleLogoFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      
      setBusinessLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBusinessLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadBusinessLogo = async (file) => {
    try {
      const token = localStorage.getItem("admintoken");
      if (!token) {
        throw new Error("Admin token not found");
      }

      // Get upload URL from admin endpoint
      const uploadUrlResponse = await fetch(`${API_BASE_URL}/api/admin/upload-business-logo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json();
        throw new Error(errorData.message || "Failed to get upload URL");
      }

      const uploadData = await uploadUrlResponse.json();
      
      // Upload file to S3
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      return {
        businessLogoKey: uploadData.s3Key,
        businessLogoUrl: uploadData.fileUrl
      };
    } catch (error) {
      console.error("Error uploading business logo:", error);
      throw error;
    }
  };

  const handleAddClient = async () => {
    try {
      if (newClient.password !== newClient.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      let logoData = {};
      
      // Upload business logo if provided
      if (businessLogoFile) {
        try {
          logoData = await uploadBusinessLogo(businessLogoFile);
        } catch (error) {
          alert("Failed to upload business logo. Please try again.");
          return;
        }
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
          ...logoData,
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
      setBusinessLogoFile(null);
      setBusinessLogoPreview(null);
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
            <h4 className="font-semibold text-xl">Admin Dashboard</h4>
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-800 to-violet-900 h-16 flex items-center justify-between px-6 rounded-t-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                  <FaPlus className="text-violet-800 text-lg" />
                </div>
                <span className="text-white font-semibold text-xl">Add New Client</span>
              </div>
              <button
                className="text-white hover:text-gray-200 focus:outline-none"
                onClick={() => {
                  setShowAddClientModal(false);
                  setBusinessLogoFile(null);
                  setBusinessLogoPreview(null);
                }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6">
              {/* Business Information Section */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Business Name <span className="text-violet-800">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter business name"
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                      value={newClient.businessName}
                      onChange={(e) =>
                        setNewClient({ ...newClient, businessName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                      value={newClient.websiteUrl}
                      onChange={(e) =>
                        setNewClient({ ...newClient, websiteUrl: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter GST number"
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                      value={newClient.gstNo}
                      onChange={(e) =>
                        setNewClient({ ...newClient, gstNo: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter PAN number"
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                      value={newClient.panNo}
                      onChange={(e) =>
                        setNewClient({ ...newClient, panNo: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Aadhar Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Aadhar number"
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                      value={newClient.aadharNo}
                      onChange={(e) =>
                        setNewClient({ ...newClient, aadharNo: e.target.value })
                      }
                    />
                  </div>
                  
                </div>
              </div>

              {/* Business Logo Section */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Business Logo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Upload Business Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileSelect}
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
                    </p>
                  </div>
                  {businessLogoPreview && (
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Preview
                      </label>
                      <div className="mt-1 border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                        <img
                          src={businessLogoPreview}
                          alt="Business Logo Preview"
                          className="max-w-full h-32 object-contain mx-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Full Name <span className="text-violet-800">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                      value={newClient.name}
                      onChange={(e) =>
                        setNewClient({ ...newClient, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Email Address <span className="text-violet-800">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                      value={newClient.email}
                      onChange={(e) =>
                        setNewClient({ ...newClient, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Enter city"
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                      value={newClient.city}
                      onChange={(e) =>
                        setNewClient({ ...newClient, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      placeholder="Enter pincode"
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                      value={newClient.pincode}
                      onChange={(e) =>
                        setNewClient({ ...newClient, pincode: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Password <span className="text-violet-800">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                      value={newClient.password}
                      onChange={(e) =>
                        setNewClient({ ...newClient, password: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-violet-800">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-violet-800 focus:ring-violet-800 focus:outline-none transition-colors"
                      value={newClient.confirmPassword}
                      onChange={(e) =>
                        setNewClient({
                          ...newClient,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="text-violet-800">*</span> Required fields
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                  onClick={() => {
                    setShowAddClientModal(false);
                    setBusinessLogoFile(null);
                    setBusinessLogoPreview(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-violet-800 text-white rounded-md hover:bg-violet-900 text-sm font-medium"
                  onClick={handleAddClient}
                >
                  Submit
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
                  className="px-4 py-2 bg-violet-800 text-white rounded-md hover:bg-violet-900 text-sm"
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
        {/* Red Header */}
        <div className="bg-gradient-to-r from-violet-800 to-violet-900 h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
              <span className="text-violet-800 font-bold text-xl">A</span>
            </div>
            {isSidebarOpen && (
              <span className="text-white font-semibold text-xl">Admin Portal</span>
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

        {/* Navigation Items */}
        <div className="flex flex-col h-full">
          <div className="flex-1 py-2">
            {navItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-4 px-4 text-left transition-colors duration-200 relative ${
                    activeTab === item.name
                      ? "bg-gradient-to-r from-violet-50 to-violet-100 text-violet-800 border-r-4 border-violet-800"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabClick(item.name)}
                >
                  <span className={`mr-3 text-xl ${
                    activeTab === item.name ? "text-violet-800" : "text-gray-700"
                  }`}>{item.icon}</span>
                  {(isSidebarOpen || isMobile) && (
                    <span className={`text-base font-medium ${
                      activeTab === item.name ? "text-violet-800" : "text-gray-700"
                    }`}>{item.name}</span>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Utility Items Separator */}
          <div className="border-t border-gray-200 mx-4"></div>
          
          {/* Utility Items */}
          <div className="py-2 mb-15">
            {utilityItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-3 px-4 text-left transition-colors duration-200 ${
                    activeTab === item.name
                      ? "bg-gradient-to-r from-violet-50 to-violet-100 text-violet-800 border-r-4 border-violet-800"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabClick(item.name)}
                >
                  <span className={`mr-3 text-xl ${
                    activeTab === item.name ? "text-violet-800" : "text-gray-700"
                  }`}>{item.icon}</span>
                  {(isSidebarOpen || isMobile) && (
                    <span className={`text-base font-medium ${
                      activeTab === item.name ? "text-violet-800" : "text-gray-700"
                    }`}>{item.name}</span>
                  )}
                </button>

                {/* Dropdown for Settings */}
                {isSidebarOpen && item.subItems && activeTab === item.name && (
                  <div className="ml-8 mt-1 mb-2">
                    {item.subItems.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        className="flex items-center w-full py-2 text-left hover:bg-gray-100 text-gray-700 transition-colors duration-200"
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
                
              </div>
            </div>
          </div>

          {/* Dashboard Content based on active tab */}
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-full shadow-sm">
                <h5 className="text-base font-medium text-gray-700 mb-2">
                  Total Clients
                </h5>
                <h2 className="text-3xl font-bold text-violet-800 mb-1">{clientcount || 0}</h2>
                <p className="text-xs text-gray-500">
                  12% increase from last month
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-full shadow-sm">
                <h5 className="text-base font-medium text-gray-700 mb-2">
                  Active Sessions
                </h5>
                <h2 className="text-3xl font-bold text-violet-800 mb-1">423</h2>
                <p className="text-xs text-gray-500">5% increase from yesterday</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-full shadow-sm">
                <h5 className="text-base font-medium text-gray-700 mb-2">
                  AI Interactions
                </h5>
                <h2 className="text-3xl font-bold text-violet-800 mb-1">8,732</h2>
                <p className="text-xs text-gray-500">
                  18% increase from last week
                </p>
              </div>
            </div>
          )}

          {/* Client Table */}
          {activeTab == "Client" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Header with Add Client button and filters */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setClientFilter("All")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          clientFilter === "All"
                            ? "bg-violet-800 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        All ({clients ? clients.length : 0})
                      </button>
                      <button
                        onClick={() => setClientFilter("New")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          clientFilter === "New"
                            ? "bg-violet-800 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        New ({clients ? clients.filter(client => {
                          const clientDate = new Date(client.createdAt);
                          const currentDate = new Date();
                          return clientDate.getMonth() === currentDate.getMonth() &&
                                 clientDate.getFullYear() === currentDate.getFullYear();
                        }).length : 0})
                      </button>
                    </div>
                    <button
                      onClick={() => setShowAddClientModal(true)}
                      className="flex items-center justify-center px-4 py-2 bg-violet-800 text-white rounded-md hover:bg-violet-900 text-sm"
                    >
                      <FaPlus className="mr-2" />
                      Add Client
                    </button>
                  </div>
                
                {/* Search bar */}
                <div className="relative max-w-md">
                  <input
                    type="text"
                    placeholder="Search clients..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-800 text-sm"
                    value={searchTerm}
                    onChange={(e) => {
                      console.log("Search input changed:", e.target.value);
                      setSearchTerm(e.target.value);
                    }}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <FaSearch className="text-gray-400" />
                  </div>
                  {searchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <button
                        onClick={() => setSearchTerm("")}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {searchTerm && (
                  <div className="mt-2 text-sm text-gray-600">
                    Found {filteredClients.length} client(s) matching "{searchTerm}"
                  </div>
                )}
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
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-semibold text-sm overflow-hidden">
                                {clientLogoUrls[client._id] ? (
                                  <img
                                    src={clientLogoUrls[client._id]}
                                    alt={`${client.businessName} logo`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <span style={{ display: clientLogoUrls[client._id] ? 'none' : 'flex' }} className="w-full h-full items-center justify-center">
                                  {client.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-base font-medium text-gray-900">
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
                                    : "bg-violet-800 hover:bg-violet-900"
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
                          <div className="space-y-3 text-xs">
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
                    <table className="hidden sm:table min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SNO.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            NAME
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            BUSINESS DETAILS
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            CONTACT INFO
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            KYC
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.map((client, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm overflow-hidden">
                                  {clientLogoUrls[client._id] ? (
                                    <img
                                      src={clientLogoUrls[client._id]}
                                      alt={`${client.businessName} logo`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <span style={{ display: clientLogoUrls[client._id] ? 'none' : 'flex' }} className="w-full h-full items-center justify-center">
                                    {client.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-base font-semibold text-gray-900">
                                    {client.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Client since {formatDate(client.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {client.businessName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.websiteUrl ? (
                                  <a
                                    href={client.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-violet-800 hover:underline inline-flex items-center"
                                  >
                                    Website
                                    <FaExternalLinkAlt className="ml-1 text-xs" />
                                  </a>
                                ) : (
                                  "No website"
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-900">
                                  <span className="text-gray-500 text-xs block">Email</span>
                                  {client.email}
                                </div>
                                <div className="text-sm text-gray-900">
                                  <span className="text-gray-500 text-xs block">Location</span>
                                  {client.city}, {client.pincode}
                                </div>
                                {client.websiteUrl && (
                                  <div className="text-sm text-gray-900">
                                    <span className="text-gray-500 text-xs block">Website</span>
                                    <a
                                      href={client.websiteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-violet-800 hover:underline inline-flex items-center"
                                    >
                                      Visit Website
                                      <FaExternalLinkAlt className="ml-1 text-xs" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                <div className="mb-1">GST: {client.gstNo}</div>
                                <div>PAN: {client.panNo}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
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
                                    : "bg-violet-800 hover:bg-violet-900"
                                } text-white px-4 py-2 rounded-md transition-colors text-sm font-medium`}
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

          {/* Tools Tab */}
          {activeTab === "Tools" && (
            <div className="bg-white rounded-lg shadow p-6">
              <AdminTools onOpenTelegram={() => setActiveTab("Telegram Alerts")} />
            </div>
          )}

          {/* Telegram Tool View */}
          {activeTab === "Telegram Alerts" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <button
                  className="text-m text-violet-800 hover:underline mb-2 border border-violet-800 rounded-md px-2 py-1 "
                  onClick={() => setActiveTab("Tools")}
                >
                  ← Back
                </button>
                
              </div>
              <TelegramTool />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
