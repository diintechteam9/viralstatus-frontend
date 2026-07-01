import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import { FaArrowLeft, FaInstagram, FaYoutube, FaExternalLinkAlt } from "react-icons/fa";
import UserTaskActions from "./UserTaskActions";

const TASK_TYPE_LABELS = {
  like: "Like the post",
  comment: "Comment on the post",
  view: "Watch the video",
  follow: "Follow the account",
  upload_reel: "Upload a Reel",
  share: "Share the post",
  save: "Save the post",
};

function PublicTaskDetail({ task, userId, onBack }) {
  const [proofUrl, setProofUrl]     = useState("");
  const [proofFile, setProofFile]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage]       = useState("");
  const [success, setSuccess]       = useState(false);
  const [taskState, setTaskState]   = useState(task);
  const [tutorials, setTutorials]   = useState([]);

  useEffect(() => { setTaskState(task); }, [task]);

  useEffect(() => {
    const cat = task?.contentCategory || 'post';
    fetch(`${API_BASE_URL}/api/reels-tutorials?category=${cat}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setTutorials(d.tutorials || []); })
      .catch(() => {});
  }, [task?.contentCategory]);

  const activeTask = taskState || task;
  const isAssigned = !!activeTask.reelId && activeTask.isTaskAccepted !== undefined;
  const canSubmit = !isAssigned || activeTask.isTaskAccepted;

  const isCompleted = activeTask.alreadyCompleted;
  const isSubmitted = activeTask.alreadySubmitted;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setMessage("Please accept the task first.");
      return;
    }
    if (activeTask.proofRequired === "url" && !proofUrl.trim()) {
      setMessage("Please paste your video/post URL.");
      return;
    }
    if (activeTask.proofRequired === "screenshot" && !proofFile) {
      setMessage("Please upload a screenshot as proof.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      let finalProofUrl = proofUrl.trim();

      if (activeTask.proofRequired === "screenshot" && proofFile) {
        const fd = new FormData();
        fd.append("file", proofFile);
        fd.append("taskId", activeTask._id);
        fd.append("userId", userId);
        const uploadRes = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${activeTask._id}/upload-proof`, {
          method: "POST",
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          setMessage(uploadData.message || "Screenshot upload failed.");
          setSubmitting(false);
          return;
        }
        finalProofUrl = uploadData.url || "";
      }

      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${activeTask._id}/submit-public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, proofUrl: finalProofUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setMessage("✅ Proof submitted! Your task is under review.");
      } else {
        setMessage(data.message || "Submission failed.");
      }
    } catch {
      setMessage("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm text-sm font-medium">
            <FaArrowLeft size={12} /> Back
          </button>
          <h2 className="text-xl font-bold text-gray-900">{activeTask.contentCategory?.replace('_', ' ') || 'Task'}</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            {isAssigned ? 'Assigned' : '🌐 Public'}
          </span>
        </div>

        {isAssigned && (
          <div className="mb-4">
            <UserTaskActions
              task={activeTask}
              userId={userId}
              onAccepted={(data) => setTaskState((p) => ({ ...p, ...data.updatedReel, isTaskAccepted: true }))}
              onCancelled={() => onBack?.()}
            />
          </div>
        )}

        {tutorials.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
            <h3 className="text-sm font-bold text-blue-900 mb-2">📚 How to complete this task</h3>
            {tutorials.map((t) => (
              <details key={t._id} className="bg-white rounded-lg border border-blue-100 px-3 py-2 mb-2">
                <summary className="text-sm font-semibold cursor-pointer">{t.title}</summary>
                {t.description && <p className="text-xs text-gray-600 mt-2">{t.description}</p>}
                {t.steps?.length > 0 && (
                  <ol className="mt-2 list-decimal list-inside text-xs text-gray-600 space-y-1">
                    {t.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                )}
              </details>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
          {activeTask.campaignImageUrl && (
            <img src={activeTask.campaignImageUrl} alt="" className="w-full h-36 object-cover rounded-xl mb-4" />
          )}
          <h3 className="text-lg font-bold text-gray-900">{activeTask.title}</h3>
          {activeTask.campaignName && <p className="text-sm text-gray-500 mt-0.5">{activeTask.campaignName} · {activeTask.brandName}</p>}
          {activeTask.description && <p className="text-sm text-gray-700 mt-2">{activeTask.description}</p>}

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
              <p className="text-xl font-extrabold text-green-700">{activeTask.credits}</p>
              <p className="text-xs text-green-600 mt-0.5">Credits</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <p className="text-sm font-bold text-blue-700 capitalize">{activeTask.taskType?.replace("_", " ")}</p>
              <p className="text-xs text-blue-600 mt-0.5">Task Type</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
              <p className="text-sm font-bold text-orange-700 capitalize">{activeTask.platform}</p>
              <p className="text-xs text-orange-600 mt-0.5">Platform</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
          <p className="text-sm font-bold text-gray-700 mb-3">
            Step 1 — {TASK_TYPE_LABELS[activeTask.taskType] || "Complete the task"}
          </p>
          {activeTask.targetUrl && (
            <a href={activeTask.targetUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800">
              <FaExternalLinkAlt size={12} /> Open Link
            </a>
          )}
          <div className="flex gap-2 mt-3">
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-xl text-sm font-semibold hover:bg-pink-100">
              <FaInstagram size={14} /> Instagram
            </a>
            <a href="https://www.youtube.com" target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-100">
              <FaYoutube size={14} /> YouTube
            </a>
          </div>
        </div>

        {!isCompleted && !isSubmitted && !success && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">Step 2 — Submit Proof</p>
            {!canSubmit && (
              <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-3">Accept the task above before submitting proof.</p>
            )}

            {activeTask.proofRequired === "url" && (
              <>
                <p className="text-xs text-gray-500 mb-2">Paste your YouTube/Instagram post URL</p>
                <input type="url" value={proofUrl} onChange={e => setProofUrl(e.target.value)}
                  placeholder="https://instagram.com/p/... or https://youtube.com/..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3" />
              </>
            )}

            {activeTask.proofRequired === "screenshot" && (
              <>
                <p className="text-xs text-gray-500 mb-2">Upload a screenshot as proof</p>
                <input type="file" accept="image/*" onChange={e => setProofFile(e.target.files[0])}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-100 file:text-orange-700 file:font-medium hover:file:bg-orange-200 mb-3 cursor-pointer" />
              </>
            )}

            {activeTask.proofRequired === "none" && (
              <p className="text-xs text-gray-500 mb-3">No proof needed — just click submit below.</p>
            )}

            {message && (
              <div className={`mb-3 p-3 rounded-lg text-sm ${message.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {message}
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || !canSubmit}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold text-sm hover:brightness-110 disabled:opacity-60">
              {submitting ? "Submitting..." : "Submit Task"}
            </button>
          </div>
        )}

        {(isSubmitted || isCompleted || success) && !submitting && (
          <div className={`rounded-2xl p-5 text-center border ${isCompleted ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
            <div className="text-3xl mb-2">{isCompleted ? "✅" : "⏳"}</div>
            <p className="font-semibold text-gray-800">
              {isCompleted ? "Task Completed! Credits Awarded." : "Proof Submitted — Under Review"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isCompleted
                ? `${activeTask.credits} credits have been added to your wallet.`
                : "Client will review your submission and award credits."}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default PublicTaskDetail;
