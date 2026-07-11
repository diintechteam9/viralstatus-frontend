import { FiFilm, FiImage, FiVideo, FiStar, FiMapPin } from 'react-icons/fi';

export const CAMPAIGN_TASK_TYPES = [
  { id: 'reels', label: 'Reels', iconComponent: FiFilm, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
  { id: 'post', label: 'Post', iconComponent: FiImage, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'ugc', label: 'UGC', iconComponent: FiVideo, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  { id: 'app_review', label: 'App Review', iconComponent: FiStar, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'gmb_review', label: 'GMB Review', iconComponent: FiMapPin, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

export const TASK_TYPE_MAP = Object.fromEntries(
  CAMPAIGN_TASK_TYPES.map((t) => [t.id, t])
);

export function getTaskTypeLabel(id) {
  return TASK_TYPE_MAP[id]?.label || id;
}

export function getTaskTypeIcon(id) {
  const IconComponent = TASK_TYPE_MAP[id]?.iconComponent || FiFilm;
  return IconComponent;
}

export function renderTaskTypeBadges(types = [], className = '') {
  const list = Array.isArray(types) && types.length ? types : ['reels'];
  return list;
}
