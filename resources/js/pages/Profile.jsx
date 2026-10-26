import React, { useState, useEffect, useRef } from "react";
import api from "../api/axiosConfig";
import tokenManager from "../utils/tokenManager";
import { useI18n } from "../i18n/index.jsx";
import { compressImage } from "../utils/imageCompress";
import {
  User,
  Mail,
  Phone,
  Smartphone,
  Home,
  Edit2,
  Save,
  X,
  Camera,
  Image,
  Trash2,
  FileText,
  Shield,
  Upload,
  CheckCircle,
  AlertCircle,
  Building2,
  GraduationCap,
  Award,
  Eye,
  Briefcase,
  FileSignature,
  FolderOpen,
  ChevronRight,
  LogOut,
  Lock,
  KeyRound,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

export default function Profile({ user, logout, onProfileUpdate }) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const effectiveUserId = user?.id || tokenManager.getUser()?.id;
  const isSuperAdmin = user?.role === "super_admin" || tokenManager.getUser()?.role === "super_admin";

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // State untuk Reset Password
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // State untuk file upload
  const [files, setFiles] = useState({ ktp: null, kk: null, akte: null });
  const [ijazahFiles, setIjazahFiles] = useState([]);
  const [sertifikatFiles, setSertifikatFiles] = useState([]);
  const [previewIjazah, setPreviewIjazah] = useState([]);
  const [previewSertifikat, setPreviewSertifikat] = useState([]);

  // Form Data
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
    profile_photo: user?.profile_photo || null,
    cover_photo: user?.cover_photo || null,
    divisi: user?.divisi || "",
    role: user?.role || "",
    ktp: user?.ktp || null,
    kk: user?.kk || null,
    akte: user?.akte || null,
    ijazah: user?.ijazah || [],
    sertifikat: user?.sertifikat || []
  });

  const getFileName = (file) => {
    if (!file) return '-';
    if (typeof file === 'string') return file.split('/').pop();
    if (Array.isArray(file) && file.length > 0) return getFileName(file[0]);
    return 'File';
  };

  // Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!effectiveUserId) return;
      try {
        let profileUser = null;
        try {
          const res = await api.get(`/profile?user_id=${effectiveUserId}`);
          const data = res.data;
          if (data?.success && data?.user) {
            profileUser = data.user;
          }
        } catch (profileErr) {
          const meRes = await api.get("/me");
          profileUser = meRes.data?.data?.user || null;
        }

        if (profileUser) {
          const newData = {
            name: profileUser.name || "",
            email: profileUser.email || "",
            no_telepon: profileUser.no_telepon || "",
            alamat: profileUser.alamat || profileUser.address || "",
            profile_photo: profileUser.profile_photo || null,
            cover_photo: profileUser.cover_photo || null,
            divisi: profileUser.divisi || "",
            role: profileUser.role || "",
            ktp: profileUser.ktp || null,
            kk: profileUser.kk || null,
            akte: profileUser.akte || null,
            ijazah: profileUser.ijazah || [],
            sertifikat: profileUser.sertifikat || []
          };
          setProfileData(newData);
          setFormData(newData);
        } else {
          setError(tr("Gagal memuat data profile", "Failed to load profile data"));
        }
      } catch (err) {
        const msg = err?.response?.data?.message || tr("Gagal memuat data profile", "Failed to load profile data");
        setError(msg);
      }
    };
    fetchProfile();
  }, [effectiveUserId]);

  // Handlers
  const handleEdit = () => {
    setFormData(profileData);
    setIsEditing(true);
    setFiles({ ktp: null, kk: null, akte: null });
    setIjazahFiles([]);
    setSertifikatFiles([]);
    setPreviewIjazah([]);
    setPreviewSertifikat([]);
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
    setFiles({ ktp: null, kk: null, akte: null });
    setIjazahFiles([]);
    setSertifikatFiles([]);
    setPreviewIjazah([]);
    setPreviewSertifikat([]);
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // Validasi dokumen yang di-upload (sinkron dengan validasi backend di UserController)
  const DOC_MAX_BYTES = 2 * 1024 * 1024; // 2MB
  const ALLOWED_DOC_MIME = ["image/jpeg", "image/png", "application/pdf"];

  const isAllowedDocFile = (file) => {
    if (!file) return false;
    if (ALLOWED_DOC_MIME.includes(file.type)) return true;
    // fallback dari ekstensi (beberapa browser bisa beda nilai file.type)
    const name = (file.name || "").toLowerCase();
    return (
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png") ||
      name.endsWith(".pdf")
    );
  };

  const handleDocFilePick = async (key, file) => {
    if (!file) {
      setFiles(prev => ({ ...prev, [key]: null }));
      return;
    }

    if (!isAllowedDocFile(file)) {
      setError(tr("Format dokumen harus JPG, PNG, atau PDF", "Document format must be JPG, PNG, or PDF"));
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Compress image docs (JPG/PNG) before upload to reduce failures.
    // PDF is left as-is.
    let readyFile = file;
    try {
      readyFile = await compressImage(file);
    } catch {
      readyFile = file;
    }

    if (readyFile.size > DOC_MAX_BYTES) {
      setError(tr("Ukuran dokumen maksimal 2MB", "Maximum document size is 2MB"));
      setTimeout(() => setError(null), 3000);
      return;
    }

    setFiles(prev => ({ ...prev, [key]: readyFile }));
  };

  const handleMultipleFiles = async (files, setFiles, setPreview) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    let firstError = null;

    for (const file of fileArray) {
      if (!file) continue;
      if (!isAllowedDocFile(file)) {
        if (!firstError) firstError = tr("Format dokumen harus JPG, PNG, atau PDF", "Document format must be JPG, PNG, or PDF");
        continue;
      }

      let readyFile = file;
      try {
        readyFile = await compressImage(file);
      } catch {
        readyFile = file;
      }

      if (readyFile.size > DOC_MAX_BYTES) {
        if (!firstError) firstError = tr("Ukuran dokumen maksimal 2MB", "Maximum document size is 2MB");
        continue;
      }

      validFiles.push(readyFile);
    }

    if (firstError) {
      setError(firstError);
      setTimeout(() => setError(null), 3000);
    }

    if (validFiles.length === 0) return;

    setFiles(prev => [...prev, ...validFiles]);
    setPreview(prev => [
      ...prev,
      ...validFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeFile = (index, files, setFiles, preview, setPreview) => {
    if (preview[index]) URL.revokeObjectURL(preview[index]);
    setFiles(files.filter((_, i) => i !== index));
    setPreview(preview.filter((_, i) => i !== index));
  };

  const buildPreviewUrl = (type, index = null) => {
    const token = tokenManager.getToken();
    const params = new URLSearchParams();
    if (index !== null) params.append("index", index);
    if (token) params.append("token", token);

    const query = params.toString();
    return `/api/karyawan/${effectiveUserId}/${type}${query ? `?${query}` : ""}`;
  };

  const previewFile = (type, index = null) => {
    window.open(buildPreviewUrl(type, index), "_blank");
  };

  const handleDeleteExistingFile = async (type, index) => {
    if (!confirm(tr("Yakin mau hapus file ini?", "Are you sure to delete this file?"))) return;
    try {
      const res = await api.post(`/karyawan/${effectiveUserId}/delete-file`, { type, index });
      const data = res.data;
      if (data.success) {
        setSuccess(tr("File berhasil dihapus ✅", "File deleted successfully ✅"));
        const refresh = await api.get(`/profile?user_id=${effectiveUserId}`);
        const result = refresh.data;
        if (result.success) {
          setProfileData({
            name: result.user.name || "",
            email: result.user.email || "",
            no_telepon: result.user.no_telepon || "",
            alamat: result.user.alamat || "",
            profile_photo: result.user.profile_photo || null,
            ktp: result.user.ktp || null,
            kk: result.user.kk || null,
            akte: result.user.akte || null,
            ijazah: result.user.ijazah || [],
            sertifikat: result.user.sertifikat || []
          });
          setFormData({
            name: result.user.name || "",
            email: result.user.email || "",
            no_telepon: result.user.no_telepon || "",
            alamat: result.user.alamat || ""
          });
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(tr("Gagal hapus file", "Failed to delete file"));
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(tr("Error hapus file", "File delete error"));
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("user_id", effectiveUserId);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("no_telepon", formData.no_telepon);
      formDataToSend.append("alamat", formData.alamat);
      formDataToSend.append("_method", "PUT");

      if (files.ktp) formDataToSend.append("ktp", files.ktp);
      if (files.kk) formDataToSend.append("kk", files.kk);
      if (files.akte) formDataToSend.append("akte", files.akte);

      ijazahFiles.forEach((file) => formDataToSend.append(`ijazah[]`, file));
      sertifikatFiles.forEach((file) => formDataToSend.append(`sertifikat[]`, file));

      const res = await api.post(`/karyawan/${effectiveUserId}`, formDataToSend);
      const data = res.data;

      if (res.status === 200 && data.success) {
        const verify = await api.get(`/profile?user_id=${effectiveUserId}`);
        const verifyData = verify.data;
        if (verifyData.success) {
          const verified = {
            name: verifyData.user.name || "",
            email: verifyData.user.email || "",
            no_telepon: verifyData.user.no_telepon || "",
            alamat: verifyData.user.alamat || "",
            profile_photo: verifyData.user.profile_photo || null,
            ktp: verifyData.user.ktp || null,
            kk: verifyData.user.kk || null,
            akte: verifyData.user.akte || null,
            ijazah: verifyData.user.ijazah || [],
            sertifikat: verifyData.user.sertifikat || []
          };
          setProfileData(verified);
          setFormData(verified);
          setIsEditing(false);
          setSuccess(tr("Profile berhasil diupdate! 🎉", "Profile updated successfully! 🎉"));
          if (onProfileUpdate) onProfileUpdate({ ...user, ...verified });
          setTimeout(() => setSuccess(null), 3000);
        }
      } else {
        setError(data.message || tr("Gagal update profile", "Failed to update profile"));
      }
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      if (validationErrors) {
        const messages = Object.values(validationErrors).flat().join(", ");
        setError(messages || tr("Validasi gagal", "Validation failed"));
        setTimeout(() => setError(null), 4000);
      } else {
        setError(error.response?.data?.message || tr("Terjadi kesalahan pada server", "A server error occurred"));
        setTimeout(() => setError(null), 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Photo Handlers
  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError(tr("File harus gambar", "File must be an image"));
    if (file.size > 2 * 1024 * 1024) return setError(tr("Max 2MB", "Max 2MB"));

    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("user_id", effectiveUserId);
      fd.append("photo", file);
      const res = await api.post("/profile/photo", fd);
      const data = res.data;
      if (res.status === 200 && data.success) {
        setProfileData(prev => ({ ...prev, profile_photo: data.profile_photo }));
        if (onProfileUpdate) onProfileUpdate({ ...user, profile_photo: data.profile_photo });
        setSuccess(tr("Foto diupdate! 📸", "Photo updated! 📸"));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || tr("Upload gagal", "Upload failed"));
      }
    } catch {
      setError(tr("Upload gagal", "Upload failed"));
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm(tr("Hapus foto profile?", "Delete profile photo?"))) return;
    try {
      const res = await api.delete("/profile/photo", { data: { user_id: effectiveUserId } });
      const data = res.data;
      if (res.status === 200 && data.success) {
        setProfileData(prev => ({ ...prev, profile_photo: null }));
        if (onProfileUpdate) onProfileUpdate({ ...user, profile_photo: null });
        setSuccess(tr("Foto dihapus", "Photo deleted"));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || tr("Hapus gagal", "Delete failed"));
      }
    } catch {
      setError(tr("Hapus gagal", "Delete failed"));
    }
  };

  // Cover Photo Handlers
  const handleCoverClick = () => coverInputRef.current?.click();

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(tr("File harus berupa gambar", "File must be an image"));
      return;
    }

    setUploadingCover(true);
    try {
      let readyFile = file;
      try {
        readyFile = await compressImage(file, { quality: 0.85, maxWidth: 1920 });
      } catch {
        readyFile = file;
      }

      if (readyFile.size > 6 * 1024 * 1024) {
        setError(tr("Ukuran file background maksimal 6MB", "Maximum background size is 6MB"));
        return;
      }

      const fd = new FormData();
      fd.append("user_id", effectiveUserId);
      fd.append("cover", readyFile);
      const res = await api.post("/profile/cover", fd);
      const data = res.data;
      if (res.status === 200 && data.success) {
        setProfileData(prev => ({ ...prev, cover_photo: data.cover_photo }));
        if (onProfileUpdate) onProfileUpdate({ ...user, cover_photo: data.cover_photo });
        setSuccess(tr("Background profil berhasil diperbarui! 🎨", "Profile background updated! 🎨"));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || tr("Gagal mengupload background", "Failed to upload background"));
      }
    } catch (err) {
      setError(err?.response?.data?.message || tr("Gagal mengupload background", "Failed to upload background"));
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleDeleteCover = async () => {
    if (!confirm(tr("Kembalikan background cover ke tampilan default divisi?", "Reset cover background to division default?"))) return;
    try {
      setUploadingCover(true);
      const res = await api.delete("/profile/cover", { data: { user_id: effectiveUserId } });
      const data = res.data;
      if (res.status === 200 && data.success) {
        setProfileData(prev => ({ ...prev, cover_photo: null }));
        if (onProfileUpdate) onProfileUpdate({ ...user, cover_photo: null });
        setSuccess(tr("Background kembali ke default divisi", "Background reset to division default"));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || tr("Gagal menghapus background", "Failed to delete background"));
      }
    } catch (err) {
      setError(err?.response?.data?.message || tr("Gagal menghapus background", "Failed to delete background"));
    } finally {
      setUploadingCover(false);
    }
  };

  const getDivisiImage = (divisi) => {
    const imageMap = {
      "IT": "/images/IT Card.png",
      "Service": "/images/Card Service.png",
      "Sales": "/images/Card Sales.png",
      "Kontraktor": "/images/Kontraktor Card.png",
      "Logistik": "/images/logistik card.png",
      "Purchasing": "/images/Purchasing Card.png",
      "SIPLAH": "/images/Purchasing Card.png",
    };
    return imageMap[divisi] || "/images/IT Card.png";
  };

  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `/storage/${path}`;
  };

  const photoUrl = getPhotoUrl(profileData.profile_photo);
  const currentCoverUrl = profileData.cover_photo
    ? getPhotoUrl(profileData.cover_photo)
    : getDivisiImage(profileData.divisi || user?.divisi);
  const initial = profileData.name?.charAt(0) || user?.name?.charAt(0) || "U";

  const totalDocuments = (profileData.ktp ? 1 : 0) + (profileData.kk ? 1 : 0) + (profileData.akte ? 1 : 0) +
    (profileData.ijazah?.length || 0) + (profileData.sertifikat?.length || 0);

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!isSuperAdmin && !passwordData.current_password) {
      setPasswordError(tr("Password saat ini wajib diisi", "Current password is required"));
      return;
    }

    if (!passwordData.password) {
      setPasswordError(tr("Password baru wajib diisi", "New password is required"));
      return;
    }

    if (passwordData.password.length < 6) {
      setPasswordError(tr("Password baru minimal 6 karakter", "New password must be at least 6 characters"));
      return;
    }

    if (passwordData.password !== passwordData.password_confirmation) {
      setPasswordError(tr("Konfirmasi password baru tidak cocok", "Password confirmation does not match"));
      return;
    }

    try {
      setUpdatingPassword(true);
      const payload = {
        user_id: effectiveUserId,
        password: passwordData.password,
        password_confirmation: passwordData.password_confirmation
      };
      if (passwordData.current_password) {
        payload.current_password = passwordData.current_password;
      }

      const res = await api.put("/profile/password", payload);
      if (res.data?.success) {
        setPasswordSuccess(res.data.message || tr("Password berhasil diperbarui! 🎉", "Password updated successfully! 🎉"));
        setPasswordData({
          current_password: "",
          password: "",
          password_confirmation: ""
        });
      } else {
        setPasswordError(res.data?.message || tr("Gagal memperbarui password", "Failed to update password"));
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.password?.[0] || tr("Gagal memperbarui password", "Failed to update password");
      setPasswordError(msg);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const tabs = [
    { id: "personal", label: tr("Informasi Pribadi", "Personal Information"), icon: <User size={16} /> },
    { id: "documents", label: tr("Dokumen", "Documents"), icon: <FileText size={16} />, badge: totalDocuments },
    { id: "security", label: tr("Reset Password", "Reset Password"), icon: <KeyRound size={16} /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange} />
      <input ref={coverInputRef} type="file" hidden accept="image/*" onChange={handleCoverChange} />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 md:py-12">

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-700 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X size={18} />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-xl flex items-center gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
            <p className="text-green-700 flex-1">{success}</p>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Cover & Profile Header — gaya card divisi */}
          <div className="relative overflow-hidden group">
            {/* Background Cover Image (Default Divisi atau Custom Upload) */}
            <img
              src={currentCoverUrl}
              alt="Cover Background"
              className="absolute inset-0 h-full w-full object-cover object-[center_45%] transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark Gradient Overlay - gaya DivisiCard agar teks & badge glass kontras dan terbaca jelas */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-900/35" />
            <div className="pointer-events-none absolute inset-0 backdrop-blur-[0.5px]" />

            {/* Quick Action Buttons: Ganti Background Cover & Reset */}
            <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCoverClick}
                disabled={uploadingCover}
                className="inline-flex items-center gap-2 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md border border-white/30 transition duration-200"
                title={tr("Ganti gambar background cover", "Change cover background image")}
              >
                {uploadingCover ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Image size={14} className="text-white" />
                )}
                <span>{uploadingCover ? tr("Mengunggah...", "Uploading...") : tr("Ganti Background", "Change Background")}</span>
              </button>

              {profileData.cover_photo && (
                <button
                  type="button"
                  onClick={handleDeleteCover}
                  disabled={uploadingCover}
                  className="inline-flex items-center justify-center rounded-full bg-rose-600/30 hover:bg-rose-600/60 active:scale-95 p-1.5 text-white shadow-lg backdrop-blur-md border border-white/25 transition duration-200"
                  title={tr("Kembalikan background ke default divisi", "Reset background to division default")}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative px-4 pb-8 pt-10 sm:px-6 md:px-8">
              <div className="relative flex flex-col items-center gap-4 md:flex-row md:items-end">
                <div className="relative shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt={profileData.name} className="h-24 w-24 rounded-full border-4 border-white/90 object-cover shadow-2xl md:h-28 md:w-28" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/90 bg-white/20 text-3xl font-bold text-white shadow-2xl backdrop-blur-md md:h-28 md:w-28">
                      {initial}
                    </div>
                  )}
                  <button
                    onClick={handlePhotoClick}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 rounded-full bg-white/25 p-1.5 shadow-md backdrop-blur-md border border-white/30 transition hover:bg-white/40 active:scale-95"
                    title={tr("Ganti Foto Profil", "Change Profile Photo")}
                  >
                    {uploadingPhoto ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Camera size={14} className="text-white" />
                    )}
                  </button>
                  {photoUrl && !uploadingPhoto && (
                    <button
                      onClick={handleDeletePhoto}
                      className="absolute bottom-0 left-0 rounded-full bg-rose-500/80 p-1.5 shadow-md backdrop-blur-md border border-white/20 transition hover:bg-rose-600 active:scale-95"
                      title={tr("Hapus Foto Profil", "Delete Profile Photo")}
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  )}
                </div>

                <div className="w-full min-w-0 flex-1 text-center md:text-left">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">{profileData.name || user?.name}</h2>
                  <div className="mt-2.5 flex flex-wrap justify-center gap-2 md:justify-start">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md border border-white/20">
                      <Briefcase size={12} />
                      {String(profileData.role || user?.role || "Employee").replace(/_/g, " ")}
                    </span>
                    {(profileData.divisi || user?.divisi) && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md border border-white/20">
                        <Building2 size={12} />
                        {profileData.divisi || user?.divisi}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md border border-white/20">
                      <FileText size={12} />
                      {totalDocuments} {tr("Dokumen", "Documents")}
                    </span>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={handleEdit}
                        className="inline-flex flex-1 md:flex-initial items-center justify-center gap-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/25 px-5 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition active:scale-95"
                      >
                        <Edit2 size={16} />
                        {tr("Edit Profile", "Edit Profile")}
                      </button>
                      <button
                        onClick={() => setActiveTab("security")}
                        className={`inline-flex flex-1 md:flex-initial items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold backdrop-blur-md border transition active:scale-95 ${
                          activeTab === "security"
                            ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/40"
                            : "bg-white/20 hover:bg-white/30 border-white/25 text-white shadow-lg"
                        }`}
                      >
                        <KeyRound size={16} />
                        {tr("Reset Password", "Reset Password")}
                      </button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 md:flex w-full md:w-auto">
                      <button onClick={handleCancel} className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition">
                        <X size={16} /> {tr("Batal", "Cancel")}
                      </button>
                      <button onClick={handleSave} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-400 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition disabled:opacity-60 shadow-lg shadow-emerald-500/30">
                        <Save size={16} /> {loading ? tr("Menyimpan...", "Saving...") : tr("Simpan", "Save")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 px-4 md:px-8">
            <div className="flex gap-6 overflow-x-auto sidebar-no-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${activeTab === tab.id
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {activeTab === "personal" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField
                  icon={<User size={18} />}
                  label={tr("Nama Lengkap", "Full Name")}
                  value={formData.name}
                  display={profileData.name}
                  editing={isEditing}
                  onChange={(v) => handleChange("name", v)}
                />
                <InfoField
                  icon={<Mail size={18} />}
                  label="Email"
                  value={formData.email}
                  display={profileData.email}
                  editing={isEditing}
                  onChange={(v) => handleChange("email", v)}
                  type="email"
                />
                <InfoField
                  icon={<Smartphone size={18} />}
                  label={tr("Nomor Telepon", "Phone Number")}
                  value={formData.no_telepon}
                  display={profileData.no_telepon}
                  editing={isEditing}
                  onChange={(v) => handleChange("no_telepon", v)}
                  type="tel"
                />
                <InfoField
                  icon={<Home size={18} />}
                  label={tr("Alamat", "Address")}
                  value={formData.alamat}
                  display={profileData.alamat}
                  editing={isEditing}
                  onChange={(v) => handleChange("alamat", v)}
                  isTextarea
                />
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-8">
                {isEditing ? (
                  <>
                    {/* Dokumen Identitas - KTP, KK, Akte Kelahiran */}
                    <DocumentSection title={tr("Dokumen Identitas", "Identity Documents")} icon={<FileSignature size={18} className="text-purple-600" />}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <UploadCard
                          label="KTP"
                          file={files.ktp}
                          onFileChange={(f) => handleDocFilePick("ktp", f)}
                          existingFile={profileData.ktp}
                          required
                        />
                        <UploadCard
                          label={tr("Kartu Keluarga (KK)", "Family Card (KK)")}
                          file={files.kk}
                          onFileChange={(f) => handleDocFilePick("kk", f)}
                          existingFile={profileData.kk}
                        />
                        <UploadCard
                          label={tr("Akte Kelahiran", "Birth Certificate")}
                          file={files.akte}
                          onFileChange={(f) => handleDocFilePick("akte", f)}
                          existingFile={profileData.akte}
                        />
                      </div>
                    </DocumentSection>

                    {/* Ijazah */}
                    <DocumentSection title="Ijazah" icon={<GraduationCap size={18} className="text-purple-600" />}>
                      <MultiUploadCard
                        type="ijazah"
                        files={ijazahFiles}
                        onFileSelect={(f) => handleMultipleFiles(f, setIjazahFiles, setPreviewIjazah)}
                        onRemoveFile={(idx) => removeFile(idx, ijazahFiles, setIjazahFiles, previewIjazah, setPreviewIjazah)}
                        existingFiles={profileData.ijazah}
                        userId={effectiveUserId}
                        onDeleteFile={handleDeleteExistingFile}
                        acceptedFormats="PDF, JPG, PNG"
                      />
                    </DocumentSection>

                    {/* Sertifikat */}
                    <DocumentSection title={tr("Sertifikat", "Certificates")} icon={<Award size={18} className="text-purple-600" />}>
                      <MultiUploadCard
                        type="sertifikat"
                        files={sertifikatFiles}
                        onFileSelect={(f) => handleMultipleFiles(f, setSertifikatFiles, setPreviewSertifikat)}
                        onRemoveFile={(idx) => removeFile(idx, sertifikatFiles, setSertifikatFiles, previewSertifikat, setPreviewSertifikat)}
                        existingFiles={profileData.sertifikat}
                        userId={effectiveUserId}
                        onDeleteFile={handleDeleteExistingFile}
                        acceptedFormats="PDF, JPG, PNG"
                      />
                    </DocumentSection>

                    <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1 pt-2 border-t border-gray-100">
                      <Shield size={10} /> {tr("File akan dienkripsi untuk keamanan data", "Files will be encrypted for data security")}
                    </p>
                  </>
                ) : (
                  <>
                    {/* View Mode - Dokumen Identitas */}
                    {(profileData.ktp || profileData.kk || profileData.akte) && (
                      <DocumentSection title={tr("Dokumen Identitas", "Identity Documents")} icon={<FileSignature size={18} className="text-purple-600" />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {profileData.ktp && <DocCard label="KTP" filename={getFileName(profileData.ktp)} onPreview={() => previewFile('ktp')} />}
                          {profileData.kk && <DocCard label={tr("Kartu Keluarga (KK)", "Family Card (KK)")} filename={getFileName(profileData.kk)} onPreview={() => previewFile('kk')} />}
                          {profileData.akte && <DocCard label={tr("Akte Kelahiran", "Birth Certificate")} filename={getFileName(profileData.akte)} onPreview={() => previewFile('akte')} />}
                        </div>
                      </DocumentSection>
                    )}

                    {/* View Mode - Ijazah */}
                    {profileData.ijazah?.length > 0 && (
                      <DocumentSection title="Ijazah" icon={<GraduationCap size={18} className="text-purple-600" />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {profileData.ijazah.map((f, i) => (
                            <DocCard
                              key={`ijazah-${i}`}
                              label={`Ijazah ${i + 1}`}
                              filename={getFileName(f)}
                              onPreview={() => previewFile('ijazah', i)}
                            />
                          ))}
                        </div>
                      </DocumentSection>
                    )}

                    {/* View Mode - Sertifikat */}
                    {profileData.sertifikat?.length > 0 && (
                      <DocumentSection title={tr("Sertifikat", "Certificates")} icon={<Award size={18} className="text-purple-600" />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {profileData.sertifikat.map((f, i) => (
                            <DocCard
                              key={`sertifikat-${i}`}
                              label={`${tr("Sertifikat", "Certificate")} ${i + 1}`}
                              filename={getFileName(f)}
                              onPreview={() => previewFile('sertifikat', i)}
                            />
                          ))}
                        </div>
                      </DocumentSection>
                    )}

                    {totalDocuments === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <FolderOpen size={48} className="mx-auto mb-3 opacity-50" />
                        <p>{tr("Belum ada dokumen", "No documents yet")}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div className="max-w-2xl mx-auto py-2">
                <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 to-white p-6 sm:p-8 shadow-sm">
                  <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                      <KeyRound size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {tr("Reset Password", "Reset Password")}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        {isSuperAdmin
                          ? tr(
                              "Sebagai Super Admin, Anda dapat langsung mengatur password baru untuk akun ini.",
                              "As Super Admin, you can set a new password directly for this account."
                            )
                          : tr(
                              "Masukkan password saat ini dan password baru Anda untuk memperbarui keamanan akun.",
                              "Enter your current and new password to update account security."
                            )}
                      </p>
                    </div>
                  </div>

                  {passwordError && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs sm:text-sm text-red-700">
                      <AlertCircle size={18} className="shrink-0 text-red-500" />
                      <span className="flex-1">{passwordError}</span>
                      <button type="button" onClick={() => setPasswordError(null)} className="text-red-400 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs sm:text-sm text-emerald-800">
                      <CheckCircle size={18} className="shrink-0 text-emerald-600" />
                      <span className="flex-1">{passwordSuccess}</span>
                      <button type="button" onClick={() => setPasswordSuccess(null)} className="text-emerald-400 hover:text-emerald-600">
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-5">
                    {/* Current Password Field (for non-superadmin) */}
                    {!isSuperAdmin ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          {tr("Password Saat Ini", "Current Password")} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.current_password}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                            placeholder={tr("Masukkan password saat ini", "Enter current password")}
                            className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                          >
                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* New Password Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {tr("Password Baru", "New Password")} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.password}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder={tr("Masukkan password baru (minimal 6 karakter)", "Enter new password (min. 6 characters)")}
                          className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {tr("Panjang minimal 6 karakter. Gunakan kombinasi huruf dan angka.", "Minimum 6 characters. Use letters and numbers.")}
                      </p>
                    </div>

                    {/* Password Confirmation Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {tr("Konfirmasi Password Baru", "Confirm New Password")} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.password_confirmation}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, password_confirmation: e.target.value }))}
                          placeholder={tr("Ulangi password baru", "Repeat new password")}
                          className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {passwordData.password && passwordData.password_confirmation && (
                        <p className={`mt-1 text-[11px] font-medium flex items-center gap-1 ${
                          passwordData.password === passwordData.password_confirmation ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {passwordData.password === passwordData.password_confirmation ? (
                            <><CheckCircle size={12} /> {tr("Password cocok", "Passwords match")}</>
                          ) : (
                            <><AlertCircle size={12} /> {tr("Password tidak cocok", "Passwords do not match")}</>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordData({ current_password: "", password: "", password_confirmation: "" });
                          setPasswordError(null);
                        }}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition"
                      >
                        {tr("Reset Form", "Reset Form")}
                      </button>
                      <button
                        type="submit"
                        disabled={updatingPassword}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-md shadow-purple-600/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {updatingPassword ? (
                          <>
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            {tr("Memperbarui...", "Updating...")}
                          </>
                        ) : (
                          <>
                            <KeyRound size={16} />
                            {tr("Simpan Password Baru", "Save New Password")}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button - REMOVED as requested */}
        </div>

      </div>
    </div>
  );
}

// ================= COMPONENTS =================

const InfoField = ({ icon, label, value, display, editing, onChange, type = "text", isTextarea = false }) => (
  <div className="group">
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
      {editing ? (
        isTextarea ? (
          <textarea
            value={value}
            rows={2}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-sm"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-sm"
          />
        )
      ) : (
        <div className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-gray-800 text-sm">{display || "-"}</p>
        </div>
      )}
    </div>
  </div>
);

// New Component for Document Sections
const DocumentSection = ({ title, icon, children }) => (
  <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

const UploadCard = ({ label, file, onFileChange, existingFile, required = false }) => {
  const language = localStorage.getItem("app_language") || "id";
  const tr = (id, en) => (language === "en" ? en : id);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = `upload-${label.replace(/\s/g, '-')}`;

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const dropped = e.dataTransfer.files[0];
          if (dropped) onFileChange(dropped);
        }}
        className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-400'
          } ${file ? 'bg-purple-50 border-purple-500' : 'bg-gray-50'}`}
      >
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onFileChange(e.target.files[0])} className="hidden" id={inputId} />
        <label htmlFor={inputId} className="cursor-pointer block">
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-gray-400" />
            <span className="text-xs text-gray-500">
              {file ? file.name : tr("Klik atau drag file di sini", "Click or drag file here")}
            </span>
            <span className="text-[10px] text-gray-400">PDF, JPG, PNG ({tr("max", "max")} 2MB)</span>
          </div>
        </label>
      </div>
      {existingFile && !file && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-600 bg-green-50 p-1.5 rounded-lg">
          <CheckCircle size={12} />
          <span className="truncate flex-1">{tr("File tersimpan", "Saved file")}: {existingFile.split('/').pop()}</span>
        </div>
      )}
    </div>
  );
};

const MultiUploadCard = ({ type, files, onFileSelect, onRemoveFile, existingFiles, userId, onDeleteFile, acceptedFormats = "PDF, JPG, PNG" }) => {
  const language = localStorage.getItem("app_language") || "id";
  const tr = (id, en) => (language === "en" ? en : id);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = `multi-${type}`;
  const total = (existingFiles?.length || 0) + files.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{total} {tr("file", "files")}</span>
        <span className="text-[10px] text-gray-400">{acceptedFormats}</span>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const dropped = Array.from(e.dataTransfer.files);
          if (dropped.length) onFileSelect(dropped);
        }}
        className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-400'
          }`}
      >
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onFileSelect(Array.from(e.target.files))} className="hidden" id={inputId} multiple />
        <label htmlFor={inputId} className="cursor-pointer block">
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-gray-400" />
            <span className="text-xs text-gray-500">{tr("Klik atau drag untuk tambah file", "Click or drag to add files")}</span>
          </div>
        </label>
      </div>

      <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
        {/* Existing Files */}
        {existingFiles?.map((file, idx) => (
          <div key={`existing-${idx}`} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText size={12} className="text-purple-500 flex-shrink-0" />
              <span className="truncate flex-1">{file.split('/').pop()}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => window.open(buildPreviewUrl(type, idx), "_blank")} className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition" title={tr("Lihat", "View")}>
                <Eye size={12} />
              </button>
              <button onClick={() => onDeleteFile(type, idx)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition" title={tr("Hapus", "Delete")}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {/* New Files to Upload */}
        {files.map((file, idx) => (
          <div key={`new-${idx}`} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText size={12} className="text-purple-500 flex-shrink-0" />
              <span className="truncate flex-1">{file.name}</span>
            </div>
            <button onClick={() => onRemoveFile(idx)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition" title={tr("Batal", "Cancel")}>
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const DocCard = ({ label, filename, onPreview }) => (
  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-sm transition group">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="p-2 bg-purple-50 rounded-lg">
        <FileText size={16} className="text-purple-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-700 truncate">{filename}</p>
      </div>
    </div>
    <button
      onClick={onPreview}
      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition opacity-100 md:opacity-60 md:group-hover:opacity-100"
      title={(localStorage.getItem("app_language") || "id") === "en" ? "View Document" : "Lihat Dokumen"}
    >
      <Eye size={16} />
    </button>
  </div>
);