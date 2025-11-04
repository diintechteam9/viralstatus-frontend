import React, { useState, useEffect } from "react";
import { FaPlus, FaCog, FaEdit, FaTrash, FaFilter, FaRegClock, FaImage, FaSearch, FaSortAlphaDown, FaSortAlphaUp, FaUpload } from "react-icons/fa";
import PoolImages from "./PoolImages";
import BatchUpload from "./imagepoolcontenttab.jsx/BatchUpload";
import { API_BASE_URL } from "../../config";

const ImageContentPoolTab = ({ clientId: propClientId, googleId: propGoogleId }) => {
  const [imagePools, setImagePools] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [editingImagePool, setEditingImagePool] = useState(null);
  const [newImagePoolName, setNewImagePoolName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedImagePool, setSelectedImagePool] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [showMenu, setShowMenu] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("none"); // none | asc | desc
  const [availableCategories, setAvailableCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [selectedImagePoolForBatch, setSelectedImagePoolForBatch] = useState(null);

  const normalizeCategory = (value) => {
    const v = (value || "").trim();
    return v ? v : "Other";
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Resolve identifiers: prefer props, then sessionStorage.userData, then localStorage
  let sessionUser = {};
  try {
    sessionUser = JSON.parse(typeof window !== "undefined" ? (sessionStorage.getItem("userData") || "{}") : "{}");
  } catch {}
  const effectiveClientId =
    propClientId || sessionUser.clientId || (typeof window !== "undefined" ? localStorage.getItem("clientId") : null);
  const effectiveGoogleId =
    propGoogleId || sessionUser.googleId || (typeof window !== "undefined" ? localStorage.getItem("googleId") : null);
  const idQuery = effectiveClientId
    ? `clientId=${encodeURIComponent(effectiveClientId)}`
    : effectiveGoogleId
    ? `googleId=${encodeURIComponent(effectiveGoogleId)}`
    : "";

  // Get unique categories from image pools
  const getUniqueCategories = () => {
    const categories = imagePools
      .map((imagePool) => normalizeCategory(imagePool.category))
      .filter((category, index, arr) => arr.indexOf(category) === index);
    return ["All", ...categories];
  };

  // Filter image pools based on selected category and search query
  const getFilteredImagePools = () => {
    const byCategory = selectedCategory === "All"
      ? imagePools
      : imagePools.filter((imagePool) => normalizeCategory(imagePool.category) === selectedCategory);
    const q = (searchQuery || "").trim().toLowerCase();
    const bySearch = q ? byCategory.filter((imagePool) => (imagePool.name || "").toLowerCase().includes(q)) : byCategory;
    if (sortOrder === "none") return bySearch;
    const sorted = [...bySearch].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    return sortOrder === "asc" ? sorted : sorted.reverse();
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "none" ? "asc" : prev === "asc" ? "desc" : "none"));
  };

  // Fetch categories for dropdowns
  const fetchAvailableCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError("");
      const token = typeof window !== "undefined" ? sessionStorage.getItem("clienttoken") : null;
      if (!token) {
        setAvailableCategories([]);
        setCategoriesError("Authentication required to load categories");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to fetch categories");
      }

      const categories = Array.isArray(data?.categories) ? data.categories : [];
      setAvailableCategories(categories);
    } catch (e) {
      setCategoriesError(e.message || "Failed to load categories");
      setAvailableCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch image pools from backend (scoped to client or google user)
  const fetchImagePools = async () => {
    setLoading(true);
    setError("");
    try {
      if (!idQuery) {
        setError("Missing clientId or googleId");
        setImagePools([]);
        return;
      }
      console.log("Fetching image pools from:", `${API_BASE_URL}/api/image-pools?${idQuery}`);
      const res = await fetch(`${API_BASE_URL}/api/image-pools?${idQuery}`);
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);
      if (res.ok) {
        setImagePools(data.imagePools || []);
      } else {
        setError(data.error || "Failed to fetch image pools");
      }
    } catch (err) {
      console.error("Error fetching image pools:", err);
      setError("Failed to fetch image pools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImagePools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idQuery]);

  const handleCreate = () => {
    setShowModal(true);
    setNewImagePoolName("");
    setDescription("");
    setCategory("");
    setError("");
    fetchAvailableCategories();
  };

  const handleEdit = (imagePool) => {
    setEditingImagePool(imagePool);
    setNewImagePoolName(imagePool.name);
    setDescription(imagePool.description || "");
    setCategory(imagePool.category || "");
    setShowEditModal(true);
    setError("");
    setShowMenu(null);
    fetchAvailableCategories();
  };

  const handleDelete = async (imagePool) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${imagePool.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/image-pools/${imagePool._id}?${idQuery}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        fetchImagePools();
        setShowMenu(null);
      } else {
        setError(data.error || "Failed to delete image pool");
      }
    } catch (err) {
      console.error("Error deleting image pool:", err);
      setError("Failed to delete image pool");
    }
  };

  const handleAddImagePool = async () => {
    if (!newImagePoolName.trim()) {
      setError("Image pool name is required");
      return;
    }
    setCreating(true);
    setError("");

    const imagePoolData = {
      name: newImagePoolName.trim(),
      description: description.trim() || undefined,
      category: normalizeCategory(category),
    };
    if (effectiveClientId) imagePoolData.clientId = effectiveClientId;
    else if (effectiveGoogleId) imagePoolData.googleId = effectiveGoogleId;

    console.log("Creating image pool with data:", imagePoolData);
    console.log("API URL:", `${API_BASE_URL}/api/image-pools`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/image-pools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(imagePoolData),
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (res.ok) {
        setShowModal(false);
        setNewImagePoolName("");
        setDescription("");
        setCategory("");
        fetchImagePools();
      } else {
        console.error("Server error:", data);

        // Handle specific error cases
        if (data.error && data.error.includes("already exists")) {
          setError(data.error);
          // If there's existing image pool info, show it
          if (data.existingImagePool) {
            setError(
              `${data.error} (Existing image pool: ${data.existingImagePool.name})`
            );
          }
        } else {
          setError(data.error || data.message || "Failed to create image pool");
        }
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Failed to create image pool - Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateImagePool = async () => {
    if (!newImagePoolName.trim()) {
      setError("Image pool name is required");
      return;
    }
    setUpdating(true);
    setError("");

    const imagePoolData = {
      name: newImagePoolName.trim(),
      description: description.trim() || "",
      category: category.trim() || "",
    };
    if (effectiveClientId) imagePoolData.clientId = effectiveClientId;
    else if (effectiveGoogleId) imagePoolData.googleId = effectiveGoogleId;

    try {
      const res = await fetch(`${API_BASE_URL}/api/image-pools/${editingImagePool._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(imagePoolData),
      });

      const data = await res.json();

      if (res.ok) {
        setShowEditModal(false);
        setEditingImagePool(null);
        setNewImagePoolName("");
        setDescription("");
        setCategory("");
        fetchImagePools();
      } else {
        console.error("Server error:", data);

        // Handle specific error cases
        if (data.error && data.error.includes("already exists")) {
          setError(data.error);
          if (data.existingImagePool) {
            setError(
              `${data.error} (Existing image pool: ${data.existingImagePool.name})`
            );
          }
        } else {
          setError(data.error || data.message || "Failed to update image pool");
        }
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Failed to update image pool - Network error");
    } finally {
      setUpdating(false);
    }
  };

  // Handler to show PoolImages for an image pool
  const handleImagePoolClick = (imagePool) => {
    setSelectedImagePool(imagePool);
  };

  // Handler to go back to image pool list
  const handleBackToImagePools = () => {
    setSelectedImagePool(null);
    setShowImageModal(false);
  };

  // If an image pool is selected, show PoolImages
  if (selectedImagePool) {
    return (
      <div className="w-full h-full min-h-screen bg-white relative">
        <div className="w-full flex justify-between">
          {/* Back Button */}
          <button
            className="m-4 px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 cursor-pointer"
            onClick={handleBackToImagePools}
          >
            ← Back to Image Pools
          </button>
        </div>
        {/* Pool Images Grid */}
        <div className="w-full flex flex-col items-center">
          <PoolImages
            imagePool={selectedImagePool}
            onImagesUpdated={() => {
              // Refresh image pools list to update image counts
              fetchImagePools();
            }}
            onBatchUpload={() => {
              setSelectedImagePoolForBatch(selectedImagePool);
              setShowBatchUpload(true);
            }}
          />
        </div>
        
        {/* Batch Upload Modal */}
        {showBatchUpload && (
          <div className="absolute inset-0 z-50 bg-gray-900/50">
            <BatchUpload onClose={() => setShowBatchUpload(false)} imagePool={selectedImagePoolForBatch} />
          </div>
        )}
      </div>
    );
  }

  const filteredImagePools = getFilteredImagePools();
  const uniqueCategories = getUniqueCategories();

  return (
    <div className="space-y-6 relative">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl font-semibold text-gray-800">List of Image Pools</h2>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-sm sm:text-base w-full sm:w-auto justify-center mt-2 sm:mt-0"
          onClick={handleCreate}
        >
          <FaPlus /> Create
        </button>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
          <strong>Debug Info:</strong> {debugInfo}
        </div>
      )}

      {/* Loading/Error States */}
      {loading && <div className="text-gray-500">Loading image pools...</div>}
      {error && !showModal && !showEditModal && (
        <div className="text-red-500 bg-red-50 border border-red-200 rounded p-2 mb-2">
          {error}
        </div>
      )}

      {/* Category Filter Bar */}
      {imagePools.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <span className="text-purple-800">Filter</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueCategories.map((category) => (
                <button
                  key={category}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                  {category !== "All" && (
                    <span className="ml-1 text-xs opacity-75">
                      ({imagePools.filter((imagePool) => normalizeCategory(imagePool.category) === category).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSortOrder}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                sortOrder === "none" ? "border-gray-300 text-gray-700 hover:bg-gray-100" : "border-purple-500 bg-purple-50 text-purple-700"
              }`}
              title={sortOrder === "desc" ? "Clear sort" : sortOrder === "asc" ? "Sort Z–A" : "Sort A–Z"}
            >
              {sortOrder === "desc" ? <FaSortAlphaUp /> : <FaSortAlphaDown />}
              <span>{sortOrder === "desc" ? "Z–A" : "A–Z"}</span>
            </button>
            <div className="relative flex-1 sm:flex-none">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search image pools by name..."
                className="w-full sm:w-72 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Pool Cards */}
      <div className="flex flex-col gap-6 w-full mt-6">
        {filteredImagePools.length === 0 && !loading && (
          <div className="text-gray-400 text-center py-8">
            {selectedCategory === "All"
              ? "No image pools found."
              : `No image pools found in category "${selectedCategory}".`}
          </div>
        )}
        {filteredImagePools.map((imagePool) => (
          <div
            key={imagePool._id}
            className="bg-white/90 border border-purple-200 rounded-2xl shadow-md p-6 w-full hover:shadow-lg hover:border-purple-400 hover:-translate-y-0.5 transition-all duration-200 group relative cursor-pointer"
            onClick={() => {
              handleImagePoolClick(imagePool), setShowImageModal(true);
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-lg font-bold text-purple-800 group-hover:text-black transition truncate">
                  {imagePool.name}
                </div>
                <span className="shrink-0 text-xs bg-pink-50 text-purple-700 px-3 py-1 rounded-full font-semibold border border-purple-200">
                  {normalizeCategory(imagePool.category)}
                </span>
              </div>
              <div className="flex items-center gap-2">
               
                <div className="relative">
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(showMenu === imagePool._id ? null : imagePool._id);
                    }}
                  >
                    <FaCog />
                  </button>
                  {showMenu === imagePool._id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(imagePool);
                        }}
                      >
                        <FaEdit className="text-purple-600" />
                        Edit
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(imagePool);
                        }}
                      >
                        <FaTrash className="text-red-500" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {imagePool.description && (
              <div className="text-sm text-gray-600 mb-2">
                {imagePool.description}
              </div>
            )}
            <div className="flex items-center flex-wrap gap-6 mt-3 text-sm text-gray-600 font-medium">
              <div className="inline-flex items-center gap-2">
                <FaImage className="text-purple-600" />
                <span>
                  Images: <span className="text-purple-800 font-bold">{imagePool.imageCount || 0}</span>
                </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <FaRegClock className="text-purple-600" />
                <span>Created {formatDateTime(imagePool.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for new image pool */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Create New Image Pool
            </h3>
            <input
              type="text"
              className="w-full border border-purple-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Enter image pool name *"
              value={newImagePoolName}
              onChange={(e) => setNewImagePoolName(e.target.value)}
              autoFocus
              disabled={creating}
            />
            <textarea
              className="w-full border border-purple-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              placeholder="Enter description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              disabled={creating}
            />
            {/* Category dropdown */}
            <div className="mb-2">
              <label className="block text-sm text-gray-700 mb-1">Category (optional)</label>
              <select
                className="w-full border border-purple-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={creating || categoriesLoading}
              >
                <option value="">Select category</option>
                {availableCategories.map((cat) => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              {categoriesError && (
                <div className="text-red-500 text-xs mt-1">{categoriesError}</div>
              )}
            </div>
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setShowModal(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                onClick={handleAddImagePool}
                disabled={creating}
              >
                {creating ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing image pool */}
      {showEditModal && editingImagePool && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Edit Image Pool: {editingImagePool.name}
            </h3>
            <input
              type="text"
              className="w-full border border-purple-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Enter image pool name *"
              value={newImagePoolName}
              onChange={(e) => setNewImagePoolName(e.target.value)}
              autoFocus
              disabled={updating}
            />
            <textarea
              className="w-full border border-purple-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              placeholder="Enter description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              disabled={updating}
            />
            {/* Category dropdown */}
            <div className="mb-2">
              <label className="block text-sm text-gray-700 mb-1">Category (optional)</label>
              <select
                className="w-full border border-purple-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={updating || categoriesLoading}
              >
                <option value="">Select category</option>
                {availableCategories.map((cat) => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              {categoriesError && (
                <div className="text-red-500 text-xs mt-1">{categoriesError}</div>
              )}
            </div>
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingImagePool(null);
                  setNewImagePoolName("");
                  setDescription("");
                  setCategory("");
                  setError("");
                }}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                onClick={handleUpdateImagePool}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Upload Modal */}
      {showBatchUpload && (
        <div className="absolute inset-0 z-50 bg-gray-900/50">
          <BatchUpload onClose={() => setShowBatchUpload(false)} imagePool={selectedImagePoolForBatch} />
        </div>
      )}
    </div>
  );
};

export default ImageContentPoolTab;