import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiRefreshCw, FiMoreVertical, FiUserPlus, FiInbox,
  FiPause, FiPlay, FiTrash2, FiCheckCircle, FiXCircle,
  FiGrid, FiFilm, FiImage, FiVideo, FiStar, FiMapPin,
} from 'react-icons/fi';
import CampaignTaskTypeHub from './CampaignTaskTypeHub';
import ReelsTaskPanel from './ReelsTaskPanel';
import CategoryTaskPanel from './CategoryTaskPanel';
import CategorySubmissionsPanel from './CategorySubmissionsPanel';
import { FormFields, EMPTY_FORM, getDefaultFormForCategory, inputCls, labelCls } from './taskFormFields';
import { CAMPAIGN_TASK_TYPES } from '../../../constants/campaignTaskTypes';
import { API_BASE_URL } from '../../../config';

const TASK_TYPE_META = {
  like:         { label: 'Like',        color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200'    },
  comment:      { label: 'Comment',     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
  view:         { label: 'View',        color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200'  },
  follow:       { label: 'Follow',      color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  upload_reel:  { label: 'Upload Reel', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  share:        { label: 'Share',       color: 'text-cyan-600',   bg: 'bg-cyan-50',   border: 'border-cyan-200'   },
  save:         { label: 'Save',        color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
};

const STATUS_META = {
  active:    { label: 'Active',    cls: 'bg-green-100 text-green-700' },
  paused:    { label: 'Paused',    cls: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700' },
  draft:     { label: 'Draft',     cls: 'bg-gray-100 text-gray-600' },
};

const PlatformIcon = ({ platform }) => {
  if (platform === 'instagram')
    return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white text-[10px] font-bold">IG</span>;
  if (platform === 'youtube')
    return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold">YT</span>;
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white text-[10px] font-bold">IG</span>
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold">YT</span>
    </span>
  );
};

const TaskTypeBadge = ({ type }) => {
  const m = TASK_TYPE_META[type] || { label: 'Task', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${m.bg} ${m.color} ${m.border}`}>
      <span>{m.label || type?.replace('_', ' ')}</span>
    </span>
  );
};

const TaskRowSettingsMenu = ({ isPublic, isActive, onEdit, onAssign, onViewSubmissions, onToggleStatus, onDelete }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1">
            <button onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
            {!isPublic && onAssign && (
              <button onClick={() => { onAssign(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Assign</button>
            )}
            <button onClick={() => { onViewSubmissions(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">View Submissions</button>
            <button onClick={() => { onToggleStatus(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{isActive ? 'Pause' : 'Activate'}</button>
            <button onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </>
      )}
    </div>
  );
};

const CampaignTasksSection = ({
  campaignId,
  clientId,
  campaignType,
  contentCategoryFilter = null,
  isPublicCampaign = false,
  selectedUsers = [],
  onTasksChanged,
}) => {
  const typeMeta = contentCategoryFilter
    ? CAMPAIGN_TASK_TYPES.find((t) => t.id === contentCategoryFilter)
    : null;
  const defaultVisibility = campaignType === 'public' ? 'public' : 'private';
  const getToken = () => localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';

  const [form, setForm] = useState(() => {
    const defaultPlatform =
      contentCategoryFilter === 'app_review' ? 'playstore' :
      contentCategoryFilter === 'gmb_review' ? 'both' : 'instagram';
    return {
      ...EMPTY_FORM,
      visibility: defaultVisibility,
      contentCategory: contentCategoryFilter || 'post',
      platform: defaultPlatform,
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const [ctasks, setCtasks] = useState([]);
  const [ctLoading, setCtLoading] = useState(false);
  const [ctError, setCtError] = useState('');

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const [assignTask, setAssignTask] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [assignPools, setAssignPools] = useState([]);
  const [assignPoolsLoading, setAssignPoolsLoading] = useState(false);
  const [assignExpandedPool, setAssignExpandedPool] = useState(null);
  const [assignPoolReels, setAssignPoolReels] = useState({});
  const [assignSelectedReel, setAssignSelectedReel] = useState(null);
  const [submissionsTask, setSubmissionsTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState({});
  const [catActionLoading, setCatActionLoading] = useState(false);
  const [catActionMsg, setCatActionMsg] = useState('');
  const [catActionErr, setCatActionErr] = useState('');

  const filteredTasks = useMemo(() => {
    if (!contentCategoryFilter) return ctasks;
    return ctasks.filter((t) => t.contentCategory === contentCategoryFilter);
  }, [ctasks, contentCategoryFilter]);

  const resolveTargetUsers = async () => {
    if (!isPublicCampaign && selectedUsers.length === 0) {
      return { error: 'Select participants in the Participants tab first.' };
    }
    if (isPublicCampaign && selectedUsers.length === 0) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/mobile/user/all-google-ids`);
        const data = await res.json();
        const ids = data.googleIds || [];
        if (!ids.length) return { error: 'No registered users found.' };
        return { userIds: ids };
      } catch {
        return { error: 'Failed to fetch users.' };
      }
    }
    return { userIds: selectedUsers };
  };

  const handleGenerateCategory = async () => {
    if (!contentCategoryFilter || !campaignId) return;
    setCatActionLoading(true);
    setCatActionErr('');
    setCatActionMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ contentCategory: contentCategoryFilter, clientId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Generate failed');
      setCatActionMsg(data.message || 'Task generated');
      fetchCtasks();
      onTasksChanged?.();
    } catch (err) {
      setCatActionErr(err.message || 'Generate failed');
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleDistributeCategory = async () => {
    if (!contentCategoryFilter || !campaignId) return;
    setCatActionLoading(true);
    setCatActionErr('');
    setCatActionMsg('');
    try {
      const resolved = await resolveTargetUsers();
      if (resolved.error) {
        setCatActionErr(resolved.error);
        return;
      }
      const assignmentScope = isPublicCampaign && selectedUsers.length === 0 ? 'public' : 'private';
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          userIds: resolved.userIds,
          assignmentScope,
          contentCategory: contentCategoryFilter,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Send failed');
      setCatActionMsg(data.message || 'Sent to users');
      onTasksChanged?.();
    } catch (err) {
      setCatActionErr(err.message || 'Send failed');
    } finally {
      setCatActionLoading(false);
    }
  };

  const fetchCtasks = useCallback(async () => {
    if (!campaignId) { console.warn('[TaskManagement] fetchCtasks: campaignId missing'); return; }
    setCtLoading(true); setCtError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      console.log('[TaskManagement] fetchCtasks response:', data);
      if (res.ok) setCtasks(data.tasks || data || []);
      else setCtError(data.message || 'Failed to load tasks');
    } catch (err) {
      console.error('[TaskManagement] fetchCtasks error:', err);
      setCtError('Failed to load tasks');
    }
    finally { setCtLoading(false); }
  }, [campaignId]);

  useEffect(() => { fetchCtasks(); }, [fetchCtasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Frontend validation
    if (!form.title.trim()) { setSubmitError('Title is required'); return; }
    if (!form.credits || Number(form.credits) <= 0) { setSubmitError('Credits must be greater than 0'); return; }
    if (!campaignId) { setSubmitError('Campaign ID missing - please go back and reopen this campaign'); return; }

    setSubmitting(true); setSubmitError(''); setSubmitSuccess('');
    try {
      const payload = {
        ...form,
        campaignId,
        clientId,
        targetCount: Number(form.targetCount) || 0,
        credits: Number(form.credits) || 0,
        visibility: form.visibility || 'private',
        contentCategory: contentCategoryFilter || form.contentCategory || 'post',
        // type-specific extra fields
        appName: form.appName || undefined,
        businessName: form.businessName || undefined,
        minRating: form.minRating || undefined,
        script: form.script || undefined,
        referenceVideoUrl: form.referenceVideoUrl || undefined,
      };
      console.log('[TaskManagement] Creating task:', payload);
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('[TaskManagement] Create task response:', data);
      if (res.ok && data.success) {
        setSubmitSuccess(form.visibility === 'public'
        ? `Public task "${data.task?.title || form.title}" is live for all users in My Tasks > Public.`
        : `Task "${data.task?.title || form.title}" created. Assign it from the task list.`);
        const defaultPlatform =
          contentCategoryFilter === 'app_review' ? 'playstore' :
          contentCategoryFilter === 'gmb_review' ? 'both' : 'instagram';
        setForm({ ...EMPTY_FORM, visibility: defaultVisibility, contentCategory: contentCategoryFilter || 'post', platform: defaultPlatform });
        fetchCtasks();
        onTasksChanged?.();
      } else {
        setSubmitError(data.message || `Server error (${res.status})`);
      }
    } catch (err) {
      console.error('[TaskManagement] Create task error:', err);
      setSubmitError('Network error - check if backend is running');
    }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) fetchCtasks();
      else { const d = await res.json(); alert(d.message || 'Delete failed'); }
    } catch { alert('Delete failed'); }
  };

  const handleToggleStatus = async (task) => {
    const next = task.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${task._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) fetchCtasks();
    } catch { /* silent */ }
  };

  const openEdit = (task) => {
    setEditId(task._id);
    setEditError('');
    setEditForm({
      title: task.title || '', description: task.description || '',
      platform: task.platform || 'instagram', taskType: task.taskType || 'like',
      targetUrl: task.targetUrl || '', targetCount: task.targetCount ?? '',
      credits: task.credits ?? '', proofRequired: task.proofRequired || 'screenshot',
      status: task.status || 'active',
      deadline: task.deadline ? task.deadline.slice(0, 16) : '',
      visibility: task.visibility || 'private',
      // type-specific fields
      appName: task.appName || '',
      businessName: task.businessName || '',
      minRating: task.minRating || '5',
      script: task.script || '',
      referenceVideoUrl: task.referenceVideoUrl || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true); setEditError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...editForm,
          targetCount: Number(editForm.targetCount) || 0,
          credits: Number(editForm.credits) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) { setEditId(null); fetchCtasks(); }
      else setEditError(data.message || 'Update failed');
    } catch { setEditError('Update failed'); }
    finally { setEditSubmitting(false); }
  };

  const openAssign = async (task) => {
    setAssignTask(task);
    setSelectedAssignees(task.assignedTo || []);
    setAssignError(''); setAssignSuccess('');
    setAssignSelectedReel(null);
    setAssignExpandedPool(null);
    setAssignPoolReels({});
    setParticipantsLoading(true);
    setAssignPoolsLoading(true);
    try {
      const [partRes, poolRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/participants`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_BASE_URL}/api/pools?clientId=${encodeURIComponent(clientId)}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const partData = await partRes.json();
      const poolData = await poolRes.json();
      if (partRes.ok) {
        const userIds = partData.userIds || [];
        const profiles = await Promise.all(
          userIds.map(async (id) => {
            try {
              const r = await fetch(`${API_BASE_URL}/api/user/by-googleid/${id}`);
              const d = await r.json();
              return { googleId: id, name: d.user?.name || d.user?.email || id };
            } catch { return { googleId: id, name: id }; }
          })
        );
        setParticipants(profiles);
      }
      if (poolRes.ok) setAssignPools(poolData.pools || []);
    } catch { setParticipants([]); setAssignPools([]); }
    finally { setParticipantsLoading(false); setAssignPoolsLoading(false); }
  };

  const loadPoolReels = async (poolId) => {
    if (assignPoolReels[poolId]) { setAssignExpandedPool(poolId); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/${poolId}/reels`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setAssignPoolReels(prev => ({ ...prev, [poolId]: data.reels || [] }));
      setAssignExpandedPool(poolId);
    } catch { setAssignExpandedPool(poolId); }
  };

  const handleAssignSubmit = async (assignToAll = false) => {
    if (!assignToAll && !selectedAssignees.length) { setAssignError('Select at least one user'); return; }
    setAssignLoading(true); setAssignError(''); setAssignSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${assignTask._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          userIds: assignToAll ? [] : selectedAssignees,
          assignToAll: assignToAll || false,
          reelId: assignSelectedReel?._id || null,
          reelS3Url: assignSelectedReel?.s3Url || null,
          reelS3Key: assignSelectedReel?.s3Key || null,
          reelTitle: assignSelectedReel?.title || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignSuccess(data.message || `Task assigned successfully!`);
        fetchCtasks();
        setTimeout(() => setAssignTask(null), 1500);
      } else setAssignError(data.message || 'Assign failed');
    } catch { setAssignError('Assign failed'); }
    finally { setAssignLoading(false); }
  };

  const openSubmissions = async (task) => {
    setSubmissionsTask(task);
    setSubmissions([]);
    setSubmissionsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${task._id}/submissions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setSubmissions(data.submissions || []);
    } catch { /* silent */ }
    finally { setSubmissionsLoading(false); }
  };

  const handleReviewSubmission = async (taskId, userId, status) => {
    setReviewLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${taskId}/review-submission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ userId, status }),
      });
      if (res.ok) openSubmissions(submissionsTask);
    } catch { /* silent */ }
    finally { setReviewLoading(prev => ({ ...prev, [userId]: false })); }
  };

  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);

  const handleAiFill = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const prompt = aiPrompt.toLowerCase();
      // Detect task type from prompt
      const taskType =
        /comment/i.test(prompt) ? 'comment' :
        /follow/i.test(prompt) ? 'follow' :
        /view|watch/i.test(prompt) ? 'view' :
        /upload|reel|create/i.test(prompt) ? 'upload_reel' :
        /share/i.test(prompt) ? 'share' :
        /save/i.test(prompt) ? 'save' : 'like';

      // Detect platform from prompt
      const platform =
        /youtube|yt/i.test(prompt) ? 'youtube' :
        /both|all/i.test(prompt) ? 'both' : 'instagram';

      // Smart defaults based on task type
      const defaults = {
        like:        { targetCount: 500,  credits: 5,  proofRequired: 'screenshot', urlHint: 'instagram.com/p/example' },
        comment:     { targetCount: 200,  credits: 10, proofRequired: 'screenshot', urlHint: 'instagram.com/p/example' },
        view:        { targetCount: 1000, credits: 8,  proofRequired: 'screenshot', urlHint: 'youtube.com/watch?v=example' },
        follow:      { targetCount: 300,  credits: 15, proofRequired: 'screenshot', urlHint: 'instagram.com/yovoai' },
        upload_reel: { targetCount: 50,   credits: 50, proofRequired: 'url',        urlHint: 'instagram.com/yovoai' },
        share:       { targetCount: 150,  credits: 12, proofRequired: 'screenshot', urlHint: 'instagram.com/p/example' },
        save:        { targetCount: 250,  credits: 6,  proofRequired: 'screenshot', urlHint: 'instagram.com/p/example' },
      };
      const d = defaults[taskType];
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

      // Build description from prompt
      const descMap = {
        like: `Like the post related to "${aiPrompt}" to boost engagement.`,
        comment: `Leave a meaningful comment on the post related to "${aiPrompt}".`,
        view: `Watch the full video related to "${aiPrompt}" till the end.`,
        follow: `Follow the account related to "${aiPrompt}" to stay updated.`,
        upload_reel: `Create and upload a reel featuring "${aiPrompt}" with the campaign hashtag.`,
        share: `Share the post related to "${aiPrompt}" to your story.`,
        save: `Save the post related to "${aiPrompt}" to your collection.`,
      };

      setForm({
        title: aiPrompt.trim(),
        description: descMap[taskType],
        platform,
        taskType,
        targetUrl: `https://${d.urlHint}`,
        targetCount: d.targetCount,
        credits: d.credits,
        proofRequired: d.proofRequired,
        status: 'active',
        deadline,
        visibility: form.visibility || 'private',
      });
      setShowAiInput(false);
      setAiPrompt('');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {contentCategoryFilter && typeMeta && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Quick actions</p>
              <p className="text-sm text-gray-600 mt-0.5">Generate and send <strong>{typeMeta.label}</strong> tasks only.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleGenerateCategory} disabled={catActionLoading}
                className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
                Generate {typeMeta.label}
              </button>
              <button type="button" onClick={handleDistributeCategory} disabled={catActionLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50">
                Send to Users
              </button>
            </div>
          </div>
          {contentCategoryFilter === 'ugc' && (
            <p className="text-xs text-orange-800 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              UGC tasks mein script aur reference video URL task create karte waqt fill karo — users ko wahi dikhega.
            </p>
          )}
          {catActionMsg && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{catActionMsg}</div>}
          {catActionErr && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{catActionErr}</div>}
        </div>
      )}

      {!contentCategoryFilter && (
      <div className="flex items-center gap-3">
        <div className="w-1 h-7 rounded-full bg-gradient-to-b from-orange-500 to-yellow-400" />
        <h2 className="text-xl font-bold text-gray-900">Campaign Tasks</h2>
      </div>
      )}

      {/* Create Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Create New Task</h3>
          <button
            type="button"
            onClick={() => setShowAiInput(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:brightness-110 shadow-sm"
          >
            AI Fill
          </button>
        </div>

        {showAiInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">AI Task Generator</h2>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAiInput(false); setAiPrompt(''); }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Describe your task</label>
                  <textarea
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white resize-none"
                    placeholder="e.g. Like our Instagram post for the summer campaign and take a screenshot as proof..."
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    'Like our Instagram post',
                    'Comment on YouTube video',
                    'Follow our account',
                    'Upload a brand reel',
                    'Share post to story',
                    'Watch our YouTube video',
                  ].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setAiPrompt(s)}
                      className="px-3 py-1.5 text-xs rounded-full border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleAiFill}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-50 shadow-sm"
                >
                  {aiLoading ? 'Generating...' : 'Generate Task'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAiInput(false); setAiPrompt(''); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <FormFields
            vals={form}
            onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))}
            contentCategory={contentCategoryFilter}
          />
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-white text-sm font-semibold bg-gradient-to-r from-orange-500 to-yellow-500 hover:brightness-110 disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Creating...' : '+ Create Task'}
            </button>
            {submitSuccess && (
              <span className="text-green-600 text-sm font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg"> {submitSuccess}
              </span>
            )}
            {submitError && (
              <span className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg"> {submitError}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Task List</h3>
          <button onClick={fetchCtasks} className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">Refresh</button>
        </div>

        {ctLoading ? (
          <div className="py-10 text-center text-gray-400 text-sm">Loading tasks...</div>
        ) : ctError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{ctError}</div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            {contentCategoryFilter ? `No ${typeMeta?.label || ''} tasks yet. Click Generate above or create manually.` : 'No tasks yet. Create one above.'}
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  {['#','Title','Category','Visibility','Platform','Task Type','Target','Credits','Proof','Status','Deadline','Settings'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map((t, i) => (
                  editId === t._id ? (
                    <tr key={t._id} className="bg-orange-50">
                      <td colSpan={12} className="px-4 py-4">
                        <form onSubmit={handleEditSubmit}>
                          <FormFields
                            vals={editForm}
                            onChange={(k, v) => setEditForm(p => ({ ...p, [k]: v }))}
                            contentCategory={contentCategoryFilter}
                          />
                          <div className="mt-3 flex items-center gap-2">
                            <button type="submit" disabled={editSubmitting} className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
                              {editSubmitting ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => setEditId(null)} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gray-200 hover:bg-gray-300 text-gray-700">Cancel</button>
                            {editError && <span className="text-red-600 text-xs">{editError}</span>}
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-3 py-3 font-medium text-gray-900 max-w-[160px] truncate">{t.title}</td>
                      <td className="px-3 py-3">
                        {(() => {
                          const cat = CAMPAIGN_TASK_TYPES.find((c) => c.id === t.contentCategory);
                          return cat ? (
                            <span className="text-xs font-semibold text-orange-700">{cat.icon} {cat.label}</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          t.visibility === 'public' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {t.visibility === 'public' ? 'Public' : 'Private'}
                        </span>
                      </td>
                      <td className="px-3 py-3"><PlatformIcon platform={t.platform} /></td>
                      <td className="px-3 py-3"><TaskTypeBadge type={t.taskType} /></td>
                      <td className="px-3 py-3 text-gray-700">{t.targetCount?.toLocaleString() || '-'}</td>
                      <td className="px-3 py-3 text-gray-700">{t.credits ?? '-'}</td>
                      <td className="px-3 py-3 text-gray-600 capitalize">{t.proofRequired || '-'}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(STATUS_META[t.status] || STATUS_META.draft).cls}`}>
                          {(STATUS_META[t.status] || STATUS_META.draft).label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                        {t.deadline ? new Date(t.deadline).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-3">
                        <TaskRowSettingsMenu
                          isPublic={t.visibility === 'public'}
                          isActive={t.status === 'active'}
                          onEdit={() => openEdit(t)}
                          onAssign={t.visibility !== 'public' ? () => openAssign(t) : undefined}
                          onViewSubmissions={() => openSubmissions(t)}
                          onToggleStatus={() => handleToggleStatus(t)}
                          onDelete={() => handleDelete(t._id)}
                        />
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Assign Modal â€” Private tasks only */}
            {assignTask && assignTask.visibility !== 'public' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Assign Private Task</h2>
              <button type="button" onClick={() => setAssignTask(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{TASK_TYPE_META[assignTask.taskType]?.label || 'Task'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{assignTask.title}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-orange-200 text-orange-700 font-medium">{assignTask.taskType?.replace('_',' ')}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-green-200 text-green-700 font-medium">{assignTask.credits} credits</span>
                    <PlatformIcon platform={assignTask.platform} />
                  </div>
                  {assignTask.targetUrl && (
                    <a href={assignTask.targetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline truncate max-w-full">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      {assignTask.targetUrl}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {participantsLoading ? (
              <div className="py-10 text-center text-gray-400 text-sm">Loading participants...</div>
            ) : participants.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <p className="font-medium text-gray-500">No participants found</p>
                <p className="text-sm mt-1">Users need to join this campaign first.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Participants
                    <span className="ml-1.5 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">{selectedAssignees.length} selected</span>
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSelectedAssignees(participants.map(p => p.googleId))} className="text-xs text-orange-600 hover:underline font-medium">Select All</button>
                    <span className="text-gray-300">|</span>
                    <button type="button" onClick={() => setSelectedAssignees([])} className="text-xs text-gray-500 hover:underline">Clear</button>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto border border-gray-100 rounded-xl p-2">
                  {participants.map(p => {
                    const checked = selectedAssignees.includes(p.googleId);
                    const alreadyAssigned = (assignTask.assignedTo || []).includes(p.googleId);
                    return (
                      <label key={p.googleId} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                        <input type="checkbox" checked={checked}
                          onChange={() => setSelectedAssignees(prev =>
                            prev.includes(p.googleId) ? prev.filter(id => id !== p.googleId) : [...prev, p.googleId]
                          )}
                          className="w-4 h-4 accent-orange-500"
                        />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {p.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400 truncate">{p.googleId}</p>
                        </div>
                        {alreadyAssigned && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex-shrink-0">Assigned</span>}
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            {assignError && <p className="mt-3 text-sm text-red-600">{assignError}</p>}
            {assignSuccess && <p className="mt-3 text-sm text-green-600 font-medium">{assignSuccess}</p>}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => handleAssignSubmit(false)}
                disabled={assignLoading || !selectedAssignees.length || participantsLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:brightness-110 disabled:opacity-50 shadow-sm"
              >
                {assignLoading ? 'Assigning...' : `Assign to ${selectedAssignees.length} user(s)`}
              </button>
              <button type="button" onClick={() => setAssignTask(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal â€” Public Tasks Analytics */}
            {submissionsTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4" style={{ maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Task Submissions</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{submissionsTask.title}</p>
              </div>
              <button type="button" onClick={() => setSubmissionsTask(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <div className="flex flex-wrap gap-3">
                <div className="bg-white rounded-xl px-4 py-2 border border-blue-100 text-center min-w-[80px]">
                  <p className="text-xl font-extrabold text-blue-700">{submissions.length}</p>
                  <p className="text-[10px] text-blue-500 font-semibold uppercase">Total</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 border border-yellow-100 text-center min-w-[80px]">
                  <p className="text-xl font-extrabold text-yellow-700">{submissions.filter(s => s.status === 'pending').length}</p>
                  <p className="text-[10px] text-yellow-500 font-semibold uppercase">Pending</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 border border-green-100 text-center min-w-[80px]">
                  <p className="text-xl font-extrabold text-green-700">{submissions.filter(s => s.status === 'approved').length}</p>
                  <p className="text-[10px] text-green-500 font-semibold uppercase">Approved</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 border border-red-100 text-center min-w-[80px]">
                  <p className="text-xl font-extrabold text-red-700">{submissions.filter(s => s.status === 'rejected').length}</p>
                  <p className="text-[10px] text-red-500 font-semibold uppercase">Rejected</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 border border-orange-100 text-center min-w-[80px]">
                  <p className="text-xl font-extrabold text-orange-700">
                    {submissions.filter(s => s.status === 'approved').length * (submissionsTask.credits || 0)}
                  </p>
                  <p className="text-[10px] text-orange-500 font-semibold uppercase">Credits Given</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              {submissionsLoading ? (
                <div className="py-10 text-center text-gray-400 text-sm">Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
                  <p className="font-medium text-gray-500">No submissions yet</p>
                  <p className="text-sm text-center">Users will appear here once they complete and submit proof for this task.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub, idx) => (
                    <div key={sub.userId + idx} className={`border rounded-xl p-4 ${
                      sub.status === 'approved' ? 'border-green-200 bg-green-50' :
                      sub.status === 'rejected' ? 'border-red-200 bg-red-50' :
                      'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(sub.userId?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 truncate">{sub.userId}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              sub.status === 'approved' ? 'bg-green-200 text-green-800' :
                              sub.status === 'rejected' ? 'bg-red-200 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {sub.status === 'approved' ? 'Approved' : sub.status === 'rejected' ? 'Rejected' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Submitted: {new Date(sub.submittedAt).toLocaleString('en-IN')}
                          </p>

                          {sub.proofUrl && (
                            <div className="mt-2">
                              {sub.proofUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={sub.proofUrl} alt="Proof" className="h-28 rounded-lg object-cover border border-gray-200" />
                              ) : (
                                <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                                  View Proof URL
                                </a>
                              )}
                            </div>
                          )}
                          {!sub.proofUrl && (
                            <p className="text-xs text-gray-400 italic mt-1">No proof submitted</p>
                          )}
                        </div>

                        {sub.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleReviewSubmission(submissionsTask._id, sub.userId, 'approved')}
                              disabled={reviewLoading[sub.userId]}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                            >
                              {reviewLoading[sub.userId] ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReviewSubmission(submissionsTask._id, sub.userId, 'rejected')}
                              disabled={reviewLoading[sub.userId]}
                              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50"
                            >
                              {reviewLoading[sub.userId] ? '...' : 'Reject'}
                            </button>
                          </div>
                        )}
                        {sub.status === 'approved' && (
                          <div className="flex-shrink-0 text-xs text-green-700 font-semibold bg-green-100 px-2 py-1 rounded-lg">
                            +{submissionsTask.credits} pts
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const STATUS_CLS = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
};

const VIS_CLS = {
  public: 'bg-blue-100 text-blue-700',
  private: 'bg-purple-100 text-purple-700',
};

const TASK_TYPES_FOR_CREATE = CAMPAIGN_TASK_TYPES;

function AllTasksView({ campaignId, clientId, campaignType, isPublicCampaign, selectedUsers, onTasksChanged }) {
  // ── Create Task state ──
  const [selectedType, setSelectedType] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const handleTypeChange = (typeId) => {
    if (!typeId) return;
    setSelectedType(typeId);
    setSubmitError('');
    setSubmitSuccess('');
    const defaultVisibility = campaignType === 'public' ? 'public' : 'private';
    setForm(getDefaultFormForCategory(typeId, defaultVisibility));
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setSubmitError('Title is required'); return; }
    if (!form.credits || Number(form.credits) <= 0) { setSubmitError('Credits must be greater than 0'); return; }
    setSubmitting(true); setSubmitError(''); setSubmitSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...form,
          campaignId, clientId,
          contentCategory: selectedType,
          targetCount: Number(form.targetCount) || 0,
          credits: Number(form.credits) || 0,
          appName: form.appName || undefined,
          businessName: form.businessName || undefined,
          minRating: form.minRating || undefined,
          script: form.script || undefined,
          referenceVideoUrl: form.referenceVideoUrl || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess(`"${data.task?.title || form.title}" created successfully!`);
        const defaultVisibility = campaignType === 'public' ? 'public' : 'private';
        setForm(getDefaultFormForCategory(selectedType, defaultVisibility));
        fetchTasks();
        onTasksChanged?.();
      } else {
        setSubmitError(data.message || 'Failed to create task');
      }
    } catch { setSubmitError('Network error'); }
    finally { setSubmitting(false); }
  };

  // ── Table state ──
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = React.useRef(null);

  const [assignTask, setAssignTask] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  const [submissionsTask, setSubmissionsTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState({});

  const [deleteTask, setDeleteTask] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const getToken = () => localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';

  const fetchTasks = useCallback(async () => {  // eslint-disable-line
    if (!campaignId) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setTasks(data.tasks || []);
      else setError(data.message || 'Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [campaignId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    const handler = (e) => {
      if (openMenuId && menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const handleToggleStatus = async (task) => {
    setOpenMenuId(null);
    const next = task.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${task._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) { fetchTasks(); onTasksChanged?.(); }
    } catch { /* silent */ }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTask) return;
    setDeleteLoading(true); setDeleteError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${deleteTask._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) { fetchTasks(); onTasksChanged?.(); setDeleteTask(null); }
      else { const d = await res.json(); setDeleteError(d.message || 'Delete failed'); }
    } catch { setDeleteError('Delete failed'); }
    finally { setDeleteLoading(false); }
  };

  const openAssign = async (task) => {
    setOpenMenuId(null);
    setAssignTask(task);
    setSelectedUserIds(task.assignedTo || []);
    setAssignError(''); setAssignSuccess('');
    setParticipantsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/participants`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        const profiles = await Promise.all(
          (data.userIds || []).map(async (id) => {
            try {
              const r = await fetch(`${API_BASE_URL}/api/user/by-googleid/${id}`);
              const d = await r.json();
              return { googleId: id, name: d.user?.name || d.user?.email || id, email: d.user?.email || '' };
            } catch { return { googleId: id, name: id, email: '' }; }
          })
        );
        setParticipants(profiles);
      } else setParticipants([]);
    } catch { setParticipants([]); }
    finally { setParticipantsLoading(false); }
  };

  const handleAssignSubmit = async () => {
    if (!assignTask) return;
    const assignToAll = isPublicCampaign || assignTask.visibility === 'public';
    if (!assignToAll && !selectedUserIds.length) { setAssignError('Select at least one user'); return; }
    setAssignLoading(true); setAssignError(''); setAssignSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${assignTask._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ userIds: assignToAll ? [] : selectedUserIds, assignToAll }),
      });
      const data = await res.json();
      if (res.ok) { setAssignSuccess(data.message || 'Assigned!'); fetchTasks(); onTasksChanged?.(); }
      else setAssignError(data.message || 'Assign failed');
    } catch { setAssignError('Assign failed'); }
    finally { setAssignLoading(false); }
  };

  const openSubmissions = async (task) => {
    setOpenMenuId(null);
    setSubmissionsTask(task);
    setSubmissions([]); setSubmissionsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${task._id}/submissions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setSubmissions(data.submissions || []);
    } catch { /* silent */ }
    finally { setSubmissionsLoading(false); }
  };

  const handleReview = async (taskId, userId, status) => {
    setReviewLoading(p => ({ ...p, [userId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${taskId}/review-submission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ userId, status }),
      });
      if (res.ok) openSubmissions(submissionsTask);
    } catch { /* silent */ }
    finally { setReviewLoading(p => ({ ...p, [userId]: false })); }
  };

  const catMeta = (id) => CAMPAIGN_TASK_TYPES.find(t => t.id === id);

  return (
    <div className="pt-4 space-y-4">

      {/* ── Create Task Section ── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-4 bg-orange-50 px-3 py-1.5 rounded-lg inline-block">Create New Task</p>

        {/* Type Dropdown */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Task Type *</label>
          <select
            className="w-full sm:w-64 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            value=""
            onChange={e => handleTypeChange(e.target.value)}
          >
            <option value="">— Select task type —</option>
            {TASK_TYPES_FOR_CREATE.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Create Task Modal ── */}
      {createModalOpen && selectedType && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setCreateModalOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-semibold text-gray-900">
                Create {TASK_TYPES_FOR_CREATE.find(t => t.id === selectedType)?.icon} {TASK_TYPES_FOR_CREATE.find(t => t.id === selectedType)?.label} Task
              </h3>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">
              {selectedType !== 'reels' ? (
                <form onSubmit={handleCreateSubmit}>
                  <FormFields
                    vals={form}
                    onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))}
                    contentCategory={selectedType}
                  />
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <button type="submit" disabled={submitting}
                      className="px-5 py-2 rounded-lg text-white text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
                      {submitting ? 'Creating...' : '+ Create Task'}
                    </button>
                    <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">Cancel</button>
                    {submitSuccess && <span className="text-sm text-green-600 font-medium">✓ {submitSuccess}</span>}
                    {submitError && <span className="text-sm text-red-500">{submitError}</span>}
                  </div>
                </form>
              ) : (
                <CreateReelTaskForm
                  campaignId={campaignId}
                  clientId={clientId}
                  campaignType={campaignType}
                  onCreated={() => { fetchTasks(); onTasksChanged?.(); setCreateModalOpen(false); }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── All Tasks Table ── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">All Tasks</p>
          <button type="button" onClick={fetchTasks} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            <FiRefreshCw size={11} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-400 text-sm">Loading tasks...</div>
        ) : error ? (
          <div className="text-sm text-red-500 p-3 bg-red-50 rounded-lg">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No tasks created yet. Go to a specific task type tab to create tasks.</div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full border-collapse min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Title', 'Type', 'Credits', 'Visibility', 'Status', 'Deadline', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((t, i) => {
                  const cat = catMeta(t.contentCategory);
                  return (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 text-sm">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">{t.title}</td>
                      <td className="px-4 py-3">
                        {cat ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                            {cat.icon} {cat.label}
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{t.credits ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${VIS_CLS[t.visibility] || VIS_CLS.private}`}>
                          {t.visibility}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLS[t.status] || STATUS_CLS.draft}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {t.deadline ? new Date(t.deadline).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative inline-block" ref={openMenuId === t._id ? menuRef : null}>
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === t._id ? null : t._id)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0" /></svg>
                          </button>
                          {openMenuId === t._id && (
                            <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] bg-white border border-gray-100 rounded-xl shadow-lg py-1">
                              {t.visibility !== 'public' && (
                                <button type="button" onClick={() => openAssign(t)} className="w-full px-4 py-2 text-left text-sm font-medium text-orange-600 hover:bg-orange-50 flex items-center gap-2.5">
                                  <FiUserPlus size={13} /> Assign Users
                                </button>
                              )}
                              <button type="button" onClick={() => openSubmissions(t)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                                <FiInbox size={13} className="text-gray-400" /> Submissions
                              </button>
                              <button type="button" onClick={() => handleToggleStatus(t)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                                {t.status === 'active'
                                  ? <><FiPause size={13} className="text-yellow-500" /> Pause</>
                                  : <><FiPlay size={13} className="text-green-500" /> Activate</>}
                              </button>
                              <button type="button" onClick={() => { setOpenMenuId(null); setDeleteTask(t); setDeleteError(''); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5">
                                <FiTrash2 size={13} /> Delete
                              </button>
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
        )}
      </div>

      {/* Delete Confirm */}
      {deleteTask && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Task</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete <strong>{deleteTask.title}</strong>? This cannot be undone.</p>
            {deleteError && <p className="text-sm text-red-500 mb-3">{deleteError}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTask(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleDeleteConfirmed} disabled={deleteLoading} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignTask && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Assign — {assignTask.title}</h3>
              <button type="button" onClick={() => setAssignTask(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {participantsLoading ? (
              <p className="text-sm text-gray-400">Loading participants...</p>
            ) : participants.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">No participants found. Add users in the Participants tab first.</p>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setSelectedUserIds(participants.map(p => p.googleId))} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">Select All</button>
                  <button type="button" onClick={() => setSelectedUserIds([])} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">Clear</button>
                  <span className="text-xs text-gray-500 self-center">{selectedUserIds.length} selected</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                  {participants.map(p => (
                    <label key={p.googleId} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-sm">
                      <input type="checkbox" checked={selectedUserIds.includes(p.googleId)} onChange={() => setSelectedUserIds(prev => prev.includes(p.googleId) ? prev.filter(id => id !== p.googleId) : [...prev, p.googleId])} className="accent-orange-500" />
                      <span className="font-medium text-gray-800">{p.name}</span>
                      {p.email && <span className="text-gray-400 text-xs">{p.email}</span>}
                    </label>
                  ))}
                </div>
              </>
            )}
            {assignError && <p className="mt-3 text-sm text-red-500">{assignError}</p>}
            {assignSuccess && <p className="mt-3 text-sm text-green-600 font-medium">✓ {assignSuccess}</p>}
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={handleAssignSubmit} disabled={assignLoading} className="flex-1 py-2 rounded-lg text-white text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
                {assignLoading ? 'Assigning...' : 'Assign to Users'}
              </button>
              <button type="button" onClick={() => setAssignTask(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {submissionsTask && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Submissions</h3>
                <p className="text-xs text-gray-500 truncate max-w-xs">{submissionsTask.title}</p>
              </div>
              <button type="button" onClick={() => setSubmissionsTask(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-4">
              {submissionsLoading ? (
                <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
              ) : submissions.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No submissions yet.</p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub, idx) => (
                    <div key={sub.userId + idx} className={`border rounded-xl p-4 ${
                      sub.status === 'approved' ? 'border-green-200 bg-green-50' :
                      sub.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{sub.userId}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN') : ''}</p>
                          <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sub.status === 'approved' ? 'bg-green-200 text-green-800' :
                            sub.status === 'rejected' ? 'bg-red-200 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>{sub.status || 'pending'}</span>
                          {sub.proofUrl && (
                            <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs text-orange-600 hover:underline">View proof</a>
                          )}
                        </div>
                        {sub.status === 'pending' && (
                          <div className="flex gap-2 shrink-0">
                            <button type="button" onClick={() => handleReview(submissionsTask._id, sub.userId, 'approved')} disabled={reviewLoading[sub.userId]} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50">Approve</button>
                            <button type="button" onClick={() => handleReview(submissionsTask._id, sub.userId, 'rejected')} disabled={reviewLoading[sub.userId]} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TaskManagement = ({
  clientId,
  campaign,
  onCampaignTypeChange,
  campaignTypeLoading = false,
  autoApproval,
  toggleAutoApproval,
  toggleLoading,
  tasks,
  tasksLoading,
  tasksError,
  fetchTasks,
  penaltyThresholdMinutes,
  cancellationPenalty,
  allowCancellation,
  selectedTasks,
  onTaskSelect,
  onSelectAllTasks,
  taskActionLoading,
  onAccept,
  onReject,
  onCancel,
  onBulkAccept,
  onBulkReject,
  bulkLoading,
  bulkAssignOpen,
  onOpenBulkAssign,
  onCloseBulkAssign,
  selectedUsers,
  selectedReelsByPool,
  expandedPoolId,
  onPoolReelSelectionChange,
  reelsPerUser,
  onReelsPerUserChange,
  assignStrategy,
  onAssignStrategyChange,
  onBulkAssign,
  bulkAssignLoading,
  bulkAssignError,
  bulkAssignSuccess,
  sendLoading,
  sendError,
  sendSuccess,
  onSendCampaign,
  youtubeReels,
  onYoutubeReelsChange,
  instagramReels,
  onInstagramReelsChange,
  onGoToParticipants,
  onViewUser,
}) => {
  const [activeTaskType, setActiveTaskType] = useState('all');
  const isPublicCampaign = campaign?.campaignType === 'public';
  const typeMeta = activeTaskType ? CAMPAIGN_TASK_TYPES.find((t) => t.id === activeTaskType) : null;

  const { selectedReelCount, hasSelectedReels } = useMemo(() => {
    const entries = Object.entries(selectedReelsByPool).filter(([, ids]) => ids?.length > 0);
    if (!entries.length) return { selectedReelCount: 0, hasSelectedReels: false };
    const poolId =
      expandedPoolId && selectedReelsByPool[expandedPoolId]?.length
        ? expandedPoolId
        : entries[0][0];
    const count = selectedReelsByPool[poolId]?.length || 0;
    return { selectedReelCount: count, hasSelectedReels: count > 0 };
  }, [selectedReelsByPool, expandedPoolId]);

  const allSelected =
    tasks.length > 0 && tasks.every((t) => selectedTasks.has(`${t.reelId}-${t.userId}`));

  return (
    <div className="w-full max-w-6xl space-y-0">
      {/* Task Type Tabs */}
      <CampaignTaskTypeHub
        campaign={campaign}
        onSelectType={setActiveTaskType}
        activeType={activeTaskType}
      />

      {/* Active Tab Content */}
      {activeTaskType === 'all' ? (
        <AllTasksView
          campaignId={campaign?._id}
          clientId={clientId}
          campaignType={campaign?.campaignType}
          isPublicCampaign={isPublicCampaign}
          selectedUsers={selectedUsers}
          onTasksChanged={fetchTasks}
        />
      ) : activeTaskType === 'reels' ? (
        <ReelsTaskPanel
          clientId={clientId}
          isPublicCampaign={isPublicCampaign}
          campaignTypeLoading={campaignTypeLoading}
          onCampaignTypeChange={onCampaignTypeChange}
          selectedUsers={selectedUsers}
          selectedReelsByPool={selectedReelsByPool}
          expandedPoolId={expandedPoolId}
          onPoolReelSelectionChange={onPoolReelSelectionChange}
          reelsPerUser={reelsPerUser}
          onReelsPerUserChange={onReelsPerUserChange}
          instagramReels={instagramReels}
          onInstagramReelsChange={onInstagramReelsChange}
          youtubeReels={youtubeReels}
          onYoutubeReelsChange={onYoutubeReelsChange}
          sendLoading={sendLoading}
          sendError={sendError}
          sendSuccess={sendSuccess}
          onSendCampaign={onSendCampaign}
          onGoToParticipants={onGoToParticipants}
          tasks={tasks}
          tasksLoading={tasksLoading}
          tasksError={tasksError}
          fetchTasks={fetchTasks}
          autoApproval={autoApproval}
          toggleAutoApproval={toggleAutoApproval}
          toggleLoading={toggleLoading}
          selectedTasks={selectedTasks}
          onTaskSelect={onTaskSelect}
          onSelectAllTasks={onSelectAllTasks}
          onBulkAccept={onBulkAccept}
          onBulkReject={onBulkReject}
          onOpenBulkAssign={onOpenBulkAssign}
          bulkLoading={bulkLoading}
          penaltyThresholdMinutes={penaltyThresholdMinutes}
          cancellationPenalty={cancellationPenalty}
          allowCancellation={allowCancellation}
          onAccept={onAccept}
          onReject={onReject}
          onCancel={onCancel}
          onViewUser={onViewUser}
          taskActionLoading={taskActionLoading}
          bulkAssignOpen={bulkAssignOpen}
          onCloseBulkAssign={onCloseBulkAssign}
          assignStrategy={assignStrategy}
          onAssignStrategyChange={onAssignStrategyChange}
          onBulkAssign={onBulkAssign}
          bulkAssignLoading={bulkAssignLoading}
          bulkAssignError={bulkAssignError}
          bulkAssignSuccess={bulkAssignSuccess}
          selectedReelCount={selectedReelCount}
          hasSelectedReels={hasSelectedReels}
          campaign={campaign}
        />
      ) : ['post', 'ugc', 'app_review', 'gmb_review'].includes(activeTaskType) ? (
        <CategoryTaskPanel
          campaignId={campaign?._id}
          clientId={clientId}
          contentCategory={activeTaskType}
          campaignType={campaign?.campaignType}
          isPublicCampaign={isPublicCampaign}
          selectedUsers={selectedUsers}
          onTasksChanged={fetchTasks}
        />
      ) : (
        <div className="space-y-6">
          <CategorySubmissionsPanel
            campaignId={campaign?._id}
            contentCategory={activeTaskType}
            typeLabel={typeMeta?.label}
          />
          <CampaignTasksSection
            campaignId={campaign?._id}
            clientId={clientId}
            campaignType={campaign?.campaignType}
            contentCategoryFilter={activeTaskType}
            isPublicCampaign={isPublicCampaign}
            selectedUsers={selectedUsers}
            onTasksChanged={fetchTasks}
          />
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
