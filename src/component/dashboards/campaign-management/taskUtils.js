export const TASK_STATUS_LABELS = {
  assigned: 'Assigned',
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export const TASK_STATUS_COLORS = {
  assigned: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
};

export function resolveTaskStatus(task) {
  if (task?.TaskStatus === 'cancelled') return 'cancelled';
  if (task?.TaskStatus === 'rejected') return 'rejected';
  if (task?.isTaskComplete || task?.TaskStatus === 'completed') return 'completed';
  if (task?.TaskStatus === 'in_progress') return 'in_progress';
  if (task?.isTaskAccepted || task?.TaskStatus === 'accepted') return 'accepted';
  if (task?.TaskStatus === 'pending') return 'pending';
  return task?.TaskStatus || 'assigned';
}

export function formatCountdownMs(ms) {
  if (ms == null || ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getPenaltyPhase(acceptedAt, thresholdMinutes = 30) {
  if (!acceptedAt) return { phase: 'none', remainingMs: null, nearPenalty: false };
  const thresholdMs = thresholdMinutes * 60 * 1000;
  const elapsed = Date.now() - new Date(acceptedAt).getTime();
  const remainingMs = Math.max(0, thresholdMs - elapsed);
  const nearPenalty = remainingMs > 0 && remainingMs <= 5 * 60 * 1000;
  return {
    phase: remainingMs > 0 ? 'grace' : 'penalty',
    remainingMs,
    nearPenalty,
    timerExpired: remainingMs <= 0,
  };
}

export const ASSIGNMENT_STRATEGIES = [
  { id: 'roundRobin', label: 'Round Robin' },
  { id: 'loadBalanced', label: 'Load Balanced' },
  { id: 'random', label: 'Random' },
  { id: 'skillBased', label: 'Skill Based (basic)' },
];
