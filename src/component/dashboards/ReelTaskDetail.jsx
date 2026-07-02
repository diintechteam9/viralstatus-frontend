import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { FaYoutube, FaInstagram, FaCopy, FaCheck, FaPaperPlane, FaArrowLeft, FaDownload, FaVideo } from "react-icons/fa";
import UserTaskActions from "./UserTaskActions";

function ReelTaskDetail({ task, onBack }) {
  const [shareUrl, setShareUrl] = useState("");
  const [sendStatus, setSendStatus] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ytConnected, setYtConnected] = useState(false);
  const [ytUploading, setYtUploading] = useState(false);
  const [ytTitle, setYtTitle] = useState(task?.campaignName || "Campaign Reel");

  // UGC state
  const [activeTab, setActiveTab] = useState("task"); // "task" | "ugc"
  const [ugcForm, setUgcForm] = useState(null);
  const [ugcSubmission, setUgcSubmission] = useState(null);
  const [ugcVideo, setUgcVideo] = useState(null);
  const [ugcUploading, setUgcUploading] = useState(false);
  const [ugcMsg, setUgcMsg] = useState("");
  const [tutorials, setTutorials] = useState([]);
  const [taskState, setTaskState] = useState(task);
  const [editUrl, setEditUrl] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState("");
  const [editStatus, setEditStatus] = useState(""); // "success" | "error"
  const [showEditBox, setShowEditBox] = useState(false);

  const userData = JSON.parse(localStorage.getItem("mobileUserData") || "{}");
  const userId = userData.googleId || localStorage.getItem("googleId");
  const token = localStorage.getItem("mobileUserToken");

  useEffect(() => {
    const checkYT = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/youtube/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setYtConnected(res.data?.connected || false);
      } catch { setYtConnected(false); }
    };
    if (token) checkYT();
  }, [token]);

  // Fetch UGC form + user's existing submission when task opens
  useEffect(() => {
    if (!task?.campaignId || !userId) return;
    const fetchUGC = async () => {
      try {
        const formRes = await fetch(`${API_BASE_URL}/api/ugc/form/${task.campaignId}/${userId}`);
        const formData = await formRes.json();
        if (formData.success && formData.form) setUgcForm(formData.form);
        if (formData.success) setUgcSubmission(formData.submission || null);
      } catch {}
    };
    fetchUGC();
  }, [task?.campaignId, userId]);

  const handleUGCUpload = async () => {
    if (!ugcVideo) { setUgcMsg("Please select a video file."); return; }
    setUgcUploading(true);
    setUgcMsg("");
    try {
      const fd = new FormData();
      fd.append("video", ugcVideo);
      fd.append("campaignId", task.campaignId);
      fd.append("userId", userId);
      const res = await fetch(`${API_BASE_URL}/api/ugc/submit`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setUgcSubmission(data.submission);
        setUgcMsg("✅ Testimonial video submitted!");
        setUgcVideo(null);
      } else {
        setUgcMsg(data.message || "Upload failed.");
      }
    } catch { setUgcMsg("Upload failed. Please try again."); }
    finally { setUgcUploading(false); }
  };

  useEffect(() => { setTaskState(task); }, [task]);

  useEffect(() => {
    const cat = task?.contentCategory || 'reels';
    fetch(`${API_BASE_URL}/api/reels-tutorials?category=${cat}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setTutorials(d.tutorials || []); })
      .catch(() => {});
  }, [task?.contentCategory]);

  if (!task) return <div className="p-8 text-center text-gray-500">No task data found.</div>;
  const activeTask = taskState || task;

  const handleCopy = () => {
    navigator.clipboard.writeText(task.s3Url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = task.s3Url;
    a.download = `${task.campaignName || "reel"}.mp4`;
    a.target = "_blank";
    a.click();
  };

  const handleYouTubeUpload = async () => {
    setYtUploading(true); setSendStatus(""); setSendMessage("");
    try {
      const videoRes = await fetch(task.s3Url);
      const blob = await videoRes.blob();
      const file = new File([blob], `${ytTitle}.mp4`, { type: "video/mp4" });
      const fd = new FormData();
      fd.append("video", file);
      fd.append("title", ytTitle);
      fd.append("description", `${task.campaignName} - Campaign Reel`);
      fd.append("privacy", "public");
      fd.append("isShort", "true");
      const res = await axios.post(`${API_BASE_URL}/api/youtube/upload`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      if (res.data?.success) {
        setShareUrl(res.data.url);
        setSendStatus("info");
        setSendMessage("✅ Uploaded to YouTube! URL auto-filled below. Click Submit to complete task.");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setSendStatus("error");
      setSendMessage(
        msg?.includes("NOT_CONNECTED") || msg?.includes("not connected")
          ? "YouTube not connected. Please connect YouTube in Accounts tab first."
          : msg || "YouTube upload failed."
      );
    } finally { setYtUploading(false); }
  };

  const handleSend = async () => {
    setSendStatus(""); setSendMessage("");
    if (!userId) { setSendStatus("error"); setSendMessage("User not logged in."); return; }
    if (!activeTask.isTaskAccepted) { setSendStatus("error"); setSendMessage("Please accept the task first."); return; }
    if (!shareUrl.trim()) { setSendStatus("error"); setSendMessage("Please paste your YouTube/Instagram video URL before submitting."); return; }
    setSending(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/pools/user/response/${userId}`,
        { url: shareUrl.trim(), campaignId: task.campaignId, reelId: task.reelId }
      );
      if (res.data?.success) {
        try { await axios.post(`${API_BASE_URL}/api/pools/shared/complete/${userId}/${task._id}`); } catch {}
        setSendStatus("success");
        setSendMessage("✅ URL submitted successfully! Your task is now under review.");
        setSubmitted(true);
        setShareUrl("");
      } else {
        setSendStatus("error"); setSendMessage(res.data?.error || "Failed to submit URL.");
      }
    } catch (err) {
      setSendStatus("error"); setSendMessage(err.response?.data?.error || "Failed to submit. Please try again.");
    } finally { setSending(false); }
  };

  const isCompleted = submitted || task.isTaskComplete || activeTask.TaskStatus === 'completed';
  const isUnderReview = activeTask.submissionStatus === 'pending_review' || activeTask.isUnderReview;
  const canEdit = activeTask.canEdit === true && !isCompleted;

  const handleEdit = async () => {
    setEditMsg(""); setEditStatus("");
    if (!editUrl.trim()) { setEditStatus("error"); setEditMsg("Please enter a valid URL."); return; }
    setEditLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/task/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reelId: task.reelId, campaignId: task.campaignId, url: editUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setEditStatus("success");
        setEditMsg("✅ Submission updated! It's back under review.");
        setTaskState(p => ({ ...p, ...data.updatedReel }));
        setShowEditBox(false);
        setEditUrl("");
      } else {
        setEditStatus("error"); setEditMsg(data.message || "Update failed.");
      }
    } catch { setEditStatus("error"); setEditMsg("Network error. Please try again."); }
    finally { setEditLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm text-sm font-medium">
            <FaArrowLeft size={12} /> Back
          </button>
          <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
        </div>

        {/* Accept / Cancel */}
        <UserTaskActions
          task={activeTask}
          userId={userId}
          onAccepted={(data) => setTaskState((p) => ({ ...p, ...data.updatedReel, isTaskAccepted: true, TaskStatus: 'accepted' }))}
          onCancelled={() => { onBack?.(); }}
        />

        {tutorials.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
            <h3 className="text-sm font-bold text-blue-900 mb-2">📚 Guides & Tutorials</h3>
            <div className="space-y-2">
              {tutorials.map((t) => (
                <details key={t._id} className="bg-white rounded-lg border border-blue-100 px-3 py-2">
                  <summary className="text-sm font-semibold text-gray-800 cursor-pointer">{t.title}</summary>
                  {t.description && <p className="text-xs text-gray-600 mt-2">{t.description}</p>}
                  {t.videoUrl && (
                    <a href={t.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">Watch tutorial →</a>
                  )}
                  {t.steps?.length > 0 && (
                    <ol className="mt-2 space-y-1 list-decimal list-inside text-xs text-gray-600">
                      {t.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  )}
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => setActiveTab("task")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "task" ? "bg-white shadow text-orange-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📋 Campaign Task
          </button>
          <button
            onClick={() => setActiveTab("campaign")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "campaign" ? "bg-white shadow text-orange-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            🏷️ Campaign Info
          </button>
          {ugcForm && (
            <button
              onClick={() => setActiveTab("ugc")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all relative ${activeTab === "ugc" ? "bg-white shadow text-orange-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              🎬 UGC
              {!ugcSubmission && (
                <span className="absolute top-1.5 right-3 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          )}
        </div>

        {/* ── CAMPAIGN INFO TAB ── */}
        {activeTab === "campaign" && (() => {
          const c = task.campaign || {};
          return (
            <div className="space-y-4">

              {/* Campaign Banner */}
              {c.image?.url && (
                <div className="rounded-2xl overflow-hidden border border-gray-200 h-36">
                  <img src={c.image.url} alt={c.campaignName} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Brand + Campaign Name */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-4 mb-4">
                  {c.brandImage?.url && (
                    <img src={c.brandImage.url} alt={c.brandName} className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                  )}
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Brand</p>
                    <p className="text-lg font-bold text-gray-900">{c.brandName || '—'}</p>
                    <p className="text-sm text-gray-500">{c.campaignName || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Credits', value: `${c.credits || 0} pts`, color: 'text-green-600 font-bold' },
                    { label: 'Target Views', value: c.views || '—' },
                    { label: 'Cutoff Views', value: c.cutoff ? `${c.cutoff} views` : '—' },
                    { label: 'Location', value: c.location || '—' },
                    { label: 'Status', value: c.status || '—' },
                    { label: 'Type', value: c.campaignType || '—' },
                    { label: 'Start Date', value: c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN') : '—' },
                    { label: 'End Date', value: c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN') : '—' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
                      <p className={`text-sm font-semibold text-gray-800 ${color || ''}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goal */}
              {c.goal && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">🎯 Goal</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.goal}</p>
                </div>
              )}

              {/* Description */}
              {c.description && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">📄 Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.description}</p>
                </div>
              )}

              {/* Tags */}
              {c.tags?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">🏷️ Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {c.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-xs font-medium">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Types */}
              {c.supportedTaskTypes?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">📌 Supported Task Types</p>
                  <div className="flex flex-wrap gap-2">
                    {c.supportedTaskTypes.map((t, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-semibold capitalize">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* T&C */}
              {c.tNc && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">📜 Terms & Conditions</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{c.tNc}</p>
                </div>
              )}

            </div>
          );
        })()}

        {/* ── CAMPAIGN TASK TAB ── */}
        {activeTab === "task" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left — Video */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Your Assigned Reel</h3>
                <p className="text-xs text-gray-500 mt-0.5">Watch, download, and upload to social media</p>
              </div>
              <div className="p-4">
                <video src={task.s3Url} controls className="w-full rounded-xl bg-black aspect-[9/16] object-contain" />
                <div className="flex gap-2 mt-3">
                  <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    {copied ? <><FaCheck className="text-green-600" size={12} /> Copied!</> : <><FaCopy size={12} /> Copy URL</>}
                  </button>
                  <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors">
                    <FaDownload size={12} /> Download
                  </button>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-4">
              {/* Campaign Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Campaign Info</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Campaign', value: task.campaign?.campaignName || task.campaignName || '—' },
                    { label: 'Brand', value: task.campaign?.brandName || task.brandName || '—' },
                    { label: 'Task Type', value: task.contentCategory || '—' },
                    { label: 'Proof Required', value: task.proofRequired || '—' },
                    { label: 'Credits', value: `${task.credits || 0} pts`, bold: true, color: 'text-green-600' },
                    { label: 'Deadline', value: task.campaign?.endDate ? new Date(task.campaign.endDate).toLocaleDateString('en-IN') : '—' },
                    { label: 'Status', value: isCompleted ? 'Completed' : 'Pending', badge: true, completed: isCompleted },
                  ].map(({ label, value, bold, color, badge, completed }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-gray-500">{label}</span>
                      {badge
                        ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{value}</span>
                        : <span className={`font-medium text-gray-800 truncate max-w-[60%] ${bold ? 'font-bold' : ''} ${color || ''}`}>{value}</span>
                      }
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('campaign')}
                  className="mt-3 w-full text-xs text-orange-600 font-semibold hover:underline text-center"
                >
                  View full campaign details →
                </button>
              </div>

              {/* Upload Options */}
              {!isCompleted && activeTask.isTaskAccepted && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Upload Options</h3>
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">
                      Option 1 — Direct upload to YouTube{" "}
                      {ytConnected ? <span className="text-green-600 font-semibold">(Connected ✓)</span> : <span className="text-red-500">(Not connected)</span>}
                    </p>
                    {!ytConnected && (
                      <a href={`${API_BASE_URL}/auth/youtube?userId=${userId}`} target="_blank" rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors mb-2">
                        <FaYoutube size={16} /> Connect YouTube Account
                      </a>
                    )}
                    {!ytConnected && (
                      <button onClick={async () => {
                        try {
                          const res = await axios.get(`${API_BASE_URL}/api/youtube/status`, { headers: { Authorization: `Bearer ${token}` } });
                          setYtConnected(res.data?.connected || false);
                        } catch {}
                      }} className="w-full text-xs text-gray-500 hover:text-gray-700 py-1 underline">
                        Already connected? Click to refresh status
                      </button>
                    )}
                    <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                      value={ytTitle} onChange={e => setYtTitle(e.target.value)} placeholder="Video title" />
                    <button
                      onClick={ytConnected ? handleYouTubeUpload : () => { setSendStatus("error"); setSendMessage("Connect YouTube first from Accounts tab."); }}
                      disabled={ytUploading}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${ytConnected ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
                      {ytUploading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</> : <><FaYoutube size={16} /> Upload to YouTube Shorts</>}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400">OR</span><div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Option 2 — Download & upload manually</p>
                    <a href="https://studio.youtube.com" target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors mb-2">
                      <FaYoutube size={14} /> Open YouTube Studio
                    </a>
                    <a href="https://www.instagram.com" target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-xl text-sm font-semibold hover:bg-pink-100 transition-colors">
                      <FaInstagram size={14} /> Open Instagram
                    </a>
                  </div>
                </div>
              )}

              {/* Edit Submission — shown when canEdit:true (already submitted, under review) */}
              {canEdit && isUnderReview && (
                <div className="bg-white rounded-2xl shadow-sm border border-yellow-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">Edit Submission</h3>
                      <p className="text-xs text-yellow-700 mt-0.5">⏳ Under review — you can update your URL</p>
                    </div>
                    <button
                      onClick={() => { setShowEditBox(v => !v); setEditMsg(""); setEditStatus(""); }}
                      className="px-3 py-1.5 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                    >
                      {showEditBox ? "Cancel" : "✏️ Edit URL"}
                    </button>
                  </div>
                  {showEditBox && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="url"
                        value={editUrl}
                        onChange={e => setEditUrl(e.target.value)}
                        placeholder="Paste new YouTube/Instagram URL..."
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <button
                        onClick={handleEdit}
                        disabled={editLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold text-sm disabled:opacity-60 transition-all"
                      >
                        {editLoading
                          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
                          : "Update Submission"}
                      </button>
                      {editMsg && (
                        <div className={`p-3 rounded-lg text-sm ${
                          editStatus === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                        }`}>{editMsg}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit URL */}
              {!isCompleted ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-1">Submit Your Video URL</h3>
                  <p className="text-xs text-gray-500 mb-2">After uploading, paste the public link here.</p>
                  <input type="url" value={shareUrl} onChange={e => setShareUrl(e.target.value)}
                    placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3" />
                  <button onClick={handleSend} disabled={sending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold text-sm hover:brightness-110 disabled:opacity-60 transition-all">
                    {sending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : <><FaPaperPlane size={12} /> Submit URL</>}
                  </button>
                  {sendStatus && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${sendStatus === "success" ? "bg-green-50 text-green-700 border border-green-200" : sendStatus === "info" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      {sendMessage}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="font-semibold text-green-700">Task Completed!</p>
                  <p className="text-sm text-green-600 mt-1">Your submission is under review. Credits will be awarded once approved.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── UGC TESTIMONIAL TAB ── */}
        {activeTab === "ugc" && ugcForm && (
          <div className="space-y-4">
            {/* Form header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">🎬</span>
                <h3 className="text-lg font-bold">{ugcForm.title}</h3>
              </div>
              <p className="text-orange-100 text-sm">Share your experience to inspire others to join this campaign!</p>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📌 Instructions</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ugcForm.instructions}</p>
            </div>

            {/* Script */}
            {ugcForm.script && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📝 Script</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ugcForm.script}</p>
              </div>
            )}

            {/* Reference Video */}
            {ugcForm.referenceVideoUrl && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🎥 Reference Video</p>
                <a href={ugcForm.referenceVideoUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm font-semibold hover:bg-orange-100 transition-colors">
                  ▶ Watch Reference Video
                </a>
              </div>
            )}

            {/* Upload / Submission status */}
            {ugcSubmission && ugcSubmission.status !== "rejected" ? (
              <div className={`rounded-2xl p-5 border ${ugcSubmission.status === "approved" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
                <p className="text-sm font-bold text-gray-800 mb-3">Your Submitted Testimonial</p>
                {ugcSubmission.videoUrl && (
                  <video src={ugcSubmission.videoUrl} controls className="w-full rounded-xl bg-black mb-3 max-h-72 object-contain" />
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${ugcSubmission.status === "approved" ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"}`}>
                    {ugcSubmission.status === "approved" ? "✅ Approved" : "⏳ Under Review"}
                  </span>
                  {ugcSubmission.videoDuration > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      🎥 {ugcSubmission.videoDuration}s video
                    </span>
                  )}
                  {ugcSubmission.creditsEarned > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                      🪙 {ugcSubmission.creditsEarned} credits earned
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                {ugcSubmission?.status === "rejected" && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    ❌ Your previous submission was rejected. Please re-upload.
                  </div>
                )}
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📤 Upload Your Testimonial Video</p>
                <p className="text-xs text-gray-500 mb-4">Record a short video sharing how you earned credits, your experience, and why others should join this campaign.</p>
                <input type="file" accept="video/*" onChange={e => setUgcVideo(e.target.files[0])}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-100 file:text-orange-700 file:font-medium hover:file:bg-orange-200 mb-3 cursor-pointer" />
                {ugcVideo && (
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <FaVideo size={10} className="text-orange-500" /> {ugcVideo.name}
                  </p>
                )}
                <button onClick={handleUGCUpload} disabled={ugcUploading || !ugcVideo}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold text-sm hover:brightness-110 disabled:opacity-50 transition-all">
                  {ugcUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : "📤 Submit Testimonial Video"}
                </button>
                {ugcMsg && (
                  <p className={`mt-3 text-sm text-center ${ugcMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{ugcMsg}</p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default ReelTaskDetail;
