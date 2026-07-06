import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  FaMagic, FaCopy, FaTimes, FaSave, FaEdit, FaTrash,
  FaInstagram, FaYoutube, FaRobot, FaEye, FaCog,
} from "react-icons/fa";

// ── Auth helpers ──────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("clienttoken") ||
  sessionStorage.getItem("clienttoken") ||
  localStorage.getItem("admintoken") ||
  sessionStorage.getItem("admintoken");

const getClientData = () => {
  try {
    return JSON.parse(
      localStorage.getItem("clientData") ||
        sessionStorage.getItem("clientData") || "{}"
    );
  } catch { return {}; }
};

const resolveClientId = () => {
  const data = getClientData();
  const fromStorage = data._id || data.id;
  if (fromStorage && /^[a-f0-9]{24}$/i.test(String(fromStorage).trim()))
    return String(fromStorage).trim();
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.id) return String(payload.id);
    if (payload.clientObjectId) return String(payload.clientObjectId);
  } catch { return null; }
  return null;
};

const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

// ── Constants ─────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: <FaInstagram className="text-pink-500" /> },
  { value: "youtube",   label: "YouTube",   icon: <FaYoutube className="text-red-500" /> },
  { value: "both",      label: "Both",      icon: <span className="text-xs font-bold text-purple-600">IG+YT</span> },
];

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

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ p, onClose, onCopy }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${PLATFORM_BADGE[p.platform] || "bg-gray-200 text-gray-600"}`}>
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

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Instructions */}
          {p.prompt && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📋 Instructions</p>
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{p.prompt}</p>
              </div>
            </div>
          )}

          {/* Script */}
          {p.script && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">📝 Script</p>
                <button
                  onClick={() => navigator.clipboard.writeText(p.script)}
                  className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                >
                  <FaCopy size={10} /> Copy script
                </button>
              </div>
              <div className="bg-orange-50 rounded-xl p-3.5 border border-orange-100">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{p.script}</p>
              </div>
            </div>
          )}

          {/* Hashtags */}
          {p.hashtags?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">🏷️ Hashtags</p>
              <div className="flex flex-wrap gap-1.5">
                {p.hashtags.map((h, i) => (
                  <span key={i} className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
                    #{h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Prompt Card ───────────────────────────────────────────────────────────────
function PromptCard({ p, onEdit, onDelete, onCopy, onView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const badge = PLATFORM_BADGE[p.platform] || "bg-gray-200 text-gray-600";
  const icon  = PLATFORM_ICON[p.platform];

  // Truncate script preview to 2 lines worth
  const scriptPreview = p.script
    ? p.script.replace(/\[HOOK\]\n?/g, "").replace(/\[MAIN CONTENT\]\n?/g, "").replace(/\[CTA\]\n?/g, "").trim().slice(0, 120)
    : "";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group">

      {/* Card top colour strip */}
      <div className={`h-1 w-full ${badge}`} />

      <div className="p-4">
        {/* Header row: title + settings menu */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-snug truncate">{p.title}</p>
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold mt-1 ${badge}`}>
              {icon} {p.platform === "both" ? "Instagram + YouTube" : p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}
            </span>
          </div>

          {/* Settings cog + dropdown */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-orange-100 hover:text-orange-600 text-gray-400 transition"
            >
              <FaCog size={14} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 z-30 bg-white rounded-xl shadow-xl border border-gray-100 w-36 py-1 overflow-hidden">
                <button
                  onClick={() => { onView(p); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition"
                >
                  <FaEye size={12} className="text-orange-400" /> View
                </button>
                <button
                  onClick={() => { onEdit(p); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <FaEdit size={12} className="text-blue-400" /> Edit
                </button>
                <button
                  onClick={() => { onCopy(p); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <FaCopy size={12} className="text-gray-400" /> Copy
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { onDelete(p._id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                >
                  <FaTrash size={12} /> Delete
                </button>
              </div>
            )}
          </div>
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
              <span key={i} className="text-[11px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                #{h}
              </span>
            ))}
            {p.hashtags.length > 4 && (
              <span className="text-[11px] text-gray-400 px-1">+{p.hashtags.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.isAiGenerated ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
          {p.isAiGenerated ? "✨ AI Generated" : "Manual"}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UGCPrompterTab() {
  const clientId = resolveClientId();

  // Form inputs
  const [topic,      setTopic]      = useState("");
  const [platform,   setPlatform]   = useState("instagram");
  const [generating, setGenerating] = useState(false);

  // Generated / editable output
  const [generated,      setGenerated]      = useState(null);
  const [editedTitle,    setEditedTitle]    = useState("");
  const [editedInstr,    setEditedInstr]    = useState("");
  const [editedScript,   setEditedScript]   = useState("");
  const [editedHashtags, setEditedHashtags] = useState([]);
  const [editedPlatform, setEditedPlatform] = useState("instagram");

  // Saved list
  const [prompts,        setPrompts]        = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [saveMsg,        setSaveMsg]        = useState("");
  const [editItem,       setEditItem]       = useState(null);

  // View modal
  const [viewItem, setViewItem] = useState(null);

  // ── Fetch saved prompts ─────────────────────────────────────────────────
  const fetchPrompts = useCallback(async () => {
    if (!clientId) return;
    setLoadingPrompts(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/ugc-prompter`, {
        headers: authHeaders(),
      });
      setPrompts(data.prompts || []);
    } catch { /* silent */ }
    finally { setLoadingPrompts(false); }
  }, [clientId]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  // ── AI Generate ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim()) { alert("Please enter a UGC topic"); return; }
    setGenerating(true);
    setGenerated(null);
    setSaveMsg("");
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/ugc-prompter/generate`,
        {
          topic:       topic.trim(),
          brandName:   topic.trim(),
          productName: topic.trim(),
          platform,
          category: "testimonial",
          tone:     "casual",
          duration: 30,
          keyPoints: [],
        },
        { headers: authHeaders() }
      );
      if (data.success && data.generated) {
        const g = data.generated;
        setGenerated(g);
        setEditedTitle(g.title || "");
        setEditedInstr(g.instructions || g.prompt || "");
        setEditedScript(g.script || "");
        setEditedHashtags(g.hashtags || []);
        setEditedPlatform(g.platform || platform);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Save / Update ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editedTitle.trim()) { alert("Title cannot be empty"); return; }
    if (!editedInstr.trim()) { alert("Instructions cannot be empty"); return; }
    setSaving(true);
    setSaveMsg("");
    try {
      const payload = {
        title:       editedTitle,
        platform:    editedPlatform,
        prompt:      editedInstr,
        script:      editedScript,
        hashtags:    editedHashtags,
        category:    generated?.category || editItem?.category || "testimonial",
        tone:        generated?.tone     || editItem?.tone     || "casual",
        duration:    generated?.duration || editItem?.duration || 30,
        brandName:   generated?.brandName   || editItem?.brandName   || "",
        productName: generated?.productName || editItem?.productName || topic,
        keyPoints:   generated?.keyPoints   || editItem?.keyPoints   || [],
        status:      "active",
        isAiGenerated: !!(generated?.isAiGenerated),
      };
      if (editItem?._id) {
        await axios.patch(`${API_BASE_URL}/api/ugc-prompter/${editItem._id}`, payload, { headers: authHeaders() });
        setSaveMsg("✅ Updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/api/ugc-prompter`, payload, { headers: authHeaders() });
        setSaveMsg("✅ Saved successfully!");
      }
      resetOutput();
      fetchPrompts();
    } catch (err) {
      setSaveMsg("❌ " + (err?.response?.data?.message || "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const resetOutput = () => {
    setGenerated(null);
    setEditItem(null);
    setEditedTitle("");
    setEditedInstr("");
    setEditedScript("");
    setEditedHashtags([]);
    setTopic("");
    setSaveMsg("");
  };

  // ── Edit ────────────────────────────────────────────────────────────────
  const handleEdit = (p) => {
    setEditItem(p);
    setTopic(p.productName || "");
    setPlatform(p.platform || "instagram");
    setEditedTitle(p.title || "");
    setEditedInstr(p.prompt || "");
    setEditedScript(p.script || "");
    setEditedHashtags(p.hashtags || []);
    setEditedPlatform(p.platform || "instagram");
    setGenerated({ ...p });
    setSaveMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this UGC prompt?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/ugc-prompter/${id}`, { headers: authHeaders() });
      fetchPrompts();
    } catch { alert("Delete failed"); }
  };

  const handleCopy = (p) => {
    const text = [
      p.title,
      `Platform: ${p.platform}`,
      p.prompt  ? `\nInstructions:\n${p.prompt}` : "",
      p.script  ? `\nScript:\n${p.script}` : "",
      p.hashtags?.length ? `\n${p.hashtags.map(h => `#${h}`).join(" ")}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text);
  };

  const addHashtag = (val) => {
    const v = val.trim().replace(/^#/, "");
    if (v && !editedHashtags.includes(v)) setEditedHashtags(prev => [...prev, v]);
  };

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white";
  const lbl = "block text-xs font-semibold text-gray-600 mb-1.5";
  const showOutput = !!(generated || editItem);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">

      {/* View Modal */}
      {viewItem && (
        <ViewModal
          p={viewItem}
          onClose={() => setViewItem(null)}
          onCopy={handleCopy}
        />
      )}

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FaRobot className="text-orange-500" size={20} />
          UGC Script Generator
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Enter a topic → AI generates a ready-to-use UGC script for your creators
        </p>
      </div>

      {/* ── Generator Panel ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-400 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaMagic className="text-white" size={15} />
            <span className="text-white font-bold text-base">
              {editItem ? "Edit UGC Prompt" : "Generate UGC Script"}
            </span>
          </div>
          {showOutput && (
            <button onClick={resetOutput} className="text-white/80 hover:text-white text-xs flex items-center gap-1">
              <FaTimes size={12} /> Clear
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Topic input */}
          <div>
            <label className={lbl}>UGC Topic *</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Skincare routine, Protein supplement, AI tool launch…"
              className={inp}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
            />
            <p className="text-xs text-gray-400 mt-1">Describe the product or topic you want UGC content for</p>
          </div>

          {/* Platform selector */}
          <div>
            <label className={lbl}>Platform *</label>
            <div className="flex gap-2">
              {PLATFORMS.map(pl => (
                <button
                  key={pl.value}
                  onClick={() => setPlatform(pl.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition ${
                    platform === pl.value
                      ? "border-orange-400 bg-orange-50 text-orange-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {pl.icon} {pl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-bold text-sm shadow hover:opacity-90 transition disabled:opacity-60"
          >
            <FaMagic size={14} />
            {generating
              ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Script…
                </span>
              : "✨ Generate UGC Script with AI"
            }
          </button>
        </div>
      </div>

      {/* ── Generated Output Panel ── */}
      {showOutput && (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
          <div className="bg-orange-50 px-5 py-3 border-b border-orange-100 flex items-center justify-between">
            <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <FaRobot className="text-orange-500" size={14} />
              {editItem ? "Edit Prompt" : "AI Generated — Review & Save"}
            </span>
            {generated?.isAiGenerated && (
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                ✨ AI Generated
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            {/* Title */}
            <div>
              <label className={lbl}>Title *</label>
              <input value={editedTitle} onChange={e => setEditedTitle(e.target.value)} className={inp} placeholder="UGC content title" />
            </div>

            {/* Platform */}
            <div>
              <label className={lbl}>Platform *</label>
              <div className="flex gap-2">
                {PLATFORMS.map(pl => (
                  <button
                    key={pl.value}
                    onClick={() => setEditedPlatform(pl.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-medium transition ${
                      editedPlatform === pl.value
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {pl.icon} {pl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className={lbl}>Instructions *</label>
              <textarea
                value={editedInstr}
                onChange={e => setEditedInstr(e.target.value)}
                rows={5}
                placeholder="Instructions for the creator — what to film, how to deliver the content…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none leading-relaxed"
              />
            </div>

            {/* Script */}
            <div>
              <label className={lbl}>
                Script
                <span className="ml-1 text-gray-400 font-normal">(optional — word-for-word script for the creator)</span>
              </label>
              <textarea
                value={editedScript}
                onChange={e => setEditedScript(e.target.value)}
                rows={9}
                placeholder={`[HOOK]\nOpening hook...\n\n[MAIN CONTENT]\nCore message...\n\n[CTA]\nCall to action...`}
                className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-orange-50 resize-none leading-relaxed"
              />
            </div>

            {/* Hashtags */}
            <div>
              <label className={lbl}>Hashtags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editedHashtags.map((h, i) => (
                  <span key={i} className="flex items-center gap-1 bg-orange-50 text-orange-600 text-xs px-2.5 py-1 rounded-full border border-orange-100">
                    #{h}
                    <button onClick={() => setEditedHashtags(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500 ml-0.5">
                      <FaTimes size={8} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                placeholder="Type a hashtag and press Enter"
                className={inp}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addHashtag(e.target.value); e.target.value = ""; } }}
              />
            </div>

            {/* Copy full script */}
            {editedScript && (
              <button
                onClick={() => navigator.clipboard.writeText(`${editedTitle}\n\nInstructions:\n${editedInstr}\n\nScript:\n${editedScript}`)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-600 transition px-3 py-2 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 w-full justify-center"
              >
                <FaCopy size={11} /> Copy full script to clipboard
              </button>
            )}

            {/* Save message */}
            {saveMsg && (
              <div className={`text-sm px-4 py-2.5 rounded-xl font-medium ${
                saveMsg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>{saveMsg}</div>
            )}

            {/* Save / Cancel buttons */}
            <div className="flex gap-3">
              {(editItem) && (
                <button
                  onClick={resetOutput}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                >
                  <FaTimes size={13} /> Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition disabled:opacity-60"
              >
                <FaSave size={13} />
                {saving ? "Saving…" : editItem ? "Update Prompt" : "Save Prompt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Saved Prompts ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-base">Saved Prompts</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {prompts.length} total
          </span>
        </div>

        {loadingPrompts ? (
          <div className="flex justify-center py-14">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <FaRobot className="text-orange-300 mb-3" size={36} />
            <p className="font-semibold text-gray-700">No prompts yet</p>
            <p className="text-sm text-gray-400 mt-1">Generate your first UGC script above and save it</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prompts.map(p => (
              <PromptCard
                key={p._id}
                p={p}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopy={handleCopy}
                onView={setViewItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
