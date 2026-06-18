import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../config';

const PLATFORMS = ['any', 'instagram', 'youtube', 'both'];
const PLATFORM_LABELS = { any: 'Any Platform', instagram: 'Instagram', youtube: 'YouTube', both: 'Both' };

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  draft: 'bg-gray-100 text-gray-500',
};

const SUB_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

function NewsBlogTaskManager({ clientId }) {
  const token =
    sessionStorage.getItem('clienttoken') ||
    localStorage.getItem('clienttoken') ||
    sessionStorage.getItem('admintoken') ||
    localStorage.getItem('admintoken');

  // ── State ──────────────────────────────────────────────────────────────────
  const [view, setView] = useState('tasks'); // tasks | create | submissions
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Create form
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [form, setForm] = useState({ newsBlogId: '', credits: 10, platform: 'any', deadline: '', instructions: '', status: 'active' });
  const [creating, setCreating] = useState(false);

  // Submissions view
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [reviewing, setReviewing] = useState(null);

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog-tasks/client/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch { setTasks([]); }
    finally { setLoading(false); }
  }, [clientId, token]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Fetch published posts (for dropdown in create form) ───────────────────
  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog?published=true`);
      const data = await res.json();
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch { setPosts([]); }
    finally { setPostsLoading(false); }
  };

  const openCreate = () => {
    fetchPosts();
    setForm({ newsBlogId: '', credits: 10, platform: 'any', deadline: '', instructions: '', status: 'active' });
    setMsg('');
    setView('create');
  };

  // ── Create task ────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.newsBlogId) { setMsg('Please select a News/Blog post.'); return; }
    setCreating(true); setMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, clientId, credits: Number(form.credits) }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✅ Task created successfully!');
        fetchTasks();
        setTimeout(() => { setView('tasks'); setMsg(''); }, 1500);
      } else {
        setMsg('❌ ' + (data.message || 'Failed to create task'));
      }
    } catch { setMsg('❌ Server error'); }
    finally { setCreating(false); }
  };

  // ── Delete task ────────────────────────────────────────────────────────────
  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/news-blog-tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch {}
  };

  // ── Toggle task status ─────────────────────────────────────────────────────
  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'active' ? 'paused' : 'active';
    try {
      await fetch(`${API_BASE_URL}/api/news-blog-tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch {}
  };

  // ── View submissions ───────────────────────────────────────────────────────
  const openSubmissions = async (task) => {
    setSelectedTask(task);
    setSubsLoading(true);
    setView('submissions');
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog-tasks/${task._id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
    } catch { setSubmissions([]); }
    finally { setSubsLoading(false); }
  };

  // ── Review submission ──────────────────────────────────────────────────────
  const handleReview = async (subId, status, reason = '') => {
    setReviewing(subId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog-tasks/submission/${subId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions(prev => prev.map(s => s._id === subId ? data.submission : s));
      }
    } catch {}
    finally { setReviewing(null); }
  };

  // ── SUBMISSIONS VIEW ───────────────────────────────────────────────────────
  if (view === 'submissions' && selectedTask) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('tasks'); setSelectedTask(null); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">← Back</button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Submissions</h2>
            <p className="text-xs text-gray-500">{selectedTask.title}</p>
          </div>
        </div>

        {subsLoading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-500 font-medium">No submissions yet</p>
            <p className="text-sm text-gray-400 mt-1">Users haven't submitted for this task yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => (
              <div key={sub._id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SUB_STATUS_COLORS[sub.status]}`}>
                        {sub.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">{sub.platform || '—'}</span>
                      {sub.isCreditAwarded && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-bold">✓ {sub.credits} Credits Awarded</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">User: <span className="font-medium text-gray-700">{sub.googleId}</span></p>
                    {sub.postUrl && (
                      <a href={sub.postUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline break-all line-clamp-1">{sub.postUrl}</a>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(sub.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  {sub.status === 'pending' && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleReview(sub._id, 'approved')}
                        disabled={reviewing === sub._id}
                        className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-60"
                      >
                        {reviewing === sub._id ? '...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt('Rejection reason (optional):') || '';
                          handleReview(sub._id, 'rejected', reason);
                        }}
                        disabled={reviewing === sub._id}
                        className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-60"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
                {sub.rejectionReason && (
                  <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-1.5">Reason: {sub.rejectionReason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── CREATE VIEW ────────────────────────────────────────────────────────────
  if (view === 'create') {
    const selectedPost = posts.find(p => p._id === form.newsBlogId);
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('tasks')} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">← Back</button>
          <h2 className="text-lg font-bold text-gray-900">Create News/Blog Task</h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <form onSubmit={handleCreate} className="space-y-4">

            {/* Post Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select News/Blog Post *</label>
              {postsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400"><div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> Loading posts...</div>
              ) : (
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.newsBlogId}
                  onChange={e => setForm(p => ({ ...p, newsBlogId: e.target.value }))}
                  required
                >
                  <option value="">-- Select a post --</option>
                  {posts.map(p => (
                    <option key={p._id} value={p._id}>[{p.category}] {p.title}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Post Preview */}
            {selectedPost && (
              <div className="flex gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                {selectedPost.imageUrl && <img src={selectedPost.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-violet-600">{selectedPost.category}</span>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{selectedPost.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{selectedPost.summary}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Credits */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Credits *</label>
                <input
                  type="number" min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.credits}
                  onChange={e => setForm(p => ({ ...p, credits: e.target.value }))}
                  required
                />
              </div>

              {/* Platform */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Platform</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.platform}
                  onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}
                >
                  {PLATFORMS.map(pl => <option key={pl} value={pl}>{PLATFORM_LABELS[pl]}</option>)}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Deadline (optional)</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Instructions for Users</label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. Post this article on Instagram/YouTube with caption #YovoAI and tag us..."
                value={form.instructions}
                onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
              />
            </div>

            {msg && (
              <p className={`text-sm font-medium ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setView('tasks')} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={creating} className="px-6 py-2 bg-violet-700 text-white rounded-lg text-sm font-semibold hover:bg-violet-800 disabled:opacity-60 flex items-center gap-2">
                {creating ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</> : '+ Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── TASKS LIST VIEW ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">News & Blog Tasks</h2>
          <p className="text-sm text-gray-500 mt-0.5">Assign news/blog posts as tasks to users — earn credits on posting</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-violet-700 text-white rounded-lg text-sm font-semibold hover:bg-violet-800 transition-colors">
          + Create Task
        </button>
      </div>

      {msg && <p className={`text-sm font-medium px-4 py-2 rounded-lg border ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{msg}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-5xl mb-3">📰</div>
          <p className="font-semibold text-gray-600">No tasks yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a task from any published News or Blog post</p>
          <button onClick={openCreate} className="mt-4 px-5 py-2 bg-violet-700 text-white rounded-lg text-sm font-semibold hover:bg-violet-800">+ Create First Task</button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const stats = task.submissionStats || {};
            return (
              <div key={task._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                    {task.imageUrl
                      ? <img src={task.imageUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-2xl">📰</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[task.status]}`}>{task.status.toUpperCase()}</span>
                        <span className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full text-[10px] font-bold">{task.category}</span>
                        <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full text-[10px]">{PLATFORM_LABELS[task.platform]}</span>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-green-600">{task.credits} pts</span>
                    </div>

                    <p className="font-semibold text-gray-800 text-sm line-clamp-1">{task.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{task.summary || task.instructions || '—'}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>👥 {task.assignedTo?.length || 0} assigned</span>
                      <span>📥 {stats.total || 0} submitted</span>
                      <span className="text-yellow-600">⏳ {stats.pending || 0} pending</span>
                      <span className="text-green-600">✓ {stats.approved || 0} approved</span>
                      {task.deadline && <span className="text-orange-500">⏰ {new Date(task.deadline).toLocaleDateString('en-IN')}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-4 pb-3 pt-1 border-t border-gray-50">
                  <button
                    onClick={() => openSubmissions(task)}
                    className="px-4 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-semibold hover:bg-violet-100 transition-colors"
                  >
                    📋 View Submissions ({stats.total || 0})
                  </button>
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${task.status === 'active' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                  >
                    {task.status === 'active' ? '⏸ Pause' : '▶ Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="px-4 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors ml-auto"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NewsBlogTaskManager;
