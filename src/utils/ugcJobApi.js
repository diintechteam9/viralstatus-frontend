// src/utils/ugcJobApi.js - Minimal UGC Job API Handler

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://test.3rdai.co';

const getToken = () =>
  localStorage.getItem('clienttoken') ||
  sessionStorage.getItem('clienttoken') ||
  localStorage.getItem('admintoken') ||
  sessionStorage.getItem('admintoken');

export const ugcJobApi = {
  // Create job
  async createJob(videoId, settings = {}) {
    const defaultSettings = {
      caption: true,
      subtitle_style: 'two_line_zoom_in',
      broll: true,
      broll_source: 'pexels',
      music: true,
      bgm_mood: 'Motivational',
      sfx: true,
      zoom: true,
      silence: true,
      jumpcut: true,
      facetrack: true,
      viral: true,
      background: false,
      logo: true,
      video_quality: '1080p',
      ...settings,
    };

    const res = await fetch(`${API_BASE_URL}/api/ugc/job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ videoId, settings: defaultSettings }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Job creation failed');
    return data;
  },

  // Get job status
  async getStatus(jobId) {
    const res = await fetch(`${API_BASE_URL}/api/ugc/job/${jobId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch status');
    return data;
  },

  // Poll until done
  async pollUntilDone(jobId, maxAttempts = 120, interval = 5000) {
    for (let i = 0; i < maxAttempts; i++) {
      const data = await this.getStatus(jobId);
      
      if (data.status === 'completed' || data.outputUrl) {
        return { success: true, data };
      }
      
      if (data.status === 'failed') {
        return { success: false, error: data.error || 'Job failed' };
      }

      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    return { success: false, error: 'Job timeout' };
  },
};
