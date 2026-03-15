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
} from "lucide-react";

export default function Profile({ user, logout, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fileInputRef = useRef(null);

  // ================= FORM DATA =================
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    no_telepon: user?.no_telepon || "",
    alamat: user?.alamat || ""
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    no_telepon: user?.no_telepon || "",
    alamat: user?.alamat || "",
    profile_photo: user?.profile_photo || null
  });

  // ================= FETCH PROFILE =================
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const res = await fetch(`/api/profile?user_id=${user.id}`);
        const data = await res.json();

        if (data.success) {
          const newData = {
            name: data.user.name || "",
            email: data.user.email || "",
            no_telepon: data.user.no_telepon || "",
            alamat: data.user.alamat || data.user.address || "",
            profile_photo: data.user.profile_photo || null
          };
          
          setProfileData(newData);
          setFormData(newData);
        }
      } catch (err) {
        console.error("Error fetch profile:", err);
        setError("Gagal memuat data profile");
      }
    };

    fetchProfile();
  }, [user?.id]);

  // ================= HANDLER =================
  const handleEdit = () => {
    setFormData(profileData);
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ================= SAVE =================
  const handleSave = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        user_id: user.id,
        name: formData.name,
        email: formData.email,
        no_telepon: formData.no_telepon,
        alamat: formData.alamat
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const verifyRes = await fetch(`/api/profile?user_id=${user.id}`);
        const verifyData = await verifyRes.json();
        
        if (verifyData.success) {
          const verifiedData = {
            name: verifyData.user.name || "",
            email: verifyData.user.email || "",
            no_telepon: verifyData.user.no_telepon || "",
            alamat: verifyData.user.alamat || verifyData.user.address || "",
            profile_photo: verifyData.user.profile_photo || null
          };
          
          setProfileData(verifiedData);
          setFormData(verifiedData);
          setIsEditing(false);
          
          setSuccess("Profile berhasil diupdate!");
          
          const saved = localStorage.getItem("user");
          if (saved) {
            localStorage.setItem("user", JSON.stringify({
              ...JSON.parse(saved),
              ...verifiedData
            }));
          }
          
          if (onProfileUpdate) {
            onProfileUpdate({ ...user, ...verifiedData });
          }

          setTimeout(() => setSuccess(null), 3000);
        }
      } else {
        setError(data.message || "Gagal update profile");
      }
    } catch (error) {
      console.error("Error detail:", error);
      setError("Koneksi ke server gagal");
    } finally {
      setLoading(false);
    }
  };

  // ================= PHOTO FUNCTIONS =================
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus gambar");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Max 2MB");
      return;
    }

    setUploadingPhoto(true);
    setError(null);
    setSuccess(null);

    try {
      const fd = new FormData();
      fd.append("user_id", user.id);
      fd.append("photo", file);

      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: fd
      });

      const data = await res.json();

      if (res.ok && data.success) {
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

        setSuccess("Foto berhasil diupdate");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || "Upload gagal");
      }
    } catch {
      setError("Server error");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm("Hapus foto profile?")) return;

    try {
      const res = await fetch("/api/profile/photo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProfileData(prev => ({
          ...prev,
          profile_photo: null
        }));

        if (onProfileUpdate) {
          onProfileUpdate({ ...user, profile_photo: null });
        }

        setSuccess("Foto dihapus");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || "Gagal hapus");
      }
    } catch {
      setError("Server error");
    }
  };

  // ================= PHOTO URL =================
  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `/storage/${path}`;
  };

  const photoUrl = getPhotoUrl(profileData.profile_photo);
  const initial = profileData.name?.charAt(0) || user?.name?.charAt(0) || "U";

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*"
        onChange={handleFileChange}
      />

      <main className="p-6 md:p-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">Profile Saya</h2>
          <p className="text-gray-500 mb-10">Kelola informasi profil Anda</p>

          {/* Alert Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-lg p-8 pt-16">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow"
                  />
                ) : (
                  <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {initial}
                  </div>
                )}

                <button
                  onClick={handlePhotoClick}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                  title="Upload foto"
                >
                  {uploadingPhoto ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}
                </button>

                {photoUrl && !uploadingPhoto && (
                  <button
                    onClick={handleDeletePhoto}
                    className="absolute bottom-0 left-0 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    title="Hapus foto"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <h3 className="mt-4 text-xl font-semibold">{profileData.name}</h3>
              <span className="text-gray-500 capitalize">
                {user?.role?.replace("_", " ")} • {user?.divisi}
              </span>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <Field
                icon={<User size={20} />}
                label="Nama Lengkap"
                editing={isEditing}
                value={formData.name}
                display={profileData.name}
                onChange={(v) => handleChange("name", v)}
              />

              <Field
                icon={<Mail size={20} />}
                label="Email"
                editing={isEditing}
                value={formData.email}
                display={profileData.email}
                onChange={(v) => handleChange("email", v)}
                type="email"
              />

              <Field
                icon={<Phone size={20} />}
                label="Nomor Telepon"
                editing={isEditing}
                value={formData.no_telepon}
                display={profileData.no_telepon}
                onChange={(v) => handleChange("no_telepon", v)}
                type="tel"
              />

              <Field
                icon={<MapPin size={20} />}
                label="Alamat"
                editing={isEditing}
                value={formData.alamat}
                display={profileData.alamat}
                textarea
                onChange={(v) => handleChange("alamat", v)}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-10 pt-6 border-t flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-100 rounded-xl flex gap-2 items-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <X size={18} /> Batal
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl flex gap-2 items-center hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={18} />
                    {loading ? "Menyimpan..." : "Simpan"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl flex gap-2 items-center hover:bg-blue-700 transition-colors"
                >
                  <Edit2 size={18} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ================= FIELD COMPONENT =================
const Field = ({
  icon,
  label,
  editing,
  value,
  display,
  onChange,
  textarea = false,
  type = "text"
}) => (
  <div className="flex items-start gap-4">
    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
      {icon}
    </div>

    <div className="flex-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      {editing ? (
        textarea ? (
          <textarea
            value={value}
            rows={3}
            onChange={(e) => onChange(e.target.value)}
            className="w-full mt-2 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder={`Masukkan ${label.toLowerCase()}`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full mt-2 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder={`Masukkan ${label.toLowerCase()}`}
          />
        )
      ) : (
        <p className="mt-1 font-medium text-gray-900 break-words">
          {display || "-"}
        </p>
      )}
    </div>
  </div>
);