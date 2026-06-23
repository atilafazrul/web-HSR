import React, { useEffect, useRef, useState } from "react";
import { Globe, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n/index.jsx";
import NotificationDropdown from "./NotificationDropdown.jsx";

export default function Header({
  user,
  showBell = true,
  sidebarExpanded,
  setSidebarExpanded,
  sidebarOpen,
  setSidebarOpen,
}) {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const mobileLangRef = useRef(null);

  // Get photo URL
  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith("http")) return photoPath;
    return `/storage/${photoPath}`;
  };

  const photoUrl = getPhotoUrl(user?.profile_photo);
  const initialLetter = user?.name?.charAt(0);

  const rolePath =
    user?.role === "super_admin"
      ? "/super_admin/profile"
      : user?.role === "user"
        ? "/user/profile"
        : "/admin/profile";

  const toggleSidebar = () => {
    if (setSidebarExpanded) {
      setSidebarExpanded(!sidebarExpanded);
    }
  };

  const toggleMobileSidebar = () => {
    if (setSidebarOpen) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleProfileClick = () => {
    navigate(rolePath);
  };

  useEffect(() => {
    if (!mobileLangOpen) return;
    const onOutside = (e) => {
      if (mobileLangRef.current && !mobileLangRef.current.contains(e.target)) {
        setMobileLangOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileLangOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileLangOpen]);

  const setLang = (lang) => {
    setLanguage(lang);
    setMobileLangOpen(false);
  };

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center relative z-50">
      {/* LEFT SECTION: TOGGLE BUTTON */}
      <div className="flex items-center gap-4">
        {/* TOGGLE SIDEBAR (DESKTOP) */}
        {setSidebarExpanded && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center p-2 rounded-lg hover:bg-gray-100"
            style={{ minWidth: "44px", minHeight: "44px", touchAction: "manipulation" }}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}

        {/* TOGGLE SIDEBAR (MOBILE) */}
        {setSidebarOpen && (
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100"
            style={{ minWidth: "44px", minHeight: "44px", touchAction: "manipulation" }}
            aria-label="Toggle mobile sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 min-w-0">
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-gray-500">{t("language", "Language")}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="id">Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Mobile language: icon + picker */}
        <div className="relative sm:hidden" ref={mobileLangRef}>
          <button
            type="button"
            onClick={() => setMobileLangOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-gray-100 relative"
            style={{ minWidth: "44px", minHeight: "44px", touchAction: "manipulation" }}
            aria-label={t("language", "Language")}
            aria-expanded={mobileLangOpen}
          >
            <Globe size={20} className="text-gray-600" />
          </button>

          {mobileLangOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-[70]">
              <button
                type="button"
                onClick={() => setLang("id")}
                className={`w-full px-4 py-3 text-sm text-left hover:bg-gray-50 ${
                  language === "id" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"
                }`}
              >
                Indonesia {language === "id" ? "✓" : ""}
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`w-full px-4 py-3 text-sm text-left hover:bg-gray-50 ${
                  language === "en" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"
                }`}
              >
                English {language === "en" ? "✓" : ""}
              </button>
            </div>
          )}
        </div>

        {showBell && user?.id && (
          <NotificationDropdown user={user} />
        )}

        {/* USER - ubah dari onDoubleClick ke onClick */}
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full cursor-pointer hover:bg-gray-200 transition flex-shrink-0 max-w-full"
          style={{ touchAction: "manipulation", minHeight: "44px" }}
          aria-label="Profile"
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              {initialLetter}
            </div>
          )}
          <span className="font-medium hidden sm:block truncate max-w-[100px] md:max-w-[150px] lg:max-w-[200px]">{user?.name}</span>
        </button>
      </div>
    </header>
  );
}