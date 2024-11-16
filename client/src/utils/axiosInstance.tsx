import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Base URL configuration with fallback
const baseURL: string = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
console.log('Base URL:', baseURL);

// CSRF Token logic
let csrfToken: string | undefined = undefined;
let csrfTokenPromise: Promise<string | undefined> | null = null;

const getCsrfToken = async (): Promise<string | undefined> => {
  if (csrfTokenPromise) return csrfTokenPromise;

  csrfTokenPromise = (async () => {
    try {
      // Fetch CSRF token from backend CSRF token endpoint
      const response = await axios.get(`${baseURL}/csrf-token`, { withCredentials: true }); // Ensure cookies are sent
      csrfToken = response.data?.csrfToken; // Store CSRF token
      return csrfToken;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      return undefined;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
};

// Auth Token logic
const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const response = await axios.post(`${baseURL}/auth/refresh-token`, {}, { withCredentials: true });
    const newToken = response.data?.token;
    if (newToken) {
      document.cookie = `token=${newToken}; path=/; max-age=3600`; // 1 hour expiration
      return newToken;
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return true;
  }
};

const getAuthToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const token = document.cookie.split('; ').find(row => row.startsWith('token='));
  return token ? token.split('=')[1] : null;
};

// Fetch CSRF token if it's missing, and refresh auth token if necessary
const getTokensIfNeeded = async (): Promise<{ csrfToken: string | undefined, authToken: string | null }> => {
  const authToken = getAuthToken();  // Do not fetch until needed
  const tokenResults = { csrfToken, authToken };

  if (!tokenResults.csrfToken) {
    tokenResults.csrfToken = await getCsrfToken(); // Fetch CSRF token if not already available
  }

  // Fetch new auth token only if expired or missing
  if (tokenResults.authToken && isTokenExpired(tokenResults.authToken)) {
    tokenResults.authToken = await refreshAuthToken();
  }

  return tokenResults;
};

// Axios instance configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Ensure credentials (cookies) are sent with requests
});

// Interceptors for managing tokens
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { csrfToken, authToken } = await getTokensIfNeeded();

      if (!authToken) throw new Error("Authorization token is missing.");
      if (!csrfToken) throw new Error("CSRF token is missing.");

      // Ensure that headers exist before assigning
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${authToken}`;
      config.headers['X-CSRF-Token'] = csrfToken; // Include CSRF token in request headers

      // Ensure CSRF token is not sent as a cookie (it should only be in the header)
      document.cookie = '_csrf=; path=/; max-age=0';  // Remove any CSRF cookie if it's set

    } catch (error) {
      console.error('Error in request interceptor:', error);
    }
    return config; // Returning config directly, not as a Promise
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // Improved error handling for expired tokens and other response errors
    if (error.response?.status === 401 && error.config && !error.config._retry) {
      // Token might be expired, try refreshing it
      error.config._retry = true; // Prevent infinite retry loop
      const newAuthToken = await refreshAuthToken();
      if (newAuthToken) {
        error.config.headers['Authorization'] = `Bearer ${newAuthToken}`;
        return axiosInstance(error.config); // Retry original request with new token
      } else {
        console.error('Auth token refresh failed, request will not be retried.');
        return Promise.reject(error); // Reject if refresh fails
      }
    }

    console.error('Response Error:', error);
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { getCsrfToken, refreshAuthToken, getAuthToken, isTokenExpired };
