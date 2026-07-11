/**
 * Centralized Auth Resolution Utility
 * Handles token retrieval, clientId resolution, and role detection
 * with proper error handling and validation
 */

const TOKEN_KEYS = {
  client: ['clienttoken'],
  admin: ['admintoken'],
  mobileUser: ['mobileUserToken'],
};

const STORAGE_KEYS = {
  client: 'clientData',
  mobileUser: 'mobileUserData',
};

/**
 * Get token from localStorage or sessionStorage
 * @param {string} role - 'client', 'admin', or 'mobileuser'
 * @returns {string|null} - Token or null if not found
 */
export const getToken = (role = null) => {
  try {
    // Try specific role first
    if (role === 'client') {
      return localStorage.getItem('clienttoken') || sessionStorage.getItem('clienttoken');
    }
    if (role === 'admin') {
      return localStorage.getItem('admintoken') || sessionStorage.getItem('admintoken');
    }
    if (role === 'mobileuser') {
      return localStorage.getItem('mobileUserToken') || sessionStorage.getItem('mobileUserToken');
    }

    // Try all tokens
    return (
      localStorage.getItem('clienttoken') ||
      sessionStorage.getItem('clienttoken') ||
      localStorage.getItem('admintoken') ||
      sessionStorage.getItem('admintoken') ||
      localStorage.getItem('mobileUserToken') ||
      sessionStorage.getItem('mobileUserToken') ||
      null
    );
  } catch (err) {
    console.error('[AuthResolver] Token retrieval error:', err.message);
    return null;
  }
};

/**
 * Decode JWT token safely
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null
 */
const decodeJWT = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (err) {
    console.warn('[AuthResolver] JWT decode failed:', err.message);
    return null;
  }
};

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-f0-9]{24}$/i.test(id.trim());
};

/**
 * Get user data from localStorage
 * @param {string} role - 'client' or 'mobileuser'
 * @returns {object} - User data object
 */
const getUserData = (role = 'client') => {
  try {
    const key = role === 'mobileuser' ? STORAGE_KEYS.mobileUser : STORAGE_KEYS.client;
    const data = localStorage.getItem(key) || sessionStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.warn('[AuthResolver] User data parse error:', err.message);
    return {};
  }
};

/**
 * Resolve clientId with multiple fallback strategies
 * @returns {string|null} - ClientId or null if not found
 */
export const resolveClientId = () => {
  try {
    // Strategy 1: Check localStorage/sessionStorage directly
    const clientData = getUserData('client');
    if (clientData._id && isValidObjectId(clientData._id)) {
      return String(clientData._id).trim();
    }
    if (clientData.id && isValidObjectId(clientData.id)) {
      return String(clientData.id).trim();
    }

    // Strategy 2: Decode JWT token
    const token = getToken('client');
    if (token) {
      const payload = decodeJWT(token);
      if (payload) {
        if (payload.id && isValidObjectId(payload.id)) {
          return String(payload.id).trim();
        }
        if (payload.clientObjectId && isValidObjectId(payload.clientObjectId)) {
          return String(payload.clientObjectId).trim();
        }
        if (payload.clientId && isValidObjectId(payload.clientId)) {
          return String(payload.clientId).trim();
        }
      }
    }

    // No valid clientId found
    console.warn('[AuthResolver] Could not resolve valid clientId');
    return null;
  } catch (err) {
    console.error('[AuthResolver] ClientId resolution error:', err.message);
    return null;
  }
};

/**
 * Get user role from storage
 * @returns {string} - Role ('client', 'admin', 'mobileuser', or empty string)
 */
export const getRole = () => {
  try {
    // Check client data first
    const clientData = getUserData('client');
    if (clientData.role) return clientData.role;

    // Check mobile user data
    const mobileData = getUserData('mobileuser');
    if (mobileData.role) return mobileData.role;

    // Decode JWT to get role
    const token = getToken();
    if (token) {
      const payload = decodeJWT(token);
      if (payload && payload.role) return payload.role;
    }

    return '';
  } catch (err) {
    console.warn('[AuthResolver] Role detection error:', err.message);
    return '';
  }
};

/**
 * Get auth headers for API requests
 * @param {string} role - Optional role to get specific token
 * @returns {object} - Authorization header object
 */
export const getAuthHeaders = (role = null) => {
  const token = getToken(role);
  if (!token) {
    console.warn('[AuthResolver] No token found for auth headers');
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken();
  const clientId = resolveClientId();
  return !!(token && clientId);
};

/**
 * Validate auth state and return error message if invalid
 * @returns {string|null} - Error message or null if valid
 */
export const validateAuthState = () => {
  const token = getToken();
  if (!token) {
    return 'Authentication token not found. Please log in again.';
  }

  const clientId = resolveClientId();
  if (!clientId) {
    return 'User ID could not be resolved. Please log in again.';
  }

  const role = getRole();
  if (!role) {
    return 'User role could not be determined. Please log in again.';
  }

  return null;
};

/**
 * Clear all auth data from storage
 */
export const clearAuth = () => {
  try {
    localStorage.removeItem('clienttoken');
    localStorage.removeItem('admintoken');
    localStorage.removeItem('mobileUserToken');
    localStorage.removeItem('clientData');
    localStorage.removeItem('mobileUserData');
    sessionStorage.removeItem('clienttoken');
    sessionStorage.removeItem('admintoken');
    sessionStorage.removeItem('mobileUserToken');
    sessionStorage.removeItem('clientData');
    sessionStorage.removeItem('mobileUserData');
  } catch (err) {
    console.error('[AuthResolver] Clear auth error:', err.message);
  }
};
