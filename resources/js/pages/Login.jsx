import React, { useState, useEffect } from "react";
import { Lock, Mail, Shield, Zap, Users, TrendingUp } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";

export default function Login({ login, isLoading }) {
  const { language, setLanguage, t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
  // Cek flag untuk mencegah infinite redirect loop
  const REDIRECTED_TO_LOGIN = 'redirected_to_login';

  const handleLogin = async (e) => {

    e.preventDefault();

    // Cek flag infinite redirect loop
    if (localStorage.getItem(REDIRECTED_TO_LOGIN)) {
      alert(t("tooManyRedirect", "Too many redirects. Please try again."));
      return;
    }

    if (isLoading) return;

    const result = await login({ email, password });

    if (result.success) {
      // User sudah otomatis di-set oleh useAuth.login()
    } else {
      alert(result.error || t("loginFailed", "Login failed"));
      setPassword("");
    }
  };


  /* ================= UI ================= */
  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden relative">

      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Left Section - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 p-12 relative z-10">
        <div className="max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <img
              src="/images/LOGO HSR.png"
              alt="HSR Logo"
              className="h-20 object-contain"
            />
            <p className="text-gray-500 text-lg">Enterprise Management System</p>
          </div>

          {/* Hero Text */}
          <h2 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
            Streamline Your Business Operations
          </h2>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Comprehensive management solution for all your business divisions. Manage projects, track expenses, and optimize workflows in one powerful platform.
          </p>

          {/* Feature Cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Secure Access</h3>
                <p className="text-sm text-gray-500">Enterprise-grade security with role-based access</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Zap size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Lightning Fast</h3>
                <p className="text-sm text-gray-500">Optimized performance for seamless experience</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Data Analytics</h3>
                <p className="text-sm text-gray-500">Real-time insights and reporting tools</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-8 pt-8 border-t border-gray-200">
            <div>
              <div className="text-2xl font-bold text-blue-600">6+</div>
              <div className="text-sm text-gray-500">Divisions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">24/7</div>
              <div className="text-sm text-gray-500">Support</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 p-8 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <img
              src="/images/LOGO HSR.png"
              alt="HSR Logo"
              className="h-20 object-contain"
            />
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/50">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-end mb-4">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{t("language", "Language")}</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="id">Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </label>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                {t("welcomeBack", "Welcome Back")}
              </h2>
              <p className="text-gray-500">
                {t("signInSubtitle", "Sign in to access your dashboard")}
              </p>
            </div>

            {/* Division Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Users size={16} />
                  <span>{t("activeDivision", "Active Division:")}</span>
                </div>
                <div className="flex items-center justify-center min-w-[100px]">
                  <span
                    className={`text-blue-700 font-bold tracking-widest text-sm transition-all duration-500 ${animate
                        ? "opacity-100"
                        : "opacity-0"
                      }`}
                  >
                    {divisions[currentDivision]}
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("emailAddress", "Email Address")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-gray-50/50 focus:bg-white"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder={t("emailPlaceholder", "Enter your email")}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("password", "Password")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-gray-50/50 focus:bg-white"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder={t("passwordPlaceholder", "Enter your password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-gray-600">{t("rememberMe", "Remember me")}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t("signingIn", "Signing in...")}
                  </span>
                ) : (
                  t("signIn", "Sign In")
                )}
              </button>

            </form>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>{t("needHelp", "Need help? Contact your system administrator")}</p>
            </div>

          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield size={14} />
            <span>{t("securedBadge", "Secured with enterprise-grade encryption")}</span>
          </div>

        </div>
      </div>

    </div>
  );
}
