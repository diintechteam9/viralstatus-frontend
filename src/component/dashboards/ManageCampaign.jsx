import React, { useState, useEffect } from "react";
import ContentPoolTab from "./ContentPoolTab";
import ContentPoolFolderView from "./ContentPoolFolderView";
import { API_BASE_URL } from "../../config";
import { getYoutubeStats } from "../utils/getYoutubeStats";

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
  useEffect(() => {
    const fetchResponses = async () => {
      setResponsesLoading(true);
      setResponsesError("");
      try {
        const allResponses = [];
        for (const userId of participants) {
          const res = await fetch(
            `${API_BASE_URL}/api/pools/user/${userId}/response/get`
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
    if (participants.length > 0) {
      fetchResponses();
    } else {
      setUserResponses([]);
    }
    // eslint-disable-next-line
  }, [participants]);

  const fetchAllStats = async () => {
    setResponsesLoading(true); // Optional: show loading
    const statsMap = {};
    for (const resp of userResponses.filter(
      (r) => r.campaignId === campaign._id
    )) {
      const videoId = extractYoutubeId(resp.urls);
      if (videoId) {
        statsMap[resp.urls] = await getYoutubeStats(videoId);
      }
    }
    setVideoStats(statsMap);
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

  // Removed handleRefreshStats as stats API is no longer used

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

      {/* Main Content Card */}
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col md:flex-row mb-10">
        {/* Left Side - Campaign Image */}
        <div className="md:w-1/3 bg-gray-50 p-8 flex items-center justify-center border-r border-gray-100">
          {imageUrl ? (
            <div className="w-full max-w-xs">
              <img
                src={imageUrl}
                alt="Campaign"
                className="w-full h-64 object-cover rounded-xl shadow-md border border-gray-200"
              />
            </div>
          ) : (
            <div className="w-full max-w-xs h-64 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-200">
              <svg
                className="w-16 h-16 text-gray-400"
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
        </div>

        {/* Right Side - Campaign Details */}
        <div className="flex-1 p-8 flex flex-col gap-8">
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {campaign?.campaignName || "Campaign"}
            </h1>
            <p className="text-lg text-gray-600 mb-2">{campaign.brandName}</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {(Array.isArray(campaign.tags) ? campaign.tags : [campaign.tags])
                .filter(Boolean)
                .map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Campaign Goal
                </h3>
                <p className="text-blue-700">{campaign.goal}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-100">
                <h3 className="font-semibold text-green-800 mb-2">
                  Description
                </h3>
                <p className="text-green-700">{campaign.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-100">
                  <div className="text-2xl font-bold text-yellow-800">
                    {campaign.credits}
                  </div>
                  <div className="text-sm text-yellow-600">Credits</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100">
                  <div className="text-2xl font-bold text-purple-800">
                    {campaign.limit}
                  </div>
                  <div className="text-sm text-purple-600">Limit</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Location:</span>
                    <p className="text-gray-800">{campaign.location}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Target Views:
                    </span>
                    <p className="text-gray-800">{campaign.views}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      Start Date:
                    </span>
                    <p className="text-gray-800">
                      {campaign.startDate
                        ? new Date(campaign.startDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">End Date:</span>
                    <p className="text-gray-800">
                      {campaign.endDate
                        ? new Date(campaign.endDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {campaign.tNc && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2">
                Terms & Conditions
              </h3>
              <p className="text-gray-700 text-sm">{campaign.tNc}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Campaign Modal */}
      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative">
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

      {/* Feedback Alerts */}
      <div className="w-full max-w-6xl mt-4">
        {sendError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center font-medium">
            {sendError}
          </div>
        )}
        {sendSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center font-medium">
            {sendSuccess}
          </div>
        )}
      </div>

      {/* Active Participants Section */}
      <button
        onClick={() => alert("Refresh Stats feature is currently disabled.")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh Stats
      </button>
      <div className="w-full max-w-6xl mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800">
            Active Participants
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
            <ul className="list-none pl-0">
              {participants.map((userId) => (
                <li key={userId} className="flex items-center gap-4 mb-2">
                  {userDetailsLoading[userId] ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : userDetailsError[userId] ? (
                    <span className="text-red-500">
                      {userDetailsError[userId]}
                    </span>
                  ) : (
                    <span className="text-gray-700 font-medium">
                      {userDetails[userId]?.name || userId}
                    </span>
                  )}
                  <button
                    className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${
                      selectedUsers.includes(userId)
                        ? "bg-green-500 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSelectUser(userId)}
                    type="button"
                  >
                    {selectedUsers.includes(userId) ? "Selected" : "Select"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Content Pools & Reels Section */}
      <div className="w-full max-w-6xl mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Content Pools & Reels
        </h2>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6 mb-6">
          <ContentPoolFolderView
            onPoolReelSelectionChange={handlePoolReelSelectionChange}
          />
        </div>
        {/* New: Platform-specific reels form */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Socials and No. of Reels
          </h3>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-4">
              <label className="w-32 font-medium text-gray-700 mb-0">
                Instagram
              </label>
              <input
                type="number"
                min={0}
                value={instagramReels}
                onChange={(e) => setInstagramReels(Number(e.target.value))}
                className="w-32 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-32 font-medium text-gray-700 mb-0">
                YouTube
              </label>
              <input
                type="number"
                min={0}
                value={youtubeReels}
                onChange={(e) => setYoutubeReels(Number(e.target.value))}
                className="w-32 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        {/* Reels Per User and Send Button */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white rounded-xl shadow border border-gray-100 p-6">
          <label className="font-medium text-gray-700">Reels Per User:</label>
          <input
            type="number"
            min={1}
            value={reelsPerUser}
            onChange={(e) => setReelsPerUser(Number(e.target.value))}
            className="w-24 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={sendLoading}
          />
          <button
            className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 ml-0 md:ml-4"
            onClick={handleSend}
            disabled={sendLoading}
          >
            {sendLoading ? "Sending..." : "Send"}
          </button>
        </div>
        {/* show reponsed urls */}

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              User Responses
            </h3>
            <button
              onClick={fetchAllStats}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Stats
            </button>
          </div>
          {responsesLoading ? (
            <div className="text-gray-500">Loading responses...</div>
          ) : responsesError ? (
            <div className="text-red-500">{responsesError}</div>
          ) : (
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b text-left">Username</th>
                  <th className="px-4 py-2 border-b text-left">URL</th>
                  <th className="px-4 py-2 border-b text-left">Views</th>
                  <th className="px-4 py-2 border-b text-left">Likes</th>
                  <th className="px-4 py-2 border-b text-left">Comments</th>
                </tr>
              </thead>
              <tbody>
                {userResponses.filter((r) => r.campaignId === campaign._id)
                  .length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-2 text-gray-400">
                      No responses yet.
                    </td>
                  </tr>
                ) : (
                  userResponses
                    .filter((r) => r.campaignId === campaign._id)
                    .map((resp, idx) => {
                      const stats = videoStats[resp.urls] || {};
                      return (
                        <tr key={resp._id || idx}>
                          <td className="px-4 py-2 border-b">
                            {userDetails[resp.userId]?.name || resp.userId}
                          </td>
                          <td className="px-4 py-2 border-b">
                            <a
                              href={resp.urls}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline break-all"
                            >
                              {resp.urls}
                            </a>
                          </td>
                          <td className="px-4 py-2 border-b">
                            {stats.views || "-"}
                          </td>
                          <td className="px-4 py-2 border-b">
                            {stats.likes || "-"}
                          </td>
                          <td className="px-4 py-2 border-b">
                            {stats.comments || "-"}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
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
