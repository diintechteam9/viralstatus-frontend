import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

function ReelTaskDetail({ task, onBack }) {
  const [shareUrl, setShareUrl] = useState("");
  const [sendStatus, setSendStatus] = useState("");

  if (!task) {
    return <div className="p-8 text-center">No task data found.</div>;
  }

  const handleShare = (platform) => {
    const url = encodeURIComponent(task.s3Url);
    const text = encodeURIComponent("Check out this reel!");
    let shareLink = "";
    if (platform === "youtube") {
      navigator.clipboard.writeText(task.s3Url);
      alert("Reel URL copied! You can upload it to YouTube.");
      return;
    } else if (platform === "instagram") {
      navigator.clipboard.writeText(task.s3Url);
      alert("Reel URL copied! You can upload it to Instagram.");
      return;
    }
    if (shareLink) {
      window.open(shareLink, "_blank");
    }
  };

  const handleSend = async () => {
    setSendStatus("");
    const userId = localStorage.getItem("googleId");
    if (!userId) {
      setSendStatus("User not logged in.");
      return;
    }
    if (!shareUrl.trim()) {
      setSendStatus("Please paste a URL before sending.");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/pools/user/response/${userId}`,
        { url: shareUrl, campaignId: task.campaignId }
      );
      if (res.data && res.data.success) {
        // Mark the task as completed
        try {
          await axios.post(
            `${API_BASE_URL}/api/pools/shared/complete/${userId}/${task._id}`
          );
        } catch (err) {
          // Optionally handle error, but don't block success message
        }
        setSendStatus("URL sent successfully!");
        setShareUrl("");
      } else {
        setSendStatus("Failed to send URL.");
      }
    } catch (err) {
      setSendStatus(
        err.response?.data?.error || "Failed to send URL. Please try again."
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg mt-8">
      <div className="mb-4 flex items-center">
        {onBack && (
          <button
            className="mr-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onBack}
          >
            ← Back
          </button>
        )}
        <h2 className="text-2xl font-bold items-center">Reel Details</h2>
      </div>
      <div className="flex justify-between">
        <video
          src={task.s3Url}
          controls
          className="w-1/3 h-1/3 rounded-xl mb-4"
        />
        <div className="mb-6 flex flex-col">
          <div className="mb-4">
            <div className="text-lg font-semibold">Reel id: {task._id}</div>
          </div>
          <div className="mb-4">
            <div className="text-lg font-semibold">
              Campaign id: {task.campaignId}
            </div>
          </div>
          <div className="font-semibold mb-2">Share this reel:</div>
          <div className="flex gap-3">
            <button
              onClick={() => handleShare("youtube")}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Youtube
            </button>
            <button
              onClick={() => handleShare("instagram")}
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
            >
              Instagram
            </button>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <div className="font-semibold mb-2">Paste your shared URL below:</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            onChange={(e) => setShareUrl(e.target.value)}
            placeholder="Paste your shared URL here"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Send
          </button>
        </div>
        {sendStatus && <div className="text-green-600 mt-2">{sendStatus}</div>}
      </div>
    </div>
  );
}

export default ReelTaskDetail;
