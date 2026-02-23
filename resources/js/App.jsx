import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user dari localStorage
    useEffect(() => {

        const savedUser = localStorage.getItem("user");

        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);

                if (
                    parsedUser.role === "super_admin" ||
                    parsedUser.role === "admin"
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

    // Login
    const handleSetUser = (userData) => {

        if (
            userData.role === "super_admin" ||
            userData.role === "admin"
        ) {
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
        } else {
            alert("Role tidak valid");
        }
    };

    // Logout
    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    if (loading) {
        return <div style={{ padding: 40 }}>Loading...</div>;
    }

    return (
        <Routes>

            {/* LOGIN */}
            <Route
                path="/"
                element={
                    !user
                        ? <Login setUser={handleSetUser} />
                        : <Navigate to={`/${user.role}`} />
                }
            />

            {/* SUPER ADMIN */}
            <Route
                path="/super_admin/*"
                element={
                    user?.role === "super_admin"
                        ? <SuperAdminDashboard user={user} logout={handleLogout} />
                        : <Navigate to="/" />
                }
            />

            {/* ADMIN */}
            <Route
                path="/admin/*"
                element={
                    user?.role === "admin"
                        ? <AdminDashboard user={user} logout={handleLogout} />
                        : <Navigate to="/" />
                }
            />

            {/* DEFAULT */}
            <Route path="*" element={<Navigate to="/" />} />

        </Routes>
    );
}