import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Centralized API client with interceptors for:
 * - Automatic token injection
 * - Error handling
 * - Request/response logging
 * - Timeout management
 */

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  withCredentials: true,
});

// ── Request Interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Get token from storage
    const token =
      sessionStorage.getItem('clienttoken') ||
      localStorage.getItem('clienttoken') ||
      sessionStorage.getItem('usertoken') ||
      localStorage.getItem('usertoken') ||
      sessionStorage.getItem('admintoken') ||
      localStorage.getItem('admintoken');

    // Inject token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.debug(`[API] ${config.method.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// ── Response Interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.debug(`[API] Response ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const { response, config } = error;

    // Handle 401 Unauthorized - clear tokens and redirect to login
    if (response?.status === 401) {
      console.warn('[API] Unauthorized - clearing tokens');
      sessionStorage.removeItem('clienttoken');
      localStorage.removeItem('clienttoken');
      sessionStorage.removeItem('usertoken');
      localStorage.removeItem('usertoken');
      sessionStorage.removeItem('admintoken');
      localStorage.removeItem('admintoken');
      sessionStorage.removeItem('userData');
      
      // Redirect to appropriate login page
      const currentPath = window.location.pathname;
      if (currentPath.includes('/admin')) {
        window.location.href = '/admin/login';
      } else if (currentPath.includes('/client')) {
        window.location.href = '/client/login';
      } else {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden
    if (response?.status === 403) {
      console.error('[API] Forbidden - access denied');
    }

    // Handle 404 Not Found
    if (response?.status === 404) {
      console.error(`[API] Not found: ${config.url}`);
    }

    // Handle 500+ Server errors
    if (response?.status >= 500) {
      console.error('[API] Server error:', response.status, response.data);
    }

    // Handle network errors
    if (!response) {
      console.error('[API] Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
