import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
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
  FaEllipsisV,
  FaUser,
  FaBuilding,
  FaEnvelope,
  FaMapMarkerAlt,
  FaGlobe,
  FaIdCard,
  FaAddressCard,
  FaHashtag,
  FaCalendarAlt,
  FaClock,
  FaGoogle,
  FaCheckCircle,
  FaShareAlt,
  FaExchangeAlt,
} from "react-icons/fa";

import LoginForm from "../auth/LoginForm";
import AdminTools from "../admintools/AdminTools";
import TelegramTool from "../admintools/TelegramTool";
import SocialMedia from "./socialmedia/SocialMedia";
import AdminNewsBlog from "./AdminNewsBlog";
import AppsTab from "./AppsTab";
import SwitchUsersTab from "./SwitchUsersTab";
import AdminBannerManager from "./AdminBannerManager";
import AdminKYCPanel from "./AdminKYCPanel";
import AdminWithdrawPanel from "./AdminWithdrawPanel";
import AdminTestimonialPanel from "./AdminTestimonialPanel";

const clientIdKey = (client) => String(client?._id || client?.id || "");

const buildClientUpdatePayload = (source, extras = {}) => {
  const payload = {};
  const fields = ["name", "email", "businessName", "websiteUrl", "city", "pincode", "gstNo", "panNo", "filter"];
  fields.forEach((key) => {
    if (source[key] !== undefined && source[key] !== null) {
      payload[key] = typeof source[key] === "string" ? source[key].trim() : source[key];
    }
  });
  if (extras.businessLogoKey) payload.businessLogoKey = extras.businessLogoKey;
  if (extras.businessLogoUrl) payload.businessLogoUrl = extras.businessLogoUrl;
  if (extras.password) payload.password = extras.password;
  return payload;
};

const CLIENT_MODAL_FIELD =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600";

const prepareClientForEdit = (client) => ({
  ...client,
  name: client?.name || client?.contactPerson || "",
  email: client?.email || "",
  businessName: client?.businessName || "",
  websiteUrl: client?.websiteUrl || "",
  city: client?.city || "",
  pincode: client?.pincode || "",
  gstNo: client?.gstNo || "",
  panNo: client?.panNo || "",
  filter: client?.filter || "all",
  _newPassword: "",
  _confirmPassword: "",
});

const updateClientApi = async (clientId, payload) => {
  const token = localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");
  if (!token) throw new Error("Admin session expired. Please login again.");
  const res = await fetch(`${API_BASE_URL}/api/admin/updateclient/${clientId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || `Update failed (${res.status})`);
  }
  return data;
};

const ClientLogoAvatar = ({ client, logoUrl, sizeClass = "h-10 w-10", textClass = "text-sm" }) => {
  const [imgFailed, setImgFailed] = React.useState(false);
  const src = logoUrl || client?.logoUrl || client?.businessLogoUrl || "";
  const displayName = client?.name || client?.contactPerson || client?.businessName || "?";
  const initial = displayName.charAt(0).toUpperCase();

  React.useEffect(() => {
    setImgFailed(false);
  }, [src]);

  return (
    <div
      className={`flex-shrink-0 ${sizeClass} rounded-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center text-violet-700 font-bold overflow-hidden ${textClass}`}
    >
      {src && !imgFailed ? (
        <img
          src={src}
          alt={`${client?.businessName || "Client"} logo`}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="w-full h-full flex items-center justify-center">{initial}</span>
      )}
    </div>
  );
};

const AdminDashboard = ({ user, onLogout, onSwitchSuccess }) => {
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
  });
  const [businessLogoFile, setBusinessLogoFile] = useState(null);
  const [businessLogoPreview, setBusinessLogoPreview] = useState(null);
  const [loadingClientId, setLoadingClientId] = useState(null);
  const [clientFilter, setClientFilter] = useState("All");
  const [clientLogoUrls, setClientLogoUrls] = useState({});
  const [openRowMenuId, setOpenRowMenuId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [clientBeingEdited, setClientBeingEdited] = useState(null);
  const [editClientFilter, setEditClientFilter] = useState("all");
  const [isEditingClientDetails, setIsEditingClientDetails] = useState(false);
  const [clientDetailsDraft, setClientDetailsDraft] = useState(null);
  const [sortOrder, setSortOrder] = useState("latest");
  const [clientStats, setClientStats] = useState({});
  const [clientStatsLoading, setClientStatsLoading] = useState(false);
  const [showClientDetailsMenu, setShowClientDetailsMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [addClientLoading, setAddClientLoading] = useState(false);
  const [saveClientLoading, setSaveClientLoading] = useState(false);

  const adminName    = user?.name  || "Admin";
  const adminEmail   = user?.email || "";
  const adminInitial = adminName.charAt(0).toUpperCase();

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

  const openClientDetails = (client) => {
    // Reset any ongoing inline edits when switching clients
    setIsEditingClientDetails(false);
    setClientDetailsDraft(null);
    setSelectedClient(client);
    setActiveTab("Client Details");
  };

  const closeClientDetails = () => {
    // Ensure edit state is cleared when leaving details view
    setIsEditingClientDetails(false);
    setClientDetailsDraft(null);
    setSelectedClient(null);
    setActiveTab("Client");
  };


  useEffect(() => {
    const storedTab = localStorage.getItem("adminDashboardActiveTab");
    if (storedTab && storedTab !== activeTab) {
      setActiveTab(storedTab);
    }
  }, []);

  // If we leave Client Details tab or selected client changes, clear edit state
  useEffect(() => {
    if (activeTab !== "Client Details") {
      setIsEditingClientDetails(false);
      setClientDetailsDraft(null);
      setShowClientDetailsMenu(false);
    }
  }, [activeTab]);

  // Close menu when selected client changes
  useEffect(() => {
    setShowClientDetailsMenu(false);
  }, [selectedClient]);


  const getclients = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");
      const response = await fetch(`${API_BASE_URL}/api/admin/getclients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.data)) {
        setclients([]);
        setclientcount(0);
        return;
      }
      const sortedClients = data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setclients(sortedClients);
      setclientcount(data.count);
    } catch (error) {
      console.log("Error fetching clients:", error);
      setclients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(activeTab);
    if (activeTab == "Client" || activeTab == "Overview") {
      getclients();
    }
  }, [activeTab]);

  // Build logo URL map from API (logoUrl) + refresh stale keys via presigned endpoint
  useEffect(() => {
    const loadLogos = async () => {
      if (!clients?.length) {
        setClientLogoUrls({});
        return;
      }

      const urlMap = {};
      clients.forEach((client) => {
        const id = clientIdKey(client);
        if (id && client.logoUrl) {
          urlMap[id] = client.logoUrl;
        } else if (id && client.businessLogoUrl) {
          urlMap[id] = client.businessLogoUrl;
        }
      });

      const needsRefresh = clients.filter(
        (c) => c.businessLogoKey && !urlMap[clientIdKey(c)]
      );
      if (needsRefresh.length > 0) {
        const refreshed = await Promise.all(
          needsRefresh.map(async (client) => {
            const url = await getBusinessLogoUrl(client.businessLogoKey);
            return { id: clientIdKey(client), url };
          })
        );
        refreshed.forEach(({ id, url }) => {
          if (id && url) urlMap[id] = url;
        });
      }

      setClientLogoUrls(urlMap);
    };

    loadLogos();
  }, [clients]);

  // Fetch campaigns, pools and reels counts per client
  useEffect(() => {
    const fetchStats = async () => {
      if (!Array.isArray(clients) || clients.length === 0) return;
      try {
        setClientStatsLoading(true);
        const entries = await Promise.all(
          clients.map(async (client) => {
            const id = client?._id;
            if (!id) return [null, { campaigns: 0, pools: 0, reels: 0 }];
            try {
              const campRes = await fetch(`${API_BASE_URL}/api/auth/user/campaign/client/${id}`);
              const campJson = await campRes.json().catch(() => ({}));
              const campaigns = campRes.ok && Array.isArray(campJson?.campaigns) ? campJson.campaigns.length : 0;

              const poolsRes = await fetch(`${API_BASE_URL}/api/pools?clientId=${encodeURIComponent(id)}`);
              const poolsJson = await poolsRes.json().catch(() => ({}));
              const poolsArr = Array.isArray(poolsJson?.pools) ? poolsJson.pools : [];
              const pools = poolsArr.length;
              const reels = poolsArr.reduce((acc, p) => acc + (Number(p?.reelCount || 0) || 0), 0);

              return [id, { campaigns, pools, reels }];
            } catch (e) {
              return [id, { campaigns: 0, pools: 0, reels: 0 }];
            }
          })
        );
        const next = {};
        entries.forEach(([id, value]) => { if (id) next[id] = value; });
        setClientStats(next);
      } finally {
        setClientStatsLoading(false);
      }
    };
    fetchStats();
  }, [clients]);

  // Open login modal for a specific client
  const openClientLogin = async (clientId, clientEmail, clientName) => {
    // Must open window synchronously on click — async fetch first triggers popup blockers
    const clientWindow = window.open("about:blank", "_blank");

    try {
      setLoadingClientId(clientId);
      console.log("Starting client login process for:", clientId);

      // Get admin token from localStorage
      const adminToken = localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");
      if (!adminToken) {
        console.error("No admin token found");
        if (clientWindow && !clientWindow.closed) clientWindow.close();
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
        setAuth("Login");
        setLoggedInClients((prev) => new Set([...prev, clientId]));

        const safeName = String(clientName || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        const safeEmail = String(clientEmail || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        const dashboardPath = `${window.location.origin}/client/dashboard`;

        if (!clientWindow || clientWindow.closed) {
          localStorage.setItem("clienttoken", data.token);
          localStorage.setItem(
            "clientData",
            JSON.stringify({
              role: "client",
              name: clientName,
              email: clientEmail,
              _id: clientId,
              clientId,
            })
          );
          window.location.href = dashboardPath;
          return;
        }

        const html = `
          <html>
            <head>
              <title>Loading...</title>
              <script>
                localStorage.setItem('clienttoken', ${JSON.stringify(data.token)});
                localStorage.setItem('clientData', ${JSON.stringify(
                  JSON.stringify({
                    role: "client",
                    name: clientName,
                    email: clientEmail,
                    _id: clientId,
                    clientId,
                  })
                )});
                window.location.href = ${JSON.stringify(dashboardPath)};
              <\/script>
            </head>
            <body><p>Loading client dashboard for ${safeName}...</p></body>
          </html>
        `;

        clientWindow.document.open();
        clientWindow.document.write(html);
        clientWindow.document.close();

        clientWindow.onbeforeunload = () => {
          setLoggedInClients((prev) => {
            const newSet = new Set(prev);
            newSet.delete(clientId);
            return newSet;
          });
        };
      } else {
        if (clientWindow && !clientWindow.closed) clientWindow.close();
        throw new Error("No token received from server");
      }
    } catch (error) {
      if (clientWindow && !clientWindow.closed) clientWindow.close();
      console.error("Error in openClientLogin:", error);
      alert(error.message || "Failed to access client dashboard");
    } finally {
      setLoadingClientId(null);
    }
  };

  // Filter clients based on search term and filter selection
  const filterOptions = [
    { key: "All", value: "all" },
    { key: "New", value: "new" },
    { key: "Prime", value: "prime" },
    { key: "Demo", value: "demo" },
    { key: "In-house", value: "in-house" },
    { key: "Testing", value: "testing" },
    { key: "Rejected", value: "rejected" },
  ];

  const filteredClients = clients
    ? clients.filter((client) => {
        // Search filter - check if search term is empty or matches any field
        const matchesSearch = searchTerm === "" || 
          (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (client.businessName && client.businessName.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Category / date filter
        let matchesCategoryOrDate = true;
        if (clientFilter === "New") {
          const clientDate = new Date(client.createdAt);
          const currentDate = new Date();
          const isSameMonth = 
            clientDate.getMonth() === currentDate.getMonth() &&
            clientDate.getFullYear() === currentDate.getFullYear();
          matchesCategoryOrDate = isSameMonth;
        } else if (clientFilter !== "All") {
          const clientFilterValue = (client.filter || "all");
          matchesCategoryOrDate = clientFilterValue === clientFilter.toLowerCase();
        }
        
        return matchesSearch && matchesCategoryOrDate;
      }).sort((a, b) => {
        if (sortOrder === "az") {
          return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
        }
        if (sortOrder === "za") {
          return (b.name || "").localeCompare(a.name || "", undefined, { sensitivity: "base" });
        }
        // latest
        return new Date(b.createdAt) - new Date(a.createdAt);
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
    { name: "Overview",            icon: <FaChartBar /> },
    { name: "Client",              icon: <FaUsers /> },
    { name: "Apps",                icon: <FaRobot /> },
    { name: "Switch Users",        icon: <FaExchangeAlt /> },
    { name: "Accounts",            icon: <FaRupeeSign /> },
    { name: "Tools",               icon: <FaTools /> },
    { name: "KYC Management",      icon: <FaShieldAlt /> },
    { name: "Withdrawal Requests", icon: <FaRupeeSign /> },
    { name: "Testimonials",        icon: <FaCheckCircle /> },
    { name: "Home Banners",        icon: <FaDatabase /> },
    { name: "Statistics",          icon: <FaDatabase /> },
  ];

  const utilityItems = [
    { name: "Support", icon: <FaHeadset /> },
    { name: "Help", icon: <FaQuestionCircle /> },
    { name: "Settings", icon: <FaCog />, subItems: ["Log out"] },
  ];

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getBusinessLogoUrl = async (businessLogoKey) => {
    try {
      const token = localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");
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

  const handleOpenEditClient = (client) => {
    setBusinessLogoFile(null);
    setBusinessLogoPreview(client?.logoUrl || client?.businessLogoUrl || null);
    setClientBeingEdited(prepareClientForEdit(client));
    setEditClientFilter(client?.filter || "all");
    setShowEditClientModal(true);
  };

  const uploadBusinessLogo = async (file) => {
    try {
      const token = localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");
      if (!token) {
        throw new Error("Admin session expired. Please login again.");
      }

      console.log('Starting upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);

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
        console.error('Failed to get upload URL:', errorData);
        throw new Error(errorData.message || "Failed to get upload URL");
      }

      const uploadData = await uploadUrlResponse.json();
      console.log('Got upload URL:', uploadData);
      
      // Upload file to S3 using presigned URL
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      console.log('S3 upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('S3 upload failed:', errorText);
        throw new Error(`Failed to upload file to S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      console.log('Upload successful!');
      return {
        businessLogoKey: uploadData.s3Key,
        businessLogoUrl: uploadData.fileUrl
      };
    } catch (error) {
      console.error("Error uploading business logo:", error);
      throw error;
    }
  };

  const handleUpdateClient = async () => {
    if (!clientBeingEdited) return;
    try {
      const data = await updateClientApi(
        clientBeingEdited._id,
        buildClientUpdatePayload({ filter: editClientFilter })
      );
      setShowEditClientModal(false);
      setClientBeingEdited(null);
      if (selectedClient?._id === clientBeingEdited._id && data.data) {
        setSelectedClient(data.data);
      }
      await getclients();
      alert("Client updated successfully");
    } catch (error) {
      console.error("Error updating client:", error);
      alert(error.message || "Failed to update client. Please try again.");
    }
  };

  const startInlineEditClientDetails = () => {
    if (!selectedClient) return;
    setClientDetailsDraft({
      name: selectedClient.name || "",
      email: selectedClient.email || "",
      businessName: selectedClient.businessName || "",
      websiteUrl: selectedClient.websiteUrl || "",
      city: selectedClient.city || "",
      pincode: selectedClient.pincode || "",
      gstNo: selectedClient.gstNo || "",
      panNo: selectedClient.panNo || "",
      filter: (selectedClient.filter || "all"),
    });
    setIsEditingClientDetails(true);
  };

  const cancelInlineEditClientDetails = () => {
    setIsEditingClientDetails(false);
    setClientDetailsDraft(null);
  };

  const saveInlineEditClientDetails = async () => {
    if (!selectedClient || !clientDetailsDraft) return;
    try {
      const data = await updateClientApi(
        selectedClient._id,
        buildClientUpdatePayload(clientDetailsDraft)
      );
      setSelectedClient(data.data);
      setIsEditingClientDetails(false);
      setClientDetailsDraft(null);
      await getclients();
      alert("Client updated successfully");
    } catch (error) {
      console.error("Error updating client:", error);
      alert(error.message || "Failed to update client. Please try again.");
    }
  };

  // Validate form fields
  const validateForm = () => {
    if (!newClient.name.trim()) {
      alert("Please enter the client's name");
      return false;
    }
    if (!newClient.email.trim()) {
      alert("Please enter the client's email");
      return false;
    }
    if (!newClient.password.trim()) {
      alert("Please enter a password");
      return false;
    }
    if (newClient.password !== newClient.confirmPassword) {
      alert("Passwords do not match");
      return false;
    }
    if (!newClient.businessName.trim()) {
      alert("Please enter the business name");
      return false;
    }
    if (!newClient.gstNo.trim()) {
      alert("Please enter the GST number");
      return false;
    }
    if (!newClient.panNo.trim()) {
      alert("Please enter the PAN number");
      return false;
    }
    return true;
  };

  const handleAddClient = async () => {
    try {
      if (!validateForm()) return;
      setAddClientLoading(true);
      let logoData = {};
      if (businessLogoFile) {
        try { logoData = await uploadBusinessLogo(businessLogoFile); }
        catch (error) { alert("Failed to upload business logo. Please try again."); return; }
      }
      const response = await fetch(`${API_BASE_URL}/api/admin/registerclient`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken")}`,
        },
        body: JSON.stringify({
          name: newClient.name, email: newClient.email, password: newClient.password,
          businessName: newClient.businessName, websiteUrl: newClient.websiteUrl,
          city: newClient.city, pincode: newClient.pincode,
          gstNo: newClient.gstNo, panNo: newClient.panNo, ...logoData,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create client');
      setShowAddClientModal(false);
      setNewClient({ name:"", email:"", password:"", confirmPassword:"", businessName:"", websiteUrl:"", city:"", pincode:"", gstNo:"", panNo:"" });
      setBusinessLogoFile(null);
      setBusinessLogoPreview(null);
      await getclients();
    } catch (error) {
      alert(error.message || "Failed to create client. Please try again.");
    } finally {
      setAddClientLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/deleteclient/${clientToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken")}`,
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
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#f3f4f6",
        position: "relative",
      }}
    >
      {isMobile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "56px",
            backgroundColor: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          <h4 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#111827" }}>Admin Dashboard</h4>
          <button
            type="button"
            onClick={toggleSidebar}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              cursor: "pointer",
              border: "none",
              background: "transparent",
              color: "#111827",
            }}
          >
            {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      )}

      {isMobile && isSidebarOpen && (
        <div
          role="presentation"
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 45,
          }}
        />
      )}

      <aside
        aria-label="Admin navigation"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: isMobile ? "256px" : isSidebarOpen ? "256px" : "80px",
          backgroundColor: "#ffffff",
          boxShadow: "2px 0 8px rgba(0,0,0,0.08)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          transition: isMobile ? "transform 300ms ease" : "width 300ms ease",
          overflow: "hidden",
          transform: isMobile
            ? isSidebarOpen
              ? "translateX(0)"
              : "translateX(-256px)"
            : undefined,
          pointerEvents: isMobile && !isSidebarOpen ? "none" : "auto",
        }}
      >
        <div
          style={{
            background: "linear-gradient(to right, #5b21b6, #4c1d95)",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#000",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img src="/Yovoai-logo.jpg" alt="YovoAI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {isSidebarOpen && (
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Admin Portal
              </span>
            )}
          </div>
          {!isMobile && (
            <button
              type="button"
              onClick={toggleSidebar}
              style={{
                border: "none",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: 6,
              }}
            >
              <FaAngleLeft size={20} />
            </button>
          )}
        </div>

        {isSidebarOpen && (
          <div style={{ padding: "12px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderRadius: 12,
                background: "linear-gradient(to right, #f5f3ff, #ede9fe)",
                border: "1px solid #ddd6fe",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "#ddd6fe",
                  color: "#5b21b6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {(user?.name || "Admin").charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name || "Admin"}
                </div>
                {user?.email && (
                  <div style={{ fontSize: 12, color: "#4b5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 8, paddingBottom: 8 }}>
            {navItems.map((item, index) => {
              const active = activeTab === item.name;
              return (
                <div key={index} style={{ marginBottom: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleTabClick(item.name)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: 0,
                      justifyContent: isSidebarOpen ? "flex-start" : "center",
                      backgroundColor: active ? "#ede9fe" : "transparent",
                      color: active ? "#5b21b6" : "#374151",
                      borderRight: active ? "3px solid #5b21b6" : "3px solid transparent",
                      fontSize: 15,
                      fontWeight: active ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0, display: "flex" }}>{item.icon}</span>
                    {isSidebarOpen && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", margin: "12px 16px 0" }} />

          <div style={{ paddingTop: 8, paddingBottom: 16 }}>
            {utilityItems.map((item, index) => {
              const active = activeTab === item.name;
              return (
                <div key={index} style={{ marginBottom: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleTabClick(item.name)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      justifyContent: isSidebarOpen ? "flex-start" : "center",
                      backgroundColor: active ? "#ede9fe" : "transparent",
                      color: active ? "#5b21b6" : "#374151",
                      borderRight: active ? "3px solid #5b21b6" : "3px solid transparent",
                      fontSize: 15,
                      fontWeight: active ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0, display: "flex" }}>{item.icon}</span>
                    {isSidebarOpen && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>}
                  </button>
                  {isSidebarOpen && item.subItems && activeTab === item.name && (
                    <div style={{ marginLeft: 28, marginTop: 4, marginBottom: 8 }}>
                      {item.subItems.map((subItem, subIndex) => (
                        <button
                          key={subIndex}
                          type="button"
                          onClick={() => {
                            if (subItem === "Log out") onLogout();
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            padding: "8px 16px",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            textAlign: "left",
                            color: "#374151",
                            fontSize: 14,
                            borderRadius: 6,
                          }}
                        >
                          {subItem === "Log out" && <FaSignOutAlt style={{ marginRight: 8, fontSize: 12 }} />}
                          {subItem}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {!isMobile && (
        <div
          aria-hidden
          style={{
            flexShrink: 0,
            width: isSidebarOpen ? "256px" : "80px",
            height: "100vh",
            transition: "width 300ms ease",
          }}
        />
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
          paddingTop: isMobile ? "56px" : "0px",
        }}
      >
        {!isMobile && (
          <div
            style={{
              flexShrink: 0,
              height: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <h2 className="text-lg font-bold text-gray-900 m-0">{activeTab}</h2>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 16px",
                  borderRadius: 12,
                  border: "1px solid transparent",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {adminInitial}
                </div>
                <div style={{ textAlign: "left" }}>
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{adminName}</p>
                  <p className="text-xs text-gray-400 leading-tight truncate max-w-[160px]">{adminEmail}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showUserDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showUserDropdown && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 70 }} onClick={() => setShowUserDropdown(false)} />
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      marginTop: 8,
                      width: 224,
                      background: "#fff",
                      borderRadius: 12,
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      border: "1px solid #f3f4f6",
                      zIndex: 80,
                      overflow: "hidden",
                    }}
                  >
                    <div className="px-4 py-3 border-b border-gray-100 bg-violet-50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{adminName}</p>
                      <p className="text-xs text-gray-500 truncate">{adminEmail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      style={{ border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
                    >
                      <FaSignOutAlt className="text-red-500" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "24px",
            minHeight: 0,
          }}
        >
          {/* Dashboard Content based on active tab */}
          {activeTab === "Overview" && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              style={{ gap: 16 }}
            >
              <div
                className="bg-white border border-gray-200 rounded-lg h-full shadow-sm"
                style={{ padding: 24, marginBottom: 0 }}
              >
                <h5 className="text-base font-medium text-gray-700 mb-2">
                  Total Clients
                </h5>
                <h2 className="text-3xl font-bold text-violet-800 mb-1">{clientcount || 0}</h2>
                <p className="text-xs text-gray-500">
                  12% increase from last month
                </p>
              </div>
              <div
                className="bg-white border border-gray-200 rounded-lg h-full shadow-sm"
                style={{ padding: 24, marginBottom: 0 }}
              >
                <h5 className="text-base font-medium text-gray-700 mb-2">
                  Active Sessions
                </h5>
                <h2 className="text-3xl font-bold text-violet-800 mb-1">423</h2>
                <p className="text-xs text-gray-500">5% increase from yesterday</p>
              </div>
              <div
                className="bg-white border border-gray-200 rounded-lg h-full shadow-sm"
                style={{ padding: 24, marginBottom: 0 }}
              >
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
            <div
              style={{
                width: "100%",
                backgroundColor: "#fff",
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "16px",
                    width: "100%",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      flex: "1 1 0",
                      minWidth: 0,
                    }}
                  >
                    {filterOptions.map((opt) => {
                      const count = (() => {
                        if (!clients) return 0;
                        if (opt.key === "All") return clients.length;
                        if (opt.key === "New") {
                          return clients.filter((client) => {
                            const clientDate = new Date(client.createdAt);
                            const currentDate = new Date();
                            return (
                              clientDate.getMonth() === currentDate.getMonth() &&
                              clientDate.getFullYear() === currentDate.getFullYear()
                            );
                          }).length;
                        }
                        return clients.filter((c) => (c.filter || "all") === opt.value).length;
                      })();
                      const active = clientFilter === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setClientFilter(opt.key)}
                          className={`text-sm font-medium transition-colors border-0 ${
                            active ? "text-white" : "text-gray-700 hover:bg-gray-200"
                          }`}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 6,
                            cursor: "pointer",
                            backgroundColor: active ? "#5b21b6" : "#f3f4f6",
                          }}
                        >
                          {opt.key} ({count})
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddClientModal(true)}
                    className="text-white text-sm font-medium border-0 hover:opacity-95 flex items-center justify-center"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      cursor: "pointer",
                      backgroundColor: "#5b21b6",
                      flexShrink: 0,
                      gap: 8,
                    }}
                  >
                    <FaPlus />
                    Add Client
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    width: "100%",
                    padding: "12px 16px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      flex: "1 1 280px",
                      minWidth: 160,
                      maxWidth: 480,
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search clients..."
                      className="text-sm focus:outline-none focus:ring-2 focus:ring-violet-800"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "8px 12px",
                        paddingLeft: 36,
                        paddingRight: searchTerm ? 36 : 12,
                        border: "1px solid #d1d5db",
                        borderRadius: 6,
                      }}
                      value={searchTerm}
                      onChange={(e) => {
                        console.log("Search input changed:", e.target.value);
                        setSearchTerm(e.target.value);
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    >
                      <FaSearch className="text-gray-400" />
                    </div>
                    {searchTerm && (
                      <div
                        style={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      >
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 border-0 bg-transparent"
                          style={{ padding: 4, cursor: "pointer" }}
                          onClick={() => setSearchTerm("")}
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {[
                      { k: "az", label: "A-Z" },
                      { k: "za", label: "Z-A" },
                      { k: "latest", label: "Latest" },
                    ].map(({ k, label }) => {
                      const active = sortOrder === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          title={label === "Latest" ? "Sort by Latest" : `Sort ${label}`}
                          onClick={() => setSortOrder(k)}
                          className={`text-sm font-medium transition-colors border-0 ${
                            active ? "text-white" : "text-gray-700 hover:bg-gray-200"
                          }`}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 6,
                            cursor: "pointer",
                            backgroundColor: active ? "#5b21b6" : "#f3f4f6",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {searchTerm && (
                  <div className="text-sm text-gray-600" style={{ marginTop: 12 }}>
                    Found {filteredClients.length} client(s) matching &quot;{searchTerm}&quot;
                  </div>
                )}
              </div>

              <div
                style={{
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch",
                  width: "100%",
                  minWidth: 0,
                  padding: "0 8px 16px",
                  boxSizing: "border-box",
                }}
              >
                {isLoading ? (
                  <div className="p-6 sm:p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500 text-sm sm:text-base">Loading clients...</p>
                  </div>
                ) : !clients || clients.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <p className="text-gray-500 text-sm sm:text-base">No clients found.</p>
                  </div>
                ) : (
                  <div>
                    <div className="block sm:hidden">
                      {filteredClients.map((client, index) => (
                        <div key={index} className="border-b border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center" onClick={() => openClientDetails(client)}>
                              <ClientLogoAvatar
                                client={client}
                                logoUrl={clientLogoUrls[clientIdKey(client)]}
                                sizeClass="h-8 w-8"
                                textClass="text-xs"
                              />
                              <div className="ml-3">
                                <div className="text-base font-medium text-gray-900">{client.name || client.contactPerson || client.businessName}</div>
                                <div className="text-xs text-gray-500">Client since {formatDate(client.createdAt)}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openClientLogin(client._id, client.email, client.name)}
                              className={`${
                                loggedInClients.has(client._id)
                                  ? "bg-green-500 hover:bg-green-600"
                                  : "bg-violet-800 hover:bg-violet-900"
                              } text-white transition-colors text-xs border-0`}
                              style={{ padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}
                              title={
                                loggedInClients.has(client._id) ? "Client Logged In" : "Client Login"
                              }
                            >
                              {loggedInClients.has(client._id) ? "Logged In" : "Auth"}
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
                              <strong>Location:</strong> {client.city}, {client.pincode}
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
                                  Visit <FaExternalLinkAlt className="inline ml-1 text-xs" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <table className="hidden sm:table w-full" style={{ tableLayout: "auto", minWidth: 820, borderCollapse: "collapse" }}>
                      <thead>
                        <tr className="bg-violet-50 border-b border-violet-100">
                          <th
                            className="text-left text-xs font-semibold text-violet-700 uppercase tracking-wider"
                            style={{ padding: "12px 16px" }}
                          >
                            #
                          </th>
                          <th
                            className="text-left text-xs font-semibold text-violet-700 uppercase tracking-wider"
                            style={{ padding: "12px 16px" }}
                          >
                            Client
                          </th>
                          <th
                            className="text-left text-xs font-semibold text-violet-700 uppercase tracking-wider"
                            style={{ padding: "12px 16px" }}
                          >
                            Business
                          </th>
                          <th
                            className="text-left text-xs font-semibold text-violet-700 uppercase tracking-wider"
                            style={{ padding: "12px 16px" }}
                          >
                            Contact
                          </th>
                          <th
                            className="text-center text-xs font-semibold text-violet-700 uppercase tracking-wider"
                            style={{ padding: "12px 16px" }}
                          >
                            Pools
                          </th>
                          <th
                            className="text-center text-xs font-semibold text-violet-700 uppercase tracking-wider"
                            style={{ padding: "12px 16px" }}
                          >
                            Campaigns
                          </th>
                          <th
                            className="text-center text-xs font-semibold text-violet-700 uppercase tracking-wider"
                            style={{ padding: "12px 16px" }}
                          >
                            Reels
                          </th>
                          <th
                            className="text-center text-xs font-semibold text-violet-700 uppercase tracking-wider"
                            style={{ padding: "12px 16px", whiteSpace: "nowrap" }}
                          >
                            Type
                          </th>
                          <th
                            className="text-center text-xs font-semibold text-violet-700 uppercase tracking-wider"
                            style={{ padding: "12px 16px", whiteSpace: "nowrap" }}
                          >
                            Login
                          </th>
                          <th
                            className="text-center text-xs font-semibold text-violet-700 uppercase tracking-wider"
                            style={{ padding: "12px 16px", whiteSpace: "nowrap" }}
                          >
                            Settings
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredClients.map((client, index) => (
                          <tr
                            key={index}
                            className="hover:bg-violet-50/40 cursor-pointer transition-colors"
                            onClick={() => openClientDetails(client)}
                          >
                            <td className="text-sm text-gray-400 font-medium" style={{ padding: "12px 16px" }}>
                              {index + 1}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div className="flex items-center" style={{ gap: 12 }}>
                                <ClientLogoAvatar
                                  client={client}
                                  logoUrl={clientLogoUrls[clientIdKey(client)]}
                                />
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{client.name || client.contactPerson || client.businessName}</div>
                                  <div className="text-xs text-gray-400">Since {formatDate(client.createdAt)}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div className="text-sm font-medium text-gray-800">{client.businessName || "-"}</div>
                              {client.websiteUrl ? (
                                <a
                                  href={client.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-violet-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Website <FaExternalLinkAlt className="text-[10px]" />
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400">No website</span>
                              )}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div className="text-sm text-gray-700 truncate max-w-[180px]">{client.email}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {[client.city, client.pincode].filter(Boolean).join(", ") || "-"}
                              </div>
                            </td>
                            <td className="text-center" style={{ padding: "12px 16px" }}>
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                                {clientStatsLoading && !clientStats[client._id]
                                  ? "…"
                                  : clientStats[client._id]?.pools ?? 0}
                              </span>
                            </td>
                            <td className="text-center" style={{ padding: "12px 16px" }}>
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-700 text-sm font-semibold">
                                {clientStatsLoading && !clientStats[client._id]
                                  ? "…"
                                  : clientStats[client._id]?.campaigns ?? 0}
                              </span>
                            </td>
                            <td className="text-center" style={{ padding: "12px 16px" }}>
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 text-orange-700 text-sm font-semibold">
                                {clientStatsLoading && !clientStats[client._id]
                                  ? "…"
                                  : clientStats[client._id]?.reels ?? 0}
                              </span>
                            </td>
                            <td className="text-center" style={{ padding: "12px 16px" }}>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                (client.filter || 'all') === 'prime' ? 'bg-yellow-100 text-yellow-800' :
                                (client.filter || 'all') === 'demo' ? 'bg-blue-100 text-blue-800' :
                                (client.filter || 'all') === 'in-house' ? 'bg-purple-100 text-purple-800' :
                                (client.filter || 'all') === 'testing' ? 'bg-orange-100 text-orange-800' :
                                (client.filter || 'all') === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {(client.filter || 'all').charAt(0).toUpperCase() + (client.filter || 'all').slice(1)}
                              </span>
                            </td>
                            <td className="text-center" style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openClientLogin(client._id, client.email, client.name);
                                }}
                                className={`text-xs font-semibold transition-colors border-0 ${
                                  loggedInClients.has(client._id)
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-violet-800 text-white hover:bg-violet-900"
                                }`}
                                style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer" }}
                              >
                                {loggedInClients.has(client._id) ? "✓ Active" : "Login"}
                              </button>
                            </td>
                            <td className="text-center" style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                              <div style={{ position: "relative", display: "inline-block" }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenRowMenuId(openRowMenuId === client._id ? null : client._id);
                                    }}
                                    style={{
                                      width: 32, height: 32, borderRadius: 8,
                                      border: "1px solid #e5e7eb",
                                      background: openRowMenuId === client._id ? "#ede9fe" : "#f9fafb",
                                      cursor: "pointer",
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      color: openRowMenuId === client._id ? "#5b21b6" : "#6b7280",
                                    }}
                                    title="Settings"
                                  >
                                    <FaCog size={14} />
                                  </button>
                                  {openRowMenuId === client._id && (
                                    <>
                                      <div
                                        style={{ position: "fixed", inset: 0, zIndex: 100 }}
                                        onClick={(e) => { e.stopPropagation(); setOpenRowMenuId(null); }}
                                      />
                                      <div style={{
                                        position: "absolute", right: 0, top: 36,
                                        background: "#fff", borderRadius: 10,
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                        border: "1px solid #e5e7eb",
                                        zIndex: 200, minWidth: 140, overflow: "hidden",
                                      }}>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenRowMenuId(null);
                                            handleOpenEditClient(client);
                                          }}
                                          style={{
                                            width: "100%", display: "flex", alignItems: "center", gap: 8,
                                            padding: "10px 16px", border: "none", background: "transparent",
                                            cursor: "pointer", fontSize: 13, color: "#374151", textAlign: "left",
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                        >
                                          <FaEdit style={{ color: "#5b21b6", flexShrink: 0 }} /> Edit Client
                                        </button>
                                        <div style={{ height: 1, background: "#f3f4f6", margin: "0 12px" }} />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenRowMenuId(null);
                                            confirmDelete(client._id);
                                          }}
                                          style={{
                                            width: "100%", display: "flex", alignItems: "center", gap: 8,
                                            padding: "10px 16px", border: "none", background: "transparent",
                                            cursor: "pointer", fontSize: 13, color: "#dc2626", textAlign: "left",
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = "#fef2f2"}
                                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                        >
                                          <FaTrash style={{ color: "#dc2626", flexShrink: 0 }} /> Delete
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
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

          {/* Client Details View */}
          {activeTab === "Client Details" && selectedClient && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  className="text-sm text-violet-800 border border-violet-800 rounded-md px-3 py-1 hover:bg-violet-50"
                  onClick={closeClientDetails}
                >
                  ← Back to Clients
                </button>
              </div>

              {/* Header card */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <ClientLogoAvatar
                    client={selectedClient}
                    logoUrl={clientLogoUrls[clientIdKey(selectedClient)]}
                    sizeClass="h-16 w-16"
                    textClass="text-2xl"
                  />
                  <div className="ml-4">
                    <div className="text-xl font-semibold">{selectedClient.name}</div>
                    <div className="text-sm text-gray-600">{selectedClient.businessName || "Business"}</div>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 flex gap-2 flex-wrap items-center">
                  <button
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 text-sm flex items-center gap-2"
                    onClick={() => setActiveTab("Social Media")}
                  >
                    <FaShareAlt className="text-sm" />
                    Social Media
                  </button>
                  {isEditingClientDetails && (
                    <>
                      <button
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 text-sm"
                        onClick={cancelInlineEditClientDetails}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 bg-violet-800 text-white rounded-full hover:bg-violet-900 text-sm"
                        onClick={saveInlineEditClientDetails}
                      >
                        Save
                      </button>
                    </>
                  )}
                  <button
                    className="px-4 py-2 bg-violet-800 text-white rounded-full hover:bg-violet-900 text-sm"
                    onClick={() => openClientLogin(selectedClient._id, selectedClient.email, selectedClient.name)}
                  >
                    Authenticate
                  </button>
                  {/* 3 Dots Menu */}
                  <div className="relative">
                    <button
                      className="px-3 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 text-sm flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowClientDetailsMenu(!showClientDetailsMenu);
                      }}
                    >
                      <FaEllipsisV />
                    </button>
                    {showClientDetailsMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowClientDetailsMenu(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-30 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                          <div className="py-1">
                            {!isEditingClientDetails && (
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowClientDetailsMenu(false);
                                  startInlineEditClientDetails();
                                }}
                              >
                                <FaEdit className="mr-2" />
                                Edit
                              </button>
                            )}
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowClientDetailsMenu(false);
                                confirmDelete(selectedClient._id);
                              }}
                            >
                              <FaTrash className="mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="border rounded-lg p-4 border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaUser className="mr-2"/> Full Name</div>
                    {!isEditingClientDetails ? (
                      <div className="text-sm font-semibold">{selectedClient.name || '-'}</div>
                    ) : (
                      <input
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-violet-800 focus:ring-violet-800 focus:outline-none text-sm"
                        value={clientDetailsDraft?.name || ''}
                        onChange={(e) => setClientDetailsDraft({ ...clientDetailsDraft, name: e.target.value })}
                      />
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaBuilding className="mr-2"/> Business Name</div>
                    {!isEditingClientDetails ? (
                      <div className="text-sm font-semibold">{selectedClient.businessName || '-'}</div>
                    ) : (
                      <input
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-violet-800 focus:ring-violet-800 focus:outline-none text-sm"
                        value={clientDetailsDraft?.businessName || ''}
                        onChange={(e) => setClientDetailsDraft({ ...clientDetailsDraft, businessName: e.target.value })}
                      />
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100 break-words">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaEnvelope className="mr-2"/> Email</div>
                    {!isEditingClientDetails ? (
                      <div className="text-sm font-semibold">{selectedClient.email || '-'}</div>
                    ) : (
                      <input
                        type="email"
                        className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-violet-800 focus:ring-violet-800 focus:outline-none text-sm"
                        value={clientDetailsDraft?.email || ''}
                        onChange={(e) => setClientDetailsDraft({ ...clientDetailsDraft, email: e.target.value })}
                      />
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaIdCard className="mr-2"/> GST Number</div>
                    {!isEditingClientDetails ? (
                      <div className="text-sm font-semibold">{selectedClient.gstNo || '-'}</div>
                    ) : (
                      <input
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-violet-800 focus:ring-violet-800 focus:outline-none text-sm"
                        value={clientDetailsDraft?.gstNo || ''}
                        onChange={(e) => setClientDetailsDraft({ ...clientDetailsDraft, gstNo: e.target.value })}
                      />
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaAddressCard className="mr-2"/> PAN Number</div>
                    {!isEditingClientDetails ? (
                      <div className="text-sm font-semibold">{selectedClient.panNo || '-'}</div>
                    ) : (
                      <input
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-violet-800 focus:ring-violet-800 focus:outline-none text-sm"
                        value={clientDetailsDraft?.panNo || ''}
                        onChange={(e) => setClientDetailsDraft({ ...clientDetailsDraft, panNo: e.target.value })}
                      />
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100 break-words">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaGlobe className="mr-2"/> Website</div>
                    {!isEditingClientDetails ? (
                      <div className="text-sm font-semibold">
                        {selectedClient.websiteUrl ? (
                          <a href={selectedClient.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-violet-800 hover:underline inline-flex items-center">
                            {selectedClient.websiteUrl}
                            <FaExternalLinkAlt className="ml-1 text-xs" />
                          </a>
                        ) : (
                          '-'
                        )}
                      </div>
                    ) : (
                      <input
                        type="url"
                        className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-violet-800 focus:ring-violet-800 focus:outline-none text-sm"
                        value={clientDetailsDraft?.websiteUrl || ''}
                        onChange={(e) => setClientDetailsDraft({ ...clientDetailsDraft, websiteUrl: e.target.value })}
                      />
                    )}
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaMapMarkerAlt className="mr-2"/> City</div>
                    {!isEditingClientDetails ? (
                      <div className="text-sm font-semibold">{selectedClient.city || '-'}</div>
                    ) : (
                      <input
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-violet-800 focus:ring-violet-800 focus:outline-none text-sm"
                        value={clientDetailsDraft?.city || ''}
                        onChange={(e) => setClientDetailsDraft({ ...clientDetailsDraft, city: e.target.value })}
                      />
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaHashtag className="mr-2"/> Pincode</div>
                    {!isEditingClientDetails ? (
                      <div className="text-sm font-semibold">{selectedClient.pincode || '-'}</div>
                    ) : (
                      <input
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-violet-800 focus:ring-violet-800 focus:outline-none text-sm"
                        value={clientDetailsDraft?.pincode || ''}
                        onChange={(e) => setClientDetailsDraft({ ...clientDetailsDraft, pincode: e.target.value })}
                      />
                    )}
                  </div>

                  {/* Filter */}
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1">Account Type</div>
                    {!isEditingClientDetails ? (
                      <div className="text-sm font-semibold">
                        {(selectedClient.filter || 'all')
                          .split('-')
                          .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                          .join('-')}
                      </div>
                    ) : (
                      <select
                        className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-violet-800 focus:ring-violet-800 focus:outline-none text-sm"
                        value={clientDetailsDraft?.filter || 'all'}
                        onChange={(e) => setClientDetailsDraft({ ...clientDetailsDraft, filter: e.target.value })}
                      >
                        <option value="all">All</option>
                        <option value="new">New</option>
                        <option value="prime">Prime</option>
                        <option value="demo">Demo</option>
                        <option value="in-house">In-house</option>
                        <option value="testing">Testing</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    )}
                  </div>
                  
        
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaCalendarAlt className="mr-2"/> Registration Date</div>
                    <div className="text-sm font-semibold">{formatDate(selectedClient.createdAt)}</div>
                  </div>
                  {/* <div className="bg-gray-50 rounded-md p-3 border border-violet-100">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaClock className="mr-2"/> Last Login</div>
                    <div className="text-sm font-semibold">{selectedClient.lastLoginAt ? formatDate(selectedClient.lastLoginAt) : '-'}</div>
                  </div> */}
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaGoogle className="mr-2"/> Google User</div>
                    <div className="text-sm font-semibold">{selectedClient.isGoogleUser ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-violet-100">
                    <div className="flex items-center text-violet-800 text-xs font-medium mb-1"><FaCheckCircle className="mr-2"/> Email Verified</div>
                    <div className="text-sm font-semibold">{selectedClient.emailVerified ? 'Verified' : 'Not Verified'}</div>
                  </div>
                </div>
              </div>

            </div>
          )}  

          {/* Switch Users Tab */}
          {activeTab === "Switch Users" && (
            <SwitchUsersTab onSwitchSuccess={onSwitchSuccess} />
          )}

          {/* Apps Tab */}
          {activeTab === "Apps" && (
            <AppsTab />
          )}

          {/* Tools Tab */}
          {activeTab === "Tools" && (
            <div className="bg-white rounded-lg shadow p-6">
              <AdminTools
                onOpenTelegram={() => setActiveTab("Telegram Alerts")}
                onOpenBanner={() => setActiveTab("Home Banners")}
                onOpenKYC={() => setActiveTab("KYC Management")}
                onOpenWithdraw={() => setActiveTab("Withdrawal Requests")}
                onOpenTestimonials={() => setActiveTab("Testimonials")}
              />
            </div>
          )}

          {/* Home Banners */}
          {activeTab === "Home Banners" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <button className="text-sm text-violet-800 border border-violet-800 rounded-md px-3 py-1 hover:bg-violet-50"
                  onClick={() => setActiveTab("Tools")}>← Back to Tools</button>
              </div>
              <AdminBannerManager />
            </div>
          )}

          {/* KYC Management */}
          {activeTab === "KYC Management" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <button className="text-sm text-violet-800 border border-violet-800 rounded-md px-3 py-1 hover:bg-violet-50"
                  onClick={() => setActiveTab("Tools")}>← Back to Tools</button>
              </div>
              <AdminKYCPanel />
            </div>
          )}

          {/* Withdrawal Requests */}
          {activeTab === "Withdrawal Requests" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <button className="text-sm text-violet-800 border border-violet-800 rounded-md px-3 py-1 hover:bg-violet-50"
                  onClick={() => setActiveTab("Tools")}>← Back to Tools</button>
              </div>
              <AdminWithdrawPanel />
            </div>
          )}

          {/* Testimonials */}
          {activeTab === "Testimonials" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <button className="text-sm text-violet-800 border border-violet-800 rounded-md px-3 py-1 hover:bg-violet-50"
                  onClick={() => setActiveTab("Tools")}>← Back to Tools</button>
              </div>
              <AdminTestimonialPanel />
            </div>
          )}

          {activeTab === "Social Media" && selectedClient && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  className="text-sm text-violet-800 border border-violet-800 rounded-md px-3 py-1 hover:bg-violet-50"
                  onClick={() => setActiveTab("Client Details")}
                >
                  ← Back to Client Details
                </button>
              </div>
              <SocialMedia client={selectedClient} />
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === "Accounts" && (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
                <FaRupeeSign className="text-violet-600 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Accounts & Billing</h2>
              <p className="text-gray-500 text-sm">This section is coming soon.</p>
            </div>
          )}

          {activeTab === "News & Blog" && (
            <div className="bg-white rounded-lg shadow p-6">
              <AdminNewsBlog />
            </div>
          )}

          {activeTab === "News & Blog" && (
            <div className="bg-white rounded-lg shadow p-6">
              <AdminNewsBlog />
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === "Statistics" && (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
                <FaDatabase className="text-violet-600 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Statistics & Analytics</h2>
              <p className="text-gray-500 text-sm">This section is coming soon.</p>
            </div>
          )}

          {/* Support Tab */}
          {activeTab === "Support" && (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
                <FaHeadset className="text-violet-600 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Support Center</h2>
              <p className="text-gray-500 text-sm">This section is coming soon.</p>
            </div>
          )}

          {/* Help Tab */}
          {activeTab === "Help" && (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
                <FaQuestionCircle className="text-violet-600 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Help & Documentation</h2>
              <p className="text-gray-500 text-sm">This section is coming soon.</p>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "Settings" && (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
                <FaCog className="text-violet-600 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Settings</h2>
              <p className="text-gray-500 text-sm">This section is coming soon.</p>
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

      {typeof document !== "undefined" &&
        createPortal(
          <>
            {showAddClientModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(17, 24, 39, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            boxSizing: "border-box",
            overflowY: "auto",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-client-modal-title"
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 680,
              maxHeight: "min(90vh, 920px)",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              margin: "auto",
              flexShrink: 0,
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-800 to-violet-900 h-16 flex items-center justify-between px-6 rounded-t-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                  <FaPlus className="text-violet-800 text-lg" />
                </div>
                <span id="add-client-modal-title" className="text-white font-semibold text-xl">Add New Client</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-5">
                {/* Business Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Business Name <span className="text-violet-600">*</span></label>
                  <input type="text" placeholder="e.g. Acme Corp" autoComplete="off"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    value={newClient.businessName} onChange={(e) => setNewClient({ ...newClient, businessName: e.target.value })} />
                </div>
                {/* Website */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Website URL</label>
                  <input type="url" placeholder="https://example.com" autoComplete="off"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    value={newClient.websiteUrl} onChange={(e) => setNewClient({ ...newClient, websiteUrl: e.target.value })} />
                </div>
                {/* GST */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">GST Number</label>
                  <input type="text" placeholder="22AAAAA0000A1Z5" autoComplete="off"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    value={newClient.gstNo} onChange={(e) => setNewClient({ ...newClient, gstNo: e.target.value })} />
                </div>
                {/* PAN */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">PAN Number</label>
                  <input type="text" placeholder="AAAAA0000A" autoComplete="off"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    value={newClient.panNo} onChange={(e) => setNewClient({ ...newClient, panNo: e.target.value })} />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 mb-5" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name <span className="text-violet-600">*</span></label>
                  <input type="text" placeholder="Enter full name" autoComplete="off"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address <span className="text-violet-600">*</span></label>
                  <input type="email" placeholder="client@example.com" autoComplete="new-password"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
                </div>
                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">City</label>
                  <input type="text" placeholder="e.g. Mumbai" autoComplete="off"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    value={newClient.city} onChange={(e) => setNewClient({ ...newClient, city: e.target.value })} />
                </div>
                {/* Pincode */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pincode</label>
                  <input type="text" placeholder="e.g. 110001" autoComplete="off" name="pincode-field"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    value={newClient.pincode} onChange={(e) => setNewClient({ ...newClient, pincode: e.target.value })} />
                </div>
                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password <span className="text-violet-600">*</span></label>
                  <input type="password" placeholder="Min 8 characters" autoComplete="new-password"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    value={newClient.password} onChange={(e) => setNewClient({ ...newClient, password: e.target.value })} />
                </div>
                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password <span className="text-violet-600">*</span></label>
                  <input type="password" placeholder="Re-enter password" autoComplete="new-password"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                    value={newClient.confirmPassword} onChange={(e) => setNewClient({ ...newClient, confirmPassword: e.target.value })} />
                </div>
              </div>

              {/* Logo Upload */}
              <div className="border border-dashed border-gray-300 rounded-xl p-4 mb-5 bg-gray-50">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Business Logo <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" onChange={handleLogoFileSelect}
                    className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer" />
                  {businessLogoPreview && (
                    <img src={businessLogoPreview} alt="Preview" className="h-12 w-12 rounded-lg object-cover border border-gray-200" />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">JPEG, PNG, GIF, WebP — max 5MB</p>
              </div>

              <p className="text-xs text-gray-400 mb-4"><span className="text-violet-600">*</span> Required fields</p>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  onClick={() => { setShowAddClientModal(false); setBusinessLogoFile(null); setBusinessLogoPreview(null); }}>
                  Cancel
                </button>
                <button className="px-5 py-2 bg-violet-800 text-white rounded-lg hover:bg-violet-900 text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
                  disabled={addClientLoading}
                  onClick={handleAddClient}>
                  {addClientLoading ? (
                    <><svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Creating...</>
                  ) : "Create Client"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(17, 24, 39, 0.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}>
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

      {/* Edit Client Modal */}
      {showEditClientModal && clientBeingEdited && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(17, 24, 39, 0.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box", overflowY: "auto" }}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg relative text-gray-900"
            style={{ margin: "auto", color: "#111827", colorScheme: "light" }}
          >
            <div className="bg-gradient-to-r from-violet-800 to-violet-900 h-14 flex items-center justify-between px-5 rounded-t-xl">
              <span className="text-white font-semibold text-lg flex items-center gap-2"><FaEdit /> Edit Client</span>
              <button className="text-white hover:text-gray-200" onClick={() => { setShowEditClientModal(false); setClientBeingEdited(null); setBusinessLogoFile(null); setBusinessLogoPreview(null); }}>
                <FaTimes size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</label>
                  <input type="text" className={CLIENT_MODAL_FIELD} autoComplete="off"
                    value={clientBeingEdited.name || ""}
                    onChange={(e) => setClientBeingEdited({ ...clientBeingEdited, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                  <input type="email" className={CLIENT_MODAL_FIELD} autoComplete="off"
                    value={clientBeingEdited.email || ""}
                    onChange={(e) => setClientBeingEdited({ ...clientBeingEdited, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Business Name</label>
                  <input type="text" className={CLIENT_MODAL_FIELD} autoComplete="off"
                    value={clientBeingEdited.businessName || ""}
                    onChange={(e) => setClientBeingEdited({ ...clientBeingEdited, businessName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Website URL</label>
                  <input type="url" className={CLIENT_MODAL_FIELD} autoComplete="off"
                    value={clientBeingEdited.websiteUrl || ""}
                    onChange={(e) => setClientBeingEdited({ ...clientBeingEdited, websiteUrl: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">City</label>
                  <input type="text" className={CLIENT_MODAL_FIELD} autoComplete="off"
                    value={clientBeingEdited.city || ""}
                    onChange={(e) => setClientBeingEdited({ ...clientBeingEdited, city: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pincode</label>
                  <input type="text" className={CLIENT_MODAL_FIELD} autoComplete="off" name="edit-pincode"
                    value={clientBeingEdited.pincode || ""}
                    onChange={(e) => setClientBeingEdited({ ...clientBeingEdited, pincode: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">GST Number</label>
                  <input type="text" className={CLIENT_MODAL_FIELD} autoComplete="off"
                    value={clientBeingEdited.gstNo || ""}
                    onChange={(e) => setClientBeingEdited({ ...clientBeingEdited, gstNo: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">PAN Number</label>
                  <input type="text" className={CLIENT_MODAL_FIELD} autoComplete="off"
                    value={clientBeingEdited.panNo || ""}
                    onChange={(e) => setClientBeingEdited({ ...clientBeingEdited, panNo: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">New Password <span className="text-gray-400 font-normal normal-case">(leave blank to keep)</span></label>
                  <input type="password" placeholder="Enter new password" autoComplete="new-password"
                    className={CLIENT_MODAL_FIELD}
                    value={clientBeingEdited._newPassword || ""}
                    onChange={(e) => setClientBeingEdited({ ...clientBeingEdited, _newPassword: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirm Password</label>
                  <input type="password" placeholder="Confirm new password" autoComplete="new-password"
                    className={CLIENT_MODAL_FIELD}
                    value={clientBeingEdited._confirmPassword || ""}
                    onChange={(e) => setClientBeingEdited({ ...clientBeingEdited, _confirmPassword: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Account Type</label>
                  <select className={CLIENT_MODAL_FIELD}
                    value={clientBeingEdited.filter || "all"}
                    onChange={(e) => setClientBeingEdited({ ...clientBeingEdited, filter: e.target.value })}>
                    <option value="all">All</option>
                    <option value="new">New</option>
                    <option value="prime">Prime</option>
                    <option value="demo">Demo</option>
                    <option value="in-house">In-house</option>
                    <option value="testing">Testing</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Business Logo <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                  <div className="flex items-center gap-3 border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50">
                    <input type="file" accept="image/*" onChange={handleLogoFileSelect}
                      className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer flex-1" />
                    {businessLogoPreview && (
                      <img src={businessLogoPreview} alt="Preview" className="h-10 w-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP — max 5MB</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
              <button className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                onClick={() => { setShowEditClientModal(false); setClientBeingEdited(null); setBusinessLogoFile(null); setBusinessLogoPreview(null); }}>Cancel</button>
              <button className="px-5 py-2 bg-violet-800 text-white rounded-lg hover:bg-violet-900 text-sm font-medium disabled:opacity-60 flex items-center gap-2"
                disabled={saveClientLoading}
                onClick={async () => {
                  try {
                    setSaveClientLoading(true);
                    if (clientBeingEdited._newPassword) {
                      if (clientBeingEdited._newPassword !== clientBeingEdited._confirmPassword) {
                        alert("Passwords do not match"); return;
                      }
                      if (clientBeingEdited._newPassword.length < 6) {
                        alert("Password must be at least 6 characters"); return;
                      }
                    }
                    let logoData = {};
                    if (businessLogoFile) {
                      try { logoData = await uploadBusinessLogo(businessLogoFile); }
                      catch (e) { alert(e.message || "Logo upload failed"); return; }
                    }
                    const extras = { ...logoData };
                    if (clientBeingEdited._newPassword) extras.password = clientBeingEdited._newPassword;
                    const data = await updateClientApi(
                      clientBeingEdited._id,
                      buildClientUpdatePayload(clientBeingEdited, extras)
                    );
                    setShowEditClientModal(false);
                    setClientBeingEdited(null);
                    setBusinessLogoFile(null);
                    setBusinessLogoPreview(null);
                    if (selectedClient?._id === clientBeingEdited._id && data.data) {
                      setSelectedClient(data.data);
                    }
                    await getclients();
                    alert("Client updated successfully");
                  } catch (err) {
                    alert(err.message || "Failed to update client");
                  } finally {
                    setSaveClientLoading(false);
                  }
                }}>
                {saveClientLoading ? (
                  <><svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
                ) : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
          </>,
          document.body
        )}
    </div>
  );

};

export default AdminDashboard;
