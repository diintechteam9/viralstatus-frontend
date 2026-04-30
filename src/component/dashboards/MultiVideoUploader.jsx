import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FaCloudUploadAlt,
  FaTrash,
  FaPlay,
  FaPause,
  FaCheckCircle,
  FaTimesCircle,
  FaVideo,
  FaChevronDown,
  FaLayerGroup,
} from "react-icons/fa";
import { MdOutlineFileUpload, MdOutlineQueuePlayNext } from "react-icons/md";
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
  sessionStorage.getItem("admintoken") ||
  "";

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

const extractDriveFileId = (url) => {
  if (!url) return null;
  const trimmed = url.trim();
  const fromFilePath = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fromFilePath?.[1]) return fromFilePath[1];
  const fromUc = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fromUc?.[1]) return fromUc[1];
  return null;
};

const driveFileDownloadUrl = (fileId) =>
  `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;

const extractDriveFolderId = (url) => {
  if (!url) return null;
  const trimmed = url.trim();
  const fromFoldersPath = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (fromFoldersPath?.[1]) return fromFoldersPath[1];
  const fromIdQuery = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fromIdQuery?.[1]) return fromIdQuery[1];
  return null;
};

function PoolSelector({
  pools,
  poolsLoading,
  selectedPoolId,
  setSelectedPoolId,
  fetchPools,
  errorSetter,
}) {
  const [poolDropdownOpen, setPoolDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedPool = pools.find((p) => p._id === selectedPoolId);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPoolDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleOpenPoolDropdown = () => {
    setPoolDropdownOpen((prev) => {
      if (!prev) fetchPools();
      return !prev;
    });
  };

  return (
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
                onClick={() => {
                  setSelectedPoolId(pool._id);
                  setPoolDropdownOpen(false);
                  errorSetter("");
                }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors flex items-center justify-between ${
                  selectedPoolId === pool._id
                    ? "bg-orange-100 font-semibold text-orange-800"
                    : "text-gray-700"
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
  );
}

export default function MultiVideoUploader() {
  const [activeTab, setActiveTab] = useState("multi");

  const [pools, setPools] = useState([]);
  const [poolsLoading, setPoolsLoading] = useState(false);

  const [multiVideos, setMultiVideos] = useState([]);
  const [multiDragging, setMultiDragging] = useState(false);
  const [multiPlayingId, setMultiPlayingId] = useState(null);
  const [multiSelectedPoolId, setMultiSelectedPoolId] = useState("");
  const [multiUploading, setMultiUploading] = useState(false);
  const [multiGlobalError, setMultiGlobalError] = useState("");
  const [multiSuccessMsg, setMultiSuccessMsg] = useState("");
  const multiFileInputRef = useRef(null);
  const multiVideoRefs = useRef({});
  const multiProgressRef = useRef({});

  const [singleSelectedPoolId, setSingleSelectedPoolId] = useState("");
  const [singleTitle, setSingleTitle] = useState("");
  const [singleDescription, setSingleDescription] = useState("");
  const [singleItem, setSingleItem] = useState(null);
  const [singleDragging, setSingleDragging] = useState(false);
  const [singlePlaying, setSinglePlaying] = useState(false);
  const [singleUploading, setSingleUploading] = useState(false);
  const [singleError, setSingleError] = useState("");
  const [singleSuccess, setSingleSuccess] = useState("");
  const singleFileInputRef = useRef(null);
  const singleVideoRef = useRef(null);
  const singleProgressRef = useRef({});

  const [queueSelectedPoolId, setQueueSelectedPoolId] = useState("");
  const [queueItems, setQueueItems] = useState([]);
  const [queueDragging, setQueueDragging] = useState(false);
  const [queuePlayingId, setQueuePlayingId] = useState(null);
  const [queueUploading, setQueueUploading] = useState(false);
  const [queueError, setQueueError] = useState("");
  const [queueSuccess, setQueueSuccess] = useState("");
  const [queueDriveLinks, setQueueDriveLinks] = useState("");
  const [queueDriveLoading, setQueueDriveLoading] = useState(false);
  const [driveFolderLink, setDriveFolderLink] = useState("");
  const [driveAccessToken, setDriveAccessToken] = useState("");
  const [poolReels, setPoolReels] = useState([]);
  const [poolReelsLoading, setPoolReelsLoading] = useState(false);
  const [selectedPoolReelIds, setSelectedPoolReelIds] = useState([]);
  const [driveExporting, setDriveExporting] = useState(false);
  const [driveExportError, setDriveExportError] = useState("");
  const [driveExportSuccess, setDriveExportSuccess] = useState("");
  const [driveExportStatusByReel, setDriveExportStatusByReel] = useState({});
  const queueFileInputRef = useRef(null);
  const queueVideoRefs = useRef({});
  const queueProgressRef = useRef({});

  const fetchPools = useCallback(async () => {
    setPoolsLoading(true);
    try {
      const clientId = getClientId();
      if (!clientId) return;
      const res = await fetch(`${API_BASE_URL}/api/pools?clientId=${encodeURIComponent(clientId)}`);
      const data = await res.json();
      if (res.ok) setPools(data.pools || []);
    } finally {
      setPoolsLoading(false);
    }
  }, []);

  const uploadBatch = useCallback(async ({ selectedPoolId, list, updateItem, progressRef, errorMessage }) => {
    const token = getToken();
    const filesPayload = list.map((v) => ({
      name: v.name,
      type: v.file.type || "video/mp4",
      size: v.file.size,
    }));

    const presignRes = await fetch(`${API_BASE_URL}/api/pools/${selectedPoolId}/presigned-urls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ files: filesPayload }),
    });
    const presignData = await presignRes.json();
    if (!presignRes.ok || !presignData.success) {
      throw new Error(presignData.error || "Failed to get upload URLs");
    }

    const uploadResults = await Promise.all(
      presignData.files.map(({ s3Key, uploadUrl, index }) => {
        const video = list[index];
        progressRef.current[video.id] = 0;

        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              progressRef.current[video.id] = Math.round((e.loaded / e.total) * 100);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              progressRef.current[video.id] = 100;
              updateItem(video.id, { status: STATUS.SAVING, progress: 100 });
              resolve({
                s3Key,
                videoId: video.id,
                title: video.title || video.name.replace(/\.[^/.]+$/, ""),
                description: video.description || "",
              });
            } else {
              updateItem(video.id, {
                status: STATUS.ERROR,
                error: `Upload failed (${xhr.status})`,
              });
              reject(new Error(errorMessage || `Upload failed for ${video.name}`));
            }
          };

          xhr.onerror = () => {
            updateItem(video.id, { status: STATUS.ERROR, error: "Network error" });
            reject(new Error(errorMessage || `Network error for ${video.name}`));
          };

          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", video.file.type || "video/mp4");
          xhr.send(video.file);
        });
      })
    );

    const saveRes = await fetch(`${API_BASE_URL}/api/pools/${selectedPoolId}/save-reels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reels: uploadResults.map(({ s3Key, title, description }) => ({ s3Key, title, description })),
      }),
    });
    const saveData = await saveRes.json();
    if (!saveRes.ok || !saveData.success) {
      throw new Error(saveData.error || "Failed to save video metadata");
    }

    return uploadResults;
  }, []);

  const multiSelectedPool = pools.find((p) => p._id === multiSelectedPoolId);
  const multiAddFiles = useCallback((files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith("video/"));
    if (!valid.length) return;
    setMultiSuccessMsg("");
    setMultiGlobalError("");
    setMultiVideos((prev) => [
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

  const multiHandleDrop = (e) => {
    e.preventDefault();
    setMultiDragging(false);
    multiAddFiles(e.dataTransfer.files);
  };

  const multiRemoveVideo = (id) => {
    setMultiVideos((prev) => {
      const v = prev.find((x) => x.id === id);
      if (v?.previewUrl) URL.revokeObjectURL(v.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
    if (multiPlayingId === id) setMultiPlayingId(null);
  };

  const multiClearAll = () => {
    multiVideos.forEach((v) => {
      if (v.previewUrl) URL.revokeObjectURL(v.previewUrl);
    });
    setMultiVideos([]);
    setMultiPlayingId(null);
    setMultiSuccessMsg("");
    setMultiGlobalError("");
  };

  const multiHandleMetadata = (id, e) => {
    const dur = e.target.duration;
    setMultiVideos((prev) => prev.map((v) => (v.id === id ? { ...v, duration: dur } : v)));
  };

  const multiTogglePlay = (id) => {
    const el = multiVideoRefs.current[id];
    if (!el) return;
    if (multiPlayingId === id) {
      el.pause();
      setMultiPlayingId(null);
    } else {
      if (multiPlayingId && multiVideoRefs.current[multiPlayingId]) {
        multiVideoRefs.current[multiPlayingId].pause();
      }
      el.play();
      setMultiPlayingId(id);
    }
  };

  const multiUpdateItem = useCallback((id, patch) => {
    setMultiVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }, []);

  const multiUploadAll = async () => {
    if (!multiSelectedPoolId) {
      setMultiGlobalError("Please select a pool first.");
      return;
    }
    const pending = multiVideos.filter((v) => v.status === STATUS.PENDING);
    if (!pending.length) return;

    setMultiUploading(true);
    setMultiGlobalError("");
    setMultiSuccessMsg("");
    setMultiVideos((prev) =>
      prev.map((v) =>
        v.status === STATUS.PENDING ? { ...v, status: STATUS.UPLOADING, progress: 0 } : v
      )
    );

    const flushInterval = setInterval(() => {
      const updates = multiProgressRef.current;
      if (Object.keys(updates).length === 0) return;
      setMultiVideos((prev) =>
        prev.map((v) => (updates[v.id] !== undefined ? { ...v, progress: updates[v.id] } : v))
      );
    }, 80);

    try {
      const uploadResults = await uploadBatch({
        selectedPoolId: multiSelectedPoolId,
        list: pending,
        updateItem: multiUpdateItem,
        progressRef: multiProgressRef,
      });
      setMultiVideos((prev) =>
        prev.map((v) =>
          uploadResults.find((r) => r.videoId === v.id) ? { ...v, status: STATUS.DONE, progress: 100 } : v
        )
      );
      setMultiSuccessMsg(
        `✅ ${uploadResults.length} video${uploadResults.length > 1 ? "s" : ""} uploaded successfully to "${multiSelectedPool?.name}"!`
      );
    } catch (err) {
      setMultiGlobalError(err.message || "Upload failed. Please try again.");
      setMultiVideos((prev) =>
        prev.map((v) =>
          v.status === STATUS.UPLOADING || v.status === STATUS.SAVING
            ? { ...v, status: STATUS.ERROR, error: "Upload interrupted" }
            : v
        )
      );
    } finally {
      clearInterval(flushInterval);
      multiProgressRef.current = {};
      setMultiUploading(false);
    }
  };

  const multiPendingCount = multiVideos.filter((v) => v.status === STATUS.PENDING).length;
  const multiDoneCount = multiVideos.filter((v) => v.status === STATUS.DONE).length;
  const multiErrorCount = multiVideos.filter((v) => v.status === STATUS.ERROR).length;

  const singleSelectedPool = pools.find((p) => p._id === singleSelectedPoolId);
  const singleSelectFile = (file) => {
    if (!file || !file.type.startsWith("video/")) return;
    if (singleItem?.previewUrl) URL.revokeObjectURL(singleItem.previewUrl);
    setSingleItem({
      id: `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      title: singleTitle || file.name.replace(/\.[^/.]+$/, ""),
      description: singleDescription,
      status: STATUS.PENDING,
      progress: 0,
      duration: null,
      previewUrl: URL.createObjectURL(file),
      error: null,
    });
    setSingleSuccess("");
    setSingleError("");
    setSinglePlaying(false);
  };

  const singleUpdateItem = useCallback((id, patch) => {
    setSingleItem((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }, []);

  const singleUpload = async () => {
    if (!singleSelectedPoolId) {
      setSingleError("Please select a pool first.");
      return;
    }
    if (!singleTitle.trim()) {
      setSingleError("Title is required.");
      return;
    }
    if (!singleItem) {
      setSingleError("Please choose a video.");
      return;
    }

    setSingleUploading(true);
    setSingleError("");
    setSingleSuccess("");
    setSingleItem((prev) =>
      prev
        ? {
            ...prev,
            title: singleTitle.trim(),
            description: singleDescription.trim(),
            status: STATUS.UPLOADING,
            progress: 0,
            error: null,
          }
        : prev
    );

    const flushInterval = setInterval(() => {
      const updates = singleProgressRef.current;
      if (Object.keys(updates).length === 0) return;
      setSingleItem((prev) =>
        prev && updates[prev.id] !== undefined ? { ...prev, progress: updates[prev.id] } : prev
      );
    }, 80);

    try {
      const itemForUpload = {
        ...singleItem,
        title: singleTitle.trim(),
        description: singleDescription.trim(),
      };
      const uploadResults = await uploadBatch({
        selectedPoolId: singleSelectedPoolId,
        list: [itemForUpload],
        updateItem: singleUpdateItem,
        progressRef: singleProgressRef,
      });
      const doneId = uploadResults[0].videoId;
      setSingleItem((prev) => (prev && prev.id === doneId ? { ...prev, status: STATUS.DONE, progress: 100 } : prev));
      setSingleSuccess(`✅ "${singleTitle.trim()}" uploaded successfully to "${singleSelectedPool?.name}"`);
    } catch (err) {
      setSingleError(err.message || "Upload failed. Please try again.");
      setSingleItem((prev) =>
        prev && (prev.status === STATUS.UPLOADING || prev.status === STATUS.SAVING)
          ? { ...prev, status: STATUS.ERROR, error: "Upload interrupted" }
          : prev
      );
    } finally {
      clearInterval(flushInterval);
      singleProgressRef.current = {};
      setSingleUploading(false);
    }
  };

  const queueSelectedPool = pools.find((p) => p._id === queueSelectedPoolId);
  const queueAddFiles = useCallback((files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith("video/"));
    if (!valid.length) return;
    setQueueError("");
    setQueueSuccess("");
    setQueueItems((prev) => [
      ...prev,
      ...valid.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: "",
        status: STATUS.PENDING,
        progress: 0,
        duration: null,
        previewUrl: URL.createObjectURL(file),
        error: null,
      })),
    ]);
  }, []);

  const queueImportFromDrive = async () => {
    const rawLinks = queueDriveLinks
      .split(/\n|,/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (!rawLinks.length) {
      setQueueError("Google Drive link dalo.");
      return;
    }
    setQueueDriveLoading(true);
    setQueueError("");
    setQueueSuccess("");
    try {
      const fetchedFiles = [];
      for (const link of rawLinks) {
        const fileId = extractDriveFileId(link);
        if (!fileId) {
          throw new Error(`Invalid Google Drive file link: ${link}`);
        }
        const res = await fetch(driveFileDownloadUrl(fileId));
        if (!res.ok) {
          throw new Error(`Drive file download failed (${res.status}) for ${link}`);
        }
        const blob = await res.blob();
        const type = blob.type || "video/mp4";
        if (!type.startsWith("video/")) {
          throw new Error(`Non-video file detected for ${link}`);
        }
        const fileNameFromDisposition = res.headers
          .get("content-disposition")
          ?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i)?.[1];
        const fileName = decodeURIComponent(
          (fileNameFromDisposition || `drive-video-${fileId}.mp4`).replace(/"/g, "")
        );
        fetchedFiles.push(new File([blob], fileName, { type }));
      }
      queueAddFiles(fetchedFiles);
      setQueueSuccess(
        `✅ ${fetchedFiles.length} video${fetchedFiles.length > 1 ? "s" : ""} Google Drive se add ho gaye.`
      );
      setQueueDriveLinks("");
    } catch (err) {
      setQueueError(
        err.message ||
          "Google Drive import failed. Public file link use karo (folder link direct supported nahi hai)."
      );
    } finally {
      setQueueDriveLoading(false);
    }
  };

  const queueUpdateItem = useCallback((id, patch) => {
    setQueueItems((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }, []);

  const loadPoolReelsForDrive = async () => {
    if (!queueSelectedPoolId) {
      setDriveExportError("Pool select karo.");
      return;
    }
    setPoolReelsLoading(true);
    setDriveExportError("");
    setDriveExportSuccess("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/${queueSelectedPoolId}/reels`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Pool videos load nahi hue.");
      }
      setPoolReels(data.reels || []);
      setSelectedPoolReelIds([]);
    } catch (err) {
      setPoolReels([]);
      setDriveExportError(err.message || "Pool videos load failed");
    } finally {
      setPoolReelsLoading(false);
    }
  };

  const togglePoolReelSelection = (reelId) => {
    setSelectedPoolReelIds((prev) =>
      prev.includes(reelId) ? prev.filter((id) => id !== reelId) : [...prev, reelId]
    );
  };

  const uploadBlobToDrive = async ({ accessToken, folderId, fileName, contentType, blob }) => {
    const metadata = {
      name: fileName,
      ...(folderId ? { parents: [folderId] } : {}),
    };
    const boundary = "----yovoai-drive-boundary-" + Math.random().toString(36).slice(2);
    const delimiter = `--${boundary}\r\n`;
    const closeDelimiter = `--${boundary}--`;
    const body = new Blob([
      delimiter,
      "Content-Type: application/json; charset=UTF-8\r\n\r\n",
      JSON.stringify(metadata),
      "\r\n",
      delimiter,
      `Content-Type: ${contentType || "application/octet-stream"}\r\n\r\n`,
      blob,
      "\r\n",
      closeDelimiter,
    ]);
    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || `Drive upload failed (${res.status})`);
    }
    return data;
  };

  const startDriveExport = async () => {
    const folderId = extractDriveFolderId(driveFolderLink);
    if (!folderId) {
      setDriveExportError("Valid Google Drive folder link dalo.");
      return;
    }
    if (!driveAccessToken.trim()) {
      setDriveExportError("Google Drive access token required.");
      return;
    }
    const selected = poolReels.filter((r) => selectedPoolReelIds.includes(r._id));
    if (!selected.length) {
      setDriveExportError("Kam se kam 1 video select karo.");
      return;
    }
    setDriveExporting(true);
    setDriveExportError("");
    setDriveExportSuccess("");
    const statusMap = {};
    selected.forEach((r) => {
      statusMap[r._id] = { status: "uploading", message: "Preparing..." };
    });
    setDriveExportStatusByReel(statusMap);
    let successCount = 0;
    for (const reel of selected) {
      try {
        setDriveExportStatusByReel((prev) => ({
          ...prev,
          [reel._id]: { status: "uploading", message: "Downloading reel..." },
        }));
        const sourceRes = await fetch(reel.s3Url);
        if (!sourceRes.ok) {
          throw new Error(`Reel fetch failed (${sourceRes.status})`);
        }
        const blob = await sourceRes.blob();
        const fileName =
          reel.title?.trim() ||
          reel.s3Key?.split("/").pop() ||
          `reel-${reel._id}.mp4`;
        setDriveExportStatusByReel((prev) => ({
          ...prev,
          [reel._id]: { status: "uploading", message: "Uploading to Drive..." },
        }));
        await uploadBlobToDrive({
          accessToken: driveAccessToken.trim(),
          folderId,
          fileName,
          contentType: blob.type || "video/mp4",
          blob,
        });
        successCount += 1;
        setDriveExportStatusByReel((prev) => ({
          ...prev,
          [reel._id]: { status: "done", message: "Uploaded" },
        }));
      } catch (err) {
        setDriveExportStatusByReel((prev) => ({
          ...prev,
          [reel._id]: { status: "error", message: err.message || "Failed" },
        }));
      }
    }
    setDriveExporting(false);
    if (successCount === selected.length) {
      setDriveExportSuccess(
        `✅ ${successCount} selected video${successCount > 1 ? "s" : ""} Google Drive me upload ho gaye.`
      );
    } else {
      setDriveExportError(
        `${successCount}/${selected.length} upload hue. Failed items ko check karo.`
      );
    }
  };

  const queueRetryOne = async (id) => {
    if (!queueSelectedPoolId) {
      setQueueError("Please select a pool first.");
      return;
    }
    const target = queueItems.find((x) => x.id === id);
    if (!target) return;
    setQueueError("");
    queueUpdateItem(id, { status: STATUS.UPLOADING, progress: 0, error: null });
    setQueueUploading(true);
    const flushInterval = setInterval(() => {
      const updates = queueProgressRef.current;
      if (Object.keys(updates).length === 0) return;
      setQueueItems((prev) =>
        prev.map((v) => (updates[v.id] !== undefined ? { ...v, progress: updates[v.id] } : v))
      );
    }, 80);

    try {
      const uploadResults = await uploadBatch({
        selectedPoolId: queueSelectedPoolId,
        list: [target],
        updateItem: queueUpdateItem,
        progressRef: queueProgressRef,
      });
      const doneId = uploadResults[0].videoId;
      queueUpdateItem(doneId, { status: STATUS.DONE, progress: 100, error: null });
      setQueueSuccess(`✅ Retried "${target.name}" successfully.`);
    } catch (err) {
      queueUpdateItem(id, { status: STATUS.ERROR, error: err.message || "Retry failed" });
      setQueueError(err.message || "Retry failed");
    } finally {
      clearInterval(flushInterval);
      queueProgressRef.current = {};
      setQueueUploading(false);
    }
  };

  const queueStart = async () => {
    if (!queueSelectedPoolId) {
      setQueueError("Please select a pool first.");
      return;
    }
    const pending = queueItems.filter((v) => v.status === STATUS.PENDING);
    if (!pending.length) return;
    setQueueUploading(true);
    setQueueError("");
    setQueueSuccess("");
    setQueueItems((prev) =>
      prev.map((v) =>
        v.status === STATUS.PENDING ? { ...v, status: STATUS.UPLOADING, progress: 0, error: null } : v
      )
    );

    const flushInterval = setInterval(() => {
      const updates = queueProgressRef.current;
      if (Object.keys(updates).length === 0) return;
      setQueueItems((prev) =>
        prev.map((v) => (updates[v.id] !== undefined ? { ...v, progress: updates[v.id] } : v))
      );
    }, 80);

    try {
      const uploadResults = await uploadBatch({
        selectedPoolId: queueSelectedPoolId,
        list: pending,
        updateItem: queueUpdateItem,
        progressRef: queueProgressRef,
      });
      setQueueItems((prev) =>
        prev.map((v) =>
          uploadResults.find((r) => r.videoId === v.id) ? { ...v, status: STATUS.DONE, progress: 100 } : v
        )
      );
      setQueueSuccess(
        `✅ ${uploadResults.length} queue item${uploadResults.length > 1 ? "s" : ""} uploaded to "${queueSelectedPool?.name}"`
      );
    } catch (err) {
      setQueueError(err.message || "Queue upload failed");
      setQueueItems((prev) =>
        prev.map((v) =>
          v.status === STATUS.UPLOADING || v.status === STATUS.SAVING
            ? { ...v, status: STATUS.ERROR, error: "Upload interrupted" }
            : v
        )
      );
    } finally {
      clearInterval(flushInterval);
      queueProgressRef.current = {};
      setQueueUploading(false);
    }
  };

  const queueStatusBadge = (status) => {
    if (status === STATUS.PENDING) return "bg-gray-100 text-gray-700";
    if (status === STATUS.UPLOADING) return "bg-orange-100 text-orange-700 animate-pulse";
    if (status === STATUS.SAVING) return "bg-blue-100 text-blue-700 animate-pulse";
    if (status === STATUS.DONE) return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  };

  const queueStatusLabel = (status) => {
    if (status === STATUS.PENDING) return "PENDING";
    if (status === STATUS.UPLOADING) return "UPLOADING";
    if (status === STATUS.SAVING) return "SAVING";
    if (status === STATUS.DONE) return "DONE";
    return "ERROR";
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FaVideo className="text-orange-500" /> Multi Video Uploader
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload videos directly to Cloudflare R2 with multi, single, and queue workflows
        </p>
      </div>

      <div className="mb-6">
        <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("multi")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeTab === "multi" ? "bg-orange-500 text-white" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <FaLayerGroup /> Multi Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeTab === "single" ? "bg-orange-500 text-white" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <FaVideo /> Single Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeTab === "queue" ? "bg-orange-500 text-white" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <MdOutlineQueuePlayNext /> Upload Queue
          </button>
        </div>
      </div>

      <div className={activeTab === "multi" ? "block" : "hidden"}>
        <PoolSelector
          pools={pools}
          poolsLoading={poolsLoading}
          selectedPoolId={multiSelectedPoolId}
          setSelectedPoolId={setMultiSelectedPoolId}
          fetchPools={fetchPools}
          errorSetter={setMultiGlobalError}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setMultiDragging(true);
          }}
          onDragLeave={() => setMultiDragging(false)}
          onDrop={multiHandleDrop}
          onClick={() => multiFileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 mb-5 ${
            multiDragging
              ? "border-orange-500 bg-orange-50 scale-[1.01]"
              : "border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50"
          }`}
        >
          <FaCloudUploadAlt
            className={`text-5xl mb-3 transition-colors ${multiDragging ? "text-orange-500" : "text-gray-400"}`}
          />
          <p className="text-base font-semibold text-gray-700">
            {multiDragging ? "Drop videos here" : "Drag & drop videos here"}
          </p>
          <p className="text-sm text-gray-400 mt-1">or click to browse</p>
          <p className="text-xs text-gray-400 mt-2">MP4, MOV, AVI, MKV, WEBM supported</p>
          <input
            ref={multiFileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => multiAddFiles(e.target.files)}
          />
        </div>

        {multiGlobalError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <FaTimesCircle className="flex-shrink-0" /> {multiGlobalError}
          </div>
        )}
        {multiSuccessMsg && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
            <FaCheckCircle className="flex-shrink-0" /> {multiSuccessMsg}
          </div>
        )}

        {multiVideos.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <span className="bg-gray-100 px-3 py-1 rounded-full font-medium text-gray-700">
                {multiVideos.length} video{multiVideos.length !== 1 ? "s" : ""}
              </span>
              {multiDoneCount > 0 && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  {multiDoneCount} uploaded
                </span>
              )}
              {multiPendingCount > 0 && (
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                  {multiPendingCount} pending
                </span>
              )}
              {multiErrorCount > 0 && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                  {multiErrorCount} failed
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {multiPendingCount > 0 && (
                <button
                  onClick={multiUploadAll}
                  disabled={multiUploading || !multiSelectedPoolId}
                  className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <MdOutlineFileUpload size={18} />
                  {multiUploading
                    ? "Uploading..."
                    : `Upload ${multiPendingCount} Video${multiPendingCount > 1 ? "s" : ""}`}
                </button>
              )}
              <button
                onClick={multiClearAll}
                disabled={multiUploading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
              >
                <FaTrash size={13} /> Clear All
              </button>
            </div>
          </div>
        )}

        {multiVideos.length > 0 && (
          <div className="space-y-3">
            {multiVideos.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative w-full sm:w-32 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 group">
                  <video
                    ref={(el) => {
                      if (el) multiVideoRefs.current[v.id] = el;
                    }}
                    src={v.previewUrl}
                    className="w-full h-full object-cover"
                    onLoadedMetadata={(e) => multiHandleMetadata(v.id, e)}
                    onEnded={() => setMultiPlayingId(null)}
                    muted
                  />
                  <button
                    onClick={() => multiTogglePlay(v.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {multiPlayingId === v.id ? (
                      <FaPause className="text-white text-xl" />
                    ) : (
                      <FaPlay className="text-white text-xl" />
                    )}
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">{v.name}</p>
                    <button
                      onClick={() => multiRemoveVideo(v.id)}
                      disabled={multiUploading && (v.status === STATUS.UPLOADING || v.status === STATUS.SAVING)}
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

                  {(v.status === STATUS.UPLOADING || v.status === STATUS.SAVING || v.status === STATUS.DONE) && (
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

        {multiVideos.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <FaVideo className="text-5xl mx-auto mb-3 opacity-20" />
            <p className="text-sm">No videos selected yet</p>
            <p className="text-xs mt-1">Select a pool above, then drag & drop or click to add videos</p>
          </div>
        )}
      </div>

      <div className={activeTab === "single" ? "block" : "hidden"}>
        <PoolSelector
          pools={pools}
          poolsLoading={poolsLoading}
          selectedPoolId={singleSelectedPoolId}
          setSelectedPoolId={setSingleSelectedPoolId}
          fetchPools={fetchPools}
          errorSetter={setSingleError}
        />

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={singleTitle}
            onChange={(e) => setSingleTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
            placeholder="Enter video title"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={singleDescription}
            onChange={(e) => setSingleDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none resize-none"
            placeholder="Optional description"
          />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setSingleDragging(true);
          }}
          onDragLeave={() => setSingleDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSingleDragging(false);
            singleSelectFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => singleFileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 mb-5 ${
            singleDragging
              ? "border-orange-500 bg-orange-50 scale-[1.01]"
              : "border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50"
          }`}
        >
          <FaCloudUploadAlt
            className={`text-5xl mb-3 transition-colors ${singleDragging ? "text-orange-500" : "text-gray-400"}`}
          />
          <p className="text-base font-semibold text-gray-700">
            {singleDragging ? "Drop a video here" : "Drag & drop a video here"}
          </p>
          <p className="text-sm text-gray-400 mt-1">or click to browse</p>
          <input
            ref={singleFileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => singleSelectFile(e.target.files?.[0])}
          />
        </div>

        {singleItem && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
            <div className="relative w-full max-w-sm h-52 rounded-xl overflow-hidden bg-black group mx-auto">
              <video
                ref={singleVideoRef}
                src={singleItem.previewUrl}
                className="w-full h-full object-cover"
                onLoadedMetadata={(e) =>
                  setSingleItem((prev) => (prev ? { ...prev, duration: e.target.duration } : prev))
                }
                onEnded={() => setSinglePlaying(false)}
                muted
              />
              <button
                type="button"
                onClick={() => {
                  if (!singleVideoRef.current) return;
                  if (singlePlaying) {
                    singleVideoRef.current.pause();
                    setSinglePlaying(false);
                  } else {
                    singleVideoRef.current.play();
                    setSinglePlaying(true);
                  }
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {singlePlaying ? (
                  <FaPause className="text-white text-xl" />
                ) : (
                  <FaPlay className="text-white text-xl" />
                )}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
              <span className="truncate max-w-[70%]">{singleItem.name}</span>
              <span>{formatSize(singleItem.size)}</span>
            </div>
            {singleItem.duration ? (
              <div className="text-xs text-gray-500 mt-1">{formatDuration(singleItem.duration)}</div>
            ) : null}
            {(singleItem.status === STATUS.UPLOADING ||
              singleItem.status === STATUS.SAVING ||
              singleItem.status === STATUS.DONE) && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>
                    {singleItem.status === STATUS.DONE
                      ? "Complete"
                      : singleItem.status === STATUS.SAVING
                      ? "Saving to database..."
                      : "Uploading to R2..."}
                  </span>
                  <span>{singleItem.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-200 ${
                      singleItem.status === STATUS.DONE
                        ? "bg-green-500"
                        : singleItem.status === STATUS.SAVING
                        ? "bg-blue-400 animate-pulse"
                        : "bg-orange-500"
                    }`}
                    style={{ width: `${singleItem.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {singleError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <FaTimesCircle className="flex-shrink-0" /> {singleError}
          </div>
        )}
        {singleSuccess && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
            <FaCheckCircle className="flex-shrink-0" /> {singleSuccess}
          </div>
        )}

        <button
          type="button"
          onClick={singleUpload}
          disabled={singleUploading || !singleItem}
          className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <MdOutlineFileUpload size={18} />
          {singleUploading ? "Uploading..." : "Upload Video"}
        </button>
      </div>

      <div className={activeTab === "queue" ? "block" : "hidden"}>
        <PoolSelector
          pools={pools}
          poolsLoading={poolsLoading}
          selectedPoolId={queueSelectedPoolId}
          setSelectedPoolId={setQueueSelectedPoolId}
          fetchPools={fetchPools}
          errorSetter={setQueueError}
        />

        <div className="mb-5 bg-white border border-gray-200 rounded-2xl p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Google Drive Links
          </label>
          <textarea
            rows={3}
            value={queueDriveLinks}
            onChange={(e) => setQueueDriveLinks(e.target.value)}
            placeholder="Ek ya multiple public Google Drive file links paste karo (line by line)"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none resize-none"
          />
          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-gray-500">
              Folder link direct import browser me limited hai; public file links best work karte hain.
            </p>
            <button
              type="button"
              onClick={queueImportFromDrive}
              disabled={queueDriveLoading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {queueDriveLoading ? "Importing..." : "Import from Drive"}
            </button>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setQueueDragging(true);
          }}
          onDragLeave={() => setQueueDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setQueueDragging(false);
            queueAddFiles(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-200 mb-5 ${
            queueDragging ? "border-orange-500 bg-orange-50" : "border-gray-300 bg-gray-50"
          }`}
        >
          <FaCloudUploadAlt
            className={`text-4xl mb-2 transition-colors ${queueDragging ? "text-orange-500" : "text-gray-400"}`}
          />
          <p className="text-sm font-semibold text-gray-700">
            {queueDragging ? "Drop videos for queue" : "Drag & drop videos to queue"}
          </p>
          <button
            type="button"
            onClick={() => queueFileInputRef.current?.click()}
            className="mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Add More
          </button>
          <input
            ref={queueFileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => queueAddFiles(e.target.files)}
          />
        </div>

        {queueError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <FaTimesCircle className="flex-shrink-0" /> {queueError}
          </div>
        )}
        {queueSuccess && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
            <FaCheckCircle className="flex-shrink-0" /> {queueSuccess}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {queueItems.length} item{queueItems.length !== 1 ? "s" : ""} in queue
          </div>
          <button
            type="button"
            onClick={queueStart}
            disabled={queueUploading || !queueSelectedPoolId || queueItems.every((x) => x.status !== STATUS.PENDING)}
            className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <MdOutlineQueuePlayNext size={18} />
            {queueUploading ? "Uploading Queue..." : "Start Queue"}
          </button>
        </div>

        <div className="space-y-3">
          {queueItems.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm"
            >
              <div className="relative w-full sm:w-32 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 group">
                <video
                  ref={(el) => {
                    if (el) queueVideoRefs.current[v.id] = el;
                  }}
                  src={v.previewUrl}
                  className="w-full h-full object-cover"
                  onLoadedMetadata={(e) => queueUpdateItem(v.id, { duration: e.target.duration })}
                  onEnded={() => setQueuePlayingId(null)}
                  muted
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = queueVideoRefs.current[v.id];
                    if (!el) return;
                    if (queuePlayingId === v.id) {
                      el.pause();
                      setQueuePlayingId(null);
                    } else {
                      if (queuePlayingId && queueVideoRefs.current[queuePlayingId]) {
                        queueVideoRefs.current[queuePlayingId].pause();
                      }
                      el.play();
                      setQueuePlayingId(v.id);
                    }
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {queuePlayingId === v.id ? (
                    <FaPause className="text-white text-xl" />
                  ) : (
                    <FaPlay className="text-white text-xl" />
                  )}
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{v.name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${queueStatusBadge(v.status)}`}>
                      {queueStatusLabel(v.status)}
                    </span>
                    {v.status === STATUS.ERROR && (
                      <button
                        type="button"
                        onClick={() => queueRetryOne(v.id)}
                        className="px-2 py-1 text-xs font-semibold rounded-md bg-red-500 text-white hover:bg-red-600"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  <span>{formatSize(v.size)}</span>
                  {v.duration ? <span>{formatDuration(v.duration)}</span> : null}
                  {v.error ? <span className="text-red-500 font-semibold">{v.error}</span> : null}
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-200 ${
                        v.status === STATUS.DONE
                          ? "bg-green-500"
                          : v.status === STATUS.SAVING
                          ? "bg-blue-400 animate-pulse"
                          : v.status === STATUS.UPLOADING
                          ? "bg-orange-500"
                          : v.status === STATUS.ERROR
                          ? "bg-red-400"
                          : "bg-gray-300"
                      }`}
                      style={{ width: `${v.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Export Pool Videos to Google Drive
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Pool videos select karo, folder link do, phir Start Export.
          </p>

          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={driveFolderLink}
              onChange={(e) => setDriveFolderLink(e.target.value)}
              placeholder="Google Drive folder link"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
            />
            <input
              type="password"
              value={driveAccessToken}
              onChange={(e) => setDriveAccessToken(e.target.value)}
              placeholder="Google OAuth access token (ya29...)"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              type="button"
              onClick={loadPoolReelsForDrive}
              disabled={poolReelsLoading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              {poolReelsLoading ? "Loading..." : "Load Pool Videos"}
            </button>
            <button
              type="button"
              onClick={() => setSelectedPoolReelIds(poolReels.map((r) => r._id))}
              disabled={!poolReels.length}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setSelectedPoolReelIds([])}
              disabled={!selectedPoolReelIds.length}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={startDriveExport}
              disabled={driveExporting || !selectedPoolReelIds.length}
              className="ml-auto px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {driveExporting ? "Exporting..." : "Start Export"}
            </button>
          </div>

          {driveExportError ? (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {driveExportError}
            </div>
          ) : null}
          {driveExportSuccess ? (
            <div className="mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
              {driveExportSuccess}
            </div>
          ) : null}

          <div className="max-h-72 overflow-auto border border-gray-100 rounded-xl">
            {poolReels.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">
                Pool videos load karo to selection list dikhegi.
              </div>
            ) : (
              poolReels.map((reel) => {
                const exportState = driveExportStatusByReel[reel._id];
                return (
                  <label
                    key={reel._id}
                    className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-orange-50/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedPoolReelIds.includes(reel._id)}
                        onChange={() => togglePoolReelSelection(reel._id)}
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {reel.title || reel.s3Key?.split("/").pop() || "Untitled"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{reel.s3Key}</p>
                      </div>
                    </div>
                    {exportState ? (
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          exportState.status === "done"
                            ? "bg-green-100 text-green-700"
                            : exportState.status === "error"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {exportState.message}
                      </span>
                    ) : null}
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
