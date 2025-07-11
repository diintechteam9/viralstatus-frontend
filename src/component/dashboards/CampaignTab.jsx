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

  // Get clientId from sessionStorage userData
  const userData = JSON.parse(sessionStorage.getItem("userData") || "{}");
  const clientId = userData.clientId;

  const fetchCampaigns = async () => {
    try {
      // Use the getActiveCampaigns endpoint (GET) with clientId as query param
      const res = await fetch(
        `${API_BASE_URL}/api/auth/user/campaign/active?clientId=${clientId}`
      );
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
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
      const startDateTime =
        form.startDate && form.startTime
          ? `${form.startDate}T${form.startTime}`
          : "";
      const endDateTime =
        form.endDate && form.endTime ? `${form.endDate}T${form.endTime}` : "";

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
      if (fileInputRef.current && fileInputRef.current.files[0]) {
        formData.append("image", fileInputRef.current.files[0]);
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Campaigns</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-semibold"
          onClick={() => setShowModal(true)}
        >
          Create Campaign
        </button>
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
      {/* Campaign List */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => (
          <div
            key={c._id || c.campaignName}
            className="bg-white border border-green-200 rounded-xl shadow-md p-6 relative"
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedCampaign(c)}
          >
            <div className="text-lg font-bold text-green-700 mb-5">
              {c.campaignName}
            </div>
            {c.image && c.image.url && (
              <img
                src={c.image.url}
                alt="Campaign"
                className="w-full h-40 object-fill rounded mb-2"
              />
            )}
            <div className="text-sm text-gray-600 mb-1">
              Brand Name: <span className="font-semibold">{c.brandName}</span>
            </div>
            <div className="text-sm text-gray-600 mb-1">
              Description:{" "}
              <span className="font-semibold">{c.description}</span>
            </div>
            <div className="text-sm text-gray-600 mb-1">
              Limit: <span className="font-semibold">{c.limit}</span>
            </div>
            {c.views && (
              <div className="text-sm text-gray-600 mb-1">
                Minimum Target Views:{" "}
                <span className="font-semibold">{c.views}</span>
              </div>
            )}
            <div className="text-sm text-gray-600 mb-1">
              Start:{" "}
              <span className="font-semibold">
                {c.startDate
                  ? new Date(c.startDate).toLocaleString("en-US", {
                      hour12: true,
                    })
                  : "-"}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-1">
              End:{" "}
              <span className="font-semibold">
                {c.endDate
                  ? new Date(c.endDate).toLocaleString("en-US", {
                      hour12: true,
                    })
                  : "-"}
              </span>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg font-medium transition-colors duration-200"
                onClick={() => handleEditClick(c)}
                disabled={loading}
              >
                Edit
              </button>
              <button
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors duration-200"
                onClick={() => handleDelete(c)}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="text-gray-400 col-span-full text-center">
            No campaigns found.
          </div>
        )}
      </div>

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
