import React, { useState } from 'react';
import { ASSIGNMENT_STRATEGIES } from './taskUtils';

const BulkAssignment = ({
  open,
  onClose,
  selectedUserCount,
  selectedReelCount,
  reelsPerUser,
  onReelsPerUserChange,
  strategy,
  onStrategyChange,
  onAssign,
  loading,
  error,
  success,
}) => {
  const [instagramReels, setInstagramReels] = useState('');
  const [youtubeReels, setYoutubeReels] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="bulk-assign-title"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 id="bulk-assign-title" className="text-lg font-semibold text-gray-900">
            Bulk Task Assignment
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            Assign content to <strong>{selectedUserCount}</strong> participant(s) using{' '}
            <strong>{selectedReelCount}</strong> selected reel(s).
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distribution strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => onStrategyChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
            >
              {ASSIGNMENT_STRATEGIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reels per user</label>
            <input
              type="number"
              min={1}
              value={reelsPerUser}
              onChange={(e) => onReelsPerUserChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-pink-50 border border-pink-100">
              <label className="font-medium text-gray-800">Instagram reels</label>
              <input
                type="number"
                min={0}
                value={instagramReels}
                onChange={(e) => setInstagramReels(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <label className="font-medium text-gray-800">YouTube reels</label>
              <input
                type="number"
                min={0}
                value={youtubeReels}
                onChange={(e) => setYoutubeReels(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAssign}
            disabled={loading || !selectedUserCount || !selectedReelCount}
            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Assign tasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignment;
