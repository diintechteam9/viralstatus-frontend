import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../config";

const CampaignImageRow = ({ brandImage, categoryImage, brandName, category }) => (
  <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50">
    {brandImage?.url && (
      <div className="flex items-center gap-2">
        <img src={brandImage.url} alt="Brand" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Brand</p>
          <p className="text-xs font-semibold text-slate-800">{brandName}</p>
        </div>
      </div>
    )}
    {brandImage?.url && categoryImage?.url && <div className="w-px h-8 bg-slate-200" />}
    {categoryImage?.url && (
      <div className="flex items-center gap-2">
        <img src={categoryImage.url} alt="Category" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Category</p>
          <p className="text-xs font-semibold text-slate-800">{category || "General"}</p>
        </div>
      </div>
    )}
  </div>
);

// ── Campaign status helper ────────────────────────────────────────────────────
function getCampaignStatus(campaign) {
  const now = new Date();
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  if (end < now) return { label: "Expired", color: "bg-gray-100 text-gray-600" };
  if (start > now) return { label: "Scheduled", color: "bg-blue-100 text-blue-700" };
  if (campaign.isActive) return { label: "Active", color: "bg-green-100 text-green-700" };
  return { label: "Inactive", color: "bg-red-100 text-red-700" };
}

function UserCampaignTab({ onGoToTask }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinedIds, setJoinedIds] = useState(new Set()); // track freshly joined

  const userData = JSON.parse(
    localStorage.getItem("mobileUserData") ||
    localStorage.getItem("userData") ||
    sessionStorage.getItem("userData") || "{}"
  );
  const googleId = userData.googleId || localStorage.getItem("googleId") || "";

  const getUserToken = () =>
    localStorage.getItem("mobileUserToken") ||
    localStorage.getItem("clienttoken") ||
    sessionStorage.getItem("clienttoken") ||
    sessionStorage.getItem("usertoken") ||
    localStorage.getItem("usertoken");

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const token = getUserToken();
      const res = await fetch(`${API_BASE_URL}/api/auth/user/campaign/active`, {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.campaigns)) {
        const now = new Date();
        setCampaigns(
          data.campaigns
            .filter(c => new Date(c.endDate) >= now) // hide expired
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
      } else {
        setCampaigns([]);
      }
    } catch { setCampaigns([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // ── Campaign Detail View ──────────────────────────────────────────────────
  if (selectedCampaign) {
    const isJoined =
      joinedIds.has(selectedCampaign._id) ||
      (Array.isArray(selectedCampaign.userIds) && selectedCampaign.userIds.includes(googleId));
    const spotsLeft = Math.max(0, Number(selectedCampaign.limit || 0) - (Array.isArray(selectedCampaign.userIds) ? selectedCampaign.userIds.length : 0));
    const status = getCampaignStatus(selectedCampaign);

    const handleJoin = async () => {
      if (!googleId) { alert("Please sign in with Google to join campaigns."); return; }
      if (isJoined || joining) return;
      setJoining(true);
      try {
        const token = getUserToken();
        const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE_URL}/api/auth/user/campaign/activeparticipants/${selectedCampaign._id}`, {
            method: "POST", headers, body: JSON.stringify({ userId: googleId }),
          }),
          fetch(`${API_BASE_URL}/api/auth/user/campaign/register/${selectedCampaign._id}`, {
            method: "POST", headers, body: JSON.stringify({ userId: googleId }),
          }),
        ]);
        const d1 = await r1.json();
        if (r1.ok && d1.success) {
          setJoinedIds(prev => new Set([...prev, selectedCampaign._id]));
          // Refresh campaigns in background
          fetchCampaigns();
          // Show success then redirect to Task tab
          setTimeout(() => {
            setSelectedCampaign(null);
            if (typeof onGoToTask === "function") onGoToTask();
          }, 1200);
        } else {
          alert(d1.message || "Failed to join campaign");
        }
      } catch { alert("Error joining campaign"); }
      finally { setJoining(false); }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setSelectedCampaign(null)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
              ← Back to Campaigns
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>{status.label}</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
              {selectedCampaign.image?.url && (
                <div className="relative h-56 overflow-hidden">
                  <img src={selectedCampaign.image.url} alt={selectedCampaign.campaignName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5">
                    <h1 className="text-2xl font-bold text-white">{selectedCampaign.campaignName}</h1>
                    <p className="text-white/80 text-sm mt-0.5">{selectedCampaign.brandName}</p>
                  </div>
                </div>
              )}
              {(selectedCampaign.brandImage?.url || selectedCampaign.categoryImage?.url) && (
                <CampaignImageRow brandImage={selectedCampaign.brandImage} categoryImage={selectedCampaign.categoryImage}
                  brandName={selectedCampaign.brandName} category={selectedCampaign.category} />
              )}
              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800 mb-2">About This Campaign</h2>
                  <p className="text-slate-600 text-sm leading-relaxed">{selectedCampaign.description || "No description provided."}</p>
                </div>
                {selectedCampaign.goal && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Campaign Goal</p>
                    <p className="text-sm text-slate-700">{selectedCampaign.goal}</p>
                  </div>
                )}
                {(selectedCampaign.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCampaign.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">#{tag}</span>
                    ))}
                  </div>
                )}
                {selectedCampaign.tNc && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Terms & Conditions</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{selectedCampaign.tNc}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            {/* Stats card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-sm font-bold text-slate-800 mb-4">Campaign Details</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Credits per Task", value: <span className="font-bold text-green-600 text-base">{selectedCampaign.credits} pts</span> },
                  { label: "Location", value: selectedCampaign.location },
                  { label: "Spots Left", value: <span className={spotsLeft === 0 ? "text-red-600 font-bold" : "font-semibold"}>{spotsLeft} / {selectedCampaign.limit}</span> },
                  { label: "Target Views", value: Number(selectedCampaign.views || 0).toLocaleString() },
                  { label: "Min. Views (MVR)", value: selectedCampaign.cutoff || "-" },
                  { label: "Start Date", value: selectedCampaign.startDate ? new Date(selectedCampaign.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-" },
                  { label: "End Date", value: selectedCampaign.endDate ? new Date(selectedCampaign.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-800 font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Join button */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              {isJoined ? (
                <div className="text-center">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="font-bold text-green-700 text-sm">You've joined!</p>
                  <p className="text-xs text-slate-500 mt-1">Check your Task tab for assigned reels.</p>
                  {typeof onGoToTask === "function" && (
                    <button onClick={onGoToTask} className="mt-3 w-full py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
                      Go to My Tasks →
                    </button>
                  )}
                </div>
              ) : spotsLeft === 0 ? (
                <div className="text-center">
                  <p className="font-bold text-red-600 text-sm">Campaign Full</p>
                  <p className="text-xs text-slate-500 mt-1">No spots available.</p>
                </div>
              ) : (
                <>
                  <button onClick={handleJoin} disabled={joining}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60">
                    {joining ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Joining...
                      </span>
                    ) : "🚀 Join Campaign"}
                  </button>
                  <p className="text-[10px] text-slate-400 mt-2 text-center">By joining, you agree to the terms and conditions</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Campaign Grid ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Active Campaigns</h1>
            <p className="text-slate-500 text-sm mt-0.5">Discover and join exciting brand campaigns</p>
          </div>
          <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
            {campaigns.length} available
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-3">📢</div>
            <p className="font-semibold text-slate-600">No campaigns available</p>
            <p className="text-sm mt-1">Check back later for new opportunities</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((campaign) => {
              const isJoined = joinedIds.has(campaign._id) ||
                (Array.isArray(campaign.userIds) && campaign.userIds.includes(googleId));
              const status = getCampaignStatus(campaign);
              const spotsLeft = Math.max(0, Number(campaign.limit || 0) - (Array.isArray(campaign.userIds) ? campaign.userIds.length : 0));
              return (
                <div key={campaign._id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => setSelectedCampaign(campaign)}>
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-orange-100 to-yellow-100">
                    {campaign.image?.url
                      ? <img src={campaign.image.url} alt={campaign.campaignName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl">📢</div>
                    }
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow">{campaign.credits} pts</span>
                    </div>
                    {isJoined && (
                      <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-0.5 bg-white/90 text-green-700 text-[10px] font-bold rounded-full">✓ Joined</span>
                      </div>
                    )}
                  </div>

                  {/* Brand row */}
                  {(campaign.brandImage?.url || campaign.categoryImage?.url) && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                      {campaign.brandImage?.url && <img src={campaign.brandImage.url} alt="Brand" className="w-7 h-7 rounded-md object-cover border border-slate-200" />}
                      <span className="text-xs text-slate-600 font-medium truncate">{campaign.brandName}</span>
                      {campaign.category && <span className="ml-auto text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{campaign.category}</span>}
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-orange-600 transition-colors line-clamp-1">{campaign.campaignName}</h3>
                    <p className="text-slate-500 text-xs line-clamp-2 mb-3 leading-relaxed">
                      {(campaign.description || "").trim() || "No description."}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span>📍 {campaign.location}</span>
                      <span className={spotsLeft === 0 ? "text-red-500 font-semibold" : ""}>{spotsLeft} spots left</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(campaign.tags || []).slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded text-[10px] font-medium">#{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedCampaign(campaign); }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${isJoined ? "bg-green-50 text-green-700 border border-green-200" : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:brightness-110"}`}>
                      {isJoined ? "✓ Joined — View Details" : "View Details"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCampaignTab;
