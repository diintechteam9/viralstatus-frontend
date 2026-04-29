import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FaCloudUploadAlt, FaTrash, FaPlay, FaPause,
  FaCheckCircle, FaTimesCircle, FaVideo, FaChevronDown,
} from "react-icons/fa";
import { MdOutlineFileUpload } from "react-icons/md";
import { API_BASE_URL } from "../../config";

const STATUS = {
  PENDING: "pending",
  UPLOADING: "uploading",
  SAVING: "saving",
  DONE: "done",
  ERROR: "error",
};

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const formatDuration = (secs) => {
  if (!secs || isNaN(secs)) return "--:--";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const getToken = () =>
  localStorage.getItem("clienttoken") ||
  sessionStorage.getItem("clienttoken") ||
  localStorage.getItem("admintoken") ||
  sessionStorage.getItem("admintoken") || "";

const getClientId = () => {
  try {
    const d =
      JSON.parse(localStorage.getItem("clientData") || "{}") ||
      JSON.parse(sessionStorage.getItem("clientData") || "{}");
    return d._id || d.id || d.clientId || "";
  } catch {
    return "";
  }
};

export default function MultiVideoUploader() {
  const [videos, setVideos] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  // Pool selection
  const [pools, setPools] = useState([]);
  const [poolsLoading, setPoolsLoading] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [poolDropdownOpen, setPoolDropdownOpen] = useState(false);

  // Global upload state
  const [uploading, setUploading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef(null);
  const videoRefs = useRef({});
  const dropdownRef = useRef(null);
  // Ref to hold live progress values — avoids stale closure in XHR callbacks
  const progressRef = useRef({});

  // ─── Fetch pools ────────────────────────────────────────────────────────────
  const fetchPools = useCallback(async () => {
    setPoolsLoading(true);
    setGlobalError("");
    try {
      const clientId = getClientId();
      if (!clientId) { setGlobalError("Client session not found. Please login again."); return; }
      const res = await fetch(`${API_BASE_URL}/api/pools?clientId=${encodeURIComponent(clientId)}`);
      const data = await res.json();
      if (res.ok) setPools(data.pools || []);
      else setGlobalError(data.error || "Failed to load pools");
    } catch {
      setGlobalError("Failed to load pools");
    } finally {
      setPoolsLoading(false);
    }
  }, []);

  const handleOpenPoolDropdown = () => {
    setPoolDropdownOpen((prev) => {
      if (!prev) fetchPools();
      return !prev;
    });
  };

  const selectedPool = pools.find((p) => p._id === selectedPoolId);

  // ─── File handling ───────────────────────────────────────────────────────────
  const addFiles = useCallback((files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith("video/"));
    if (!valid.length) return;
    setSuccessMsg("");
    setGlobalError("");
    setVideos((prev) => [
      ...prev,
      ...valid.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        status: STATUS.PENDING,
        progress: 0,
        duration: null,
        previewUrl: URL.createObjectURL(file),
        error: null,
      })),
    ]);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeVideo = (id) => {
    setVideos((prev) => {
      const v = prev.find((x) => x.id === id);
      if (v?.previewUrl) URL.revokeObjectURL(v.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
    if (playingId === id) setPlayingId(null);
  };

  const clearAll = () => {
    videos.forEach((v) => { if (v.previewUrl) URL.revokeObjectURL(v.previewUrl); });
    setVideos([]);
    setPlayingId(null);
    setSuccessMsg("");
    setGlobalError("");
  };

  const handleMetadata = (id, e) => {
    const dur = e.target.duration;
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, duration: dur } : v)));
  };

  const togglePlay = (id) => {
    const el = videoRefs.current[id];
    if (!el) return;
    if (playingId === id) { el.pause(); setPlayingId(null); }
    else {
      if (playingId && videoRefs.current[playingId]) videoRefs.current[playingId].pause();
      el.play();
      setPlayingId(id);
    }
  };

  // ─── Core upload logic ───────────────────────────────────────────────────────
  const uploadAll = async () => {
    if (!selectedPoolId) { setGlobalError("Please select a pool first."); return; }
    const pending = videos.filter((v) => v.status === STATUS.PENDING);
    if (!pending.length) return;

    setUploading(true);
    setGlobalError("");
    setSuccessMsg("");

    // Mark all pending as UPLOADING immediately
    setVideos((prev) =>
      prev.map((v) =>
        v.status === STATUS.PENDING ? { ...v, status: STATUS.UPLOADING, progress: 0 } : v
      )
    );

    // Start a polling interval that flushes progressRef into React state every 80ms
    const flushInterval = setInterval(() => {
      const updates = progressRef.current;
      if (Object.keys(updates).length === 0) return;
      setVideos((prev) =>
        prev.map((v) =>
          updates[v.id] !== undefined ? { ...v, progress: updates[v.id] } : v
        )
      );
    }, 80);

    try {
      const token = getToken();
      const filesPayload = pending.map((v) => ({
        name: v.name,
        type: v.file.type || "video/mp4",
        size: v.file.size,
      }));

      // Step 1: Get presigned URLs
      const presignRes = await fetch(
        `${API_BASE_URL}/api/pools/${selectedPoolId}/presigned-urls`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ files: filesPayload }),
        }
      );
      const presignData = await presignRes.json();
      if (!presignRes.ok || !presignData.success)
        throw new Error(presignData.error || "Failed to get upload URLs");

      // Step 2: Upload all files in parallel directly to R2
      const uploadResults = await Promise.all(
        presignData.files.map(({ s3Key, uploadUrl, index }) => {
          const video = pending[index];
          progressRef.current[video.id] = 0;

          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                // Write to ref — no React re-render here, interval handles it
                progressRef.current[video.id] = Math.round((e.loaded / e.total) * 100);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                progressRef.current[video.id] = 100;
                // Mark as SAVING in state
                setVideos((prev) =>
                  prev.map((v) =>
                    v.id === video.id ? { ...v, status: STATUS.SAVING, progress: 100 } : v
                  )
                );
                resolve({
                  s3Key,
                  videoId: video.id,
                  title: video.name.replace(/\.[^/.]+$/, ""),
                });
              } else {
                setVideos((prev) =>
                  prev.map((v) =>
                    v.id === video.id
                      ? { ...v, status: STATUS.ERROR, error: `Upload failed (${xhr.status})` }
                      : v
                  )
                );
                reject(new Error(`Upload failed for ${video.name}`));
              }
            };

            xhr.onerror = () => {
              setVideos((prev) =>
                prev.map((v) =>
                  v.id === video.id
                    ? { ...v, status: STATUS.ERROR, error: "Network error" }
                    : v
                )
              );
              reject(new Error(`Network error for ${video.name}`));
            };

            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("Content-Type", video.file.type || "video/mp4");
            xhr.send(video.file);
          });
        })
      );

      // Step 3: Save metadata to DB
      const saveRes = await fetch(
        `${API_BASE_URL}/api/pools/${selectedPoolId}/save-reels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reels: uploadResults.map(({ s3Key, title }) => ({ s3Key, title })),
          }),
        }
      );
      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success)
        throw new Error(saveData.error || "Failed to save video metadata");

      // Mark all as DONE
      setVideos((prev) =>
        prev.map((v) =>
          uploadResults.find((r) => r.videoId === v.id)
            ? { ...v, status: STATUS.DONE, progress: 100 }
            : v
        )
      );

      setSuccessMsg(
        `✅ ${uploadResults.length} video${
          uploadResults.length > 1 ? "s" : ""
        } uploaded successfully to "${selectedPool?.name}"!`
      );
    } catch (err) {
      setGlobalError(err.message || "Upload failed. Please try again.");
      setVideos((prev) =>
        prev.map((v) =>
          v.status === STATUS.UPLOADING || v.status === STATUS.SAVING
            ? { ...v, status: STATUS.ERROR, error: "Upload interrupted" }
            : v
        )
      );
    } finally {
      clearInterval(flushInterval);
      progressRef.current = {};
      setUploading(false);
    }
  };

  // ─── Derived counts ──────────────────────────────────────────────────────────
  const pendingCount = videos.filter((v) => v.status === STATUS.PENDING).length;
  const doneCount = videos.filter((v) => v.status === STATUS.DONE).length;
  const errorCount = videos.filter((v) => v.status === STATUS.ERROR).length;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FaVideo className="text-orange-500" /> Multi Video Uploader
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload multiple videos directly to Cloudflare R2 — fast parallel upload
        </p>
      </div>

      {/* Pool Selector */}
      <div className="mb-5 relative" ref={dropdownRef}>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Select Pool <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={handleOpenPoolDropdown}
          className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl text-left transition-colors ${
            selectedPoolId
              ? "border-orange-500 bg-orange-50 text-gray-900"
              : "border-gray-300 bg-white text-gray-400 hover:border-orange-400"
          }`}
        >
          <span className="font-medium">
            {selectedPool ? selectedPool.name : "Choose a pool to upload into..."}
          </span>
          <FaChevronDown
            className={`text-gray-400 transition-transform ${poolDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {poolDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {poolsLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500">Loading pools...</div>
            ) : pools.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">No pools found. Create a pool first.</div>
            ) : (
              pools.map((pool) => (
                <button
                  key={pool._id}
                  type="button"
                  onClick={() => { setSelectedPoolId(pool._id); setPoolDropdownOpen(false); setGlobalError(""); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors flex items-center justify-between ${
                    selectedPoolId === pool._id ? "bg-orange-100 font-semibold text-orange-800" : "text-gray-700"
                  }`}
                >
                  <span>{pool.name}</span>
                  <span className="text-xs text-gray-400">{pool.reelCount || 0} reels</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 mb-5 ${
          dragging
            ? "border-orange-500 bg-orange-50 scale-[1.01]"
            : "border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50"
        }`}
      >
        <FaCloudUploadAlt
          className={`text-5xl mb-3 transition-colors ${dragging ? "text-orange-500" : "text-gray-400"}`}
        />
        <p className="text-base font-semibold text-gray-700">
          {dragging ? "Drop videos here" : "Drag & drop videos here"}
        </p>
        <p className="text-sm text-gray-400 mt-1">or click to browse</p>
        <p className="text-xs text-gray-400 mt-2">MP4, MOV, AVI, MKV, WEBM supported</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Messages */}
      {globalError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <FaTimesCircle className="flex-shrink-0" /> {globalError}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
          <FaCheckCircle className="flex-shrink-0" /> {successMsg}
        </div>
      )}

      {/* Action Bar */}
      {videos.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="bg-gray-100 px-3 py-1 rounded-full font-medium text-gray-700">
              {videos.length} video{videos.length !== 1 ? "s" : ""}
            </span>
            {doneCount > 0 && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                {doneCount} uploaded
              </span>
            )}
            {pendingCount > 0 && (
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                {pendingCount} pending
              </span>
            )}
            {errorCount > 0 && (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                {errorCount} failed
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <button
                onClick={uploadAll}
                disabled={uploading || !selectedPoolId}
                className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                <MdOutlineFileUpload size={18} />
                {uploading ? "Uploading..." : `Upload ${pendingCount} Video${pendingCount > 1 ? "s" : ""}`}
              </button>
            )}
            <button
              onClick={clearAll}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
            >
              <FaTrash size={13} /> Clear All
            </button>
          </div>
        </div>
      )}

      {/* Video List */}
      {videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative w-full sm:w-32 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 group">
                <video
                  ref={(el) => { if (el) videoRefs.current[v.id] = el; }}
                  src={v.previewUrl}
                  className="w-full h-full object-cover"
                  onLoadedMetadata={(e) => handleMetadata(v.id, e)}
                  onEnded={() => setPlayingId(null)}
                  muted
                />
                <button
                  onClick={() => togglePlay(v.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {playingId === v.id
                    ? <FaPause className="text-white text-xl" />
                    : <FaPlay className="text-white text-xl" />}
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{v.name}</p>
                  <button
                    onClick={() => removeVideo(v.id)}
                    disabled={uploading && (v.status === STATUS.UPLOADING || v.status === STATUS.SAVING)}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors flex-shrink-0"
                  >
                    <FaTrash size={13} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  <span>{formatSize(v.size)}</span>
                  {v.duration && <span>{formatDuration(v.duration)}</span>}

                  {v.status === STATUS.DONE && (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <FaCheckCircle /> Uploaded
                    </span>
                  )}
                  {v.status === STATUS.ERROR && (
                    <span className="flex items-center gap-1 text-red-500 font-semibold">
                      <FaTimesCircle /> {v.error || "Failed"}
                    </span>
                  )}
                  {v.status === STATUS.SAVING && (
                    <span className="text-blue-500 font-semibold animate-pulse">Saving...</span>
                  )}
                </div>

                {/* Progress Bar */}
                {(v.status === STATUS.UPLOADING ||
                  v.status === STATUS.SAVING ||
                  v.status === STATUS.DONE) && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>
                        {v.status === STATUS.DONE
                          ? "Complete"
                          : v.status === STATUS.SAVING
                          ? "Saving to database..."
                          : "Uploading to R2..."}
                      </span>
                      <span>{v.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-200 ${
                          v.status === STATUS.DONE
                            ? "bg-green-500"
                            : v.status === STATUS.SAVING
                            ? "bg-blue-400 animate-pulse"
                            : "bg-orange-500"
                        }`}
                        style={{ width: `${v.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {videos.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <FaVideo className="text-5xl mx-auto mb-3 opacity-20" />
          <p className="text-sm">No videos selected yet</p>
          <p className="text-xs mt-1">Select a pool above, then drag & drop or click to add videos</p>
        </div>
      )}
    </div>
  );
}
