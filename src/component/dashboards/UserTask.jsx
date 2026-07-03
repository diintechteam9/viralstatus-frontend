import React, { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "../../config";
import ReelTaskDetail from "./ReelTaskDetail";
import PublicTaskDetail from "./PublicTaskDetail";
import { TASK_TYPE_MAP } from "../../constants/campaignTaskTypes";
import { FiGlobe, FiLock, FiClipboard, FiCheckCircle, FiClock, FiVideo, FiChevronRight } from "react-icons/fi";

const TABS = [
  { key: "Public",  label: "Public",  Icon: FiGlobe },
  { key: "Private", label: "Private", Icon: FiLock },
];

function StatusBadge({ task }) {
  if (task.isTaskComplete || task.TaskStatus === 'completed')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black text-white">Completed</span>;
  if (task.TaskStatus === 'cancelled')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 border border-red-200 text-red-700">Cancelled · Re-accept</span>;
  if (task.TaskStatus === 'in_progress' || task.submissionStatus === 'pending_review')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 text-blue-800">Submitted</span>;
  if (task.isTaskAccepted || task.TaskStatus === "accepted")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-black text-black">Accepted</span>;
  if (task.TaskStatus === "assigned" || task.TaskStatus === "pending")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-orange-300 text-orange-700 bg-orange-50">Accept Required</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-gray-300 text-gray-500">Pending</span>;
}

function UGCBadge({ ugcStatus, ugcDone }) {
  const cls = "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold";
  if (ugcStatus === "approved")  return <span className={`${cls} bg-black text-white`}>UGC Approved</span>;
  if (ugcStatus === "rejected")  return <span className={`${cls} border border-black text-black`}>UGC Rejected</span>;
  if (ugcDone)                   return <span className={`${cls} border border-gray-400 text-gray-600`}>UGC Under Review</span>;
  return <span className={`${cls} border border-gray-300 text-gray-500`}>UGC Required</span>;
}

function TaskCard({ task, ugcForms, ugcSubmissions, onSelect, isPublicReel = false }) {
  const hasUGC   = !!ugcForms[task.campaignId];
  const ugcSub   = ugcSubmissions[task.campaignId];
  const ugcDone  = !!ugcSub;
  const ugcStatus = ugcSub?.status;
  const progress  = task.isTaskComplete ? 100 : 33;
  const category = task.contentCategory || 'reels';
  const typeMeta = TASK_TYPE_MAP[category] || { label: 'Task', icon: '📋' };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 transition-all duration-200">
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
          {category === 'reels' && task.s3Url
            ? <video src={task.s3Url} className="w-full h-full object-cover" muted />
            : <span className="text-3xl">{typeMeta.icon}</span>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate leading-tight">
            {task.title || task.campaignName || "Campaign Task"}
          </p>
          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-50 text-orange-800">
            {typeMeta.icon} {typeMeta.label}{isPublicReel ? ' · Public' : ''}
          </span>
          <p className="text-xs text-gray-400 mt-0.5">
            Credits: <span className="font-bold text-gray-800">{task.credits || 0} pts</span>
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <StatusBadge task={task} />
            {hasUGC && <UGCBadge ugcStatus={ugcStatus} ugcDone={ugcDone} />}
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={() => onSelect(task)}
            className="flex items-center gap-1.5 px-3 py-2 bg-black text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
          >
            View <FiChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] bg-gray-100">
        <div
          className="h-[3px] bg-black transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function PublicTaskCard({ task, onSelect }) {
  const TASK_ICONS = {
    like: '❤️', comment: '💬', view: '👁️', follow: '➕',
    upload_reel: '🎬', share: '🔗', save: '🔖',
  };
  const isCompleted = task.alreadyCompleted;
  const isSubmitted = task.alreadySubmitted;

  return (
    <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden hover:border-blue-300 transition-all duration-200">
      {/* Campaign image strip */}
      {task.campaignImageUrl && (
        <div className="h-20 overflow-hidden">
          <img src={task.campaignImageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex gap-4 p-4">
        {/* Icon box */}
        <div className="flex-shrink-0 w-[60px] h-[60px] rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl">
          {TASK_ICONS[task.taskType] || '📌'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">PUBLIC</span>
            {task.contentCategory && TASK_TYPE_MAP[task.contentCategory] && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">
                {TASK_TYPE_MAP[task.contentCategory].icon} {TASK_TYPE_MAP[task.contentCategory].label}
              </span>
            )}
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize">{task.platform}</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm truncate leading-tight">{task.title}</p>
          {task.campaignName && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{task.campaignName} · {task.brandName}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">
              +{task.credits} pts
            </span>
            {isCompleted && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black text-white">✅ Completed</span>
            )}
            {!isCompleted && isSubmitted && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-yellow-400 text-yellow-700 bg-yellow-50">⏳ Under Review</span>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={() => onSelect(task)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isCompleted
                ? 'bg-gray-100 text-gray-500'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isCompleted ? 'Done' : isSubmitted ? 'View' : 'Start'} <FiChevronRight size={12} />
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-[3px] bg-gray-100">
        <div
          className={`h-[3px] transition-all duration-500 ${isCompleted ? 'bg-green-500' : isSubmitted ? 'bg-yellow-400' : 'bg-blue-400'}`}
          style={{ width: isCompleted ? '100%' : isSubmitted ? '66%' : '10%' }}
        />
      </div>
    </div>
  );
}

function EmptyState({ tab, onGoToCampaign }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <FiClipboard size={28} className="text-gray-400" />
      </div>
      <p className="text-base font-semibold text-gray-800 mb-1">No tasks yet</p>
      {tab === "Private" ? (
        <p className="text-sm text-gray-400">
          Join a private campaign first.{" "}
          <button
            onClick={() => typeof onGoToCampaign === "function" && onGoToCampaign()}
            className="underline text-gray-700 font-medium hover:text-black"
          >
            Browse campaigns
          </button>
        </p>
      ) : (
        <p className="text-sm text-gray-400">
          Public reel tasks appear here after client Quick Assign. Engagement tasks (Like, Comment) also show here.
        </p>
      )}
    </div>
  );
}

function UserTask({ onGoToCampaign }) {
  const [activeTab, setActiveTab]     = useState("Public");
  const [tasks, setTasks]             = useState([]);       // private reel tasks (SharedReels)
  const [publicReelTasks, setPublicReelTasks] = useState([]); // public reel tasks (SharedReels)
  const [publicTasks, setPublicTasks] = useState([]);       // public CampaignTasks
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selectedTask, setSelectedTask]               = useState(null);  // private
  const [selectedPublicTask, setSelectedPublicTask]   = useState(null);  // public
  const [ugcForms, setUgcForms]           = useState({});
  const [ugcSubmissions, setUgcSubmissions] = useState({});

  const userData = JSON.parse(localStorage.getItem("mobileUserData") || "{}");
  const userId   = userData.googleId || localStorage.getItem("googleId");

  const [dailyQuota, setDailyQuota] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE_URL}/api/pools/task/daily-quota/${userId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setDailyQuota(d.quota); })
      .catch(() => {});
  }, [userId]);

  // Fetch PRIVATE tasks from SharedReels
  const fetchPrivateTasks = useCallback(async () => {
    if (!userId) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/api/pools/shared/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      const reels = Array.isArray(data.reels) ? data.reels : [];
      const privateReels = reels.filter(t => t.campaignType !== 'public');
      const publicReels = reels.filter(t => t.campaignType === 'public');
      setTasks(privateReels);
      setPublicReelTasks(publicReels);

      // UGC forms for all assigned campaigns
      const uniqueIds = [...new Set(reels.map(r => r.campaignId).filter(Boolean))];
      const formsMap = {}, subsMap = {};
      await Promise.all(
        uniqueIds.map(async (cid) => {
          try {
            const fRes  = await fetch(`${API_BASE_URL}/api/ugc/form/${cid}/${userId}`);
            const fData = await fRes.json();
            formsMap[cid] = fData.success && fData.form       ? fData.form       : null;
            subsMap[cid]  = fData.success && fData.submission ? fData.submission : null;
          } catch {
            formsMap[cid] = null; subsMap[cid] = null;
          }
        })
      );
      setUgcForms(formsMap);
      setUgcSubmissions(subsMap);
    } catch (err) {
      console.error("Private tasks fetch error:", err);
    }
  }, [userId]);

  // Fetch PUBLIC tasks from CampaignTask API — no assignment required
  const fetchPublicTasks = useCallback(async () => {
    if (!userId) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/api/campaign-tasks/public/all?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success) setPublicTasks(data.tasks || []);
    } catch (err) {
      console.error("Public tasks fetch error:", err);
    }
  }, [userId]);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchPrivateTasks(), fetchPublicTasks()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchPrivateTasks, fetchPublicTasks, userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSharedTaskSelect = useCallback(async (task) => {
    const category = task.contentCategory || 'reels';
    // Public reel tasks (campaignType === 'public') with non-reel category → PublicTaskDetail
    if (task.campaignType === 'public' && category !== 'reels' && category !== 'ugc') {
      const taskId = task.campaignTaskId || task.reelId;
      if (taskId) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/campaign-tasks/task/${taskId}?userId=${encodeURIComponent(userId)}`
          );
          const data = await res.json();
          if (data.success && data.task) {
            setSelectedPublicTask({
              ...data.task,
              isTaskAccepted: task.isTaskAccepted,
              reelId: task.reelId || taskId,
              campaignId: task.campaignId || data.task.campaignId,
            });
            return;
          }
        } catch {}
      }
    }
    // All other tasks (private or reels/ugc) → ReelTaskDetail
    setSelectedTask(task);
  }, [userId]);

  useEffect(() => {
    if (loading) return;
    const hasPrivate = tasks.length > 0;
    const hasPublic = publicReelTasks.length > 0 || publicTasks.length > 0;
    if (hasPublic) setActiveTab("Public");
    else if (hasPrivate) setActiveTab("Private");
  }, [loading, tasks.length, publicReelTasks.length, publicTasks.length]);

  // Private task detail
  if (selectedTask) {
    return (
      <ReelTaskDetail
        task={selectedTask}
        onBack={() => { setSelectedTask(null); fetchAll(); }}
      />
    );
  }

  // Public task detail — uses PublicTaskDetail (no assignment needed)
  if (selectedPublicTask) {
    return (
      <PublicTaskDetail
        task={selectedPublicTask}
        userId={userId}
        onBack={() => { setSelectedPublicTask(null); fetchPublicTasks(); }}
      />
    );
  }

  const displayTasks   = activeTab === "Public" ? publicTasks : tasks;
  const publicSharedTasks = publicReelTasks;
  const publicReelCount = publicSharedTasks.length;
  const totalTasks     = activeTab === "Public"
    ? displayTasks.length + publicReelCount
    : displayTasks.length;
  const completedTasks = activeTab === "Public"
    ? displayTasks.filter(t => t.alreadyCompleted).length + publicSharedTasks.filter(t => t.isTaskComplete).length
    : displayTasks.filter(t => t.isTaskComplete).length;
  const pendingTasks   = totalTasks - completedTasks;
  const ugcPending     = activeTab === "Private"
    ? displayTasks.filter(t => ugcForms[t.campaignId] && !ugcSubmissions[t.campaignId]).length
    : 0;

  return (
    <div className="w-full min-h-screen bg-white">

      {/* ── Page Header ── */}
      <div className="border-b border-gray-200 px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">My Tasks</h2>
            <p className="text-gray-400 text-sm mt-0.5">View and manage your assigned tasks</p>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* ── Tab Switcher ── */}
        <div className="flex border border-gray-200 rounded-xl overflow-hidden w-fit">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors
                ${activeTab === key
                  ? "bg-black text-white"
                  : "bg-white text-gray-500 hover:text-gray-800"
                }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab Info Banner ── */}
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-sm text-gray-600 space-y-1">
          {activeTab === "Public"
            ? "Public tasks appear instantly for all users in My Tasks > Public — no campaign join required."
            : "Private tasks are assigned by the client after you join their campaign."
          }
          {dailyQuota && (
            <p className="text-xs font-semibold text-orange-800">
              Active tasks: {dailyQuota.used}/{dailyQuota.limit} · {dailyQuota.remaining} slot(s) available (cancel frees a slot)
            </p>
          )}
        </div>

        {/* ── Stats Row ── */}
        {!loading && totalTasks > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total",     value: totalTasks,     Icon: FiClipboard },
              { label: "Completed", value: completedTasks, Icon: FiCheckCircle },
              { label: "Pending",   value: pendingTasks,   Icon: FiClock },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="border border-gray-200 rounded-xl p-4 text-center bg-white">
                <Icon size={18} className="mx-auto mb-1.5 text-gray-400" />
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── UGC Alert ── */}
        {!loading && ugcPending > 0 && (
          <div className="flex items-start gap-3 border border-gray-300 rounded-xl px-4 py-3 bg-white">
            <FiVideo size={16} className="text-gray-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {ugcPending} task{ugcPending > 1 ? "s" : ""} need{ugcPending === 1 ? "s" : ""} UGC testimonial
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Open the task and go to the UGC Testimonial tab to submit your video.
              </p>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchAll}
              className="mt-3 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Task List ── */}
        {!loading && !error && (
          displayTasks.length === 0 && (activeTab !== "Public" || publicSharedTasks.length === 0)
            ? <EmptyState tab={activeTab} onGoToCampaign={onGoToCampaign} />
            : (
              <div className="space-y-3">
                {activeTab === "Public" ? (
                  <>
                    {displayTasks.map(task => (
                      <PublicTaskCard
                        key={task._id}
                        task={task}
                        onSelect={setSelectedPublicTask}
                      />
                    ))}
                    {publicSharedTasks.map(task => (
                      <TaskCard
                        key={`shared-${task.reelId}-${task._id}`}
                        task={task}
                        ugcForms={ugcForms}
                        ugcSubmissions={ugcSubmissions}
                        onSelect={handleSharedTaskSelect}
                        isPublicReel
                      />
                    ))}
                  </>
                ) : displayTasks.map(task => (
                      <TaskCard
                        key={task._id || `${task.reelId}-${task.campaignId}`}
                        task={task}
                        ugcForms={ugcForms}
                        ugcSubmissions={ugcSubmissions}
                        onSelect={handleSharedTaskSelect}
                      />
                    ))
                }
              </div>
            )
        )}

      </div>
    </div>
  );
}

export default UserTask;
