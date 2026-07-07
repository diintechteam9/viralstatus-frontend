import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  FaMagic, FaCopy, FaTimes, FaUpload, FaPlay, FaDownload,
  FaRobot, FaEye, FaCheckCircle, FaClock, FaFilm, FaArrowRight,
} from "react-icons/fa";

// ── Auth helpers ──────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("mobileUserToken") ||
  sessionStorage.getItem("mobileUserToken");

const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

// ── View Script Modal ────────────────────────────────────────────────────────
function ViewScriptModal({ prompt, onClose, onUpload }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const copyScript = () => {
    const text = `${prompt.title}\n\nCategory: ${prompt.category}\nDuration: ${prompt.duration}s\nTone: ${prompt.tone}\n\n${prompt.script}`;
    navigator.clipboard.writeText(text);
    alert("Script copied to clipboard!");
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex justify-center p-4 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-yellow-400 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">{prompt.title}</h2>
            <p className="text-white/80 text-sm mt-1">{prompt.category} • {prompt.duration}s • {prompt.tone}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8 space-y-8">
          {/* Script Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">📝</span> Your Script
              </h3>
              <button
                onClick={copyScript}
                className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold px-3 py-2 rounded-lg border border-orange-200 hover:bg-orange-50 transition"
              >
                <FaCopy size={14} /> Copy
              </button>
            </div>
            <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200">
              <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap font-mono">{prompt.script}</p>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span> Tips for Recording
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-orange-500 font-bold">•</span>
                <span className="text-gray-700">Find a well-lit area with natural light</span>
              </li>
              <li className="flex gap-3">
                <span className="text-orange-500 font-bold">•</span>
                <span className="text-gray-700">Hold the product clearly in frame</span>
              </li>
              <li className="flex gap-3">
                <span className="text-orange-500 font-bold">•</span>
                <span className="text-gray-700">Speak naturally and with energy</span>
              </li>
              <li className="flex gap-3">
                <span className="text-orange-500 font-bold">•</span>
                <span className="text-gray-700">Keep it under {prompt.duration} seconds</span>
              </li>
              <li className="flex gap-3">
                <span className="text-orange-500 font-bold">•</span>
                <span className="text-gray-700">Use good audio quality</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition"
          >
            Close
          </button>
          <button
            onClick={onUpload}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <FaUpload size={16} /> Upload Video
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Video Upload Modal ────────────────────────────────────────────────────────
function VideoUploadModal({ prompt, onClose, onSuccess }) {
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
        { promptId: prompt._id, fileName: selectedFile.name, contentType: selectedFile.type },
        { headers: authHeaders() }
      );
      const { uploadUrl, key } = uploadUrlRes.data;
      await axios.put(uploadUrl, selectedFile, {
        headers: { "Content-Type": selectedFile.type },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded / e.total) * 100)),
      });
      await axios.post(
        `${API_BASE_URL}/api/ugc-video`,
        { promptId: prompt._id, videoKey: key, note },
        { headers: authHeaders() }
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex justify-center p-4 bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto">
        <div className="bg-gradient-to-r from-green-500 to-emerald-400 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Upload Your Video</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition">
            <FaTimes size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-3 border-dashed border-orange-300 rounded-2xl p-8 text-center cursor-pointer hover:bg-orange-50 transition"
          >
            <FaUpload className="text-orange-500 mx-auto mb-3" size={32} />
            <p className="text-base font-bold text-gray-700">Click to select video</p>
            <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
            {selectedFile && <p className="text-sm text-green-600 mt-3 font-bold">✓ {selectedFile.name}</p>}
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Add a Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., First take, Natural lighting, Morning shoot..."
              rows={3}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>

          {uploading && (
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-blue-700">Uploading...</p>
                <p className="text-sm font-bold text-blue-600">{uploadProgress}%</p>
              </div>
              <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition">
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <FaUpload size={14} /> Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserUGCPrompterPage() {
  const [prompts, setPrompts] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [userVideos, setUserVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const [viewScriptPrompt, setViewScriptPrompt] = useState(null);
  const [uploadPrompt, setUploadPrompt] = useState(null);

  const fetchPrompts = useCallback(async () => {
    setLoadingPrompts(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/ugc-prompter`, {
        headers: authHeaders(),
      });
      setPrompts(data.prompts || []);
    } catch (err) {
      console.error("Failed to fetch prompts:", err);
    } finally {
      setLoadingPrompts(false);
    }
  }, []);

  const fetchUserVideos = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/ugc-video`, {
        headers: authHeaders(),
      });
      setUserVideos(data.videos || []);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
    fetchUserVideos();
  }, [fetchPrompts, fetchUserVideos]);

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Delete this video submission?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/ugc-video/${videoId}`, { headers: authHeaders() });
      fetchUserVideos();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center">
              <FaRobot className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">UGC Opportunities</h1>
              <p className="text-gray-600 text-sm mt-1">Create videos from scripts and earn rewards</p>
            </div>
          </div>
        </div>

        {/* Available Scripts Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📋 Available Scripts</h2>
            <span className="text-sm font-bold text-white bg-orange-500 px-4 py-2 rounded-full">{prompts.length} Scripts</span>
          </div>

          {loadingPrompts ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : prompts.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
              <FaRobot className="text-gray-300 mx-auto mb-3" size={40} />
              <p className="text-gray-600 font-semibold">No scripts available yet</p>
              <p className="text-sm text-gray-500 mt-1">Check back soon for new opportunities</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prompts.map(p => (
                <div key={p._id} className="bg-white rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-xl transition-all overflow-hidden group">
                  <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-yellow-400" />

                  <div className="p-6">
                    {/* Title & Category */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-bold text-white bg-orange-500 px-3 py-1 rounded-full">{p.category}</span>
                      <span className="text-xs text-gray-600 font-semibold">{p.duration}s</span>
                      <span className="text-xs text-gray-600 font-semibold">• {p.tone}</span>
                    </div>

                    {/* Script Preview */}
                    {p.script && (
                      <div className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
                        <p className="text-xs font-bold text-orange-600 mb-2">Script Preview</p>
                        <p className="text-sm text-gray-700 line-clamp-4 leading-relaxed">{p.script.slice(0, 150)}...</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setViewScriptPrompt(p)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-50 text-orange-600 font-bold text-sm hover:bg-orange-100 transition border-2 border-orange-200"
                      >
                        <FaEye size={14} /> View Script
                      </button>
                      <button
                        onClick={() => { setViewScriptPrompt(p); setTimeout(() => { setViewScriptPrompt(null); setUploadPrompt(p); }, 100); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 text-green-600 font-bold text-sm hover:bg-green-100 transition border-2 border-green-200"
                      >
                        <FaUpload size={14} /> Upload
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Submissions Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🎬 My Submissions</h2>
            <span className="text-sm font-bold text-white bg-blue-500 px-4 py-2 rounded-full">{userVideos.length} Videos</span>
          </div>

          {loadingVideos ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : userVideos.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
              <FaFilm className="text-gray-300 mx-auto mb-3" size={40} />
              <p className="text-gray-600 font-semibold">No submissions yet</p>
              <p className="text-sm text-gray-500 mt-1">Upload your first video from the scripts above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userVideos.map(v => (
                <div key={v._id} className="bg-white rounded-2xl border-2 border-gray-200 shadow-md overflow-hidden group">
                  {/* Video Thumbnail */}
                  <div className="relative bg-gray-900 aspect-video flex items-center justify-center overflow-hidden">
                    {v.videoUrl ? (
                      <>
                        <video src={v.videoUrl} className="w-full h-full object-cover" />
                        <button
                          onClick={() => window.open(v.videoUrl, "_blank")}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition"
                        >
                          <FaPlay className="text-white" size={40} />
                        </button>
                      </>
                    ) : (
                      <div className="text-gray-400 text-center">
                        <FaFilm size={32} className="mx-auto mb-2" />
                        <p className="text-xs">Processing...</p>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{v.promptId?.title || "Untitled"}</h3>
                    <p className="text-xs text-gray-500 mb-3">{v.promptId?.category || "UGC"}</p>

                    {v.note && (
                      <div className="bg-gray-50 rounded-lg p-2 mb-3 border border-gray-200">
                        <p className="text-xs text-gray-600 line-clamp-2">{v.note}</p>
                      </div>
                    )}

                    {/* Status & Date */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                        v.status === "approved" ? "bg-green-100 text-green-700" :
                        v.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {v.status === "approved" ? <FaCheckCircle size={10} /> : <FaClock size={10} />}
                        {v.status?.charAt(0).toUpperCase() + v.status?.slice(1) || "Pending"}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {v.videoUrl && (
                        <a
                          href={v.videoUrl}
                          download
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition"
                        >
                          <FaDownload size={11} /> Download
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteVideo(v._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition"
                      >
                        <FaTimes size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">ℹ️</span> How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <p className="font-bold text-gray-900">View Scripts</p>
                <p className="text-sm text-gray-600 mt-1">Browse available UGC scripts and read the full details</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <p className="font-bold text-gray-900">Record Video</p>
                <p className="text-sm text-gray-600 mt-1">Follow the script and record your UGC video</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <p className="font-bold text-gray-900">Submit & Earn</p>
                <p className="text-sm text-gray-600 mt-1">Upload your video and track approval status</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewScriptPrompt && (
        <ViewScriptModal
          prompt={viewScriptPrompt}
          onClose={() => setViewScriptPrompt(null)}
          onUpload={() => { setViewScriptPrompt(null); setUploadPrompt(viewScriptPrompt); }}
        />
      )}
      {uploadPrompt && (
        <VideoUploadModal
          prompt={uploadPrompt}
          onClose={() => setUploadPrompt(null)}
          onSuccess={() => { setUploadPrompt(null); fetchUserVideos(); }}
        />
      )}
    </div>
  );
}
