/**
 * useAuth Hook
 * 
 * Custom hook untuk mengelola state autentikasi dan session.
 * Features:
 * - Login dengan remember me option
 * - Logout dengan revoke token
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/axiosConfig';
import tokenManager from '../utils/tokenManager';

// Waktu idle sebelum session timeout (15 menit)
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

// Event-event yang dianggap sebagai aktivitas user
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart', 'wheel'];

export const useAuth = () => {
    const [user, setUser] = useState(() => tokenManager.isAuthenticated() ? tokenManager.getUser() : null);
    const [isAuthenticated, setIsAuthenticated] = useState(() => tokenManager.isAuthenticated());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSessionTimeout, setIsSessionTimeout] = useState(false);

    // Ref untuk idle timer dan activity listener
    const idleTimerRef = useRef(null);
    const activityHandlerRef = useRef(null);

    /**
     * Handle session timeout
     */
    const handleSessionTimeout = useCallback(() => {
        tokenManager.clearToken();
        setUser(null);
        setIsAuthenticated(false);
        setIsSessionTimeout(true);
    }, []);

    /**
     * Handle general auth error
     */
    const handleAuthError = useCallback(() => {
        tokenManager.clearToken();
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    /**
     * Stop session monitoring — bersihkan timer & event listeners
     */
    const stopSessionMonitoring = useCallback(() => {
        // Clear idle timer
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }

        // Hapus activity event listeners
        if (activityHandlerRef.current) {
            ACTIVITY_EVENTS.forEach(event => {
                window.removeEventListener(event, activityHandlerRef.current);
            });
            activityHandlerRef.current = null;
        }
    }, []);

    /**
     * Start session monitoring berbasis idle activity.
     * Timer di-reset setiap ada aktivitas user.
     * Jika tidak ada aktivitas selama IDLE_TIMEOUT_MS, session dianggap timeout.
     */
    const startSessionMonitoring = useCallback(() => {
        // Hentikan monitoring yang sedang berjalan dulu
        stopSessionMonitoring();

        const resetIdleTimer = () => {
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
            idleTimerRef.current = setTimeout(() => {
                handleSessionTimeout();
            }, IDLE_TIMEOUT_MS);
        };

        // Simpan referensi handler agar bisa di-remove nanti
        activityHandlerRef.current = resetIdleTimer;

        // Pasang event listener pada setiap aktivitas user
        ACTIVITY_EVENTS.forEach(event => {
            window.addEventListener(event, resetIdleTimer, { passive: true });
        });

        // Mulai timer awal
        resetIdleTimer();
    }, [handleSessionTimeout, stopSessionMonitoring]);

    /**
     * Login user
     * @param {Object} credentials - { email, password }
     * @param {boolean} rememberMe - Keep logged in for 7 days
     */
    const login = useCallback(async (credentials, rememberMe = false) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.post('/login', {
                ...credentials,
                remember_me: rememberMe
            });

            const { data } = response.data;

            // Simpan token dan data
            tokenManager.setToken(
                data.token,
                data.expires_at,
                data.remember_me,
                data.user
            );

            // Update state
            setUser(data.user);
            setIsAuthenticated(true);
            setIsSessionTimeout(false);

            // Mulai idle-based session monitoring
            startSessionMonitoring();

            return { success: true, data };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login gagal';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [startSessionMonitoring]);

    /**
     * Logout user dan revoke token
     */
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

            // Stop session monitoring
            stopSessionMonitoring();

            setIsLoading(false);
        }
    }, [stopSessionMonitoring]);

    /**
     * Check session status secara manual
     */
    const checkSession = useCallback(async () => {
        if (!tokenManager.getToken()) {
            setIsAuthenticated(false);
            setUser(null);
            return;
        }

        try {
            const response = await apiClient.get('/me');
            if (response.data.success) {
                setUser(response.data.data.user);
                setIsAuthenticated(true);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                handleSessionTimeout();
            }
        }
    }, [handleSessionTimeout]);

    /**
     * Reset session timeout state (setelah login ulang)
     */
    const resetSessionTimeout = useCallback(() => {
        setIsSessionTimeout(false);
    }, []);

    // Effect: Listen untuk event session timeout dan auth error dari axios interceptor
    useEffect(() => {
        const handleSessionTimeoutEvent = () => handleSessionTimeout();
        const handleAuthErrorEvent = () => handleAuthError();

        window.addEventListener('session-timeout', handleSessionTimeoutEvent);
        window.addEventListener('auth-error', handleAuthErrorEvent);

        return () => {
            window.removeEventListener('session-timeout', handleSessionTimeoutEvent);
            window.removeEventListener('auth-error', handleAuthErrorEvent);
        };
    }, [handleSessionTimeout, handleAuthError]);

    // Effect: Start session monitoring saat authenticated (termasuk restore session)
    useEffect(() => {
        if (isAuthenticated) {
            startSessionMonitoring();
        } else {
            stopSessionMonitoring();
        }

        return () => {
            stopSessionMonitoring();
        };
    }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    // Effect: Check session saat mount (untuk restore session dari localStorage)
    useEffect(() => {
        if (tokenManager.getToken() && !user) {
            checkSession();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        isSessionTimeout,
        login,
        logout,
        checkSession,
        resetSessionTimeout,
    };
};

export default useAuth;