import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { FaRobot, FaInstagram, FaYoutube, FaCopy, FaEye, FaTimes } from "react-icons/fa";

// ── Auth helper (user portal uses mobileUserToken) ────────────────────────────
const getUserToken = () =>
  localStorage.getItem("mobileUserToken") ||
  localStorage.getItem("clienttoken") ||
  sessionStorage.getItem("clienttoken");

const getUserData = () => {
  try {
    return JSON.parse(localStorage.getItem("mobileUserData") || "{}");
  } catch { return {}; }
};

// ── Resolve clientId — extract clientObjectId from JWT (MongoDB _id of client) ──
const resolveClientId = () => {
  // Always decode JWT to get clientObjectId — that's the MongoDB _id used in UGCPrompter.clientId
  const token = getUserToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // JWT payload has: clientObjectId (MongoDB _id) and clientId (CLI-XXXX code)
    // UGCPrompter stores MongoDB _id in its clientId field
    return payload.clientObjectId || payload.id || null;
  } catch { return null; }
};

const authHeaders = () => ({ Authorization: `Bearer ${getUserToken()}` });

// ── Platform helpers ───────────────────────────────────────────────────────────
const PLATFORM_BADGE = {
  instagram: "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
  youtube:   "bg-gradient-to-r from-red-500 to-red-600 text-white",
  both:      "bg-gradient-to-r from-purple-500 to-indigo-500 text-white",
};

const PLATFORM_ICON = {
  instagram: <FaInstagram size={10} />,
  youtube:   <FaYoutube size={10} />,
  both:      <span className="text-[10px] font-bold">IG+YT</span>,
};

// ── View Modal ─────────────────────────────────────────────────────────────────
function ViewModal({ p, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const copyAll = () => {
    const text = [
      p.title,
      `Platform: ${p.platform}`,
      p.prompt  ? `\nInstructions:\n${p.prompt}` : "",
      p.script  ? `\nScript:\n${p.script}` : "",
      p.hashtags?.length ? `\n${p.hashtags.map(h => `#${h}`).join(" ")}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "100%", maxWidth: "520px", maxHeight: "calc(100vh - 32px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${PLATFORM_BADGE[p.platform] || "bg-gray-200 text-gray-700"}`}>
              {PLATFORM_ICON[p.platform]} {p.platform}
            </span>
            <p className="font-bold text-gray-900 text-sm truncate">{p.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button onClick={copyAll} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition">
              <FaCopy size={11} /> Copy All
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition">
              <FaTimes size={13} />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {p.prompt && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📋 Instructions</p>
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{p.prompt}</p>
              </div>
            </div>
          )}
          {p.script && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">📝 Script</p>
                <button onClick={() => navigator.clipboard.writeText(p.script)} className="text-xs text-orange-600 hover:underline flex items-center gap-1">
                  <FaCopy size={10} /> Copy script
                </button>
              </div>
              <div className="bg-orange-50 rounded-xl p-3.5 border border-orange-100">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{p.script}</p>
              </div>
            </div>
          )}
          {p.hashtags?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">🏷️ Hashtags</p>
              <div className="flex flex-wrap gap-1.5">
                {p.hashtags.map((h, i) => (
                  <span key={i} className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">#{h}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Prompt Card ────────────────────────────────────────────────────────────────
function PromptCard({ p, onView }) {
  const badge = PLATFORM_BADGE[p.platform] || "bg-gray-200 text-gray-700";
  const icon  = PLATFORM_ICON[p.platform];

  const scriptPreview = p.script
    ? p.script.replace(/\[HOOK\]\n?/g, "").replace(/\[MAIN CONTENT\]\n?/g, "").replace(/\[CTA\]\n?/g, "").trim().slice(0, 110)
    : "";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className={`h-1 w-full ${badge}`} />
      <div className="p-4">
        {/* Title + platform */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-snug truncate">{p.title}</p>
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold mt-1 ${badge}`}>
              {icon} {p.platform === "both" ? "Instagram + YouTube" : p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}
            </span>
          </div>
          <button
            onClick={() => onView(p)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 hover:bg-orange-100 text-orange-500 transition shrink-0"
            title="View full script"
          >
            <FaEye size={13} />
          </button>
        </div>

        {/* Instructions preview */}
        {p.prompt && (
          <div className="mb-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Instructions</p>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 whitespace-pre-wrap">{p.prompt}</p>
          </div>
        )}

        {/* Script preview */}
        {scriptPreview && (
          <div className="bg-orange-50 rounded-xl px-3 py-2.5 border border-orange-100 mb-3">
            <p className="text-[11px] font-semibold text-orange-600 mb-1">Script preview</p>
            <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">{scriptPreview}…</p>
          </div>
        )}

        {/* Hashtags */}
        {p.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.hashtags.slice(0, 4).map((h, i) => (
              <span key={i} className="text-[11px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">#{h}</span>
            ))}
            {p.hashtags.length > 4 && <span className="text-[11px] text-gray-400 px-1">+{p.hashtags.length - 4}</span>}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.isAiGenerated ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
          {p.isAiGenerated ? "✨ AI Generated" : "Manual"}
        </span>
        <button onClick={() => onView(p)} className="text-xs text-orange-600 font-semibold hover:underline flex items-center gap-1">
          <FaEye size={10} /> View Script
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function UserUGCPage() {
  const clientId = resolveClientId();
  const [prompts, setPrompts]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState("");
  const [viewItem, setViewItem]   = useState(null);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all"); // all | instagram | youtube | both

  const fetchPrompts = useCallback(async () => {
    if (!clientId) { setError("Client ID not found. Please re-login."); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/ugc-prompter`, {
        headers: authHeaders(),
        params: { clientId },
      });
      setPrompts(data.prompts || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load UGC scripts.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  // Filter + search
  const filtered = prompts.filter(p => {
    const matchPlatform = filter === "all" || p.platform === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.title?.toLowerCase().includes(q) ||
      p.prompt?.toLowerCase().includes(q) ||
      p.script?.toLowerCase().includes(q) ||
      p.hashtags?.some(h => h.toLowerCase().includes(q));
    return matchPlatform && matchSearch;
  });

  const FILTERS = [
    { value: "all",       label: "All" },
    { value: "instagram", label: "Instagram" },
    { value: "youtube",   label: "YouTube" },
    { value: "both",      label: "Both" },
  ];

  return (
    <div className="w-full space-y-5">
      {viewItem && <ViewModal p={viewItem} onClose={() => setViewItem(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
          <FaRobot className="text-orange-500" size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">UGC Scripts</h2>
          <p className="text-xs text-gray-500">Brand scripts and filming instructions for your content</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search scripts, instructions, hashtags…"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                filter === f.value
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {!loading && !error && (
        <div className="flex gap-3">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <span className="text-lg font-bold text-orange-500">{prompts.length}</span>
            <span className="text-xs text-gray-500 font-medium">Total Scripts</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <span className="text-lg font-bold text-emerald-500">{prompts.filter(p => p.isAiGenerated).length}</span>
            <span className="text-xs text-gray-500 font-medium">AI Generated</span>
          </div>
          {filtered.length !== prompts.length && (
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-2 shadow-sm">
              <span className="text-lg font-bold text-blue-500">{filtered.length}</span>
              <span className="text-xs text-gray-500 font-medium">Showing</span>
            </div>
          )}
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
          <button onClick={fetchPrompts} className="mt-3 text-xs text-red-500 hover:underline">Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <FaRobot className="text-orange-200 mb-3" size={40} />
          <p className="font-semibold text-gray-700">
            {search || filter !== "all" ? "No scripts match your filter" : "No UGC scripts yet"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search || filter !== "all" ? "Try clearing the search or filter" : "Your brand will add scripts here soon"}
          </p>
          {(search || filter !== "all") && (
            <button onClick={() => { setSearch(""); setFilter("all"); }} className="mt-3 text-xs text-orange-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(p => (
            <PromptCard key={p._id} p={p} onView={setViewItem} />
          ))}
        </div>
      )}
    </div>
  );
}
