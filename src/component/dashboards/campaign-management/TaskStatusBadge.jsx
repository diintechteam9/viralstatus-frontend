import React from 'react';
import { resolveTaskStatus, TASK_STATUS_LABELS, TASK_STATUS_COLORS } from './taskUtils';

const TaskStatusBadge = ({ task, className = '' }) => {
  const status = resolveTaskStatus(task);
  const label = TASK_STATUS_LABELS[status] || status;
  const color = TASK_STATUS_COLORS[status] || TASK_STATUS_COLORS.assigned;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}
      role="status"
      aria-label={`Task status: ${label}`}
    >
      {label}
    </span>
  );
};

export default React.memo(TaskStatusBadge);
