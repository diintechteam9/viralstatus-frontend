import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";

function UserCampaignTab() {
  const [showModal, setShowModal] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const userData = JSON.parse(
    localStorage.getItem("userData") ||
      sessionStorage.getItem("userData") ||
      "{}"
  );
  const clientId = userData.clientId;
  const userId = localStorage.getItem("googleId");

  const getUserToken = () =>
    sessionStorage.getItem("usertoken") || localStorage.getItem("usertoken");

  const fetchCampaigns = async () => {
    try {
      const token = getUserToken();
      const qs = clientId
        ? `?clientId=${encodeURIComponent(clientId)}`
        : "";
      const url = `${API_BASE_URL}/api/auth/user/campaign/active${qs}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.campaigns)) {
        // Sort campaigns by createdAt descending (most recent first)
        const sortedCampaigns = data.campaigns.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setCampaigns(sortedCampaigns);
      } else {
        setCampaigns([]);
      }
    } catch {
      setCampaigns([]);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line
  }, [clientId]);

  // Full page details view
  if (selectedCampaign) {
    // --- Details view ---
    const hasJoined =
      selectedCampaign.userIds && selectedCampaign.userIds.includes(userId);
    const handleJoinCampaign = async () => {
      console.log("Join button clicked");
      console.log("userId:", userId, "hasJoined:", hasJoined);
      if (!userId || hasJoined) {
        console.log("Join blocked: missing UserId or already joined");
        return;
      }
      try {
        const token = getUserToken();
        const authHeaders = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const res = await fetch(
          `${API_BASE_URL}/api/auth/user/campaign/activeparticipants/${selectedCampaign._id}`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ userId }),
          }
        );
        const data = await res.json();
        console.log("activeparticipants response:", res.status, data);
        if (res.ok && data.success) {
          // 2. Register the campaign for the user
          if (userId) {
            const regRes = await fetch(
              `${API_BASE_URL}/api/auth/user/campaign/register/${selectedCampaign._id}`,
              {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({ userId }),
              }
            );
            const regData = await regRes.json();
            console.log("register response:", regRes.status, regData);
            if (!regRes.ok || !regData.success) {
              alert(regData.message || "Failed to register campaign for user");
            }
          }
          fetchCampaigns();
          window.location.reload();
        } else {
          console.error("Join campaign failed:", data);
          alert(data.message || "Failed to join campaign");
        }
      } catch (err) {
        console.error("Join campaign error:", err);
        alert("Error joining campaign");
      }
    };
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors duration-200"
                onClick={() => setSelectedCampaign(null)}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>Back to Campaigns</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Campaign Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Campaign Image */}
                {selectedCampaign.image &&
                  (selectedCampaign.image.url ||
                    typeof selectedCampaign.image === "string") && (
                    <div className="relative h-80 overflow-hidden">
                      <img
                        src={
                          selectedCampaign.image.url ||
                          selectedCampaign.image ||
                          "https://via.placeholder.com/400x224?text=No+Image"
                        }
                        alt={selectedCampaign.campaignName}
                        className="w-full h-full object-fit"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6">
                        <h1 className="text-4xl font-bold text-white mb-2">
                          {selectedCampaign.campaignName}
                        </h1>
                        <p className="text-white/90 text-lg">
                          {selectedCampaign.brandName}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Campaign Info */}
                <div className="p-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-3">
                      About This Campaign
                    </h2>
                    <p className="text-slate-600 text-lg leading-relaxed">
                      {selectedCampaign.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-slate-800 mb-3">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedCampaign.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-slate-800 mb-3">
                      Terms & Conditions
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedCampaign.tNc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Campaign Stats & Actions */}
            <div className="space-y-6">
              {/* Campaign Stats */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">
                  Campaign Details
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-600">Credits</span>
                    <span className="font-semibold text-green-600 text-lg">
                      {selectedCampaign.credits}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-600">Location</span>
                    <span className="font-medium text-slate-800">
                      {selectedCampaign.location}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-600">
                      Total Spots Available
                    </span>
                    <span className="font-medium text-slate-800">
                      {selectedCampaign.limit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-600">Target Views</span>
                    <span className="font-medium text-slate-800">
                      {selectedCampaign.views?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-600">Start Date</span>
                    <span className="font-medium text-slate-800">
                      {selectedCampaign.startDate
                        ? new Date(
                            selectedCampaign.startDate
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-slate-600">End Date</span>
                    <span className="font-medium text-slate-800">
                      {selectedCampaign.endDate
                        ? new Date(selectedCampaign.endDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <button
                  className={`w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${
                    hasJoined ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  onClick={handleJoinCampaign}
                  disabled={hasJoined}
                >
                  {hasJoined ? "Joined" : "Join Campaign"}
                </button>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  By joining, you agree to the terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Campaign grid view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Active Campaigns
              </h1>
              <p className="text-slate-600 mt-2">
                Discover and join exciting brand campaigns
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600">
                {campaigns.length} campaigns available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">
              No campaigns found
            </h3>
            <p className="text-slate-600">
              Check back later for new campaign opportunities
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => (
              <div
                key={campaign._id || campaign.campaignName}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                onClick={() => setSelectedCampaign(campaign)}
              >
                {/* Campaign Image */}
                {campaign.image &&
                  (campaign.image.url ||
                    typeof campaign.image === "string") && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={
                          campaign.image.url ||
                          campaign.image ||
                          "https://via.placeholder.com/400x224?text=No+Image"
                        }
                        alt="Campaign"
                        className="w-full h-full object-fit group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4">
                        <div className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                          {campaign.credits} Credits
                        </div>
                      </div>
                    </div>
                  )}

                {/* Campaign Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-green-600 transition-colors">
                      {campaign.campaignName}
                    </h3>
                    <p className="text-green-600 font-medium text-sm mb-2">
                      {campaign.brandName}
                    </p>
                    <p className="text-slate-600 text-sm line-clamp-2">
                      {campaign.description.split(" ").slice(0, 15).join(" ")}
                      {campaign.description.split(" ").length > 15 ? "..." : ""}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {(campaign.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Campaign Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Location</span>
                      <span className="font-medium text-slate-800">
                        {campaign.location}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Target Views</span>
                      <span className="font-medium text-slate-800">
                        {campaign.views?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Spots Left</span>
                      <span className="font-medium text-slate-800">
                        {campaign.limit}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCampaign(campaign);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCampaignTab;
