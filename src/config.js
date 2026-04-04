// Base URL for all API calls
export const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4000'
).replace(/\/+$/, '');

// Default Client ID — hidden from user, used in mobile user auth
export const DEFAULT_CLIENT_ID = import.meta.env.VITE_DEFAULT_CLIENT_ID || 'CLI-UOVNVD';

/**
 * Web OAuth Client ID (Google Cloud → APIs & Services → Credentials → OAuth 2.0 Client IDs).
 * Set VITE_GOOGLE_CLIENT_ID in .env — must match GoogleOAuthProvider in main.jsx.
 * Authorized JavaScript origins must include e.g. http://localhost:5173 (exact port).
 */
const FALLBACK_GOOGLE_WEB_CLIENT_ID =
  '635888438775-6bi5aok4nlm0hfjt7nv7a4ktudsgis1d.apps.googleusercontent.com';

export const GOOGLE_OAUTH_CLIENT_ID = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
).trim() || FALLBACK_GOOGLE_WEB_CLIENT_ID;
