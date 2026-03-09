import React from "react";
import { Bell, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header({
  user,
  showBell = true,
  sidebarExpanded,
  setSidebarExpanded,
  sidebarOpen,
  setSidebarOpen,
}) {

  const navigate = useNavigate();

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

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center relative z-50">

      {/* LEFT SECTION: TOGGLE BUTTON */}
      <div className="flex items-center gap-4">

        {/* TOGGLE SIDEBAR (DESKTOP) */}
        {setSidebarExpanded && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarExpanded ? <Menu size={20} /> : <Menu size={20} />}
          </button>
        )}

        {/* TOGGLE SIDEBAR (MOBILE) */}
        {setSidebarOpen && (
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

      </div>

      <div className="flex items-center gap-4">

        {/* Bell */}
        {showBell && (
          <Bell size={20} className="text-gray-600" />
        )}

        {/* USER */}
        <div
          onDoubleClick={() => navigate(rolePath)}
          className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full cursor-pointer"
        >

          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
              {initialLetter}
            </div>
          )}

          <span className="font-medium hidden sm:block">
            {user?.name}
          </span>

        </div>
      </div>
    </header>
  );
}