import React, { useEffect, useState, useRef } from "react";
import {
  FaTrash,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaPlay,
  FaPause,
  FaVideo,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const PoolReels = ({
  pool,
  onReelsUpdated,
  onSelectedReelsChange,
  hideDelete,
}) => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedReels, setSelectedReels] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [selectAllClicked, setSelectAllClicked] = useState(false);
  const [playingVideos, setPlayingVideos] = useState(new Set());
  const [uploadProgress, setUploadProgress] = useState([]); // [{name, progress, done, error}]

  const fetchReels = async () => {
    if (!pool || !pool._id) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pools/${pool._id}/reels`
      );
      const data = await response.json();
      const sorted = (data.reels || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setReels(sorted);
    } catch (err) {
      setError("Failed to fetch reels");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchReels();
  }, [pool]);

  useEffect(() => {
    if (onSelectedReelsChange) {
      onSelectedReelsChange(Array.from(selectedReels));
    }
    // eslint-disable-next-line
  }, [selectedReels]);

  const handleSelectReel = (reelId) => {
    const newSelected = new Set(selectedReels);
    if (newSelected.has(reelId)) {
      newSelected.delete(reelId);
    } else {
      newSelected.add(reelId);
    }
    setSelectedReels(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedReels.size === reels.length) {
      setSelectedReels(new Set());
      setSelectAllClicked(false);
    } else {
      setSelectedReels(new Set(reels.map((reel) => reel._id)));
      setSelectAllClicked(true);
    }
  };

  const handleDeleteSingle = (reelId) => {
    setDeleteType("single");
    setSelectedReels(new Set([reelId]));
    setShowDeleteConfirm(true);
  };

  const handleDeleteMultiple = () => {
    if (selectedReels.size === 0) return;
    setDeleteType("multiple");
    setShowDeleteConfirm(true);
  };

  const handleDeleteAll = () => {
    if (!selectAllClicked) return;
    setDeleteType("all");
    setShowDeleteConfirm(true);
  };

  const handleVideoPlay = (reelId) => {
    setPlayingVideos((prev) => new Set([...prev, reelId]));
  };

  const handleVideoPause = (reelId) => {
    setPlayingVideos((prev) => {
      const newSet = new Set(prev);
      newSet.delete(reelId);
      return newSet;
    });
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      let response;

      if (deleteType === "single") {
        const reelId = Array.from(selectedReels)[0];
        response = await fetch(`${API_BASE_URL}/api/pools/reels/${reelId}`, {
          method: "DELETE",
        });
      } else if (deleteType === "multiple") {
        response = await fetch(`${API_BASE_URL}/api/pools/reels`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reelIds: Array.from(selectedReels),
          }),
        });
      } else if (deleteType === "all") {
        response = await fetch(`${API_BASE_URL}/api/pools/${pool._id}/reels`, {
          method: "DELETE",
        });
      }

      if (!response.ok) {
        throw new Error("Failed to delete reels");
      }

      const result = await response.json();
      console.log("Delete result:", result);

      // Refresh reels list
      await fetchReels();

      // Clear selections
      setSelectedReels(new Set());
      setSelectAllClicked(false);

      // Notify parent component if callback provided
      if (onReelsUpdated) {
        onReelsUpdated();
      }
    } catch (err) {
      setError(`Failed to delete reels: ${err.message}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteType("");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading reels...</span>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <div className="text-red-600 font-medium">Error</div>
          <div className="text-red-500 text-sm mt-1">{error}</div>
        </div>
      </div>
    );

  const getDeleteMessage = () => {
    if (deleteType === "single") {
      return "Are you sure you want to delete this reel?";
    } else if (deleteType === "multiple") {
      return `Are you sure you want to delete ${selectedReels.size} selected reels?`;
    } else if (deleteType === "all") {
      return `Are you sure you want to delete all ${reels.length} reels from this pool?`;
    }
    return "";
  };

  // Check if all reels are selected (for hiding "Delete Selected" when "Select All" is active)
  const allReelsSelected =
    selectedReels.size === reels.length && reels.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto ">
      {pool && pool.name && (
        <div className="w-full max-w-7xl mx-auto mb-4 p-5">
          <div className="flex flex-col items-start">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {pool.name} 
            </h2>
            <div className="w-full border-b border-gray-200 mt-2 mb-2"></div>
          </div>
          <div className="flex justify-end">
            <label className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 transition-colors shadow-lg disabled:opacity-60 focus:ring-2 focus:ring-blue-400 cursor-pointer">
              Upload Reels
              <input
                type="file"
                className="hidden"
                multiple
                accept="video/*"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length || !pool?._id) return;

                  // Initialize progress for each file
                  setUploadProgress(files.map(f => ({ name: f.name, progress: 0, done: false, error: null })));

                  const uploads = files.map((file, idx) =>
                    new Promise((resolve) => {
                      const formData = new FormData();
                      formData.append("reel", file);

                      const xhr = new XMLHttpRequest();
                      xhr.open("POST", `${API_BASE_URL}/api/pools/${pool._id}/upload`);

                      xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                          const pct = Math.round((event.loaded / event.total) * 100);
                          setUploadProgress(prev => prev.map((p, i) => i === idx ? { ...p, progress: pct } : p));
                        }
                      };

                      xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                          setUploadProgress(prev => prev.map((p, i) => i === idx ? { ...p, progress: 100, done: true } : p));
                          resolve({ ok: true });
                        } else {
                          setUploadProgress(prev => prev.map((p, i) => i === idx ? { ...p, error: `Failed (${xhr.status})` } : p));
                          resolve({ ok: false });
                        }
                      };

                      xhr.onerror = () => {
                        setUploadProgress(prev => prev.map((p, i) => i === idx ? { ...p, error: "Network error" } : p));
                        resolve({ ok: false });
                      };

                      xhr.send(formData);
                    })
                  );

                  await Promise.all(uploads);
                  await fetchReels();
                  if (onReelsUpdated) onReelsUpdated();
                  setTimeout(() => setUploadProgress([]), 2000);
                  try { e.target.value = ""; } catch(_) {}
                }}
              />
            </label>
          </div>

          {/* Upload Progress Bars */}
          {uploadProgress.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadProgress.map((f, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 truncate max-w-[70%]">{f.name}</span>
                    <span className={`text-xs font-semibold ${
                      f.error ? "text-red-500" : f.done ? "text-green-600" : "text-blue-600"
                    }`}>
                      {f.error ? f.error : f.done ? "✓ Done" : `${f.progress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-200 ${
                        f.error ? "bg-red-500" : f.done ? "bg-green-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${f.error ? 100 : f.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reels Grid */}
      {reels && reels.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {reels.map((reel, index) => (
            <div
              key={reel._id}
              className={`group relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
                selectedReels.has(reel._id)
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Selection checkbox - always visible for selection */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={selectedReels.has(reel._id)}
                  onChange={() => handleSelectReel(reel._id)}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>

              {/* Delete button - shown on hover */}
              {!hideDelete && (
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleDeleteSingle(reel._id)}
                    disabled={deleting}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 transition-colors duration-200 shadow-sm"
                    title="Delete this reel"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              )}

              {/* Video Container with Enhanced Controls */}
              <div className="aspect-[9/16] w-full bg-gray-900 rounded-t-xl overflow-hidden relative flex items-center justify-center">
                {reel.s3Url ? (
                  <video
                    src={reel.s3Url}
                    controls
                    className="w-full h-full object-cover"
                    onPlay={() => handleVideoPlay(reel._id)}
                    onPause={() => handleVideoPause(reel._id)}
                    onEnded={() => handleVideoPause(reel._id)}
                    style={{ background: "#222" }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <FaVideo className="text-4xl mb-2" />
                    <div className="text-xs">No video available</div>
                  </div>
                )}
              </div>

              {/* Reel Info */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-medium">
                    Reel #{index + 1}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(
                      reel.createdAt || Date.now()
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 p-8 max-w-md mx-auto">
            <div className="text-gray-400 text-4xl mb-4">📹</div>
            <div className="text-gray-600 font-medium mb-2">No reels found</div>
            <div className="text-gray-500 text-sm">
              This pool doesn't have any reels yet.
            </div>
          </div>
        </div>
      )}

      {!hideDelete && selectedReels.size > 0 && (
        <div className="mt-4 flex items-center justify-between bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedReels.size === reels.length && reels.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({selectedReels.size}/{reels.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedReels.size > 0 && selectedReels.size !== reels.length && (
              <button
                onClick={handleDeleteMultiple}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                <FaTrash className="mr-2 text-sm" />
                Delete Selected ({selectedReels.size})
              </button>
            )}
            <button
              onClick={handleDeleteAll}
              disabled={deleting || !(selectedReels.size === reels.length && reels.length > 0)}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedReels.size === reels.length && reels.length > 0
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <FaTrash className="mr-2 text-sm" />
              Delete All ({reels.length})
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && !hideDelete && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="text-red-500 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Delete
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">{getDeleteMessage()}</p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors duration-200 flex items-center"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="mr-2" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolReels;
