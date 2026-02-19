import React, { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");

        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);

            if (
                parsedUser.role === "super_admin" ||
                parsedUser.role === "admin"
            ) {
                setUser(parsedUser);
            } else {
                localStorage.removeItem("user");
            }
        }

        setLoading(false);
    }, []);

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

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

    if (!user) {
        return <Login setUser={handleSetUser} />;
    }

    if (user.role === "super_admin") {
        return (
            <SuperAdminDashboard
                user={user}
                logout={handleLogout}
            />
        );
    }

    if (user.role === "admin") {
        return (
            <AdminDashboard
                user={user}
                logout={handleLogout}
            />
        );
    }

    handleLogout();
    return <Login setUser={handleSetUser} />;
}
