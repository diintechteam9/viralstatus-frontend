import React, { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiExternalLink, FiZap, FiSend, FiUsers, FiEye } from 'react-icons/fi';
import { API_BASE_URL } from '../../../config';
import { CAMPAIGN_TASK_TYPES } from '../../../constants/campaignTaskTypes';

const getToken = () =>
  localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';

const STATUS_CLS = {
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected:  'bg-red-100 text-red-700 border-red-200',
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const TYPE_COLOR = {
  reels:      'from-blue-500 to-blue-600',
  post:       'from-pink-500 to-rose-500',
  ugc:        'from-purple-500 to-violet-600',
  app_review: 'from-orange-500 to-amber-500',
  gmb_review: 'from-green-500 to-emerald-600',
};

// ─── Proof image inline ───────────────────────────────────────────────────────
function ProofThumb({ url }) {
  const [err, setErr] = useState(false);
  if (!url) return <span className="text-xs text-gray-400 italic">No proof</span>;
  const isImg = /\.(jpg|jpeg|png|gif|webp|jfif|bmp)($|\?)/i.test(url) || url.includes('/uploads/proofs/');
  if (isImg && !err)
    return (
      <img src={url} alt="proof" onError={() => setErr(true)}
        onClick={() => window.open(url, '_blank')}
        className="h-16 w-auto rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80 mt-1" />
    );
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
      <FiExternalLink size={11} /> View Proof
    </a>
  );
}

// ─── Single task-type panel ───────────────────────────────────────────────────
function TaskTypePanel({ type, campaignId, clientId, selectedUsers, isPublicCampaign, onRefreshAll }) {
  const [task,          setTask]          = useState(null);
  const [submissions,   setSubmissions]   = useState([]);
  const [stats,         setStats]         = useState({ total: 0, pending: 0, approved: 0, rejected: 0, creditsGiven: 0 });
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState({});
  const [msg,           setMsg]           = useState('');
  const [err,           setErr]           = useState('');
  const [expanded,      setExpanded]      = useState(false);
  const [subFilter,     setSubFilter]     = useState('all');

  const flash = (setter, text, ms = 3000) => { setter(text); setTimeout(() => setter(''), ms); };

  const load = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      // fetch tasks for this category
      const res  = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}?contentCategory=${type.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      const tasks = (data.tasks || []).filter(t => t.contentCategory === type.id);
      setTask(tasks[0] || null);

      // fetch submissions
      const sRes  = await fetch(
        `${API_BASE_URL}/api/campaign-tasks/${campaignId}/submissions-by-category?contentCategory=${encodeURIComponent(type.id)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const sData = await sRes.json();
      setSubmissions(sData.submissions || []);
      setStats(sData.stats || { total: 0, pending: 0, approved: 0, rejected: 0, creditsGiven: 0 });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [campaignId, type.id]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setActionLoading(true); setErr('');
    try {
      const res  = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ contentCategory: type.id, clientId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Generate failed');
      flash(setMsg, `✅ ${type.label} task generated`);
      load(); onRefreshAll?.();
    } catch (e) { flash(setErr, e.message); }
    finally { setActionLoading(false); }
  };

  const handleDistribute = async () => {
    setActionLoading(true); setErr('');
    try {
      let userIds = selectedUsers;
      let assignmentScope = 'private';

      if (isPublicCampaign && !selectedUsers.length) {
        const r    = await fetch(`${API_BASE_URL}/api/mobile/user/all-google-ids`);
        const d    = await r.json();
        userIds    = d.googleIds || [];
        assignmentScope = 'public';
      }
      if (!userIds.length) throw new Error('No users selected. Go to Participants tab first.');

      const res  = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/distribute`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ userIds, assignmentScope, contentCategory: type.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Distribute failed');
      flash(setMsg, `✅ Sent to ${userIds.length} user(s)`);
      load(); onRefreshAll?.();
    } catch (e) { flash(setErr, e.message); }
    finally { setActionLoading(false); }
  };

  const handleReview = async (taskId, userId, status) => {
    const key = `${taskId}-${userId}`;
    setReviewLoading(p => ({ ...p, [key]: true }));
    try {
      const res  = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${taskId}/review-submission`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ userId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      load();
    } catch (e) { alert(e.message); }
    finally { setReviewLoading(p => ({ ...p, [`${taskId}-${userId}`]: false })); }
  };

  const filteredSubs = subFilter === 'all' ? submissions : submissions.filter(s => s.status === subFilter);
  const pendingCount = stats.pending;

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all ${expanded ? 'border-orange-300 shadow-md' : 'border-gray-100 shadow-sm'}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: icon + info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${TYPE_COLOR[type.id]} flex items-center justify-center text-xl flex-shrink-0`}>
              {type.icon}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm">{type.label}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {loading ? (
                  <span className="text-xs text-gray-400">Loading…</span>
                ) : task ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Task ready</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">No task yet</span>
                )}
                {stats.total > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                    {stats.total} submission{stats.total !== 1 ? 's' : ''}
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold animate-pulse">
                    {pendingCount} pending review
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {type.id !== 'reels' && (
              <>
                <button type="button" onClick={handleGenerate} disabled={actionLoading || loading}
                  title="Generate task"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 disabled:opacity-50">
                  <FiZap size={12} /> Generate
                </button>
                <button type="button" onClick={handleDistribute} disabled={actionLoading || loading || !task}
                  title="Send to users"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50">
                  <FiSend size={12} /> Send
                </button>
              </>
            )}
            <button type="button" onClick={() => setExpanded(v => !v)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                expanded ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}>
              <FiEye size={12} /> {expanded ? 'Hide' : 'Submissions'}
              {stats.total > 0 && <span className="ml-1 bg-orange-500 text-white rounded-full px-1.5 text-[10px] font-bold">{stats.total}</span>}
            </button>
            <button type="button" onClick={load} disabled={loading}
              className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50">
              <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Task info row */}
        {task && (
          <div className="mt-3 flex flex-wrap gap-2 items-center pl-13">
            <span className="text-xs text-gray-600 font-medium truncate max-w-xs">{task.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">{task.credits} credits</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{task.status}</span>
            {task.assignedTo?.length > 0 && (
              <span className="text-xs flex items-center gap-1 text-gray-500">
                <FiUsers size={10} /> {task.assignedTo.length} assigned
              </span>
            )}
          </div>
        )}

        {/* Messages */}
        {msg && <p className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">{msg}</p>}
        {err && <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">{err}</p>}
      </div>

      {/* Submissions panel */}
      {expanded && (
        <div className="border-t border-gray-100 p-4">
          {/* Stats bar */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[
              { lbl: 'Total',    val: stats.total,        cls: 'text-blue-700',   bg: 'bg-blue-50',   f: 'all'      },
              { lbl: 'Pending',  val: stats.pending,      cls: 'text-yellow-700', bg: 'bg-yellow-50', f: 'pending'  },
              { lbl: 'Approved', val: stats.approved,     cls: 'text-green-700',  bg: 'bg-green-50',  f: 'approved' },
              { lbl: 'Rejected', val: stats.rejected,     cls: 'text-red-700',    bg: 'bg-red-50',    f: 'rejected' },
              { lbl: 'Credits',  val: stats.creditsGiven, cls: 'text-orange-700', bg: 'bg-orange-50', f: null       },
            ].map(({ lbl, val, cls, bg, f }) => (
              <button key={lbl} type="button" onClick={() => f && setSubFilter(f)}
                className={`${bg} rounded-xl px-2 py-2 text-center border border-transparent transition-all ${
                  f && subFilter === f ? 'ring-2 ring-orange-400 ring-offset-1' : ''
                } ${f ? 'cursor-pointer hover:brightness-95' : 'cursor-default'}`}>
                <p className={`text-base font-extrabold ${cls}`}>{val}</p>
                <p className="text-[9px] font-semibold text-gray-500 uppercase">{lbl}</p>
              </button>
            ))}
          </div>

          {/* Filter pills */}
          <div className="flex gap-1 mb-3">
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button key={f} type="button" onClick={() => setSubFilter(f)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize transition-all ${
                  subFilter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{f}</button>
            ))}
          </div>

          {/* Submission list */}
          {filteredSubs.length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-6">No {subFilter !== 'all' ? subFilter : ''} submissions yet.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredSubs.map((sub, idx) => (
                <div key={`${sub.taskId}-${sub.userId}-${idx}`}
                  className={`border rounded-xl p-3 ${
                    sub.status === 'approved' ? 'border-green-200 bg-green-50' :
                    sub.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                  }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-orange-700 truncate">{sub.taskTitle}</p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">{sub.userId}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_CLS[sub.status] || STATUS_CLS.pending}`}>
                          {sub.status}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN') : '—'}
                        </span>
                        <span className="text-[10px] font-semibold text-orange-600">+{sub.credits} cr</span>
                      </div>
                      <ProofThumb url={sub.proofUrl} />
                    </div>
                    {sub.status === 'pending' && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button type="button"
                          disabled={reviewLoading[`${sub.taskId}-${sub.userId}`]}
                          onClick={() => handleReview(sub.taskId, sub.userId, 'approved')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-600 text-white text-[11px] font-semibold hover:bg-green-700 disabled:opacity-50">
                          <FiCheck size={11} /> Approve
                        </button>
                        <button type="button"
                          disabled={reviewLoading[`${sub.taskId}-${sub.userId}`]}
                          onClick={() => handleReview(sub.taskId, sub.userId, 'rejected')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500 text-white text-[11px] font-semibold hover:bg-red-600 disabled:opacity-50">
                          <FiX size={11} /> Reject
                        </button>
                      </div>
                    )}
                    {sub.status !== 'pending' && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border capitalize shrink-0 ${STATUS_CLS[sub.status]}`}>
                        {sub.status === 'approved' ? `✓ +${sub.credits}cr` : '✗'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Command Center ──────────────────────────────────────────────────────
export default function CampaignCommandCenter({ campaign, clientId, selectedUsers }) {
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg,     setBulkMsg]     = useState('');
  const [bulkErr,     setBulkErr]     = useState('');
  const [refreshKey,  setRefreshKey]  = useState(0);

  const isPublicCampaign = campaign?.campaignType === 'public';
  const supported = Array.isArray(campaign?.supportedTaskTypes) && campaign.supportedTaskTypes.length
    ? campaign.supportedTaskTypes
    : ['reels'];

  const nonReelTypes = CAMPAIGN_TASK_TYPES.filter(t => t.id !== 'reels' && supported.includes(t.id));

  const flash = (setter, text, ms = 4000) => { setter(text); setTimeout(() => setter(''), ms); };

  // Generate ALL non-reel task types at once
  const handleGenerateAll = async () => {
    setBulkLoading(true); setBulkErr('');
    try {
      const res  = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaign._id}/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Generate failed');
      flash(setBulkMsg, `✅ Generated ${data.created?.length || 0} task(s). ${data.skipped?.length ? `${data.skipped.length} already existed.` : ''}`);
      setRefreshKey(k => k + 1);
    } catch (e) { flash(setBulkErr, e.message); }
    finally { setBulkLoading(false); }
  };

  // Distribute ALL non-reel task types at once
  const handleDistributeAll = async () => {
    setBulkLoading(true); setBulkErr('');
    try {
      let userIds = selectedUsers;
      let assignmentScope = 'private';

      if (isPublicCampaign && !selectedUsers.length) {
        const r = await fetch(`${API_BASE_URL}/api/mobile/user/all-google-ids`);
        const d = await r.json();
        userIds = d.googleIds || [];
        assignmentScope = 'public';
      }
      if (!userIds.length) throw new Error('No users selected. Go to Participants tab and select users first.');

      const res  = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaign._id}/distribute`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ userIds, assignmentScope }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Distribute failed');
      flash(setBulkMsg, `✅ ${data.message}`);
      setRefreshKey(k => k + 1);
    } catch (e) { flash(setBulkErr, e.message); }
    finally { setBulkLoading(false); }
  };

  if (!nonReelTypes.length) return null;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              ⚡ Campaign Command Center
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage all {nonReelTypes.length} task type{nonReelTypes.length !== 1 ? 's' : ''} from one screen — generate, send & review submissions.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <FiUsers size={12} />
              {isPublicCampaign
                ? 'Public campaign — all users'
                : selectedUsers.length
                  ? `${selectedUsers.length} user(s) selected`
                  : <span className="text-amber-600 font-semibold">No users selected</span>
              }
            </div>
            <button type="button" onClick={handleGenerateAll} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-700 disabled:opacity-50 shadow-sm">
              <FiZap size={13} /> Generate All Tasks
            </button>
            <button type="button" onClick={handleDistributeAll} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold hover:brightness-110 disabled:opacity-50 shadow-sm">
              <FiSend size={13} /> Send All to Users
            </button>
          </div>
        </div>

        {bulkMsg && <p className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{bulkMsg}</p>}
        {bulkErr && <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{bulkErr}</p>}
      </div>

      {/* Per-type panels */}
      {nonReelTypes.map(type => (
        <TaskTypePanel
          key={`${type.id}-${refreshKey}`}
          type={type}
          campaignId={campaign?._id}
          clientId={clientId}
          selectedUsers={selectedUsers}
          isPublicCampaign={isPublicCampaign}
          onRefreshAll={() => setRefreshKey(k => k + 1)}
        />
      ))}
    </div>
  );
}
