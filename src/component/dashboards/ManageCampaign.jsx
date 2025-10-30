import React, { useState, useEffect, useMemo } from "react";
import ContentPoolTab from "./ContentPoolTab";
import ContentPoolFolderView from "./ContentPoolFolderView";
import { API_BASE_URL } from "../../config";
import { FaLink } from "react-icons/fa";

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
  const [activeTab, setActiveTab] = useState("management");
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedUserProfileLoading, setSelectedUserProfileLoading] = useState(false);
  const [selectedUserProfileError, setSelectedUserProfileError] = useState("");

  const userData = JSON.parse(sessionStorage.getItem("userData") || "{}");
  const clientId = userData.clientId;

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
      const res = await fetch(
        `${API_BASE_URL}/api/pools/reels/approved/${campaign._id}`,
        {
          method: "POST",
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

  // Optionally, fetch stats once on mount
  useEffect(() => {
    fetchAllStats();
    // eslint-disable-next-line
  }, []);

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

  const openUserDetails = (userId) => {
    setSelectedUserForDetails(userId);
    setSelectedUserProfile(null);
    setSelectedUserProfileError("");
    setSelectedUserProfileLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/user/profiles/google/${userId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setSelectedUserProfile(data.userProfile);
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
      const res = await fetch(
        `${API_BASE_URL}/api/auth/user/campaign/${editForm._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
      const res = await fetch(
        `${API_BASE_URL}/api/auth/user/campaign/${campaign._id}`,
        {
          method: "DELETE",
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
        setSendError("Please select at least one user.");
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
      const res = await fetch(`${API_BASE_URL}/api/pools/shared`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log("Share reels response:", res.status, data); // Log response status and data
      if (res.ok && data.message) {
        setSendSuccess(data.message);
        await fetchResponses(); // Re-fetch user responses after assignment
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
    if (analyticsSearch.trim()) {
      const q = analyticsSearch.trim().toLowerCase();
      list = list.filter((r) => toName(r.userId).toLowerCase().includes(q));
    }
    if (analyticsSort === "asc" || analyticsSort === "desc") {
      list.sort((a, b) => {
        const na = toName(a.userId);
        const nb = toName(b.userId);
        const cmp = na.localeCompare(nb);
        return analyticsSort === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [campaignResponses, userDetails, analyticsSearch, analyticsSort]);

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
          {!editMode && (
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                onClick={() => setEditMode(true)}
                disabled={loading}
              >
                Edit Campaign
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Tabs - underline style like GalleryTab */}
      <div className="w-full max-w-6xl mb-6">
        <div role="tablist" className="flex w-full border-b border-gray-200">
          {[
            { label: "Campaign Management", value: "management" },
            { label: "Performance Analytics", value: "analytics" },
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
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Performance Analytics
        </h3>
        <p className="text-sm text-gray-600">
          Track user responses and engagement metrics
        </p>
      </div>
      <button
        onClick={fetchAllStats}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
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
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Refresh Stats
      </button>
    </div>

     {/* Campaign Performance Summary */}
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-green-800 font-medium">Total Views</span>
              <span className="text-2xl font-bold text-green-900">
                {totalViews.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <span className="text-red-800 font-medium">Total Likes</span>
              <span className="text-2xl font-bold text-red-900">
                {totalLikes.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                Total Comments
              </span>
              <span className="text-2xl font-bold text-blue-900">
                {totalComments.toLocaleString()}
              </span>
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
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
        {responsesError}
      </div>
    ) : (
      <>
        <div className="overflow-x-auto">
          {/* Search and Sort Controls */}
          <div className="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={analyticsSearch}
                onChange={(e) => {
                  setAnalyticsSearch(e.target.value);
                  setAnalyticsVisibleCount(10);
                }}
                placeholder="Search by user name"
                className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`px-3 py-2 rounded border text-sm ${
                  analyticsSort === 'asc'
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                onClick={() => setAnalyticsSort('asc')}
              >
                A–Z
              </button>
              <button
                type="button"
                className={`px-3 py-2 rounded border text-sm ${
                  analyticsSort === 'desc'
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                onClick={() => setAnalyticsSort('desc')}
              >
                Z–A
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-900 border-b border-gray-200">
                  Username
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-900 border-b border-gray-200">
                  Content
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-900 border-b border-gray-200">
                  Views
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-900 border-b border-gray-200">
                  Likes
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-900 border-b border-gray-200">
                  Comments
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaignResponses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-12 h-12 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>No responses yet</span>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleCampaignResponses.map((resp, idx) => {
                  const stats = videoStats[resp.urls] || {};
                  return (
                    <tr
                      key={resp._id || `row-${idx}`}
                      className="group hover:bg-yellow-50/80 cursor-pointer transition-colors"
                      onClick={e => {
                        // Prevent profile if click on link or button
                        if (e.target.closest('a') || e.target.closest('button')) return;
                        openUserDetails(resp.userId);
                      }}
                    >
                      <td className="px-6 py-4 text-gray-900 font-medium">{
                        userDetails[resp.userId]?.name || resp.userId
                      }</td>
                      <td className="px-6 py-4 text-center">
                        {resp.urls ? (
                          <a
                            href={resp.urls}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          >
                            <FaLink size={14} />
                            <span className="text-sm">View</span>
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-gray-900">
                          {stats.views?.toLocaleString() ||
                            resp.views?.toLocaleString() ||
                            "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-gray-900">
                          {stats.likes?.toLocaleString() ||
                            resp.likes?.toLocaleString() ||
                            "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-gray-900">
                          {stats.comments?.toLocaleString() ||
                            resp.comments?.toLocaleString() ||
                            "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
        {/* Load More Button */}
        {processedCampaignResponses.length > visibleCampaignResponses.length && (
          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded border text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              onClick={() => setAnalyticsVisibleCount((c) => c + 10)}
            >
              Load more
            </button>
          </div>
        )}

      </>
    )}
  </div>
</div>
      )}



      {/* Main Content Card (shown in Analytics tab) */}
      {activeTab === "analytics" && (
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row mb-10">
        {/* Left Section - Title then Image */}
        <div className="md:w-72 md:flex-shrink-0 bg-gray-50 p-4 flex flex-col items-start justify-start">
          <div className="w-full mb-3">
            <h1 className="text-xl font-semibold text-gray-900 leading-tight">
              {campaign?.campaignName || "Campaign"}
            </h1>
            <p className="text-gray-600">{campaign.brandName}</p>
          </div>
          {imageUrl ? (
            <div className="w-full">
              <img
                src={imageUrl}
                alt="Campaign"
                className="w-full h-40 object-cover rounded-lg shadow-sm"
              />
            </div>
          ) : (
            <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {/* Location and Dates under image */}
          <div className="w-full mt-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="font-medium text-gray-600 text-sm">Location:</span>
              <p className="text-gray-800 text-sm">{campaign.location || "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="font-medium text-gray-600 text-xs">Start Date</span>
                <p className="text-gray-800 text-sm">
                  {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "-"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="font-medium text-gray-600 text-xs">End Date</span>
                <p className="text-gray-800 text-sm">
                  {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Details with menu */}
        <div className="flex-1 p-4 min-w-0 relative">
          {/* Top bar with tags and menu */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(campaign.tags) ? campaign.tags : [campaign.tags])
                    .filter(Boolean)
                    .map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
              {/* Removed 3-dot menu for Terms & Conditions */}
            </div>
          </div>
<div className="m-2 font-semibold">
  Campaign Target
</div>
  {/*  this is the campaign goal and the campaign description */} 

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 m-4 ml-[-0px]"> 
     <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-100"> <h3 className="font-medium text-blue-800 mb-1">Campaign Goal</h3> <p className="text-blue-700 text-sm">{campaign.goal}</p> </div> 
     <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-100"> <h3 className="font-medium text-green-800 mb-1">Description</h3> <p className="text-green-700 text-sm">{campaign.description}</p> </div> 
  </div>
         
   {/* Stats Row - single row with five items */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
              <div className="text-lg font-semibold text-green-800">{campaign.views}</div>
              <div className="text-xs text-green-600">Target Views</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-100">
              <div className="text-lg font-semibold text-purple-800">{campaign.limit}</div>
              <div className="text-xs text-purple-600">Target Participants</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-100">
              <div className="text-lg font-semibold text-yellow-800">{campaign.credits}</div>
              <div className="text-xs text-yellow-600">Total Videos Upload</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center border border-red-100">
              <div className="text-lg font-semibold text-red-800">100</div>
              <div className="text-xs text-red-600">Campaign Budget</div>
            </div>
          </div>
          <div>
            <div className="m-4 font-semibold ml-[0px]">Campaign Rules</div>
            
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                 <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                 <div className="text-lg font-semibold text-blue-800">{campaign.cutoff}</div>
                 <div className="text-xs text-blue-600">Minium View Required (MVR)</div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-100">
                <div className="text-lg font-semibold text-yellow-800">{campaign.credits}</div>
                <div className="text-xs text-yellow-600">Credits Points</div>
              </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-100 relative group">
              <div className="text-xs font-semibold text-yellow-800">Terms & Conditions</div>
              <div className="text-xs text-yellow-600">Hover to view</div>
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg text-left opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-10">
                <div className="text-sm text-gray-700 break-words max-h-60 overflow-auto">
                  {campaign.tNc || "-"}
              </div>
            </div>
          </div>
            </div>
          </div>

        
          

          
        </div>
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

      {/* Active Participants Section (shown in Analytics tab) */}
      {activeTab === "analytics" && (
      <div className="w-full max-w-6xl mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800">
            Active Participants
            <span className="ml-2 text-base font-semibold text-green-600">
              ({participants.length})
            </span>
          </h2>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          {participantsLoading ? (
            <div className="text-gray-500">Loading participants...</div>
          ) : participantsError ? (
            <div className="text-red-500">{participantsError}</div>
          ) : participants.length === 0 ? (
            <div className="text-gray-400">No active participants.</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Search and Sort Controls */}
              <div className="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={participantsSearch}
                    onChange={(e) => {
                      setParticipantsSearch(e.target.value);
                      setParticipantsVisibleCount(10);
                    }}
                    placeholder="Search by user name"
                    className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`px-3 py-2 rounded border text-sm ${
                      participantsSort === 'asc'
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    onClick={() => setParticipantsSort('asc')}
                  >
                    A–Z
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 rounded border text-sm ${
                      participantsSort === 'desc'
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    onClick={() => setParticipantsSort('desc')}
                  >
                    Z–A
                  </button>
                </div>
              </div>

              {(() => {
                const toName = (userId) => (userDetails[userId]?.name || userId || "").toString();
                let list = [...participants];
                if (participantsSearch.trim()) {
                  const q = participantsSearch.trim().toLowerCase();
                  list = list.filter((id) => toName(id).toLowerCase().includes(q));
                }
                if (participantsSort === 'asc' || participantsSort === 'desc') {
                  list.sort((a, b) => {
                    const na = toName(a);
                    const nb = toName(b);
                    const cmp = na.localeCompare(nb);
                    return participantsSort === 'asc' ? cmp : -cmp;
                  });
                }
                const visible = list.slice(0, participantsVisibleCount);
                return (
                  <>
                  <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Task status
                    </th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {visible.map((userId) => (
                    <tr
                      key={userId}
                      className="group cursor-pointer hover:bg-yellow-50/80 transition-colors"
                      onClick={e => {
                        // Don't open profile if the click was on the button
                        if (
                          e.target.closest('button') ||
                          e.target.closest('input')
                        ) return;
                        openUserDetails(userId);
                      }}
                    >
                      <td className="px-4 py-2 text-gray-900 font-medium">{
                        userDetailsLoading[userId]
                          ? <span className="text-gray-400">Loading...</span>
                          : userDetailsError[userId]
                            ? <span className="text-red-500">{userDetailsError[userId]}</span>
                            : (userDetails[userId]?.name || userId)
                      }</td>
                      <td className="px-4 py-2 text-gray-700">
                        {userDetails[userId]?.email || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-2">
                        {hasUserResponded(userId) ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            completed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${
                            selectedUsers.includes(userId)
                              ? "bg-green-500 text-white border-green-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                          }`}
                          onClick={e => {
                            e.stopPropagation();
                            handleSelectUser(userId);
                          }}
                          type="button"
                        >
                          {selectedUsers.includes(userId) ? "Selected" : "Select"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {list.length > visible.length && (
                <div className="mt-4 flex items-center justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 rounded border text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    onClick={() => setParticipantsVisibleCount((c) => c + 10)}
                  >
                    Load more
                  </button>
                </div>
              )}
              </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
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
                <span className="text-lg font-semibold">✕</span>
              </button>
            </div>
            <div className="px-8 py-6 pb-8">
              {selectedUserProfileLoading ? (
                <div className="py-24 text-center text-xl text-gray-500 tracking-wide">Loading profile…</div>
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

      {/* Content Pools & Reels Section (shown in Management tab) */}
      {activeTab === "management" && (
      <div className="w-full max-w-6xl mt-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Content Pools & Reels
          </h2>
          <p className="text-gray-600">
            Manage your content distribution and track performance
          </p>
        </div>

        {/* Content Pool Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <ContentPoolFolderView
            onPoolReelSelectionChange={handlePoolReelSelectionChange}
          />
        </div>

        {/* Platform Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Platform Configuration
            </h3>
            <span className="text-sm text-gray-500">
              Set reels per platform
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Instagram */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">IG</span>
                </div>
                <div>
                  <label className="font-medium text-gray-900">Instagram</label>
                  <p className="text-sm text-gray-600">Stories & Reels</p>
                </div>
              </div>
              <input
                type="number"
                min={1}
                value={instagramReels || ""}
                onChange={(e) => setInstagramReels(Number(e.target.value))}
                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* YouTube */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-blue-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">YT</span>
                </div>
                <div>
                  <label className="font-medium text-gray-900">YouTube</label>
                  <p className="text-sm text-gray-600">Shorts & Videos</p>
                </div>
              </div>
              <input
                type="number"
                min={1}
                value={youtubeReels || ""}
                onChange={(e) => setYoutubeReels(Number(e.target.value))}
                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Campaign Settings & Action */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="font-medium text-gray-700">
                  Reels Per User:
                </label>
                <input
                  type="number"
                  value={reelsPerUser}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setReelsPerUser("");
                    } else {
                      setReelsPerUser(parseInt(value));
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                  disabled={sendLoading}
                />
              </div>
            </div>

            <button
              className="px-6 py-2.5 rounded-lg text-white shadow-sm transition-all bg-gradient-to-r from-yellow-500 to-orange-600 hover:brightness-110 flex items-center gap-2"
              onClick={handleSend}
              disabled={sendLoading}
            >
              {sendLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <span>Send Campaign</span>
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
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {(sendError || sendSuccess) && (
          <div className="mt-6">
            {sendError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {sendError}
              </div>
            )}
            {sendSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {sendSuccess}
              </div>
            )}
          </div>
        )}
      </div>
      )}
      {/* Graphs Tab Content (UI only) */}
      {activeTab === "graphs" && (
        <div className="w-full max-w-6xl mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Graphs</h3>
            <p className="text-sm text-gray-600">Visualizations can be added here.</p>
          </div>
        </div>
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

export default ManageCampaign;
