import React, { useState } from "react";
import {
  FaInstagram, FaDownload, FaSpinner, FaClock, FaEye,
  FaHeart, FaUser, FaCheckCircle, FaExclamationTriangle,
  FaLink, FaTimes
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDuration = (sec) => {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
};

const formatCount = (n) => {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const formatDate = (d) => {
  if (!d || d.length !== 8) return null;
  return `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}`;
};

const isValidInstaReel = (url) => {
  try {
    const p = new URL(url);
    return (
      (p.hostname === "www.instagram.com" || p.hostname === "instagram.com") &&
      p.pathname.includes("/reel/")
    );
  } catch {
    return false;
  }
};

// ── Stat Badge ────────────────────────────────────────────────────────────────

const StatBadge = ({ icon: Icon, value, label, color }) => {
  if (!value) return null;
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${color}`}>
      <Icon size={10} />
      <span>{value}</span>
      {label && <span className="opacity-70">{label}</span>}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function InstaReelsDownloader() {
  const [url, setUrl] = useState("");
  const [reelInfo, setReelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reset = () => {
    setReelInfo(null);
    setError("");
    setSuccess("");
    setDownloadProgress(null);
  };

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!isValidInstaReel(trimmed)) {
      setError("Invalid URL. Use format: https://www.instagram.com/reel/XXXXX/");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setReelInfo(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/insta-reels/get-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch reel info.");
      setReelInfo(data);
    } catch (e) {
      setError(e.message || "Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!reelInfo) return;
    setDownloading(true);
    setError("");
    setSuccess("");
    setDownloadProgress("Preparing download...");

    try {
      const downloadUrl = `${API_BASE_URL}/api/insta-reels/download?url=${encodeURIComponent(
        reelInfo.originalUrl
      )}&title=${encodeURIComponent(reelInfo.title || "instagram_reel")}`;

      setDownloadProgress("Downloading video with audio...");
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Download failed.");
      }

      setDownloadProgress("Processing file...");
      const blob = await response.blob();

      const safeName = (reelInfo.title || "instagram_reel")
        .replace(/[^a-z0-9]/gi, "_")
        .substring(0, 60);

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${safeName}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      setSuccess("Download started! Check your Downloads folder.");
    } catch (e) {
      setError(e.message || "Download failed. Please try again.");
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleClear = () => {
    setUrl("");
    reset();
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-md">
          <FaInstagram className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Insta Reels Downloader</h1>
          <p className="text-sm text-gray-500">Download public Instagram Reels in HD quality with audio</p>
        </div>
      </div>

      {/* ── Input Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Instagram Reel URL
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FaLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                placeholder="https://www.instagram.com/reel/XXXXXXX/"
                className="w-full pl-9 pr-9 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
              />
              {url && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
            <button
              onClick={handleFetch}
              disabled={loading || !url.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-sm"
            >
              {loading ? <FaSpinner className="animate-spin" size={14} /> : <FaInstagram size={14} />}
              {loading ? "Fetching..." : "Fetch Reel"}
            </button>
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 bg-pink-50 border border-pink-100 rounded-xl px-4 py-3">
          <FaExclamationTriangle className="text-pink-400 mt-0.5 flex-shrink-0" size={12} />
          <p className="text-xs text-pink-700">
            Only <strong>public</strong> Instagram Reels are supported. Private accounts will not work.
            Audio is merged automatically using ffmpeg.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <FaExclamationTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={12} />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <FaCheckCircle className="text-green-500 flex-shrink-0" size={14} />
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}
      </div>

      {/* ── Result Card ── */}
      {reelInfo && (
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Thumbnail */}
          {reelInfo.thumbnail && (
            <div className="relative">
              <img
                src={reelInfo.thumbnail}
                alt="Reel thumbnail"
                className="w-full max-h-72 object-cover"
                onError={(e) => {
                  // If proxy fails, hide the image container
                  e.target.closest(".relative").style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              {/* Duration badge */}
              {reelInfo.duration && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full">
                  <FaClock size={9} />
                  {formatDuration(reelInfo.duration)}
                </div>
              )}
              {/* Instagram badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                <FaInstagram size={10} />
                Instagram Reel
              </div>
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Title */}
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
                {reelInfo.title || "Instagram Reel"}
              </p>
              {reelInfo.uploader && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                  <FaUser size={9} />
                  <span>@{reelInfo.uploader}</span>
                  {reelInfo.uploadDate && (
                    <span className="text-gray-400">· {formatDate(reelInfo.uploadDate)}</span>
                  )}
                </div>
              )}
            </div>

            {/* Stats row */}
            {(reelInfo.viewCount || reelInfo.likeCount || reelInfo.duration) && (
              <div className="flex flex-wrap gap-2">
                <StatBadge icon={FaEye} value={formatCount(reelInfo.viewCount)} label="views" color="bg-blue-50 text-blue-600" />
                <StatBadge icon={FaHeart} value={formatCount(reelInfo.likeCount)} label="likes" color="bg-pink-50 text-pink-600" />
                <StatBadge icon={FaClock} value={formatDuration(reelInfo.duration)} color="bg-gray-100 text-gray-600" />
              </div>
            )}

            {/* Download progress */}
            {downloadProgress && (
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                <FaSpinner className="animate-spin text-purple-500 flex-shrink-0" size={13} />
                <p className="text-sm text-purple-700 font-medium">{downloadProgress}</p>
              </div>
            )}

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            >
              {downloading ? (
                <><FaSpinner className="animate-spin" size={14} /> Processing...</>
              ) : (
                <><FaDownload size={13} /> Download MP4 — HD Quality with Audio</>
              )}
            </button>

            {/* Note */}
            <p className="text-center text-xs text-gray-400">
              Video + Audio merged via ffmpeg · Temp files auto-deleted after download
            </p>
          </div>
        </div>
      )}

      {/* ── How to use ── */}
      {!reelInfo && !loading && (
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How to use</p>
          <ol className="space-y-2">
            {[
              "Open Instagram and find the Reel you want to download",
              "Tap the 3-dot menu → Copy Link",
              "Paste the link above and click Fetch Reel",
              "Preview the reel info, then click Download",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
