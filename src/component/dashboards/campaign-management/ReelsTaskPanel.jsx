import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiRefreshCw, FiMoreVertical, FiX, FiChevronDown, FiChevronRight,
  FiEye, FiEdit2, FiTrash2, FiSend, FiFilm, FiCheckCircle, FiXCircle,
  FiPause, FiPlay, FiUsers, FiList,
} from 'react-icons/fi';
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
  targetChannels: '', targetViews: '', cutoffViews: '',
};

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {icon && <span className="text-gray-400">{icon}</span>}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        </div>
      )}
      {children}
    </div>
  );
}

// ── Create Reel Task Form ────────────────────────────────────────────────────
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
  targetChannels: '', targetViews: '', cutoffViews: '',
};

function ModalShell({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-xl w-full mx-4 max-h-[85vh] flex flex-col ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <FiX size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {children}
        </div>
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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
      targetChannels: task.targetChannels || '',
      targetViews: task.targetViews ?? '',
      cutoffViews: task.cutoffViews ?? '',
    });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTask) return;
    if (!editForm.targetChannels.trim()) { setEditError('Target Channels is required'); return; }
    if (!editForm.targetViews || Number(editForm.targetViews) <= 0) { setEditError('Minimum Target Views must be greater than 0'); return; }
    setEditSubmitting(true);
    setEditError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${editTask._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...editForm,
          credits: Number(editForm.credits) || 0,
          targetViews: Number(editForm.targetViews) || 0,
          cutoffViews: Number(editForm.cutoffViews) || 0,
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
    <Section icon={<FiFilm size={14} />}>
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border text-pink-600 bg-pink-50 border-pink-200">
          <FiFilm size={12} /> Reel Tasks
        </span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 w-44"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
          <button
            type="button"
            onClick={fetchTasks}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <FiRefreshCw size={11} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-500 p-3 bg-red-50 rounded-lg">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">No reel tasks created yet.</div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Title', 'Platform', 'Channels', 'Views', 'Cutoff', 'Credits', 'Status', 'Deadline', 'Assign', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.filter(t =>
                (statusFilter === 'all' || t.status === statusFilter) &&
                (t.title?.toLowerCase().includes(search.toLowerCase()) || t.targetChannels?.toLowerCase().includes(search.toLowerCase()))
              ).map((t, i) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-3 py-2.5 text-sm font-medium text-gray-900 max-w-[140px] truncate">{t.title}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 capitalize">{t.platform}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[100px] truncate">{t.targetChannels || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700">{t.targetViews || '0'}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700">{t.cutoffViews || '0'}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700">{t.credits}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLS[t.status] || STATUS_CLS.draft}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                    {t.deadline ? new Date(t.deadline).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => openSendReels(t)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <FiSend size={11} /> Assign
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
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
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <FiEye size={13} className="text-gray-400" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <FiEdit2 size={13} className="text-gray-400" /> Edit
                          </button>
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(t)}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              <FiTrash2 size={13} /> {deleteLoadingId === t._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
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
                <p className={lbl}>Target Channels</p>
                <p className="text-gray-700 font-medium">{viewTask.targetChannels || '—'}</p>
              </div>
              <div>
                <p className={lbl}>Min Target Views</p>
                <p className="text-gray-700 font-medium">{viewTask.targetViews || '—'}</p>
              </div>
              <div>
                <p className={lbl}>Cutoff Views (MVR)</p>
                <p className="text-gray-700 font-medium">{viewTask.cutoffViews || '—'}</p>
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
              <div className="col-span-2">
                <label className={lbl}>Target Channels *</label>
                <input className={inp} value={editForm.targetChannels} onChange={(e) => setEdit('targetChannels', e.target.value)} placeholder="e.g. Instagram, YouTube" />
              </div>
              <div>
                <label className={lbl}>Minimum Target Views *</label>
                <input type="number" min={1} className={inp} value={editForm.targetViews} onChange={(e) => setEdit('targetViews', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Cutoff Views (MVR)</label>
                <input type="number" min={0} className={inp} value={editForm.cutoffViews} onChange={(e) => setEdit('cutoffViews', e.target.value)} />
              </div>
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


  return (
    <div className="space-y-3 pt-3">

      {/* ── Created Reel Tasks ── */}
      <CreatedReelTasksTable
        campaignId={campaign?._id}
        clientId={clientId}
        isPublicCampaign={isPublicCampaign}
      />

      {/* ── 4. Assigned Tasks Table ── */}
      <Section icon={<FiUsers size={14} />}>
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border text-pink-600 bg-pink-50 border-pink-200">
            <FiUsers size={12} /> Assigned Reel Tasks
          </span>
          <button type="button" onClick={fetchTasks}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
