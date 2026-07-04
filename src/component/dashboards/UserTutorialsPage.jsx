import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "../../config";
import { FaBook, FaPlay, FaTimes, FaVideo, FaSearch } from "react-icons/fa";

// ── Auth ──────────────────────────────────────────────────────────────────────
const getUserToken = () =>
  localStorage.getItem("mobileUserToken") ||
  localStorage.getItem("clienttoken") ||
  sessionStorage.getItem("clienttoken");

const getUserData = () => {
  try { return JSON.parse(localStorage.getItem("mobileUserData") || "{}"); }
  catch { return {}; }
};

const resolveClientId = () => {
  const token = getUserToken();
  if (!token) return null;
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return p.clientObjectId || p.clientId || null;
  } catch { return null; }
};

// ── Video Modal ───────────────────────────────────────────────────────────────
function VideoModal({ t, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.85)", padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ width: "100%", maxWidth: "640px", maxHeight: "calc(100vh - 32px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 shrink-0">
          <p className="text-white font-semibold text-sm truncate pr-4">{t.title}</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition shrink-0"
          >
            <FaTimes size={13} />
          </button>
        </div>
        {/* Video */}
        <div className="bg-black flex-1 flex items-center justify-center">
          <video
            src={t.videoUrl}
            controls
            autoPlay
            className="w-full max-h-[70vh] object-contain"
          />
        </div>
        {/* Description */}
        {t.description && (
          <div className="px-4 py-3 bg-gray-900 shrink-0">
            <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">{t.description}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Tutorial Card ─────────────────────────────────────────────────────────────
function TutorialCard({ t, onPlay }) {
  const vidRef = useRef(null);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
      {/* Thumbnail — fixed height, compact */}
      <div
        className="relative bg-gray-900 cursor-pointer group shrink-0"
        style={{ height: "140px" }}
        onClick={() => t.videoUrl && onPlay(t)}
      >
        {t.videoUrl ? (
          <>
            <video
              ref={vidRef}
              src={t.videoUrl}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaPlay className="text-gray-900 ml-0.5" size={12} />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <FaVideo size={22} />
          </div>
        )}
      </div>

      {/* Info — tight padding */}
      <div className="px-3 pt-2.5 pb-1 flex-1">
        <p className="font-bold text-gray-900 text-xs leading-snug line-clamp-2">{t.title}</p>
        {t.description && (
          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-1 mt-0.5">{t.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        {t.videoUrl && (
          <button
            onClick={() => onPlay(t)}
            className="flex items-center gap-1 text-[11px] font-semibold text-orange-500 hover:text-orange-700 transition"
          >
            <FaPlay size={8} /> Watch
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserTutorialsPage() {
  const clientId = resolveClientId();
  const [tutorials, setTutorials] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [playItem,  setPlayItem]  = useState(null);
  const [search,    setSearch]    = useState("");

  const fetchTutorials = useCallback(async () => {
    if (!clientId) {
      setError("Could not resolve your account. Please re-login.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(
        `${API_BASE_URL}/api/reels-tutorials?clientId=${encodeURIComponent(clientId)}`
      );
      const data = await res.json();
      if (data.success) setTutorials(data.tutorials || []);
      else setError(data.message || "Failed to load tutorials");
    } catch {
      setError("Failed to load tutorials. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchTutorials(); }, [fetchTutorials]);

  const filtered = tutorials.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-5">
      {playItem && <VideoModal t={playItem} onClose={() => setPlayItem(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
          <FaBook className="text-orange-500" size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Tutorials</h2>
          <p className="text-xs text-gray-500">Video guides to help you complete tasks</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tutorials…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="flex gap-3">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <span className="text-lg font-bold text-orange-500">{tutorials.length}</span>
            <span className="text-xs text-gray-500 font-medium">Total Guides</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <span className="text-lg font-bold text-green-500">
              {tutorials.filter((t) => t.videoUrl).length}
            </span>
            <span className="text-xs text-gray-500 font-medium">With Video</span>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium text-sm">{error}</p>
          <button onClick={fetchTutorials} className="mt-3 text-xs text-red-500 hover:underline">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-3">
            <FaBook className="text-orange-300" size={24} />
          </div>
          <p className="font-semibold text-gray-700">
            {search ? "No tutorials match your search" : "No tutorials yet"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? "Try a different keyword" : "Your brand will add guides here soon"}
          </p>
          {search && (
            <button onClick={() => setSearch("")} className="mt-3 text-xs text-orange-600 hover:underline">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((t) => (
            <TutorialCard key={t._id} t={t} onPlay={setPlayItem} />
          ))}
        </div>
      )}
    </div>
  );
}
