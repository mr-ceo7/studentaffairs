import axios from 'axios';

export const API_BASE_URL = (import.meta as any).env.VITE_API_URL || ((import.meta as any).env.PROD ? window.location.origin : 'http://localhost:8000');

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: auto-refresh on 401, device conflict detection
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const detailMsg = error.response?.data?.detail;
    if (error.response?.status === 401 && detailMsg === "Session expired. Device logged in elsewhere.") {
      window.dispatchEvent(new Event('auth:conflict'));
      return Promise.reject(error);
    }

    const isAuthRoute = originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/google';
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true });
        return apiClient(originalRequest);
      } catch (refreshError) {
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
