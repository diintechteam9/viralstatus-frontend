import React, { useState, useEffect, useCallback } from 'react';
import ContentPoolFolderView from '../ContentPoolFolderView';
import TaskControlPanel from './TaskControlPanel';
import TaskRow from './TaskRow';
import BulkAssignment from './BulkAssignment';
import { API_BASE_URL } from '../../../config';

const TASK_TYPE_META = {
  like:         { icon: '❤️', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200'    },
  comment:      { icon: '💬', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
  view:         { icon: '👁️', color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200'  },
  follow:       { icon: '➕', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  upload_reel:  { icon: '🎬', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  share:        { icon: '🔗', color: 'text-cyan-600',   bg: 'bg-cyan-50',   border: 'border-cyan-200'   },
  save:         { icon: '🔖', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
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
  const m = TASK_TYPE_META[type] || { icon: '📌', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${m.bg} ${m.color} ${m.border}`}>
      <span>{m.icon}</span>{type?.replace('_', ' ')}
    </span>
  );
};

const EMPTY_FORM = {
  title: '', description: '', platform: 'instagram', taskType: 'like',
  targetUrl: '', targetCount: '', credits: '', proofRequired: 'screenshot',
  status: 'active', deadline: '',
};

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

const FormFields = ({ vals, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <div>
      <label className={labelCls}>Title *</label>
      <input className={inputCls} value={vals.title} onChange={e => onChange('title', e.target.value)} required placeholder="Task title" />
    </div>
    <div className="sm:col-span-2 lg:col-span-2">
      <label className={labelCls}>Description</label>
      <input className={inputCls} value={vals.description} onChange={e => onChange('description', e.target.value)} placeholder="Short description" />
    </div>
    <div>
      <label className={labelCls}>Platform</label>
      <select className={inputCls} value={vals.platform} onChange={e => onChange('platform', e.target.value)}>
        <option value="instagram">Instagram</option>
        <option value="youtube">YouTube</option>
        <option value="both">Both</option>
      </select>
    </div>
    <div>
      <label className={labelCls}>Task Type</label>
      <select className={inputCls} value={vals.taskType} onChange={e => onChange('taskType', e.target.value)}>
        {Object.entries(TASK_TYPE_META).map(([k, v]) => (
          <option key={k} value={k}>{v.icon} {k.replace('_', ' ')}</option>
        ))}
      </select>
    </div>
    <div>
      <label className={labelCls}>Target URL</label>
      <input className={inputCls} value={vals.targetUrl} onChange={e => onChange('targetUrl', e.target.value)} placeholder="https://..." />
    </div>
    <div>
      <label className={labelCls}>Target Count</label>
      <input type="number" min={0} className={inputCls} value={vals.targetCount} onChange={e => onChange('targetCount', e.target.value)} placeholder="e.g. 1000" />
    </div>
    <div>
      <label className={labelCls}>Credits</label>
      <input type="number" min={0} className={inputCls} value={vals.credits} onChange={e => onChange('credits', e.target.value)} placeholder="e.g. 10" />
    </div>
    <div>
      <label className={labelCls}>Proof Required</label>
      <select className={inputCls} value={vals.proofRequired} onChange={e => onChange('proofRequired', e.target.value)}>
        <option value="screenshot">Screenshot</option>
        <option value="url">URL</option>
        <option value="none">None</option>
      </select>
    </div>
    <div>
      <label className={labelCls}>Status</label>
      <select className={inputCls} value={vals.status} onChange={e => onChange('status', e.target.value)}>
        <option value="active">Active</option>
        <option value="draft">Draft</option>
      </select>
    </div>
    <div>
      <label className={labelCls}>Deadline</label>
      <input type="datetime-local" className={inputCls} value={vals.deadline} onChange={e => onChange('deadline', e.target.value)} />
    </div>
  </div>
);

const CampaignTasksSection = ({ campaignId, clientId }) => {
  const getToken = () => localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';

  const [form, setForm] = useState(EMPTY_FORM);
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

  const fetchCtasks = useCallback(async () => {
    if (!campaignId) return;
    setCtLoading(true); setCtError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setCtasks(data.tasks || data || []);
      else setCtError(data.message || 'Failed to load tasks');
    } catch { setCtError('Failed to load tasks'); }
    finally { setCtLoading(false); }
  }, [campaignId]);

  useEffect(() => { fetchCtasks(); }, [fetchCtasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setSubmitError(''); setSubmitSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...form, campaignId, clientId,
          targetCount: Number(form.targetCount) || 0,
          credits: Number(form.credits) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitSuccess('Task created successfully!');
        setForm(EMPTY_FORM);
        fetchCtasks();
      } else setSubmitError(data.message || 'Failed to create task');
    } catch { setSubmitError('Failed to create task'); }
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

  const handleAssignSubmit = async () => {
    if (!selectedAssignees.length) { setAssignError('Select at least one user'); return; }
    setAssignLoading(true); setAssignError(''); setAssignSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${assignTask._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          userIds: selectedAssignees,
          reelId: assignSelectedReel?._id || null,
          reelS3Url: assignSelectedReel?.s3Url || null,
          reelS3Key: assignSelectedReel?.s3Key || null,
          reelTitle: assignSelectedReel?.title || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignSuccess(`Task assigned to ${selectedAssignees.length} user(s) successfully!`);
        fetchCtasks();
        setTimeout(() => setAssignTask(null), 1200);
      } else setAssignError(data.message || 'Assign failed');
    } catch { setAssignError('Assign failed'); }
    finally { setAssignLoading(false); }
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
      });
      setShowAiInput(false);
      setAiPrompt('');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Section heading */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-7 rounded-full bg-gradient-to-b from-orange-500 to-yellow-400" />
        <h2 className="text-xl font-bold text-gray-900">Campaign Tasks</h2>
      </div>

      {/* Create Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Create New Task</h3>
          <button
            type="button"
            onClick={() => setShowAiInput(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:brightness-110 shadow-sm"
          >
            <span>✨</span> AI Fill
          </button>
        </div>

        {showAiInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✨</span>
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
                  {aiLoading ? 'Generating…' : '✨ Generate Task'}
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
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-white text-sm font-semibold bg-gradient-to-r from-orange-500 to-yellow-500 hover:brightness-110 disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Creating…' : '+ Create Task'}
            </button>
            {submitSuccess && <span className="text-green-600 text-sm font-medium">{submitSuccess}</span>}
            {submitError && <span className="text-red-600 text-sm">{submitError}</span>}
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
          <div className="py-10 text-center text-gray-400 text-sm">Loading tasks…</div>
        ) : ctError ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{ctError}</div>
        ) : ctasks.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
            <span className="text-4xl">📋</span>
            <p className="font-medium text-gray-500">No tasks created yet</p>
            <p className="text-sm">Use the form above to create your first campaign task.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['#','Title','Platform','Task Type','Target','Credits','Proof','Status','Deadline','Actions'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ctasks.map((t, i) => (
                  editId === t._id ? (
                    <tr key={t._id} className="bg-orange-50">
                      <td colSpan={10} className="px-4 py-4">
                        <form onSubmit={handleEditSubmit}>
                          <FormFields
                            vals={editForm}
                            onChange={(k, v) => setEditForm(p => ({ ...p, [k]: v }))}
                            isEdit
                          />
                          <div className="mt-3 flex items-center gap-2">
                            <button type="submit" disabled={editSubmitting} className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
                              {editSubmitting ? 'Saving…' : 'Save'}
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
                      <td className="px-3 py-3"><PlatformIcon platform={t.platform} /></td>
                      <td className="px-3 py-3"><TaskTypeBadge type={t.taskType} /></td>
                      <td className="px-3 py-3 text-gray-700">{t.targetCount?.toLocaleString() || '—'}</td>
                      <td className="px-3 py-3 text-gray-700">{t.credits ?? '—'}</td>
                      <td className="px-3 py-3 text-gray-600 capitalize">{t.proofRequired || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(STATUS_META[t.status] || STATUS_META.draft).cls}`}>
                          {(STATUS_META[t.status] || STATUS_META.draft).label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                        {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <button onClick={() => openEdit(t)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          {/* Assign */}
                          <button onClick={() => openAssign(t)} title="Assign to users" className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 hover:text-green-700 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                          </button>
                          {/* Toggle status */}
                          <button onClick={() => handleToggleStatus(t)} title={t.status === 'active' ? 'Pause' : 'Activate'} className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-500 hover:text-yellow-700 transition-colors">
                            {t.status === 'active'
                              ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                              : <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            }
                          </button>
                          {/* Delete */}
                          <button onClick={() => handleDelete(t._id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
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

      {/* Assign Modal */}
      {assignTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Assign Task</h2>
              <button type="button" onClick={() => setAssignTask(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Task Summary Card */}
            <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{TASK_TYPE_META[assignTask.taskType]?.icon || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{assignTask.title}</p>
                  {assignTask.description && <p className="text-sm text-gray-600 mt-0.5">{assignTask.description}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-orange-200 text-orange-700 font-medium">{assignTask.taskType?.replace('_',' ')}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-green-200 text-green-700 font-medium">{assignTask.credits} credits</span>
                    <PlatformIcon platform={assignTask.platform} />
                    {assignTask.proofRequired && <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">Proof: {assignTask.proofRequired}</span>}
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

            {/* Reel Picker from Content Pool */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">Select Reel from Content Pool <span className="text-gray-400 font-normal">(optional)</span></p>
              {assignSelectedReel && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <video src={assignSelectedReel.s3Url} className="w-12 h-10 rounded object-cover bg-black flex-shrink-0" />
                  <p className="text-xs font-medium text-green-800 flex-1 truncate">{assignSelectedReel.title || 'Selected Reel'}</p>
                  <button type="button" onClick={() => setAssignSelectedReel(null)} className="text-xs text-red-500 hover:text-red-700 flex-shrink-0">✕ Remove</button>
                </div>
              )}
              {assignPoolsLoading ? (
                <p className="text-xs text-gray-400">Loading pools…</p>
              ) : assignPools.length === 0 ? (
                <p className="text-xs text-gray-400">No content pools found.</p>
              ) : (
                <div className="flex flex-wrap gap-2 mb-2">
                  {assignPools.map(pool => (
                    <button
                      key={pool._id}
                      type="button"
                      onClick={() => assignExpandedPool === pool._id ? setAssignExpandedPool(null) : loadPoolReels(pool._id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        assignExpandedPool === pool._id
                          ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-yellow-300'
                      }`}
                    >
                      📁 {pool.name} ({pool.reelCount || 0})
                    </button>
                  ))}
                </div>
              )}
              {assignExpandedPool && (
                <div className="flex gap-2 overflow-x-auto pb-1 max-h-32">
                  {(assignPoolReels[assignExpandedPool] || []).length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No reels in this pool.</p>
                  ) : (
                    (assignPoolReels[assignExpandedPool] || []).map(reel => (
                      <div
                        key={reel._id}
                        onClick={() => setAssignSelectedReel(reel)}
                        className={`flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          assignSelectedReel?._id === reel._id
                            ? 'border-orange-500 ring-2 ring-orange-300'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <video src={reel.s3Url} className="w-16 h-14 object-cover bg-black" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Participants */}
            {participantsLoading ? (
              <div className="py-10 text-center text-gray-400 text-sm">Loading participants…</div>
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
                        <input
                          type="checkbox"
                          checked={checked}
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
                        {alreadyAssigned && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex-shrink-0">✓ Assigned</span>}
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
                onClick={handleAssignSubmit}
                disabled={assignLoading || !selectedAssignees.length || participantsLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:brightness-110 disabled:opacity-50 shadow-sm"
              >
                {assignLoading ? 'Assigning…' : `🚀 Assign to ${selectedAssignees.length} user(s)`}
              </button>
              <button type="button" onClick={() => setAssignTask(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskManagement = ({
  clientId,
  campaign,
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
  const selectedReelCount =
    expandedPoolId && selectedReelsByPool[expandedPoolId]
      ? selectedReelsByPool[expandedPoolId].length
      : 0;

  const allSelected =
    tasks.length > 0 && tasks.every((t) => selectedTasks.has(`${t.reelId}-${t.userId}`));

  return (
    <div className="w-full max-w-6xl space-y-6">
      <CampaignTasksSection campaignId={campaign?._id} clientId={clientId} />

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Task Management Hub</h2>
        <p className="text-gray-600">
          Assign content, approve tasks, and manage cancellations with penalty timers.
        </p>
      </div>

      {selectedUsers.length === 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-900">
            <strong>No participants selected.</strong> Reels selected ({selectedReelCount}) — open{' '}
            <strong>Participants</strong> tab and check users, then return here to assign.
          </p>
          {onGoToParticipants && (
            <button
              type="button"
              onClick={onGoToParticipants}
              className="shrink-0 px-4 py-2 text-sm font-medium text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100"
            >
              Select participants
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl border border-green-200 bg-green-50 text-sm text-green-900">
          <span className="font-semibold">{selectedUsers.length}</span> participant(s) selected
          {selectedReelCount > 0 && (
            <>
              <span className="text-green-600">·</span>
              <span>
                <strong>{selectedReelCount}</strong> reel(s) selected for assignment
              </span>
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Pools & Reels</h3>
        <ContentPoolFolderView
          clientId={clientId}
          onPoolReelSelectionChange={onPoolReelSelectionChange}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
            <div>
              <label className="font-medium text-gray-900">Instagram</label>
              <p className="text-sm text-gray-600">Stories & Reels</p>
            </div>
            <input
              type="number"
              min={1}
              value={instagramReels || ''}
              onChange={(e) => onInstagramReelsChange(Number(e.target.value))}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-blue-50 rounded-lg border border-red-100">
            <div>
              <label className="font-medium text-gray-900">YouTube</label>
              <p className="text-sm text-gray-600">Shorts & Videos</p>
            </div>
            <input
              type="number"
              min={1}
              value={youtubeReels || ''}
              onChange={(e) => onYoutubeReelsChange(Number(e.target.value))}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">Reels Per User:</label>
            <input
              type="number"
              value={reelsPerUser}
              onChange={(e) => {
                const v = e.target.value;
                onReelsPerUserChange(v === '' ? '' : parseInt(v, 10));
              }}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center"
              disabled={sendLoading}
            />
          </div>
          <button
            type="button"
            className="px-6 py-2.5 rounded-lg text-white bg-gradient-to-r from-yellow-500 to-orange-600 hover:brightness-110 disabled:opacity-50"
            onClick={onSendCampaign}
            disabled={sendLoading}
          >
            {sendLoading ? 'Sending...' : 'Quick Assign (selected users)'}
          </button>
        </div>
        {(sendError || sendSuccess) && (
          <div className="space-y-2">
            {sendError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {sendError}
              </div>
            )}
            {sendSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {sendSuccess}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Assigned Tasks</h3>
          <button
            type="button"
            onClick={fetchTasks}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            Refresh
          </button>
        </div>

        <TaskControlPanel
          autoApproval={autoApproval}
          onToggleAutoApproval={toggleAutoApproval}
          toggleLoading={toggleLoading}
          selectedCount={selectedTasks.size}
          onBulkAccept={onBulkAccept}
          onBulkReject={onBulkReject}
          onOpenBulkAssign={onOpenBulkAssign}
          bulkLoading={bulkLoading}
        />

        {tasksLoading ? (
          <div className="py-12 text-center text-gray-500">Loading tasks...</div>
        ) : tasksError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{tasksError}</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="font-medium">No tasks yet</p>
            <p className="text-sm mt-1">Select participants and reels, then assign from Bulk Assign or Quick Assign.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-lg max-h-[28rem] overflow-y-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onSelectAllTasks}
                      aria-label="Select all tasks"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Task</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Credits</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Timer</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task, idx) => (
                  <TaskRow
                    key={`${task.reelId}-${task.userId}-${idx}`}
                    task={task}
                    autoApproval={autoApproval}
                    penaltyThresholdMinutes={penaltyThresholdMinutes}
                    cancellationPenalty={cancellationPenalty}
                    allowCancellation={allowCancellation}
                    isSelected={selectedTasks.has(`${task.reelId}-${task.userId}`)}
                    onSelect={onTaskSelect}
                    onAccept={onAccept}
                    onReject={onReject}
                    onCancel={onCancel}
                    onViewUser={onViewUser}
                    actionLoading={taskActionLoading}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BulkAssignment
        open={bulkAssignOpen}
        onClose={onCloseBulkAssign}
        selectedUserCount={selectedUsers.length}
        selectedReelCount={selectedReelCount}
        reelsPerUser={reelsPerUser}
        onReelsPerUserChange={onReelsPerUserChange}
        strategy={assignStrategy}
        onStrategyChange={onAssignStrategyChange}
        onAssign={onBulkAssign}
        loading={bulkAssignLoading}
        error={bulkAssignError}
        success={bulkAssignSuccess}
      />
    </div>
  );
};

export default TaskManagement;
