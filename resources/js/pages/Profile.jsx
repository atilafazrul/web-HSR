import React, { useState, useEffect, useRef } from "react";
import api from "../api/axiosConfig";
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
  LogOut
} from "lucide-react";

export default function Profile({ user, logout, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const fileInputRef = useRef(null);

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
      if (!user?.id) return;
      try {
        const res = await api.get(`/profile?user_id=${user.id}`);
        const data = res.data;
        if (data.success) {
          const newData = {
            name: data.user.name || "",
            email: data.user.email || "",
            no_telepon: data.user.no_telepon || "",
            alamat: data.user.alamat || data.user.address || "",
            profile_photo: data.user.profile_photo || null,
            ktp: data.user.ktp || null,
            kk: data.user.kk || null,
            akte: data.user.akte || null,
            ijazah: data.user.ijazah || [],
            sertifikat: data.user.sertifikat || []
          };
          setProfileData(newData);
          setFormData(newData);
        }
      } catch (err) {
        setError("Gagal memuat data profile");
      }
    };
    fetchProfile();
  }, [user?.id]);

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

  const handleMultipleFiles = (files, setFiles, setPreview) => {
    const fileArray = Array.from(files);
    setFiles(prev => [...prev, ...fileArray]);
    setPreview(prev => [...prev, ...fileArray.map(f => URL.createObjectURL(f))]);
  };

  const removeFile = (index, files, setFiles, preview, setPreview) => {
    if (preview[index]) URL.revokeObjectURL(preview[index]);
    setFiles(files.filter((_, i) => i !== index));
    setPreview(preview.filter((_, i) => i !== index));
  };

  const previewFile = (type, index = null) => {
    let url = `/api/karyawan/${user.id}/${type}`;
    if (index !== null) url += `?index=${index}`;
    window.open(url, '_blank');
  };

  const handleDeleteExistingFile = async (type, index) => {
    if (!confirm("Yakin mau hapus file ini?")) return;
    try {
      const res = await api.post(`/karyawan/${user.id}/delete-file`, { type, index });
      const data = res.data;
      if (data.success) {
        setSuccess("File berhasil dihapus ✅");
        const refresh = await api.get(`/profile?user_id=${user.id}`);
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
        setError("Gagal hapus file");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Error hapus file");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("user_id", user.id);
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

      const res = await api.post(`/karyawan/${user.id}`, formDataToSend);
      const data = res.data;

      if (res.status === 200 && data.success) {
        const verify = await api.get(`/profile?user_id=${user.id}`);
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
          setSuccess("Profile berhasil diupdate! 🎉");
          if (onProfileUpdate) onProfileUpdate({ ...user, ...verified });
          setTimeout(() => setSuccess(null), 3000);
        }
      } else {
        setError(data.message || "Gagal update profile");
      }
    } catch (error) {
      setError("Terjadi kesalahan pada server");
    } finally {
      setLoading(false);
    }
  };

  // Photo Handlers
  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("File harus gambar");
    if (file.size > 2 * 1024 * 1024) return setError("Max 2MB");

    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("user_id", user.id);
      fd.append("photo", file);
      const res = await api.post("/profile/photo", fd);
      const data = res.data;
      if (res.status === 200 && data.success) {
        setProfileData(prev => ({ ...prev, profile_photo: data.profile_photo }));
        if (onProfileUpdate) onProfileUpdate({ ...user, profile_photo: data.profile_photo });
        setSuccess("Foto diupdate! 📸");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || "Upload gagal");
      }
    } catch {
      setError("Upload gagal");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm("Hapus foto profile?")) return;
    try {
      const res = await api.delete("/profile/photo", { data: { user_id: user.id } });
      const data = res.data;
      if (res.status === 200 && data.success) {
        setProfileData(prev => ({ ...prev, profile_photo: null }));
        if (onProfileUpdate) onProfileUpdate({ ...user, profile_photo: null });
        setSuccess("Foto dihapus");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || "Hapus gagal");
      }
    } catch {
      setError("Hapus gagal");
    }
  };

  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `/storage/${path}`;
  };

  const photoUrl = getPhotoUrl(profileData.profile_photo);
  const initial = profileData.name?.charAt(0) || user?.name?.charAt(0) || "U";

  const totalDocuments = (profileData.ktp ? 1 : 0) + (profileData.kk ? 1 : 0) + (profileData.akte ? 1 : 0) + 
                         (profileData.ijazah?.length || 0) + (profileData.sertifikat?.length || 0);

  const tabs = [
    { id: "personal", label: "Informasi Pribadi", icon: <User size={16} /> },
    { id: "documents", label: "Dokumen", icon: <FileText size={16} />, badge: totalDocuments }
  ];

  return (
    <div className="min-h-screen blg-gradient-to-br from-slate-50 to-slate-100">
      <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange} />

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
       
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
          {/* Cover & Profile Header */}
          <div className="relative">
            <div className="h-32 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600"></div>
            <div className="absolute -bottom-16 left-0 right-0 px-6 md:px-8">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                <div className="relative">
                  <div className="relative">
                    {photoUrl ? (
                      <img src={photoUrl} alt={profileData.name} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl bg-white" />
                    ) : (
                      <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-xl">
                        {initial}
                      </div>
                    )}
                    <button
                      onClick={handlePhotoClick}
                      disabled={uploadingPhoto}
                      className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md hover:shadow-lg transition"
                    >
                      {uploadingPhoto ? (
                        <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={14} className="text-purple-600" />
                      )}
                    </button>
                    {photoUrl && !uploadingPhoto && (
                      <button
                        onClick={handleDeletePhoto}
                        className="absolute bottom-0 left-0 bg-white rounded-full p-1.5 shadow-md hover:shadow-lg transition"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-gray-900">{profileData.name || user?.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      <Briefcase size={12} />
                      {user?.role?.replace("_", " ") || "Employee"}
                    </span>
                    {user?.divisi && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        <Building2 size={12} />
                        {user.divisi}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <FileText size={12} />
                      {totalDocuments} Dokumen
                    </span>
                  </div>
                </div>
                <div>
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition flex items-center gap-2 shadow-md text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-medium flex items-center gap-2">
                        <X size={16} /> Batal
                      </button>
                      <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition text-sm font-medium flex items-center gap-2">
                        <Save size={16} /> {loading ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-20 px-6 md:px-8 border-b border-gray-200">
            <div className="flex gap-6 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${
                    activeTab === tab.id
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
                  label="Nama Lengkap"
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
                  label="Nomor Telepon"
                  value={formData.no_telepon}
                  display={profileData.no_telepon}
                  editing={isEditing}
                  onChange={(v) => handleChange("no_telepon", v)}
                  type="tel"
                />
                <InfoField
                  icon={<Home size={18} />}
                  label="Alamat"
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
                    <DocumentSection title="Dokumen Identitas" icon={<FileSignature size={18} className="text-purple-600" />}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <UploadCard 
                          label="KTP" 
                          file={files.ktp} 
                          onFileChange={(f) => setFiles(prev => ({ ...prev, ktp: f }))} 
                          existingFile={profileData.ktp}
                          required
                        />
                        <UploadCard 
                          label="Kartu Keluarga (KK)" 
                          file={files.kk} 
                          onFileChange={(f) => setFiles(prev => ({ ...prev, kk: f }))} 
                          existingFile={profileData.kk}
                        />
                        <UploadCard 
                          label="Akte Kelahiran" 
                          file={files.akte} 
                          onFileChange={(f) => setFiles(prev => ({ ...prev, akte: f }))} 
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
                        userId={user.id}
                        onDeleteFile={handleDeleteExistingFile}
                        acceptedFormats="PDF, JPG, PNG"
                      />
                    </DocumentSection>

                    {/* Sertifikat */}
                    <DocumentSection title="Sertifikat" icon={<Award size={18} className="text-purple-600" />}>
                      <MultiUploadCard
                        type="sertifikat"
                        files={sertifikatFiles}
                        onFileSelect={(f) => handleMultipleFiles(f, setSertifikatFiles, setPreviewSertifikat)}
                        onRemoveFile={(idx) => removeFile(idx, sertifikatFiles, setSertifikatFiles, previewSertifikat, setPreviewSertifikat)}
                        existingFiles={profileData.sertifikat}
                        userId={user.id}
                        onDeleteFile={handleDeleteExistingFile}
                        acceptedFormats="PDF, JPG, PNG"
                      />
                    </DocumentSection>

                    <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1 pt-2 border-t border-gray-100">
                      <Shield size={10} /> File akan dienkripsi untuk keamanan data
                    </p>
                  </>
                ) : (
                  <>
                    {/* View Mode - Dokumen Identitas */}
                    {(profileData.ktp || profileData.kk || profileData.akte) && (
                      <DocumentSection title="Dokumen Identitas" icon={<FileSignature size={18} className="text-purple-600" />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {profileData.ktp && <DocCard label="KTP" filename={getFileName(profileData.ktp)} onPreview={() => previewFile('ktp')} />}
                          {profileData.kk && <DocCard label="Kartu Keluarga (KK)" filename={getFileName(profileData.kk)} onPreview={() => previewFile('kk')} />}
                          {profileData.akte && <DocCard label="Akte Kelahiran" filename={getFileName(profileData.akte)} onPreview={() => previewFile('akte')} />}
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
                      <DocumentSection title="Sertifikat" icon={<Award size={18} className="text-purple-600" />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {profileData.sertifikat.map((f, i) => (
                            <DocCard 
                              key={`sertifikat-${i}`} 
                              label={`Sertifikat ${i + 1}`} 
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
                        <p>Belum ada dokumen</p>
                      </div>
                    )}
                  </>
                )}
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
        className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${
          isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-400'
        } ${file ? 'bg-purple-50 border-purple-500' : 'bg-gray-50'}`}
      >
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onFileChange(e.target.files[0])} className="hidden" id={inputId} />
        <label htmlFor={inputId} className="cursor-pointer block">
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-gray-400" />
            <span className="text-xs text-gray-500">
              {file ? file.name : "Klik atau drag file di sini"}
            </span>
            <span className="text-[10px] text-gray-400">PDF, JPG, PNG (max 2MB)</span>
          </div>
        </label>
      </div>
      {existingFile && !file && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-600 bg-green-50 p-1.5 rounded-lg">
          <CheckCircle size={12} />
          <span className="truncate flex-1">File tersimpan: {existingFile.split('/').pop()}</span>
        </div>
      )}
    </div>
  );
};

const MultiUploadCard = ({ type, files, onFileSelect, onRemoveFile, existingFiles, userId, onDeleteFile, acceptedFormats = "PDF, JPG, PNG" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = `multi-${type}`;
  const total = (existingFiles?.length || 0) + files.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{total} file</span>
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
        className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${
          isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-400'
        }`}
      >
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onFileSelect(Array.from(e.target.files))} className="hidden" id={inputId} multiple />
        <label htmlFor={inputId} className="cursor-pointer block">
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-gray-400" />
            <span className="text-xs text-gray-500">Klik atau drag untuk tambah file</span>
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
              <button onClick={() => window.open(`/api/karyawan/${userId}/${type}?index=${idx}`)} className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition" title="Lihat">
                <Eye size={12} />
              </button>
              <button onClick={() => onDeleteFile(type, idx)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition" title="Hapus">
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
            <button onClick={() => onRemoveFile(idx)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition" title="Batal">
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
      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition opacity-60 group-hover:opacity-100"
      title="Lihat Dokumen"
    >
      <Eye size={16} />
    </button>
  </div>
);