import axios from 'axios';
import { API_BASE_URL } from '../config';

const getToken = () =>
  localStorage.getItem('clienttoken') ||
  sessionStorage.getItem('clienttoken') ||
  localStorage.getItem('admintoken') ||
  sessionStorage.getItem('admintoken') ||
  null;

const authHeaders = () => {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

/**
 * UGC Job Service - Handles all UGC video generation job operations
 */
export const ugcJobService = {
  /**
   * Create a new UGC job with video generation settings
   * @param {string} videoId - The video ID to process
   * @param {object} settings - Video generation settings
   * @returns {Promise<object>} Job response with jobId and status
   */
  async createJob(videoId, settings = {}) {
    try {
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

      const response = await axios.post(
        `${API_BASE_URL}/api/ugc/job`,
        {
          videoId,
          settings: defaultSettings,
        },
        { headers: authHeaders() }
      );

      return {
        success: true,
        data: response.data,
        jobId: response.data.jobId || response.data._id,
        status: response.data.status || 'pending',
      };
    } catch (error) {
      console.error('[ugcJobService] createJob error:', error.message);
      return {
        success: false,
        error: error?.response?.data?.message || error.message || 'Failed to create UGC job',
        statusCode: error?.response?.status,
      };
    }
  },

  /**
   * Get job status and details
   * @param {string} jobId - The job ID to check
   * @returns {Promise<object>} Job status and details
   */
  async getJobStatus(jobId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ugc/job/${jobId}`,
        { headers: authHeaders() }
      );

      return {
        success: true,
        data: response.data,
        status: response.data.status || 'pending',
        progress: response.data.progress || 0,
        outputUrl: response.data.outputUrl || null,
        error: response.data.error || null,
      };
    } catch (error) {
      console.error('[ugcJobService] getJobStatus error:', error.message);
      return {
        success: false,
        error: error?.response?.data?.message || error.message || 'Failed to fetch job status',
        statusCode: error?.response?.status,
      };
    }
  },

  /**
   * Poll job status until completion
   * @param {string} jobId - The job ID to poll
   * @param {number} maxAttempts - Maximum polling attempts (default: 120 = 10 minutes at 5s intervals)
   * @param {number} interval - Polling interval in ms (default: 5000)
   * @returns {Promise<object>} Final job status
   */
  async pollJobStatus(jobId, maxAttempts = 120, interval = 5000) {
    let attempts = 0;

    return new Promise((resolve) => {
      const poll = async () => {
        attempts++;
        const result = await this.getJobStatus(jobId);

        if (result.success) {
          const { status, progress, outputUrl, error } = result;

          // Job completed successfully
          if (status === 'completed' || outputUrl) {
            resolve({
              success: true,
              status: 'completed',
              progress: 100,
              outputUrl,
              data: result.data,
            });
            return;
          }

          // Job failed
          if (status === 'failed' || error) {
            resolve({
              success: false,
              status: 'failed',
              error: error || 'Job processing failed',
              data: result.data,
            });
            return;
          }

          // Still processing
          if (attempts < maxAttempts) {
            setTimeout(poll, interval);
          } else {
            // Max attempts reached
            resolve({
              success: false,
              status: 'timeout',
              error: 'Job polling timeout - still processing',
              progress,
              data: result.data,
            });
          }
        } else {
          // API error
          resolve({
            success: false,
            status: 'error',
            error: result.error,
            statusCode: result.statusCode,
          });
        }
      };

      poll();
    });
  },

  /**
   * Cancel a running job
   * @param {string} jobId - The job ID to cancel
   * @returns {Promise<object>} Cancellation response
   */
  async cancelJob(jobId) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/ugc/job/${jobId}`,
        { headers: authHeaders() }
      );

      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Job cancelled successfully',
      };
    } catch (error) {
      console.error('[ugcJobService] cancelJob error:', error.message);
      return {
        success: false,
        error: error?.response?.data?.message || error.message || 'Failed to cancel job',
        statusCode: error?.response?.status,
      };
    }
  },

  /**
   * Get default video generation settings
   * @returns {object} Default settings object
   */
  getDefaultSettings() {
    return {
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
    };
  },

  /**
   * Validate video generation settings
   * @param {object} settings - Settings to validate
   * @returns {object} Validation result with errors array
   */
  validateSettings(settings) {
    const errors = [];
    const validQualities = ['720p', '1080p', '4k'];
    const validMoods = ['Motivational', 'Energetic', 'Calm', 'Upbeat', 'Dramatic'];
    const validSubtitleStyles = ['two_line_zoom_in', 'one_line_slide', 'pop_in', 'fade_in'];
    const validBrollSources = ['pexels', 'pixabay', 'unsplash'];

    if (settings.video_quality && !validQualities.includes(settings.video_quality)) {
      errors.push(`Invalid video_quality. Must be one of: ${validQualities.join(', ')}`);
    }

    if (settings.bgm_mood && !validMoods.includes(settings.bgm_mood)) {
      errors.push(`Invalid bgm_mood. Must be one of: ${validMoods.join(', ')}`);
    }

    if (settings.subtitle_style && !validSubtitleStyles.includes(settings.subtitle_style)) {
      errors.push(`Invalid subtitle_style. Must be one of: ${validSubtitleStyles.join(', ')}`);
    }

    if (settings.broll_source && !validBrollSources.includes(settings.broll_source)) {
      errors.push(`Invalid broll_source. Must be one of: ${validBrollSources.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

export default ugcJobService;
