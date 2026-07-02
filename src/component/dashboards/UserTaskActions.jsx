import React, { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiX, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { API_BASE_URL } from '../../config';

function formatRemaining(ms) {
  if (ms == null || ms <= 0) return '0:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function resolveTimerState(task, timer) {
  const threshold = timer?.penaltyThresholdMinutes ?? task?.penaltyThresholdMinutes ?? 10;
  const penalty = timer?.cancellationPenalty ?? task?.cancellationPenalty ?? 2;
  const expired = !!(timer?.timerExpired ?? timer?.penaltyZone ?? task?.timerExpired ?? task?.penaltyZone);
  const remainingMs = timer?.remainingMs ?? task?.remainingMs ?? null;
  return { threshold, penalty, expired, remainingMs };
}

export default function UserTaskActions({
  task,
  userId,
  onAccepted,
  onCancelled,
  allowCancellation = true,
  penaltyThresholdMinutes = 10,
  cancellationPenalty = 2,
}) {
  const [quota, setQuota] = useState(null);
  const [timer, setTimer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const reelId = task?.reelId || task?.campaignTaskId || task?._id;
  const campaignId = task?.campaignId;
  const isAccepted = !!task?.isTaskAccepted || task?.TaskStatus === 'accepted' || task?.TaskStatus === 'in_progress';
  const isComplete = !!task?.isTaskComplete || task?.TaskStatus === 'completed';
  const isCancelled = task?.TaskStatus === 'cancelled';

  const fetchQuota = useCallback(async () => {
    if (!userId) return;
    try {
      const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : '';
      const res = await fetch(`${API_BASE_URL}/api/pools/task/daily-quota/${userId}${qs}`);
      const data = await res.json();
      if (data.success) setQuota(data.quota);
    } catch { /* silent */ }
  }, [userId, campaignId]);

  const fetchTimer = useCallback(async () => {
    if (!userId || !reelId || !isAccepted) return;
    try {
      const qs = new URLSearchParams({ userId, ...(campaignId ? { campaignId } : {}) });
      const res = await fetch(`${API_BASE_URL}/api/pools/task/timer-status/${reelId}?${qs}`);
      const data = await res.json();
      if (data.success) setTimer(data);
    } catch { /* silent */ }
  }, [userId, reelId, campaignId, isAccepted]);

  useEffect(() => { fetchQuota(); }, [fetchQuota]);
  useEffect(() => {
    if (task?.timerExpired != null || task?.remainingMs != null) {
      setTimer((prev) => ({
        ...prev,
        timerExpired: task.timerExpired,
        penaltyZone: task.penaltyZone,
        remainingMs: task.remainingMs,
        potentialPenalty: task.potentialPenalty,
        cancellationPenalty: task.cancellationPenalty,
        penaltyThresholdMinutes: task.penaltyThresholdMinutes,
      }));
    }
  }, [task]);
  useEffect(() => {
    fetchTimer();
    if (!isAccepted) return undefined;
    const id = setInterval(fetchTimer, 3000);
    return () => clearInterval(id);
  }, [fetchTimer, isAccepted]);

  const { threshold, penalty, expired, remainingMs } = resolveTimerState(
    { penaltyThresholdMinutes, cancellationPenalty, ...task },
    timer
  );

  const handleAccept = async () => {
    setLoading(true);
    setMsg('');
    setErr('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/task/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reelId, campaignId }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.error || 'Accept failed');
      }
      setMsg('Task accepted! Complete it before the deadline.');
      if (data.quota) setQuota(data.quota);
      setTimer(data);
      onAccepted?.(data);
      fetchTimer();
    } catch (e) {
      setErr(e.message || 'Accept failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const confirmMsg = expired
      ? `Cancel after ${threshold} min? ${penalty} credit(s) will be deducted and the task will return to the pool.`
      : `Cancel within ${threshold} min — no fine. Task will return to the pool.`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    setMsg('');
    setErr('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/pools/task/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reelId, campaignId, reason: 'User cancelled' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Cancel failed');
      const fineMsg = data.penaltyApplied
        ? ` Fine: ${data.creditsPenalized} credit(s) deducted.`
        : ' No fine applied.';
      setMsg((data.message || 'Task cancelled.') + fineMsg);
      if (data.quota) setQuota(data.quota);
      fetchQuota();
      onCancelled?.(data);
    } catch (e) {
      setErr(e.message || 'Cancel failed');
    } finally {
      setLoading(false);
    }
  };

  if (isComplete) return null;

  const allowCancel = allowCancellation && (task?.allowCancellation !== false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      {quota && (
        <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <span className="text-gray-600">Active accepts</span>
          <span className="font-bold text-gray-900">{quota.used}/{quota.limit} · {quota.remaining} slot(s) left</span>
        </div>
      )}

      {/* Cancelled — show re-accept option */}
      {isCancelled ? (
        <div className="space-y-2">
          <p className="text-sm text-red-600 font-medium">❌ Task was cancelled. You can re-accept it.</p>
          <button type="button" onClick={handleAccept} disabled={loading || (quota && !quota.canAccept)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-gray-800 disabled:opacity-50">
            <FiCheck size={16} /> {loading ? 'Accepting…' : 'Re-accept Task'}
          </button>
          {quota && !quota.canAccept && (
            <p className="text-xs text-red-600 text-center">Active task limit reached. Cancel another task first.</p>
          )}
        </div>
      ) : !isAccepted ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Accept this task to start. Max <strong>{quota?.limit ?? 3}</strong> active tasks at once.</p>
          <button type="button" onClick={handleAccept} disabled={loading || (quota && !quota.canAccept)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-gray-800 disabled:opacity-50">
            <FiCheck size={16} /> {loading ? 'Accepting…' : 'Accept Task'}
          </button>
          {quota && !quota.canAccept && (
            <p className="text-xs text-red-600 text-center">Active task limit reached. Cancel a task to accept another.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {allowCancel && (
            <div className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 border ${
              expired ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              {expired ? <FiAlertTriangle className="shrink-0 mt-0.5" /> : <FiClock className="shrink-0 mt-0.5" />}
              <span>
                {expired
                  ? `Grace period over — cancel now costs ${penalty} credit(s).`
                  : `Free cancel window: ${formatRemaining(remainingMs)} left (first ${threshold} min).`}
              </span>
            </div>
          )}
          {allowCancel && (
            <button type="button" onClick={handleCancel} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-200 text-red-700 font-semibold text-sm hover:bg-red-50 disabled:opacity-50">
              <FiX size={16} /> {expired ? `Cancel (−${penalty} credits)` : 'Cancel Task (free)'}
            </button>
          )}
        </div>
      )}

      {msg && <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{msg}</p>}
      {err && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
    </div>
  );
}
