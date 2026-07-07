import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  FaMagic, FaCopy, FaTimes, FaSave, FaTrash,
  FaRobot, FaEye, FaCheckCircle, FaClock, FaFilm, FaPlay,
  FaDownload, FaCheck, FaTimes as FaX, FaPlus, FaInstagram,
  FaYoutube, FaSpinner, FaCog,
} from "react-icons/fa";

// ── Auth helpers ──────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("clienttoken") ||
  sessionStorage.getItem("clienttoken") ||
  localStorage.getItem("admintoken") ||
  sessionStorage.getItem("admintoken");

const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

// ── View Script Modal ────────────────────────────────────────────────────────
function ViewScriptModal({ script, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const copyScript = () => {
    const text = `${script.title}\n\nPlatform: ${script.platform || "Instagram"}\nCategory: ${script.category}\nDuration: ${script.duration}s\nTone: ${script.tone}\n\nInstructions:\n${script.prompt || "No instructions provided."}\n\nScript:\n${script.script}`;
    navigator.clipboard.writeText(text);
    alert("Script copied!");
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-205 text-gray-900 my-auto">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-6 flex items-center justify-between text-white">
          <div>
            <h2 className="text-white font-extrabold text-xl">{script.title}</h2>
            <p className="text-white/80 text-sm mt-1 capitalize">{script.platform || "Instagram"} • {script.category} • {script.duration}s • {script.tone}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all focus:outline-none">
            <FaTimes size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 space-y-6">
          {script.prompt && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📋 Instructions</h3>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{script.prompt}</p>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">📝 Script</h3>
              <button onClick={copyScript} className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100/50 font-bold px-3 py-1.5 rounded-lg border border-orange-200 transition-all focus:outline-none">
                <FaCopy size={12} /> Copy Script
              </button>
            </div>
            <div className="bg-orange-50/30 rounded-2xl p-6 border border-orange-100">
              <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap font-mono">{script.script}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-bold text-gray-500 mb-1">Created Date</p>
              <p className="text-sm text-gray-850 font-bold">{new Date(script.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-bold text-gray-500 mb-1">Status</p>
              <p className="text-sm text-emerald-600 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                Active
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all focus:outline-none">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View Submission Modal ────────────────────────────────────────────────────
function ViewSubmissionModal({ submission, onClose, onApprove, onReject }) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/ugc-video/${submission._id}`,
        { status: "approved" },
        { headers: authHeaders() }
      );
      onApprove();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to approve");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/ugc-video/${submission._id}`,
        { status: "rejected" },
        { headers: authHeaders() }
      );
      onReject();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-205 text-gray-900 my-auto">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-6 flex items-center justify-between text-white">
          <div>
            <h2 className="text-white font-bold text-xl">Video Submission Review</h2>
            <p className="text-white/80 text-sm mt-1">{submission.promptId?.title}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all focus:outline-none">
            <FaTimes size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 space-y-6">
          <div>
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">🎬 Video Output</p>
            <div className="relative bg-slate-900 aspect-video rounded-2xl overflow-hidden shadow-inner border border-slate-200">
              {submission.videoUrl ? (
                <video src={submission.videoUrl} className="w-full h-full object-cover" controls />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <FaFilm size={40} className="animate-pulse" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-bold text-gray-400 mb-1">Script Title</p>
              <p className="text-sm text-gray-800 font-bold">{submission.promptId?.title || "Untitled"}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-bold text-gray-400 mb-1">Submitted Date</p>
              <p className="text-sm text-gray-800 font-bold">{new Date(submission.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-bold text-gray-400 mb-1">Submission Status</p>
              <p className={`text-sm font-bold flex items-center gap-1.5 uppercase ${
                submission.status === "approved" ? "text-emerald-600" :
                submission.status === "rejected" ? "text-rose-600" :
                "text-amber-605"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  submission.status === "approved" ? "bg-emerald-500" :
                  submission.status === "rejected" ? "bg-rose-500" :
                  "bg-amber-500"
                }`}></span>
                {submission.status}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-bold text-gray-400 mb-1">Category</p>
              <p className="text-sm text-gray-800 font-bold capitalize">{submission.promptId?.category || "UGC"}</p>
            </div>
          </div>

          {submission.note && (
            <div className="bg-orange-50/20 rounded-2xl p-5 border border-orange-100">
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">📝 Creator Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{submission.note}</p>
            </div>
          )}
        </div>

        {submission.status === "pending" && (
          <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 flex gap-3">
            <button
              onClick={handleReject}
              disabled={rejecting || approving}
              className="flex-1 py-3 rounded-xl border-2 border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition-all disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none"
            >
              <FaX size={12} /> Reject Submission
            </button>
            <button
              onClick={handleApprove}
              disabled={approving || rejecting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold hover:brightness-105 transition-all disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none"
            >
              <FaCheck size={12} /> Approve Submission
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Full-Page Form Component (Script Creator) ──────────────────────────────────
function CreateScriptForm({ editScript, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState(editScript && !editScript.isAiGenerated ? "manual" : "ai");

  // AI Generator States
  const [topic, setTopic] = useState(editScript ? editScript.brandName || editScript.title : "");
  const [platform, setPlatform] = useState(editScript ? editScript.platform || "instagram" : "instagram");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(editScript ? {
    category: editScript.category,
    tone: editScript.tone,
    duration: editScript.duration,
  } : null);
  const [savedId, setSavedId] = useState(editScript ? editScript._id : null);

  // Manual Creation States
  const [manualTitle, setManualTitle] = useState(editScript ? editScript.title : "");
  const [manualPlatform, setManualPlatform] = useState(editScript ? editScript.platform || "instagram" : "instagram");
  const [manualCategory, setManualCategory] = useState(editScript ? editScript.category || "testimonial" : "testimonial");
  const [manualTone, setManualTone] = useState(editScript ? editScript.tone || "casual" : "casual");
  const [manualDuration, setManualDuration] = useState(editScript ? editScript.duration || 30 : 30);
  const [manualInstructions, setManualInstructions] = useState(editScript ? editScript.prompt || "" : "");
  const [manualScript, setManualScript] = useState(editScript ? editScript.script || "" : "");

  // States for Editable generated content
  const [editedTitle, setEditedTitle] = useState(editScript ? editScript.title : "");
  const [editedInstructions, setEditedInstructions] = useState(editScript ? editScript.prompt || "" : "");
  const [editedScript, setEditedScript] = useState(editScript ? editScript.script || "" : "");
  
  const [saving, setSaving] = useState(false);

  // Sync edited fields when generated output arrives
  useEffect(() => {
    if (generated && !editScript) {
      setEditedTitle(generated.title || "");
      setEditedInstructions(generated.instructions || "");
      setEditedScript(generated.script || "");
    }
  }, [generated, editScript]);

  const handleGenerate = async () => {
    if (!topic.trim()) { alert("Please enter a topic/product name"); return; }
    setGenerating(true);
    setGenerated(null);
    setSavedId(null);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/ugc-prompter/generate`,
        {
          topic,
          platform,
          category: "testimonial",
          tone: "casual",
          duration: 30,
          keyPoints: [],
        },
        { headers: authHeaders() }
      );
      if (data.success && data.generated) {
        setGenerated(data.generated);
        if (data.saved && data.saved._id) {
          setSavedId(data.saved._id);
        }
      }
    } catch (err) {
      alert(err?.response?.data?.message || "AI script generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAI = async () => {
    if (!editedTitle.trim()) { alert("Please enter a title"); return; }
    if (!editedScript.trim()) { alert("Please enter a script"); return; }
    setSaving(true);
    try {
      if (savedId) {
        await axios.patch(
          `${API_BASE_URL}/api/ugc-prompter/${savedId}`,
          {
            title: editedTitle,
            script: editedScript,
            prompt: editedInstructions,
            platform,
            category: generated.category || "testimonial",
            tone: generated.tone || "casual",
            duration: Number(generated.duration || 30),
          },
          { headers: authHeaders() }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/api/ugc-prompter`,
          {
            title: editedTitle,
            platform,
            category: generated.category || "testimonial",
            tone: generated.tone || "casual",
            duration: Number(generated.duration || 30),
            prompt: editedInstructions,
            script: editedScript,
            isAiGenerated: true,
          },
          { headers: authHeaders() }
        );
      }
      alert("Script saved successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManual = async () => {
    if (!manualTitle.trim()) { alert("Please enter a script title"); return; }
    if (!manualScript.trim()) { alert("Please enter a script script"); return; }
    setSaving(true);
    try {
      if (savedId) {
        await axios.patch(
          `${API_BASE_URL}/api/ugc-prompter/${savedId}`,
          {
            title: manualTitle,
            platform: manualPlatform,
            category: manualCategory,
            tone: manualTone,
            duration: Number(manualDuration),
            prompt: manualInstructions,
            script: manualScript,
          },
          { headers: authHeaders() }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/api/ugc-prompter`,
          {
            title: manualTitle,
            platform: manualPlatform,
            category: manualCategory,
            tone: manualTone,
            duration: Number(manualDuration),
            prompt: manualInstructions,
            script: manualScript,
            isAiGenerated: false,
          },
          { headers: authHeaders() }
        );
      }
      alert("Manual script saved successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save script");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Header with Back Button on Left */}
      <div className="flex flex-col gap-4 pb-5 border-b border-gray-250">
        <button
          onClick={onClose}
          className="self-start flex items-center gap-1.5 text-sm font-bold text-slate-650 hover:text-orange-600 transition-all focus:outline-none"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <FaMagic className="text-orange-500" /> {editScript ? "Edit UGC Script" : "UGC Script Creator"}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {editScript ? "Update your saved UGC script content" : "Generate customized scripts with AI or write manually"}
          </p>
        </div>
      </div>

      {/* Main Content Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {!generated ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all focus:outline-none ${
                  activeTab === "ai"
                    ? "border-orange-500 text-orange-650"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                ✨ AI Script Generator
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all focus:outline-none ${
                  activeTab === "manual"
                    ? "border-orange-500 text-orange-655"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                ✍️ Write Manually
              </button>
            </div>

            {activeTab === "ai" ? (
              /* AI Form */
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Topic or Product *</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Hydrating sunscreen, Protein powder..."
                    className="w-full border border-slate-205 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Platform</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: "instagram", label: "Instagram", icon: <FaInstagram className="text-orange-500" /> },
                      { val: "youtube", label: "YouTube", icon: <FaYoutube className="text-orange-500" /> },
                      { val: "both", label: "Both", icon: <span className="text-[10px] font-bold text-orange-600">IG+YT</span> },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setPlatform(item.val)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1 focus:outline-none ${
                          platform === item.val
                            ? "border-orange-500 bg-orange-50/50 text-orange-700 font-bold"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {item.icon}
                        <span className="text-xs">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating || !topic.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold shadow-md shadow-orange-100 hover:brightness-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none"
                  >
                    {generating ? (
                      <>
                        <FaSpinner className="animate-spin" size={16} /> Generating Script...
                      </>
                    ) : (
                      <>
                        <FaMagic /> Generate Script with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Manual Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-555 uppercase tracking-wider mb-2">Script Title *</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g., Skincare glow-up testimonial"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-555 uppercase tracking-wider mb-2">Platform</label>
                    <select
                      value={manualPlatform}
                      onChange={(e) => setManualPlatform(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 bg-white"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="both">Both (IG + YT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-555 uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 bg-white"
                    >
                      <option value="testimonial">Testimonial</option>
                      <option value="demo">Demo</option>
                      <option value="unboxing">Unboxing</option>
                      <option value="review">Review</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="lifestyle">Lifestyle</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-555 uppercase tracking-wider mb-2">Tone</label>
                    <select
                      value={manualTone}
                      onChange={(e) => setManualTone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 bg-white"
                    >
                      <option value="casual">Casual</option>
                      <option value="professional">Professional</option>
                      <option value="energetic">Energetic</option>
                      <option value="funny">Funny</option>
                      <option value="emotional">Emotional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-555 uppercase tracking-wider mb-2">Duration (Seconds)</label>
                    <input
                      type="number"
                      value={manualDuration}
                      onChange={(e) => setManualDuration(e.target.value)}
                      min="5"
                      max="300"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-555 uppercase tracking-wider mb-2">Filming Instructions (Optional)</label>
                  <textarea
                    value={manualInstructions}
                    onChange={(e) => setManualInstructions(e.target.value)}
                    placeholder="• Speak directly to camera&#10;• Hold the product label facing forward"
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-555 uppercase tracking-wider mb-2">Script Body *</label>
                  <textarea
                    value={manualScript}
                    onChange={(e) => setManualScript(e.target.value)}
                    placeholder="[HOOK]&#10;I used to struggle with dry skin...&#10;&#10;[MAIN CONTENT]&#10;Then I started using product X...&#10;&#10;[CTA]&#10;Try it today at the link below!"
                    rows={8}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleSaveManual}
                    disabled={saving || !manualTitle.trim() || !manualScript.trim()}
                    className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none"
                  >
                    {saving ? (
                      <>
                        <FaSpinner className="animate-spin" size={14} /> Saving...
                      </>
                    ) : (
                      <>
                        <FaSave /> Save Script
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Editable Generated preview */
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white flex-shrink-0 mt-0.5 font-bold">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-bold text-orange-950">AI Script Draft Generated</h4>
                <p className="text-xs text-orange-700 mt-0.5">Customize, review, and edit the draft parameters below before committing to save.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-550 uppercase tracking-wider mb-2">Script Title</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-555 uppercase tracking-wider mb-2">Filming Instructions</label>
              <textarea
                value={editedInstructions}
                onChange={(e) => setEditedInstructions(e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-555 uppercase tracking-wider mb-2">Full Script Text</label>
              <textarea
                value={editedScript}
                onChange={(e) => setEditedScript(e.target.value)}
                rows={10}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-800 leading-relaxed focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { if (editScript) onClose(); else setGenerated(null); }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAI}
                disabled={saving || !editedTitle.trim() || !editedScript.trim()}
                className="flex-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold hover:brightness-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none"
              >
                {saving ? <FaSpinner className="animate-spin" size={14} /> : <FaCheck size={14} />}
                Save Script
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ClientUGCPrompterPage() {
  const [activeTab, setActiveTab] = useState("scripts");
  const [scripts, setScripts] = useState([]);
  const [loadingScripts, setLoadingScripts] = useState(true);
  const [viewScript, setViewScript] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [viewSubmission, setViewSubmission] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Show Inline Form View state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingScript, setEditingScript] = useState(null);

  // Active Dropdown state for card settings dropdown
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const [stats, setStats] = useState({
    totalScripts: 0,
    totalSubmissions: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const fetchScripts = useCallback(async () => {
    setLoadingScripts(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/ugc-prompter`, {
        headers: authHeaders(),
      });
      setScripts(data.prompts || []);
      setStats(prev => ({ ...prev, totalScripts: (data.prompts || []).length }));
    } catch (err) {
      console.error("Failed to fetch scripts:", err);
    } finally {
      setLoadingScripts(false);
    }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setLoadingSubmissions(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/ugc-video`, {
        headers: authHeaders(),
      });
      const videos = data.videos || [];
      setSubmissions(videos);
      setStats(prev => ({
        ...prev,
        totalSubmissions: videos.length,
        approved: videos.filter(v => v.status === "approved").length,
        pending: videos.filter(v => v.status === "pending").length,
        rejected: videos.filter(v => v.status === "rejected").length,
      }));
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    fetchScripts();
    fetchSubmissions();
  }, [fetchScripts, fetchSubmissions]);

  const handleDeleteScript = async (scriptId) => {
    if (!window.confirm("Are you sure you want to delete this script? This action cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/ugc-prompter/${scriptId}`, {
        headers: authHeaders(),
      });
      alert("Script deleted successfully!");
      fetchScripts();
      fetchSubmissions();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete script");
    }
  };

  const filteredSubmissions = filterStatus === "all"
    ? submissions
    : submissions.filter(s => s.status === filterStatus);

  // Close dropdown on click outside
  useEffect(() => {
    if (!activeDropdownId) return;
    const clickOutside = () => setActiveDropdownId(null);
    window.addEventListener("click", clickOutside);
    return () => window.removeEventListener("click", clickOutside);
  }, [activeDropdownId]);

  // If in Create Mode, render the full page creator form instead of list
  if (showCreateForm) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/20 p-6 sm:p-8 text-gray-900">
        <CreateScriptForm
          editScript={editingScript}
          onClose={() => { setShowCreateForm(false); setEditingScript(null); }}
          onSuccess={fetchScripts}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/20 p-6 sm:p-8 text-gray-900 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-250">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-orange-100">
                <FaRobot size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">UGC Script Dashboard</h1>
                <p className="text-slate-550 text-sm mt-0.5">Generate AI scripts and review creator video submissions</p>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={() => { setEditingScript(null); setShowCreateForm(true); }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold text-sm shadow-md shadow-orange-100 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none"
            >
              <FaPlus size={12} /> Generate Script
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Scripts", value: stats.totalScripts, border: "border-l-4 border-orange-500" },
            { label: "Submissions", value: stats.totalSubmissions, border: "border-l-4 border-amber-500" },
            { label: "Pending Review", value: stats.pending, border: "border-l-4 border-yellow-500" },
            { label: "Approved Videos", value: stats.approved, border: "border-l-4 border-emerald-500" },
            { label: "Rejected Videos", value: stats.rejected, border: "border-l-4 border-rose-500" }
          ].map((item, idx) => (
            <div key={idx} className={`bg-white rounded-2xl border border-slate-200 ${item.border} p-5 shadow-sm hover:shadow-md transition-all duration-200`}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-3xl font-black text-gray-805">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-200 gap-2">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("scripts")}
              className={`px-4 py-3 font-bold text-sm transition-all border-b-4 -mb-[2px] flex items-center gap-2 focus:outline-none ${
                activeTab === "scripts"
                  ? "border-orange-500 text-orange-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              📋 Scripts & Prompts ({stats.totalScripts})
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`px-4 py-3 font-bold text-sm transition-all border-b-4 -mb-[2px] flex items-center gap-2 focus:outline-none ${
                activeTab === "submissions"
                  ? "border-orange-500 text-orange-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              🎬 Submissions Review ({stats.totalSubmissions})
            </button>
          </div>
        </div>

        {/* Tab Contents: UGC Scripts */}
        {activeTab === "scripts" && (
          <div className="space-y-6">
            {loadingScripts ? (
              <div className="flex justify-center items-center py-20">
                <FaSpinner className="animate-spin text-orange-505" size={32} />
              </div>
            ) : scripts.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <FaRobot size={28} />
                </div>
                <h3 className="text-gray-800 font-bold text-lg mb-1">No scripts generated yet</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Create customized UGC scripts for creators. Generate with AI or write manually.</p>
                <button
                  onClick={() => { setEditingScript(null); setShowCreateForm(true); }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold text-sm hover:brightness-105 transition-all inline-flex items-center gap-2"
                >
                  <FaPlus size={10} /> Generate First Script
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scripts.map(script => (
                  <div key={script._id} className="bg-white rounded-2xl border border-slate-200 hover:border-orange-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-205 overflow-hidden flex flex-col justify-between p-6 relative">
                    
                    {/* Settings Dropdown Icon on top-right */}
                    <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveDropdownId(activeDropdownId === script._id ? null : script._id)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center focus:outline-none transition-all"
                        title="Actions"
                      >
                        <FaCog size={13} />
                      </button>
                      {activeDropdownId === script._id && (
                        <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden text-left py-1">
                          <button
                            onClick={() => { setActiveDropdownId(null); setViewScript(script); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 focus:outline-none"
                          >
                            <FaEye size={10} className="text-orange-500" /> View Details
                          </button>
                          <button
                            onClick={() => { setActiveDropdownId(null); setEditingScript(script); setShowCreateForm(true); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 focus:outline-none"
                          >
                            <FaSave size={10} className="text-orange-500" /> Edit Script
                          </button>
                          <button
                            onClick={() => { setActiveDropdownId(null); handleDeleteScript(script._id); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 focus:outline-none border-t border-slate-100"
                          >
                            <FaTrash size={10} /> Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 line-clamp-1 pr-8" title={script.title}>
                          {script.title}
                        </h3>
                        
                        {/* Meta Tags Row */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-orange-200 text-orange-700 bg-orange-50 uppercase">
                            {script.platform === "youtube" ? <FaYoutube size={10} /> : 
                             script.platform === "both" ? "IG+YT" : <FaInstagram size={10} />}
                            <span className="capitalize">{script.platform || "Instagram"}</span>
                          </span>
                          <span className="text-[10px] font-bold text-orange-850 bg-orange-50/30 border border-orange-100 px-2 py-0.5 rounded-md capitalize">
                            {script.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-550 bg-slate-100 px-2 py-0.5 rounded-md border border-dashed border-slate-200">
                            {script.duration}s
                          </span>
                        </div>

                        {script.script && (
                          <div className="bg-orange-50/20 rounded-xl p-3.5 border border-orange-100/50 font-mono mt-4">
                            <p className="text-[11px] font-bold text-orange-450 uppercase tracking-wider mb-1">Snippet Preview</p>
                            <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                              {script.script}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: Submissions */}
        {activeTab === "submissions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg font-bold text-gray-800">Creator Uploads</h2>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {["all", "pending", "approved", "rejected"].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all focus:outline-none ${
                      filterStatus === status
                        ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {status.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {loadingSubmissions ? (
              <div className="flex justify-center items-center py-20">
                <FaSpinner className="animate-spin text-orange-505" size={32} />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <FaFilm size={28} />
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-1">No submissions found</h3>
                <p className="text-slate-505 text-sm max-w-md mx-auto">There are no creator submissions matching the status filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubmissions.map(submission => (
                  <div key={submission._id} className="bg-white rounded-2xl border border-slate-200 hover:border-orange-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
                    
                    {/* Video Player */}
                    <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden border-b border-slate-200">
                      {submission.videoUrl ? (
                        <>
                          <video src={submission.videoUrl} className="w-full h-full object-cover" />
                          <button
                            onClick={() => window.open(submission.videoUrl, "_blank")}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 focus:outline-none"
                          >
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25 transform scale-90 group-hover:scale-100 transition-all">
                              <FaPlay size={18} className="translate-x-0.5" />
                            </div>
                          </button>
                        </>
                      ) : (
                        <div className="text-slate-500 text-center">
                          <FaFilm size={32} className="mx-auto mb-2 animate-pulse" />
                          <p className="text-xs">Processing Video...</p>
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-1">
                          {submission.promptId?.title || "Untitled Video"}
                        </h3>
                        <p className="text-xs text-slate-400 capitalize mt-0.5">{submission.promptId?.category || "UGC"}</p>
                        
                        {submission.note && (
                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 mt-3">
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">
                              "{submission.note}"
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className={`font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 text-[10px] border ${
                            submission.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-105" :
                            submission.status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-105" :
                            "bg-amber-50 text-amber-700 border-amber-105"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              submission.status === "approved" ? "bg-emerald-500" :
                              submission.status === "rejected" ? "bg-rose-500" :
                              "bg-amber-500"
                            }`}></span>
                            {submission.status}
                          </span>
                          <span className="text-slate-400">{new Date(submission.createdAt).toLocaleDateString()}</span>
                        </div>

                        <button
                          onClick={() => setViewSubmission(submission)}
                          className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-855 transition-all flex items-center justify-center gap-1 focus:outline-none"
                        >
                          <FaEye size={11} /> Review & Action
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {viewScript && <ViewScriptModal script={viewScript} onClose={() => setViewScript(null)} />}
      {viewSubmission && (
        <ViewSubmissionModal
          submission={viewSubmission}
          onClose={() => setViewSubmission(null)}
          onApprove={fetchSubmissions}
          onReject={fetchSubmissions}
        />
      )}
    </div>
  );
}
