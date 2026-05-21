import React, { useState } from 'react';
import TaskStatusBadge from './TaskStatusBadge';
import TaskTimer from './TaskTimer';
import PenaltyWarning from './PenaltyWarning';
import TaskActionsMenu from './TaskActionsMenu';
import { getPenaltyPhase, resolveTaskStatus } from './taskUtils';

const TaskRow = ({
  task,
  autoApproval,
  penaltyThresholdMinutes = 30,
  cancellationPenalty = 2,
  allowCancellation = true,
  isSelected,
  onSelect,
  onAccept,
  onReject,
  onCancel,
  onViewUser,
  actionLoading,
}) => {
  const [nearPenalty, setNearPenalty] = useState(false);
  const status = resolveTaskStatus(task);
  const taskKey = `${task.reelId}-${task.userId}`;
  const isLoading = actionLoading?.[taskKey];
  const canApprove = !autoApproval && status === 'pending';
  const canCancel =
    allowCancellation &&
    status !== 'cancelled' &&
    status !== 'completed' &&
    status !== 'rejected';
  const { timerExpired } = getPenaltyPhase(task.acceptedAt, penaltyThresholdMinutes);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={!!isSelected}
          onChange={() => onSelect?.(task)}
          className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          aria-label={`Select task for ${task.userName || task.userId}`}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-xs">
              {(task.userName || task.userId || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{task.userName || task.userId}</p>
            <p className="text-xs text-gray-500 truncate">{task.userId}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{task.title || 'Untitled Task'}</p>
        <p className="text-xs text-gray-500">ID: {task.reelId}</p>
      </td>
      <td className="px-4 py-3 text-center">
        <TaskStatusBadge task={task} />
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-semibold text-orange-600">{task.credits || 0}</span>
      </td>
      <td className="px-4 py-3 text-center text-sm text-gray-500">
        {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'}
      </td>
      <td className="px-4 py-3">
        {task.isTaskAccepted && task.acceptedAt ? (
          <TaskTimer
            taskKey={taskKey}
            acceptedAt={task.acceptedAt}
            penaltyThreshold={penaltyThresholdMinutes}
            onPenaltyStart={() => setNearPenalty(true)}
          />
        ) : (
          <span className="text-xs text-gray-500">—</span>
        )}
        <PenaltyWarning
          show={nearPenalty && !timerExpired}
          credits={cancellationPenalty}
          className="mt-1"
        />
      </td>
      <td className="px-4 py-3 text-center">
        <TaskActionsMenu
          canApprove={canApprove}
          canCancel={canCancel}
          isLoading={isLoading}
          timerExpired={timerExpired}
          cancellationPenalty={cancellationPenalty}
          onAccept={() => onAccept?.(task)}
          onReject={() => onReject?.(task)}
          onCancel={() => onCancel?.(task)}
          onViewUser={onViewUser ? () => onViewUser(task) : undefined}
        />
      </td>
    </tr>
  );
};

export default React.memo(TaskRow);
