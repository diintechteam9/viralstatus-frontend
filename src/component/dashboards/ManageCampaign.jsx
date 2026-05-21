import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { API_BASE_URL } from "../../config";
import { FaLink } from "react-icons/fa";
import ParticipantsView from "./campaign-management/ParticipantsView";
import TaskManagement from "./campaign-management/TaskManagement";

const ManageCampaign = ({ campaign, onBack }) => {
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ ...campaign });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState("");
  const [userDetails, setUserDetails] = useState({}); // { userId: { name, ... } }
  const [userDetailsLoading, setUserDetailsLoading] = useState({}); // { userId: true/false }
  const [userDetailsError, setUserDetailsError] = useState({}); // { userId: error }
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedReelsByPool, setSelectedReelsByPool] = useState({}); // { poolId: [reelId, ...] }
  const [reelsPerUser, setReelsPerUser] = useState(1);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  // Track which pool is expanded in ContentPoolFolderView
  const [expandedPoolId, setExpandedPoolId] = useState(null);
  const [youtubeReels, setYoutubeReels] = useState(0);
  const [instagramReels, setInstagramReels] = useState(0);
  const [userResponses, setUserResponses] = useState([]); // [{ userId, urls, campaignId, _id }]
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [responsesError, setResponsesError] = useState("");
  // Removed linkStats and statsLoading as stats API is no longer used
  const [videoStats, setVideoStats] = useState({}); // { url: { views, likes, comments } }
  const [analyticsVisibleCount, setAnalyticsVisibleCount] = useState(10);
  const [participantsVisibleCount, setParticipantsVisibleCount] = useState(10);
  const [analyticsSearch, setAnalyticsSearch] = useState("");
  const [analyticsSort, setAnalyticsSort] = useState(""); // '', 'asc', 'desc'
  const [participantsSearch, setParticipantsSearch] = useState("");
  const [participantsSort, setParticipantsSort] = useState(""); // '', 'asc', 'desc'
  const [analyticsMetricSort, setAnalyticsMetricSort] = useState(""); // 'views' | 'likes' | 'comments' | ''
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedUserProfileLoading, setSelectedUserProfileLoading] = useState(false);
  const [selectedUserProfileError, setSelectedUserProfileError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Tasks tab state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [autoApproval, setAutoApproval] = useState(!!campaign?.autoApproval);
  const [toggleApprovalLoading, setToggleApprovalLoading] = useState(false);
  const [penaltyThresholdMinutes, setPenaltyThresholdMinutes] = useState(30);
  const [cancellationPenalty, setCancellationPenalty] = useState(2);
  const [allowCancellation, setAllowCancellation] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [assignStrategy, setAssignStrategy] = useState("roundRobin");
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [bulkAssignError, setBulkAssignError] = useState("");
  const [bulkAssignSuccess, setBulkAssignSuccess] = useState("");
  const [taskActionLoading, setTaskActionLoading] = useState({});

  const userData = JSON.parse(
    localStorage.getItem("clientData") ||
    sessionStorage.getItem("clientData") || "{}"
  );
  const clientId = userData._id || userData.id || userData.clientId;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const getClientToken = () =>
    localStorage.getItem("clienttoken") || sessionStorage.getItem("clienttoken") || "";

  useEffect(() => {
    setAutoApproval(!!campaign?.autoApproval);
    setPenaltyThresholdMinutes(campaign?.penaltyThresholdMinutes ?? 30);
    setCancellationPenalty(campaign?.cancellationPenalty ?? 2);
    setAllowCancellation(campaign?.allowCancellation !== false);
  }, [campaign]);

  useEffect(() => {
    const fetchParticipants = async () => {
      setParticipantsLoading(true);
      setParticipantsError("");
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/auth/user/campaign/activeparticipants/${campaign._id}`
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setParticipants(data.userIds || []);
        } else {
          setParticipantsError(data.message || "Failed to fetch participants");
        }
      } catch (err) {
        setParticipantsError("Failed to fetch participants");
      } finally {
        setParticipantsLoading(false);
      }
    };
    if (campaign && campaign._id) {
      fetchParticipants();
    }
  }, [campaign]);

  // Fetch user details for each participant
  useEffect(() => {
    const fetchUserDetails = async (userId) => {
      setUserDetailsLoading((prev) => ({ ...prev, [userId]: true }));
      setUserDetailsError((prev) => ({ ...prev, [userId]: "" }));
      try {
        const userRes = await fetch(
          `${API_BASE_URL}/api/user/by-googleid/${userId}`
        );
        const userData = await userRes.json();
        if (userRes.ok && userData.success) {
          setUserDetails((prev) => ({ ...prev, [userId]: userData.user }));
        } else {
          setUserDetailsError((prev) => ({
            ...prev,
            [userId]: userData.message || "Failed to fetch user",
          }));
        }
      } catch (err) {
        setUserDetailsError((prev) => ({
          ...prev,
          [userId]: "Failed to fetch user",
        }));
      } finally {
        setUserDetailsLoading((prev) => ({ ...prev, [userId]: false }));
      }
    };
    participants.forEach((userId) => {
      if (!userDetails[userId] && !userDetailsLoading[userId]) {
        fetchUserDetails(userId);
      }
    });
    // eslint-disable-next-line
  }, [participants]);

  // Fetch user responses for each participant
  const fetchResponses = async () => {
    setResponsesLoading(true);
    setResponsesError("");
    try {
      const allResponses = [];
      for (const userId of participants) {
        const res = await fetch(
          `${API_BASE_URL}/api/pools/user/response/get/${userId}`
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data.response)) {
          data.response.forEach((resp) =>
            allResponses.push({ ...resp, userId })
          );
        }
      }
      setUserResponses(allResponses);
    } catch (err) {
      setResponsesError("Failed to fetch user responses");
    } finally {
      setResponsesLoading(false);
    }
  };

  useEffect(() => {
    if (participants.length > 0) {
      fetchResponses();
    } else {
      setUserResponses([]);
    }
    // eslint-disable-next-line
  }, [participants]);

  const fetchAllStats = async () => {
    setResponsesLoading(true); // Optional: show loading
    try {
      // Call backend to approve credits and update views/flags
      const token = getClientToken();
      const res = await fetch(
        `${API_BASE_URL}/api/pools/reels/approved/${campaign._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const data = await res.json();
      console.log(data);
      // If backend updated anything, fetch latest user responses and stats
      if (data.updated) {
        // Fetch updated user responses
        await fetchResponses();
      }
      // Now fetch stats for UI display as before
      const statsMap = {};
      for (const resp of userResponses.filter(
        (r) => r.campaignId === campaign._id
      )) {
        const videoId = extractYoutubeId(resp.urls);
        if (videoId) {
          const trimmedVideoId = videoId.trim();
          try {
            const statsRes = await fetch(
              `${API_BASE_URL}/api/pools/stats?videoId=${encodeURIComponent(
                trimmedVideoId
              )}`
            );
            const statsData = await statsRes.json();
            statsMap[resp.urls] = statsData.stats || {
              views: "-",
              likes: "-",
              comments: "-",
            };
          } catch (err) {
            statsMap[resp.urls] = { views: "-", likes: "-", comments: "-" };
          }
        }
      }
      setVideoStats(statsMap);
    } catch (err) {
      // Optionally handle error
    }
    setResponsesLoading(false); // Optional: hide loading
  };

  const fetchTasks = useCallback(async () => {
    if (!campaign?._id) return;
    setTasksLoading(true);
    setTasksError("");
    try {
      const token = getClientToken();
      const res = await fetch(
        `${API_BASE_URL}/api/pools/task/campaign/${campaign._id}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        const enriched = (data.tasks || []).map((t) => ({
          ...t,
          userName: userDetails[t.userId]?.name || t.userId,
        }));
        setTasks(enriched);
        if (data.settings) {
          setAutoApproval(!!data.settings.autoApproval);
          setPenaltyThresholdMinutes(data.settings.penaltyThresholdMinutes ?? 30);
          setCancellationPenalty(data.settings.cancellationPenalty ?? 2);
          setAllowCancellation(data.settings.allowCancellation !== false);
        }
      } else {
        setTasksError(data.message || "Failed to fetch tasks");
      }
    } catch {
      setTasksError("Failed to fetch tasks");
    } finally {
      setTasksLoading(false);
    }
  }, [campaign?._id, userDetails]);

  useEffect(() => {
    fetchAllStats();
    if (activeTab === "tasks") {
      fetchTasks();
    }
  }, [activeTab, fetchTasks]);

  // Handle task accept/reject
  const handleTaskAction = async (taskId, userId, action) => {
    const taskKey = `${taskId}-${userId}`;
    setTaskActionLoading(prev => ({ ...prev, [taskKey]: true }));
    try {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/api/pools/task/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          reelId: taskId,
          campaignId: campaign._id
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh tasks
        await fetchTasks();
      } else {
        alert(data.message || `Failed to ${action} task`);
      }
    } catch (err) {
      alert(`Failed to ${action} task`);
    } finally {
      setTaskActionLoading(prev => ({ ...prev, [taskKey]: false }));
    }
  };

  const toggleAutoApproval = async () => {
    setToggleApprovalLoading(true);
    try {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/api/auth/user/campaign/${campaign._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ autoApproval: !autoApproval }),
      });
      if (res.ok) setAutoApproval(!autoApproval);
    } catch (err) {
      console.error("Failed to toggle auto approval:", err);
    } finally {
      setToggleApprovalLoading(false);
    }
  };

  const taskKey = (task) => `${task.reelId}-${task.userId}`;

  const handleTaskSelect = (task) => {
    const key = taskKey(task);
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelectAllTasks = () => {
    if (tasks.length === 0) return;
    const allKeys = tasks.map(taskKey);
    const allSelected = allKeys.every((k) => selectedTasks.has(k));
    setSelectedTasks(allSelected ? new Set() : new Set(allKeys));
  };

  const getSelectedTaskPayload = () =>
    tasks
      .filter((t) => selectedTasks.has(taskKey(t)))
      .map((t) => ({ userId: t.userId, reelId: t.reelId }));

  const handleBulkAccept = async () => {
    const payload = getSelectedTaskPayload();
    if (!payload.length) return;
    setBulkLoading(true);
    try {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/api/pools/task/bulk-accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tasks: payload, campaignId: campaign._id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedTasks(new Set());
        await fetchTasks();
      } else {
        alert(data.message || "Bulk accept failed");
      }
    } catch {
      alert("Bulk accept failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    const payload = getSelectedTaskPayload();
    if (!payload.length) return;
    setBulkLoading(true);
    try {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/api/pools/task/bulk-reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tasks: payload, campaignId: campaign._id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedTasks(new Set());
        await fetchTasks();
      } else {
        alert(data.message || "Bulk reject failed");
      }
    } catch {
      alert("Bulk reject failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCancelTask = async (task) => {
    const reason = window.prompt("Cancellation reason (optional):") ?? "";
    const taskK = taskKey(task);
    setTaskActionLoading((prev) => ({ ...prev, [taskK]: true }));
    try {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/api/pools/task/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: task.userId,
          reelId: task.reelId,
          campaignId: campaign._id,
          reason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.creditsPenalized > 0) {
          alert(`Task cancelled. ${data.creditsPenalized} credit(s) deducted.`);
        }
        await fetchTasks();
      } else {
        alert(data.message || "Failed to cancel task");
      }
    } catch {
      alert("Failed to cancel task");
    } finally {
      setTaskActionLoading((prev) => ({ ...prev, [taskK]: false }));
    }
  };

  const handleBulkAssign = async () => {
    setBulkAssignError("");
    setBulkAssignSuccess("");
    if (!expandedPoolId || !selectedReelsByPool[expandedPoolId]?.length) {
      setBulkAssignError("Select at least one reel from a content pool.");
      return;
    }
    if (!selectedUsers.length) {
      setBulkAssignError(
        "No participants selected. Open Participants tab, check users, then try Bulk Assign again."
      );
      return;
    }
    setBulkAssignLoading(true);
    try {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/api/pools/task/bulk-assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          reelIds: selectedReelsByPool[expandedPoolId],
          reelsPerUser: reelsPerUser || 1,
          campaignId: campaign._id,
          strategy: assignStrategy,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBulkAssignSuccess(data.message || "Tasks assigned successfully");
        setBulkAssignOpen(false);
        await fetchTasks();
      } else {
        setBulkAssignError(data.error || data.message || "Bulk assign failed");
      }
    } catch {
      setBulkAssignError("Bulk assign failed");
    } finally {
      setBulkAssignLoading(false);
    }
  };

  const exportParticipantsCsv = () => {
    const rows = [["Name", "Email", "City", "User ID", "Response Status"]];
    participants.forEach((id) => {
      const u = userDetails[id] || {};
      rows.push([
        u.name || id,
        u.email || "",
        u.city || "",
        id,
        hasUserResponded(id) ? "Completed" : "Pending",
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participants-${campaign.campaignName || campaign._id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const openUserDetails = (googleId) => {
    setSelectedUserForDetails(googleId);
    setSelectedUserProfile(null);
    setSelectedUserProfileError("");
    setSelectedUserProfileLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/user/by-googleid/${encodeURIComponent(googleId)}`
        );
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          const u = data.user;
          setSelectedUserProfile({ ...u, mobileNumber: u.mobileNumber || u.mobile });
        } else {
          setSelectedUserProfileError(data.message || "Failed to fetch user profile");
        }
      } catch (err) {
        setSelectedUserProfileError("Failed to fetch user profile");
      } finally {
        setSelectedUserProfileLoading(false);
      }
    })();
  };

  const closeUserDetails = () => {
    setSelectedUserForDetails(null);
    setSelectedUserProfile(null);
    setSelectedUserProfileError("");
    setSelectedUserProfileLoading(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = getClientToken();
      const res = await fetch(
        `${API_BASE_URL}/api/auth/user/campaign/${editForm._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(editForm),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setEditMode(false);
        onBack(); // Go back to refresh list
      } else {
        setError(data.message || "Failed to update campaign");
      }
    } catch {
      setError("Failed to update campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this campaign? This action cannot be undone."
      )
    )
      return;
    setLoading(true);
    setError("");
    try {
      const token = getClientToken();
      const res = await fetch(
        `${API_BASE_URL}/api/auth/user/campaign/${campaign._id}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        onBack(); // Go back to refresh list
      } else {
        setError(data.message || "Failed to delete campaign");
      }
    } catch {
      setError("Failed to delete campaign");
    } finally {
      setLoading(false);
    }
  };

  // Get image URL (support both image.url and imageUrl)
  const imageUrl = campaign?.image?.url || campaign?.imageUrl || "";

  // Callback from ContentPoolFolderView
  const handlePoolReelSelectionChange = (selected) => {
    setSelectedReelsByPool(selected);
    // Find the currently expanded pool
    const expanded = Object.keys(selected).find(
      (poolId) => selected[poolId] && selected[poolId].length > 0
    );
    setExpandedPoolId(expanded || null);
  };

  const handleSend = async () => {
    setSendLoading(true);
    setSendError("");
    setSendSuccess("");
    try {
      if (
        !expandedPoolId ||
        !selectedReelsByPool[expandedPoolId] ||
        selectedReelsByPool[expandedPoolId].length === 0
      ) {
        setSendError("Please select at least one reel.");
        setSendLoading(false);
        return;
      }
      if (selectedUsers.length === 0) {
        setSendError(
          "No participants selected. Open the Participants tab, check users, then assign from Tasks."
        );
        setSendLoading(false);
        return;
      }
      if (!reelsPerUser || reelsPerUser < 1) {
        setSendError("Reels per user must be at least 1.");
        setSendLoading(false);
        return;
      }
      const body = {
        userIds: selectedUsers,
        reelIds: selectedReelsByPool[expandedPoolId],
        reelsPerUser: reelsPerUser,
        campaignId: campaign._id,
      };
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/api/pools/shared`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log("Share reels response:", res.status, data); // Log response status and data
      if (res.ok && data.message) {
        setSendSuccess(data.message);
        await fetchResponses();
        if (activeTab === "tasks") await fetchTasks();
      } else {
        setSendError(data.error || data.message || "Failed to share reels");
        console.error("Share reels error:", data.error || data.message || data);
      }
    } catch (err) {
      setSendError("Failed to share reels");
      console.error("Share reels fetch error:", err);
    } finally {
      setSendLoading(false);
    }
  };

  // Helper to check if user is assigned (has a response for this campaign)
  function isUserAssigned(userId) {
    return userResponses.some(
      (resp) => resp.userId === userId && resp.campaignId === campaign._id
    );
  }

  // Helper to check if user has responded (has a response for this campaign)
  function hasUserResponded(userId) {
    return userResponses.some(
      (resp) => resp.userId === userId && resp.campaignId === campaign._id
    );
  }

  // Calculate total views, likes, and comments for the current campaign
  const campaignResponses = userResponses.filter(
    (r) => r.campaignId === campaign._id
  );
  const totalViews = campaignResponses.reduce((sum, resp) => {
    // Use stored values as primary source, live stats as fallback
    const storedViews = resp.views || 0;
    const liveViews = parseInt(
      (videoStats[resp.urls]?.views || "0").replace(/,/g, ""),
      10
    );
    const v = storedViews > 0 ? storedViews : isNaN(liveViews) ? 0 : liveViews;
    return sum + v;
  }, 0);

  const totalLikes = campaignResponses.reduce((sum, resp) => {
    // Use stored values as primary source, live stats as fallback
    const storedLikes = resp.likes || 0;
    const liveLikes = parseInt(
      (videoStats[resp.urls]?.likes || "0").replace(/,/g, ""),
      10
    );
    const l = storedLikes > 0 ? storedLikes : isNaN(liveLikes) ? 0 : liveLikes;
    return sum + l;
  }, 0);

  const totalComments = campaignResponses.reduce((sum, resp) => {
    // Use stored values as primary source, live stats as fallback
    const storedComments = resp.comments || 0;
    const liveComments = parseInt(
      (videoStats[resp.urls]?.comments || "0").replace(/,/g, ""),
      10
    );
    const c =
      storedComments > 0
        ? storedComments
        : isNaN(liveComments)
        ? 0
        : liveComments;
    return sum + c;
  }, 0);

  // Processed Performance Analytics list (search + sort)
  const processedCampaignResponses = useMemo(() => {
    const toName = (userId) => (userDetails[userId]?.name || userId || "").toString();
    let list = [...campaignResponses];
    const getMetricValue = (resp, key) => {
      const stats = videoStats[resp.urls] || {};
      const fromStats = stats[key];
      const fromResp = resp[key];
      const parseNum = (v) => {
        if (v === undefined || v === null || v === "-") return 0;
        if (typeof v === "string") {
          const n = parseInt(v.replace(/,/g, ""), 10);
          return isNaN(n) ? 0 : n;
        }
        if (typeof v === "number") return v;
        return 0;
      };
      const a = parseNum(fromStats);
      const b = parseNum(fromResp);
      return a > 0 ? a : b;
    };
    if (analyticsSearch.trim()) {
      const q = analyticsSearch.trim().toLowerCase();
      list = list.filter((r) => toName(r.userId).toLowerCase().includes(q));
    }
    if (analyticsMetricSort === 'views' || analyticsMetricSort === 'likes' || analyticsMetricSort === 'comments') {
      const key = analyticsMetricSort;
      list.sort((a, b) => {
        const va = getMetricValue(a, key);
        const vb = getMetricValue(b, key);
        return vb - va; // descending
      });
    } else if (analyticsSort === "asc" || analyticsSort === "desc") {
      list.sort((a, b) => {
        const na = toName(a.userId);
        const nb = toName(b.userId);
        const cmp = na.localeCompare(nb);
        return analyticsSort === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [campaignResponses, userDetails, analyticsSearch, analyticsSort, analyticsMetricSort, videoStats]);

  // Visible subset for Performance Analytics
  const visibleCampaignResponses = processedCampaignResponses.slice(0, analyticsVisibleCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm border border-gray-200 transition-colors font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Campaigns
        </button>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Active Campaign
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="More actions"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-colors"
              disabled={loading}
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            {menuOpen && !editMode && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setMenuOpen(false);
                    setEditMode(true);
                  }}
                  disabled={loading}
                >
                  Edit Campaign
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setMenuOpen(false);
                    handleDelete();
                  }}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Tabs - underline style like GalleryTab */}
      <div className="w-full max-w-6xl mb-6">
        <div role="tablist" className="flex w-full border-b border-gray-200">
          {[
            { label: "Overview", value: "overview" },
            { label: "Participants", value: "participants" },
            { label: "Tasks", value: "tasks" },
            { label: "Analytics", value: "analytics" },
            { label: "Graphs", value: "graphs" },
          ].map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.value)}
                className={`relative -mb-px px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                  isActive
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Performance Analytics */}
      {activeTab === "analytics" && (
        <div className="w-full max-w-6xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Performance Analytics</h3>
                <p className="text-sm text-gray-600">Track user responses and engagement metrics</p>
              </div>
              <button onClick={fetchAllStats} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Refresh Stats
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-medium">Total Views</span>
                  <span className="text-2xl font-bold text-green-900">{totalViews.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <span className="text-red-800 font-medium">Total Likes</span>
                  <span className="text-2xl font-bold text-red-900">{totalLikes.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">Total Comments</span>
                  <span className="text-2xl font-bold text-blue-900">{totalComments.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {responsesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  Loading responses...
                </div>
              </div>
            ) : responsesError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">{responsesError}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <input type="text" value={analyticsSearch} onChange={(e) => { setAnalyticsSearch(e.target.value); setAnalyticsVisibleCount(10); }} placeholder="Search by user name" className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <div className="flex items-center gap-2">
                      <button type="button" className={`px-3 py-2 rounded border text-sm ${analyticsSort === 'asc' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`} onClick={() => setAnalyticsSort('asc')}>Aâ€“Z</button>
                      <button type="button" className={`px-3 py-2 rounded border text-sm ${analyticsSort === 'desc' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`} onClick={() => setAnalyticsSort('desc')}>Zâ€“A</button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-lg">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left font-semibold text-gray-900 border-b border-gray-200">Serial No</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900 border-b border-gray-200">Username</th>
                          <th className="px-6 py-3 text-center font-semibold text-gray-900 border-b border-gray-200">Content</th>
                          <th className="px-6 py-3 text-center font-semibold text-gray-900 border-b border-gray-200">
                            <button type="button" className={`inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${analyticsMetricSort==='views' ? 'text-blue-700' : ''}`} onClick={() => setAnalyticsMetricSort('views')}>Views</button>
                          </th>
                          <th className="px-6 py-3 text-center font-semibold text-gray-900 border-b border-gray-200">
                            <button type="button" className={`inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${analyticsMetricSort==='likes' ? 'text-blue-700' : ''}`} onClick={() => setAnalyticsMetricSort('likes')}>Likes</button>
                          </th>
                          <th className="px-6 py-3 text-center font-semibold text-gray-900 border-b border-gray-200">
                            <button type="button" className={`inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${analyticsMetricSort==='comments' ? 'text-blue-700' : ''}`} onClick={() => setAnalyticsMetricSort('comments')}>Comments</button>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {campaignResponses.length === 0 ? (
                          <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No responses yet</td></tr>
                        ) : (
                          visibleCampaignResponses.map((resp, idx) => {
                            const stats = videoStats[resp.urls] || {};
                            return (
                              <tr key={resp._id || `row-${idx}`} className="hover:bg-yellow-50/80 cursor-pointer transition-colors" onClick={e => { if (e.target.closest('a') || e.target.closest('button')) return; openUserDetails(resp.userId); }}>
                                <td className="px-6 py-4 text-gray-900">{idx + 1}</td>
                                <td className="px-6 py-4 text-gray-900 font-medium">{userDetails[resp.userId]?.name || resp.userId}</td>
                                <td className="px-6 py-4 text-center">
                                  {resp.urls ? (<a href={resp.urls} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"><FaLink size={14} /><span className="text-sm">View</span></a>) : <span className="text-gray-400">-</span>}
                                </td>
                                <td className="px-6 py-4 text-center"><span className="font-medium text-gray-900">{stats.views?.toLocaleString() || resp.views?.toLocaleString() || "-"}</span></td>
                                <td className="px-6 py-4 text-center"><span className="font-medium text-gray-900">{stats.likes?.toLocaleString() || resp.likes?.toLocaleString() || "-"}</span></td>
                                <td className="px-6 py-4 text-center"><span className="font-medium text-gray-900">{stats.comments?.toLocaleString() || resp.comments?.toLocaleString() || "-"}</span></td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {processedCampaignResponses.length > visibleCampaignResponses.length && (
                  <div className="mt-4 flex items-center justify-end">
                    <button type="button" className="px-4 py-2 rounded border text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100" onClick={() => setAnalyticsVisibleCount((c) => c + 10)}>Load more</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}




      {/* Main Content Card (Overview) */}
      {activeTab === "overview" && (
      <div className="w-full max-w-6xl mb-10 space-y-5">

        {/* Hero Banner */}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-md">
          {imageUrl
            ? <img src={imageUrl} alt="Campaign" className="w-full h-60 object-cover" />
            : <div className="w-full h-60 bg-gradient-to-r from-orange-400 to-yellow-500" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <div className="flex flex-wrap gap-2 mb-2">
              {(Array.isArray(campaign.tags) ? campaign.tags : [campaign.tags]).filter(Boolean).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium border border-white/30">#{tag}</span>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-lg">{campaign?.campaignName || "Campaign"}</h1>
            <p className="text-white/80 text-base font-medium mt-1">{campaign.brandName}</p>
          </div>
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow ${campaign.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {campaign.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Brand + Category Images â€” dedicated row */}
        {(campaign.brandImage?.url || campaign.categoryImage?.url) && (
          <ImageRow brandImage={campaign.brandImage} categoryImage={campaign.categoryImage} brandName={campaign.brandName} category={campaign.category} />
        )}

        {/* Info Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div><p className="text-xs text-gray-400 font-medium">Location</p><p className="text-sm font-semibold text-gray-800">{campaign.location || "-"}</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div><p className="text-xs text-gray-400 font-medium">Start Date</p><p className="text-sm font-semibold text-gray-800">{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "-"}</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div><p className="text-xs text-gray-400 font-medium">End Date</p><p className="text-sm font-semibold text-gray-800">{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "-"}</p></div>
          </div>
        </div>

        {/* Goal + Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-100 p-5">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Campaign Goal</h3>
            <p className="text-gray-800 text-sm leading-relaxed">{campaign.goal || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-100 p-5">
            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-gray-800 text-sm leading-relaxed">{campaign.description || "-"}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Campaign Target</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
              <p className="text-2xl font-extrabold text-green-700">{campaign.views?.toLocaleString() || "-"}</p>
              <p className="text-xs text-green-600 mt-1 font-medium">Target Views</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
              <p className="text-2xl font-extrabold text-purple-700">{campaign.limit || "-"}</p>
              <p className="text-xs text-purple-600 mt-1 font-medium">Target Participants</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
              <p className="text-2xl font-extrabold text-orange-700">{campaign.credits || "-"}</p>
              <p className="text-xs text-orange-600 mt-1 font-medium">Credits Per Task</p>
            </div>
            <div className="bg-sky-50 rounded-xl p-4 text-center border border-sky-100">
              <p className="text-2xl font-extrabold text-sky-700">{campaign.cutoff || "-"}</p>
              <p className="text-xs text-sky-600 mt-1 font-medium">Min. Views (MVR)</p>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        {campaign.tNc && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Terms &amp; Conditions
            </h3>
            <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{campaign.tNc}</p>
          </div>
        )}

      </div>
      )}

      {/* Edit Campaign Modal */}
      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-30">
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative"
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Edit Campaign
              </h2>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium shadow-sm transition-colors"
                onClick={() => setEditMode(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    name="campaignName"
                    value={editForm.campaignName || ""}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Campaign Name"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    name="brandName"
                    value={editForm.brandName || ""}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Brand Name"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal
                  </label>
                  <input
                    type="text"
                    name="goal"
                    value={editForm.goal || ""}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Goal"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editForm.description || ""}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Description"
                    rows={3}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits
                  </label>
                  <input
                    type="number"
                    name="credits"
                    value={editForm.credits || ""}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Credits"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limit
                  </label>
                  <input
                    type="number"
                    name="limit"
                    value={editForm.limit || ""}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Limit"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={editForm.location || ""}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Location"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Views
                  </label>
                  <input
                    type="number"
                    name="views"
                    value={editForm.views || ""}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Target Views"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cutoff
                  </label>
                  <input
                    type="number"
                    name="cutoff"
                    value={editForm.cutoff || ""}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Cutoff"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={
                      editForm.startDate ? editForm.startDate.slice(0, 16) : ""
                    }
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={
                      editForm.endDate ? editForm.endDate.slice(0, 16) : ""
                    }
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={
                      Array.isArray(editForm.tags)
                        ? editForm.tags.join(",")
                        : editForm.tags || ""
                    }
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        tags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Tags (comma separated)"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  name="tNc"
                  value={editForm.tNc || ""}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Terms & Conditions"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium shadow-sm disabled:opacity-60 transition-colors"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-700 text-sm">{error}</div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {activeTab === "participants" && (
        <ParticipantsView
          participants={participants}
          participantsLoading={participantsLoading}
          participantsError={participantsError}
          userDetails={userDetails}
          userDetailsLoading={userDetailsLoading}
          userDetailsError={userDetailsError}
          participantsSearch={participantsSearch}
          onParticipantsSearchChange={(v) => {
            setParticipantsSearch(v);
            setParticipantsVisibleCount(10);
          }}
          participantsSort={participantsSort}
          onParticipantsSortChange={setParticipantsSort}
          participantsVisibleCount={participantsVisibleCount}
          onLoadMore={() => setParticipantsVisibleCount((c) => c + 10)}
          hasUserResponded={hasUserResponded}
          selectedUsers={selectedUsers}
          onSelectUser={handleSelectUser}
          onOpenUserDetails={openUserDetails}
          onExport={exportParticipantsCsv}
        />
      )}
      {/* User Details Modal */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-30">
          {/* Modal card with gradient top bar to match ClientDashboard theme */}
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-orange-100 w-full max-w-3xl relative overflow-hidden animate-fadeIn"
            style={{ maxHeight: "86vh", overflowY: "auto" }}
          >
            {/* Top orange bar */}
            <div className="flex items-center justify-between gap-3 px-6 py-4"
                  style={{background: 'linear-gradient(90deg, #ffb55e 30%, #ffa53b 100%)'}}>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 drop-shadow-sm tracking-tight text-left flex-grow">
                User Profile
              </h2>
              <button
                type="button"
                className="ml-4 p-2 rounded-full bg-white/80 text-gray-700 hover:bg-orange-100 transition-colors shadow-md border border-orange-100 hover:scale-105"
                style={{minWidth:'40px', minHeight:'40px'}} onClick={closeUserDetails}
              >
                <span className="text-lg font-semibold">âœ•</span>
              </button>
            </div>
            <div className="px-8 py-6 pb-8">
              {selectedUserProfileLoading ? (
                <div className="py-24 text-center text-xl text-gray-500 tracking-wide">Loading profileâ€¦</div>
              ) : selectedUserProfileError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">{selectedUserProfileError}</div>
              ) : (() => {
                const p = selectedUserProfile || {};
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left details column */}
                    <div>
                      <div className="mb-3">
                        <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Full Name</div>
                        <div className="text-lg font-bold text-gray-900">{p.name || '-'}</div>
                      </div>
                      <div className="mb-3">
                        <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Email</div>
                        <div className="text-lg text-gray-900 font-medium break-words">{p.email || '-'}</div>
                      </div>
                      {p.mobileNumber ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Mobile Number</div>
                          <div className="text-lg text-gray-900 font-medium">{p.mobileNumber}</div>
                        </div>
                      ) : null}
                      {p.city ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">City</div>
                          <div className="text-lg text-gray-900 font-medium">{p.city}</div>
                        </div>
                      ) : null}
                      {p.pincode ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Pincode</div>
                          <div className="text-lg text-gray-900 font-medium">{p.pincode}</div>
                        </div>
                      ) : null}
                      {p.gender ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Gender</div>
                          <div className="text-lg text-gray-900 font-medium">{p.gender}</div>
                        </div>
                      ) : null}
                      {p.ageRange ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Age Range</div>
                          <div className="text-lg text-gray-900 font-medium">{p.ageRange}</div>
                        </div>
                      ) : null}
                    </div>
                    {/* Right details column */}
                    <div>
                      {p.occupation ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Occupation</div>
                          <div className="text-lg text-gray-900 font-medium">{p.occupation}</div>
                        </div>
                      ) : null}
                      {p.highestQualification ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Highest Qualification</div>
                          <div className="text-lg text-gray-900 font-medium">{p.highestQualification}</div>
                        </div>
                      ) : null}
                      {p.fieldOfStudy ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Field of Study</div>
                          <div className="text-lg text-gray-900 font-medium">{p.fieldOfStudy}</div>
                        </div>
                      ) : null}
                      {Array.isArray(p.businessInterests) && p.businessInterests.length ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Business Interests</div>
                          <div className="text-lg text-gray-900 font-medium break-words">{p.businessInterests.join(", ")}</div>
                        </div>
                      ) : null}
                      {Array.isArray(p.skills) && p.skills.length ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Skills</div>
                          <div className="text-lg text-gray-900 font-medium break-words">{p.skills.join(", ")}</div>
                        </div>
                      ) : null}
                      {p.socialMedia?.instagram?.handle ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">Instagram</div>
                          <div className="text-lg text-gray-900 font-medium">{p.socialMedia.instagram.handle}</div>
                        </div>
                      ) : null}
                      {p.socialMedia?.youtube?.channelUrl ? (
                        <div className="mb-3">
                          <div className="font-semibold text-orange-700 text-base uppercase mb-1 tracking-wide">YouTube</div>
                          <div className="text-lg text-gray-900 font-medium break-all">{p.socialMedia.youtube.channelUrl}</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <TaskManagement
          clientId={clientId}
          campaign={campaign}
          autoApproval={autoApproval}
          toggleAutoApproval={toggleAutoApproval}
          toggleLoading={toggleApprovalLoading}
          tasks={tasks}
          tasksLoading={tasksLoading}
          tasksError={tasksError}
          fetchTasks={fetchTasks}
          penaltyThresholdMinutes={penaltyThresholdMinutes}
          cancellationPenalty={cancellationPenalty}
          allowCancellation={allowCancellation}
          selectedTasks={selectedTasks}
          onTaskSelect={handleTaskSelect}
          onSelectAllTasks={handleSelectAllTasks}
          taskActionLoading={taskActionLoading}
          onAccept={(task) => handleTaskAction(task.reelId, task.userId, "accept")}
          onReject={(task) => handleTaskAction(task.reelId, task.userId, "reject")}
          onCancel={handleCancelTask}
          onBulkAccept={handleBulkAccept}
          onBulkReject={handleBulkReject}
          bulkLoading={bulkLoading}
          bulkAssignOpen={bulkAssignOpen}
          onOpenBulkAssign={() => {
            setBulkAssignError("");
            setBulkAssignSuccess("");
            setBulkAssignOpen(true);
          }}
          onCloseBulkAssign={() => setBulkAssignOpen(false)}
          selectedUsers={selectedUsers}
          selectedReelsByPool={selectedReelsByPool}
          expandedPoolId={expandedPoolId}
          onPoolReelSelectionChange={handlePoolReelSelectionChange}
          reelsPerUser={reelsPerUser}
          onReelsPerUserChange={setReelsPerUser}
          assignStrategy={assignStrategy}
          onAssignStrategyChange={setAssignStrategy}
          onBulkAssign={handleBulkAssign}
          bulkAssignLoading={bulkAssignLoading}
          bulkAssignError={bulkAssignError}
          bulkAssignSuccess={bulkAssignSuccess}
          sendLoading={sendLoading}
          sendError={sendError}
          sendSuccess={sendSuccess}
          onSendCampaign={handleSend}
          youtubeReels={youtubeReels}
          onYoutubeReelsChange={setYoutubeReels}
          instagramReels={instagramReels}
          onInstagramReelsChange={setInstagramReels}
          onGoToParticipants={() => setActiveTab("participants")}
          onViewUser={(task) => openUserDetails(task.userId)}
        />
      )}

      {activeTab === "graphs" && (
        <GraphsTab
          totalViews={totalViews}
          totalLikes={totalLikes}
          totalComments={totalComments}
          campaignResponses={campaignResponses}
          participants={participants}
          userDetails={userDetails}
        />
      )}

    </div>
  );
};

// Helper to extract YouTube video ID from URL (robust for shorts, watch, youtu.be)
function extractYoutubeId(url) {
  if (!url) return null;
  // Try youtu.be short links
  let match = url.match(/youtu\.be\/([\w-]{11})/);
  if (match) return match[1];
  // Try youtube.com/watch?v=ID
  match = url.match(/[?&]v=([\w-]{11})/);
  if (match) return match[1];
  // Try shorts
  match = url.match(/youtube\.com\/shorts\/([\w-]{11})/);
  if (match) return match[1];
  // Try embed
  match = url.match(/youtube\.com\/embed\/([\w-]{11})/);
  if (match) return match[1];
  return null;
}


const ImageRow = ({ brandImage, categoryImage, brandName, category }) => {
  const [lightbox, setLightbox] = React.useState(null);
  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-6">
        {brandImage?.url && (
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setLightbox({ url: brandImage.url, label: 'Brand Logo' })}>
            <img src={brandImage.url} alt="Brand Logo" className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-sm group-hover:scale-105 transition-transform" />
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Brand</p>
              <p className="text-sm font-bold text-gray-800">{brandName}</p>
            </div>
          </div>
        )}
        {brandImage?.url && categoryImage?.url && <div className="w-px h-12 bg-gray-200" />}
        {categoryImage?.url && (
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setLightbox({ url: categoryImage.url, label: 'Category Image' })}>
            <img src={categoryImage.url} alt="Category" className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-sm group-hover:scale-105 transition-transform" />
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Category</p>
              <p className="text-sm font-bold text-gray-800">{category || 'General'}</p>
            </div>
          </div>
        )}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75" onClick={() => setLightbox(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">{lightbox.label}</h3>
              <button onClick={() => setLightbox(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <img src={lightbox.url} alt={lightbox.label} className="w-full rounded-xl object-contain max-h-[70vh]" />
          </div>
        </div>
      )}
    </>
  );
};

const GraphsTab = ({ totalViews, totalLikes, totalComments, campaignResponses, participants, userDetails }) => {
  const engagementData = [
    { name: 'Views', value: totalViews, fill: '#10b981' },
    { name: 'Likes', value: totalLikes, fill: '#ef4444' },
    { name: 'Comments', value: totalComments, fill: '#3b82f6' },
  ];
  const participationData = [
    { name: 'Completed', value: campaignResponses.filter(r => r.isTaskCompleted).length, fill: '#10b981' },
    { name: 'Pending', value: participants.length - campaignResponses.filter(r => r.isTaskCompleted).length, fill: '#f97316' },
  ];
  const topUsers = [...campaignResponses]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 8)
    .map(r => ({
      name: (userDetails[r.userId]?.name || r.userId || '').slice(0, 12),
      views: r.views || 0,
      likes: r.likes || 0,
      comments: r.comments || 0,
    }));

  return (
    <div className="w-full max-w-6xl mt-2 space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {engagementData.map(d => (
          <div key={d.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-3xl font-extrabold" style={{ color: d.fill }}>{d.value.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Total {d.name}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart - Engagement */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5">Overall Engagement</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={engagementData} barSize={48}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => v.toLocaleString()} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {engagementData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5">Task Completion</h3>
          {participants.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No participants yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={participationData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {participationData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {participationData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: d.fill }} />
                    <span className="text-xs text-gray-600 font-medium">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5">Top Performers (Views)</h3>
          {topUsers.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No responses yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topUsers} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="views" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Multi-metric breakdown */}
      {topUsers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5">User Performance Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topUsers} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#10b981" radius={[4, 4, 0, 0]} name="Views" />
              <Bar dataKey="likes" fill="#ef4444" radius={[4, 4, 0, 0]} name="Likes" />
              <Bar dataKey="comments" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Comments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ManageCampaign;
