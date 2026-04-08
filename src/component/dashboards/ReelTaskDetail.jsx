import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { FaYoutube, FaInstagram, FaCopy, FaCheck, FaPaperPlane, FaArrowLeft, FaDownload } from "react-icons/fa";

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

  const userData = JSON.parse(localStorage.getItem("mobileUserData") || "{}");
  const userId = userData.googleId || localStorage.getItem("googleId");
  const token = localStorage.getItem("mobileUserToken");

  useEffect(() => {
    const checkYT = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/youtube/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setYtConnected(res.data?.connected || false);
      } catch { setYtConnected(false); }
    };
    if (token) checkYT();
  }, [token]);

  if (!task) return <div className="p-8 text-center text-gray-500">No task data found.</div>;

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
      setSendMessage(msg?.includes("NOT_CONNECTED") || msg?.includes("not connected")
        ? "YouTube not connected. Please connect YouTube in Accounts tab first."
        : msg || "YouTube upload failed.");
    } finally { setYtUploading(false); }
  };

  const handleSend = async () => {
    setSendStatus(""); setSendMessage("");
    if (!userId) { setSendStatus("error"); setSendMessage("User not logged in. Please logout and login again."); return; }
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

  const isCompleted = submitted || task.isTaskComplete;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm text-sm font-medium">
            <FaArrowLeft size={12} /> Back to Tasks
          </button>
          <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left — Video */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Your Assigned Reel</h3>
              <p className="text-xs text-gray-500 mt-0.5">Watch, download, and upload this video to your social media</p>
            </div>
            <div className="p-4">
              <video src={task.s3Url} controls className="w-full rounded-xl bg-black aspect-[9/16] object-contain" />
              <div className="flex gap-2 mt-3">
                <button onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                  {copied ? <><FaCheck className="text-green-600" size={12} /> Copied!</> : <><FaCopy size={12} /> Copy URL</>}
                </button>
                <button onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors">
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
                <div className="flex justify-between">
                  <span className="text-gray-500">Campaign</span>
                  <span className="font-medium text-gray-800 truncate max-w-[60%]">{task.campaignName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Credits</span>
                  <span className="font-bold text-green-600">{task.credits || 0} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isCompleted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {isCompleted ? "Completed" : "Pending"}
                  </span>
                </div>
              </div>
              {/* Task Code */}
              {task.taskCode && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                  <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ Required — Add this code in your video title or description:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-base font-bold text-orange-800 tracking-widest bg-white px-3 py-1.5 rounded-lg border border-orange-200">
                      {task.taskCode}
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(task.taskCode); }}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Without this code, your submission will be rejected.</p>
                </div>
              )}
            </div>

            {/* Upload Options */}
            {!isCompleted && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Upload Options</h3>
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">
                    Option 1 — Direct upload to YouTube{" "}
                    {ytConnected
                      ? <span className="text-green-600 font-semibold">(Connected ✓)</span>
                      : <span className="text-red-500">(Not connected)</span>}
                  </p>
                  {!ytConnected && (
                    <a
                      href={`${API_BASE_URL}/auth/youtube?userId=${userId}`}
                      target="_blank" rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors mb-2"
                    >
                      <FaYoutube size={16} /> Connect YouTube Account
                    </a>
                  )}
                  {!ytConnected && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await axios.get(`${API_BASE_URL}/api/youtube/status`, { headers: { Authorization: `Bearer ${token}` } });
                          setYtConnected(res.data?.connected || false);
                          if (res.data?.connected) setSendMessage("");
                        } catch {}
                      }}
                      className="w-full text-xs text-gray-500 hover:text-gray-700 py-1 underline"
                    >
                      Already connected? Click to refresh status
                    </button>
                  )}
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                    value={ytTitle} onChange={e => setYtTitle(e.target.value)}
                    placeholder="Video title"
                  />
                  <button
                    onClick={ytConnected ? handleYouTubeUpload : () => { setSendStatus("error"); setSendMessage("Connect YouTube first from Accounts tab."); }}
                    disabled={ytUploading}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${ytConnected ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
                    {ytUploading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
                      : <><FaYoutube size={16} /> Upload to YouTube Shorts</>}
                  </button>
                </div>
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">OR</span>
                  <div className="flex-1 h-px bg-gray-200" />
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

            {/* Submit URL */}
            {!isCompleted ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-1">Submit Your Video URL</h3>
                <p className="text-xs text-gray-500 mb-3">After uploading, paste the public URL of your video here</p>
                <input
                  type="url" value={shareUrl} onChange={e => setShareUrl(e.target.value)}
                  placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3"
                />
                <button onClick={handleSend} disabled={sending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold text-sm hover:brightness-110 disabled:opacity-60 transition-all">
                  {sending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : <><FaPaperPlane size={12} /> Submit URL</>}
                </button>
                {sendStatus && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${
                    sendStatus === "success" ? "bg-green-50 text-green-700 border border-green-200" :
                    sendStatus === "info" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                    "bg-red-50 text-red-700 border border-red-200"
                  }`}>{sendMessage}</div>
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
      </div>
    </div>
  );
}

export default ReelTaskDetail;
