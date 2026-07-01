import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../config";
import { CAMPAIGN_TASK_TYPES } from "../../constants/campaignTaskTypes";
import {
  FiArrowLeft, FiMapPin, FiTag,
  FiCheckCircle, FiLoader, FiChevronRight, FiImage, FiLock, FiGlobe, FiUsers,
} from "react-icons/fi";

// ── Status helper ─────────────────────────────────────────────────────────────
function getCampaignStatus(campaign) {
  const now   = new Date();
  const start = new Date(campaign.startDate);
  const end   = new Date(campaign.endDate);
  if (end < now)         return { label: "Expired",   cls: "border-gray-300 text-gray-500" };
  if (start > now)       return { label: "Scheduled", cls: "border-gray-400 text-gray-600" };
  if (campaign.isActive) return { label: "Active",    cls: "border-black text-black bg-black text-white" };
  return                        { label: "Inactive",  cls: "border-gray-300 text-gray-400" };
}

// ── Brand / Category image strip ──────────────────────────────────────────────
function ImageStrip({ brandImage, categoryImage, brandName, category }) {
  if (!brandImage?.url && !categoryImage?.url) return null;
  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
      {brandImage?.url && (
        <div className="flex items-center gap-2">
          <img src={brandImage.url} alt="Brand" className="w-9 h-9 rounded-lg object-cover border border-gray-200" />
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Brand</p>
            <p className="text-xs font-semibold text-gray-800">{brandName}</p>
          </div>
        </div>
      )}
      {brandImage?.url && categoryImage?.url && <div className="w-px h-7 bg-gray-200" />}
      {categoryImage?.url && (
        <div className="flex items-center gap-2">
          <img src={categoryImage.url} alt="Category" className="w-9 h-9 rounded-lg object-cover border border-gray-200" />
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Category</p>
            <p className="text-xs font-semibold text-gray-800">{category || "General"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

// ── Campaign Detail Page ───────────────────────────────────────────────────────
function CampaignDetail({ campaign, googleId, joinedIds, joining, onBack, onJoin, onGoToTask }) {
  const isPublic  = campaign.campaignType === "public";
  const isJoined  = joinedIds.has(campaign._id) || (Array.isArray(campaign.userIds) && campaign.userIds.includes(googleId));
  const spotsLeft = Math.max(0, Number(campaign.limit || 0) - (Array.isArray(campaign.userIds) ? campaign.userIds.length : 0));
  const status    = getCampaignStatus(campaign);
  const fmt       = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-black transition-colors">
          <FiArrowLeft size={15} /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${isPublic ? "border-blue-400 text-blue-600 bg-blue-50" : "border-purple-400 text-purple-600 bg-purple-50"}`}>
            {isPublic ? "🌐 Public" : "🔒 Private"}
          </span>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${status.cls}`}>{status.label}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            {campaign.image?.url ? (
              <div className="relative h-52 overflow-hidden">
                <img src={campaign.image.url} alt={campaign.campaignName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <h1 className="text-xl font-bold text-white leading-tight">{campaign.campaignName}</h1>
                  <p className="text-white/70 text-sm mt-0.5">{campaign.brandName}</p>
                </div>
              </div>
            ) : (
              <div className="h-28 bg-gray-100 flex items-center justify-center border-b border-gray-200">
                <FiImage size={32} className="text-gray-300" />
              </div>
            )}
            <ImageStrip brandImage={campaign.brandImage} categoryImage={campaign.categoryImage} brandName={campaign.brandName} category={campaign.category} />
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">About</p>
                <p className="text-sm text-gray-700 leading-relaxed">{campaign.description || "No description provided."}</p>
              </div>
              {campaign.goal && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Campaign Goal</p>
                  <p className="text-sm text-gray-800">{campaign.goal}</p>
                </div>
              )}
              {(campaign.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {campaign.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 border border-gray-200 rounded-md text-[11px] text-gray-600 font-medium">
                      <FiTag size={9} /> {tag}
                    </span>
                  ))}
                </div>
              )}
              {campaign.tNc && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Terms & Conditions</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{campaign.tNc}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Campaign Details</p>
            <DetailRow label="Credits per Task" value={`${campaign.credits} pts`} />
            <DetailRow label="Location"         value={campaign.location || "—"} />
            {!isPublic && <DetailRow label="Spots Left" value={`${spotsLeft} / ${campaign.limit}`} />}
            <DetailRow label="Target Views"     value={Number(campaign.views || 0).toLocaleString()} />
            <DetailRow label="Min. Views (MVR)" value={campaign.cutoff || "—"} />
            <DetailRow label="Start Date"       value={fmt(campaign.startDate)} />
            <DetailRow label="End Date"         value={fmt(campaign.endDate)} />
          </div>

          {/* Action card */}
          <div className="border border-gray-200 rounded-2xl p-5">
            {isPublic ? (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                  <FiGlobe size={22} className="text-blue-600" />
                </div>
                <p className="font-bold text-gray-900 text-sm">Public Campaign</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  No join required. The client will assign tasks to you directly.<br />
                  Check your <strong>Task Tab → Public</strong> section.
                </p>
                {typeof onGoToTask === "function" && (
                  <button onClick={onGoToTask} className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                    Go to My Tasks <FiChevronRight size={14} />
                  </button>
                )}
              </div>
            ) : isJoined ? (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-black flex items-center justify-center">
                  <FiCheckCircle size={22} className="text-white" />
                </div>
                <p className="font-bold text-gray-900 text-sm">You have joined!</p>
                <p className="text-xs text-gray-500">Client will assign tasks soon. Check your Task Tab → Private section.</p>
                {typeof onGoToTask === "function" && (
                  <button onClick={onGoToTask} className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                    Go to My Tasks <FiChevronRight size={14} />
                  </button>
                )}
              </div>
            ) : spotsLeft === 0 ? (
              <div className="text-center">
                <p className="font-bold text-gray-900 text-sm">Campaign Full</p>
                <p className="text-xs text-gray-500 mt-1">No spots available right now.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <button onClick={onJoin} disabled={joining}
                  className="w-full py-3 bg-black text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {joining ? <><FiLoader size={14} className="animate-spin" /> Joining...</> : "Join Campaign"}
                </button>
                <p className="text-[10px] text-gray-400 text-center">By joining you agree to the terms and conditions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────
function CampaignCard({ campaign, googleId, joinedIds, onClick }) {
  const isPublic  = campaign.campaignType === "public";
  const isJoined  = joinedIds.has(campaign._id) || (Array.isArray(campaign.userIds) && campaign.userIds.includes(googleId));
  const spotsLeft = Math.max(0, Number(campaign.limit || 0) - (Array.isArray(campaign.userIds) ? campaign.userIds.length : 0));
  const status    = getCampaignStatus(campaign);

  return (
    <div onClick={onClick} className="bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all duration-200 group">
      {/* Image */}
      <div className="relative h-36 overflow-hidden bg-gray-100">
        {campaign.image?.url
          ? <img src={campaign.image.url} alt={campaign.campaignName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center"><FiImage size={28} className="text-gray-300" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-white ${status.cls}`}>
          {status.label}
        </span>
        <span className="absolute top-2.5 right-2.5 px-2 py-1 bg-black text-white text-[10px] font-bold rounded-md">
          {campaign.credits} pts
        </span>
        {isJoined && !isPublic && (
          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-white text-black text-[10px] font-bold rounded-md border border-gray-300">Joined</span>
        )}
        {isPublic && (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md flex items-center gap-1">
            <FiGlobe size={10} /> Public
          </span>
        )}
      </div>

      {/* Brand strip */}
      {(campaign.brandImage?.url || campaign.categoryImage?.url) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
          {campaign.brandImage?.url && <img src={campaign.brandImage.url} alt="Brand" className="w-6 h-6 rounded-md object-cover border border-gray-200" />}
          <span className="text-xs text-gray-700 font-medium truncate">{campaign.brandName}</span>
          {campaign.category && <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">{campaign.category}</span>}
        </div>
      )}

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <h3 className="font-semibold text-gray-900 text-sm group-hover:text-black line-clamp-1 flex-1">{campaign.campaignName}</h3>
          <span className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${isPublic ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
            {isPublic ? "PUBLIC" : "PRIVATE"}
          </span>
        </div>
        <p className="text-gray-400 text-xs line-clamp-2 mb-3 leading-relaxed">{(campaign.description || "").trim() || "No description."}</p>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1"><FiMapPin size={10} /> {campaign.location}</span>
          {isPublic
            ? <span className="flex items-center gap-1 text-blue-500 font-medium"><FiGlobe size={10} /> Open to all</span>
            : <span className={`flex items-center gap-1 ${spotsLeft === 0 ? "text-gray-700 font-semibold" : ""}`}><FiUsers size={10} /> {spotsLeft} spots</span>
          }
        </div>

        {(campaign.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {campaign.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">{tag}</span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {(Array.isArray(campaign.supportedTaskTypes) ? campaign.supportedTaskTypes : ['reels']).map((tid) => {
            const t = CAMPAIGN_TASK_TYPES.find((x) => x.id === tid);
            return t ? (
              <span key={tid} className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-semibold">
                {t.icon} {t.label}
              </span>
            ) : null;
          })}
        </div>

        <button
          onClick={e => { e.stopPropagation(); onClick(); }}
          className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            isPublic
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : isJoined
              ? "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {isPublic ? "🌐 View Details" : isJoined ? "✅ Joined — View" : "Join Campaign"}
          <FiChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

function UserCampaignTab({ onGoToTask }) {
  const [allCampaigns, setAllCampaigns]         = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [joining, setJoining]                   = useState(false);
  const [joinedIds, setJoinedIds]               = useState(() => {
    try {
      const stored = sessionStorage.getItem("joinedCampaignIds");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  const userData = JSON.parse(
    localStorage.getItem("mobileUserData") ||
    localStorage.getItem("userData") ||
    sessionStorage.getItem("userData") || "{}"
  );
  const googleId = userData.googleId || localStorage.getItem("googleId") || "";

  const getUserToken = () =>
    localStorage.getItem("mobileUserToken") ||
    localStorage.getItem("clienttoken")     ||
    sessionStorage.getItem("clienttoken")   ||
    sessionStorage.getItem("usertoken")     ||
    localStorage.getItem("usertoken");

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const token = getUserToken();
      const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const now = new Date();
      const [privRes, pubRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/auth/user/campaign/active/private`, { headers }),
        fetch(`${API_BASE_URL}/api/auth/user/campaign/active/public`, { headers }),
      ]);
      const privData = await privRes.json();
      const pubData = await pubRes.json();
      const notExpired = (c) => new Date(c.endDate) >= now;
      const privateCampaigns = (privData.success && Array.isArray(privData.campaigns))
        ? privData.campaigns.filter(notExpired)
        : [];
      const publicCampaigns = (pubData.success && Array.isArray(pubData.campaigns))
        ? pubData.campaigns.filter(notExpired)
        : [];
      setAllCampaigns(
        [...privateCampaigns, ...publicCampaigns].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
    } catch {
      setAllCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleJoin = async () => {
    if (!googleId)            { alert("Please sign in to join campaigns."); return; }
    if (!selectedCampaign || joining) return;
    setJoining(true);
    try {
      const token   = getUserToken();
      const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const [r1]    = await Promise.all([
        fetch(`${API_BASE_URL}/api/auth/user/campaign/activeparticipants/${selectedCampaign._id}`, {
          method: "POST", headers, body: JSON.stringify({ userId: googleId }),
        }),
        fetch(`${API_BASE_URL}/api/auth/user/campaign/register/${selectedCampaign._id}`, {
          method: "POST", headers, body: JSON.stringify({ userId: googleId }),
        }),
      ]);
      const d1 = await r1.json();
      if (r1.ok && d1.success) {
        const newJoinedIds = new Set([...joinedIds, selectedCampaign._id]);
        setJoinedIds(newJoinedIds);
        try { sessionStorage.setItem("joinedCampaignIds", JSON.stringify([...newJoinedIds])); } catch {}
        fetchCampaigns();
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

  if (selectedCampaign) {
    return (
      <CampaignDetail
        campaign={selectedCampaign}
        googleId={googleId}
        joinedIds={joinedIds}
        joining={joining}
        onBack={() => setSelectedCampaign(null)}
        onJoin={handleJoin}
        onGoToTask={onGoToTask}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-4 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Private campaigns — join first, then client assigns tasks. Public campaigns — tasks appear in Task → Public.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full">
            {allCampaigns.length} available
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && allCampaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <FiLock size={28} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-800 mb-1">No campaigns available</p>
            <p className="text-sm text-gray-400">Check back later for new opportunities</p>
          </div>
        )}

        {!loading && allCampaigns.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCampaigns.map(campaign => (
              <CampaignCard
                key={campaign._id}
                campaign={campaign}
                googleId={googleId}
                joinedIds={joinedIds}
                onClick={() => setSelectedCampaign(campaign)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCampaignTab;
