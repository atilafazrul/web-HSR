/**
 * Token Manager Utility
 * 
 * Mengelola token autentikasi, expiry time, dan status remember me
 * di localStorage dengan aman.
 */

const TOKEN_KEY = 'auth_token';
const EXPIRES_AT_KEY = 'auth_expires_at';
const REMEMBER_ME_KEY = 'auth_remember_me';
const USER_KEY = 'user';

export const tokenManager = {
    /**
     * Simpan token dan data autentikasi
     * @param {string} token - Bearer token
     * @param {string} expiresAt - ISO string waktu expired
     * @param {boolean} rememberMe - Status remember me
     * @param {object} user - Data user
     */
    setToken(token, expiresAt, rememberMe = false, user = null) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(EXPIRES_AT_KEY, expiresAt);
        localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(rememberMe));
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    },

    /**
     * Ambil token
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Ambil waktu expired
     * @returns {string|null}
     */
    getExpiresAt() {
        return localStorage.getItem(EXPIRES_AT_KEY);
    },

    /**
     * Cek status remember me
     * @returns {boolean}
     */
    getRememberMe() {
        const value = localStorage.getItem(REMEMBER_ME_KEY);
        return value ? JSON.parse(value) : false;
    },

    /**
     * Ambil data user
     * @returns {object|null}
     */
    getUser() {
        const value = localStorage.getItem(USER_KEY);
        return value ? JSON.parse(value) : null;
    },

    /**
     * Hapus semua data autentikasi
     */
    clearToken() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRES_AT_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(USER_KEY);
    },

    /**
     * Cek apakah token sudah expired
     * @returns {boolean}
     */
    isTokenExpired() {
        const expiresAt = this.getExpiresAt();
        if (!expiresAt) return true;
        
        return new Date(expiresAt) <= new Date();
    },

    /**
     * Hitung sisa waktu dalam detik
     * @returns {number}
     */
    getTimeRemaining() {
        const expiresAt = this.getExpiresAt();
        if (!expiresAt) return 0;
        
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry - now;
        
        return Math.max(0, Math.floor(diff / 1000));
    },

    /**
     * Format sisa waktu untuk display
     * @returns {string}
     */
    getTimeRemainingFormatted() {
        const seconds = this.getTimeRemaining();
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes} menit ${remainingSeconds} detik`;
        }
        return `${remainingSeconds} detik`;
    },

    /**
     * Cek apakah user terautentikasi
     * @returns {boolean}
     */
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;
        
        return !this.isTokenExpired();
    }
};

export default tokenManager;