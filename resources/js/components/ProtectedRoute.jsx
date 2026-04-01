import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import tokenManager from '../utils/tokenManager';

/**
 * ProtectedRoute Component
 * 
 * Wrapper component untuk melindungi route yang memerlukan autentikasi.
 * Redirect ke halaman login jika user tidak terautentikasi atau token expired.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.redirectTo - Path redirect jika tidak auth (default: /)
 */
const ProtectedRoute = ({ children, redirectTo = '/' }) => {
    const location = useLocation();

    const isAuthenticated = tokenManager.isAuthenticated();

    // Jika tidak terautentikasi, redirect ke login dengan state
    if (!isAuthenticated) {
        return (
            <Navigate
                to={redirectTo}
                state={{ from: location.pathname }}
                replace
            />
        );
    }

    // Jika terautentikasi, render children
    return children;
};

export default ProtectedRoute;