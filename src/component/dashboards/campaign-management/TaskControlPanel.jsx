import React from 'react';

const TaskControlPanel = ({
  autoApproval,
  onToggleAutoApproval,
  toggleLoading,
  selectedCount,
  onBulkAccept,
  onBulkReject,
  onOpenBulkAssign,
  bulkLoading,
}) => (
  <div className="task-control-panel flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
    <div className="approval-mode-toggle flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Manual Approval</span>
      <button
        type="button"
        role="switch"
        aria-checked={autoApproval}
        aria-label="Toggle auto approval"
        onClick={onToggleAutoApproval}
        disabled={toggleLoading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 ${
          autoApproval ? 'bg-orange-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            autoApproval ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-sm font-medium text-gray-700">Auto Approval</span>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          autoApproval ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
        }`}
      >
        {autoApproval ? 'Tasks auto-accepted on assign' : 'Admin must approve each task'}
      </span>
    </div>

    <div className="bulk-actions flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onOpenBulkAssign}
        className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
      >
        Bulk Assign
      </button>
      <button
        type="button"
        onClick={onBulkAccept}
        disabled={!selectedCount || bulkLoading}
        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        Bulk Accept {selectedCount ? `(${selectedCount})` : ''}
      </button>
      <button
        type="button"
        onClick={onBulkReject}
        disabled={!selectedCount || bulkLoading}
        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        Bulk Reject {selectedCount ? `(${selectedCount})` : ''}
      </button>
    </div>
  </div>
);

export default React.memo(TaskControlPanel);
