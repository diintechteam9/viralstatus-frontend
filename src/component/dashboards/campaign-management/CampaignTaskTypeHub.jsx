import React, { useCallback, useEffect, useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { API_BASE_URL } from '../../../config';
import { CAMPAIGN_TASK_TYPES } from '../../../constants/campaignTaskTypes';

const TYPE_DESCRIPTIONS = {
  reels: 'Assign video reels from content pools to participants.',
  post: 'Social post tasks — users share proof after posting.',
  ugc: 'Testimonial video collection with UGC brief.',
  app_review: 'App store review tasks with screenshot proof.',
  gmb_review: 'Google Business review tasks with proof upload.',
};

export default function CampaignTaskTypeHub({ campaign, onSelectType }) {
  const supported = Array.isArray(campaign?.supportedTaskTypes) && campaign.supportedTaskTypes.length
    ? campaign.supportedTaskTypes
    : ['reels'];

  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!campaign?._id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken') || '';
      const res = await fetch(`${API_BASE_URL}/api/campaign-tasks/${campaign._id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      const tasks = data.tasks || [];
      const map = {};
      supported.forEach((id) => {
        if (id === 'reels') {
          map.reels = null;
        } else {
          map[id] = tasks.filter((t) => t.contentCategory === id).length;
        }
      });
      setCounts(map);
    } catch {
      setCounts({});
    } finally {
      setLoading(false);
    }
  }, [campaign?._id, supported]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Task Management</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select a task type to open its dedicated workspace — nothing is mixed on one screen.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CAMPAIGN_TASK_TYPES.filter((t) => supported.includes(t.id)).map((type) => {
          const taskCount = counts[type.id];
          const enabled = supported.includes(type.id);
          return (
            <button
              key={type.id}
              type="button"
              disabled={!enabled}
              onClick={() => onSelectType(type.id)}
              className="group text-left bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-orange-400 hover:shadow-md transition-all disabled:opacity-40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  {type.icon}
                </div>
                <FiChevronRight className="text-gray-300 group-hover:text-orange-500 mt-1 shrink-0" size={20} />
              </div>
              <h3 className="font-bold text-gray-900 mt-4">{type.label}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{TYPE_DESCRIPTIONS[type.id]}</p>
              <div className="mt-3 flex items-center gap-2">
                {type.id === 'reels' ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Content Pool</span>
                ) : loading ? (
                  <span className="text-[10px] text-gray-400">Loading…</span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {taskCount || 0} task(s)
                  </span>
                )}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Open →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
