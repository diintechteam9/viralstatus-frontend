// Base URL for all API calls
const PRODUCTION_HOSTS = ['app.yovoai.com', 'vs.yovoai.com', 'www.yovoai.com'];

/** Ensures https:// is present — without it axios treats the host as a relative path → 405 on frontend */
const normalizeApiBaseUrl = (raw) => {
  let url = String(raw || '').trim().replace(/\/+$/, '');
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url);
    url = `${isLocal ? 'http' : 'https'}://${url}`;
  }
  return url;
};

const resolveApiBaseUrl = () => {
  const fromEnv = normalizeApiBaseUrl(
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    ''
  );

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (PRODUCTION_HOSTS.includes(hostname) && !import.meta.env.VITE_BACKEND_URL) {
      return origin;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return fromEnv || 'http://localhost:4000';
    }
  }

  return fromEnv || 'http://localhost:4000';
};

export const API_BASE_URL = resolveApiBaseUrl();

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
