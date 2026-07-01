import React, { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiX, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import { API_BASE_URL } from '../../../config';
import { CAMPAIGN_TASK_TYPES } from '../../../constants/campaignTaskTypes';

const getToken = () =>
  localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';

export default function CategorySubmissionsPanel({ campaignId, contentCategory, typeLabel }) {
  const [submissions, setSubmissions] = useState([]);
  const [ugcSubmissions, setUgcSubmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, creditsGiven: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewLoading, setReviewLoading] = useState({});

  const isUgc = contentCategory === 'ugc';

  const fetchData = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError('');
    try {
      if (isUgc) {
        const res = await fetch(`${API_BASE_URL}/api/ugc/submissions/${campaignId}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        const list = data.submissions || [];
        setUgcSubmissions(list);
        setStats({
          total: list.length,
          pending: list.filter((s) => s.status === 'pending').length,
          approved: list.filter((s) => s.status === 'approved').length,
          rejected: list.filter((s) => s.status === 'rejected').length,
          creditsGiven: list.filter((s) => s.status === 'approved').reduce((s, x) => s + (x.creditsEarned || 0), 0),
        });
      } else {
        const qs = contentCategory ? `?contentCategory=${encodeURIComponent(contentCategory)}` : '';
        const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaignId}/submissions-by-category${qs}`, {
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

  const handleReviewCampaign = async (taskId, userId, status) => {
    const key = `${taskId}-${userId}`;
    setReviewLoading((p) => ({ ...p, [key]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/task/${taskId}/review-submission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ userId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Review failed');
      fetchData();
    } catch (err) {
      alert(err.message || 'Review failed');
    } finally {
      setReviewLoading((p) => ({ ...p, [key]: false }));
    }
  };

  const handleReviewUgc = async (submissionId, status) => {
    setReviewLoading((p) => ({ ...p, [submissionId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/ugc/submission/${submissionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Review failed');
      fetchData();
    } catch (err) {
      alert(err.message || 'Review failed');
    } finally {
      setReviewLoading((p) => ({ ...p, [submissionId]: false }));
    }
  };

  const typeMeta = CAMPAIGN_TASK_TYPES.find((t) => t.id === contentCategory);
  const label = typeLabel || typeMeta?.label || 'Task';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            {typeMeta?.icon} {label} — Submissions Inbox
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Approve, reject & credit users for {label} tasks</p>
        </div>
        <button type="button" onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg">
          <FiRefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4 bg-blue-50/50 border-b border-gray-100">
        {[
          ['Total', stats.total, 'text-blue-700'],
          ['Pending', stats.pending, 'text-yellow-700'],
          ['Approved', stats.approved, 'text-green-700'],
          ['Rejected', stats.rejected, 'text-red-700'],
          ['Credits', stats.creditsGiven, 'text-orange-700'],
        ].map(([lbl, val, cls]) => (
          <div key={lbl} className="bg-white rounded-xl px-3 py-2 border border-gray-100 text-center">
            <p className={`text-lg font-extrabold ${cls}`}>{val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase">{lbl}</p>
          </div>
        ))}
      </div>

      <div className="p-4 max-h-[420px] overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-8">Loading submissions…</p>
        ) : error ? (
          <p className="text-center text-red-600 text-sm py-8">{error}</p>
        ) : isUgc ? (
          ugcSubmissions.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No UGC submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {ugcSubmissions.map((sub) => (
                <div key={sub._id} className={`border rounded-xl p-4 ${
                  sub.status === 'approved' ? 'border-green-200 bg-green-50' :
                  sub.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{sub.userName || sub.userId}</p>
                      <p className="text-xs text-gray-500">{sub.userId}</p>
                      {sub.videoUrl && (
                        <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1 hover:underline">
                          <FiExternalLink size={12} /> View video
                        </a>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Credits: {sub.creditsEarned || 0}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.status === 'pending' ? (
                        <>
                          <button type="button" disabled={reviewLoading[sub._id]} onClick={() => handleReviewUgc(sub._id, 'approved')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50">
                            <FiCheck size={14} /> Approve
                          </button>
                          <button type="button" disabled={reviewLoading[sub._id]} onClick={() => handleReviewUgc(sub._id, 'rejected')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50">
                            <FiX size={14} /> Reject
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${
                          sub.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>{sub.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : submissions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No submissions yet for {label}.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub, idx) => (
              <div key={`${sub.taskId}-${sub.userId}-${idx}`} className={`border rounded-xl p-4 ${
                sub.status === 'approved' ? 'border-green-200 bg-green-50' :
                sub.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{sub.taskTitle}</p>
                    <p className="text-xs text-gray-500">User: {sub.userId}</p>
                    {sub.proofUrl && (
                      <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1 hover:underline">
                        <FiExternalLink size={12} /> View proof
                      </a>
                    )}
                    <p className="text-xs text-gray-500 mt-1">+{sub.credits || 0} credits on approve</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sub.status === 'pending' ? (
                      <>
                        <button type="button" disabled={reviewLoading[`${sub.taskId}-${sub.userId}`]}
                          onClick={() => handleReviewCampaign(sub.taskId, sub.userId, 'approved')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50">
                          <FiCheck size={14} /> Approve & Credit
                        </button>
                        <button type="button" disabled={reviewLoading[`${sub.taskId}-${sub.userId}`]}
                          onClick={() => handleReviewCampaign(sub.taskId, sub.userId, 'rejected')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50">
                          <FiX size={14} /> Reject
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${
                        sub.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>{sub.status}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
