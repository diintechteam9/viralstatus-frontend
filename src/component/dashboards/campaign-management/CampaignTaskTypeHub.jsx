import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config';
import { CAMPAIGN_TASK_TYPES } from '../../../constants/campaignTaskTypes';

export default function CampaignTaskTypeHub({ campaign, onSelectType, activeType }) {
  const supported = Array.isArray(campaign?.supportedTaskTypes) && campaign.supportedTaskTypes.length
    ? campaign.supportedTaskTypes
    : ['reels'];

  const [counts, setCounts] = useState({});
  const [publicCount, setPublicCount] = useState(null);

  const fetchCounts = useCallback(async () => {
    if (!campaign?._id) return;
    try {
      const token = localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaign._id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      const tasks = data.tasks || [];
      const map = {};
      supported.forEach((id) => {
        map[id] = id === 'reels' ? null : tasks.filter((t) => t.contentCategory === id).length;
      });
      setCounts(map);
      setPublicCount(tasks.filter((t) => t.visibility === 'public').length);
    } catch {
      setCounts({});
      setPublicCount(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?._id, campaign?.supportedTaskTypes?.join(',')]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const tabs = CAMPAIGN_TASK_TYPES.filter((t) => supported.includes(t.id));

  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
      {tabs.map((type) => {
        const isActive = activeType === type.id;
        const count = counts[type.id];
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelectType(type.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px ${
              isActive
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
            {type.id !== 'reels' && count != null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}

      {/* Public Tasks tab — always visible */}
      <button
        type="button"
        onClick={() => onSelectType('public')}
        className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px ${
          activeType === 'public'
            ? 'border-orange-500 text-orange-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <span>🌐</span>
        <span>Public</span>
        {publicCount != null && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            activeType === 'public' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {publicCount}
          </span>
        )}
      </button>
    </div>
  );
}
