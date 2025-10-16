import React, { useEffect, useState } from "react";
import {
  FaPlus,
  FaCog,
  FaEdit,
  FaTrash,
  FaFilter,
  FaRegClock,
  FaVideo,
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";
import PoolReels from "./PoolReels";

// This component mirrors the pools list UI/logic from `ContentPoolTab.jsx`
// It shows pools created by the current client/google user with the same UX
const ContentPoolReels = ({ clientId: propClientId, googleId: propGoogleId }) => {
  const [pools, setPools] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPool, setEditingPool] = useState(null);
  const [newPoolName, setNewPoolName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("none");
  const [selectedPool, setSelectedPool] = useState(null);
  const [poolJobVideos, setPoolJobVideos] = useState([]);
  const [loadingPoolVideos, setLoadingPoolVideos] = useState(false);

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
    sessionUser = JSON.parse(
      typeof window !== "undefined" ? sessionStorage.getItem("userData") || "{}" : "{}"
    );
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

  const getUniqueCategories = () => {
    const categories = pools
      .map((pool) => normalizeCategory(pool.category))
      .filter((cat, index, arr) => arr.indexOf(cat) === index);
    return ["All", ...categories];
  };

  const getFilteredPools = () => {
    const byCategory = selectedCategory === "All" ? pools : pools.filter((p) => normalizeCategory(p.category) === selectedCategory);
    const q = (searchQuery || "").trim().toLowerCase();
    const bySearch = q ? byCategory.filter((p) => (p.name || "").toLowerCase().includes(q)) : byCategory;
    if (sortOrder === "none") return bySearch;
    const sorted = [...bySearch].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    return sortOrder === "asc" ? sorted : sorted.reverse();
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "none" ? "asc" : prev === "asc" ? "desc" : "none"));
  };

  const fetchPools = async () => {
    setLoading(true);
    setError("");
    try {
      if (!idQuery) {
        setError("Missing clientId or googleId");
        setPools([]);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/pools?${idQuery}`);
      const data = await res.json();
      if (res.ok) {
        setPools(data.pools || []);
      } else {
        setError(data.error || "Failed to fetch pools");
      }
    } catch (err) {
      setError("Failed to fetch pools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idQuery]);

  const handlePoolClick = (pool) => {
    setSelectedPool(pool);
  };

  const handleBackToPools = () => {
    setSelectedPool(null);
    setPoolJobVideos([]);
  };

  const fetchPoolVideos = async (poolId) => {
    if (!poolId) return;
    setLoadingPoolVideos(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/vts/pool/${encodeURIComponent(poolId)}/videos`);
      const data = await res.json();
      if (res.ok && data.success) {
        const videos = Array.isArray(data.videos) ? data.videos.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)) : [];
        setPoolJobVideos(videos);
      } else {
        setPoolJobVideos([]);
      }
    } catch (_) {
      setPoolJobVideos([]);
    } finally {
      setLoadingPoolVideos(false);
    }
  };

  useEffect(() => {
    if (selectedPool && selectedPool._id) {
      fetchPoolVideos(selectedPool._id);
    }
  }, [selectedPool]);

  const handleCreate = () => {
    setShowModal(true);
    setNewPoolName("");
    setDescription("");
    setCategory("");
    setError("");
  };

  const handleEdit = (pool) => {
    setEditingPool(pool);
    setNewPoolName(pool.name);
    setDescription(pool.description || "");
    setCategory(pool.category || "");
    setShowEditModal(true);
    setError("");
    setShowMenu(null);
  };

  const handleDelete = async (pool) => {
    if (!window.confirm(`Are you sure you want to delete "${pool.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/${pool._id}?${idQuery}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        fetchPools();
        setShowMenu(null);
      } else {
        setError(data.error || "Failed to delete pool");
      }
    } catch (err) {
      setError("Failed to delete pool");
    }
  };

  const handleAddPool = async () => {
    if (!newPoolName.trim()) {
      setError("Pool name is required");
      return;
    }
    setCreating(true);
    setError("");
    const poolData = {
      name: newPoolName.trim(),
      description: description.trim() || undefined,
      category: normalizeCategory(category),
    };
    if (effectiveClientId) poolData.clientId = effectiveClientId;
    else if (effectiveGoogleId) poolData.googleId = effectiveGoogleId;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(poolData),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setNewPoolName("");
        setDescription("");
        setCategory("");
        fetchPools();
      } else {
        if (data.error && data.error.includes("already exists")) {
          setError(data.error);
        } else {
          setError(data.error || data.message || "Failed to create pool");
        }
      }
    } catch (err) {
      setError("Failed to create pool - Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdatePool = async () => {
    if (!newPoolName.trim()) {
      setError("Pool name is required");
      return;
    }
    setUpdating(true);
    setError("");
    const poolData = {
      name: newPoolName.trim(),
      description: description.trim() || "",
      category: category.trim() || "",
    };
    if (effectiveClientId) poolData.clientId = effectiveClientId;
    else if (effectiveGoogleId) poolData.googleId = effectiveGoogleId;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/${editingPool._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(poolData),
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        setEditingPool(null);
        setNewPoolName("");
        setDescription("");
        setCategory("");
        fetchPools();
      } else {
        if (data.error && data.error.includes("already exists")) {
          setError(data.error);
        } else {
          setError(data.error || data.message || "Failed to update pool");
        }
      }
    } catch (err) {
      setError("Failed to update pool - Network error");
    } finally {
      setUpdating(false);
    }
  };

  const filteredPools = getFilteredPools();
  const uniqueCategories = getUniqueCategories();

  // If a pool is selected, show its reels view only
  if (selectedPool) {
    return (
      <div className="w-full h-full min-h-screen bg-white">
        <div className="w-full flex justify-between">
          <button
            className="m-4 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 cursor-pointer"
            onClick={handleBackToPools}
          >
            ← Back to Pools
          </button>
        </div>
        <div className="w-full flex flex-col items-center">
          <PoolReels pool={selectedPool} onReelsUpdated={fetchPools} />
          <div className="w-full max-w-7xl mt-6 px-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Generated Segments (Jobs)</h3>
            {loadingPoolVideos ? (
              <div className="text-gray-500">Loading generated videos...</div>
            ) : poolJobVideos.length === 0 ? (
              <div className="text-gray-400">No generated segments found for this pool.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {poolJobVideos.map((v, idx) => (
                  <div key={`${v.jobId}-${idx}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="aspect-[9/16] w-full bg-black">
                      <video src={v.url} className="w-full h-full object-cover" controls preload="metadata" playsInline />
                    </div>
                    <div className="p-2 text-xs text-gray-500 flex items-center justify-between">
                      <span>Job: {v.jobId}</span>
                      <span>{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl font-semibold text-gray-800">List of Pools</h2>
      </div>

      {loading && <div className="text-gray-500">Loading pools...</div>}
      {error && !showModal && !showEditModal && (
        <div className="text-red-500 bg-red-50 border border-red-200 rounded p-2 mb-2">{error}</div>
      )}

      {pools.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <span className="text-orange-800">Filter</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                  {cat !== "All" && (
                    <span className="ml-1 text-xs opacity-75">
                      ({pools.filter((p) => normalizeCategory(p.category) === cat).length})
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
                sortOrder === "none" ? "border-gray-300 text-gray-700 hover:bg-gray-100" : "border-orange-500 bg-orange-50 text-orange-700"
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
                placeholder="Search pools by name..."
                className="w-full sm:w-72 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 w-full mt-6">
        {filteredPools.length === 0 && !loading && (
          <div className="text-gray-400 text-center py-8">
            {selectedCategory === "All" ? "No pools found." : `No pools found in category "${selectedCategory}".`}
          </div>
        )}
        {filteredPools.map((pool) => (
          <div
            key={pool._id}
            className="bg-white/90 border border-orange-200 rounded-2xl shadow-md p-6 w-full hover:shadow-lg hover:border-orange-400 hover:-translate-y-0.5 transition-all duration-200 group relative"
            onClick={() => handlePoolClick(pool)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-lg font-bold text-orange-800 group-hover:text-black transition truncate">{pool.name}</div>
                <span className="shrink-0 text-xs bg-yellow-50 text-orange-700 px-3 py-1 rounded-full font-semibold border border-orange-200">
                  {normalizeCategory(pool.category)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(showMenu === pool._id ? null : pool._id);
                    }}
                  >
                    <FaCog />
                  </button>
                  {showMenu === pool._id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(pool);
                        }}
                      >
                        <FaEdit className="text-orange-600" />
                        Edit
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(pool);
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
            {pool.description && <div className="text-sm text-gray-600 mb-2">{pool.description}</div>}
            <div className="flex items-center flex-wrap gap-6 mt-3 text-sm text-gray-600 font-medium">
              <div className="inline-flex items-center gap-2">
                <FaVideo className="text-orange-600" />
                <span>
                  Reels: <span className="text-orange-800 font-bold">{pool.reelCount || 0}</span>
                </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <FaRegClock className="text-orange-600" />
                <span>Created {formatDateTime(pool.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Create New Pool</h3>
            <input
              type="text"
              className="w-full border border-orange-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Enter pool name *"
              value={newPoolName}
              onChange={(e) => setNewPoolName(e.target.value)}
              autoFocus
              disabled={creating}
            />
            <textarea
              className="w-full border border-orange-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              placeholder="Enter description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              disabled={creating}
            />
            <input
              type="text"
              className="w-full border border-orange-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Enter category (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={creating}
            />
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
                className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
                onClick={handleAddPool}
                disabled={creating}
              >
                {creating ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingPool && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Edit Pool: {editingPool.name}</h3>
            <input
              type="text"
              className="w-full border border-orange-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Enter pool name *"
              value={newPoolName}
              onChange={(e) => setNewPoolName(e.target.value)}
              autoFocus
              disabled={updating}
            />
            <textarea
              className="w-full border border-orange-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              placeholder="Enter description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              disabled={updating}
            />
            <input
              type="text"
              className="w-full border border-orange-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Enter category (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={updating}
            />
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPool(null);
                  setNewPoolName("");
                  setDescription("");
                  setCategory("");
                  setError("");
                }}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
                onClick={handleUpdatePool}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentPoolReels;


