import apiClient from '../utils/apiClient';
import { getUserId } from '../utils/authUtils';

/**
 * Fetch YouTube connection status
 * @returns {Promise<object>} YouTube status data
 */
export async function fetchYoutubeInfo() {
  try {
    const res = await apiClient.get('/api/youtube/status');
    return res.data;
  } catch (error) {
    console.error('[YouTube] Status check failed:', error.message);
    return { connected: false };
  }
}

/**
 * Get YouTube profile data
 * @returns {Promise<object>} YouTube profile information
 */
export async function fetchYoutubeProfile() {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }
    const res = await apiClient.get(`/auth/youtube/profile?userId=${userId}`);
    return res.data;
  } catch (error) {
    console.error('[YouTube] Profile fetch failed:', error.message);
    return null;
  }
}

/**
 * Disconnect YouTube account
 * @returns {Promise<void>}
 */
export async function disconnectYoutube() {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }
    await apiClient.post('/api/youtube/disconnect', { userId });
  } catch (error) {
    console.error('[YouTube] Disconnect failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Get YouTube auth URL for OAuth flow
 * @returns {string} YouTube auth URL
 */
export function getYoutubeAuthUrl() {
  const userId = getUserId();
  if (!userId) {
    console.error('[YouTube] User ID not found for auth URL');
    return null;
  }
  return `${apiClient.defaults.baseURL}/auth/youtube?userId=${userId}`;
}
