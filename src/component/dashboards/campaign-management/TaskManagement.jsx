import React from 'react';
import ContentPoolFolderView from '../ContentPoolFolderView';
import TaskControlPanel from './TaskControlPanel';
import TaskRow from './TaskRow';
import BulkAssignment from './BulkAssignment';

const TaskManagement = ({
  clientId,
  campaign,
  autoApproval,
  toggleAutoApproval,
  toggleLoading,
  tasks,
  tasksLoading,
  tasksError,
  fetchTasks,
  penaltyThresholdMinutes,
  cancellationPenalty,
  allowCancellation,
  selectedTasks,
  onTaskSelect,
  onSelectAllTasks,
  taskActionLoading,
  onAccept,
  onReject,
  onCancel,
  onBulkAccept,
  onBulkReject,
  bulkLoading,
  bulkAssignOpen,
  onOpenBulkAssign,
  onCloseBulkAssign,
  selectedUsers,
  selectedReelsByPool,
  expandedPoolId,
  onPoolReelSelectionChange,
  reelsPerUser,
  onReelsPerUserChange,
  assignStrategy,
  onAssignStrategyChange,
  onBulkAssign,
  bulkAssignLoading,
  bulkAssignError,
  bulkAssignSuccess,
  sendLoading,
  sendError,
  sendSuccess,
  onSendCampaign,
  youtubeReels,
  onYoutubeReelsChange,
  instagramReels,
  onInstagramReelsChange,
  onGoToParticipants,
  onViewUser,
}) => {
  const selectedReelCount =
    expandedPoolId && selectedReelsByPool[expandedPoolId]
      ? selectedReelsByPool[expandedPoolId].length
      : 0;

  const allSelected =
    tasks.length > 0 && tasks.every((t) => selectedTasks.has(`${t.reelId}-${t.userId}`));

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Task Management Hub</h2>
        <p className="text-gray-600">
          Assign content, approve tasks, and manage cancellations with penalty timers.
        </p>
      </div>

      {selectedUsers.length === 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-900">
            <strong>No participants selected.</strong> Reels selected ({selectedReelCount}) — open{' '}
            <strong>Participants</strong> tab and check users, then return here to assign.
          </p>
          {onGoToParticipants && (
            <button
              type="button"
              onClick={onGoToParticipants}
              className="shrink-0 px-4 py-2 text-sm font-medium text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100"
            >
              Select participants
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl border border-green-200 bg-green-50 text-sm text-green-900">
          <span className="font-semibold">{selectedUsers.length}</span> participant(s) selected
          {selectedReelCount > 0 && (
            <>
              <span className="text-green-600">·</span>
              <span>
                <strong>{selectedReelCount}</strong> reel(s) selected for assignment
              </span>
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Pools & Reels</h3>
        <ContentPoolFolderView
          clientId={clientId}
          onPoolReelSelectionChange={onPoolReelSelectionChange}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
            <div>
              <label className="font-medium text-gray-900">Instagram</label>
              <p className="text-sm text-gray-600">Stories & Reels</p>
            </div>
            <input
              type="number"
              min={1}
              value={instagramReels || ''}
              onChange={(e) => onInstagramReelsChange(Number(e.target.value))}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-blue-50 rounded-lg border border-red-100">
            <div>
              <label className="font-medium text-gray-900">YouTube</label>
              <p className="text-sm text-gray-600">Shorts & Videos</p>
            </div>
            <input
              type="number"
              min={1}
              value={youtubeReels || ''}
              onChange={(e) => onYoutubeReelsChange(Number(e.target.value))}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">Reels Per User:</label>
            <input
              type="number"
              value={reelsPerUser}
              onChange={(e) => {
                const v = e.target.value;
                onReelsPerUserChange(v === '' ? '' : parseInt(v, 10));
              }}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center"
              disabled={sendLoading}
            />
          </div>
          <button
            type="button"
            className="px-6 py-2.5 rounded-lg text-white bg-gradient-to-r from-yellow-500 to-orange-600 hover:brightness-110 disabled:opacity-50"
            onClick={onSendCampaign}
            disabled={sendLoading}
          >
            {sendLoading ? 'Sending...' : 'Quick Assign (selected users)'}
          </button>
        </div>
        {(sendError || sendSuccess) && (
          <div className="space-y-2">
            {sendError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {sendError}
              </div>
            )}
            {sendSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {sendSuccess}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Assigned Tasks</h3>
          <button
            type="button"
            onClick={fetchTasks}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            Refresh
          </button>
        </div>

        <TaskControlPanel
          autoApproval={autoApproval}
          onToggleAutoApproval={toggleAutoApproval}
          toggleLoading={toggleLoading}
          selectedCount={selectedTasks.size}
          onBulkAccept={onBulkAccept}
          onBulkReject={onBulkReject}
          onOpenBulkAssign={onOpenBulkAssign}
          bulkLoading={bulkLoading}
        />

        {tasksLoading ? (
          <div className="py-12 text-center text-gray-500">Loading tasks...</div>
        ) : tasksError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{tasksError}</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="font-medium">No tasks yet</p>
            <p className="text-sm mt-1">Select participants and reels, then assign from Bulk Assign or Quick Assign.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-lg max-h-[28rem] overflow-y-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onSelectAllTasks}
                      aria-label="Select all tasks"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Task</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Credits</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Timer</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task, idx) => (
                  <TaskRow
                    key={`${task.reelId}-${task.userId}-${idx}`}
                    task={task}
                    autoApproval={autoApproval}
                    penaltyThresholdMinutes={penaltyThresholdMinutes}
                    cancellationPenalty={cancellationPenalty}
                    allowCancellation={allowCancellation}
                    isSelected={selectedTasks.has(`${task.reelId}-${task.userId}`)}
                    onSelect={onTaskSelect}
                    onAccept={onAccept}
                    onReject={onReject}
                    onCancel={onCancel}
                    onViewUser={onViewUser}
                    actionLoading={taskActionLoading}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BulkAssignment
        open={bulkAssignOpen}
        onClose={onCloseBulkAssign}
        selectedUserCount={selectedUsers.length}
        selectedReelCount={selectedReelCount}
        reelsPerUser={reelsPerUser}
        onReelsPerUserChange={onReelsPerUserChange}
        strategy={assignStrategy}
        onStrategyChange={onAssignStrategyChange}
        onAssign={onBulkAssign}
        loading={bulkAssignLoading}
        error={bulkAssignError}
        success={bulkAssignSuccess}
      />
    </div>
  );
};

export default TaskManagement;
