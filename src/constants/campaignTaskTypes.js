export const CAMPAIGN_TASK_TYPES = [
  { id: 'reels', label: 'Reels', icon: '🎬' },
  { id: 'post', label: 'Post', icon: '📱' },
  { id: 'ugc', label: 'UGC', icon: '🎥' },
  { id: 'app_review', label: 'App Review', icon: '⭐' },
  { id: 'gmb_review', label: 'GMB Review', icon: '📍' },
];

export const TASK_TYPE_MAP = Object.fromEntries(
  CAMPAIGN_TASK_TYPES.map((t) => [t.id, t])
);

export function getTaskTypeLabel(id) {
  return TASK_TYPE_MAP[id]?.label || id;
}

export function getTaskTypeIcon(id) {
  return TASK_TYPE_MAP[id]?.icon || '📋';
}

export function renderTaskTypeBadges(types = [], className = '') {
  const list = Array.isArray(types) && types.length ? types : ['reels'];
  return list;
}
