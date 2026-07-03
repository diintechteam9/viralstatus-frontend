import React from 'react';
import { FiLock, FiGlobe } from 'react-icons/fi';

export const EMPTY_FORM = {
  title: '', description: '', platform: 'instagram', taskType: 'like',
  targetUrl: '', targetCount: '', credits: '', proofRequired: 'screenshot',
  status: 'active', deadline: '', visibility: 'private',
  appName: '', businessName: '', minRating: '5', script: '', referenceVideoUrl: '',
};

export const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white';
export const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

export function getDefaultFormForCategory(contentCategory, defaultVisibility = 'private') {
  const defaultPlatform =
    contentCategory === 'app_review' ? 'playstore' :
    contentCategory === 'gmb_review' ? 'both' : 'instagram';
  const defaultTaskType =
    contentCategory === 'ugc' ? 'upload_reel' :
    contentCategory === 'app_review' || contentCategory === 'gmb_review' ? 'comment' :
    contentCategory === 'post' ? 'like' : 'like';
  return {
    ...EMPTY_FORM,
    visibility: defaultVisibility,
    contentCategory: contentCategory || 'post',
    platform: defaultPlatform,
    taskType: defaultTaskType,
  };
}

export const VisibilityToggle = ({ value, onChange }) => (
  <div className="col-span-full">
    <label className={labelCls}>Task Visibility</label>
    <div className="flex gap-3">
      <label className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-all ${
        value !== 'public' ? 'border-orange-400 bg-orange-50 text-orange-800 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
        <input type="radio" checked={value !== 'public'} onChange={() => onChange('visibility', 'private')} className="accent-orange-500" />
        <FiLock size={13} /> Private
      </label>
      <label className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-all ${
        value === 'public' ? 'border-blue-400 bg-blue-50 text-blue-800 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
        <input type="radio" checked={value === 'public'} onChange={() => onChange('visibility', 'public')} className="accent-blue-500" />
        <FiGlobe size={13} /> Public
      </label>
    </div>
    {value === 'public' && (
      <p className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        Public tasks appear in <strong>My Tasks › Public</strong> for all users.
      </p>
    )}
  </div>
);

const CommonBottom = ({ vals, onChange }) => (
  <>
    <div>
      <label className={labelCls}>Credits *</label>
      <input type="number" min={1} className={inputCls} value={vals.credits} onChange={e => onChange('credits', e.target.value)} placeholder="e.g. 20" />
    </div>
    <div>
      <label className={labelCls}>Deadline</label>
      <input type="datetime-local" className={inputCls} value={vals.deadline} onChange={e => onChange('deadline', e.target.value)} />
    </div>
    <div>
      <label className={labelCls}>Status</label>
      <select className={inputCls} value={vals.status} onChange={e => onChange('status', e.target.value)}>
        <option value="active">Active</option>
        <option value="draft">Draft</option>
      </select>
    </div>
  </>
);

export function FormFields({ vals, onChange, contentCategory }) {
  const g2 = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
  const g3 = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

  if (contentCategory === 'post') return (
    <div className={g3}>
      <VisibilityToggle value={vals.visibility} onChange={onChange} />
      <div>
        <label className={labelCls}>Title *</label>
        <input className={inputCls} value={vals.title} onChange={e => onChange('title', e.target.value)} placeholder="e.g. Like our Instagram post" />
      </div>
      <div>
        <label className={labelCls}>Platform *</label>
        <select className={inputCls} value={vals.platform} onChange={e => onChange('platform', e.target.value)}>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="both">Both</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Task Action *</label>
        <select className={inputCls} value={vals.taskType} onChange={e => onChange('taskType', e.target.value)}>
          <option value="like">Like</option>
          <option value="comment">Comment</option>
          <option value="share">Share</option>
          <option value="save">Save</option>
          <option value="follow">Follow</option>
          <option value="view">View / Watch</option>
        </select>
      </div>
      <div className="col-span-full">
        <label className={labelCls}>Instructions *</label>
        <textarea rows={3} className={inputCls} value={vals.description} onChange={e => onChange('description', e.target.value)}
          placeholder="e.g. Go to the link below, like the post and take a screenshot as proof." />
      </div>
      <div>
        <label className={labelCls}>Proof Required</label>
        <select className={inputCls} value={vals.proofRequired} onChange={e => onChange('proofRequired', e.target.value)}>
          <option value="screenshot">Screenshot</option>
          <option value="url">URL</option>
          <option value="none">None</option>
        </select>
      </div>
      <div />
      <CommonBottom vals={vals} onChange={onChange} />
    </div>
  );

  if (contentCategory === 'ugc') return (
    <div className={g2}>
      <VisibilityToggle value={vals.visibility} onChange={onChange} />
      <div>
        <label className={labelCls}>Title *</label>
        <input className={inputCls} value={vals.title} onChange={e => onChange('title', e.target.value)} placeholder="e.g. Share your experience with Brand X" />
      </div>
      <div>
        <label className={labelCls}>Platform</label>
        <select className={inputCls} value={vals.platform} onChange={e => onChange('platform', e.target.value)}>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="both">Both</option>
        </select>
      </div>
      <div className="col-span-full">
        <label className={labelCls}>Instructions *</label>
        <textarea rows={3} className={inputCls} value={vals.description} onChange={e => onChange('description', e.target.value)}
          placeholder="e.g. Record a 30–60 sec video showing how you used our product." />
      </div>
      <div className="col-span-full">
        <label className={labelCls}>Script <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea rows={3} className={inputCls} value={vals.script || ''} onChange={e => onChange('script', e.target.value)} placeholder="Optional script for users" />
      </div>
      <div className="col-span-full">
        <label className={labelCls}>Reference Video URL <span className="text-gray-400 font-normal">(optional)</span></label>
        <input className={inputCls} value={vals.referenceVideoUrl || ''} onChange={e => onChange('referenceVideoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=example" />
      </div>
      <CommonBottom vals={vals} onChange={onChange} />
    </div>
  );

  if (contentCategory === 'app_review') return (
    <div className={g3}>
      <VisibilityToggle value={vals.visibility} onChange={onChange} />
      <div>
        <label className={labelCls}>Title *</label>
        <input className={inputCls} value={vals.title} onChange={e => onChange('title', e.target.value)} placeholder="e.g. Review our app on Play Store" />
      </div>
      <div>
        <label className={labelCls}>App Name *</label>
        <input className={inputCls} value={vals.appName || ''} onChange={e => onChange('appName', e.target.value)} placeholder="e.g. Brand X App" />
      </div>
      <div>
        <label className={labelCls}>Store Platform *</label>
        <select className={inputCls} value={vals.platform} onChange={e => onChange('platform', e.target.value)}>
          <option value="playstore">Google Play Store</option>
          <option value="appstore">Apple App Store</option>
          <option value="both">Both Stores</option>
        </select>
      </div>
      <div className="col-span-full">
        <label className={labelCls}>Instructions *</label>
        <textarea rows={3} className={inputCls} value={vals.description} onChange={e => onChange('description', e.target.value)}
          placeholder="e.g. Download our app and leave an honest 5-star review." />
      </div>
      <div className="col-span-full">
        <label className={labelCls}>App Store URL *</label>
        <input className={inputCls} value={vals.targetUrl} onChange={e => onChange('targetUrl', e.target.value)} placeholder="https://play.google.com/store/apps/details?id=..." />
      </div>
      <div>
        <label className={labelCls}>Minimum Rating *</label>
        <select className={inputCls} value={vals.minRating || '5'} onChange={e => onChange('minRating', e.target.value)}>
          <option value="5">5 Stars</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
        </select>
      </div>
      <div /><div />
      <CommonBottom vals={vals} onChange={onChange} />
    </div>
  );

  if (contentCategory === 'gmb_review') return (
    <div className={g3}>
      <VisibilityToggle value={vals.visibility} onChange={onChange} />
      <div>
        <label className={labelCls}>Title *</label>
        <input className={inputCls} value={vals.title} onChange={e => onChange('title', e.target.value)} placeholder="e.g. Review our store on Google" />
      </div>
      <div>
        <label className={labelCls}>Business Name *</label>
        <input className={inputCls} value={vals.businessName || ''} onChange={e => onChange('businessName', e.target.value)} placeholder="e.g. Brand X Store" />
      </div>
      <div />
      <div className="col-span-full">
        <label className={labelCls}>Instructions *</label>
        <textarea rows={3} className={inputCls} value={vals.description} onChange={e => onChange('description', e.target.value)}
          placeholder="e.g. Visit our Google Business page and leave a 5-star review." />
      </div>
      <div className="col-span-full">
        <label className={labelCls}>Google Business URL *</label>
        <input className={inputCls} value={vals.targetUrl} onChange={e => onChange('targetUrl', e.target.value)} placeholder="https://g.page/brandx/review" />
      </div>
      <div>
        <label className={labelCls}>Minimum Rating *</label>
        <select className={inputCls} value={vals.minRating || '5'} onChange={e => onChange('minRating', e.target.value)}>
          <option value="5">5 Stars</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
        </select>
      </div>
      <div /><div />
      <CommonBottom vals={vals} onChange={onChange} />
    </div>
  );

  return (
    <div className={g3}>
      <VisibilityToggle value={vals.visibility} onChange={onChange} />
      <div>
        <label className={labelCls}>Title *</label>
        <input className={inputCls} value={vals.title} onChange={e => onChange('title', e.target.value)} placeholder="Task title" />
      </div>
      <div className="col-span-full">
        <label className={labelCls}>Description / Instructions</label>
        <textarea rows={3} className={inputCls} value={vals.description} onChange={e => onChange('description', e.target.value)} />
      </div>
      <CommonBottom vals={vals} onChange={onChange} />
    </div>
  );
}
