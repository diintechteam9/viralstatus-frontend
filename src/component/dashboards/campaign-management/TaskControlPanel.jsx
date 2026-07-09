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
  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
    {/* Approval toggle */}
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Manual</span>
      <button
        type="button"
        role="switch"
        aria-checked={autoApproval}
        onClick={onToggleAutoApproval}
        disabled={toggleLoading}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          autoApproval ? 'bg-orange-500' : 'bg-gray-300'
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${autoApproval ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-xs text-gray-500">Auto</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${autoApproval ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
        {autoApproval ? 'Auto-approve' : 'Manual review'}
      </span>
    </div>

    {/* Bulk actions */}
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onOpenBulkAssign}
        className="px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        Bulk Assign
      </button>
      <button
        type="button"
        onClick={onBulkAccept}
        disabled={!selectedCount || bulkLoading}
        className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-40 transition-colors"
      >
        Accept{selectedCount ? ` (${selectedCount})` : ''}
      </button>
      <button
        type="button"
        onClick={onBulkReject}
        disabled={!selectedCount || bulkLoading}
        className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-40 transition-colors"
      >
        Reject{selectedCount ? ` (${selectedCount})` : ''}
      </button>
    </div>
  </div>
);

export default React.memo(TaskControlPanel);
