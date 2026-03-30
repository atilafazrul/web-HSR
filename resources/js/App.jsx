import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

/* ================= HOOKS ================= */
import { useAuth } from "./hooks/useAuth";

/* ================= COMPONENTS ================= */
import SessionTimeoutModal from "./components/SessionTimeoutModal.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

/* ================= PAGES ================= */
import Login from "./pages/Login.jsx";

import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import ITPage from "./pages/ITPage.jsx";
import ServicePage from "./pages/ServicePage.jsx";
import KontraktorPage from "./pages/KontraktorPage.jsx";

import FotoProjekPage from "./pages/FotoProjekPage.jsx";
import LogistikPage from "./pages/LogistikPage.jsx";
import PurchasingPage from "./pages/PurchasingPage.jsx";

export default function App() {

  const navigate = useNavigate();
  const { 
    user, 
    isAuthenticated, 
    login,
    isLoading, 
    isSessionTimeout, 
    logout, 
    resetSessionTimeout 
  } = useAuth();
  
  const [appUser, setAppUser] = useState(null);

  // Sync user dari useAuth ke appUser
  useEffect(() => {
    if (user) {
      setAppUser(user);
    } else {
      setAppUser(null);
    }
  }, [user]);

  // Handle set user dari Login component
  const handleSetUser = (userData) => {
    if (
      ["super_admin", "admin", "it", "service", "kontraktor", "sales", "logistik", "purchasing"]
        .includes(userData.role)
    ) {
      setAppUser(userData);
    } else {
      alert("Role tidak valid");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setAppUser(null);
  };

  // Handle redirect ke login saat session timeout
  const handleLoginRedirect = () => {
    resetSessionTimeout();
    navigate('/');
  };

  // Get redirect path berdasarkan role
  const getRoleRedirectPath = (role) => {
    const paths = {
      super_admin: "/super_admin/dashboard",
      admin: "/admin/dashboard",
      it: "/it/dashboard",
      service: "/service/dashboard",
      kontraktor: "/kontraktor/dashboard",
      sales: "/sales/dashboard",
      logistik: "/logistik/dashboard",
      purchasing: "/purchasing/dashboard",
    };
    return paths[role] || "/";
  };

  if (isLoading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/"
          element={
            !isAuthenticated || !appUser ? (
              <Login 
                setUser={handleSetUser} 
                login={login} 
                isLoading={isLoading} 
              />
            ) : (
              <Navigate to={getRoleRedirectPath(appUser.role)} replace />
            )
          }
        />

        {/* SUPER ADMIN */}
        <Route
          path="/super_admin/*"
          element={
            <ProtectedRoute>
              {appUser?.role === "super_admin" ? (
                <SuperAdminDashboard user={appUser} logout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              {appUser?.role === "admin" ? (
                <AdminDashboard user={appUser} logout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* IT */}
        <Route
          path="/it/*"
          element={
            <ProtectedRoute>
              {appUser?.role === "it" ? (
                <ITPage user={appUser} logout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* SERVICE */}
        <Route
          path="/service/*"
          element={
            <ProtectedRoute>
              {appUser?.role === "service" ? (
                <ServicePage user={appUser} logout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* KONTRAKTOR */}
        <Route
          path="/kontraktor/*"
          element={
            <ProtectedRoute>
              {appUser?.role === "kontraktor" ? (
                <KontraktorPage user={appUser} logout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* LOGISTIK */}
        <Route
          path="/logistik/*"
          element={
            <ProtectedRoute>
              {appUser?.role === "logistik" ? (
                <LogistikPage user={appUser} logout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* PURCHASING */}
        <Route
          path="/purchasing/*"
          element={
            <ProtectedRoute>
              {appUser?.role === "purchasing" ? (
                <PurchasingPage user={appUser} logout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* FOTO */}
        <Route
          path="/projek-kerja/foto/:id"
          element={
            <ProtectedRoute>
              <FotoProjekPage />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      {/* Session Timeout Modal */}
      <SessionTimeoutModal 
        isOpen={isSessionTimeout} 
        onLoginRedirect={handleLoginRedirect} 
      />
    </>
  );
}