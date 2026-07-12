import React, { useState } from 'react';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useUGCJob from '../hooks/useUGCJob';
import ugcJobService from '../services/ugcJobService';

/**
 * UGC Job Processor Component
 * Demonstrates how to create and monitor UGC video generation jobs
 */
export default function UGCJobProcessor({ videoId, onJobComplete }) {
  const { jobId, status, progress, outputUrl, error, data, createJob, startPolling, cancelJob, reset } = useUGCJob();
  const [customSettings, setCustomSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleCreateJob = async () => {
    if (!videoId) {
      toast.error('Video ID is required');
      return;
    }

    const settings = customSettings || ugcJobService.getDefaultSettings();

    // Validate settings
    const validation = ugcJobService.validateSettings(settings);
    if (!validation.valid) {
      toast.error(`Invalid settings: ${validation.errors.join(', ')}`);
      return;
    }

    toast.loading('Creating UGC job...');
    const result = await createJob(videoId, settings);

    if (result.success) {
      toast.dismiss();
      toast.success(`Job created: ${result.jobId}`);
      // Start polling for status updates
      startPolling(result.jobId, 5000);
    } else {
      toast.dismiss();
      toast.error(result.error);
    }
  };

  const handleCancel = async () => {
    const result = await cancelJob();
    if (result.success) {
      toast.success('Job cancelled');
    } else {
      toast.error(result.error);
    }
  };

  const handleReset = () => {
    reset();
    setCustomSettings(null);
    setShowSettings(false);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-emerald-600';
      case 'failed':
        return 'text-rose-600';
      case 'processing':
        return 'text-orange-600';
      default:
        return 'text-slate-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-emerald-600" size={20} />;
      case 'failed':
        return <FaExclamationTriangle className="text-rose-600" size={20} />;
      case 'processing':
        return <FaSpinner className="animate-spin text-orange-600" size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🎬 UGC Video Generator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate viral-ready videos with AI enhancements
          </p>
        </div>

        {/* Status Display */}
        {jobId && (
          <div className={`p-4 rounded-xl border-2 ${
            status === 'completed' ? 'bg-emerald-50 border-emerald-200' :
            status === 'failed' ? 'bg-rose-50 border-rose-200' :
            'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {getStatusIcon()}
              <div>
                <p className={`font-bold capitalize ${getStatusColor()}`}>
                  {status === 'processing' ? `Processing... ${progress}%` : status}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Job ID: {jobId}</p>
              </div>
            </div>

            {/* Progress Bar */}
            {status === 'processing' && (
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-sm text-rose-700 mt-3 font-medium">{error}</p>
            )}

            {/* Output URL */}
            {outputUrl && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-200">
                <p className="text-xs font-bold text-slate-500 mb-2">Output Video</p>
                <a
                  href={outputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <FaDownload size={12} /> Download Video
                </a>
              </div>
            )}
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Video Generation Settings</p>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={customSettings?.caption ?? true}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, caption: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-slate-700 font-medium">Captions</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={customSettings?.broll ?? true}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, broll: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-slate-700 font-medium">B-Roll</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={customSettings?.music ?? true}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, music: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-slate-700 font-medium">Background Music</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={customSettings?.sfx ?? true}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, sfx: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-slate-700 font-medium">Sound Effects</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={customSettings?.zoom ?? true}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, zoom: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-slate-700 font-medium">Zoom Effects</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={customSettings?.viral ?? true}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, viral: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-slate-700 font-medium">Viral Mode</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Video Quality
              </label>
              <select
                value={customSettings?.video_quality ?? '1080p'}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, video_quality: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p (Recommended)</option>
                <option value="4k">4K</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Background Music Mood
              </label>
              <select
                value={customSettings?.bgm_mood ?? 'Motivational'}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, bgm_mood: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="Motivational">Motivational</option>
                <option value="Energetic">Energetic</option>
                <option value="Calm">Calm</option>
                <option value="Upbeat">Upbeat</option>
                <option value="Dramatic">Dramatic</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          {!jobId ? (
            <>
              <button
                onClick={handleCreateJob}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold hover:brightness-105 transition-all"
              >
                🚀 Generate Video
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
              >
                ⚙️ Settings
              </button>
            </>
          ) : (
            <>
              {status !== 'completed' && status !== 'failed' && (
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 rounded-lg border border-rose-300 text-rose-700 font-bold hover:bg-rose-50 transition-all"
                >
                  Cancel Job
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
              >
                Start New Job
              </button>
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium">
            💡 <strong>Tip:</strong> Video generation typically takes 2-5 minutes. You can close this window and check back later.
          </p>
        </div>
      </div>
    </div>
  );
}
