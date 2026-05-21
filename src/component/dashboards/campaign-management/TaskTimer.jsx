import React, { useEffect, useState, useCallback } from 'react';
import { formatCountdownMs, getPenaltyPhase } from './taskUtils';

const STORAGE_KEY = 'yoho_task_timers';

function persistTimer(taskKey, acceptedAt) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[taskKey] = acceptedAt;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

const TaskTimer = ({
  taskKey,
  acceptedAt,
  penaltyThreshold = 30,
  onPenaltyStart,
  compact = false,
}) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (taskKey && acceptedAt) persistTimer(taskKey, acceptedAt);
  }, [taskKey, acceptedAt]);

  useEffect(() => {
    if (!acceptedAt) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [acceptedAt]);

  const phase = useCallback(
    () => getPenaltyPhase(acceptedAt, penaltyThreshold),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [acceptedAt, penaltyThreshold, tick]
  );

  const { phase: p, remainingMs, nearPenalty, timerExpired } = phase();

  useEffect(() => {
    if (timerExpired && onPenaltyStart) onPenaltyStart();
  }, [timerExpired, onPenaltyStart]);

  if (!acceptedAt) {
    return (
      <span className="text-xs text-gray-500">Cancel anytime before accept</span>
    );
  }

  if (timerExpired) {
    return (
      <span className={`text-xs font-medium text-red-600 ${compact ? '' : 'block'}`}>
        Penalty applies on cancel (−{2} credits typical)
      </span>
    );
  }

  const color =
    nearPenalty ? 'text-amber-600' : remainingMs > 10 * 60 * 1000 ? 'text-green-600' : 'text-yellow-600';

  return (
    <div className={compact ? 'inline-flex items-center gap-1' : 'space-y-0.5'}>
      <span className={`text-xs font-medium ${color}`}>
        Safe to cancel: {formatCountdownMs(remainingMs)} left
      </span>
      {nearPenalty && !compact && (
        <span className="text-[10px] text-amber-600">Grace period ending soon</span>
      )}
    </div>
  );
};

export default React.memo(TaskTimer);
