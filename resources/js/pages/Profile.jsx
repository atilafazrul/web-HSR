import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  X,
  Camera,
  Trash2,
  LayoutDashboard,
  Folder,
  Wrench,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Monitor,
  Hammer,
  Menu
} from "lucide-react";

export default function Profile({ user, logout, onProfileUpdate, setCurrentPage }) {

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDivisi, setOpenDivisi] = useState(true);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || ""
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    profile_photo: user?.profile_photo || null
  });

  // Cek apakah user super admin (divisi null)
  const isSuperAdmin = user?.role === 'super_admin' || !user?.divisi;

  // Get divisi page untuk navigasi
  const getDivisiPage = (divisiName) => {
    const map = {
      'IT': 'it',
      'SERVICE': 'service',
      'KONTRAKTOR': 'kontraktor',
      'SALES': 'sales'
    };
    return map[divisiName?.toUpperCase()] || 'service';
  };

  // Get icon untuk divisi
  const getDivisiIcon = (divisiName) => {
    const map = {
      'IT': <Monitor size={16} />,
      'SERVICE': <Wrench size={16} />,
      'KONTRAKTOR': <Hammer size={16} />,
      'SALES': <BarChart3 size={16} />
    };
    return map[divisiName?.toUpperCase()] || <Wrench size={16} />;
  };

  // Daftar semua divisi untuk super admin
  const allDivisis = [
    { name: 'IT', icon: <Monitor size={16} /> },
    { name: 'Service', icon: <Wrench size={16} /> },
    { name: 'Kontraktor', icon: <Hammer size={16} /> },
    { name: 'Sales', icon: <BarChart3 size={16} /> }
  ];

  // Load profile data dari server (di background, tanpa blocking UI)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/profile?user_id=${user.id}`);
        const data = await response.json();

        if (data.success) {
          const newData = {
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            address: data.user.address || "",
            profile_photo: data.user.profile_photo || null
          };
          setProfileData(newData);
          setFormData(newData);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleEdit = () => {
    setFormData(profileData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          user_id: user.id,
          ...formData
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfileData(formData);
        setIsEditing(false);

        // Update user data di parent component
        if (onProfileUpdate) {
          onProfileUpdate({
            ...user,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            address: data.user.address
          });
        }

        // Update localStorage
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          localStorage.setItem("user", JSON.stringify({
            ...parsedUser,
            name: data.user.name,
            email: data.user.email
          }));
        }

        alert("Profile berhasil diupdate!");
      } else {
        alert(data.message || "Gagal mengupdate profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Terjadi error server");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar');
      return;
    }

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('photo', file);

      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfileData(prev => ({
          ...prev,
          profile_photo: data.profile_photo
        }));

        if (onProfileUpdate) {
          onProfileUpdate({
            ...user,
            profile_photo: data.profile_photo
          });
        }

        alert('Foto profile berhasil diupdate!');
      } else {
        alert(data.message || 'Gagal mengupload foto');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Terjadi error server');
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto profile?')) return;

    try {
      const response = await fetch('/api/profile/photo', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfileData(prev => ({
          ...prev,
          profile_photo: null
        }));

        if (onProfileUpdate) {
          onProfileUpdate({
            ...user,
            profile_photo: null
          });
        }

        alert('Foto profile berhasil dihapus!');
      } else {
        alert(data.message || 'Gagal menghapus foto');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Terjadi error server');
    }
  };

  // Get photo URL
  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `/storage/${photoPath}`;
  };

  const photoUrl = getPhotoUrl(profileData.profile_photo);
  const initialLetter = profileData.name?.charAt(0) || user?.name?.charAt(0);

  // SidebarItem Component
  const SidebarItem = ({ icon, text, active }) => (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
    ${active ? "bg-blue-600" : "hover:bg-slate-800"}`}>
      {icon}
      {text}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f4f6fb] relative">
      {/* Input file tersembunyi */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed z-40 top-0 left-0 h-full
        w-72 bg-gradient-to-b from-[#0f172a] to-black text-white
        flex flex-col justify-between p-6 overflow-y-auto
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div>
          <div className="hidden lg:flex justify-center mb-10">
            <img
              src="/images/LOGO HSR.png"
              alt="HSR Logo"
              className="h-14 object-contain"
            />
          </div>

          <div className="space-y-2">
            <div onClick={() => setCurrentPage && setCurrentPage("dashboard")}>
              <SidebarItem
                icon={<LayoutDashboard size={18} />}
                text="Dashboard"
                active={false}
              />
            </div>

            {/* SECTION DIVISI */}
            {!isSuperAdmin ? (
              // ADMIN biasa - hanya tampilkan divisi sendiri
              <>
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-lg">
                  <Folder size={18} />
                  Divisi
                </div>
                <div className="ml-6">
                  <div onClick={() => setCurrentPage && setCurrentPage(getDivisiPage(user?.divisi))}>
                    <SidebarItem
                      icon={getDivisiIcon(user?.divisi)}
                      text={user?.divisi}
                      active={false}
                    />
                  </div>
                </div>
              </>
            ) : (
              // SUPER ADMIN - tampilkan semua divisi dengan dropdown
              <>
                <div
                  className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-slate-800 cursor-pointer transition"
                  onClick={() => setOpenDivisi(!openDivisi)}
                >
                  <div className="flex items-center gap-3">
                    <Folder size={18} />
                    Divisi
                  </div>
                  {openDivisi ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>

                {openDivisi && (
                  <div className="ml-6 space-y-1 text-sm">
                    {allDivisis.map((divisi) => (
                      <div
                        key={divisi.name}
                        onClick={() => setCurrentPage && setCurrentPage(getDivisiPage(divisi.name))}
                      >
                        <SidebarItem
                          icon={divisi.icon}
                          text={divisi.name}
                          active={false}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <SidebarItem
              icon={<User size={18} />}
              text="Profile"
              active={true}
            />
          </div>
        </div>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 py-3 rounded-xl font-medium shadow-lg transition"
        >
          Logout
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-72">
        {/* HEADER */}
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Menu
              size={22}
              className="cursor-pointer lg:hidden"
              onClick={() => setSidebarOpen(true)}
            />
            <h1 className="text-xl font-semibold">Profile</h1>
          </div>

          <div className="flex items-center gap-4">
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
                {profileData.name || user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Profile Saya</h2>
            <p className="text-gray-500 mb-10">
              Kelola informasi profil Anda
            </p>

            {/* PROFILE CARD */}
            <div className="bg-white rounded-3xl shadow-lg p-8">
              {/* AVATAR SECTION */}
              <div className="flex flex-col items-center mb-10">
                <div className="relative">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      {initialLetter}
                    </div>
                  )}

                  {/* Tombol Upload Foto */}
                  <button
                    onClick={handlePhotoClick}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    title="Upload foto"
                  >
                    {uploadingPhoto ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={18} />
                    )}
                  </button>

                  {/* Tombol Hapus Foto (hanya jika ada foto) */}
                  {photoUrl && !uploadingPhoto && (
                    <button
                      onClick={handleDeletePhoto}
                      className="absolute bottom-0 left-0 bg-red-500 text-white p-2.5 rounded-full hover:bg-red-600 transition shadow-lg"
                      title="Hapus foto"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <h3 className="mt-4 text-xl font-semibold">
                  {profileData.name || user?.name}
                </h3>

                <span className="text-gray-500 capitalize">
                  {user?.role?.replace("_", " ")} • {user?.divisi}
                </span>
              </div>

              {/* FORM FIELDS */}
              <div className="space-y-6">
                {/* NAME */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                    <User size={20} />
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>

                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan nama lengkap"
                      />
                    ) : (
                      <p className="mt-2 text-gray-900 font-medium">
                        {profileData.name || "-"}
                      </p>
                    )}
                  </div>
                </div>

                {/* EMAIL */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
                    <Mail size={20} />
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">Email</label>

                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan email"
                      />
                    ) : (
                      <p className="mt-2 text-gray-900 font-medium">
                        {profileData.email || "-"}
                      </p>
                    )}
                  </div>
                </div>

                {/* PHONE */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                    <Phone size={20} />
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">Nomor HP</label>

                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan nomor HP"
                      />
                    ) : (
                      <p className="mt-2 text-gray-900 font-medium">
                        {profileData.phone || "-"}
                      </p>
                    )}
                  </div>
                </div>

                {/* ADDRESS */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 flex-shrink-0 mt-1">
                    <MapPin size={20} />
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">Alamat</label>

                    {isEditing ? (
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        rows={3}
                        className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Masukkan alamat lengkap"
                      />
                    ) : (
                      <p className="mt-2 text-gray-900 font-medium">
                        {profileData.address || "-"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-10 pt-6 border-t flex justify-end gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-2"
                    >
                      <X size={18} />
                      Batal
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={18} />
                      {loading ? "Menyimpan..." : "Simpan"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="px-6 py-3 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Edit2 size={18} />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
