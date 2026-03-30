// Base URL for all API calls
export const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4000'
).replace(/\/+$/, '');

// Default Client ID — hidden from user, used in mobile user auth
export const DEFAULT_CLIENT_ID = import.meta.env.VITE_DEFAULT_CLIENT_ID || 'CLI-UOVNVD';
