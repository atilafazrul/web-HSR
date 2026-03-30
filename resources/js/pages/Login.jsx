import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Login({ setUser, login, isLoading }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const divisions = ["IT", "SERVICE", "KONTRAKTOR", "SALES", "LOGISTIK", "PURCHASING"];
  const [currentDivision, setCurrentDivision] = useState(0);
  const [animate, setAnimate] = useState(true);


  /* ================= ANIMATION ================= */
  useEffect(() => {

    const interval = setInterval(() => {

      setAnimate(false);

      setTimeout(() => {
        setCurrentDivision(prev => (prev + 1) % divisions.length);
        setAnimate(true);
      }, 400);

    }, 2500);

    return () => clearInterval(interval);

  }, []); // ⚠️ DEPENDENCY TETAP


  /* ================= LOGIN ================= */
  const handleLogin = async (e) => {

    e.preventDefault();

    if (isLoading) return;

    const result = await login({ email, password });

    if (result.success) {
      // Kirim ke App.jsx
      setUser(result.data.user);
    } else {
      alert(result.error || "Login gagal");
      setPassword("");
    }
  };


  /* ================= UI ================= */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">

      <h1 className="text-4xl font-semibold mb-6 text-center">
        Management System
      </h1>


      {/* DIVISION TEXT */}
      <div className="w-[320px] mb-8">

        <div className="flex items-center gap-2 text-lg font-medium">

          <span>Login Sesuai Divisi :</span>

          <div className="relative w-[150px] h-6 overflow-hidden">

            <span
              className={`absolute left-0 transition-all duration-500 ${animate
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
            <label>Email</label>

            <input
              type="email"
              className="w-full mt-1 px-4 py-2 border rounded-lg"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>


          <div>
            <label>Password</label>

            <input
              type="password"
              className="w-full mt-1 px-4 py-2 border rounded-lg"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>



          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : "LOGIN"}
          </button>

        </form>

      </div>

    </div>
  );
}