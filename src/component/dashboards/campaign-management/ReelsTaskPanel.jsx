import React, { useMemo } from 'react';
import { FiGlobe, FiLock } from 'react-icons/fi';
import ContentPoolFolderView from '../ContentPoolFolderView';
import TaskControlPanel from './TaskControlPanel';
import TaskRow from './TaskRow';
import BulkAssignment from './BulkAssignment';

export default function ReelsTaskPanel({
  clientId,
  isPublicCampaign,
  campaignTypeLoading,
  onCampaignTypeChange,
  selectedUsers,
  selectedReelsByPool,
  expandedPoolId,
  onPoolReelSelectionChange,
  reelsPerUser,
  onReelsPerUserChange,
  instagramReels,
  onInstagramReelsChange,
  youtubeReels,
  onYoutubeReelsChange,
  sendLoading,
  sendError,
  sendSuccess,
  onSendCampaign,
  onGoToParticipants,
  tasks,
  tasksLoading,
  tasksError,
  fetchTasks,
  autoApproval,
  toggleAutoApproval,
  toggleLoading,
  selectedTasks,
  onTaskSelect,
  onSelectAllTasks,
  onBulkAccept,
  onBulkReject,
  onOpenBulkAssign,
  bulkLoading,
  penaltyThresholdMinutes,
  cancellationPenalty,
  allowCancellation,
  onAccept,
  onReject,
  onCancel,
  onViewUser,
  taskActionLoading,
  bulkAssignOpen,
  onCloseBulkAssign,
  assignStrategy,
  onAssignStrategyChange,
  onBulkAssign,
  bulkAssignLoading,
  bulkAssignError,
  bulkAssignSuccess,
  selectedReelCount,
  hasSelectedReels,
}) {
  const allSelected = tasks.length > 0 && tasks.every((t) => selectedTasks.has(`${t.reelId}-${t.userId}`));

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {isPublicCampaign ? <><FiGlobe size={18} /> Public Reels</> : <><FiLock size={18} /> Private Reels</>}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Select reels from pools and assign to users.</p>
        </div>
        {onCampaignTypeChange && (
          <div className="shrink-0">
            <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Campaign Type</p>
            <div className="flex gap-2">
              <button type="button" disabled={campaignTypeLoading || !isPublicCampaign} onClick={() => onCampaignTypeChange('private')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border-2 ${!isPublicCampaign ? 'border-purple-500 bg-purple-50 text-purple-800' : 'border-gray-200 bg-white text-gray-500'}`}>
                <FiLock size={14} /> Private
              </button>
              <button type="button" disabled={campaignTypeLoading || isPublicCampaign} onClick={() => onCampaignTypeChange('public')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border-2 ${isPublicCampaign ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 bg-white text-gray-500'}`}>
                <FiGlobe size={14} /> Public
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {!isPublicCampaign && selectedUsers.length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
            <p className="text-sm text-amber-900"><strong>No participants selected.</strong> Go to Participants tab first.</p>
            {onGoToParticipants && (
              <button type="button" onClick={onGoToParticipants} className="shrink-0 px-4 py-2 text-sm font-medium bg-white border border-amber-300 rounded-lg hover:bg-amber-100">Go to Participants</button>
            )}
          </div>
        ) : isPublicCampaign && selectedUsers.length === 0 ? (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-900">
            <FiGlobe size={16} className="inline mr-1" /> Quick Assign sends reels to <strong>all registered users</strong>.
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-sm text-green-900">
            <strong>{selectedUsers.length}</strong> participant(s) selected
            {selectedReelCount > 0 && <> · <strong>{selectedReelCount}</strong> reel(s) ready</>}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Pools & Reels</h3>
          <ContentPoolFolderView clientId={clientId} onPoolReelSelectionChange={onPoolReelSelectionChange} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
              <div><label className="font-medium text-gray-900">Instagram</label><p className="text-sm text-gray-600">Stories & Reels</p></div>
              <input type="number" min={1} value={instagramReels || ''} onChange={(e) => onInstagramReelsChange(Number(e.target.value))} className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center" />
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-blue-50 rounded-lg border border-red-100">
              <div><label className="font-medium text-gray-900">YouTube</label><p className="text-sm text-gray-600">Shorts & Videos</p></div>
              <input type="number" min={1} value={youtubeReels || ''} onChange={(e) => onYoutubeReelsChange(Number(e.target.value))} className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="font-medium text-gray-700">Reels Per User:</label>
              <input type="number" value={reelsPerUser} onChange={(e) => { const v = e.target.value; onReelsPerUserChange(v === '' ? '' : parseInt(v, 10)); }} className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center" disabled={sendLoading} />
            </div>
            <button type="button" className="px-6 py-2.5 rounded-lg text-white bg-gradient-to-r from-yellow-500 to-orange-600 hover:brightness-110 disabled:opacity-50" onClick={onSendCampaign} disabled={sendLoading || !hasSelectedReels || (!isPublicCampaign && selectedUsers.length === 0)}>
              {sendLoading ? 'Sending…' : isPublicCampaign && selectedUsers.length === 0 ? 'Quick Assign (All Users)' : `Quick Assign (${selectedUsers.length} users)`}
            </button>
          </div>
          {sendError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{sendError}</div>}
          {sendSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{sendSuccess}</div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Assigned Reel Tasks</h3>
            <button type="button" onClick={fetchTasks} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">Refresh</button>
          </div>
          <TaskControlPanel autoApproval={autoApproval} onToggleAutoApproval={toggleAutoApproval} toggleLoading={toggleLoading} selectedCount={selectedTasks.size} onBulkAccept={onBulkAccept} onBulkReject={onBulkReject} onOpenBulkAssign={onOpenBulkAssign} bulkLoading={bulkLoading} />
          {tasksLoading ? (
            <div className="py-12 text-center text-gray-500">Loading…</div>
          ) : tasksError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{tasksError}</div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">No reel tasks assigned yet.</div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-lg max-h-[28rem] overflow-y-auto">
              <table className="w-full border-collapse min-w-[900px]">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-center w-10"><input type="checkbox" checked={allSelected} onChange={onSelectAllTasks} /></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Task</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Credits</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Assigned</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Timer</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-16">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tasks.map((task, idx) => (
                    <TaskRow key={`${task.reelId}-${task.userId}-${idx}`} task={task} autoApproval={autoApproval} penaltyThresholdMinutes={penaltyThresholdMinutes} cancellationPenalty={cancellationPenalty} allowCancellation={allowCancellation} isSelected={selectedTasks.has(`${task.reelId}-${task.userId}`)} onSelect={onTaskSelect} onAccept={onAccept} onReject={onReject} onCancel={onCancel} onViewUser={onViewUser} actionLoading={taskActionLoading} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <BulkAssignment open={bulkAssignOpen} onClose={onCloseBulkAssign} isPublicCampaign={isPublicCampaign} selectedUserCount={selectedUsers.length} selectedReelCount={selectedReelCount} reelsPerUser={reelsPerUser} onReelsPerUserChange={onReelsPerUserChange} strategy={assignStrategy} onStrategyChange={onAssignStrategyChange} onAssign={onBulkAssign} loading={bulkAssignLoading} error={bulkAssignError} success={bulkAssignSuccess} />
    </div>
  );
}
