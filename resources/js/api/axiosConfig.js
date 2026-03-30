import axios from 'axios';
import { tokenManager } from '../utils/tokenManager';

// Buat instance axios dengan base URL
const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request Interceptor: Auto-attach Bearer token
apiClient.interceptors.request.use(
    (config) => {
        const token = tokenManager.getToken();

        // Jika ada token, attach ke header Authorization
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle session timeout dan errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized - Session expired
        if (error.response?.status === 401) {
            const errorCode = error.response?.data?.code;
            const errorMessage = error.response?.data?.message;

            // Jika session timeout atau token invalid
            if (errorCode === 'SESSION_TIMEOUT' || errorMessage?.includes('Session')) {
                // Clear token dari storage
                tokenManager.clearToken();

                // Trigger event untuk membuka modal session timeout
                window.dispatchEvent(new CustomEvent('session-timeout', {
                    detail: { message: errorMessage }
                }));
            } else {
                // Unauthorized lainnya, redirect ke login
                tokenManager.clearToken();
                window.dispatchEvent(new CustomEvent('auth-error'));
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;