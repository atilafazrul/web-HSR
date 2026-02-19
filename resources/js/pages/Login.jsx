import React, { useState, useEffect } from "react";

export default function Login({ setUser }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const divisions = ["IT", "SERVICE", "KONTRAKTOR", "SALES"];
    const [currentDivision, setCurrentDivision] = useState(0);
    const [animate, setAnimate] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {

            setAnimate(false);

            setTimeout(() => {
                setCurrentDivision((prev) => (prev + 1) % divisions.length);
                setAnimate(true);
            }, 400);

        }, 2500);

        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (loading) return;

        setLoading(true);

        try {

            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {

                console.log("Login success:", data.user);

                // Simpan user ke state App.jsx
                setUser(data.user);

            } else {

                alert(data.message || "Login gagal");
                setPassword("");

            }

        } catch (error) {

            console.error("Login error:", error);
            alert("Terjadi error server");

        } finally {

            setLoading(false);

        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">

            {/* TITLE */}
            <h1 className="text-4xl font-semibold mb-6 text-center">
                Inspection Preventive Maintenance
            </h1>

            {/* DIVISION TEXT */}
            <div className="w-[320px] mb-8">

                <div className="flex items-center gap-2 text-lg font-medium">
                    <span>Login Sesuai Divisi :</span>

                    <div className="relative w-[150px] h-6 overflow-hidden">

                        <span
                            className={`absolute left-0 transition-all duration-500 ${
                                animate
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 -translate-y-3"
                            } text-pink-600 font-bold tracking-widest`}
                        >
                            {divisions[currentDivision]}
                        </span>

                    </div>
                </div>

            </div>

            {/* LOGIN CARD */}
            <div className="bg-white rounded-2xl shadow-2xl p-10 w-[380px]">

                <div className="flex justify-center mb-6">
                    <img
                        src="/images/LOGO HSR.png"
                        alt="HSR Logo"
                        className="h-16 object-contain"
                    />
                </div>

                <form onSubmit={handleLogin} className="space-y-5">

                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input
                            type="email"
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Password</label>
                        <input
                            type="password"
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 rounded-lg font-semibold text-white transition ${
                            loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-90"
                        }`}
                    >
                        {loading ? "Loading..." : "LOGIN"}
                    </button>

                </form>

            </div>

        </div>
    );
}
