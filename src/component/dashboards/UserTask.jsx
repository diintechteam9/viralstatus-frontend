import React, { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "../../config";
import ReelTaskDetail from "./ReelTaskDetail";

function UserTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [ugcForms, setUgcForms] = useState({});       // { campaignId: form | null }
  const [ugcSubmissions, setUgcSubmissions] = useState({}); // { campaignId: submission | null }

  const userData = JSON.parse(localStorage.getItem("mobileUserData") || "{}");
  const userId = userData.googleId || localStorage.getItem("googleId");

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/shared/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      const reels = Array.isArray(data.reels) ? data.reels : [];
      setTasks(reels);

      // Fetch UGC forms + user submissions for all unique campaignIds
      const uniqueIds = [...new Set(reels.map(r => r.campaignId).filter(Boolean))];
      const [formsMap, subsMap] = [{}, {}];
      await Promise.all(
        uniqueIds.map(async (cid) => {
          try {
            const fRes = await fetch(`${API_BASE_URL}/api/ugc/form/${cid}/${userId}`);
            const fData = await fRes.json();
            formsMap[cid] = fData.success && fData.form ? fData.form : null;
            subsMap[cid] = fData.success && fData.submission ? fData.submission : null;
          } catch {
            formsMap[cid] = null;
            subsMap[cid] = null;
          }
        })
      );
      setUgcForms(formsMap);
      setUgcSubmissions(subsMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  if (selectedTask) {
    return (
      <ReelTaskDetail
        task={selectedTask}
        onBack={() => { setSelectedTask(null); fetchTasks(); }}
      />
    );
  }

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isTaskComplete).length;
  const pendingTasks = totalTasks - completedTasks;
  const ugcPending = tasks.filter(t => ugcForms[t.campaignId] && !ugcSubmissions[t.campaignId]).length;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900">My Tasks</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage your assigned video content tasks</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        {/* Stats bar */}
        {!loading && totalTasks > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
              <p className="text-2xl font-extrabold text-gray-800">{totalTasks}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Total Tasks</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
              <p className="text-2xl font-extrabold text-green-600">{completedTasks}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Completed</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
              <p className="text-2xl font-extrabold text-orange-500">{pendingTasks}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Pending</p>
            </div>
          </div>
        )}

        {/* UGC pending alert */}
        {!loading && ugcPending > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <span className="text-xl">🎬</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-800">
                {ugcPending} task{ugcPending > 1 ? "s" : ""} need{ugcPending === 1 ? "s" : ""} UGC testimonial
              </p>
              <p className="text-xs text-orange-600 mt-0.5">Open the task and go to 🎬 UGC Testimonial tab to submit your video.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="text-center py-10">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={fetchTasks} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">Retry</button>
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No tasks yet</h3>
            <p className="text-slate-500 text-sm">Join a campaign first. Tasks will appear here once assigned by the client.</p>
          </div>
        )}

        <div className="space-y-3">
          {tasks.map((task) => {
            const hasUGC = !!ugcForms[task.campaignId];
            const ugcSub = ugcSubmissions[task.campaignId];
            const ugcDone = !!ugcSub;
            const ugcStatus = ugcSub?.status; // pending | approved | rejected

            return (
              <div key={task._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-yellow-100 border border-orange-100 flex items-center justify-center">
                    {task.s3Url
                      ? <video src={task.s3Url} className="w-full h-full object-cover" muted />
                      : <span className="text-2xl">{task.isTaskComplete ? "✅" : "📋"}</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">
                      {task.campaignName || "Campaign Task"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Credits: <span className="font-bold text-green-600">{task.credits || 0} pts</span>
                    </p>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {/* Task status */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        task.isTaskComplete ? "bg-green-100 text-green-700" :
                        task.TaskStatus === "accepted" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {task.isTaskComplete ? "✓ Completed" : task.TaskStatus === "accepted" ? "Accepted" : "⏳ Pending"}
                      </span>

                      {/* UGC badge */}
                      {hasUGC && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          ugcStatus === "approved" ? "bg-green-100 text-green-700" :
                          ugcStatus === "rejected" ? "bg-red-100 text-red-700" :
                          ugcDone ? "bg-yellow-100 text-yellow-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          🎬 {ugcStatus === "approved" ? "UGC Approved" :
                               ugcStatus === "rejected" ? "UGC Rejected" :
                               ugcDone ? "UGC Under Review" :
                               "UGC Required"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center flex-shrink-0">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-sm">
                      View Task
                    </button>
                  </div>
                </div>

                {/* Progress bar for task */}
                <div className="h-1 bg-gray-100">
                  <div className={`h-1 transition-all ${task.isTaskComplete ? "bg-green-500 w-full" : "bg-orange-400 w-1/3"}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UserTask;
