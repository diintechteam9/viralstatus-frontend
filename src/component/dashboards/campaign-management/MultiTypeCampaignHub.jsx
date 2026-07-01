import React, { useState, useCallback } from 'react';
import { FiGlobe, FiLock, FiRefreshCw, FiSend } from 'react-icons/fi';
import { API_BASE_URL } from '../../../config';
import { CAMPAIGN_TASK_TYPES, TASK_TYPE_MAP } from '../../../constants/campaignTaskTypes';

const getToken = () =>
  localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';

export default function MultiTypeCampaignHub({
  campaign,
  clientId,
  isPublicCampaign,
  selectedUsers = [],
  onRefresh,
}) {
  const supported = Array.isArray(campaign?.supportedTaskTypes) && campaign.supportedTaskTypes.length
    ? campaign.supportedTaskTypes
    : ['reels'];

  const [genLoading, setGenLoading] = useState(false);
  const [distLoading, setDistLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const resolveUsers = useCallback(async () => {
    if (!isPublicCampaign && selectedUsers.length === 0) {
      return { error: 'Select participants in the Participants tab first.' };
    }
    if (isPublicCampaign && selectedUsers.length === 0) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/mobile/user/all-google-ids`);
        const data = await res.json();
        const ids = data.googleIds || [];
        if (!ids.length) return { error: 'No registered users found.' };
        return { userIds: ids };
      } catch {
        return { error: 'Failed to fetch users.' };
      }
    }
    return { userIds: selectedUsers };
  }, [isPublicCampaign, selectedUsers]);

  const handleGenerate = async () => {
    setGenLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaign._id}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Generate failed');
      const created = (data.created || []).map((t) => TASK_TYPE_MAP[t.contentCategory]?.label || t.contentCategory).join(', ');
      setMessage(
        created
          ? `Generated: ${created}. ${data.skipped?.length ? `Skipped: ${data.skipped.map((s) => s.category).join(', ')}` : ''}`
          : data.message || 'Tasks ready'
      );
      onRefresh?.();
    } catch (err) {
      setError(err.message || 'Generate failed');
    } finally {
      setGenLoading(false);
    }
  };

  const handleDistribute = async () => {
    setDistLoading(true);
    setError('');
    setMessage('');
    try {
      const resolved = await resolveUsers();
      if (resolved.error) {
        setError(resolved.error);
        return;
      }
      const assignmentScope = isPublicCampaign && selectedUsers.length === 0 ? 'public' : 'private';
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaign._id}/distribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          userIds: resolved.userIds,
          assignmentScope,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Distribute failed');
      setMessage(data.message || 'Tasks sent to users');
      onRefresh?.();
    } catch (err) {
      setError(err.message || 'Distribute failed');
    } finally {
      setDistLoading(false);
    }
  };

  return (
    <div className="border-2 border-orange-200 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50/50 to-white">
      <div className="px-6 py-4 border-b border-orange-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Campaign Task Types</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Generate &amp; send Post, UGC, App Review, GMB tasks. Reels assign from Content Pool below.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          {isPublicCampaign ? (
            <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">
              <FiGlobe size={12} /> Public campaign
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg">
              <FiLock size={12} /> Private campaign
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CAMPAIGN_TASK_TYPES.map((t) => {
            const enabled = supported.includes(t.id);
            return (
              <div
                key={t.id}
                className={`rounded-xl border-2 p-3 text-center transition-all ${
                  enabled
                    ? 'border-orange-300 bg-white shadow-sm'
                    : 'border-gray-100 bg-gray-50 opacity-50'
                }`}
              >
                <div className="text-2xl mb-1">{t.icon}</div>
                <p className="text-xs font-bold text-gray-800">{t.label}</p>
                {t.id === 'reels' && (
                  <p className="text-[10px] text-gray-400 mt-1">Content Pool ↓</p>
                )}
                {enabled && t.id !== 'reels' && (
                  <p className="text-[10px] text-green-600 mt-1 font-semibold">Enabled</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={genLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            <FiRefreshCw size={14} className={genLoading ? 'animate-spin' : ''} />
            {genLoading ? 'Generating…' : 'Generate Tasks'}
          </button>
          <button
            type="button"
            onClick={handleDistribute}
            disabled={distLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50"
          >
            <FiSend size={14} />
            {distLoading
              ? 'Sending…'
              : isPublicCampaign && selectedUsers.length === 0
                ? 'Send to All Users'
                : `Send to ${selectedUsers.length || 'Users'} Users`}
          </button>
        </div>

        {message && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">{message}</div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <p className="text-xs text-gray-500">
          <strong>Flow:</strong> 1) Generate Tasks → 2) Send to Users (Post/UGC/Reviews) → 3) Assign Reels from Content Pool → Users see all in My Tasks.
        </p>
      </div>
    </div>
  );
}
