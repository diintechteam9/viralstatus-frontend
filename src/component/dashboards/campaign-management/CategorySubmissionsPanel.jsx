import React, { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiX, FiRefreshCw, FiExternalLink, FiUser, FiClock, FiImage } from 'react-icons/fi';
import { API_BASE_URL } from '../../../config';
import { CAMPAIGN_TASK_TYPES } from '../../../constants/campaignTaskTypes';

const getToken = () =>
  localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected:  'bg-red-100 text-red-800 border-red-200',
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
};

function ProofPreview({ url }) {
  const [imgError, setImgError] = useState(false);
  if (!url) return <span className="text-xs text-gray-400 italic">No proof submitted</span>;

  const isImage = /\.(jpg|jpeg|png|gif|webp|jfif|bmp|avif)($|\?)/i.test(url) || url.includes('/uploads/proofs/');

  if (isImage && !imgError) {
    return (
      <div className="mt-2">
        <img
          src={url}
          alt="Proof"
          className="h-32 w-auto rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-90"
          onError={() => setImgError(true)}
          onClick={() => window.open(url, '_blank')}
        />
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1 hover:underline">
          <FiExternalLink size={11} /> Open full size
        </a>
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-blue-600 mt-2 hover:underline bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
      <FiExternalLink size={12} /> View Proof
    </a>
  );
}

function UserBadge({ userId }) {
  const short = userId ? userId.slice(-6) : '?';
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {short[0]?.toUpperCase()}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
          <FiUser size={10} /> User
        </p>
        <p className="text-[11px] text-gray-500 font-mono">{userId}</p>
      </div>
    </div>
  );
}

export default function CategorySubmissionsPanel({ campaignId, contentCategory, typeLabel }) {
  const [submissions, setSubmissions]       = useState([]);
  const [ugcSubmissions, setUgcSubmissions] = useState([]);
  const [stats, setStats]                   = useState({ total: 0, pending: 0, approved: 0, rejected: 0, creditsGiven: 0 });
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [reviewLoading, setReviewLoading]   = useState({});
  const [filter, setFilter]                 = useState('all');
  const [customCredits, setCustomCredits]   = useState({});

  const isUgc = contentCategory === 'ugc';

  const fetchData = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError('');
    try {
      if (isUgc) {
        const res  = await fetch(`${API_BASE_URL}/api/ugc/submissions/${campaignId}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        const list = data.submissions || [];
        setUgcSubmissions(list);
        setStats({
          total:        list.length,
          pending:      list.filter(s => s.status === 'pending').length,
          approved:     list.filter(s => s.status === 'approved').length,
          rejected:     list.filter(s => s.status === 'rejected').length,
          creditsGiven: list.filter(s => s.status === 'approved').reduce((s, x) => s + (x.creditsEarned || 0), 0),
        });
      } else {
        const qs   = contentCategory ? `?contentCategory=${encodeURIComponent(contentCategory)}` : '';
        const res  = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/submissions-by-category${qs}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load submissions');
        setSubmissions(data.submissions || []);
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0, creditsGiven: 0 });
      }
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [campaignId, contentCategory, isUgc]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReviewCampaign = async (taskId, userId, status, overrideCredits) => {
    const key = `${taskId}-${userId}`;
    setReviewLoading(p => ({ ...p, [key]: true }));
    try {
      const body = { userId, status };
      if (status === 'approved' && overrideCredits) body.customCredits = overrideCredits;
      const res  = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${taskId}/review-submission`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Review failed');
      setCustomCredits(p => { const n = { ...p }; delete n[key]; return n; });
      fetchData();
    } catch (err) {
      alert(err.message || 'Review failed');
    } finally {
      setReviewLoading(p => ({ ...p, [`${taskId}-${userId}`]: false }));
    }
  };

  const handleReviewUgc = async (submissionId, status) => {
    setReviewLoading(p => ({ ...p, [submissionId]: true }));
    try {
      const res  = await fetch(`${API_BASE_URL}/api/ugc/submission/${submissionId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Review failed');
      fetchData();
    } catch (err) {
      alert(err.message || 'Review failed');
    } finally {
      setReviewLoading(p => ({ ...p, [submissionId]: false }));
    }
  };

  const typeMeta  = CAMPAIGN_TASK_TYPES.find(t => t.id === contentCategory);
  const label     = typeLabel || typeMeta?.label || 'Task';
  const allList   = isUgc ? ugcSubmissions : submissions;
  const filtered  = filter === 'all' ? allList : allList.filter(s => s.status === filter);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            {typeMeta?.icon} {label} — Submissions Inbox
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Approve, reject & credit users for {label} tasks</p>
        </div>
        <button type="button" onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm">
          <FiRefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2 p-4 bg-gray-50 border-b border-gray-100">
        {[
          { lbl: 'Total',    val: stats.total,        cls: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100',   filter: 'all'      },
          { lbl: 'Pending',  val: stats.pending,      cls: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-100', filter: 'pending'  },
          { lbl: 'Approved', val: stats.approved,     cls: 'text-green-700',  bg: 'bg-green-50 border-green-100', filter: 'approved' },
          { lbl: 'Rejected', val: stats.rejected,     cls: 'text-red-700',    bg: 'bg-red-50 border-red-100',     filter: 'rejected' },
          { lbl: 'Credits',  val: stats.creditsGiven, cls: 'text-orange-700', bg: 'bg-orange-50 border-orange-100', filter: null      },
        ].map(({ lbl, val, cls, bg, filter: f }) => (
          <button key={lbl} type="button"
            onClick={() => f && setFilter(f)}
            className={`rounded-xl px-3 py-2 border text-center transition-all ${bg} ${f && filter === f ? 'ring-2 ring-offset-1 ring-orange-400' : ''} ${f ? 'cursor-pointer hover:brightness-95' : 'cursor-default'}`}>
            <p className={`text-lg font-extrabold ${cls}`}>{val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase">{lbl}</p>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 pt-3">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
              filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="p-4 max-h-[520px] overflow-y-auto space-y-3">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-sm text-gray-400">Loading submissions…</p>
          </div>
        ) : error ? (
          <p className="text-center text-red-600 text-sm py-8 bg-red-50 rounded-xl">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-2 text-gray-400">
            <FiImage size={32} className="opacity-30" />
            <p className="font-medium text-gray-500">No {filter !== 'all' ? filter : ''} submissions yet</p>
            <p className="text-xs text-center">Users will appear here once they submit proof for {label} tasks.</p>
          </div>
        ) : isUgc ? (
          filtered.map(sub => (
            <div key={sub._id} className={`border rounded-xl p-4 transition-all ${
              sub.status === 'approved' ? 'border-green-200 bg-green-50' :
              sub.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
            }`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <UserBadge userId={sub.userId} />
                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[sub.status] || STATUS_BADGE.pending}`}>
                      {sub.status}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <FiClock size={10} /> {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN') : '—'}
                    </span>
                  </div>
                  {sub.videoUrl && (
                    <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 mt-2 hover:underline">
                      <FiExternalLink size={12} /> View video
                    </a>
                  )}
                  <p className="text-xs text-gray-500 mt-1 font-medium">Credits: {sub.creditsEarned || 0}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {sub.status === 'pending' ? (
                    <>
                      <button type="button" disabled={reviewLoading[sub._id]}
                        onClick={() => handleReviewUgc(sub._id, 'approved')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50">
                        <FiCheck size={13} /> Approve & Credit
                      </button>
                      <button type="button" disabled={reviewLoading[sub._id]}
                        onClick={() => handleReviewUgc(sub._id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-50">
                        <FiX size={13} /> Reject
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize ${STATUS_BADGE[sub.status]}`}>
                      {sub.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          filtered.map((sub, idx) => (
            <div key={`${sub.taskId}-${sub.userId}-${idx}`} className={`border rounded-xl p-4 transition-all ${
              sub.status === 'approved' ? 'border-green-200 bg-green-50' :
              sub.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
            }`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Task title */}
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wide truncate mb-1">{sub.taskTitle}</p>

                  {/* User */}
                  <UserBadge userId={sub.userId} />

                  {/* Meta row */}
                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[sub.status] || STATUS_BADGE.pending}`}>
                      {sub.status}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <FiClock size={10} /> {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN') : '—'}
                    </span>
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                      +{sub.credits || 0} credits on approve
                    </span>
                  </div>

                  {/* Proof */}
                  <ProofPreview url={sub.proofUrl} />
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {sub.status === 'pending' ? (
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs text-gray-500">Credits:</span>
                        <input
                          type="number"
                          min={0}
                          placeholder={sub.credits || 0}
                          value={customCredits[`${sub.taskId}-${sub.userId}`] ?? ''}
                          onChange={e => setCustomCredits(p => ({ ...p, [`${sub.taskId}-${sub.userId}`]: e.target.value }))}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-xs text-center focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                      </div>
                      <button type="button"
                        disabled={reviewLoading[`${sub.taskId}-${sub.userId}`]}
                        onClick={() => handleReviewCampaign(sub.taskId, sub.userId, 'approved', customCredits[`${sub.taskId}-${sub.userId}`] || sub.credits)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 w-full justify-center">
                        {reviewLoading[`${sub.taskId}-${sub.userId}`] ? '…' : <><FiCheck size={13} /> Approve & Credit</>}
                      </button>
                      <button type="button"
                        disabled={reviewLoading[`${sub.taskId}-${sub.userId}`]}
                        onClick={() => handleReviewCampaign(sub.taskId, sub.userId, 'rejected')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-50 w-full justify-center">
                        {reviewLoading[`${sub.taskId}-${sub.userId}`] ? '…' : <><FiX size={13} /> Reject</>}
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize ${STATUS_BADGE[sub.status]}`}>
                      {sub.status === 'approved' ? `✓ Approved (+${sub.creditsGiven ?? sub.credits} credits)` : '✗ Rejected'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
