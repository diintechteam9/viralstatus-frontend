/**
 * Centralized authentication utilities
 * Provides consistent token and user ID retrieval
 */

/**
 * Get authentication token from storage
 * Checks multiple storage locations in priority order
 * @returns {string} Token or empty string if not found
 */
export const getAuthToken = () => {
  return (
    sessionStorage.getItem('clienttoken') ||
    localStorage.getItem('clienttoken') ||
    sessionStorage.getItem('usertoken') ||
    localStorage.getItem('usertoken') ||
    sessionStorage.getItem('admintoken') ||
    localStorage.getItem('admintoken') ||
    ''
  );
};

/**
 * Get user ID from storage
 * Checks multiple storage locations and userData object
 * @returns {string} User ID or empty string if not found
 */
export const getUserId = () => {
  try {
    // Check sessionStorage userData first
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      const id = parsed.clientId || parsed._id || parsed.id;
      if (id) return id;
    }
  } catch (e) {
    console.debug('[Auth] Failed to parse userData:', e.message);
  }

  // Fallback to direct storage keys
  return (
    localStorage.getItem('mongoId') ||
    localStorage.getItem('clientId') ||
    sessionStorage.getItem('mongoId') ||
    sessionStorage.getItem('clientId') ||
    ''
  );
};

/**
 * Get user role from storage
 * @returns {string} Role (admin, client, user) or empty string
 */
export const getUserRole = () => {
  try {
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.role || '';
    }
  } catch (e) {
    console.debug('[Auth] Failed to parse user role:', e.message);
  }
  return '';
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  sessionStorage.removeItem('clienttoken');
  localStorage.removeItem('clienttoken');
  sessionStorage.removeItem('usertoken');
  localStorage.removeItem('usertoken');
  sessionStorage.removeItem('admintoken');
  localStorage.removeItem('admintoken');
  sessionStorage.removeItem('userData');
  localStorage.removeItem('mongoId');
  localStorage.removeItem('clientId');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Get user data from storage
 * @returns {object} User data object or null
 */
export const getUserData = () => {
  try {
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (e) {
    console.debug('[Auth] Failed to parse userData:', e.message);
  }
  return null;
};
