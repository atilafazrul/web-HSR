import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/axiosConfig';
import tokenManager from '../utils/tokenManager';

// Waktu idle sebelum session timeout (60 menit)
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;

// Event-event yang dianggap sebagai aktivitas user
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart', 'wheel'];

export const useAuth = () => {
    const [user, setUser] = useState(() => tokenManager.isAuthenticated() ? tokenManager.getUser() : null);
    const [isAuthenticated, setIsAuthenticated] = useState(() => tokenManager.isAuthenticated());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSessionTimeout, setIsSessionTimeout] = useState(false);

    // Gunakan ref untuk timer dan listener agar tidak memicu re-render
    const idleTimerRef = useRef(null);
    const activityHandlerRef = useRef(null);

    // Simpan handleSessionTimeout sebagai ref agar startSessionMonitoring
    // tidak perlu bergantung padanya sebagai dependency (mencegah re-create)
    const handleSessionTimeoutRef = useRef(null);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleSessionTimeout = useCallback(() => {
        tokenManager.clearToken();
        setUser(null);
        setIsAuthenticated(false);
        setIsSessionTimeout(true);
    }, []);

    // Simpan di ref agar bisa diakses di dalam timeout callback tanpa dependency
    handleSessionTimeoutRef.current = handleSessionTimeout;

    const handleAuthError = useCallback(() => {
        tokenManager.clearToken();
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    // ─── Session Monitoring ───────────────────────────────────────────────────

    const stopSessionMonitoring = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
        if (activityHandlerRef.current) {
            ACTIVITY_EVENTS.forEach(event => {
                window.removeEventListener(event, activityHandlerRef.current);
            });
            activityHandlerRef.current = null;
        }
    }, []); // deps kosong — hanya mengakses refs, tidak berubah antar render

    const startSessionMonitoring = useCallback(() => {
        // Bersihkan monitoring sebelumnya
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
        if (activityHandlerRef.current) {
            ACTIVITY_EVENTS.forEach(event => {
                window.removeEventListener(event, activityHandlerRef.current);
            });
            activityHandlerRef.current = null;
        }

        const resetIdleTimer = () => {
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
            // Gunakan ref agar tidak perlu handleSessionTimeout sebagai dep
            idleTimerRef.current = setTimeout(() => {
                handleSessionTimeoutRef.current?.();
            }, IDLE_TIMEOUT_MS);
        };

        activityHandlerRef.current = resetIdleTimer;

        ACTIVITY_EVENTS.forEach(event => {
            window.addEventListener(event, resetIdleTimer, { passive: true });
        });

        // Mulai timer awal
        resetIdleTimer();
    }, []); // deps kosong — hanya mengakses refs, tidak berubah antar render

    // ─── Auth Actions ─────────────────────────────────────────────────────────

    const login = useCallback(async (credentials, rememberMe = false) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.post('/login', {
                ...credentials,
                remember_me: rememberMe,
            });

            const { data } = response.data;

            tokenManager.setToken(data.token, data.expires_at, data.remember_me, data.user);

            setUser(data.user);
            setIsAuthenticated(true);
            setIsSessionTimeout(false);

            startSessionMonitoring();

            return { success: true, data };
        } catch (err) {
            const apiError = err.response?.data?.errors?.email?.[0]
                || err.response?.data?.errors?.password?.[0]
                || (err.response?.data?.errors && typeof err.response.data.errors === 'object' && Object.values(err.response.data.errors).flat()[0])
                || err.response?.data?.message
                || 'Email atau password yang Anda masukkan salah.';
            const status = err.response?.status;
            const retryAfter = err.response?.data?.retry_after ?? (err.response?.headers ? parseInt(err.response.headers['retry-after'] || 0, 10) : 0);
            setError(apiError);
            return {
                success: false,
                error: apiError,
                status: status,
                retryAfter: retryAfter,
            };
        } finally {
            setIsLoading(false);
        }
    }, [startSessionMonitoring]);

    const logout = useCallback(async () => {
        setIsLoading(true);

        try {
            if (tokenManager.getToken()) {
                await apiClient.post('/logout');
            }
        } catch (err) {
            console.error('Logout API error:', err);
        } finally {
            tokenManager.clearToken();
            setUser(null);
            setIsAuthenticated(false);
            setIsSessionTimeout(false);
            stopSessionMonitoring();
            setIsLoading(false);
        }
    }, [stopSessionMonitoring]);

    const resetSessionTimeout = useCallback(() => {
        setIsSessionTimeout(false);
    }, []);

    // ─── Effects ──────────────────────────────────────────────────────────────

    // Listen untuk event session-timeout & auth-error dari axios interceptor
    useEffect(() => {
        const onSessionTimeout = () => handleSessionTimeout();
        const onAuthError = () => handleAuthError();

        window.addEventListener('session-timeout', onSessionTimeout);
        window.addEventListener('auth-error', onAuthError);

        return () => {
            window.removeEventListener('session-timeout', onSessionTimeout);
            window.removeEventListener('auth-error', onAuthError);
        };
    }, [handleSessionTimeout, handleAuthError]);

    // Start/stop idle monitoring saat status authenticated berubah.
    // startSessionMonitoring & stopSessionMonitoring memiliki deps [] (stabil),
    // sehingga effect ini HANYA jalan ulang saat isAuthenticated berubah.
    useEffect(() => {
        if (isAuthenticated) {
            startSessionMonitoring();
        } else {
            stopSessionMonitoring();
        }

        return () => {
            stopSessionMonitoring();
        };
    }, [isAuthenticated, startSessionMonitoring, stopSessionMonitoring]);

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        isSessionTimeout,
        login,
        logout,
        resetSessionTimeout,
    };
};

export default useAuth;