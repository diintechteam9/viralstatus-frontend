import React, { useState, useEffect } from "react";
import { FaPlus, FaCog, FaEdit, FaTrash, FaFilter, FaRegClock, FaVideo, FaSearch, FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";
import CreateTemplateTab from "./CreateTemplateTab";
import PoolReels from "./PoolReels";
import AlphaButton from "./contentpool/AlphaButton";
import BetaButton from "./contentpool/BetaButton";
import GammaButton from "./contentpool/GammaButton";
import { API_BASE_URL } from "../../config";

const ContentPoolTab = ({ clientId: propClientId, googleId: propGoogleId }) => {
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
  const [selectedPool, setSelectedPool] = useState(null);
  const [showAutomateReelModal, setShowAutomateReelModal] = useState(false);
  const [showAlphaTab, setShowAlphaTab] = useState(false);
  const [showVideoToReelsTab, setShowVideoToReelsTab] = useState(false);
  const [showGammaTab, setShowGammaTab] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [showMenu, setShowMenu] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("none"); // none | asc | desc
  const [availableCategories, setAvailableCategories] = useState([]); // [{ id, name, subcategories: [{id, name}] }]
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");

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

  // Get unique categories from pools
  const getUniqueCategories = () => {
    const categories = pools
      .map((pool) => normalizeCategory(pool.category))
      .filter((category, index, arr) => arr.indexOf(category) === index);
    return ["All", ...categories];
  };

  // Filter pools based on selected category and search query
  const getFilteredPools = () => {
    const byCategory = selectedCategory === "All"
      ? pools
      : pools.filter((pool) => normalizeCategory(pool.category) === selectedCategory);
    const q = (searchQuery || "").trim().toLowerCase();
    const bySearch = q ? byCategory.filter((pool) => (pool.name || "").toLowerCase().includes(q)) : byCategory;
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

  // Fetch pools from backend (scoped to client or google user)
  const fetchPools = async () => {
    setLoading(true);
    setError("");
    try {
      if (!idQuery) {
        setError("Missing clientId or googleId");
        setPools([]);
        return;
      }
      console.log("Fetching pools from:", `${API_BASE_URL}/api/pools?${idQuery}`);
      const res = await fetch(`${API_BASE_URL}/api/pools?${idQuery}`);
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);
      if (res.ok) {
        setPools(data.pools || []);
      } else {
        setError(data.error || "Failed to fetch pools");
      }
    } catch (err) {
      console.error("Error fetching pools:", err);
      setError("Failed to fetch pools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idQuery]);

  const handleCreate = () => {
    setShowModal(true);
    setNewPoolName("");
    setDescription("");
    setCategory("");
    setError("");
    fetchAvailableCategories();
  };

  const handleEdit = (pool) => {
    setEditingPool(pool);
    setNewPoolName(pool.name);
    setDescription(pool.description || "");
    setCategory(pool.category || "");
    setShowEditModal(true);
    setError("");
    setShowMenu(null);
    fetchAvailableCategories();
  };

  const handleDelete = async (pool) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${pool.name}"? This action cannot be undone.`
      )
    ) {
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
      console.error("Error deleting pool:", err);
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

    console.log("Creating pool with data:", poolData);
    console.log("API URL:", `${API_BASE_URL}/api/pools`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/pools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(poolData),
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (res.ok) {
        setShowModal(false);
        setNewPoolName("");
        setDescription("");
        setCategory("");
        fetchPools();
      } else {
        console.error("Server error:", data);

        // Handle specific error cases
        if (data.error && data.error.includes("already exists")) {
          setError(data.error);
          // If there's existing pool info, show it
          if (data.existingPool) {
            setError(
              `${data.error} (Existing pool: ${data.existingPool.name})`
            );
          }
        } else {
          setError(data.error || data.message || "Failed to create pool");
        }
      }
    } catch (err) {
      console.error("Network error:", err);
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
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
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
        console.error("Server error:", data);

        // Handle specific error cases
        if (data.error && data.error.includes("already exists")) {
          setError(data.error);
          if (data.existingPool) {
            setError(
              `${data.error} (Existing pool: ${data.existingPool.name})`
            );
          }
        } else {
          setError(data.error || data.message || "Failed to update pool");
        }
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Failed to update pool - Network error");
    } finally {
      setUpdating(false);
    }
  };

  // Handler to show CreateTemplateTab for a pool
  const handlePoolClick = (pool) => {
    setSelectedPool(pool);
  };

  // Handler to go back to pool list
  const handleBackToPools = () => {
    setSelectedPool(null);
    setShowAutomateReelModal(false);
    setShowAlphaTab(false);
    setShowVideoToReelsTab(false);
    setShowGammaTab(false);
  };

  // If a pool is selected, show CreateTemplateTab and PoolReels
  if (selectedPool) {
    return (
      <div className="w-full h-full min-h-screen bg-white">
        <div className="w-full flex justify-between">
          {/* Back Button */}
          {!showAlphaTab && !showVideoToReelsTab && !showGammaTab && (
            <button
              className="m-4 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 cursor-pointer"
              onClick={handleBackToPools}
            >
              ← Back to Pools
            </button>
          )}

          {/* Main body under selected pool */}
          <div className="relative flex-1">
            {showAlphaTab ? (
              <>
                <div className="flex justify-start p-4">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 cursor-pointer"
                    onClick={() => setShowAlphaTab(false)}
                  >
                    ← Back
                  </button>
                </div>
                <AlphaButton pool={selectedPool} />
              </>
            ) : showVideoToReelsTab ? (
              <>
                <div className="flex justify-start p-4">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 cursor-pointer"
                    onClick={() => setShowVideoToReelsTab(false)}
                  >
                    ← Back
                  </button>
                </div>
                <BetaButton pool={selectedPool} onBack={() => setShowVideoToReelsTab(false)} />
              </>
            ) : showGammaTab ? (
              <>
                <div className="flex justify-start p-4">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 cursor-pointer"
                    onClick={() => setShowGammaTab(false)}
                  >
                    ← Back
                  </button>
                </div>
                <GammaButton pool={selectedPool} onBack={() => setShowGammaTab(false)} />
              </>
            ) : (
              <>
                {showAutomateReelModal && (
                  <CreateTemplateTab
                    pool={selectedPool}
                    onClose={() => setShowAutomateReelModal(false)}
                    onReelsUpdated={fetchPools}
                  />
                )}
              </>
            )}
            {!showAlphaTab && !showVideoToReelsTab && !showGammaTab && (
            <div className="absolute top-4 right-4 hidden sm:block">
              <div className="relative inline-flex items-center space-x-2">
                <button
                  className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow hover:bg-indigo-700 transition-colors duration-200 font-semibold text-lg z-10 pointer-events-auto"
                  onClick={() => setShowAlphaTab(true)}
                  title="Alpha"
                >
                  Alpha
                </button>
                <button
                  className="bg-pink-600 text-white px-6 py-3 rounded-full shadow hover:bg-pink-700 transition-colors duration-200 font-semibold text-lg z-0 pointer-events-auto"
                  onClick={() => setShowVideoToReelsTab(true)}
                  title="Beta"
                >
                  Beta
                </button>
                <button
                  className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow hover:bg-emerald-700 transition-colors duration-200 font-semibold text-lg z-0 pointer-events-auto"
                  onClick={() => setShowGammaTab(true)}
                  title="Gamma"
                >
                  Gamma
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
        {/* Pool Reels Grid (hidden when Alpha tab is open) */}
        {!showAlphaTab && !showVideoToReelsTab && !showGammaTab && (
          <div className="w-full flex flex-col items-center">
            <PoolReels
              pool={selectedPool}
              onReelsUpdated={() => {
                // Refresh pools list to update reel counts
                fetchPools();
              }}
            />
          </div>
        )}
      </div>
    );
  }

  const filteredPools = getFilteredPools();
  const uniqueCategories = getUniqueCategories();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl font-semibold text-gray-800">List of Pools</h2>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm text-sm sm:text-base w-full sm:w-auto justify-center mt-2 sm:mt-0"
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
      {loading && <div className="text-gray-500">Loading pools...</div>}
      {error && !showModal && !showEditModal && (
        <div className="text-red-500 bg-red-50 border border-red-200 rounded p-2 mb-2">
          {error}
        </div>
      )}

      {/* Category Filter Bar */}
      {pools.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <span className="text-orange-800">Filter</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueCategories.map((category) => (
                <button
                  key={category}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-orange-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                  {category !== "All" && (
                    <span className="ml-1 text-xs opacity-75">
                      ({pools.filter((pool) => normalizeCategory(pool.category) === category).length})
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

      {/* Pool Cards */}
      <div className="flex flex-col gap-6 w-full mt-6">
        {filteredPools.length === 0 && !loading && (
          <div className="text-gray-400 text-center py-8">
            {selectedCategory === "All"
              ? "No pools found."
              : `No pools found in category "${selectedCategory}".`}
          </div>
        )}
        {filteredPools.map((pool) => (
          <div
            key={pool._id}
            className="bg-white/90 border border-orange-200 rounded-2xl shadow-md p-6 w-full hover:shadow-lg hover:border-orange-400 hover:-translate-y-0.5 transition-all duration-200 group relative cursor-pointer"
            onClick={() => {
              handlePoolClick(pool), setShowAutomateReelModal(true);
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-lg font-bold text-orange-800 group-hover:text-black transition truncate">
                  {pool.name}
                </div>
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
            {pool.description && (
              <div className="text-sm text-gray-600 mb-2">
                {pool.description}
              </div>
            )}
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

      {/* Modal for new pool */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Create New Pool
            </h3>
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
            {/* Category dropdown */}
            <div className="mb-2">
              <label className="block text-sm text-gray-700 mb-1">Category (optional)</label>
              <select
                className="w-full border border-orange-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
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

      {/* Modal for editing pool */}
      {showEditModal && editingPool && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Edit Pool: {editingPool.name}
            </h3>
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
            {/* Category dropdown */}
            <div className="mb-2">
              <label className="block text-sm text-gray-700 mb-1">Category (optional)</label>
              <select
                className="w-full border border-orange-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
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

export default ContentPoolTab;