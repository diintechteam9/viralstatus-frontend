import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  FaMagic, FaCopy, FaTimes, FaSave, FaTrash,
  FaRobot, FaEye, FaCheckCircle, FaClock, FaFilm, FaPlay,
  FaDownload, FaCheck, FaTimes as FaX, FaPlus, FaInstagram,
  FaYoutube, FaSpinner, FaUpload, FaCog, FaExclamationTriangle,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
// ── Auth helpers ──────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("clienttoken") ||
  sessionStorage.getItem("clienttoken") ||
  localStorage.getItem("admintoken") ||
  sessionStorage.getItem("admintoken");

const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const STATUS_CONFIGS = {
  pending:   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/70', label: 'Pending' },
  submitted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/70', label: 'Submitted' },
  edited:    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200/70', label: 'Edited' },
  approved:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/70', label: 'Approved' },
  objection: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/70', label: 'Objection' },
  rejected:  { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200/70', label: 'Rejected' },
};

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

// ── Video Preview Modal ──────────────────────────────────────────────────────
function VideoPreviewModal({ videoUrl, title, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex justify-center p-4 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative my-auto w-full max-w-sm aspect-[9/16] h-[80vh] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        <video
          src={videoUrl}
          className="w-full h-full object-cover"
          autoPlay
          controls
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all focus:outline-none z-10"
        >
          <FaTimes size={16} />
        </button>
        {title && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white pointer-events-none">
            <p className="font-bold text-sm tracking-wide line-clamp-1">{title}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Processing Status Modal ────────────────────────────────────────────────
function AIProcessingStatusModal({ submission, onClose, onDone }) {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/ugc-video/${submission._id}/status`, {
        headers: authHeaders()
      });
      setStatusData(data);
      setLoading(false);
      if (data.processingStatus === 'completed' || data.processingStatus === 'failed') {
        clearInterval(intervalRef.current);
        if (data.processingStatus === 'completed') onDone?.();
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [submission._id, onDone]);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchStatus]);

  const ps = statusData?.processingStatus || 'uploading';
  const progress = statusData?.processingProgress || 0;
  const isDone = ps === 'completed' || ps === 'failed';

  const STEPS = [
    { key: 'uploading',  label: 'Uploading to AI server' },
    { key: 'processing', label: 'AI enhancing your video' },
    { key: 'completed',  label: 'Videos ready' },
  ];
  const stepOrder = ['uploading', 'processing', 'completed'];
  const currentIdx = ps === 'failed' ? 1 : stepOrder.indexOf(ps);

  const barWidth = ps === 'completed' ? 100
    : ps === 'failed'    ? 0
    : ps === 'processing' ? Math.max(progress, 10)
    : 5;

  const headerColor = ps === 'completed' ? 'from-emerald-500 to-green-400'
    : ps === 'failed'    ? 'from-rose-500 to-red-400'
    : 'from-orange-500 to-yellow-400';

  const headerLabel = ps === 'completed' ? 'Processing Complete! 🎉'
    : ps === 'failed'    ? 'Processing Failed'
    : ps === 'uploading' ? 'Uploading to AI...'
    : `AI Processing... ${progress > 0 ? progress + '%' : ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${headerColor} px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              {ps === 'completed' ? <FaCheckCircle size={18} />
                : ps === 'failed' ? <FaExclamationTriangle size={18} />
                : <FaSpinner size={18} className="animate-spin" />}
            </div>
            <div>
              <p className="text-white font-bold text-base">AI Processing Pipeline</p>
              <p className="text-white/80 text-xs mt-0.5">{headerLabel}</p>
            </div>
          </div>
          {isDone && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition focus:outline-none">
              <FaTimes size={14} />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5 text-slate-800">
          {loading ? (
            <div className="flex justify-center py-10">
              <FaSpinner className="animate-spin text-orange-500" size={24} />
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              {!isDone && (
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-655 mb-2">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-700 rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Step Tracker */}
              <div className="space-y-2">
                {STEPS.map((step, i) => {
                  const done   = i < currentIdx || ps === 'completed';
                  const active = i === currentIdx && !isDone;
                  const failed = ps === 'failed' && i === 1;
                  return (
                    <div key={step.key} className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                      failed ? 'bg-rose-50 border-rose-200'
                      : done   ? 'bg-emerald-50 border-emerald-200'
                      : active ? 'bg-orange-50 border-orange-200'
                      : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        failed ? 'bg-rose-500 text-white'
                        : done   ? 'bg-emerald-500 text-white'
                        : active ? 'bg-orange-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                      }`}>
                        {failed ? <FaTimes size={10} />
                          : done ? <FaCheckCircle size={10} />
                          : active ? <FaSpinner size={10} className="animate-spin" />
                          : i + 1}
                      </div>
                      <span className={`text-sm font-semibold ${
                        failed ? 'text-rose-700'
                        : done   ? 'text-emerald-700'
                        : active ? 'text-orange-700'
                        : 'text-slate-400'
                      }`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Completed — show video links */}
              {ps === 'completed' && (statusData?.processedVideoUrl || statusData?.viralVideoUrl) && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Output Videos</p>
                  {statusData.processedVideoUrl && (
                    <a href={statusData.processedVideoUrl} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-blue-50 border-2 border-blue-200 text-blue-700 font-bold text-sm hover:bg-blue-100 transition">
                      <span className="flex items-center gap-2"><FaPlay size={11} /> AI Edited Video</span>
                      <FaDownload size={11} />
                    </a>
                  )}
                  {statusData.viralVideoUrl && (
                    <a href={statusData.viralVideoUrl} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-orange-50 border-2 border-orange-200 text-orange-700 font-bold text-sm hover:bg-orange-100 transition">
                      <span className="flex items-center gap-2"><FaPlay size={11} /> Viral Version</span>
                      <FaDownload size={11} />
                    </a>
                  )}
                </div>
              )}

              {/* Failed */}
              {ps === 'failed' && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 text-center">
                  <p className="text-rose-700 font-semibold text-sm">AI processing failed. Original video is still saved.</p>
                </div>
              )}

              {/* Note while processing */}
              {!isDone && (
                <p className="text-center text-xs text-slate-400">This may take a few minutes. You can close and check back later.</p>
              )}

              {isDone && (
                <button onClick={onClose}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-bold hover:shadow-lg transition">
                  Done
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Objection Modal ──────────────────────────────────────────────────────────
function ObjectionModal({ video, onClose, onSuccess }) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!notes.trim()) { alert("Please enter objection notes"); return; }
    setSubmitting(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/ugc-video/${video._id}/objection`,
        { objectionNotes: notes },
        { headers: authHeaders() }
      );
      toast.success("Objection submitted successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit objection");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-gray-900">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div>
            <p className="font-bold text-slate-805 text-sm">Raise Objection / Re-record Request</p>
            <p className="text-slate-550 text-xs mt-0.5">Request modifications from creator</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-205 hover:bg-slate-300 text-slate-500 transition-all focus:outline-none">
            <FaTimes size={12} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-2">Objection Details *</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide clear reasons/instructions for the creator to re-record or fix (e.g., audio sync issues, poor lighting, pronunciation)..."
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none font-sans"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all focus:outline-none">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting || !notes.trim()} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none">
              {submitting ? <FaSpinner className="animate-spin" size={12} /> : <FaExclamationTriangle size={12} />} Raise Objection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edited Video Upload Modal ────────────────────────────────────────────────
function EditedVideoUploadModal({ video, onClose, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    if (!selectedFile) { alert("Please select an edited video"); return; }
    setUploading(true);
    try {
      const promptId = video.promptId?._id || video.promptId;
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
      await axios.patch(
        `${API_BASE_URL}/api/ugc-video/${video._id}/edited`,
        { videoKey: key },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success("Edited video uploaded successfully!");
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
            <p className="font-bold text-slate-805 text-sm">Upload Edited Video</p>
            <p className="text-slate-550 text-xs mt-0.5">Submit final edited version for approval</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-205 hover:bg-slate-300 text-slate-500 transition-all focus:outline-none">
            <FaTimes size={12} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-205 rounded-2xl p-8 text-center cursor-pointer hover:bg-indigo-50/50 transition-all"
          >
            <FaFilm className="text-indigo-500 mx-auto mb-2" size={24} />
            <p className="text-sm font-semibold text-slate-700">Click to select edited video</p>
            <p className="text-xs text-slate-400 mt-1">or drag and drop here</p>
            {selectedFile && <p className="text-xs text-emerald-655 mt-3 font-bold">✓ Selected: {selectedFile.name}</p>}
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
          </div>
          {uploading && (
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-indigo-700">Uploading Video...</p>
                <p className="text-xs font-bold text-indigo-600">{uploadProgress}%</p>
              </div>
              <div className="w-full h-2 bg-indigo-150 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 transition-all duration-155" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all focus:outline-none">
              Cancel
            </button>
            <button onClick={handleUpload} disabled={uploading || !selectedFile} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold text-sm hover:brightness-105 transition-all disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none">
              <FaUpload size={12} /> Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Workflow Settings Modal ──────────────────────────────────────────────────
function WorkflowSettingsModal({ prompt, video, onClose, onSuccess }) {
  const [recording, setRecording] = useState(video?.autoApprovalSettings?.recording || prompt?.autoApprovalSettings?.recording || false);
  const [editingRequest, setEditingRequest] = useState(video?.autoApprovalSettings?.editingRequest || prompt?.autoApprovalSettings?.editingRequest || false);
  const [finalEditedVideo, setFinalEditedVideo] = useState(video?.autoApprovalSettings?.finalEditedVideo || prompt?.autoApprovalSettings?.finalEditedVideo || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const autoApprovalSettings = { recording, editingRequest, finalEditedVideo };
      await axios.patch(
        `${API_BASE_URL}/api/ugc-prompter/${prompt._id}`,
        { autoApprovalSettings },
        { headers: authHeaders() }
      );
      if (video) {
        await axios.patch(
          `${API_BASE_URL}/api/ugc-video/${video._id}/settings`,
          { autoApprovalSettings },
          { headers: authHeaders() }
        );
      }
      toast.success("Workflow settings updated successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update workflow settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-gray-900">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div>
            <p className="font-bold text-slate-805 text-sm">Workflow Approval Settings</p>
            <p className="text-slate-550 text-xs mt-0.5">Configure Auto vs Manual approval</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-205 hover:bg-slate-300 text-slate-500 transition-all focus:outline-none">
            <FaTimes size={12} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50/50 transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={recording}
                onChange={(e) => setRecording(e.target.checked)}
                className="w-5 h-5 rounded text-orange-500 border-slate-305 focus:ring-orange-500 mt-0.5"
              />
              <div>
                <p className="text-xs font-extrabold text-slate-800">Auto-Approve Raw Recording</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Automatically mark raw video submissions as approved when uploaded.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50/50 transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={editingRequest}
                onChange={(e) => setEditingRequest(e.target.checked)}
                className="w-5 h-5 rounded text-orange-500 border-slate-305 focus:ring-orange-500 mt-0.5"
              />
              <div>
                <p className="text-xs font-extrabold text-slate-800">Auto-Approve Editing Request</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Automatically accept send-to-editor actions without manual validation.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50/50 transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={finalEditedVideo}
                onChange={(e) => setFinalEditedVideo(e.target.checked)}
                className="w-5 h-5 rounded text-orange-500 border-slate-305 focus:ring-orange-500 mt-0.5"
              />
              <div>
                <p className="text-xs font-extrabold text-slate-800">Auto-Approve Final Edited Video</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Automatically mark edited video as approved when editor uploads it.</p>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all focus:outline-none">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none">
              {saving ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />} Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ p, video, onClose, handleReviewAction }) {
  const videoRef = useRef(null);
  const [activeVideoTab, setActiveVideoTab] = useState(video?.editedVideoUrl ? "edited" : "raw");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const hasReviewActions = video && (video.videoUrl || video.editedVideoUrl) && ["submitted", "pending", "edited"].includes(video.status);
  const hasVideo = video && (video.videoUrl || video.editedVideoUrl);
  const activeUrl = activeVideoTab === "edited" ? video?.editedVideoUrl : video?.videoUrl;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-gray-900 my-auto">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-6 flex items-center justify-between text-white border-b border-orange-100">
          <div>
            <p className="font-bold text-white text-xl">{p.title}</p>
            <p className="text-white/85 text-xs mt-1 capitalize">{p.platform || "Instagram"} • {p.category} • {p.duration}s • {p.tone}</p>
          </div>
          <div className="flex items-center gap-3">
            {hasReviewActions && (
              <div className="flex gap-2 mr-2">
                <button
                  onClick={() => { handleReviewAction(video, "approved"); onClose(); }}
                  className="px-4 py-2 text-xs font-bold text-emerald-600 bg-white hover:bg-emerald-50 rounded-xl transition-all shadow-sm flex items-center gap-1.5 focus:outline-none"
                >
                  <FaCheck size={11} /> Approve
                </button>
                <button
                  onClick={() => { handleReviewAction(video, "rejected"); onClose(); }}
                  className="px-4 py-2 text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 rounded-xl transition-all shadow-sm flex items-center gap-1.5 focus:outline-none"
                >
                  <FaTimes size={11} /> Reject
                </button>
              </div>
            )}
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all focus:outline-none">
              <FaTimes size={18} />
            </button>
          </div>
        </div>
        
        <div className={`overflow-y-auto flex-1 p-8 ${hasVideo ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "space-y-6"}`}>
          {/* Left Side: Script and details */}
          <div className="space-y-6">
            {p.brandName && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">🏷️ Brand / Product</p>
                <p className="text-sm font-semibold text-slate-800 capitalize bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 inline-block">
                  {p.brandName} {p.productName ? `• ${p.productName}` : ""}
                </p>
              </div>
            )}
            {p.prompt && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">📋 Instructions</p>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <p className="text-sm text-slate-705 leading-relaxed whitespace-pre-wrap">{p.prompt}</p>
                </div>
              </div>
            )}
            {p.script && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">📝 Script</p>
                <div className="bg-orange-50/10 rounded-2xl p-6 border border-orange-100">
                  <p className="text-sm md:text-base text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">{p.script}</p>
                </div>
              </div>
            )}
            {video?.objectionNotes && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5 uppercase">
                  <FaExclamationTriangle size={11} /> Client Objection Reason
                </p>
                <p className="text-xs text-rose-900 mt-1.5 font-medium leading-relaxed whitespace-pre-wrap">{video.objectionNotes}</p>
              </div>
            )}
          </div>

          {/* Right Side: UGC Video submission */}
          {hasVideo && (
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    🎥 {activeVideoTab === "edited" ? "Final Edited Video" : "Raw User Recording"}
                  </p>
                  {video.editedVideoUrl && (
                    <div className="flex border border-slate-200 rounded-lg overflow-hidden text-[10px] font-bold shadow-sm">
                      <button
                        onClick={() => setActiveVideoTab("raw")}
                        className={`px-2.5 py-1 ${activeVideoTab === "raw" ? "bg-orange-500 text-white" : "bg-white text-slate-650 hover:bg-slate-50"}`}
                      >
                        Raw
                      </button>
                      <button
                        onClick={() => setActiveVideoTab("edited")}
                        className={`px-2.5 py-1 ${activeVideoTab === "edited" ? "bg-orange-500 text-white" : "bg-white text-slate-650 hover:bg-slate-50"}`}
                      >
                        Edited
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative bg-slate-950 aspect-[9/16] h-[380px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 mx-auto">
                  <video
                    ref={videoRef}
                    key={activeUrl}
                    src={activeUrl}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      if (videoRef.current) {
                        if (videoRef.current.paused) {
                          videoRef.current.play();
                        } else {
                          videoRef.current.pause();
                        }
                      }
                    }}
                    controls
                  />
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 w-full mt-2 space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Submission Details</p>
                  <div className="space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Status:</span>
                      <span className="uppercase text-indigo-650">{video.status}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Submitted:</span>
                      <span>{new Date(video.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-2.5">Automation Rules</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <div className="bg-white p-2 rounded-lg border border-slate-150 flex justify-between">
                      <span className="text-slate-500">Auto Recording:</span>
                      <span className={video.autoApprovalSettings?.recording ? "text-emerald-600" : "text-rose-500"}>
                        {video.autoApprovalSettings?.recording ? "ON" : "OFF"}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-150 flex justify-between">
                      <span className="text-slate-500">Auto Final:</span>
                      <span className={video.autoApprovalSettings?.finalEditedVideo ? "text-emerald-600" : "text-rose-500"}>
                        {video.autoApprovalSettings?.finalEditedVideo ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
  
  // Auto approval states
  const [autoApproveRecording, setAutoApproveRecording] = useState(editScript?.autoApprovalSettings?.recording || false);
  const [autoApproveEditing, setAutoApproveEditing] = useState(editScript?.autoApprovalSettings?.editingRequest || false);
  const [autoApproveFinal, setAutoApproveFinal] = useState(editScript?.autoApprovalSettings?.finalEditedVideo || false);

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
      const autoApprovalSettings = {
        recording: autoApproveRecording,
        editingRequest: autoApproveEditing,
        finalEditedVideo: autoApproveFinal
      };
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
            autoApprovalSettings,
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
            autoApprovalSettings,
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
      const autoApprovalSettings = {
        recording: autoApproveRecording,
        editingRequest: autoApproveEditing,
        finalEditedVideo: autoApproveFinal
      };
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
            autoApprovalSettings,
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
            autoApprovalSettings,
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

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-slate-550 uppercase tracking-wider mb-1">⚙️ Auto-Approval Workflow Settings</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoApproveRecording}
                        onChange={(e) => setAutoApproveRecording(e.target.checked)}
                        className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500"
                      />
                      Auto-Approve Recording
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoApproveEditing}
                        onChange={(e) => setAutoApproveEditing(e.target.checked)}
                        className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500"
                      />
                      Auto-Approve Editing
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoApproveFinal}
                        onChange={(e) => setAutoApproveFinal(e.target.checked)}
                        className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500"
                      />
                      Auto-Approve Final Video
                    </label>
                  </div>
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

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-550 uppercase tracking-wider mb-1">⚙️ Auto-Approval Workflow Settings</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApproveRecording}
                    onChange={(e) => setAutoApproveRecording(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500"
                  />
                  Auto-Approve Recording
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApproveEditing}
                    onChange={(e) => setAutoApproveEditing(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500"
                  />
                  Auto-Approve Editing
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApproveFinal}
                    onChange={(e) => setAutoApproveFinal(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500"
                  />
                  Auto-Approve Final Video
                </label>
              </div>
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

  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("newest");
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

  // Objection, edited upload and settings modals states
  const [objectionModalOpen, setObjectionModalOpen] = useState(false);
  const [selectedVideoForObjection, setSelectedVideoForObjection] = useState(null);

  const [editedUploadModalOpen, setEditedUploadModalOpen] = useState(false);
  const [selectedVideoForEditedUpload, setSelectedVideoForEditedUpload] = useState(null);

  const [workflowSettingsModalOpen, setWorkflowSettingsModalOpen] = useState(false);
  const [selectedPromptForWorkflowSettings, setSelectedPromptForWorkflowSettings] = useState(null);
  const [selectedVideoForWorkflowSettings, setSelectedVideoForWorkflowSettings] = useState(null);

  // Video preview popup state
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState("");
  const [statusPopupVideo, setStatusPopupVideo] = useState(null);

  const getNormalizedStatus = useCallback((status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "active" || s === "draft") return "pending";
    return s;
  }, []);

  const filteredPrompts = React.useMemo(() => {
    let result = [...prompts];

    // Status Tab Filter
    if (activeStatusTab !== "all") {
      result = result.filter(p => getNormalizedStatus(p.status) === activeStatusTab.toLowerCase());
    }

    // Category Filter
    if (selectedCategory !== "all") {
      result = result.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title?.toLowerCase().includes(q) || 
        (p.script && p.script.toLowerCase().includes(q)) ||
        (p.prompt && p.prompt.toLowerCase().includes(q))
      );
    }

    // Date Range Filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(p => new Date(p.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(p => new Date(p.createdAt) <= end);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === "duration") {
        return (a.duration || 0) - (b.duration || 0);
      }
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return 0;
    });

    return result;
  }, [prompts, activeStatusTab, selectedCategory, searchQuery, startDate, endDate, sortBy, getNormalizedStatus]);

  const getTabCount = useCallback((statusTab) => {
    if (statusTab === "all") return prompts.length;
    return prompts.filter(p => getNormalizedStatus(p.status) === statusTab.toLowerCase()).length;
  }, [prompts, getNormalizedStatus]);

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

  const handleReviewAction = useCallback(async (video, status) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/ugc-video/${video._id}`,
        { status },
        { headers: authHeaders() }
      );
      
      toast.success(`Submission marked as ${status} successfully!`);
      fetchPrompts();
      fetchUserVideos();

      if (status === "edited") {
        setStatusPopupVideo(video);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update submission");
    }
  }, [fetchPrompts, fetchUserVideos]);

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
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-orange-500 p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">UGC Scripts Available</p>
            <p className="text-3xl font-black text-gray-800">{prompts.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Videos Submitted</p>
            <p className="text-3xl font-black text-gray-800">{userVideos.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Videos Sent to Editor</p>
            <p className="text-3xl font-black text-indigo-600">{userVideos.filter(v => v.status === "edited").length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Approved Submissions</p>
            <p className="text-3xl font-black text-emerald-600">{userVideos.filter(v => v.status === "approved").length}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div 
          className="flex flex-nowrap gap-1.5 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar scroll-smooth px-1"
          style={{ msOverflowStyle: "none", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {[
            { val: "all", label: "All", icon: <FaRobot size={12} />, activeColor: "bg-orange-500 text-white shadow-md shadow-orange-100", inactiveColor: "hover:bg-slate-50 text-slate-600 hover:text-slate-800" },
            { val: "pending", label: "Pending", icon: <FaClock size={12} />, activeColor: "bg-amber-500 text-white shadow-md shadow-amber-100", inactiveColor: "hover:bg-slate-50 text-slate-600 hover:text-slate-800" },
            { val: "submitted", label: "Submitted", icon: <FaUpload size={12} />, activeColor: "bg-blue-600 text-white shadow-md shadow-blue-100", inactiveColor: "hover:bg-slate-50 text-slate-600 hover:text-slate-800" },
            { val: "edited", label: "Edited", icon: <FaSave size={12} />, activeColor: "bg-indigo-600 text-white shadow-md shadow-indigo-100", inactiveColor: "hover:bg-slate-50 text-slate-600 hover:text-slate-800" },
            { val: "approved", label: "Approved", icon: <FaCheckCircle size={12} />, activeColor: "bg-emerald-600 text-white shadow-md shadow-emerald-100", inactiveColor: "hover:bg-slate-50 text-slate-600 hover:text-slate-800" },
            { val: "objection", label: "Objection", icon: <FaExclamationTriangle size={12} />, activeColor: "bg-rose-600 text-white shadow-md shadow-rose-100", inactiveColor: "hover:bg-slate-50 text-slate-600 hover:text-slate-800" },
            { val: "rejected", label: "Rejected", icon: <FaTimes size={12} />, activeColor: "bg-slate-700 text-white shadow-md shadow-slate-100", inactiveColor: "hover:bg-slate-50 text-slate-600 hover:text-slate-800" },
          ].map((tab) => {
            const count = getTabCount(tab.val);
            const isActive = activeStatusTab === tab.val;
            return (
              <button
                key={tab.val}
                type="button"
                onClick={() => setActiveStatusTab(tab.val)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-150 flex items-center gap-1.5 focus:outline-none shrink-0 ${
                  isActive ? `${tab.activeColor} scale-[1.01]` : `${tab.inactiveColor} bg-white border border-slate-200/80 hover:border-slate-350`
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full transition-colors ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topic or script..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 bg-white"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 bg-white"
              >
                <option value="all">All Categories</option>
                <option value="testimonial">Testimonial</option>
                <option value="demo">Demo</option>
                <option value="unboxing">Unboxing</option>
                <option value="review">Review</option>
                <option value="tutorial">Tutorial</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="challenge">Challenge</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="duration">Duration</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 bg-white"
                />
              </div>
            </div>
          </div>
          
          {/* Reset Filters button if any filter is active */}
          {(searchQuery || selectedCategory !== "all" || startDate || endDate || sortBy !== "newest") && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setStartDate("");
                  setEndDate("");
                  setSortBy("newest");
                }}
                className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1.5 focus:outline-none"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Unified Cards Grid View */}
        {loadingPrompts ? (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-orange-500" size={32} />
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FaRobot size={28} />
            </div>
            <h3 className="text-gray-800 font-bold text-lg mb-1">No scripts found</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">No UGC scripts match your active filters or selected status tab.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50/60 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-550 uppercase tracking-wider w-12">#</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-550 uppercase tracking-wider">Script Title</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-550 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-550 uppercase tracking-wider">Video Recorded</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-550 uppercase tracking-wider">Edited Video</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-550 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-550 uppercase tracking-wider">Review Actions</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-550 uppercase tracking-wider w-16">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrompts.map((p, index) => {
                    const video = userVideos.find(v => (v.promptId?._id || v.promptId) === p._id);
                    const promptStatus = getNormalizedStatus(p.status);
                    const statusConfig = STATUS_CONFIGS[promptStatus.toLowerCase()] || STATUS_CONFIGS.pending;
                    const initialLetter = (p.title || "U").trim().charAt(0).toUpperCase();
                    
                    return (
                      <tr key={p._id} onClick={() => setViewItem(p)} className="hover:bg-slate-50/30 cursor-pointer transition-colors">
                        {/* Initial circle column */}
                        <td className="px-6 py-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-650 font-extrabold text-sm shadow-inner">
                            {initialLetter}
                          </div>
                        </td>

                        {/* Title & Brand info */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-bold text-slate-800 line-clamp-1" title={p.title}>{p.title}</div>
                            <div className="text-[11px] text-slate-400 font-bold capitalize mt-0.5">
                              {p.brandName ? `${p.brandName} • ` : ""}Since {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(p.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </div>
                          </div>
                        </td>

                        {/* Category & Duration */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-705 capitalize">{p.category}</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                              {p.duration}s • {p.tone}
                            </div>
                          </div>
                        </td>

                        {/* Video Submission status */}
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {video ? (
                            video.videoUrl ? (
                              <div
                                onClick={() => {
                                  setPreviewVideoUrl(video.videoUrl);
                                  setPreviewVideoTitle(`${p.title} (Raw)`);
                                }}
                                className="group relative w-28 aspect-video bg-slate-950 rounded-lg overflow-hidden shadow border border-slate-200 shrink-0 cursor-pointer hover:border-orange-500 transition-all duration-200"
                              >
                                <video src={video.videoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                  <div className="w-8 h-8 rounded-full bg-white/95 group-hover:bg-orange-500 text-slate-800 group-hover:text-white flex items-center justify-center shadow-md transform group-hover:scale-110 transition-all duration-250">
                                    <FaPlay size={10} className="ml-0.5" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-amber-500 font-bold italic animate-pulse">Processing...</span>
                            )
                          ) : (
                            isCreator ? (
                              (promptStatus === "pending" || promptStatus === "rejected" || promptStatus === "objection") ? (
                                <button
                                  onClick={() => { setSelectedPromptForUpload(p); setUploadModalOpen(true); }}
                                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 bg-white font-bold text-xs flex items-center gap-1 focus:outline-none transition-colors"
                                >
                                  <FaUpload size={10} /> Upload
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 font-semibold italic">—</span>
                              )
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold italic">Awaiting</span>
                            )
                          )}
                        </td>

                        {/* Edited Video Submission status */}
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {video && video.editedVideoUrl ? (
                            <div
                              onClick={() => {
                                  setPreviewVideoUrl(video.editedVideoUrl);
                                  setPreviewVideoTitle(`${p.title} (Edited)`);
                              }}
                              className="group relative w-28 aspect-video bg-slate-950 rounded-lg overflow-hidden shadow border border-slate-200 shrink-0 cursor-pointer hover:border-orange-500 transition-all duration-200"
                            >
                              <video src={video.editedVideoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-white/95 group-hover:bg-orange-500 text-slate-800 group-hover:text-white flex items-center justify-center shadow-md transform group-hover:scale-110 transition-all duration-250">
                                  <FaPlay size={10} className="ml-0.5" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold italic">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl border uppercase ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Approve/Reject review actions directly in row */}
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {video && video.videoUrl && (promptStatus === "submitted" || promptStatus === "pending" || promptStatus === "edited") ? (
                            <div className="flex flex-col gap-1.5 w-24 mx-auto">
                              <button
                                onClick={() => handleReviewAction(video, "approved")}
                                className="w-full px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors focus:outline-none flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <FaCheck size={9} /> Approve
                              </button>
                              <button
                                onClick={() => handleReviewAction(video, "rejected")}
                                className="w-full px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors focus:outline-none flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <FaTimes size={9} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">—</span>
                          )}
                        </td>

                        {/* Settings Dropdown */}
                        <td className="px-6 py-4">
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setActiveDropdownId(activeDropdownId === p._id ? null : p._id)}
                              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center focus:outline-none transition-colors bg-white hover:bg-slate-50"
                            >
                              <FaCog size={13} />
                            </button>
                            {activeDropdownId === p._id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-35 py-1 text-left">
                                {video && (video.status === "submitted" || video.status === "pending") && (
                                  <button
                                    onClick={() => { setActiveDropdownId(null); handleReviewAction(video, "edited"); }}
                                    className="w-full px-4 py-2 text-xs font-semibold text-indigo-650 hover:bg-indigo-50 flex items-center gap-2 focus:outline-none"
                                  >
                                    <FaSave size={10} /> Send to Editor
                                  </button>
                                )}
                                {video && (video.status === "submitted" || video.status === "edited") && (
                                  <button
                                    onClick={() => { setActiveDropdownId(null); setSelectedVideoForObjection(video); setObjectionModalOpen(true); }}
                                    className="w-full px-4 py-2 text-xs font-semibold text-rose-655 hover:bg-rose-50 flex items-center gap-2 focus:outline-none border-t border-slate-100"
                                  >
                                    <FaExclamationTriangle size={10} /> Raise Objection
                                  </button>
                                )}
                                {video && (video.status === "submitted" || video.status === "edited" || video.status === "objection") && (
                                  <button
                                    onClick={() => { setActiveDropdownId(null); setSelectedVideoForEditedUpload(video); setEditedUploadModalOpen(true); }}
                                    className="w-full px-4 py-2 text-xs font-semibold text-emerald-655 hover:bg-emerald-50 flex items-center gap-2 focus:outline-none border-t border-slate-100"
                                  >
                                    <FaUpload size={10} /> Upload Edited Video
                                  </button>
                                )}
                                {!isCreator && (
                                  <>
                                    <button
                                      onClick={() => { setActiveDropdownId(null); setSelectedPromptForWorkflowSettings(p); setSelectedVideoForWorkflowSettings(video); setWorkflowSettingsModalOpen(true); }}
                                      className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 focus:outline-none border-t border-slate-100"
                                    >
                                      <FaCog size={10} className="text-slate-500" /> Workflow Rules
                                    </button>
                                    <button
                                      onClick={() => { setActiveDropdownId(null); setEditingScript(p); setShowCreateForm(true); }}
                                      className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 focus:outline-none border-t border-slate-100"
                                    >
                                      <FaSave size={10} className="text-orange-500" /> Edit Script
                                    </button>
                                    <button
                                      onClick={() => { setActiveDropdownId(null); handleDeleteScript(p._id); }}
                                      className="w-full px-4 py-2 text-xs font-semibold text-rose-650 hover:bg-rose-50 flex items-center gap-2 focus:outline-none border-t border-slate-100"
                                    >
                                      <FaTrash size={10} /> Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewItem && (
        <ViewModal
          p={viewItem}
          video={userVideos.find(v => (v.promptId?._id || v.promptId) === viewItem._id)}
          onClose={() => setViewItem(null)}
          handleReviewAction={handleReviewAction}
        />
      )}
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
      {objectionModalOpen && selectedVideoForObjection && (
        <ObjectionModal
          video={selectedVideoForObjection}
          onClose={() => { setObjectionModalOpen(false); setSelectedVideoForObjection(null); }}
          onSuccess={() => { fetchUserVideos(); fetchPrompts(); }}
        />
      )}
      {editedUploadModalOpen && selectedVideoForEditedUpload && (
        <EditedVideoUploadModal
          video={selectedVideoForEditedUpload}
          onClose={() => { setEditedUploadModalOpen(false); setSelectedVideoForEditedUpload(null); }}
          onSuccess={() => { fetchUserVideos(); fetchPrompts(); }}
        />
      )}
      {workflowSettingsModalOpen && selectedPromptForWorkflowSettings && (
        <WorkflowSettingsModal
          prompt={selectedPromptForWorkflowSettings}
          video={selectedVideoForWorkflowSettings}
          onClose={() => { setWorkflowSettingsModalOpen(false); setSelectedPromptForWorkflowSettings(null); setSelectedVideoForWorkflowSettings(null); }}
          onSuccess={() => { fetchUserVideos(); fetchPrompts(); }}
        />
      )}
      {previewVideoUrl && (
        <VideoPreviewModal
          videoUrl={previewVideoUrl}
          title={previewVideoTitle}
          onClose={() => { setPreviewVideoUrl(null); setPreviewVideoTitle(""); }}
        />
      )}
      {statusPopupVideo && (
        <AIProcessingStatusModal
          submission={statusPopupVideo}
          onClose={() => { setStatusPopupVideo(null); fetchUserVideos(); }}
          onDone={() => { fetchUserVideos(); }}
        />
      )}
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
