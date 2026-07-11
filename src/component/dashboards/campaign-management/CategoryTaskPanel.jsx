import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiRefreshCw, FiMoreVertical, FiX, FiEye, FiEdit2, FiUserPlus,
  FiInbox, FiPause, FiPlay, FiTrash2, FiCheckCircle, FiXCircle,
  FiFilm, FiImage, FiVideo, FiStar, FiMapPin, FiList,
} from 'react-icons/fi';
import CategorySubmissionsPanel from './CategorySubmissionsPanel';
import { FormFields, EMPTY_FORM, labelCls } from './taskFormFields';
import { CAMPAIGN_TASK_TYPES } from '../../../constants/campaignTaskTypes';
import { API_BASE_URL } from '../../../config';

const STATUS_CLS = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
};

const STATUS_ICONS = {
  active: <FiPlay size={10} />,
  draft: <FiList size={10} />,
  paused: <FiPause size={10} />,
  completed: <FiCheckCircle size={10} />,
};

const VIS_CLS = {
  public: 'bg-blue-100 text-blue-700',
  private: 'bg-purple-100 text-purple-700',
};

const TASK_TYPE_LABELS = {
  like: 'Like', comment: 'Comment', share: 'Share', save: 'Save',
  follow: 'Follow', view: 'View', upload_reel: 'Upload Reel',
};

const CAT_ICONS = {
  reels: <FiFilm size={13} />,
  post: <FiImage size={13} />,
  ugc: <FiVideo size={13} />,
  app_review: <FiStar size={13} />,
  gmb_review: <FiMapPin size={13} />,
};

const CAT_COLORS = {
  reels:      'text-pink-600 bg-pink-50 border-pink-200',
  post:       'text-blue-600 bg-blue-50 border-blue-200',
  ugc:        'text-violet-600 bg-violet-50 border-violet-200',
  app_review: 'text-amber-600 bg-amber-50 border-amber-200',
  gmb_review: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

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

function ConfirmModal({ title, description, onConfirm, onCancel, confirmLabel = 'Confirm', loading, error }) {
  return (
    <ModalShell title={title} onClose={onCancel} wide>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">{loading ? 'Deleting…' : confirmLabel}</button>
        </div>
      </div>
    </ModalShell>
  );
}

function ViewField({ label, children }) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

function CreatedCategoryTasksTable({
  campaignId, clientId, contentCategory, isPublicCampaign, onRefresh,
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

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

  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const getToken = () => localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';

  const fetchTasks = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setTasks((data.tasks || []).filter((t) => t.contentCategory === contentCategory));
      else setError(data.message || 'Failed to load');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [campaignId, contentCategory]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    const handler = (e) => {
      if (openMenuId && menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const taskToForm = (task) => ({
    title: task.title || '',
    description: task.description || '',
    platform: task.platform || 'instagram',
    taskType: task.taskType || 'like',
    targetUrl: task.targetUrl || '',
    targetCount: task.targetCount ?? '',
    credits: task.credits ?? '',
    proofRequired: task.proofRequired || 'screenshot',
    status: task.status || 'active',
    deadline: task.deadline ? String(task.deadline).slice(0, 16) : '',
    visibility: task.visibility || 'private',
    appName: task.appName || '',
    businessName: task.businessName || '',
    minRating: task.minRating || '5',
    script: task.script || '',
    referenceVideoUrl: task.referenceVideoUrl || '',
  });

  const openEdit = (task) => {
    setOpenMenuId(null);
    setEditTask(task);
    setEditForm(taskToForm(task));
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
          targetCount: Number(editForm.targetCount) || 0,
          credits: Number(editForm.credits) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditTask(null);
        fetchTasks();
        onRefresh?.();
      } else {
        setEditError(data.message || 'Update failed');
      }
    } catch {
      setEditError('Update failed');
    } finally {
      setEditSubmitting(false);
    }
  };

  const [deleteTask, setDeleteTask] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = (task) => {
    setOpenMenuId(null);
    setDeleteTask(task);
    setDeleteError('');
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTask) return;
    setDeleteLoadingId(deleteTask._id);
    setDeleteError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${deleteTask._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        fetchTasks();
        onRefresh?.();
        setDeleteTask(null);
      } else {
        const d = await res.json();
        setDeleteError(d.message || 'Delete failed');
      }
    } catch {
      setDeleteError('Delete failed');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleToggleStatus = async (task) => {
    setOpenMenuId(null);
    const next = task.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${task._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) { fetchTasks(); onRefresh?.(); }
    } catch { /* silent */ }
  };

  const openAssign = async (task) => {
    setOpenMenuId(null);
    setAssignTask(task);
    setSelectedUserIds(task.assignedTo || []);
    setAssignError('');
    setAssignSuccess('');
    setParticipantsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/participants`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        const userIds = data.userIds || [];
        const profiles = await Promise.all(
          userIds.map(async (id) => {
            try {
              const r = await fetch(`${API_BASE_URL}/api/user/by-googleid/${id}`);
              const d = await r.json();
              return { googleId: id, name: d.user?.name || d.user?.email || id, email: d.user?.email || '' };
            } catch {
              return { googleId: id, name: id, email: '' };
            }
          })
        );
        setParticipants(profiles);
      } else {
        setParticipants([]);
      }
    } catch {
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignTask) return;
    const assignToAll = isPublicCampaign || assignTask.visibility === 'public';
    if (!assignToAll && !selectedUserIds.length) {
      setAssignError('Select at least one user');
      return;
    }
    setAssignLoading(true);
    setAssignError('');
    setAssignSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${assignTask._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          userIds: assignToAll ? [] : selectedUserIds,
          assignToAll,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignSuccess(data.message || 'Task assigned successfully!');
        fetchTasks();
        onRefresh?.();
      } else {
        setAssignError(data.message || 'Assign failed');
      }
    } catch {
      setAssignError('Assign failed');
    } finally {
      setAssignLoading(false);
    }
  };

  const openSubmissions = async (task) => {
    setOpenMenuId(null);
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
    setReviewLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${taskId}/review-submission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ userId, status }),
      });
      if (res.ok) openSubmissions(submissionsTask);
    } catch { /* silent */ }
    finally { setReviewLoading((prev) => ({ ...prev, [userId]: false })); }
  };

  const getTableColumns = () => {
    if (contentCategory === 'post') return ['#', 'Title', 'Platform', 'Action', 'Credits', 'Visibility', 'Status', 'Deadline', 'Actions'];
    if (contentCategory === 'ugc') return ['#', 'Title', 'Platform', 'Credits', 'Visibility', 'Status', 'Deadline', 'Actions'];
    if (contentCategory === 'app_review') return ['#', 'Title', 'App', 'Store', 'Credits', 'Visibility', 'Status', 'Deadline', 'Actions'];
    if (contentCategory === 'gmb_review') return ['#', 'Title', 'Business', 'Credits', 'Visibility', 'Status', 'Deadline', 'Actions'];
    return ['#', 'Title', 'Credits', 'Visibility', 'Status', 'Deadline', 'Actions'];
  };

  const renderExtraCells = (t) => {
    if (contentCategory === 'post') return (
      <>
        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{t.platform}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{TASK_TYPE_LABELS[t.taskType] || t.taskType}</td>
      </>
    );
    if (contentCategory === 'ugc') return (
      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{t.platform}</td>
    );
    if (contentCategory === 'app_review') return (
      <>
        <td className="px-4 py-3 text-sm text-gray-600">{t.appName || '—'}</td>
        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{t.platform?.replace('store', ' Store') || '—'}</td>
      </>
    );
    if (contentCategory === 'gmb_review') return (
      <td className="px-4 py-3 text-sm text-gray-600">{t.businessName || '—'}</td>
    );
    return null;
  };

  const typeLabel = CAMPAIGN_TASK_TYPES.find((t) => t.id === contentCategory)?.label || 'Task';

  return (
    <Section icon={CAT_ICONS[contentCategory]}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${CAT_COLORS[contentCategory] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
            {CAT_ICONS[contentCategory]}
            {typeLabel} Tasks
          </span>
        </div>
        <button type="button" onClick={fetchTasks} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <FiRefreshCw size={11} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-500 p-3 bg-red-50 rounded-lg">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">No {typeLabel.toLowerCase()} tasks created yet.</div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full border-collapse min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                {getTableColumns().map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((t, i) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-sm">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[180px] truncate">{t.title}</td>
                  {renderExtraCells(t)}
                  <td className="px-4 py-3 text-sm text-gray-700">{t.credits}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${VIS_CLS[t.visibility] || VIS_CLS.private}`}>
                      {t.visibility === 'public' ? '🌐' : '🔒'} {t.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLS[t.status] || STATUS_CLS.draft}`}>
                      {STATUS_ICONS[t.status] || STATUS_ICONS.draft}
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
                        <div className="absolute right-0 top-full mt-1 z-20 min-w-[168px] bg-white border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden">
                          <button type="button" onClick={() => { setOpenMenuId(null); setViewTask(t); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                            <FiEye size={13} className="text-gray-400" /> View
                          </button>
                          <button type="button" onClick={() => openEdit(t)} className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                            <FiEdit2 size={13} className="text-gray-400" /> Edit
                          </button>
                          {t.visibility !== 'public' && (
                            <button type="button" onClick={() => openAssign(t)} className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm font-medium text-orange-600 hover:bg-orange-50">
                              <FiUserPlus size={13} /> Assign Users
                            </button>
                          )}
                          <button type="button" onClick={() => openSubmissions(t)} className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                            <FiInbox size={13} className="text-gray-400" /> Submissions
                          </button>
                          <button type="button" onClick={() => handleToggleStatus(t)} className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                            {t.status === 'active'
                              ? <><FiPause size={13} className="text-yellow-500" /> Pause</>
                              : <><FiPlay size={13} className="text-green-500" /> Activate</>}
                          </button>
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button type="button" onClick={() => handleDelete(t)} className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
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

      {viewTask && (
        <ModalShell title={`View ${typeLabel} Task`} onClose={() => setViewTask(null)} wide>
          <div className="space-y-4">
            <ViewField label="Title"><span className="font-medium">{viewTask.title}</span></ViewField>
            <div className="grid grid-cols-2 gap-4">
              <ViewField label="Status">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLS[viewTask.status] || STATUS_CLS.draft}`}>{viewTask.status}</span>
              </ViewField>
              <ViewField label="Visibility">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${VIS_CLS[viewTask.visibility] || VIS_CLS.private}`}>{viewTask.visibility}</span>
              </ViewField>
              <ViewField label="Credits">{viewTask.credits}</ViewField>
              <ViewField label="Deadline">{viewTask.deadline ? new Date(viewTask.deadline).toLocaleString('en-IN') : '—'}</ViewField>
              {contentCategory === 'post' && (
                <>
                  <ViewField label="Platform"><span className="capitalize">{viewTask.platform}</span></ViewField>
                  <ViewField label="Action">{TASK_TYPE_LABELS[viewTask.taskType] || viewTask.taskType}</ViewField>
                  <ViewField label="Proof"><span className="capitalize">{viewTask.proofRequired}</span></ViewField>
                </>
              )}
              {contentCategory === 'ugc' && (
                <>
                  <ViewField label="Platform"><span className="capitalize">{viewTask.platform}</span></ViewField>
                  {viewTask.script && <ViewField label="Script"><p className="whitespace-pre-wrap">{viewTask.script}</p></ViewField>}
                  {viewTask.referenceVideoUrl && (
                    <ViewField label="Reference Video">
                      <a href={viewTask.referenceVideoUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline break-all">{viewTask.referenceVideoUrl}</a>
                    </ViewField>
                  )}
                </>
              )}
              {contentCategory === 'app_review' && (
                <>
                  <ViewField label="App Name">{viewTask.appName || '—'}</ViewField>
                  <ViewField label="Store"><span className="capitalize">{viewTask.platform}</span></ViewField>
                  <ViewField label="Min Rating">{viewTask.minRating} stars</ViewField>
                </>
              )}
              {contentCategory === 'gmb_review' && (
                <>
                  <ViewField label="Business">{viewTask.businessName || '—'}</ViewField>
                  <ViewField label="Min Rating">{viewTask.minRating} stars</ViewField>
                </>
              )}
            </div>
            {viewTask.targetUrl && contentCategory !== 'post' && (
              <ViewField label="Target URL">
                <a href={viewTask.targetUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline break-all">{viewTask.targetUrl}</a>
              </ViewField>
            )}
            <ViewField label="Instructions">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{viewTask.description || '—'}</p>
            </ViewField>
          </div>
        </ModalShell>
      )}

      {editTask && (
        <ModalShell title={`Edit ${typeLabel} Task`} onClose={() => setEditTask(null)} wide>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <FormFields vals={editForm} onChange={(k, v) => setEditForm((p) => ({ ...p, [k]: v }))} contentCategory={contentCategory} />
            {editError && <p className="text-sm text-red-500">{editError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditTask(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={editSubmitting} className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
      {deleteTask && (
        <ConfirmModal
          title="Delete Task"
          description={`Are you sure you want to delete \"${deleteTask.title}\"? This cannot be undone.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteTask(null)}
          loading={deleteLoadingId === deleteTask._id}
          error={deleteError}
          confirmLabel="Delete"
        />
      )}

      {assignTask && (
        <ModalShell title={`Assign — ${assignTask.title}`} onClose={() => setAssignTask(null)} wide>
          <div className="space-y-4">
            {participantsLoading ? (
              <p className="text-sm text-gray-400">Loading participants...</p>
            ) : participants.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                No participants found. Add users in the Participants tab first.
              </p>
            ) : (
              <>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedUserIds(participants.map((p) => p.googleId))} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">Select All</button>
                  <button type="button" onClick={() => setSelectedUserIds([])} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">Clear</button>
                  <span className="text-xs text-gray-500 self-center">{selectedUserIds.length} selected</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                  {participants.map((p) => (
                    <label key={p.googleId} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-sm">
                      <input type="checkbox" checked={selectedUserIds.includes(p.googleId)} onChange={() => setSelectedUserIds((prev) => prev.includes(p.googleId) ? prev.filter((id) => id !== p.googleId) : [...prev, p.googleId])} className="accent-orange-500" />
                      <span className="font-medium text-gray-800">{p.name}</span>
                      {p.email && <span className="text-gray-400 text-xs">{p.email}</span>}
                    </label>
                  ))}
                </div>
              </>
            )}
            {assignError && <p className="text-sm text-red-500">{assignError}</p>}
            {assignSuccess && <p className="text-sm text-green-600 font-medium">✓ {assignSuccess}</p>}
            <button type="button" onClick={handleAssignSubmit} disabled={assignLoading} className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
              {assignLoading ? 'Assigning...' : 'Assign to Users'}
            </button>
          </div>
        </ModalShell>
      )}

      {submissionsTask && (
        <ModalShell title={`Submissions — ${submissionsTask.title}`} onClose={() => setSubmissionsTask(null)} wide>
          {submissionsLoading ? (
            <p className="text-sm text-gray-400 py-6 text-center">Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub, idx) => (
                <div key={sub.userId + idx} className={`border rounded-xl p-4 ${sub.status === 'approved' ? 'border-green-200 bg-green-50' : sub.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{sub.userId}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN') : ''}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sub.status === 'approved' ? 'bg-green-200 text-green-800' : sub.status === 'rejected' ? 'bg-red-200 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {sub.status || 'pending'}
                      </span>
                      {sub.proofUrl && (
                        <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs text-orange-600 hover:underline truncate">View proof</a>
                      )}
                    </div>
                    {sub.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={() => handleReviewSubmission(submissionsTask._id, sub.userId, 'approved')} disabled={reviewLoading[sub.userId]} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50">
                          <FiCheckCircle size={12} /> Approve
                        </button>
                        <button type="button" onClick={() => handleReviewSubmission(submissionsTask._id, sub.userId, 'rejected')} disabled={reviewLoading[sub.userId]} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50">
                          <FiXCircle size={12} /> Reject
                        </button>
                      </div>
                    )}                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalShell>
      )}
    </Section>
  );
}

export default function CategoryTaskPanel({
  campaignId,
  clientId,
  contentCategory,
  campaignType,
  isPublicCampaign = false,
  selectedUsers = [],
  onTasksChanged,
}) {
  const typeMeta = CAMPAIGN_TASK_TYPES.find((t) => t.id === contentCategory);
  const [tasksKey, setTasksKey] = useState(0);
  const [catActionLoading, setCatActionLoading] = useState(false);
  const [catActionMsg, setCatActionMsg] = useState('');
  const [catActionErr, setCatActionErr] = useState('');

  const getToken = () => localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';

  const bumpRefresh = () => {
    setTasksKey((k) => k + 1);
    onTasksChanged?.();
  };

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

  const handleGenerate = async () => {
    setCatActionLoading(true);
    setCatActionMsg('');
    setCatActionErr('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ contentCategory, clientId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Generate failed');
      setCatActionMsg(data.message || 'Task generated');
      bumpRefresh();
    } catch (err) {
      setCatActionErr(err.message || 'Generate failed');
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleDistribute = async () => {
    setCatActionLoading(true);
    setCatActionMsg('');
    setCatActionErr('');
    try {
      const resolved = await resolveTargetUsers();
      if (resolved.error) { setCatActionErr(resolved.error); return; }
      const assignmentScope = isPublicCampaign && selectedUsers.length === 0 ? 'public' : 'private';
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ userIds: resolved.userIds, assignmentScope, contentCategory }),
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

  return (
    <div className="space-y-3 pt-3">

      <CreatedCategoryTasksTable
        key={tasksKey}
        campaignId={campaignId}
        clientId={clientId}
        contentCategory={contentCategory}
        isPublicCampaign={isPublicCampaign}
        onRefresh={onTasksChanged}
      />

      <CategorySubmissionsPanel
        campaignId={campaignId}
        contentCategory={contentCategory}
        typeLabel={typeMeta?.label}
      />
    </div>
  );
}
