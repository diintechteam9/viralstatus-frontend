import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiGlobe, FiLock, FiRefreshCw, FiMoreVertical, FiX, FiCheck, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import ContentPoolFolderView from '../ContentPoolFolderView';
import TaskControlPanel from './TaskControlPanel';
import TaskRow from './TaskRow';
import BulkAssignment from './BulkAssignment';
import { API_BASE_URL } from '../../../config';

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white';
const lbl = 'block text-xs font-medium text-gray-500 mb-1';

const EMPTY_FORM = {
  title: '', description: '', platform: 'instagram',
  credits: '', deadline: '',
  proofRequired: 'url', status: 'active', visibility: 'private',
};

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      {title && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</p>}
      {children}
    </div>
  );
}

// ── Create Reel Task Form ────────────────────────────────────────────────────
function CreateReelTaskForm({ campaignId, clientId, campaignType, onCreated }) {
  const defaultVisibility = campaignType === 'public' ? 'public' : 'private';
  const [form, setForm] = useState({ ...EMPTY_FORM, visibility: defaultVisibility });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const getToken = () => localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.credits || Number(form.credits) <= 0) { setError('Credits must be greater than 0'); return; }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...form,
          campaignId,
          clientId,
          contentCategory: 'reels',
          taskType: 'upload_reel',
          credits: Number(form.credits),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`"${data.task?.title || form.title}" task created successfully!`);
        setForm({ ...EMPTY_FORM, visibility: defaultVisibility });
        onCreated?.();
      } else {
        setError(data.message || 'Failed to create task');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <Section title="🎬 Create Reel Task">
      <form onSubmit={handleSubmit} className="space-y-4">

          {/* Visibility */}
          <div>
            <p className={lbl}>Who can see this task?</p>
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-all ${form.visibility !== 'public' ? 'border-orange-400 bg-orange-50 text-orange-800 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <input type="radio" checked={form.visibility !== 'public'} onChange={() => set('visibility', 'private')} className="accent-orange-500" />
                <FiLock size={13} /> Private — only assigned users
              </label>
              <label className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-all ${form.visibility === 'public' ? 'border-blue-400 bg-blue-50 text-blue-800 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <input type="radio" checked={form.visibility === 'public'} onChange={() => set('visibility', 'public')} className="accent-blue-500" />
                <FiGlobe size={13} /> Public — all users
              </label>
            </div>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className={lbl}>Task Title *</label>
              <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Post a Reel for Brand X" />
            </div>
            <div>
              <label className={lbl}>Platform</label>
              <select className={inp} value={form.platform} onChange={e => set('platform', e.target.value)}>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className={lbl}>Instructions for User *</label>
            <textarea rows={3} className={inp} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="e.g. Create a 30–60 sec reel featuring our product and post it with hashtag #BrandX" />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Credits *</label>
              <input type="number" min={1} className={inp} value={form.credits} onChange={e => set('credits', e.target.value)} placeholder="e.g. 50" />
            </div>
            <div>
              <label className={lbl}>Proof Type</label>
              <select className={inp} value={form.proofRequired} onChange={e => set('proofRequired', e.target.value)}>
                <option value="url">Reel URL</option>
                <option value="screenshot">Screenshot</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Optional fields */}
          <div>
            <label className={lbl}>Deadline <span className="text-gray-300">(optional)</span></label>
            <input type="datetime-local" className={inp} value={form.deadline} onChange={e => set('deadline', e.target.value)} />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={submitting}
              className="px-5 py-2 rounded-lg text-white text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors">
              {submitting ? 'Creating...' : '+ Create Task'}
            </button>
            {success && <span className="text-sm text-green-600 font-medium">✓ {success}</span>}
            {error && <span className="text-sm text-red-500">{error}</span>}
          </div>
        </form>
    </Section>
  );
}

// ── Created Reel Tasks Table ────────────────────────────────────────────────
const STATUS_CLS = {
  active:    'bg-green-100 text-green-700',
  draft:     'bg-gray-100 text-gray-600',
  paused:    'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
};

const VIS_CLS = {
  public:  'bg-blue-100 text-blue-700',
  private: 'bg-purple-100 text-purple-700',
};

const EMPTY_EDIT = {
  title: '', description: '', platform: 'instagram',
  credits: '', proofRequired: 'url', status: 'active',
  deadline: '', visibility: 'private',
};

function ModalShell({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-xl p-6 w-full mx-4 max-h-[85vh] overflow-y-auto ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <FiX size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreatedReelTasksTable({ campaignId, clientId: propClientId, isPublicCampaign = false }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const [sendTask, setSendTask] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [pools, setPools] = useState([]);
  const [poolsLoading, setPoolsLoading] = useState(false);
  const [expandedPoolId, setExpandedPoolId] = useState(null);
  const [poolReels, setPoolReels] = useState({});
  const [poolReelsLoading, setPoolReelsLoading] = useState({});
  const [selectedReel, setSelectedReel] = useState(null);
  const [reelsPerUser, setReelsPerUser] = useState(1);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const getToken = () => localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';

  const resolveClientId = () => {
    if (propClientId) return propClientId;
    try {
      const raw =
        localStorage.getItem('clientData') ||
        sessionStorage.getItem('clientData') ||
        '{}';
      const parsed = JSON.parse(raw);
      return parsed._id || parsed.id || parsed.clientId || '';
    } catch {
      return '';
    }
  };

  const fetchTasks = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setTasks((data.tasks || []).filter((t) => t.contentCategory === 'reels'));
      else setError(data.message || 'Failed to load');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    const handler = (e) => {
      if (openMenuId && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const openEdit = (task) => {
    setOpenMenuId(null);
    setEditTask(task);
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      platform: task.platform || 'instagram',
      credits: task.credits ?? '',
      proofRequired: task.proofRequired || 'url',
      status: task.status || 'active',
      deadline: task.deadline ? String(task.deadline).slice(0, 16) : '',
      visibility: task.visibility || 'private',
    });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTask) return;
    setEditSubmitting(true);
    setEditError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${editTask._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...editForm,
          credits: Number(editForm.credits) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setEditTask(null);
        fetchTasks();
      } else {
        setEditError(data.message || 'Update failed');
      }
    } catch {
      setEditError('Update failed');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (task) => {
    setOpenMenuId(null);
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    setDeleteLoadingId(task._id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${task._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) fetchTasks();
      else alert(data.message || 'Delete failed');
    } catch {
      alert('Delete failed');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const openSendReels = async (task) => {
    setOpenMenuId(null);
    setSendTask(task);
    setSelectedUserIds([]);
    setSelectedReel(null);
    setExpandedPoolId(null);
    setPoolReels({});
    setReelsPerUser(1);
    setAssignError('');
    setAssignSuccess('');
    setParticipantsLoading(true);
    setPoolsLoading(true);

    const clientId = resolveClientId();

    try {
      const fetches = [
        fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/participants`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
      ];
      if (clientId) {
        fetches.push(
          fetch(`${API_BASE_URL}/api/pools?clientId=${encodeURIComponent(clientId)}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          })
        );
      }

      const results = await Promise.all(fetches);
      const partRes = results[0];
      const partData = await partRes.json();

      if (partRes.ok) {
        const userIds = partData.userIds || [];
        const profiles = await Promise.all(
          userIds.map(async (id) => {
            try {
              const r = await fetch(`${API_BASE_URL}/api/user/by-googleid/${id}`);
              const d = await r.json();
              return {
                googleId: id,
                name: d.user?.name || d.user?.email || id,
                email: d.user?.email || '',
              };
            } catch {
              return { googleId: id, name: id, email: '' };
            }
          })
        );
        setParticipants(profiles);
      } else {
        setParticipants([]);
      }

      if (results[1]) {
        const poolRes = results[1];
        const poolData = await poolRes.json();
        if (poolRes.ok) setPools(poolData.pools || []);
        else setPools([]);
      } else {
        setPools([]);
      }
    } catch {
      setParticipants([]);
      setPools([]);
    } finally {
      setParticipantsLoading(false);
      setPoolsLoading(false);
    }
  };

  const loadPoolReels = async (poolId) => {
    if (poolReels[poolId]) {
      setExpandedPoolId(expandedPoolId === poolId ? null : poolId);
      return;
    }
    setPoolReelsLoading((prev) => ({ ...prev, [poolId]: true }));
    setExpandedPoolId(poolId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/${poolId}/reels`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setPoolReels((prev) => ({ ...prev, [poolId]: data.reels || [] }));
    } catch {
      setPoolReels((prev) => ({ ...prev, [poolId]: [] }));
    } finally {
      setPoolReelsLoading((prev) => ({ ...prev, [poolId]: false }));
    }
  };

  const toggleUser = (googleId) => {
    setSelectedUserIds((prev) =>
      prev.includes(googleId) ? prev.filter((id) => id !== googleId) : [...prev, googleId]
    );
  };

  const handleAssignReels = async () => {
    if (!sendTask) return;
    const assignToAll = isPublicCampaign || sendTask.visibility === 'public';

    if (!assignToAll && selectedUserIds.length === 0) {
      setAssignError('Select at least one user');
      return;
    }
    if (!selectedReel) {
      setAssignError('Select a reel from the content pool');
      return;
    }

    setAssignLoading(true);
    setAssignError('');
    setAssignSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${sendTask._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          userIds: assignToAll ? [] : selectedUserIds,
          assignToAll,
          reelId: selectedReel._id,
          reelS3Url: selectedReel.s3Url || '',
          reelS3Key: selectedReel.s3Key || '',
          reelTitle: selectedReel.title || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignSuccess(data.message || 'Reels assigned successfully!');
        fetchTasks();
      } else {
        setAssignError(data.message || 'Assign failed');
      }
    } catch {
      setAssignError('Assign failed');
    } finally {
      setAssignLoading(false);
    }
  };

  const setEdit = (k, v) => setEditForm((p) => ({ ...p, [k]: v }));

  return (
    <Section>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Created Reel Tasks</p>
        <button
          type="button"
          onClick={fetchTasks}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <FiRefreshCw size={11} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-500 p-3 bg-red-50 rounded-lg">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">No reel tasks created yet.</div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full border-collapse min-w-[760px]">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Title', 'Platform', 'Credits', 'Proof', 'Visibility', 'Status', 'Deadline', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((t, i) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-sm">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[180px] truncate">{t.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{t.platform}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.credits}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{t.proofRequired}</td>
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
                        disabled={deleteLoadingId === t._id}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
                      >
                        <FiMoreVertical size={15} />
                      </button>
                      {openMenuId === t._id && (
                        <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] bg-white border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => { setOpenMenuId(null); setViewTask(t); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openSendReels(t)}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-orange-600 hover:bg-orange-50"
                          >
                            Send Reels
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            {deleteLoadingId === t._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewTask && (
        <ModalShell title="View Reel Task" onClose={() => setViewTask(null)}>
          <div className="space-y-4 text-sm">
            <div>
              <p className={lbl}>Title</p>
              <p className="font-medium text-gray-900">{viewTask.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={lbl}>Platform</p>
                <p className="text-gray-700 capitalize">{viewTask.platform}</p>
              </div>
              <div>
                <p className={lbl}>Credits</p>
                <p className="text-gray-700">{viewTask.credits}</p>
              </div>
              <div>
                <p className={lbl}>Status</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLS[viewTask.status] || STATUS_CLS.draft}`}>
                  {viewTask.status}
                </span>
              </div>
              <div>
                <p className={lbl}>Visibility</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${VIS_CLS[viewTask.visibility] || VIS_CLS.private}`}>
                  {viewTask.visibility}
                </span>
              </div>
              <div>
                <p className={lbl}>Proof Type</p>
                <p className="text-gray-700 capitalize">{viewTask.proofRequired}</p>
              </div>
              <div>
                <p className={lbl}>Deadline</p>
                <p className="text-gray-700">
                  {viewTask.deadline ? new Date(viewTask.deadline).toLocaleString('en-IN') : '—'}
                </p>
              </div>
            </div>
            <div>
              <p className={lbl}>Description / Instructions</p>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {viewTask.description || '—'}
              </p>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Edit Modal */}
      {editTask && (
        <ModalShell title="Edit Reel Task" onClose={() => setEditTask(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className={lbl}>Task Title</label>
              <input className={inp} value={editForm.title} onChange={(e) => setEdit('title', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Platform</label>
              <select className={inp} value={editForm.platform} onChange={(e) => setEdit('platform', e.target.value)}>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Instructions</label>
              <textarea rows={3} className={inp} value={editForm.description} onChange={(e) => setEdit('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Credits</label>
                <input type="number" min={1} className={inp} value={editForm.credits} onChange={(e) => setEdit('credits', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Proof Type</label>
                <select className={inp} value={editForm.proofRequired} onChange={(e) => setEdit('proofRequired', e.target.value)}>
                  <option value="url">Reel URL</option>
                  <option value="screenshot">Screenshot</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select className={inp} value={editForm.status} onChange={(e) => setEdit('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Deadline</label>
                <input type="datetime-local" className={inp} value={editForm.deadline} onChange={(e) => setEdit('deadline', e.target.value)} />
              </div>
            </div>
            <div>
              <p className={lbl}>Visibility</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" checked={editForm.visibility === 'private'} onChange={() => setEdit('visibility', 'private')} className="accent-orange-500" />
                  Private
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" checked={editForm.visibility === 'public'} onChange={() => setEdit('visibility', 'public')} className="accent-orange-500" />
                  Public
                </label>
              </div>
            </div>
            {editError && <p className="text-sm text-red-500">{editError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditTask(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={editSubmitting} className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Send Reels Modal */}
      {sendTask && (
        <ModalShell title={`Send Reels — ${sendTask.title}`} onClose={() => setSendTask(null)} wide>
          <div className="space-y-6">
            {/* Step 1 — Select Users */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 1 — Select Users</p>
              {(isPublicCampaign || sendTask.visibility === 'public') && (
                <div className="mb-3 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-800">
                  <FiGlobe size={13} className="inline mr-1.5" />
                  Public campaign — will assign to all users
                </div>
              )}
              {participantsLoading ? (
                <p className="text-sm text-gray-400">Loading participants...</p>
              ) : participants.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  No participants found. Add users in the Participants tab first.
                </p>
              ) : (
                <>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds(participants.map((p) => p.googleId))}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds([])}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Clear
                    </button>
                    <span className="text-xs text-gray-500 self-center ml-1">
                      {selectedUserIds.length} selected
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                    {participants.map((p) => (
                      <label key={p.googleId} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(p.googleId)}
                          onChange={() => toggleUser(p.googleId)}
                          className="accent-orange-500"
                        />
                        <span className="font-medium text-gray-800">{p.name}</span>
                        {p.email && <span className="text-gray-400 text-xs">{p.email}</span>}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Step 2 — Select Reels from Pool */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 2 — Select Reels from Pool</p>
              {poolsLoading ? (
                <p className="text-sm text-gray-400">Loading pools...</p>
              ) : pools.length === 0 ? (
                <p className="text-sm text-gray-500">No content pools found for this client.</p>
              ) : (
                <div className="space-y-2">
                  {pools.map((pool) => (
                    <div key={pool._id} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => loadPoolReels(pool._id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          {expandedPoolId === pool._id ? (
                            <FiChevronDown size={14} className="text-gray-400 mr-2" />
                          ) : (
                            <FiChevronRight size={14} className="text-gray-400 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-800">{pool.name || pool.poolName || 'Untitled Pool'}</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {pool.reelCount ?? poolReels[pool._id]?.length ?? '—'} reels
                        </span>
                      </button>
                      {expandedPoolId === pool._id && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                          {poolReelsLoading[pool._id] ? (
                            <p className="text-sm text-gray-400">Loading reels...</p>
                          ) : (poolReels[pool._id] || []).length === 0 ? (
                            <p className="text-sm text-gray-400">No reels in this pool.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                              {(poolReels[pool._id] || []).map((reel) => (
                                <label
                                  key={reel._id}
                                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                                    selectedReel?._id === reel._id
                                      ? 'border-orange-400 bg-orange-50'
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="selectedReel"
                                    checked={selectedReel?._id === reel._id}
                                    onChange={() => setSelectedReel(reel)}
                                    className="accent-orange-500 shrink-0"
                                  />
                                  {reel.s3Url ? (
                                    <video
                                      src={reel.s3Url}
                                      className="w-14 h-10 rounded object-cover bg-gray-200 shrink-0"
                                      muted
                                    />
                                  ) : (
                                    <div className="w-14 h-10 rounded bg-gray-200 shrink-0" />
                                  )}
                                  <span className="text-xs text-gray-700 truncate flex-1">{reel.title || 'Untitled'}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3 — Assign */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 3 — Assign</p>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div>
                  <label className={lbl}>Reels per user</label>
                  <input
                    type="number"
                    min={1}
                    value={reelsPerUser}
                    onChange={(e) => setReelsPerUser(Math.max(1, Number(e.target.value) || 1))}
                    className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAssignReels}
                  disabled={assignLoading}
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Reels to Users'}
                </button>
              </div>
              {assignError && <p className="mt-3 text-sm text-red-500">{assignError}</p>}
              {assignSuccess && <p className="mt-3 text-sm text-green-600 font-medium">✓ {assignSuccess}</p>}
            </div>
          </div>
        </ModalShell>
      )}
    </Section>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────
export default function ReelsTaskPanel({
  clientId,
  isPublicCampaign,
  selectedUsers,
  selectedReelsByPool,
  expandedPoolId,
  onPoolReelSelectionChange,
  reelsPerUser,
  onReelsPerUserChange,
  instagramReels,
  onInstagramReelsChange,
  youtubeReels,
  onYoutubeReelsChange,
  sendLoading,
  sendError,
  sendSuccess,
  onSendCampaign,
  onGoToParticipants,
  tasks,
  tasksLoading,
  tasksError,
  fetchTasks,
  autoApproval,
  toggleAutoApproval,
  toggleLoading,
  selectedTasks,
  onTaskSelect,
  onSelectAllTasks,
  onBulkAccept,
  onBulkReject,
  onOpenBulkAssign,
  bulkLoading,
  penaltyThresholdMinutes,
  cancellationPenalty,
  allowCancellation,
  onAccept,
  onReject,
  onCancel,
  onViewUser,
  taskActionLoading,
  bulkAssignOpen,
  onCloseBulkAssign,
  assignStrategy,
  onAssignStrategyChange,
  onBulkAssign,
  bulkAssignLoading,
  bulkAssignError,
  bulkAssignSuccess,
  selectedReelCount,
  hasSelectedReels,
  campaign,
}) {
  const allSelected = tasks.length > 0 && tasks.every(t => selectedTasks.has(`${t.reelId}-${t.userId}`));
  const [createdTasksKey, setCreatedTasksKey] = useState(0);

  return (
    <div className="space-y-4 pt-4">

      {/* ── Status Banner ── */}
      {!isPublicCampaign && selectedUsers.length === 0 ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">⚠️ No participants selected. Go to <strong>Participants</strong> tab first.</p>
          {onGoToParticipants && (
            <button type="button" onClick={onGoToParticipants}
              className="shrink-0 px-3 py-1.5 text-xs font-medium bg-white border border-amber-300 rounded-lg hover:bg-amber-100">
              Go to Participants
            </button>
          )}
        </div>
      ) : isPublicCampaign && selectedUsers.length === 0 ? (
        <div className="px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-800">
          <FiGlobe size={14} className="inline mr-1.5" />
          Public campaign — reels will be assigned to <strong>all registered users</strong>.
        </div>
      ) : (
        <div className="px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-sm text-green-800">
          ✓ <strong>{selectedUsers.length}</strong> participant(s) selected
          {selectedReelCount > 0 && <> · <strong>{selectedReelCount}</strong> reel(s) ready to assign</>}
        </div>
      )}

      {/* ── 1. Create Reel Task ── */}
      <CreateReelTaskForm
        campaignId={campaign?._id}
        clientId={clientId}
        campaignType={campaign?.campaignType}
        onCreated={() => { fetchTasks(); setCreatedTasksKey(k => k + 1); }}
      />

      {/* ── 1b. Created Reel Tasks ── */}
      <CreatedReelTasksTable
        key={createdTasksKey}
        campaignId={campaign?._id}
        clientId={clientId}
        isPublicCampaign={isPublicCampaign}
      />

      {/* ── 2. Select Reels from Pool ── */}
      <Section title="Select Reels from Content Pool">
        <ContentPoolFolderView clientId={clientId} onPoolReelSelectionChange={onPoolReelSelectionChange} />
      </Section>

      {/* ── 3. Assign Settings ── */}
      <Section title="Assign to Users">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Platform counts */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
              <span className="text-xs text-gray-500">Instagram</span>
              <input type="number" min={1} value={instagramReels || ''} onChange={e => onInstagramReelsChange(Number(e.target.value))}
                className="w-14 text-center text-sm border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-orange-400" />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
              <span className="text-xs text-gray-500">YouTube</span>
              <input type="number" min={1} value={youtubeReels || ''} onChange={e => onYoutubeReelsChange(Number(e.target.value))}
                className="w-14 text-center text-sm border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-orange-400" />
            </div>
          </div>

          {/* Reels per user + assign button */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Reels per user:</span>
              <input type="number" value={reelsPerUser}
                onChange={e => { const v = e.target.value; onReelsPerUserChange(v === '' ? '' : parseInt(v, 10)); }}
                className="w-16 text-center text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
                disabled={sendLoading} />
            </div>
            <button type="button"
              onClick={onSendCampaign}
              disabled={sendLoading || !hasSelectedReels}
              className="px-5 py-2 rounded-lg text-white text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition-colors">
              {sendLoading ? 'Assigning...' : `Quick Assign (${selectedUsers.length} users)`}
            </button>
          </div>
        </div>

        {sendError && <p className="mt-3 text-sm text-red-500">{sendError}</p>}
        {sendSuccess && <p className="mt-3 text-sm text-green-600 font-medium">✓ {sendSuccess}</p>}
      </Section>

      {/* ── 4. Assigned Tasks Table ── */}
      <Section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned Reel Tasks</p>
          <button type="button" onClick={fetchTasks}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            <FiRefreshCw size={11} /> Refresh
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
          <div className="py-10 text-center text-gray-400 text-sm">Loading tasks...</div>
        ) : tasksError ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{tasksError}</div>
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No reel tasks assigned yet.</div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-lg max-h-[28rem] overflow-y-auto mt-3">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-center w-10">
                    <input type="checkbox" checked={allSelected} onChange={onSelectAllTasks} />
                  </th>
                  {['User', 'Task', 'Status', 'Credits', 'Assigned', 'Timer', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
      </Section>

      <BulkAssignment
        open={bulkAssignOpen}
        onClose={onCloseBulkAssign}
        isPublicCampaign={isPublicCampaign}
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
}
