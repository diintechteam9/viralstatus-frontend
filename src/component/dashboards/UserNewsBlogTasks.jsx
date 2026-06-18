import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../config';

const PLATFORM_ICONS = { instagram: '📸', youtube: '▶️', both: '📸▶️', any: '🌐' };
const PLATFORM_LABELS = { instagram: 'Instagram', youtube: 'YouTube', both: 'Both', any: 'Any Platform' };
const CAT_COLORS = {
  News: 'bg-blue-100 text-blue-700',
  Blog: 'bg-green-100 text-green-700',
  Announcement: 'bg-orange-100 text-orange-700',
  Update: 'bg-purple-100 text-purple-700',
  Tips: 'bg-pink-100 text-pink-700',
};
const SUB_STATUS = {
  pending: { label: '⏳ Under Review', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '✅ Approved', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '❌ Rejected', cls: 'bg-red-100 text-red-600' },
};

function UserNewsBlogTasks() {
  const userData = JSON.parse(localStorage.getItem('mobileUserData') || '{}');
  const googleId = userData.googleId || localStorage.getItem('googleId') || '';

  const [view, setView] = useState('list'); // list | detail
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // all | pending | done

  // Submit form state
  const [postUrl, setPostUrl] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!googleId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog-tasks/user/${googleId}/tasks`);
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch { setTasks([]); }
    finally { setLoading(false); }
  }, [googleId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openDetail = (task) => {
    setSelectedTask(task);
    setPostUrl('');
    setPlatform(task.platform !== 'any' && task.platform !== 'both' ? task.platform : 'instagram');
    setSubmitMsg('');
    setView('detail');
  };

  // Submit task
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postUrl.trim()) { setSubmitMsg('Please paste your post URL.'); return; }
    setSubmitting(true); setSubmitMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-blog-tasks/${selectedTask._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleId, postUrl: postUrl.trim(), platform }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMsg('✅ Submitted! Your post is under review. Credits will be awarded once approved.');
        // Update local task state
        setTasks(prev => prev.map(t => t._id === selectedTask._id
          ? { ...t, mySubmission: data.submission }
          : t
        ));
        setSelectedTask(prev => ({ ...prev, mySubmission: data.submission }));
        setPostUrl('');
      } else {
        setSubmitMsg('❌ ' + (data.message || 'Submission failed'));
      }
    } catch { setSubmitMsg('❌ Server error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  // Stats
  const totalTasks = tasks.length;
  const submittedTasks = tasks.filter(t => t.mySubmission).length;
  const approvedTasks = tasks.filter(t => t.mySubmission?.status === 'approved').length;
  const totalCreditsEarned = tasks
    .filter(t => t.mySubmission?.status === 'approved' && t.mySubmission?.isCreditAwarded)
    .reduce((s, t) => s + (t.mySubmission?.credits || t.credits || 0), 0);

  const filtered = tasks.filter(t => {
    if (filterTab === 'pending') return !t.mySubmission;
    if (filterTab === 'done') return !!t.mySubmission;
    return true;
  });

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (view === 'detail' && selectedTask) {
    const sub = selectedTask.mySubmission;
    const isSubmitted = !!sub;
    const isApproved = sub?.status === 'approved';

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => { setView('list'); fetchTasks(); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            ← Back
          </button>
          <h2 className="text-lg font-bold text-gray-900">Task Details</h2>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          {/* Post Card */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {selectedTask.imageUrl && (
              <img src={selectedTask.imageUrl} alt="" className="w-full h-44 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${CAT_COLORS[selectedTask.category] || 'bg-gray-100 text-gray-600'}`}>
                  {selectedTask.category}
                </span>
                <span className="text-xs text-gray-500">{PLATFORM_ICONS[selectedTask.platform]} {PLATFORM_LABELS[selectedTask.platform]}</span>
                <span className="ml-auto text-sm font-bold text-green-600">{selectedTask.credits} pts</span>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">{selectedTask.title}</h3>
              {selectedTask.summary && <p className="text-sm text-gray-600 leading-relaxed">{selectedTask.summary}</p>}
            </div>
          </div>

          {/* Instructions */}
          {selectedTask.instructions && (
            <div className="bg-violet-50 rounded-xl border border-violet-100 p-4">
              <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">📌 Instructions</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTask.instructions}</p>
            </div>
          )}

          {/* Content Preview */}
          {selectedTask.content && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📄 Post Content</p>
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-6 whitespace-pre-wrap">{selectedTask.content}</p>
            </div>
          )}

          {/* Deadline */}
          {selectedTask.deadline && (
            <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-100">
              <span>⏰</span>
              <span>Deadline: {new Date(selectedTask.deadline).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          {/* Submission Status */}
          {isSubmitted && (
            <div className={`rounded-xl p-4 border ${isApproved ? 'bg-green-50 border-green-200' : sub.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${SUB_STATUS[sub.status]?.cls}`}>{SUB_STATUS[sub.status]?.label}</span>
                {sub.isCreditAwarded && <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">🪙 {sub.credits} Credits Earned</span>}
              </div>
              {sub.postUrl && (
                <a href={sub.postUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline break-all">{sub.postUrl}</a>
              )}
              {sub.status === 'rejected' && sub.rejectionReason && (
                <p className="text-xs text-red-600 mt-2">Reason: {sub.rejectionReason}</p>
              )}
            </div>
          )}

          {/* Submit Form — show if not submitted yet OR if rejected (can resubmit) */}
          {(!isSubmitted || sub?.status === 'rejected') && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h4 className="font-bold text-gray-800 mb-1">Submit Your Post</h4>
              <p className="text-xs text-gray-500 mb-4">
                Post this content on social media, then paste the public URL below to earn <strong className="text-green-600">{selectedTask.credits} credits</strong>.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Platform</label>
                  <div className="flex gap-2">
                    {['instagram', 'youtube', 'other'].map(pl => (
                      <button
                        key={pl}
                        type="button"
                        onClick={() => setPlatform(pl)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${platform === pl ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {pl === 'instagram' ? '📸 Instagram' : pl === 'youtube' ? '▶️ YouTube' : '🌐 Other'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Post URL *</label>
                  <input
                    type="url"
                    value={postUrl}
                    onChange={e => setPostUrl(e.target.value)}
                    placeholder="https://instagram.com/p/... or https://youtube.com/shorts/..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    required
                  />
                </div>

                {submitMsg && (
                  <p className={`text-sm font-medium ${submitMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{submitMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !postUrl.trim()}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl font-semibold text-sm hover:brightness-110 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                  ) : '🚀 Submit Post URL'}
                </button>
              </form>

              {/* Quick links */}
              <div className="flex gap-2 mt-4">
                <a href="https://www.instagram.com" target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-pink-50 border border-pink-200 text-pink-700 rounded-lg text-xs font-semibold hover:bg-pink-100 transition-colors">
                  📸 Open Instagram
                </a>
                <a href="https://studio.youtube.com" target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                  ▶️ YouTube Studio
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900">News & Blog Tasks</h2>
          <p className="text-gray-500 text-sm mt-0.5">Post articles on social media and earn credits</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

        {/* Stats */}
        {!loading && totalTasks > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Tasks', value: totalTasks, color: 'text-gray-800' },
              { label: 'Submitted', value: submittedTasks, color: 'text-blue-600' },
              { label: 'Approved', value: approvedTasks, color: 'text-green-600' },
              { label: 'Credits Earned', value: `${totalCreditsEarned} pts`, color: 'text-violet-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
                <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {!loading && totalTasks > 0 && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
            {[['all', 'All Tasks'], ['pending', 'Not Submitted'], ['done', 'Submitted']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterTab(val)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterTab === val ? 'bg-white text-violet-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📰</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              {filterTab === 'pending' ? 'All tasks submitted!' : filterTab === 'done' ? 'No submitted tasks' : 'No tasks available'}
            </h3>
            <p className="text-slate-500 text-sm">
              {filterTab === 'all' ? 'News/Blog tasks will appear here when assigned by clients.' : ''}
            </p>
          </div>
        )}

        {/* Task Cards */}
        <div className="space-y-3">
          {filtered.map(task => {
            const sub = task.mySubmission;
            return (
              <div
                key={task._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                onClick={() => openDetail(task)}
              >
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${CAT_COLORS[task.category] || 'bg-gray-100 text-gray-600'}`}>
                        {task.category}
                      </span>
                      <span className="text-[10px] text-gray-500">{PLATFORM_ICONS[task.platform]} {PLATFORM_LABELS[task.platform]}</span>
                      {sub && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SUB_STATUS[sub.status]?.cls}`}>
                          {SUB_STATUS[sub.status]?.label}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800 text-sm line-clamp-1">{task.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{task.summary || task.instructions || '—'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="font-bold text-green-600">{task.credits} pts</span>
                      {task.deadline && <span className="text-orange-500">⏰ {new Date(task.deadline).toLocaleDateString('en-IN')}</span>}
                      {sub?.isCreditAwarded && <span className="text-violet-600 font-semibold">🪙 Credits Awarded</span>}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="shrink-0 flex items-center">
                    <button
                      className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                        sub?.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : sub
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gradient-to-r from-violet-600 to-violet-700 text-white hover:brightness-110'
                      }`}
                    >
                      {sub?.status === 'approved' ? '✓ Done' : sub ? 'View Status' : 'Submit'}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-gray-100">
                  <div className={`h-1 transition-all ${
                    sub?.status === 'approved' ? 'bg-green-500 w-full' :
                    sub ? 'bg-yellow-400 w-2/3' : 'w-0'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UserNewsBlogTasks;
