import React from "react";
import { Bell } from "lucide-react";

export default function Header({
  user,
  title,          // 👈 TERIMA TITLE
  showBell = true,
}) {

  // Get photo URL
  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith("http")) return photoPath;
    return `/storage/${photoPath}`;
  };

  const photoUrl = getPhotoUrl(user?.profile_photo);
  const initialLetter = user?.name?.charAt(0);

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">

      {/* JUDUL DINAMIS */}
      <h1 className="text-xl font-semibold">
        {title || "Dokumentasi Kerja"}
      </h1>

      <div className="flex items-center gap-4">

        {/* Bell */}
        {showBell && (
          <Bell size={20} className="text-gray-600" />
        )}

        {/* USER */}
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">

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