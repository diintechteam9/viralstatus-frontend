import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  FaMagic, FaCopy, FaTimes, FaSave, FaTrash,
  FaRobot, FaEye, FaCheckCircle, FaClock, FaFilm, FaPlay,
  FaDownload, FaCheck, FaTimes as FaX, FaPlus, FaInstagram,
  FaYoutube, FaSpinner, FaUpload, FaCog,
} from "react-icons/fa";

// ── Auth helpers ──────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("clienttoken") ||
  sessionStorage.getItem("clienttoken") ||
  localStorage.getItem("admintoken") ||
  sessionStorage.getItem("admintoken");

const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

// ── User Role Resolution ──────────────────────────────────────────────────────
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

const getRole = () => {
  try {
    const clientData = JSON.parse(localStorage.getItem("clientData") || "{}");
    if (clientData.role) return clientData.role;
    const userData = JSON.parse(localStorage.getItem("mobileUserData") || "{}");
    return userData.role || "";
  } catch { return ""; }
};

// ── Video Upload Modal ────────────────────────────────────────────────────────
function VideoUploadModal({ promptId, promptTitle, onClose, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [note, setNote] = useState("");
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
    } else {
      alert("Please select a valid video file");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) { alert("Please select a video"); return; }
    setUploading(true);
    try {
      const uploadUrlRes = await axios.post(
        `${API_BASE_URL}/api/ugc-video/upload-url`,
        { promptId, fileName: selectedFile.name, contentType: selectedFile.type },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const { uploadUrl, key } = uploadUrlRes.data;
      await axios.put(uploadUrl, selectedFile, {
        headers: { "Content-Type": selectedFile.type },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded / e.total) * 100)),
      });
      await axios.post(
        `${API_BASE_URL}/api/ugc-video`,
        { promptId, videoKey: key, note },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      onSuccess();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-gray-900">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div>
            <p className="font-bold text-slate-805 text-sm">Upload Creator Video</p>
            <p className="text-slate-550 text-xs mt-0.5">{promptTitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-205 hover:bg-slate-300 text-slate-500 transition-all focus:outline-none">
            <FaTimes size={12} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-orange-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-orange-50/50 transition-all"
          >
            <FaUpload className="text-orange-500 mx-auto mb-2" size={24} />
            <p className="text-sm font-semibold text-slate-700">Click to select video</p>
            <p className="text-xs text-slate-400 mt-1">or drag and drop here</p>
            {selectedFile && <p className="text-xs text-emerald-655 mt-3 font-bold">✓ Selected: {selectedFile.name}</p>}
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-2">Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add any creator instructions or notes..." rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none" />
          </div>
          {uploading && (
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-orange-700">Uploading Video...</p>
                <p className="text-xs font-bold text-orange-600">{uploadProgress}%</p>
              </div>
              <div className="w-full h-2 bg-orange-150 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-155" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all focus:outline-none">
              Cancel
            </button>
            <button onClick={handleUpload} disabled={uploading || !selectedFile} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold text-sm hover:brightness-105 transition-all disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none">
              <FaUpload size={12} /> Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ p, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const copyAll = () => {
    const text = [
      p.title,
      p.prompt ? `\nInstructions:\n${p.prompt}` : "",
      p.script ? `\nScript:\n${p.script}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text);
    alert("Script content copied!");
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-gray-900 my-auto">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-6 flex items-center justify-between text-white border-b border-orange-100">
          <div>
            <p className="font-bold text-white text-xl">{p.title}</p>
            <p className="text-white/85 text-xs mt-1 capitalize">{p.platform || "Instagram"} • {p.category} • {p.duration}s • {p.tone}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyAll} className="flex items-center gap-1.5 text-xs text-orange-700 bg-white hover:bg-orange-50 px-3.5 py-2 rounded-xl font-bold shadow-sm transition-all focus:outline-none border border-orange-105">
              <FaCopy size={11} /> Copy All
            </button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all focus:outline-none">
              <FaTimes size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-8 space-y-6">
          {p.prompt && (
            <div>
              <p className="text-xs font-bold text-gray-550 uppercase tracking-wider mb-2">📋 Instructions</p>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{p.prompt}</p>
              </div>
            </div>
          )}
          {p.script && (
            <div>
              <p className="text-xs font-bold text-gray-555 uppercase tracking-wider mb-2">📝 Script</p>
              <div className="bg-orange-50/20 rounded-2xl p-6 border border-orange-100">
                <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap font-mono">{p.script}</p>
              </div>
            </div>
          )}
        </div>
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all">
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
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-6 flex items-center justify-between text-white border-b border-orange-105">
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
              <p className="text-sm text-gray-850 font-bold capitalize">{submission.promptId?.category || "UGC"}</p>
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

// ── Submission Table Row ────────────────────────────────────────────────────
function SubmissionRow({ index, submission, onView, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const patch = async (status) => {
    setLoading(true);
    setOpen(false);
    try {
      await axios.patch(`${API_BASE_URL}/api/ugc-video/${submission._id}`, { status }, { headers: authHeaders() });
      onRefresh();
    } catch (err) {
      alert(err?.response?.data?.message || 'Action failed');
    } finally { setLoading(false); }
  };

  const STATUS_CLS = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-xs text-slate-400">{index + 1}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {submission.videoUrl ? (
            <video src={submission.videoUrl} className="w-12 h-8 rounded object-cover bg-slate-200 shrink-0" muted />
          ) : (
            <div className="w-12 h-8 rounded bg-slate-200 shrink-0 flex items-center justify-center">
              <FaFilm size={12} className="text-slate-400" />
            </div>
          )}
          <span className="text-sm font-medium text-slate-800 truncate max-w-[160px]">
            {submission.promptId?.title || 'Untitled Video'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 capitalize">{submission.promptId?.category || 'UGC'}</td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate italic">
        {submission.note ? `"${submission.note}"` : '—'}
      </td>
      <td className="px-4 py-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CLS[submission.status] || STATUS_CLS.pending}`}>
          {submission.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
        {new Date(submission.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="relative inline-block" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 transition-colors"
          >
            <FaCog size={13} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-30 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden">
              <button onClick={() => { setOpen(false); onView(); }} className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <FaEye size={10} className="text-orange-500" /> View & Review
              </button>
              {submission.videoUrl && (
                <button onClick={() => { setOpen(false); window.open(submission.videoUrl, '_blank'); }} className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <FaPlay size={10} className="text-orange-500" /> Watch Video
                </button>
              )}
              {submission.status === 'pending' && (
                <>
                  <div className="border-t border-slate-100 my-1" />
                  <button onClick={() => patch('approved')} className="w-full px-4 py-2 text-left text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                    <FaCheck size={10} /> Approve
                  </button>
                  <button onClick={() => patch('rejected')} className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                    <FaX size={10} /> Reject
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
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
      {/* Header with Back button on Left */}
      <div className="flex flex-col gap-4 pb-5 border-b border-gray-250">
        <button 
          onClick={onClose} 
          className="self-start flex items-center gap-1.5 text-sm font-bold text-slate-655 hover:text-orange-600 transition-all focus:outline-none"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <FaMagic className="text-orange-500" /> {editScript ? "Edit UGC Script" : "UGC Script Creator"}
          </h2>
          <p className="text-slate-550 text-xs mt-0.5">
            {editScript ? "Update your saved UGC script content" : "Generate customized scripts with AI or write manually"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {!generated ? (
          <>
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
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-550 uppercase tracking-wider mb-2">Topic or Product *</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Hydrating sunscreen, Protein powder..."
                    className="w-full border border-slate-205 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-555 uppercase tracking-wider mb-2">Target Platform</label>
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
                    placeholder="[HOOK]&#10;I used to struggle with dry skin...&#10;&#10;[MAIN CONTENT]&#15;Then I started using product X...&#10;&#10;[CTA]&#10;Try it today at the link below!"
                    rows={8}
                    className="w-full border border-slate-205 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
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
export default function UGCPrompterTab() {
  const clientId = resolveClientId();
  const role = getRole();
  const isCreator = role === "mobileuser";

  const [prompts, setPrompts] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  const [activeTab, setActiveTab] = useState("scripts");
  const [viewItem, setViewItem] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPromptForUpload, setSelectedPromptForUpload] = useState(null);

  // Show Inline Form View state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingScript, setEditingScript] = useState(null);

  // Active Dropdown state for card settings dropdown
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [viewSubmission, setViewSubmission] = useState(null);

  const fetchPrompts = useCallback(async () => {
    if (!clientId) return;
    setLoadingPrompts(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/ugc-prompter`, {
        headers: authHeaders(),
      });
      setPrompts(data.prompts || []);
    } catch { }
    finally { setLoadingPrompts(false); }
  }, [clientId]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  const fetchUserVideos = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/ugc-video`, {
        headers: authHeaders(),
      });
      setUserVideos(data.videos || []);
    } catch { }
    finally { setLoadingVideos(false); }
  }, []);

  useEffect(() => { fetchUserVideos(); }, [fetchUserVideos]);

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Delete this video?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/ugc-video/${videoId}`, { headers: authHeaders() });
      fetchUserVideos();
    } catch { alert("Delete failed"); }
  };

  const handleDeleteScript = async (scriptId) => {
    if (!window.confirm("Are you sure you want to delete this script?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/ugc-prompter/${scriptId}`, {
        headers: authHeaders(),
      });
      alert("Script deleted successfully!");
      fetchPrompts();
      fetchUserVideos();
    } catch { alert("Failed to delete script"); }
  };

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
          onSuccess={fetchPrompts}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/20 p-6 sm:p-8 text-gray-900 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-orange-100">
                <FaRobot size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">UGC Script Generator</h1>
                <p className="text-slate-550 text-sm mt-0.5">Generate highly converting professional UGC scripts powered by AI</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-orange-500 p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">UGC Scripts Available</p>
            <p className="text-3xl font-black text-gray-800">{prompts.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Videos Submitted</p>
            <p className="text-3xl font-black text-gray-800">{userVideos.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Approved Submissions</p>
            <p className="text-3xl font-black text-emerald-600">{userVideos.filter(v => v.status === "approved").length}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 gap-2">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("scripts")}
              className={`px-4 py-3 font-bold text-sm transition-all border-b-4 -mb-[2px] flex items-center gap-2 focus:outline-none ${
                activeTab === "scripts"
                  ? "border-orange-500 text-orange-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              📋 Scripts & Prompts ({prompts.length})
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`px-4 py-3 font-bold text-sm transition-all border-b-4 -mb-[2px] flex items-center gap-2 focus:outline-none ${
                activeTab === "submissions"
                  ? "border-orange-500 text-orange-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              🎬 Uploaded UGC Videos ({userVideos.length})
            </button>
          </div>
        </div>

        {/* Tab 1: UGC Scripts */}
        {activeTab === "scripts" && (
          <div>
            {loadingPrompts ? (
              <div className="flex justify-center items-center py-20">
                <FaSpinner className="animate-spin text-orange-505" size={32} />
              </div>
            ) : prompts.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <FaRobot size={28} />
                </div>
                <h3 className="text-gray-800 font-bold text-lg mb-1">No scripts generated yet</h3>
                <p className="text-slate-550 text-sm max-w-md mx-auto mb-6">Create customized UGC scripts for creators. Generate with AI or write manually.</p>
                <button
                  onClick={() => { setEditingScript(null); setShowCreateForm(true); }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold text-sm hover:brightness-105 transition-all inline-flex items-center gap-2"
                >
                  <FaPlus size={10} /> Generate First Script
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prompts.map(p => (
                  <div key={p._id} className="bg-white rounded-2xl border border-slate-200 hover:border-orange-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between p-6 relative">
                    
                    {/* Settings Dropdown Icon on top-right */}
                    <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveDropdownId(activeDropdownId === p._id ? null : p._id)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-550 hover:text-slate-800 flex items-center justify-center focus:outline-none transition-all"
                        title="Actions"
                      >
                        <FaCog size={13} />
                      </button>
                      {activeDropdownId === p._id && (
                        <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden text-left py-1">
                          <button
                            onClick={() => { setActiveDropdownId(null); setViewItem(p); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 focus:outline-none"
                          >
                            <FaEye size={10} className="text-orange-500" /> View Details
                          </button>
                          <button
                            onClick={() => { setActiveDropdownId(null); setEditingScript(p); setShowCreateForm(true); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 focus:outline-none"
                          >
                            <FaSave size={10} className="text-orange-500" /> Edit Script
                          </button>
                          <button
                            onClick={() => { setActiveDropdownId(null); handleDeleteScript(p._id); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 focus:outline-none border-t border-slate-100"
                          >
                            <FaTrash size={10} /> Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 line-clamp-1 pr-8" title={p.title}>
                          {p.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-orange-200 text-orange-700 bg-orange-50 uppercase">
                            {p.platform === "youtube" ? <FaYoutube size={10} /> : 
                             p.platform === "both" ? "IG+YT" : <FaInstagram size={10} />}
                            <span className="capitalize">{p.platform || "Instagram"}</span>
                          </span>
                          <span className="text-[10px] font-bold text-orange-855 bg-orange-50/30 border border-orange-100 px-2 py-0.5 rounded-md capitalize">
                            {p.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-dashed border-slate-200">
                            {p.duration}s
                          </span>
                        </div>

                        {p.script && (
                          <div className="bg-orange-50/20 rounded-xl p-3.5 border border-orange-100/50 font-mono mt-4">
                            <p className="text-[11px] font-bold text-orange-405 uppercase tracking-wider mb-1">Snippet Preview</p>
                            <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                              {p.script}
                            </p>
                          </div>
                        )}
                      </div>

                      {isCreator && (
                        <div className="pt-2">
                          <button
                            onClick={() => { setSelectedPromptForUpload(p); setUploadModalOpen(true); }}
                            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                          >
                            <FaUpload size={11} /> Upload Video
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Submissions */}
        {activeTab === "submissions" && (
          <div>
            {loadingVideos ? (
              <div className="flex justify-center items-center py-20">
                <FaSpinner className="animate-spin text-orange-505" size={32} />
              </div>
            ) : userVideos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <FaFilm size={28} />
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-1">No videos uploaded yet</h3>
                <p className="text-slate-550 text-sm max-w-md mx-auto">Upload a creator submission video associated with a script from the scripts list.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['#', 'Title', 'Category', 'Note', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userVideos.map((v, i) => (
                      <SubmissionRow
                        key={v._id}
                        index={i}
                        submission={v}
                        onView={() => setViewSubmission(v)}
                        onRefresh={fetchUserVideos}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {viewItem && <ViewModal p={viewItem} onClose={() => setViewItem(null)} />}
      {viewSubmission && (
        <ViewSubmissionModal
          submission={viewSubmission}
          onClose={() => setViewSubmission(null)}
          onApprove={() => { fetchUserVideos(); fetchPrompts(); }}
          onReject={() => { fetchUserVideos(); fetchPrompts(); }}
        />
      )}
      {uploadModalOpen && selectedPromptForUpload && (
        <VideoUploadModal
          promptId={selectedPromptForUpload._id}
          promptTitle={selectedPromptForUpload.title}
          onClose={() => { setUploadModalOpen(false); setSelectedPromptForUpload(null); }}
          onSuccess={() => { fetchUserVideos(); fetchPrompts(); }}
        />
      )}
    </div>
  );
}
