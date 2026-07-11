import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getToken,
  resolveClientId,
  getRole,
  getAuthHeaders,
  isAuthenticated,
  validateAuthState,
} from '../utils/authResolver';

/**
 * Custom hook for managing authentication state
 * Provides token, clientId, role, and auth headers with error handling
 */
export const useAuth = () => {
  const [token, setToken] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    try {
      const authError = validateAuthState();
      if (authError) {
        setError(authError);
        setIsLoading(false);
        return;
      }

      const resolvedToken = getToken();
      const resolvedClientId = resolveClientId();
      const resolvedRole = getRole();

      setToken(resolvedToken);
      setClientId(resolvedClientId);
      setRole(resolvedRole);
      setError(null);
    } catch (err) {
      console.error('[useAuth] Initialization error:', err.message);
      setError('Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get auth headers
  const authHeaders = useCallback(() => {
    if (!token) {
      console.warn('[useAuth] No token available for headers');
      return {};
    }
    return getAuthHeaders();
  }, [token]);

  // Check if authenticated
  const isAuth = useCallback(() => {
    return isAuthenticated();
  }, []);

  // Show error toast if auth error exists
  useEffect(() => {
    if (error && !isLoading) {
      toast.error(error);
    }
  }, [error, isLoading]);

  return {
    token,
    clientId,
    role,
    isLoading,
    error,
    authHeaders,
    isAuth,
    isAuthenticated: !!token && !!clientId,
  };
};

/**
 * Custom hook for API calls with automatic auth handling
 */
export const useAuthenticatedAPI = () => {
  const { token, clientId, authHeaders, error: authError } = useAuth();

  const makeRequest = useCallback(
    async (method, url, data = null, options = {}) => {
      try {
        if (!token || !clientId) {
          throw new Error('Not authenticated. Please log in.');
        }

        const headers = {
          ...authHeaders(),
          'Content-Type': 'application/json',
          ...options.headers,
        };

        const config = {
          method,
          headers,
          ...options,
        };

        if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
          config.body = JSON.stringify(data);
        }

        const response = await fetch(url, config);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `API error: ${response.status} ${response.statusText}`
          );
        }

        return await response.json();
      } catch (err) {
        console.error('[useAuthenticatedAPI] Request error:', err.message);
        throw err;
      }
    },
    [token, clientId, authHeaders]
  );

  return {
    makeRequest,
    isReady: !!token && !!clientId,
    error: authError,
  };
};
