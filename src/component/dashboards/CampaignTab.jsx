import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";
import ManageCampaign from "./ManageCampaign";

const BUSINESS_INTEREST_OPTIONS = [
  "Fashion & Lifestyle",
  "Beauty & Cosmetics",
  "Health & Wellness",
  "Travel & Tourism",
  "Food & Beverages",
  "Tech & Gadgets",
  "Finance & Investing",
  "Parenting & Family",
  "Education & EdTech",
  "Gaming & eSports",
  "Fitness & Sports",
  "Music & Entertainment",
  "Luxury & Automobiles",
  "Environment & Sustainability",
  "Startups & Entrepreneurship",
  "Books & Literature",
  "Home Decor & Interiors",
  "Pet Care",
  "Non-Profit & Social Causes",
];

const CampaignTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    campaignName: "",
    brandName: "",
    goal: "",
    groupIds: "",
    tags: "",
    credits: "",
    location: "",
    tNc: "",
    status: "Active",
    imageKey: "",
    imageUrl: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    limit: "",
    views: "",
    cutoff: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef();
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const navigate = useNavigate();
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [campaignStats, setCampaignStats] = useState({}); // { [campaignId]: { views, likes, comments, participants } }
  const [viewMode, setViewMode] = useState("card"); // 'card' | 'list'

  // Get clientId from sessionStorage userData
  const userData = JSON.parse(sessionStorage.getItem("userData") || "{}");
  const clientId = userData.clientId;

  const fetchCampaigns = async () => {
    try {
      const token = sessionStorage.getItem(userData.clientId);
      const url = `${API_BASE_URL}/api/auth/user/campaign/client/${clientId}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.campaigns)) {
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
    if (clientId) fetchCampaigns();
  }, [clientId, showModal]);

  // Fetch participants and aggregate stored user responses per campaign to compute totals
  useEffect(() => {
    const fetchTotalsForCampaign = async (campaignId) => {
      try {
        // Get participants for the campaign
        const partRes = await fetch(
          `${API_BASE_URL}/api/auth/user/campaign/activeparticipants/${campaignId}`
        );
        const partData = await partRes.json();
        const userIds =
          partRes.ok && partData.success ? partData.userIds || [] : [];

        if (userIds.length === 0) {
          setCampaignStats((prev) => ({
            ...prev,
            [campaignId]: { views: 0, likes: 0, comments: 0, participants: 0 },
          }));
          return;
        }

        // Fetch responses for all users in parallel
        const responsesArrays = await Promise.all(
          userIds.map(async (userId) => {
            try {
              const res = await fetch(
                `${API_BASE_URL}/api/pools/user/response/get/${userId}`
              );
              const data = await res.json();
              if (res.ok && Array.isArray(data.response)) return data.response;
            } catch {}
            return [];
          })
        );

        const allResponses = responsesArrays
          .flat()
          .filter((r) => r && r.campaignId === campaignId);

        const totals = allResponses.reduce(
          (acc, r) => {
            const v = Number(r.views || 0);
            const l = Number(r.likes || 0);
            const c = Number(r.comments || 0);
            acc.views += isNaN(v) ? 0 : v;
            acc.likes += isNaN(l) ? 0 : l;
            acc.comments += isNaN(c) ? 0 : c;
            return acc;
          },
          { views: 0, likes: 0, comments: 0 }
        );

        setCampaignStats((prev) => ({
          ...prev,
          [campaignId]: { ...totals, participants: userIds.length },
        }));
      } catch {
        setCampaignStats((prev) => ({
          ...prev,
          [campaignId]: { views: 0, likes: 0, comments: 0, participants: 0 },
        }));
      }
    };

    if (Array.isArray(campaigns) && campaigns.length > 0) {
      campaigns.forEach((c) => {
        const id = c._id;
        if (id && !campaignStats[id]) {
          fetchTotalsForCampaign(id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle image upload (simulate S3 upload, just preview for now)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      // Simulate S3 key and url
      setForm({
        ...form,
        imageKey: file.name,
        imageUrl: url,
      });
    }
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // Combine date and time for start and end
      // Send as ISO strings so backend (usually running in UTC) interprets
      // the same absolute moment the user selected in their local timezone.
      let startDateTime = "";
      let endDateTime = "";

      if (form.startDate && form.startTime) {
        const start = new Date(`${form.startDate}T${form.startTime}`);
        if (Number.isNaN(start.getTime())) {
          setError("Invalid start date/time.");
          setLoading(false);
          return;
        }
        startDateTime = start.toISOString();
      }

      if (form.endDate && form.endTime) {
        const end = new Date(`${form.endDate}T${form.endTime}`);
        if (Number.isNaN(end.getTime())) {
          setError("Invalid end date/time.");
          setLoading(false);
          return;
        }
        endDateTime = end.toISOString();
      }

      const formData = new FormData();
      formData.append("campaignName", form.campaignName);
      formData.append("brandName", form.brandName);
      formData.append("goal", form.goal);
      formData.append("groupIds", form.groupIds);
      formData.append("tags", form.tags);
      formData.append("credits", form.credits);
      formData.append("location", form.location);
      formData.append("tNc", form.tNc);
      formData.append("status", form.status);
      formData.append("clientId", clientId);
      formData.append("description", form.description);
      formData.append("startDate", startDateTime);
      formData.append("endDate", endDateTime);
      formData.append("limit", form.limit);
      formData.append("views", form.views);
      formData.append("cutoff", form.cutoff);
      if (fileInputRef.current && fileInputRef.current.files[0]) {
        formData.append("image", fileInputRef.current.files[0]);
      }

      const now = new Date();
      const selectedStart = new Date(
        `${form.startDate}T${form.startTime || "00:00"}`
      );
      const selectedEnd = new Date(
        `${form.endDate}T${form.endTime || "00:00"}`
      );
      if (
        form.startDate === todayStr &&
        form.startTime &&
        selectedStart < now
      ) {
        setError("Start time cannot be in the past.");
        setLoading(false);
        return;
      }
      if (form.endDate === todayStr && form.endTime && selectedEnd < now) {
        setError("End time cannot be in the past.");
        setLoading(false);
        return;
      }
      if (selectedEnd <= selectedStart) {
        setError("End date/time must be after start date/time.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/user/campaign`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Campaign created successfully!");
        setShowModal(false);
        setForm({
          campaignName: "",
          brandName: "",
          goal: "",
          groupIds: "",
          tags: "",
          credits: "",
          location: "",
          tNc: "",
          status: "Active",
          imageKey: "",
          imageUrl: "",
          description: "",
          startDate: "",
          startTime: "",
          endDate: "",
          endTime: "",
          limit: "",
          views: "",
          cutoff: "",
        });
        setImagePreview("");
        fetchCampaigns();
      } else {
        setError(data.message || "Failed to create campaign");
      }
    } catch (err) {
      setError("Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  // --- Edit Handlers ---
  const handleEditClick = (campaign) => {
    setEditForm({ ...campaign });
    setEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
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
      console.log("Update response:", data);
      if (res.ok && data.success) {
        setEditModal(false);
        fetchCampaigns();
      } else {
        alert(data.message || "Failed to update campaign");
      }
    } catch {
      alert("Failed to update campaign");
    } finally {
      setEditLoading(false);
    }
  };

  // --- Delete Handler ---
  const handleDelete = async (campaign) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this campaign? This action cannot be undone."
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/auth/user/campaign/${campaign._id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        fetchCampaigns();
      } else {
        alert(data.message || "Failed to delete campaign");
      }
    } catch {
      alert("Failed to delete campaign");
    } finally {
      setLoading(false);
    }
  };

  if (selectedCampaign) {
    return (
      <ManageCampaign
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5); // "HH:MM"

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-orange-900">Campaigns</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              className={`px-3 py-2 text-sm font-semibold ${
                viewMode === "card"
                  ? "bg-orange-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setViewMode("card")}
            >
              Card
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm font-semibold border-l border-gray-200 ${
                viewMode === "list"
                  ? "bg-orange-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
          </div>
          <button
            className="px-4 py-2 rounded font-semibold text-white shadow-sm transition-all bg-gradient-to-r from-yellow-500 to-orange-600 hover:brightness-110"
            onClick={() => setShowModal(true)}
          >
            Create Campaign
          </button>
        </div>
      </div>
      {success && <div className="text-green-600 mb-4">{success}</div>}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-2xl relative border border-green-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 text-green-700 text-center">
              Create Campaign
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Campaign Name
                </label>

                <input
                  type="text"
                  name="campaignName"
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  placeholder="Campaign Name"
                  value={form.campaignName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  name="brandName"
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  placeholder="Brand Name"
                  value={form.brandName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Goal
                </label>
                <input
                  type="text"
                  name="goal"
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  placeholder="Goal"
                  value={form.goal}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Campaign Image
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 font-semibold transition-all duration-150"
                    onClick={() => fileInputRef.current.click()}
                    disabled={loading}
                  >
                    Upload Image
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-10 object-cover rounded-lg border border-green-300 shadow"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  placeholder="tag1,tag2,tag3"
                  value={form.tags}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Credits Per Task
                </label>
                <input
                  type="number"
                  name="credits"
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  placeholder="Credits"
                  value={form.credits}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  placeholder="Location"
                  value={form.location}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 font-semibold mb-1">
                Terms & Conditions
              </label>
              <textarea
                name="tNc"
                className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-base"
                placeholder="Terms and Conditions"
                value={form.tNc}
                onChange={handleChange}
                disabled={loading}
                rows={2}
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 font-semibold mb-1">
                Description
              </label>
              <textarea
                name="description"
                className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-base"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                disabled={loading}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-base"
                  value={form.startDate}
                  onChange={handleChange}
                  disabled={loading}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-base"
                  value={form.startTime}
                  onChange={handleChange}
                  disabled={loading}
                  min={form.startDate === todayStr ? nowTime : undefined}
                  step="60"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-base"
                  value={form.endDate}
                  onChange={handleChange}
                  disabled={loading}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-base"
                  value={form.endTime}
                  onChange={handleChange}
                  disabled={loading}
                  min={form.endDate === todayStr ? nowTime : undefined}
                  step="60"
                />
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 font-semibold mb-1">
                Target Channels
              </label>
              <input
                type="number"
                name="limit"
                className="w-full border border-green-400 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-base"
                placeholder="Target Channels"
                value={form.limit}
                onChange={handleChange}
                disabled={loading}
              />
              <label className="block text-gray-700 font-semibold mb-1">
                Minimum Target Views
              </label>
              <input
                type="number"
                name="views"
                className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-base"
                placeholder="Minimum Target Views"
                value={form.views}
                onChange={handleChange}
                disabled={loading}
              />
              <label className="block text-gray-700 font-semibold mb-1 mt-2">
                Cutoff
              </label>
              <input
                type="number"
                name="cutoff"
                className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-base"
                placeholder="Cutoff"
                value={form.cutoff}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold shadow"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 font-semibold shadow"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Campaigns: Card or List view */}
      {viewMode === "card" ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {campaigns.map((c) => (
            <div
              key={c._id || c.campaignName}
              className="bg-white border border-orange-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-3 md:p-4 relative group cursor-pointer hover:-translate-y-0.5"
              onClick={() => setSelectedCampaign(c)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base md:text-lg font-bold text-orange-900 leading-tight pr-2 line-clamp-1">
                  {c.campaignName}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    className="p-1 rounded hover:bg-gray-100 text-orange-800 hover:text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      const id = c._id || c.campaignName;
                      setOpenMenuId((prev) => (prev === id ? null : id));
                    }}
                    aria-label="More"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="5" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="12" cy="19" r="1.8" />
                    </svg>
                  </button>
                  {openMenuId === (c._id || c.campaignName) && (
                    <div
                      className="absolute right-2 top-9 z-10 w-56 rounded-xl border border-orange-200 bg-white shadow-lg p-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        Active Participants :
                        <span className="text-xs text-orange-800 font-semibold ml-2 truncate">
                          {campaignStats[c._id]?.participants || 0}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        About :
                        <span className="text-xs text-orange-800 font-semibold ml-2">
                          {c.description
                            ? c.description.split(" ").slice(0, 20).join(" ") +
                              (c.description.split(" ").length > 20 ? "…" : "")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {c.image && c.image.url && (
                <div className="mb-3 overflow-hidden rounded-xl">
                  <img
                    src={c.image.url}
                    alt="Campaign"
                    className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 font-medium min-w-20">
                    Brand:
                  </span>
                  <span className="text-sm text-gray-800 font-semibold ml-2 truncate">
                    {c.brandName}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-xs text-gray-500 font-medium min-w-20">
                    Active Participants:
                  </span>
                  <span className="text-sm text-gray-800 font-semibold ml-2">
                    {campaignStats[c._id]?.participants || 0}
                  </span>
                </div>

                {/* Aggregated totals from user responses */}
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="bg-green-50 border border-green-100 rounded-md px-2 py-1 text-center">
                    <div className="text-[11px] text-green-700 font-medium">
                      Views
                    </div>
                    <div className="text-sm text-green-900 font-bold">
                      {(campaignStats[c._id]?.views || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-md px-2 py-1 text-center">
                    <div className="text-[11px] text-red-700 font-medium">
                      Likes
                    </div>
                    <div className="text-sm text-red-900 font-bold">
                      {(campaignStats[c._id]?.likes || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-md px-2 py-1 text-center">
                    <div className="text-[11px] text-blue-700 font-medium">
                      Comments
                    </div>
                    <div className="text-sm text-blue-900 font-bold">
                      {(campaignStats[c._id]?.comments || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Start:</span>
                      <span className="ml-1">
                        {c.startDate
                          ? new Date(c.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">End:</span>
                      <span className="ml-1">
                        {c.endDate
                          ? new Date(c.endDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && (
            <div className="text-gray-400 col-span-full text-center py-12">
              <div className="text-lg font-medium">No campaigns found</div>
              <div className="text-sm mt-1">
                Check back later for new opportunities
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
            <div className="col-span-4">Campaign</div>
            <div className="col-span-2">Brand / Active Participants</div>
            <div className="col-span-1 text-center">Views</div>
            <div className="col-span-1 text-center">Likes</div>
            <div className="col-span-1 text-center">Comments</div>
            <div className="col-span-2">Dates</div>
            <div className="col-span-1 text-right pr-2">Actions</div>
          </div>
          {campaigns.length === 0 ? (
            <div className="text-gray-400 text-center py-12">
              No campaigns found
            </div>
          ) : (
            <>
              <div className="h-2" />
              {campaigns.map((c) => (
                <div
                  key={c._id || c.campaignName}
                  className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedCampaign(c)}
                >
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    {c.image && c.image.url ? (
                      <img
                        src={c.image.url}
                        alt="Campaign"
                        className="w-16 h-10 object-cover rounded-md border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-gray-200 rounded-md border border-gray-200 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {c.campaignName}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(c.tags) ? c.tags : [c.tags])
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((tag, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm">
                    <div className="text-gray-800 font-medium truncate">
                      {c.brandName || "-"}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Active: {campaignStats[c._id]?.participants || 0}
                    </div>
                  </div>
                  <div className="col-span-1 text-center text-sm font-bold text-green-900">
                    {(campaignStats[c._id]?.views || 0).toLocaleString()}
                  </div>
                  <div className="col-span-1 text-center text-sm font-bold text-red-900">
                    {(campaignStats[c._id]?.likes || 0).toLocaleString()}
                  </div>
                  <div className="col-span-1 text-center text-sm font-bold text-blue-900">
                    {(campaignStats[c._id]?.comments || 0).toLocaleString()}
                  </div>
                  <div className="col-span-2 text-xs text-gray-700">
                    <div>
                      <span className="font-medium">Start:</span>{" "}
                      {c.startDate
                        ? new Date(c.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </div>
                    <div>
                      <span className="font-medium">End:</span>{" "}
                      {c.endDate
                        ? new Date(c.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end pr-2">
                    <button
                      className="px-3 py-1.5 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampaign(c);
                      }}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editModal && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative border border-green-200 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-4 text-gray-400 hover:text-green-600 text-3xl font-bold"
              onClick={() => setEditModal(false)}
              title="Close"
              disabled={editLoading}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">
              Edit Campaign
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  name="campaignName"
                  value={editForm.campaignName || ""}
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  required
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  name="brandName"
                  value={editForm.brandName || ""}
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  required
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Goal
                </label>
                <input
                  type="text"
                  name="goal"
                  value={editForm.goal || ""}
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  required
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editForm.description || ""}
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-base"
                  rows={2}
                  required
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  name="credits"
                  value={editForm.credits || ""}
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  required
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location || ""}
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  required
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Limit
                </label>
                <input
                  type="number"
                  name="limit"
                  value={editForm.limit || ""}
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  required
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Target Views
                </label>
                <input
                  type="number"
                  name="views"
                  value={editForm.views || ""}
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  required
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={
                    editForm.startDate ? editForm.startDate.slice(0, 16) : ""
                  }
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  required
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={editForm.endDate ? editForm.endDate.slice(0, 16) : ""}
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  required
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tags (comma separated)
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
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  name="tNc"
                  value={editForm.tNc || ""}
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-base"
                  rows={2}
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Cutoff (number)
                </label>
                <input
                  type="number"
                  name="cutoff"
                  value={editForm.cutoff || ""}
                  onChange={handleEditChange}
                  className="w-full border border-green-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-lg"
                  required
                  disabled={editLoading}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold shadow"
                  onClick={() => setEditModal(false)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold shadow disabled:opacity-60"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignTab;
