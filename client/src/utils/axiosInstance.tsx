import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const baseURL: string = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

// CSRF Token logic
let csrfTokenCache: string | null = null;

const getCsrfToken = async (): Promise<string | undefined> => {
    if (csrfTokenCache) return csrfTokenCache;

    try {
        const response = await axios.get<{ csrfToken: string }>(`${baseURL}/csrf-token`, { withCredentials: true });
        csrfTokenCache = response.data.csrfToken;
        return csrfTokenCache;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Error fetching CSRF token:', error.response.data);
        } else {
            console.error('Unknown error fetching CSRF token:', error);
        }
        return undefined;
    }
};

const getAuthToken = (): string | undefined => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || undefined;
};

const axiosInstance: AxiosInstance = axios.create({
    baseURL,
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// Extend AxiosRequestConfig to include `_retry`
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// Request interceptor for adding tokens
axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const csrfToken = await getCsrfToken();
            const authToken = getAuthToken();

            if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
            if (authToken) config.headers['Authorization'] = `Bearer ${authToken}`;

            return config;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                console.error('Error in request interceptor:', error.response.data);
            } else {
                console.error('Unknown error in request interceptor:', error);
            }
            throw error;
        }
    },
    (error) => {
        console.error('Request Interceptor Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for handling 401 errors
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            const originalRequest = error.config as ExtendedAxiosRequestConfig;

            if (originalRequest && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const response = await axios.post<{ token: string }>(
                        `${baseURL}/auth/refresh-token`,
                        {},
                        { withCredentials: true }
                    );
                    const { token } = response.data;

                    if (token) {
                        localStorage.setItem('authToken', token);
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return axiosInstance(originalRequest); // Retry the failed request
                    }
                } catch (err) {
                    if (axios.isAxiosError(err) && err.response) {
                        console.error('Token refresh failed:', err.response.data);
                    } else {
                        console.error('Unknown error during token refresh:', err);
                    }
                    localStorage.removeItem('authToken');
                    sessionStorage.removeItem('authToken');
                    window.location.href = '/login'; // Redirect to login
                }
            }
        } else {
            if (axios.isAxiosError(error) && error.response) {
                console.error('Error in response:', error.response.data);
            } else {
                console.error('Unknown error in response:', error);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
export { getCsrfToken, getAuthToken };
