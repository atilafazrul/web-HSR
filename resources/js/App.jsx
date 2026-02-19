import React, { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user dari localStorage saat pertama kali buka
    useEffect(() => {

        const savedUser = localStorage.getItem("user");

        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);

                // Validasi role
                if (
                    parsedUser.role === "super_admin" ||
                    parsedUser.role === "admin"
                ) {
                    setUser(parsedUser);
                } else {
                    localStorage.removeItem("user");
                }

            } catch (error) {
                console.error("Error parsing user:", error);
                localStorage.removeItem("user");
            }
        }

        setLoading(false);

    }, []);

    // Saat login berhasil
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

    // Loading state
    if (loading) {
        return <div style={{ padding: 40 }}>Loading...</div>;
    }

    // Jika belum login
    if (!user) {
        return <Login setUser={handleSetUser} />;
    }

    // =========================
    // ROLE BASED RENDERING
    // =========================

    return user.role === "super_admin" ? (
        <SuperAdminDashboard
            user={user}
            logout={handleLogout}
        />
    ) : (
        <AdminDashboard
            user={user}
            logout={handleLogout}
        />
    );

}
