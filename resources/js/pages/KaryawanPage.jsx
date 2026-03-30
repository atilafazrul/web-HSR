import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Eye,
  Pencil,
  X,
  Search,
  Trash2,
  UserPlus,
  Save,
  AlertCircle,
  FileText,
  Download,
  Shield,
  Upload,
  Camera,
  Eye as EyeIcon,
  Award,
  GraduationCap,
  User,
  Heart,
  Building2,
  CheckCircle,
  FolderOpen,
  Users,
  Plus,
  Image,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Home,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function KaryawanPage() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState(null);
  const [createData, setCreateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  // State untuk file upload hanya untuk create dan edit photo
  const [filePhoto, setFilePhoto] = useState(null);
  
  // State untuk accordion di modal edit
  const [expandedSectionsEdit, setExpandedSectionsEdit] = useState({
    personal: true,
    emergency: false
  });
  
  // State untuk accordion di modal detail
  const [expandedSectionsDetail, setExpandedSectionsDetail] = useState({
    personal: true,
    emergency: false,
    documents: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const res = await axios.get("/api/karyawan");
      setEmployees(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data karyawan");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const previewFile = (karyawanId, type, index = null) => {
    let url = `/api/karyawan/${karyawanId}/${type}`;
    if (index !== null) url += `?index=${index}`;
    window.open(url, '_blank');
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();

      // Add all text fields only (no file fields)
      Object.keys(editData).forEach(key => {
        if (editData[key] !== undefined && editData[key] !== null && editData[key] !== '') {
          // Skip all file fields
          if (!['ktp', 'kk', 'akte', 'profile_photo', 'ijazah', 'sertifikat'].includes(key)) {
            formData.append(key, editData[key]);
          }
        }
      });

      // Only update photo if new one is selected
      if (filePhoto) formData.append("profile_photo", filePhoto);

      await axios.post(`/api/karyawan/${editData.id}?_method=PUT`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Data berhasil disimpan ✅");
      resetEditState();
      fetchData();
      
    } catch (err) {
      console.error("Error response:", err.response?.data);
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join("\n");
        alert(`Gagal menyimpan:\n${errorMessages}`);
      } else {
        alert(err.response?.data?.message || "Gagal menyimpan data ❌");
      }
    } finally {
      setSaving(false);
    }
  };

  const resetEditState = () => {
    setFilePhoto(null);
    setEditData(null);
    setExpandedSectionsEdit({
      personal: true,
      emergency: false
    });
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!createData.name || !createData.email || !createData.password) {
        alert("Nama, Email, dan Password harus diisi!");
        setSaving(false);
        return;
      }

      await axios.post("/api/karyawan", {
        ...createData,
        role: "admin"
      });

      alert("Karyawan berhasil ditambahkan ✅");
      setCreateData(null);
      fetchData();

    } catch (err) {
      console.error(err.response?.data || err.message);
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join("\n");
        alert(`Gagal menambahkan:\n${errorMessages}`);
      } else {
        alert(err.response?.data?.message || "Gagal menambahkan karyawan ❌");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus karyawan ini?")) return;
    try {
      await axios.delete(`/api/karyawan/${id}`);
      alert("Karyawan berhasil dihapus ✅");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus karyawan ❌");
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.divisi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nik?.includes(searchTerm) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSectionEdit = (section) => {
    setExpandedSectionsEdit(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSectionDetail = (section) => {
    setExpandedSectionsDetail(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat data karyawan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <span className="text-red-700 flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Kelola Karyawan
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Kelola data lengkap seluruh karyawan perusahaan
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari karyawan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm w-full sm:w-[280px] bg-white shadow-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
              />
            </div>

            <button
              onClick={() => setCreateData({ name: "", email: "", password: "", divisi: "" })}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              <UserPlus size={18} />
              <span>Tambah Karyawan</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard 
            title="Total Karyawan" 
            value={employees.length} 
            icon={<Users size={20} />}
            color="purple"
          />
          <StatCard 
            title="Divisi Aktif" 
            value={new Set(employees.map(e => e.divisi).filter(Boolean)).size} 
            icon={<Building2 size={20} />}
            color="blue"
          />
          <StatCard 
            title="Dokumen Terupload" 
            value={employees.reduce((total, emp) => {
              let count = 0;
              if (emp.ktp) count++;
              if (emp.kk) count++;
              if (emp.akte) count++;
              if (emp.ijazah) count += emp.ijazah.length;
              if (emp.sertifikat) count += emp.sertifikat.length;
              return total + count;
            }, 0)} 
            icon={<FileText size={20} />}
            color="green"
          />
        </div>

        {/* Employee Grid */}
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <FolderOpen size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Tidak ada data karyawan</p>
            <p className="text-gray-400 text-sm mt-1">Klik "Tambah Karyawan" untuk menambahkan data</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onView={() => setSelected(emp)}
                onEdit={() => {
                  const formattedData = {
                    ...emp,
                    tanggal_lahir: formatDateForInput(emp.tanggal_lahir),
                  };
                  setEditData(formattedData);
                  setFilePhoto(null);
                }}
                onDelete={() => handleDelete(emp.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Detail - Dengan Accordion yang Rapi */}
      {selected && (
        <Modal onClose={() => setSelected(null)} title="Detail Karyawan" size="large">
          <EmployeeDetailModal 
            employee={selected} 
            previewFile={previewFile} 
            expandedSections={expandedSectionsDetail}
            toggleSection={toggleSectionDetail}
          />
        </Modal>
      )}

      {/* Modal Edit - Hanya untuk edit data teks */}
      {editData && (
        <Modal onClose={resetEditState} title="Edit Data Karyawan" size="large">
          <EditEmployeeForm
            editData={editData}
            setEditData={setEditData}
            filePhoto={filePhoto}
            setFilePhoto={setFilePhoto}
            handleUpdate={handleUpdate}
            saving={saving}
            onCancel={resetEditState}
            expandedSections={expandedSectionsEdit}
            toggleSection={toggleSectionEdit}
          />
        </Modal>
      )}

      {/* Modal Create */}
      {createData && (
        <Modal onClose={() => setCreateData(null)} title="Tambah Karyawan Baru">
          <CreateEmployeeForm
            createData={createData}
            setCreateData={setCreateData}
            handleCreate={handleCreate}
            saving={saving}
            onCancel={() => setCreateData(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// ================= STAT CARD COMPONENT =================
const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600"
  };
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ================= EMPLOYEE CARD =================
const EmployeeCard = ({ employee, onView, onEdit, onDelete }) => {
  const getInitials = (name) => {
    return name?.charAt(0)?.toUpperCase() || "U";
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      <div className="relative h-24 bg-gradient-to-r from-purple-500 to-purple-700">
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          {employee.profile_photo ? (
            <img
              src={`/storage/${employee.profile_photo}`}
              className="w-24 h-24 rounded-full border-4 border-white object-cover bg-white shadow-lg"
              alt={employee.name}
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {getInitials(employee.name)}
            </div>
          )}
        </div>
      </div>

      <div className="pt-14 pb-5 px-4 text-center">
        <h4 className="font-bold text-gray-800 text-lg truncate">{employee.name}</h4>
        <p className="text-purple-600 text-sm font-medium mt-1">{employee.divisi || "-"}</p>
        <p className="text-gray-400 text-xs mt-1 truncate">{employee.email}</p>
        
        <div className="flex justify-center gap-2 mt-4">
          <ActionButton icon={<Eye size={16} />} onClick={onView} color="blue" tooltip="Lihat Detail" />
          <ActionButton icon={<Pencil size={16} />} onClick={onEdit} color="purple" tooltip="Edit" />
          <ActionButton icon={<Trash2 size={16} />} onClick={onDelete} color="red" tooltip="Hapus" />
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, onClick, color, tooltip }) => {
  const colors = {
    blue: "bg-blue-50 hover:bg-blue-100 text-blue-600",
    purple: "bg-purple-50 hover:bg-purple-100 text-purple-600",
    red: "bg-red-50 hover:bg-red-100 text-red-600"
  };

  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 flex items-center justify-center rounded-full transition ${colors[color]}`}
      title={tooltip}
    >
      {icon}
    </button>
  );
};

// ================= DETAIL MODAL CONTENT (RAPIH DENGAN ACCORDION) =================
const EmployeeDetailModal = ({ employee, previewFile, expandedSections, toggleSection }) => {
  // Data Pribadi Fields
  const personalFields = [
    { label: "NIK", value: employee.nik },
    { label: "Email", value: employee.email },
    { label: "No. Telepon", value: employee.phone || employee.no_telepon },
    { label: "Tempat Lahir", value: employee.tempat_lahir },
    { label: "Tanggal Lahir", value: employee.tanggal_lahir ? new Date(employee.tanggal_lahir).toLocaleDateString('id-ID') : "-" },
    { label: "Jenis Kelamin", value: employee.jenis_kelamin },
    { label: "Agama", value: employee.agama },
    { label: "Status Perkawinan", value: employee.status_perkawinan },
    { label: "Pekerjaan", value: employee.pekerjaan },
    { label: "Golongan Darah", value: employee.golongan_darah },
    { label: "Alamat", value: employee.alamat, fullWidth: true }
  ];

  // Kontak Darurat Fields
  const emergencyFields = [
    { label: "Nama", value: employee.kontak_darurat_nama },
    { label: "Hubungan", value: employee.kontak_darurat_hubungan },
    { label: "Telepon", value: employee.kontak_darurat_telepon },
    { label: "Alamat", value: employee.kontak_darurat_alamat, fullWidth: true }
  ];

  // Dokumen Files
  const documents = [
    { type: "ktp", label: "KTP", file: employee.ktp, icon: <Shield size={14} /> },
    { type: "kk", label: "Kartu Keluarga", file: employee.kk, icon: <Users size={14} /> },
    { type: "akte", label: "Akte Kelahiran", file: employee.akte, icon: <FileText size={14} /> }
  ];

  // Hitung total dokumen
  const totalDocuments = [
    employee.ktp, employee.kk, employee.akte,
    ...(employee.ijazah || []),
    ...(employee.sertifikat || [])
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="text-center pb-4 border-b">
        <img
          src={
            employee.profile_photo
              ? `/storage/${employee.profile_photo}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || "User")}&background=8B5CF6&color=fff&size=128`
          }
          className="w-28 h-28 mx-auto rounded-full border-4 border-purple-200 object-cover mb-3"
          alt={employee.name}
        />
        <h3 className="text-xl font-bold text-gray-800">{employee.name}</h3>
        <p className="text-purple-600 font-medium">{employee.divisi || "-"}</p>
      </div>

      {/* Accordion Sections */}
      <AccordionSection
        title="Data Pribadi"
        icon={<User size={18} />}
        expanded={expandedSections.personal}
        onToggle={() => toggleSection('personal')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {personalFields.map((field, idx) => (
            <div key={idx} className={field.fullWidth ? "md:col-span-2" : ""}>
              <InfoField label={field.label} value={field.value} />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection
        title="Kontak Darurat"
        icon={<Heart size={18} />}
        expanded={expandedSections.emergency}
        onToggle={() => toggleSection('emergency')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {emergencyFields.map((field, idx) => (
            <div key={idx} className={field.fullWidth ? "md:col-span-2" : ""}>
              <InfoField label={field.label} value={field.value} />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection
        title="Dokumen"
        icon={<Shield size={18} />}
        expanded={expandedSections.documents}
        onToggle={() => toggleSection('documents')}
        badge={totalDocuments}
      >
        <div className="space-y-4">
          {/* Dokumen Identitas */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              <Shield size={14} className="text-purple-500" />
              Dokumen Identitas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {documents.map((doc, idx) => doc.file && (
                <DocumentCard
                  key={idx}
                  label={doc.label}
                  filename={doc.file.split('/').pop()}
                  icon={doc.icon}
                  onPreview={() => previewFile(employee.id, doc.type)}
                />
              ))}
            </div>
            {!employee.ktp && !employee.kk && !employee.akte && (
              <p className="text-gray-400 text-sm">Tidak ada dokumen identitas</p>
            )}
          </div>

          {/* Ijazah */}
          {employee.ijazah && employee.ijazah.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <GraduationCap size={14} className="text-purple-500" />
                Ijazah ({employee.ijazah.length} file)
              </p>
              <div className="grid grid-cols-1 gap-2">
                {employee.ijazah.map((file, index) => (
                  <DocumentCard
                    key={`ijazah-${index}`}
                    label={`Ijazah ${index + 1}`}
                    filename={file.split('/').pop()}
                    icon={<GraduationCap size={14} />}
                    onPreview={() => previewFile(employee.id, 'ijazah', index)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sertifikat */}
          {employee.sertifikat && employee.sertifikat.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Award size={14} className="text-purple-500" />
                Sertifikat ({employee.sertifikat.length} file)
              </p>
              <div className="grid grid-cols-1 gap-2">
                {employee.sertifikat.map((file, index) => (
                  <DocumentCard
                    key={`sertifikat-${index}`}
                    label={`Sertifikat ${index + 1}`}
                    filename={file.split('/').pop()}
                    icon={<Award size={14} />}
                    onPreview={() => previewFile(employee.id, 'sertifikat', index)}
                  />
                ))}
              </div>
            </div>
          )}

          {totalDocuments === 0 && (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400">Tidak ada dokumen</p>
            </div>
          )}
        </div>
      </AccordionSection>
    </div>
  );
};

// ================= EDIT FORM =================
const EditEmployeeForm = ({
  editData,
  setEditData,
  filePhoto,
  setFilePhoto,
  handleUpdate,
  saving,
  onCancel,
  expandedSections,
  toggleSection
}) => {
  const personalFields = [
    { label: "Nama Lengkap", key: "name", type: "text", required: true },
    { label: "NIK", key: "nik", type: "text" },
    { label: "Email", key: "email", type: "email", required: true },
    { label: "Nomor Telepon", key: "phone", type: "tel", altKey: "no_telepon" },
    { label: "Tempat Lahir", key: "tempat_lahir", type: "text" },
    { label: "Tanggal Lahir", key: "tanggal_lahir", type: "date" },
    { label: "Jenis Kelamin", key: "jenis_kelamin", type: "select", options: ["Laki-laki", "Perempuan"] },
    { label: "Agama", key: "agama", type: "text" },
    { label: "Status Perkawinan", key: "status_perkawinan", type: "select", options: ["Belum Kawin", "Kawin", "Cerai", "Cerai Mati"] },
    { label: "Pekerjaan", key: "pekerjaan", type: "text" },
    { label: "Golongan Darah", key: "golongan_darah", type: "select", options: ["A", "B", "AB", "O"] },
    { label: "Alamat", key: "alamat", type: "textarea", fullWidth: true }
  ];

  const emergencyFields = [
    { label: "Nama Kontak Darurat", key: "kontak_darurat_nama", type: "text" },
    { label: "Hubungan", key: "kontak_darurat_hubungan", type: "text" },
    { label: "Telepon Kontak Darurat", key: "kontak_darurat_telepon", type: "tel" },
    { label: "Alamat Kontak Darurat", key: "kontak_darurat_alamat", type: "textarea", fullWidth: true }
  ];

  const handleFieldChange = (key, value, altKey = null) => {
    setEditData({ ...editData, [key]: value });
    if (altKey) {
      setEditData(prev => ({ ...prev, [altKey]: value }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Photo Upload */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <img
            src={
              filePhoto 
                ? URL.createObjectURL(filePhoto)
                : editData.profile_photo
                  ? `/storage/${editData.profile_photo}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(editData.name || "User")}&background=8B5CF6&color=fff&size=128`
            }
            className="w-16 h-16 rounded-full border-2 border-purple-300 object-cover shadow-md"
            alt="Profile"
          />
          <div>
            <FileUploadSimple
              label="Ganti Foto"
              file={filePhoto}
              onFileChange={setFilePhoto}
              icon={<Camera size={14} />}
            />
            <p className="text-xs text-gray-400 mt-1">JPG, PNG (Max 2MB)</p>
          </div>
        </div>
      </div>

      {/* Accordion Sections */}
      <AccordionSection
        title="Data Pribadi"
        icon={<User size={18} />}
        expanded={expandedSections.personal}
        onToggle={() => toggleSection('personal')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalFields.map((field, idx) => (
            <div key={idx} className={field.fullWidth ? "md:col-span-2" : ""}>
              <FormField
                label={field.label}
                value={editData[field.key] || ""}
                onChange={(v) => handleFieldChange(field.key, v, field.altKey)}
                type={field.type}
                options={field.options}
                required={field.required}
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection
        title="Kontak Darurat"
        icon={<Heart size={18} />}
        expanded={expandedSections.emergency}
        onToggle={() => toggleSection('emergency')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyFields.map((field, idx) => (
            <div key={idx} className={field.fullWidth ? "md:col-span-2" : ""}>
              <FormField
                label={field.label}
                value={editData[field.key] || ""}
                onChange={(v) => setEditData({ ...editData, [field.key]: v })}
                type={field.type}
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* Note about documents */}
      <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
        <FileText size={14} className="text-blue-500" />
        <p className="text-xs text-blue-700">
          Untuk melihat dokumen (KTP, KK, Ijazah, dll), silakan buka halaman Detail Karyawan.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t mt-4">
        <button
          onClick={handleUpdate}
          disabled={saving}
          className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
        >
          <Save size={18} />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

// ================= ACCORDION SECTION COMPONENT =================
const AccordionSection = ({ title, icon, children, expanded, onToggle, badge }) => {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-purple-600">{icon}</span>
          <h4 className="font-semibold text-gray-800">{title}</h4>
          {badge !== undefined && badge > 0 && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
              {badge}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      {expanded && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          {children}
        </div>
      )}
    </div>
  );
};

// ================= CREATE FORM =================
const CreateEmployeeForm = ({ createData, setCreateData, handleCreate, saving, onCancel }) => {
  return (
    <div className="space-y-5">
      <FormField
        label="Nama Lengkap"
        value={createData.name}
        onChange={(v) => setCreateData({ ...createData, name: v })}
        type="text"
        required
        placeholder="Masukkan nama lengkap"
      />
      <FormField
        label="Email"
        value={createData.email}
        onChange={(v) => setCreateData({ ...createData, email: v })}
        type="email"
        required
        placeholder="contoh@email.com"
      />
      <FormField
        label="Password"
        value={createData.password}
        onChange={(v) => setCreateData({ ...createData, password: v })}
        type="password"
        required
        placeholder="Minimal 6 karakter"
      />
      <FormField
        label="Divisi"
        value={createData.divisi}
        onChange={(v) => setCreateData({ ...createData, divisi: v })}
        type="select"
        options={["IT", "Service", "Sales", "Kontraktor", "Logistik", "Purchasing"]}
      />

      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleCreate}
          disabled={saving}
          className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
        >
          <UserPlus size={18} />
          {saving ? "Menyimpan..." : "Tambah Karyawan"}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

// ================= REUSABLE COMPONENTS =================

const InfoField = ({ label, value }) => (
  <div className="bg-white p-3 rounded-lg border border-gray-100 hover:shadow-sm transition">
    <p className="text-gray-400 text-xs mb-1">{label}</p>
    <p className="font-medium text-gray-700 break-words">{value || "-"}</p>
  </div>
);

const FormField = ({ label, value, onChange, type = "text", options, required, placeholder }) => {
  if (type === "select") {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition bg-white"
        >
          <option value="">Pilih {label}</option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }
  
  if (type === "textarea") {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder={placeholder}
          className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
        />
      </div>
    );
  }
  
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
      />
    </div>
  );
};

const FileUploadSimple = ({ label, file, onFileChange, icon }) => {
  return (
    <div>
      <label className="cursor-pointer">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition text-sm">
          {icon}
          <span className="text-gray-600 truncate max-w-[120px]">{file ? file.name : label}</span>
        </div>
        <input
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={(e) => onFileChange(e.target.files[0])}
          className="hidden"
        />
      </label>
    </div>
  );
};

// ================= DOCUMENT CARD - TOMBOL VIEW HANYA MUNCUL SAAT HOVER =================
const DocumentCard = ({ label, filename, icon, onPreview }) => (
  <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between group hover:bg-gray-100 transition-all duration-200 border border-gray-100 hover:border-gray-200 relative">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="p-2 bg-purple-100 rounded-lg text-purple-600 group-hover:bg-purple-200 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{label}</p>
        <p className="text-[10px] text-gray-400 truncate group-hover:text-gray-500 transition-colors">{filename}</p>
      </div>
    </div>
    
    {/* Tombol View - Hanya muncul saat hover */}
    <button
      onClick={onPreview}
      className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 transform hover:scale-105 opacity-0 group-hover:opacity-100"
      title="Lihat Dokumen"
    >
      <EyeIcon size={12} />
    </button>
  </div>
);

const Modal = ({ children, onClose, title, size = "default" }) => {
  const sizeClasses = {
    default: "max-w-2xl",
    large: "max-w-3xl"
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full ${sizeClasses[size]} relative shadow-2xl max-h-[90vh] flex flex-col`}>
        <div className="p-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};