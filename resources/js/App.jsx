import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* ================= PAGES ================= */
import Login from "./pages/Login.jsx";

import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import ITPage from "./pages/ITPage.jsx";
import ServicePage from "./pages/ServicePage.jsx";
import KontraktorPage from "./pages/KontraktorPage.jsx";

import FotoProjekPage from "./pages/FotoProjekPage.jsx";

export default function App() {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  /* ================= LOAD USER ================= */
  useEffect(() => {

    const savedUser = localStorage.getItem("user");

    if (savedUser) {

      try {

        const parsedUser = JSON.parse(savedUser);

        if (
          ["super_admin", "admin", "it", "service", "kontraktor"]
            .includes(parsedUser.role)
        ) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem("user");
        }

      } catch {
        localStorage.removeItem("user");
      }
    }

    setLoading(false);

  }, []);


  /* ================= SET USER ================= */
  const handleSetUser = (userData) => {

    if (
      ["super_admin", "admin", "it", "service", "kontraktor"]
        .includes(userData.role)
    ) {

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

    } else {

      alert("Role tidak valid");

    }

  };


  /* ================= LOGOUT ================= */
  const handleLogout = () => {

    setUser(null);
    localStorage.clear();

  };


  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading...
      </div>
    );
  }


  return (
    <Routes>

      {/* ================= LOGIN ================= */}
      <Route
        path="/"
        element={
          !user ? (
            <Login setUser={handleSetUser} />
          ) : (
            <Navigate
              to={
                user.role === "super_admin"
                  ? "/super_admin/dashboard"
                  : user.role === "admin"
                  ? "/admin/dashboard"
                  : user.role === "it"
                  ? "/it/dashboard"
                  : user.role === "service"
                  ? "/service/dashboard"
                  : user.role === "kontraktor"
                  ? "/kontraktor/dashboard"
                  : "/"
              }
              replace
            />
          )
        }
      />


      {/* ================= SUPER ADMIN ================= */}
      <Route
        path="/super_admin/*"
        element={
          user?.role === "super_admin"
            ? <SuperAdminDashboard user={user} logout={handleLogout} />
            : <Navigate to="/" replace />
        }
      />


      {/* ================= ADMIN ================= */}
      <Route
        path="/admin/*"
        element={
          user?.role === "admin"
            ? <AdminDashboard user={user} logout={handleLogout} />
            : <Navigate to="/" replace />
        }
      />


      {/* ================= IT ================= */}
      <Route
        path="/it/*"
        element={
          user?.role === "it"
            ? <ITPage user={user} logout={handleLogout} />
            : <Navigate to="/" replace />
        }
      />


      {/* ================= SERVICE ================= */}
      <Route
        path="/service/*"
        element={
          user?.role === "service"
            ? <ServicePage user={user} logout={handleLogout} />
            : <Navigate to="/" replace />
        }
      />


      {/* ================= KONTRAKTOR ================= */}
      <Route
        path="/kontraktor/*"
        element={
          user?.role === "kontraktor"
            ? <KontraktorPage user={user} logout={handleLogout} />
            : <Navigate to="/" replace />
        }
      />


      {/* ================= FOTO (GLOBAL) ================= */}
      <Route
        path="/projek-kerja/foto/:id"
        element={
          user
            ? <FotoProjekPage />
            : <Navigate to="/" replace />
        }
      />


      {/* ================= FALLBACK ================= */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}