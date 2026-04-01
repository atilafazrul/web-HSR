import React, { useMemo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* ================= HOOKS ================= */
import { useAuth } from "./hooks/useAuth";

/* ================= COMPONENTS ================= */
import SessionTimeoutModal from "./components/SessionTimeoutModal.jsx";

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

  const { 
    user, 
    isAuthenticated, 
    login,
    isLoading, 
    isSessionTimeout, 
    logout, 
    resetSessionTimeout 
  } = useAuth();

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Handle redirect ke login saat session timeout
  const handleLoginRedirect = () => {
    resetSessionTimeout();
    window.location.href = '/';
  };

  // Get redirect path berdasarkan role - memoized untuk hindari re-render
  const roleRedirectPath = useMemo(() => {
    if (!user?.role) return "/";
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
    return paths[user.role] || "/";
  }, [user?.role]);

  // Show loading state
  if (isLoading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  // Not authenticated - show login
  if (!isAuthenticated || !user) {
    return (
      <>
        <Routes>
          <Route path="*" element={<Login login={login} isLoading={isLoading} />} />
        </Routes>
        <SessionTimeoutModal 
          isOpen={isSessionTimeout} 
          onLoginRedirect={handleLoginRedirect} 
        />
      </>
    );
  }

  // Authenticated - show appropriate dashboard based on role
  const role = user.role;

  return (
    <>
      <Routes>
        {/* DEFAULT ROUTE - redirect ke dashboard berdasarkan role */}
        <Route path="/" element={<Navigate to={roleRedirectPath} replace />} />

        {/* SUPER ADMIN ROUTES */}
        {role === "super_admin" && (
          <Route path="/super_admin/*" element={<SuperAdminDashboard user={user} logout={handleLogout} />} />
        )}

        {/* ADMIN ROUTES */}
        {role === "admin" && (
          <Route path="/admin/*" element={<AdminDashboard user={user} logout={handleLogout} />} />
        )}

        {/* IT ROUTES */}
        {role === "it" && (
          <Route path="/it/*" element={<ITPage user={user} logout={handleLogout} />} />
        )}

        {/* SERVICE ROUTES */}
        {role === "service" && (
          <Route path="/service/*" element={<ServicePage user={user} logout={handleLogout} />} />
        )}

        {/* KONTRAKTOR ROUTES */}
        {role === "kontraktor" && (
          <Route path="/kontraktor/*" element={<KontraktorPage user={user} logout={handleLogout} />} />
        )}

        {/* LOGISTIK ROUTES */}
        {role === "logistik" && (
          <Route path="/logistik/*" element={<LogistikPage user={user} logout={handleLogout} />} />
        )}

        {/* PURCHASING ROUTES */}
        {role === "purchasing" && (
          <Route path="/purchasing/*" element={<PurchasingPage user={user} logout={handleLogout} />} />
        )}

        {/* FOTO PROJEK - bisa diakses semua role yang authenticated */}
        <Route
          path="/projek-kerja/foto/:id"
          element={<FotoProjekPage />}
        />

        {/* FALLBACK - redirect ke dashboard */}
        <Route path="*" element={<Navigate to={roleRedirectPath} replace />} />
      </Routes>

      <SessionTimeoutModal 
        isOpen={isSessionTimeout} 
        onLoginRedirect={handleLoginRedirect} 
      />
    </>
  );
}