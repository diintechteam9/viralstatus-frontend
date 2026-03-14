// Base URL for all API calls
// Fallbacks are important so API + images work in dev even if env is missing.
export const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4000'
).replace(/\/+$/, '');
