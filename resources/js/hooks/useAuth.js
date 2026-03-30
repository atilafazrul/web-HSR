/**
 * useAuth Hook
 * 
 * Custom hook untuk mengelola state autentikasi dan session.
 * Features:
 * - Login dengan remember me option
 * - Logout dengan revoke token
 * - Session monitoring (check setiap 30 detik)
 * - Auto logout saat session expired
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/axiosConfig';
import tokenManager from '../utils/tokenManager';

export const useAuth = () => {
    const [user, setUser] = useState(() => tokenManager.isAuthenticated() ? tokenManager.getUser() : null);
    const [isAuthenticated, setIsAuthenticated] = useState(() => tokenManager.isAuthenticated());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSessionTimeout, setIsSessionTimeout] = useState(false);
    
    // Ref untuk interval check session
    const sessionCheckIntervalRef = useRef(null);

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
            
            // Start session monitoring
            startSessionMonitoring();
            
            return { success: true, data };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login gagal';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Logout user dan revoke token
     */
    const logout = useCallback(async () => {
        setIsLoading(true);
        
        try {
            // Panggil API logout untuk revoke token
            if (tokenManager.getToken()) {
                await apiClient.post('/logout');
            }
        } catch (err) {
            // Ignore error, tetap clear local storage
            console.error('Logout API error:', err);
        } finally {
            // Clear token dan state
            tokenManager.clearToken();
            setUser(null);
            setIsAuthenticated(false);
            setIsSessionTimeout(false);
            
            // Stop session monitoring
            stopSessionMonitoring();
            
            setIsLoading(false);
        }
    }, []);

    /**
     * Check session status secara manual
     */
    const checkSession = useCallback(async () => {
        // Jika tidak ada token, user tidak authenticated
        if (!tokenManager.getToken()) {
            setIsAuthenticated(false);
            setUser(null);
            return;
        }
        
        // Cek apakah token expired
        if (tokenManager.isTokenExpired()) {
            // Token expired, trigger session timeout
            handleSessionTimeout();
            return;
        }
        
        // Coba fetch current user untuk validasi token
        try {
            const response = await apiClient.get('/me');
            if (response.data.success) {
                setUser(response.data.data.user);
                setIsAuthenticated(true);
            }
        } catch (err) {
            // Jika 401, token invalid atau expired
            if (err.response?.status === 401) {
                handleSessionTimeout();
            }
        }
    }, []);

    /**
     * Handle session timeout
     */
    const handleSessionTimeout = useCallback(() => {
        tokenManager.clearToken();
        setUser(null);
        setIsAuthenticated(false);
        setIsSessionTimeout(true);
        stopSessionMonitoring();
    }, []);

    /**
     * Handle general auth error
     */
    const handleAuthError = useCallback(() => {
        tokenManager.clearToken();
        setUser(null);
        setIsAuthenticated(false);
        stopSessionMonitoring();
    }, []);

    /**
     * Start session monitoring (check setiap 30 detik)
     */
    const startSessionMonitoring = useCallback(() => {
        // Hentikan interval yang sedang berjalan
        stopSessionMonitoring();
        
        // Buat interval baru untuk check session setiap 30 detik
        sessionCheckIntervalRef.current = setInterval(() => {
            // Cek apakah token expired
            if (tokenManager.isTokenExpired()) {
                handleSessionTimeout();
            }
        }, 30000); // 30 detik
    }, [handleSessionTimeout]);

    /**
     * Stop session monitoring
     */
    const stopSessionMonitoring = useCallback(() => {
        if (sessionCheckIntervalRef.current) {
            clearInterval(sessionCheckIntervalRef.current);
            sessionCheckIntervalRef.current = null;
        }
    }, []);

    /**
     * Reset session timeout state (setelah login ulang)
     */
    const resetSessionTimeout = useCallback(() => {
        setIsSessionTimeout(false);
    }, []);

    // Effect: Listen untuk event session timeout dan auth error dari axios interceptor
    useEffect(() => {
        const handleSessionTimeoutEvent = () => {
            handleSessionTimeout();
        };
        const handleAuthErrorEvent = () => {
            handleAuthError();
        };
        
        window.addEventListener('session-timeout', handleSessionTimeoutEvent);
        window.addEventListener('auth-error', handleAuthErrorEvent);
        
        return () => {
            window.removeEventListener('session-timeout', handleSessionTimeoutEvent);
            window.removeEventListener('auth-error', handleAuthErrorEvent);
        };
    }, [handleSessionTimeout, handleAuthError]);

    // Effect: Start session monitoring saat component mount jika sudah authenticated
    useEffect(() => {
        if (isAuthenticated && !sessionCheckIntervalRef.current) {
            startSessionMonitoring();
        }
        
        // Cleanup saat unmount
        return () => {
            stopSessionMonitoring();
        };
    }, [isAuthenticated, startSessionMonitoring, stopSessionMonitoring]);

    // Effect: Check session saat mount (untuk restore session)
    useEffect(() => {
        if (tokenManager.getToken() && !user) {
            checkSession();
        }
    }, [checkSession, user]);

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