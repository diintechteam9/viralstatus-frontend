import apiClient from '../utils/apiClient';

/**
 * Fetch Instagram connection status
 * @returns {Promise<object>} Instagram status data
 */
export async function fetchInstagramInfo() {
  try {
    const res = await apiClient.get('/api/instagram/status');
    return res.data;
  } catch (error) {
    console.error('[Instagram] Status check failed:', error.message);
    return { connected: false };
  }
}

/**
 * Disconnect Instagram account
 * @returns {Promise<void>}
 */
export async function disconnectInstagram() {
  try {
    await apiClient.delete('/api/instagram/disconnect');
  } catch (error) {
    console.error('[Instagram] Disconnect failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Get Instagram auth URL for OAuth flow
 * @returns {string} Instagram auth URL
 */
export function getInstagramAuthUrl() {
  const fbAppId = import.meta.env.VITE_FB_APP_ID;
  const redirectUri = import.meta.env.VITE_FB_REDIRECT_URI;

  if (!fbAppId || !redirectUri) {
    console.error('[Instagram] Missing Facebook app ID or redirect URI in env');
    return null;
  }

  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_content_publish,pages_show_list,pages_read_engagement,business_management&response_type=code`;
}
