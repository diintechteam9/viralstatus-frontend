import React, { useCallback, useEffect, useState } from 'react';
import {
  FiGrid, FiFilm, FiImage, FiVideo, FiStar, FiMapPin,
} from 'react-icons/fi';
import { API_BASE_URL } from '../../../config';
import { CAMPAIGN_TASK_TYPES } from '../../../constants/campaignTaskTypes';

const TAB_ICONS = {
  all:        <FiGrid size={14} />,
  reels:      <FiFilm size={14} />,
  post:       <FiImage size={14} />,
  ugc:        <FiVideo size={14} />,
  app_review: <FiStar size={14} />,
  gmb_review: <FiMapPin size={14} />,
};

const TAB_COLORS = {
  all:        { active: 'border-orange-500 text-orange-600 bg-orange-50',        dot: 'bg-orange-500' },
  reels:      { active: 'border-pink-500 text-pink-600 bg-pink-50',              dot: 'bg-pink-500' },
  post:       { active: 'border-blue-500 text-blue-600 bg-blue-50',              dot: 'bg-blue-500' },
  ugc:        { active: 'border-violet-500 text-violet-600 bg-violet-50',        dot: 'bg-violet-500' },
  app_review: { active: 'border-amber-500 text-amber-600 bg-amber-50',           dot: 'bg-amber-500' },
  gmb_review: { active: 'border-emerald-500 text-emerald-600 bg-emerald-50',     dot: 'bg-emerald-500' },
};

const ALL_TABS = [
  { id: 'all', label: 'All Tasks' },
  ...CAMPAIGN_TASK_TYPES,
];

export default function CampaignTaskTypeHub({ campaign, onSelectType, activeType }) {
  const [counts, setCounts] = useState({});

  const fetchCounts = useCallback(async () => {
    if (!campaign?._id) return;
    try {
      const token = localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaign._id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      const c = { all: tasks.length };
      CAMPAIGN_TASK_TYPES.forEach((type) => {
        c[type.id] = tasks.filter(
          (task) => task.contentCategory === type.id || (type.id === 'reels' && !task.contentCategory)
        ).length;
      });
      setCounts(c);
    } catch {
      setCounts({});
    }
  }, [campaign?._id]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  return (
    <div className="flex flex-wrap gap-1.5 border-b border-gray-200 mb-6 pb-0 overflow-x-auto">
      {ALL_TABS.map((tab) => {
        const isActive = activeType === tab.id;
        const colors = TAB_COLORS[tab.id] || TAB_COLORS.all;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectType(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap
              border-b-2 transition-all duration-150 rounded-t-lg
              ${isActive
                ? `${colors.active} border-b-2`
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <span className={`flex-shrink-0 ${isActive ? '' : 'text-gray-400'}`}>
              {TAB_ICONS[tab.id]}
            </span>
            <span>{tab.label}</span>
            {count != null && count > 0 && (
              <span className={`
                text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none
                ${isActive
                  ? `${colors.dot} text-white`
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
