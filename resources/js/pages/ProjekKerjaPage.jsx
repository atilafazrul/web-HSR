import React, { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import { digitsOnly, formatRibuanId, nominalApiToInput, parseRibuanId } from "../utils/formatRupiahInput";
import { compressImage } from "../utils/imageCompress";
import { useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import {
  Download,
  Eye,
  Trash2,
  Briefcase,
  User,
  MapPin,
  Calendar,
  FileText,
  Building,
  Activity,
  Settings,
  Edit3,
  ShoppingCart,
  Clock,
  DollarSign,
  Plus,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

function BiayaMetaFooter({ meta }) {
  if (!meta?.by) return null;
  const d = meta.at ? new Date(meta.at) : null;
  const dateStr =
    d && !Number.isNaN(d.getTime())
      ? d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
      : "";
  return (
    <p className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-200/80 flex items-start gap-1.5">
      <User size={12} className="shrink-0 mt-0.5 text-gray-400" />
      <span>
        Oleh: <span className="font-medium text-gray-600">{meta.by}</span>
        {dateStr ? <span className="text-gray-400">, {dateStr}</span> : null}
      </span>
    </p>
  );
}

export default function ProjekKerjaPage() {
  const { language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const tr = (id, en) => (language === "en" ? en : id);

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const role = user?.role;
  const divisiUser = user?.divisi;
  const isUserRole = role === "user";
  const canManageProject = role === "super_admin" || role === "admin";
  const basePath = role === "super_admin" ? "/super_admin" : role === "user" ? "/user" : "/admin";
  const canEditProjectByDivisi = (projectDivisi) =>
    canManageProject &&
    (role === "super_admin" ||
      String(projectDivisi || "")
        .toLowerCase()
        .trim() === String(divisiUser || "").toLowerCase().trim());

  const divisiLabel = (d) => {
    const key = String(d || "").toLowerCase().trim();
    const map = {
      sales: "Sales",
      it: "IT",
      service: "Service",
      kontraktor: "Kontraktor",
      logistik: "Logistik",
      purchasing: "Purchasing",
    };
    return map[key] || d || "-";
  };

  const divisiKey = (d) => String(d || "").toLowerCase().trim();
  const projectRelatedToDivisi = (item, targetDivisi) => {
    const target = divisiKey(targetDivisi);
    if (!target) return true;
    if (divisiKey(item?.divisi) === target) return true;
    const flow = Array.isArray(item?.divisi_flow) ? item.divisi_flow : [];
    return flow.some((d) => divisiKey(d) === target);
  };
  const isTransferredProjectInCurrentDivisiContext = (item) => {
    if (!currentDivisi) return false;
    const current = divisiKey(currentDivisi);
    const active = divisiKey(item?.divisi);
    return active !== current && projectRelatedToDivisi(item, currentDivisi);
  };
  const canOpenBiayaAction = (item) => {
    if (isUserRole) return false;
    if (role === "super_admin") return true;
    const sameAdminDivisi =
      role === "admin" &&
      divisiKey(item?.divisi) === divisiKey(divisiUser);
    return sameAdminDivisi || isTransferredProjectInCurrentDivisiContext(item);
  };
  const canEditProjectAction = (item) => {
    if (isUserRole) return false;
    if (role === "super_admin") {
      return !isTransferredProjectInCurrentDivisiContext(item);
    }
    if (role === "admin") {
      return (
        divisiKey(item?.divisi) === divisiKey(divisiUser) &&
        !isTransferredProjectInCurrentDivisiContext(item)
      );
    }
    return false;
  };
  const canEditBiayaAction = (item) => {
    if (isUserRole) return false;
    if (role === "super_admin") return true;
    if (role === "admin") {
      const sameOrInvolvedDivisi = projectRelatedToDivisi(item, divisiUser);
      const inProgress = !Boolean(item?.is_archived) && String(item?.status || "").toLowerCase().trim() !== "selesai";
      return sameOrInvolvedDivisi && inProgress;
    }
    return false;
  };
  const karyawanProjectList = (item) => {
    const karyawanFromString = String(item?.karyawan || "")
      .split(",")
      .map((v) => String(v || "").trim())
      .filter((v) => v !== "");
    const invitedUsers = Array.isArray(item?.invited_user_ids)
      ? item.invited_user_ids
          .map((v) => String(v || "").trim())
          .filter((v) => v !== "")
      : [];
    const arr = [
      item?.pic_karyawan,
      ...(Array.isArray(item?.karyawan_terlibat) ? item.karyawan_terlibat : []),
      ...karyawanFromString,
      ...invitedUsers,
    ]
      .map((v) => String(v || "").trim())
      .filter((v) => v !== "");
    return Array.from(new Set(arr));
  };
  const getCurrentKaryawanName = (item) => {
    const pic = String(item?.pic_karyawan || "").trim();
    if (pic) return pic;

    const terlibat = Array.isArray(item?.karyawan_terlibat)
      ? item.karyawan_terlibat.map((v) => String(v || "").trim()).filter(Boolean)
      : [];
    if (terlibat.length > 0) return terlibat[terlibat.length - 1];

    const fromString = String(item?.karyawan || "")
      .split(",")
      .map((v) => String(v || "").trim())
      .filter(Boolean);
    return fromString.length > 0 ? fromString[fromString.length - 1] : "-";
  };
  const invitedUserSet = (item) =>
    new Set(
      (Array.isArray(item?.invited_user_ids) ? item.invited_user_ids : [])
        .map((v) => String(v || "").trim())
        .filter(Boolean)
    );

  const getCurrentDivisi = () => {
    const pathSegments = location.pathname.split('/');
    const ProjekIndex = pathSegments.findIndex(seg => seg === 'projek');
    if (ProjekIndex > 0) {
      const divisiFromPath = pathSegments[ProjekIndex - 1];
      const divisiMap = {
        it: "IT",
        service: "Service",
        kontraktor: "Kontraktor",
        sales: "Sales",
        logistik: "Logistik",
        purchasing: "Purchasing"
      };
      return divisiMap[divisiFromPath.toLowerCase()] || divisiFromPath;
    }
    return null;
  };

  const currentDivisi = getCurrentDivisi();
  const isSelesaiContext = /\/(seles|selesai)(\/|$)/i.test(location.pathname);
  const isArchiveContext = /\/archive(\/|$)/i.test(location.pathname);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  const getDefaultDivisi = () => {
    if (role === "super_admin" && currentDivisi) {
      return currentDivisi;
    }
    return "";
  };

  const initialForm = {
    divisi: "",
    jenis_pekerjaan: "",
    karyawan: "",
    alamat: "",
    status: "Dibuat",
    start_date: "",
    problem_description: "",
    barang_dibeli: "",
    file_folder_name: "",
    photo_folder_name: "",
  };

  const [form, setForm] = useState(initialForm);
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [salesUsers, setSalesUsers] = useState([]);
  const [inviteUsers, setInviteUsers] = useState([]);
  const [salesUsersLoading, setSalesUsersLoading] = useState(false);
  const [selectedSalesUsers, setSelectedSalesUsers] = useState([]);
  const [selectedInviteUsers, setSelectedInviteUsers] = useState([]);
  const [salesUserError, setSalesUserError] = useState("");
  const [inviteUserError, setInviteUserError] = useState("");
  const [karyawanInput, setKaryawanInput] = useState("");
  const [inviteUserInput, setInviteUserInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // jumlah item per halaman

  // Modal deskripsi
  const [showDesc, setShowDesc] = useState(false);
  const [descText, setDescText] = useState("");
  const [editDesc, setEditDesc] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [newDesc, setNewDesc] = useState("");

  // Modal barang dibeli
  const [showBarangModal, setShowBarangModal] = useState(false);
  const [barangText, setBarangText] = useState("");
  const [editBarang, setEditBarang] = useState(false);
  const [newBarang, setNewBarang] = useState("");

  // Modal timeline status
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Modal biaya (jalan, pengeluaran, reimbursment) — banyak baris per kategori
  const [showUangModal, setShowUangModal] = useState(false);
  const [editUang, setEditUang] = useState(false);

  // State untuk modal konfirmasi status lunas
  const [showLunasConfirmModal, setShowLunasConfirmModal] = useState(false);
  const [lunasConfirmAction, setLunasConfirmAction] = useState(null);

  // State untuk modal konfirmasi hapus baris biaya
  const [showDeleteBiayaRowModal, setShowDeleteBiayaRowModal] = useState(false);
  const [deleteBiayaRowAction, setDeleteBiayaRowAction] = useState(null);

  // State untuk kompresi foto biaya
  const [compressingPhotoKey, setCompressingPhotoKey] = useState(null);

  const emptyBiayaRow = () => ({
    nominal: "",
    keterangan: "",
    is_lunas: false,
    oleh: user?.name || "",
    created_at: new Date().toISOString(),
    photoFiles: [],
  });
  const [biayaEdit, setBiayaEdit] = useState({
    jalan: [emptyBiayaRow()],
    pengeluaran: [emptyBiayaRow()],
    reimbursment: [emptyBiayaRow()],
  });

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [currentDivisi, divisiUser, isArchiveContext]);

  useEffect(() => {
    const fetchSalesUsers = async () => {
      try {
        setSalesUsersLoading(true);
        const res = await api.get("/karyawan");
        const users = res.data?.data || res.data || [];
        const sales = users.filter(
          (u) => String(u?.divisi || "").toLowerCase() === "sales"
        );
        const userAccounts = users.filter((u) => {
          const roleName = String(u?.role || "")
            .toLowerCase()
            .trim()
            .replace(/[\s-]+/g, "_");
          return roleName === "user";
        });
        setSalesUsers(sales);
        setInviteUsers(userAccounts);
      } catch (err) {
        console.error("Fetch sales users error:", err);
      } finally {
        setSalesUsersLoading(false);
      }
    };

    fetchSalesUsers();
  }, []);

  const salesDisplayName = (u) =>
    (u?.name || u?.email || `#${u?.id || ""}`).trim();
  const inviteDisplayName = (u) =>
    (u?.name || u?.email || `#${u?.id || ""}`).trim();

  const fetchData = async () => {
    try {
      const query = new URLSearchParams();
      if (role !== "super_admin" && divisiUser) {
        query.set("divisi", divisiUser);
      }
      query.set("archive", isArchiveContext ? "1" : "0");
      query.set("_ts", String(Date.now()));
      const params = query.toString();
      const res = await api.get(`/projek-kerja${params ? `?${params}` : ""}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      console.log("API Response raw:", res.data);
      // Handle response dari API yang berformat {success: true, data: [...]}
      // Ambil hanya property 'data' dari response
      let data = res.data?.data;
      console.log("Parsed data:", data);
      // Pastikan data adalah array sebelum melakukan sort
      if (!Array.isArray(data)) {
        data = [];
      }
      console.log("Final data:", data);
      const sorted = [...data].sort((a, b) => b.id - a.id);
      console.log("Sorted data:", sorted);
      setDataList(sorted);
      // Jangan reset currentPage agar pagination tetap di halaman yang sama
    } catch (err) {
      console.error("Fetch error:", err);
      setDataList([]);
    }
  };

  const handleUnarchiveProject = async (item) => {
    if (!window.confirm("Batalkan archive dan kembalikan ke progres terakhir?")) return;
    try {
      await api.patch(`/projek-kerja/${item.id}/unarchive`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal membatalkan archive");
    }
  };


  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleKaryawanChange = (e) => {
    const val = e.target.value;
    setKaryawanInput(val);
  };

  const addSalesKaryawan = () => {
    const val = karyawanInput.trim();
    if (!val) return;

    const match = salesUsers.find(
      (u) => salesDisplayName(u).toLowerCase() === val.toLowerCase()
    );

    if (!match) {
      setSalesUserError("Pilih nama karyawan dari daftar Sales");
      return;
    }

    const exists = selectedSalesUsers.some(
      (u) => salesDisplayName(u).toLowerCase() === val.toLowerCase()
    );

    if (exists) {
      setSalesUserError("Karyawan ini sudah ditambahkan");
      return;
    }

    setSelectedSalesUsers((prev) => [...prev, match]);
    setKaryawanInput("");
    setSalesUserError("");
  };

  const removeSalesKaryawan = (karyawanName) => {
    setSelectedSalesUsers((prev) =>
      prev.filter((u) => salesDisplayName(u).toLowerCase() !== karyawanName.toLowerCase())
    );
  };

  const addInviteUser = () => {
    const val = inviteUserInput.trim();
    if (!val) return;

    const match = inviteUsers.find(
      (u) => inviteDisplayName(u).toLowerCase() === val.toLowerCase()
    );
    if (!match) {
      setInviteUserError("Pilih akun user dari daftar yang tersedia");
      return;
    }

    const exists = selectedInviteUsers.some((u) => Number(u.id) === Number(match.id));
    if (exists) {
      setInviteUserError("Akun user ini sudah ditambahkan");
      return;
    }

    setSelectedInviteUsers((prev) => [...prev, match]);
    setInviteUserInput("");
    setInviteUserError("");
  };

  const removeInviteUser = (userId) => {
    setSelectedInviteUsers((prev) => prev.filter((u) => Number(u.id) !== Number(userId)));
  };

  const getFinalInviteNamesForSubmit = () => {
    const selected = [...selectedInviteUsers];
    const pending = inviteUserInput.trim();
    if (pending) {
      const match = inviteUsers.find(
        (u) => inviteDisplayName(u).toLowerCase() === pending.toLowerCase()
      );
      if (match) {
        const exists = selected.some((u) => Number(u.id) === Number(match.id));
        if (!exists) selected.push(match);
      }
    }
    return selected
      .map((u) => inviteDisplayName(u))
      .filter((v) => String(v || "").trim() !== "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManageProject) {
      alert("Tidak ada akses");
      return;
    }

    if (selectedSalesUsers.length === 0) {
      alert("Pilih minimal 1 karyawan dari daftar akun Sales.");
      return;
    }

    const needsDivisi = role === "super_admin" || divisiUser === "Sales";
    if (needsDivisi && !form.divisi) {
      alert("Pilih divisi project terlebih dahulu.");
      return;
    }

    const karyawanNames = selectedSalesUsers.map(salesDisplayName).join(", ");
    const finalInviteNames = getFinalInviteNamesForSubmit();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries({
        sender_divisi: currentDivisi || divisiUser || "",
        divisi:
          role === "super_admin"
            ? form.divisi
            : divisiUser === "Sales"
              ? form.divisi
              : divisiUser,
        jenis_pekerjaan: form.jenis_pekerjaan,
        karyawan: karyawanNames,
        alamat: form.alamat,
        status: form.status,
        start_date: form.start_date,
        problem_description: form.problem_description,
        barang_dibeli: form.barang_dibeli,
        file_folder_name: form.file_folder_name,
        photo_folder_name: form.photo_folder_name,
        invited_user_ids: finalInviteNames,
      }).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          val.forEach((item) => formData.append(`${key}[]`, String(item)));
        } else {
          formData.append(key, val || "");
        }
      });

      const createRes = await api.post("/projek-kerja", formData);
      if (createRes?.data?.success === false) {
        throw new Error(createRes?.data?.message || "Gagal simpan data");
      }
      alert("Data berhasil disimpan");
      setForm(initialForm);
      setSelectedInviteUsers([]);
      setInviteUserInput("");
      setInviteUserError("");
      if (createRes?.data?.data) {
        setDataList((prev) => [createRes.data.data, ...prev].sort((a, b) => b.id - a.id));
      }
      fetchData();
    } catch (err) {
      console.error("Error response:", err.response?.data);
      const errorMsg = err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join("\n") : null) ||
        "Gagal simpan data";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Dibuat": return "bg-gray-100 text-gray-700 border-gray-400";
      case "Persiapan": return "bg-blue-100 text-blue-700 border-blue-400";
      case "Proses Pekerjaan": return "bg-yellow-100 text-yellow-700 border-yellow-400";
      case "Editing": return "bg-purple-100 text-purple-700 border-purple-400";
      case "Invoicing": return "bg-indigo-100 text-indigo-700 border-indigo-400";
      case "Selesai": return "bg-green-100 text-green-700 border-green-400";
      default: return "bg-gray-100 text-gray-700 border-gray-400";
    }
  };

  const displayStatus = (status) => {
    const map = {
      Dibuat: "Created",
      Persiapan: "Preparation",
      "Proses Pekerjaan": "Work In Progress",
      Editing: "Editing",
      Invoicing: "Invoicing",
      Selesai: "Completed",
      Terlambat: "Delayed",
      Proses: "In Progress",
    };
    if (language !== "en") return status;
    return map[status] || status;
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/projek-kerja/${id}/status`, { status });
      fetchData();
    } catch {
      alert("Gagal update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus project ini?")) return;
    try {
      await api.delete(`/projek-kerja/${id}`);
      fetchData();
    } catch {
      alert("Gagal hapus data");
    }
  };

  const handleViewPhoto = (id) => {
    const base = role === "super_admin" ? "/super_admin" : role === "user" ? "/user" : "/admin";
    navigate(`${base}/projek-kerja/foto/${id}`);
  };

  const handleUpdateDesc = async () => {
    try {
      if (!canEditCurrentProject) {
        alert("Anda tidak punya akses untuk mengubah project ini.");
        return;
      }
      await api.patch(`/projek-kerja/${currentId}/deskripsi`, {
        problem_description: newDesc
      });
      setDescText(newDesc);
      setEditDesc(false);
      setShowDesc(false);
      fetchData();
    } catch (err) {
      console.log(err.response);
      alert("Gagal update deskripsi");
    }
  };

  const handleUpdateBarang = async () => {
    if (!currentId) return;
    try {
      if (!canEditCurrentProject) {
        alert("Anda tidak punya akses untuk mengubah project ini.");
        return;
      }
      const item = dataList.find(i => i.id === currentId);
      if (!item) return;

      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('divisi', item.divisi);
      formData.append('jenis_pekerjaan', item.jenis_pekerjaan);
      formData.append('karyawan', item.karyawan);
      formData.append('alamat', item.alamat);
      formData.append('status', item.status);
      formData.append('start_date', item.start_date.split('T')[0]);
      formData.append('problem_description', item.problem_description);
      formData.append('barang_dibeli', newBarang);

      await api.post(`/projek-kerja/${currentId}`, formData);

      setBarangText(newBarang);
      setEditBarang(false);
      setShowBarangModal(false);
      fetchData();
    } catch (err) {
      console.error("Update barang error:", err.response?.data || err.message);
      alert("Gagal update barang: " + (err.response?.data?.message || err.message));
    }
  };

  const openTimelineModal = (item) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setShowTimelineModal(true);
  };

  const goToEditProjectPage = (item) => {
    navigate(`${basePath}/projek-kerja/edit/${item.id}`);
  };

  const formatRupiah = (amount) => {
    const value = Number(amount || 0);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const normalizeBiayaRows = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return [emptyBiayaRow()];
    const result = arr.map((r) => ({
      nominal: nominalApiToInput(r.nominal),
      keterangan: r.keterangan ?? "",
      is_lunas: Boolean(r.is_lunas),
      oleh: r.oleh ?? "",
      created_at: r.created_at ?? new Date().toISOString(),
      photoFiles: [],
      photoPaths: r.photo_paths ?? [],
    }));
    console.log("normalizeBiayaRows result:", result);
    return result;
  };

  const sumBiayaRows = (rows) =>
    rows.reduce((acc, r) => acc + parseRibuanId(r.nominal), 0);

  const displayBiayaRows = (rows) =>
    rows.filter(
      (r) =>
        parseRibuanId(r.nominal) > 0 ||
        (r.keterangan && String(r.keterangan).trim() !== "")
    );

  const biayaToPayload = (rows) => {
    const result = rows.map((r) => ({
      nominal: parseRibuanId(r.nominal),
      keterangan: (r.keterangan || "").trim(),
      is_lunas: Boolean(r.is_lunas),
      oleh: (r.oleh || user?.name || "").trim(),
      created_at: r.created_at || new Date().toISOString(),
      photo_paths: r.photoPaths || [],
    }));
    console.log("biayaToPayload result:", result);
    return result;
  };

  const openUangModal = (item) => {
    setCurrentId(item.id);
    setBiayaEdit({
      jalan: normalizeBiayaRows(item.biaya_jalan_items),
      pengeluaran: normalizeBiayaRows(item.biaya_pengeluaran_items),
      reimbursment: normalizeBiayaRows(item.biaya_reimbursment_items),
    });
    setEditUang(false);
    setShowUangModal(true);
  };

  const addBiayaRow = (key) => {
    setBiayaEdit((prev) => ({
      ...prev,
      [key]: [...prev[key], emptyBiayaRow()],
    }));
  };

  const removeBiayaRow = (key, index) => {
    setDeleteBiayaRowAction({ key, index });
    setShowDeleteBiayaRowModal(true);
  };

  const executeDeleteBiayaRow = () => {
    if (!deleteBiayaRowAction) return;
    const { key, index } = deleteBiayaRowAction;

    setBiayaEdit((prev) => {
      const next = [...prev[key]];
      if (next.length <= 1) {
        // Jika hanya ada 1 baris, ganti dengan baris kosong
        next[0] = emptyBiayaRow();
      } else {
        next.splice(index, 1);
      }
      return { ...prev, [key]: next };
    });

    setShowDeleteBiayaRowModal(false);
    setDeleteBiayaRowAction(null);
  };

  const handlePhotoSelection = async (kategori, rowIndex, fileList) => {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;

    const key = `${kategori}_${rowIndex}`;
    setCompressingPhotoKey(key);
    try {
      const compressed = await Promise.all(files.map((file) => compressImage(file)));
      setBiayaEdit((prev) => {
        const next = [...prev[kategori]];
        next[rowIndex] = { ...next[rowIndex], photoFiles: compressed };
        return { ...prev, [kategori]: next };
      });
    } catch (err) {
      console.error("Gagal kompres foto:", err);
      alert("Gagal kompres foto. Silakan coba lagi.");
    } finally {
      setCompressingPhotoKey((current) => (current === key ? null : current));
    }
  };

  const handleRemovePhoto = (kategori, rowIndex, fileIndex) => {
    setBiayaEdit((prev) => {
      const next = [...prev[kategori]];
      const row = { ...next[rowIndex] };
      const newPhotoFiles = [...(row.photoFiles || [])];
      newPhotoFiles.splice(fileIndex, 1);
      row.photoFiles = newPhotoFiles;
      next[rowIndex] = row;
      return { ...prev, [kategori]: next };
    });
  };

  const updateBiayaCell = (key, index, field, value) => {
    setBiayaEdit((prev) => {
      const next = [...prev[key]];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, [key]: next };
    });
  };

  const handleUpdateUang = async () => {
    if (!currentId) return;
    const item = dataList.find(i => i.id === currentId);
    if (!canEditCurrentBiayaProject) {
      alert("Anda tidak punya akses untuk mengubah project ini.");
      return;
    }

    try {
      // Cek apakah ada foto yang perlu diupload
      const hasPhotos = biayaEdit.pengeluaran.some(r => r.photoFiles?.length > 0) ||
                          biayaEdit.reimbursment.some(r => r.photoFiles?.length > 0);

      if (hasPhotos) {
        // Gunakan FormData untuk upload foto
        const fd = new FormData();
        // Multipart untuk PATCH sering tidak terbaca di PHP.
        // Kirim sebagai POST + method spoofing agar Laravel tetap memproses sebagai PATCH.
        fd.append("_method", "PATCH");

        console.log("Data biaya yang akan dikirim:", {
          jalan: biayaEdit.jalan,
          pengeluaran: biayaEdit.pengeluaran,
          reimbursment: biayaEdit.reimbursment,
        });

        // Cek detail foto untuk logging
        const pengeluaranPhotosCount = biayaEdit.pengeluaran.reduce((sum, row) => sum + (row.photoFiles?.length || 0), 0);
        const reimbursmentPhotosCount = biayaEdit.reimbursment.reduce((sum, row) => sum + (row.photoFiles?.length || 0), 0);
        console.log(`Total foto yang akan dikirim: pengeluaran=${pengeluaranPhotosCount}, reimbursment=${reimbursmentPhotosCount}`);

        // Tampilkan detail foto yang ada untuk setiap baris
        biayaEdit.pengeluaran.forEach((row, idx) => {
          if (row.photoFiles?.length > 0) {
            console.log(`Foto pengeluaran baris ${idx}:`, row.photoFiles.map(f => f.name));
          }
        });
        biayaEdit.reimbursment.forEach((row, idx) => {
          if (row.photoFiles?.length > 0) {
            console.log(`Foto reimbursment baris ${idx}:`, row.photoFiles.map(f => f.name));
          }
        });

        // Validasi minimal 1 baris valid per kategori
        const jalanValid = biayaEdit.jalan.some(r => parseRibuanId(r.nominal) > 0 || (r.keterangan && String(r.keterangan).trim() !== ""));
        const pengeluaranValid = biayaEdit.pengeluaran.some(r => parseRibuanId(r.nominal) > 0 || (r.keterangan && String(r.keterangan).trim() !== "") || (r.photoFiles?.length > 0));
        const reimbursmentValid = biayaEdit.reimbursment.some(r => parseRibuanId(r.nominal) > 0 || (r.keterangan && String(r.keterangan).trim() !== "") || (r.photoFiles?.length > 0));

        if (!jalanValid && !pengeluaranValid && !reimbursmentValid) {
          alert("Minimal ada satu data biaya yang valid (nominal > 0 atau keterangan tidak kosong atau ada foto).");
          return;
        }

        // Tambah data biaya sebagai array langsung, bukan JSON string
        biayaToPayload(biayaEdit.jalan).forEach((item, idx) => {
          Object.keys(item).forEach(key => {
            // Skip photo_paths - akan dihandle terpisah
            if (key === 'photo_paths') return;
            // Untuk is_lunas, kirim sebagai string "1" atau "0" agar validasi Laravel bisa membaca sebagai boolean
            const value = key === 'is_lunas' ? (item[key] ? '1' : '0') : item[key];
            fd.append(`biaya_jalan_items[${idx}][${key}]`, value);
          });
        });
        biayaToPayload(biayaEdit.pengeluaran).forEach((item, idx) => {
          Object.keys(item).forEach(key => {
            // Skip photo_paths - akan dihandle terpisah
            if (key === 'photo_paths') return;
            // Untuk is_lunas, kirim sebagai string "1" atau "0" agar validasi Laravel bisa membaca sebagai boolean
            const value = key === 'is_lunas' ? (item[key] ? '1' : '0') : item[key];
            fd.append(`biaya_pengeluaran_items[${idx}][${key}]`, value);
          });
          // Kirim photo_paths sebagai array terpisah
          if (item.photo_paths && Array.isArray(item.photo_paths)) {
            item.photo_paths.forEach((path, pathIdx) => {
              fd.append(`biaya_pengeluaran_items[${idx}][photo_paths][${pathIdx}]`, path);
            });
          }
        });
        biayaToPayload(biayaEdit.reimbursment).forEach((item, idx) => {
          Object.keys(item).forEach(key => {
            // Skip photo_paths - akan dihandle terpisah
            if (key === 'photo_paths') return;
            // Untuk is_lunas, kirim sebagai string "1" atau "0" agar validasi Laravel bisa membaca sebagai boolean
            const value = key === 'is_lunas' ? (item[key] ? '1' : '0') : item[key];
            fd.append(`biaya_reimbursment_items[${idx}][${key}]`, value);
          });
          // Kirim photo_paths sebagai array terpisah
          if (item.photo_paths && Array.isArray(item.photo_paths)) {
            item.photo_paths.forEach((path, pathIdx) => {
              fd.append(`biaya_reimbursment_items[${idx}][photo_paths][${pathIdx}]`, path);
            });
          }
        });

        // Tambah foto untuk setiap baris pengeluaran
        biayaEdit.pengeluaran.forEach((row, idx) => {
          if (row.photoFiles?.length > 0) {
            console.log(`Menambahkan ${row.photoFiles.length} foto ke pengeluaran baris ${idx}`);
            row.photoFiles.forEach((file, fileIdx) => {
              console.log(`  - fd.append('pengeluaran_photos[${idx}][${fileIdx}]', ${file.name})`);
              fd.append(`pengeluaran_photos[${idx}][${fileIdx}]`, file);
            });
          }
        });

        // Tambah foto untuk setiap baris reimbursment
        biayaEdit.reimbursment.forEach((row, idx) => {
          if (row.photoFiles?.length > 0) {
            console.log(`Menambahkan ${row.photoFiles.length} foto ke reimbursment baris ${idx}`);
            row.photoFiles.forEach((file, fileIdx) => {
              console.log(`  - fd.append('reimbursment_photos[${idx}][${fileIdx}]', ${file.name})`);
              fd.append(`reimbursment_photos[${idx}][${fileIdx}]`, file);
            });
          }
        });

        console.log("FormData entries sebelum dikirim:");
        for (let [key, value] of fd.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: ${value.name} (${(value.size / 1024).toFixed(2)} KB)`);
          }
        }

        await api.post(`/projek-kerja/${currentId}/uang`, fd);
      } else {
        // Tanpa foto, kirim JSON biasa
        await api.patch(`/projek-kerja/${currentId}/uang`, {
          biaya_jalan_items: biayaToPayload(biayaEdit.jalan),
          biaya_pengeluaran_items: biayaToPayload(biayaEdit.pengeluaran),
          biaya_reimbursment_items: biayaToPayload(biayaEdit.reimbursment),
        });
      }

      setEditUang(false);
      setShowUangModal(false);
      fetchData();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join("\n")
          : null) ||
        "Gagal menyimpan data biaya";
      alert(msg);
    }
  };

  const handleExportBiaya = async () => {
    if (!currentId) return;
    try {
      const res = await api.get(`/projek-kerja/${currentId}/export-biaya`, {
        responseType: "blob",
      });
      const dispo = res.headers["content-disposition"];
      let filename = `biaya-projek-${currentId}.csv`;
      if (dispo && dispo.includes("filename=")) {
        const m = dispo.match(/filename="?([^";]+)"?/i);
        if (m) filename = m[1];
      }
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengunduh file");
    }
  };

  const handleSetLunas = (item, nextLunas) => {
    if (role !== "super_admin") return;

    const newStatus = nextLunas;
    const statusText = newStatus ? "Lunas" : "Belum Lunas";

    setLunasConfirmAction({
      type: "project",
      item,
      newStatus,
      statusText,
    });
    setShowLunasConfirmModal(true);
  };

  const handleConfirmProjectLunas = async () => {
    if (!lunasConfirmAction) return;
    const { item, newStatus } = lunasConfirmAction;

    try {
      await api.patch(`/projek-kerja/${item.id}/lunas`, { is_lunas: newStatus });
      fetchData();
      if (currentId === item.id) {
        setEditUang(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal update status lunas";
      alert(msg);
    } finally {
      setShowLunasConfirmModal(false);
      setLunasConfirmAction(null);
    }
  };

  const handleToggleItemLunas = async (kategoriKey, index) => {
    if (role !== "super_admin" || !currentId) return;
    const item = dataList.find((i) => i.id === currentId);
    if (!item) return;

    const toRows = (rows) =>
      (Array.isArray(rows) ? rows : []).map((r) => ({
        nominal: Number.isFinite(Number(r?.nominal)) ? Number(r.nominal) : 0,
        keterangan: String(r?.keterangan || ""),
        is_lunas: Boolean(r?.is_lunas),
        oleh: r?.oleh || "",
        created_at: r?.created_at || "",
      }));

    const payload = {
      biaya_jalan_items: toRows(item.biaya_jalan_items),
      biaya_pengeluaran_items: toRows(item.biaya_pengeluaran_items),
      biaya_reimbursment_items: toRows(item.biaya_reimbursment_items),
    };

    const mapKey = {
      jalan: "biaya_jalan_items",
      pengeluaran: "biaya_pengeluaran_items",
      reimbursment: "biaya_reimbursment_items",
    };
    const field = mapKey[kategoriKey];
    if (!field || !payload[field]?.[index]) return;

    const currentLunas = payload[field][index].is_lunas;
    const newStatus = !currentLunas;
    const statusText = newStatus ? "Lunas" : "Belum Lunas";

    setLunasConfirmAction({
      type: "item",
      kategoriKey,
      index,
      payload,
      field,
      newStatus,
      statusText,
      nominal: payload[field][index].nominal,
      keterangan: payload[field][index].keterangan,
    });
    setShowLunasConfirmModal(true);
  };

  const handleConfirmItemLunas = async () => {
    if (!lunasConfirmAction) return;
    const { kategoriKey, index, payload, field, newStatus } = lunasConfirmAction;

    payload[field][index].is_lunas = newStatus;

    setBiayaEdit((prev) => ({
      ...prev,
      [kategoriKey]: (prev[kategoriKey] || []).map((r, i) =>
        i === index ? { ...r, is_lunas: newStatus } : r
      ),
    }));

    try {
      await api.patch(`/projek-kerja/${currentId}/uang`, payload);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal update lunas per item";
      alert(msg);
    } finally {
      setShowLunasConfirmModal(false);
      setLunasConfirmAction(null);
    }
  };

  const handleCancelLunasConfirm = () => {
    setShowLunasConfirmModal(false);
    setLunasConfirmAction(null);
  };

  const handleSaveStatus = async () => {
    if (!selectedItem) return;
    if (!canEditTimelineProject) {
      alert("Anda tidak punya akses untuk mengubah project ini.");
      return;
    }
    await handleStatusChange(selectedItem.id, newStatus);
    setShowTimelineModal(false);
  };

  const renderTimelineStep = (label, isActive, date, isLast = false) => {
    return (
      <div className="flex items-start gap-3 relative">
        <div className="flex flex-col items-center">
          <div className={`w-5 h-5 rounded-full border-2 ${isActive ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`} />
          {!isLast && <div className="w-0.5 h-10 bg-gray-300 my-1" />}
        </div>
        <div className="pb-4">
          <p className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{label}</p>
          {date && <p className="text-xs text-gray-400">{date}</p>}
        </div>
      </div>
    );
  };

  const renderStatusHistoryTimeline = (item) => {
    const history = item.status_history || [];
    const statusOrder = ["Dibuat", "Persiapan", "Proses Pekerjaan", "Editing", "Invoicing", "Selesai"];

    if (history.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 text-sm">
          Belum ada riwayat status
        </div>
      );
    }

    return (
      <div className="ml-2">
        {history.map((entry, index) => {
          const isLast = index === history.length - 1;
          const isCurrentStatus = entry.status === item.status;
          const dateStr = new Date(entry.updated_at).toLocaleString("id-ID", {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div key={index} className="flex items-start gap-3 relative">
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full border-2 ${isCurrentStatus ? 'bg-blue-600 border-blue-600' : 'bg-green-100 border-green-400'}`} />
                {!isLast && <div className="w-0.5 h-10 bg-gray-300 my-1" />}
              </div>
              <div className="pb-4">
                <p className={`font-medium ${isCurrentStatus ? 'text-blue-600' : 'text-gray-700'}`}>
                  {entry.status}
                  {isCurrentStatus && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Sedang berjalan</span>}
                </p>
                <p className="text-xs text-gray-400">{dateStr}</p>
                {entry.updated_by && (
                  <p className="text-xs text-gray-500 mt-1">
                    Oleh: <span className="font-medium">{entry.updated_by}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Super admin:
   * - di konteks /seles atau /selesai: hanya status selesai
   * - di halaman projek biasa: tampilkan semua status
   */
  const filteredData = dataList.filter((item) => {
    if (role === "super_admin") {
      if (isArchiveContext && !item.is_archived) {
        return false;
      }
      if (isSelesaiContext && String(item.status || "").trim().toLowerCase() !== "selesai") {
        return false;
      }
      // Untuk super admin, project tetap terlihat di divisi asal/tujuan berdasarkan riwayat divisi_flow.
      // Jadi saat project dioper, tidak hilang dari daftar divisi yang pernah menangani.
      if (currentDivisi && !projectRelatedToDivisi(item, currentDivisi)) {
        return false;
      }
    }
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      item.divisi?.toLowerCase().includes(term) ||
      item.jenis_pekerjaan?.toLowerCase().includes(term) ||
      item.karyawan?.toLowerCase().includes(term) ||
      item.alamat?.toLowerCase().includes(term) ||
      item.status?.toLowerCase().includes(term) ||
      (item.barang_dibeli && item.barang_dibeli.toLowerCase().includes(term))
    );
  });

  // Pagination logic
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const currentProject = dataList.find((i) => i.id === currentId);
  const canEditCurrentProject = canEditProjectByDivisi(currentProject?.divisi);
  const canEditCurrentBiayaProject = canEditBiayaAction(currentProject);
  const canEditTimelineProject = canEditProjectByDivisi(selectedItem?.divisi);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-12 p-4 lg:p-6 w-full max-w-full overflow-x-hidden">

      {/* ================= FORM ================= */}
      {!isArchiveContext && canManageProject && (role === "super_admin" || divisiUser === "Sales") && (
        <div className="bg-white rounded-3xl shadow-xl border p-4 sm:p-8 min-w-0 overflow-x-hidden">
          <div className="mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Briefcase className="text-blue-600" />
              {tr("Tambah Projek Kerja", "Add Work Project")}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {tr("Tambahkan data projek kerja baru ke dalam sistem", "Add new work project data into the system")}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative grid min-w-0 grid-cols-1 md:grid-cols-2 gap-6 [&>*]:min-w-0"
            encType="multipart/form-data"
          >
            {loading && (
              <div className="absolute inset-0 z-20 bg-white/75 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                <div className="flex flex-col items-center gap-2 text-blue-700">
                  <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium">Menyimpan...</p>
                </div>
              </div>
            )}
            {role === "super_admin" || divisiUser === "Sales" ? (
              selectedSalesUsers.length === 0 ? (
                <input
                  disabled
                  value={tr("Pilih karyawan Sales dulu", "Select Sales employee first")}
                  className="border p-3 rounded-xl bg-gray-100"
                />
              ) : (
                <select
                  name="divisi"
                  value={form.divisi}
                  onChange={handleChange}
                  className="border p-3 rounded-xl focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">{tr("Pilih Divisi", "Select Division")}</option>
                  <option value="IT">IT</option>
                  <option value="Service">Service</option>
                  <option value="Kontraktor">Kontraktor</option>
                  <option value="Sales">Sales</option>
                  <option value="Logistik">Logistik</option>
                  <option value="Purchasing">Purchasing</option>
                </select>
              )
            ) : (
              <input value={divisiUser} disabled className="border p-3 rounded-xl bg-gray-100" />
            )}

            <div className="relative">
              <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="jenis_pekerjaan"
                value={form.jenis_pekerjaan}
                onChange={handleChange}
                placeholder="Jenis Pekerjaan"
                placeholder={tr("Jenis Pekerjaan", "Work Type")}
                className="border pl-10 p-3 rounded-xl w-full"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {tr("Karyawan (Sales)", "Employee (Sales)")}
              </label>
              <div className="flex gap-2">
                <select
                  value={karyawanInput}
                  onChange={handleKaryawanChange}
                  className="border p-3 rounded-xl w-full"
                  disabled={salesUsersLoading}
                >
                  <option value="">
                    {salesUsersLoading
                      ? tr("Memuat karyawan...", "Loading employees...")
                      : tr("Pilih karyawan Sales...", "Select Sales employee...")}
                  </option>
                  {salesUsers.map((u) => (
                    <option key={u.id} value={salesDisplayName(u)}>
                      {salesDisplayName(u)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addSalesKaryawan}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-xl disabled:opacity-50"
                  disabled={salesUsersLoading || !karyawanInput}
                >
                  {tr("Tambah", "Add")}
                </button>
              </div>
              {salesUserError ? (
                <p className="text-[11px] text-red-600 mt-1">{salesUserError}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedSalesUsers.map((user, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs border border-blue-200"
                  >
                    {salesDisplayName(user)}
                    <button
                      type="button"
                      onClick={() => removeSalesKaryawan(salesDisplayName(user))}
                      className="text-red-600 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {tr("Invite User (Monitoring)", "Invite User (Monitoring)")}
              </label>
              <div className="flex gap-2">
                <select
                  value={inviteUserInput}
                  onChange={(e) => setInviteUserInput(e.target.value)}
                  className="border p-3 rounded-xl w-full"
                  disabled={salesUsersLoading}
                >
                  <option value="">
                    {salesUsersLoading
                      ? tr("Memuat akun user...", "Loading user accounts...")
                      : tr("Pilih akun user untuk monitoring", "Select user account for monitoring")}
                  </option>
                  {inviteUsers.map((u) => (
                    <option key={u.id} value={inviteDisplayName(u)}>
                      {inviteDisplayName(u)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addInviteUser}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded-xl disabled:opacity-50"
                  disabled={salesUsersLoading || !inviteUserInput}
                >
                  Invite
                </button>
              </div>
              {inviteUserError ? (
                <p className="text-[11px] text-red-600 mt-1">{inviteUserError}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedInviteUsers.map((inviteUser) => (
                  <span
                    key={inviteUser.id}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs border border-indigo-200"
                  >
                    {inviteDisplayName(inviteUser)}
                    <button
                      type="button"
                      onClick={() => removeInviteUser(inviteUser.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="alamat"
                value={form.alamat}
                onChange={handleChange}
                placeholder="Lokasi"
                placeholder={tr("Lokasi", "Location")}
                className="border pl-10 p-3 rounded-xl w-full"
              />
            </div>

            <div className="relative mx-auto min-w-0 w-full max-w-[min(100%,17rem)] overflow-hidden md:mx-0 md:max-w-none">
              <Calendar
                className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className="projek-kerja-date-input w-full min-w-0 max-w-full shrink rounded-xl border pl-10 pr-3 text-base leading-none outline-none focus:ring-2 focus:ring-blue-400/40"
                required
              />
            </div>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="border p-3 rounded-xl"
            >
              <option value="Dibuat">{tr("Dibuat", "Created")}</option>
              <option value="Persiapan">{tr("Persiapan", "Preparation")}</option>
              <option value="Proses Pekerjaan">{tr("Proses Pekerjaan", "Work In Progress")}</option>
              <option value="Editing">Editing</option>
              <option value="Invoicing">Invoicing</option>
              <option value="Selesai">{tr("Selesai", "Completed")}</option>
            </select>

            <input
              name="file_folder_name"
              value={form.file_folder_name}
              onChange={handleChange}
              placeholder={tr("Folder Dokumen awal (opsional)", "Initial Document Folder (optional)")}
              className="border p-3 rounded-xl"
            />

            <input
              name="photo_folder_name"
              value={form.photo_folder_name}
              onChange={handleChange}
              placeholder={tr("Folder Foto awal (opsional)", "Initial Photo Folder (optional)")}
              className="border p-3 rounded-xl"
            />

            <textarea
              name="problem_description"
              value={form.problem_description}
              onChange={handleChange}
              placeholder={tr("Deskripsi", "Description")}
              className="border p-3 rounded-xl md:col-span-2"
            />

            {/* Barang Dibeli */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <ShoppingCart size={16} className="text-blue-600" />
                {tr("Barang yang Dibeli", "Purchased Items")}
              </label>
              <textarea
                name="barang_dibeli"
                value={form.barang_dibeli}
                onChange={handleChange}
                placeholder={tr("Contoh: 2 pcs kabel HDMI, 1 unit monitor, dll.", "Example: 2 HDMI cables, 1 monitor unit, etc.")}
                className="border p-3 rounded-xl w-full"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                salesUsersLoading ||
                selectedSalesUsers.length === 0 ||
                ((role === "super_admin" || divisiUser === "Sales") && !form.divisi)
              }
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3 rounded-xl md:col-span-2 font-semibold shadow-lg transition disabled:opacity-60"
            >
              {loading ? tr("Menyimpan...", "Saving...") : tr("Simpan Projek", "Save Project")}
            </button>
          </form>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-md p-4 lg:p-8 border" style={{ maxWidth: '100%' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="text-blue-600" />
              {tr("Data Projek Kerja", "Project Data")}
            </h2>
            {role === "super_admin" && isSelesaiContext ? (
              <p className="text-xs text-gray-500 mt-1">
                Hanya proyek status <span className="font-medium text-gray-700">Selesai</span>
                {currentDivisi ? (
                  <>
                    {" · "}
                    divisi <span className="font-medium text-gray-700">{divisiLabel(currentDivisi)}</span>
                  </>
                ) : (
                  <> · semua divisi</>
                )}
              </p>
            ) : null}
            {isArchiveContext ? (
              <p className="text-xs text-gray-500 mt-1">
                Menampilkan proyek yang sudah di-<span className="font-medium text-gray-700">archive</span>.
              </p>
            ) : null}
          </div>
          <div className="relative mt-2 sm:mt-0 w-full sm:w-64 shrink-0">
            <input
              type="text"
              placeholder={tr("Cari divisi, tugas, karyawan, lokasi, status...", "Search division, task, employee, location, status...")}
              value={searchTerm}
              onChange={handleSearchChange}
              className="border rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-blue-400"
            />
            <svg
              className="absolute left-3 top-2.5 text-gray-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="text-sm" style={{ minWidth: '1280px', width: '100%', tableLayout: 'fixed' }}>
            <thead className="bg-gray-100 text-gray-700">
              <tr className="text-left">
                <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: '90px' }}>
                  <Building size={16} className="inline mr-1 text-gray-400" /> {tr("Divisi", "Division")}
                </th>
                <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: '220px' }}>
                  <Briefcase size={16} className="inline mr-1 text-gray-400" /> {tr("Tugas", "Task")}
                </th>
                <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: '150px' }}>
                  <User size={16} className="inline mr-1 text-gray-400" /> {tr("Karyawan", "Employee")}
                </th>
                <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: '180px' }}>
                  <MapPin size={16} className="inline mr-1 text-gray-400" /> {tr("Lokasi", "Location")}
                </th>
                <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: '110px' }}>
                  <Calendar size={16} className="inline mr-1 text-gray-400" /> {tr("Tanggal", "Date")}
                </th>
                <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: '120px' }}>
                  <FileText size={16} className="inline mr-1 text-gray-400" /> {tr("Deskripsi", "Description")}
                </th>
                <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: '110px' }}>
                  <ShoppingCart size={16} className="inline mr-1 text-gray-400" /> {tr("Barang", "Items")}
                </th>
                <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: '140px' }}>
                  <Activity size={16} className="inline mr-1 text-gray-400" /> {tr("Status", "Status")}
                </th>
                <th className="p-2.5 font-semibold text-center whitespace-nowrap" style={{ width: '160px' }}>
                  <Settings size={16} className="inline mr-1 text-gray-400" /> {tr("Aksi", "Actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-2.5">
                    <select
                      className="border rounded-lg px-2 py-1 text-xs bg-white w-full"
                      value={divisiKey(item.divisi)}
                      title="Divisi yang pernah terlibat (klik untuk lihat)"
                      onChange={(e) => {
                        e.target.value = divisiKey(item.divisi);
                      }}
                    >
                      {Array.isArray(item.divisi_flow) && item.divisi_flow.length > 0 ? (
                        item.divisi_flow.map((d, idx) => (
                          <option key={`${d}-${idx}`} value={divisiKey(d)}>
                            {divisiLabel(d)}
                          </option>
                        ))
                      ) : (
                        <option value={divisiKey(item.divisi)}>{divisiLabel(item.divisi)}</option>
                      )}
                    </select>
                  </td>
                  <td className="p-2.5 font-medium truncate">{item.jenis_pekerjaan}</td>
                  <td className="p-2.5">
                    {(() => {
                      const karyawanList = karyawanProjectList(item);
                      const currentName = getCurrentKaryawanName(item);
                      if (karyawanList.length <= 1) {
                        return <span className="truncate block">{currentName || "-"}</span>;
                      }
                      return (
                        <select
                          className="border rounded-lg px-2 py-1 text-xs bg-white w-full"
                          value={currentName}
                          onChange={(e) => {
                            e.target.value = currentName;
                          }}
                          title="Karyawan yang terlibat di project"
                        >
                          {karyawanList.map((nama, idx) => (
                            <option key={`${nama}-${idx}`} value={nama}>
                              {invitedUserSet(item).has(String(nama || "").trim()) ? `${nama} (Tamu)` : nama}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </td>
                  <td className="p-2.5 truncate">{item.alamat}</td>
                  <td className="p-2.5 whitespace-nowrap">{new Date(item.start_date).toLocaleDateString("id-ID")}</td>
                  <td className="p-2.5">
                    {item.problem_description ? (
                      <button
                        onClick={() => {
                          setDescText(item.problem_description);
                          setNewDesc(item.problem_description);
                          setCurrentId(item.id);
                          setEditDesc(false);
                          setShowDesc(true);
                        }}
                        className="px-2 py-1 rounded-lg text-xs border flex items-center gap-1 hover:bg-gray-100"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">{tr("Lihat", "View")}</span>
                      </button>
                    ) : "-"}
                  </td>
                  <td className="p-2.5">
                    {item.barang_dibeli ? (
                      <button
                        onClick={() => {
                          setBarangText(item.barang_dibeli);
                          setNewBarang(item.barang_dibeli);
                          setCurrentId(item.id);
                          setEditBarang(false);
                          setShowBarangModal(true);
                        }}
                        className="px-2 py-1 rounded-lg text-xs border flex items-center gap-1 hover:bg-gray-100"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">{tr("Lihat", "View")}</span>
                      </button>
                    ) : "-"}
                  </td>
                  <td className="p-2.5">
                    <button
                      onClick={() => openTimelineModal(item)}
                      className={`px-2 py-1 rounded-full text-xs border cursor-pointer hover:opacity-80 transition ${getStatusColor(item.status)} whitespace-nowrap inline-block max-w-full truncate`}
                      title="Klik untuk lihat timeline"
                    >
                      {displayStatus(item.status)}
                    </button>
                  </td>
                  <td className="p-2.5">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleViewPhoto(item.id)} className="bg-gray-500 hover:bg-gray-600 text-white p-1.5 rounded-lg" title={tr("Lihat Foto", "View Photos")}>
                        <FileText size={14} />
                      </button>
                      {!isUserRole && item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg" title={tr("Download File", "Download File")}>
                          <Download size={14} />
                        </a>
                      )}
                      {!isUserRole && canOpenBiayaAction(item) && (
                        <>
                          {!isArchiveContext && canEditProjectAction(item) ? (
                            <button
                              onClick={() => goToEditProjectPage(item)}
                              className="bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg"
                              title="Edit project & oper divisi"
                            >
                              <Edit3 size={14} />
                            </button>
                          ) : null}
                          <button
                            onClick={() => openUangModal(item)}
                            className={`text-white p-1.5 rounded-lg ${item.is_lunas ? "bg-green-600 hover:bg-green-700" : "bg-yellow-500 hover:bg-yellow-600"}`}
                            title={item.is_lunas ? "Biaya (Lunas)" : "Biaya (Belum Lunas)"}
                          >
                            <DollarSign size={14} />
                          </button>
                          {isArchiveContext ? (
                            <button
                              onClick={() => handleUnarchiveProject(item)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg"
                              title={tr("Batalkan Archive", "Cancel Archive")}
                            >
                              <RotateCcw size={14} />
                            </button>
                          ) : null}
                        </>
                      )}
                      {!isUserRole && !isArchiveContext && canEditProjectAction(item) && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg"
                          title={tr("Hapus", "Delete")}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <p className="text-center text-gray-500 py-8">{tr("Tidak ada data yang cocok", "No matching data")}</p>
          )}
        </div>

        {/* ================= PAGINATION ================= */}
        {filteredData.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              {tr("Menampilkan", "Showing")} {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} {tr("dari", "of")} {totalItems} {tr("data", "records")}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                ← Prev
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL DESKRIPSI ================= */}
      {showDesc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <h3 className="text-xl font-bold mb-4">Deskripsi Pekerjaan</h3>
            {!editDesc ? (
              <>
                <p className="text-gray-700 whitespace-pre-line">{descText || "-"}</p>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setEditDesc(true)}
                    disabled={!canEditCurrentProject}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!canEditCurrentProject ? "Tidak ada akses" : undefined}
                  >
                    Edit
                  </button>
                  <button onClick={() => setShowDesc(false)} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Tutup</button>
                </div>
              </>
            ) : (
              <>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="border w-full p-3 rounded-xl h-32" />
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleUpdateDesc}
                    disabled={!canEditCurrentProject}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Simpan
                  </button>
                  <button onClick={() => setEditDesc(false)} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Batal</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL BARANG DIBELI ================= */}
      {showBarangModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingCart className="text-blue-600" />
              Barang yang Dibeli
            </h3>
            {!editBarang ? (
              <>
                <p className="text-gray-700 whitespace-pre-line">{barangText}</p>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setNewBarang(barangText);
                      setEditBarang(true);
                    }}
                    disabled={!canEditCurrentProject}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowBarangModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
                  >
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              <>
                <textarea
                  value={newBarang}
                  onChange={(e) => setNewBarang(e.target.value)}
                  className="border w-full p-3 rounded-xl h-32"
                  placeholder="Masukkan barang yang dibeli..."
                />
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleUpdateBarang}
                    disabled={!canEditCurrentProject}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setEditBarang(false)}
                    className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
                  >
                    Batal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL TIMELINE STATUS ================= */}
      {showTimelineModal && selectedItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="text-blue-600" />
              Timeline Status
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              {renderStatusHistoryTimeline(selectedItem)}
            </div>
            <div className="text-xs text-gray-500 text-center mb-4">
              Untuk mengubah status, silakan edit pekerjaan di halaman Edit
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowTimelineModal(false)} className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-lg">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL BIAYA ================= */}
      {showUangModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-6 relative my-8 max-h-[92vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <DollarSign className="text-amber-600" />
              {tr("Biaya Jalan, Pengeluaran & Reimbursment", "Travel, Expense & Reimbursement Costs")}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {tr("Tambah beberapa baris per kategori; total dihitung otomatis. Unduh ke Excel (CSV) untuk laporan.", "Add multiple rows per category; totals are calculated automatically. Download as Excel (CSV) for reporting.")}
            </p>
            {(() => {
              const item = dataList.find(i => i.id === currentId);
              if (!item?.is_lunas) return null;
              return (
                <div className="mb-4 text-xs text-amber-800 bg-amber-100 border border-amber-300 px-3 py-2 rounded-lg">
                  {tr("Status pembayaran", "Payment status")}: <span className="font-semibold">{tr("Lunas", "Paid")}</span>. {role === "super_admin" ? tr("Superadmin tetap bisa edit.", "Super admin can still edit.") : tr("Admin tidak bisa edit.", "Admin cannot edit.")}
                </div>
              );
            })()}

            {!editUang ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                  {[
                    { key: "jalan", label: tr("Biaya Jalan", "Travel Cost"), rows: biayaEdit.jalan },
                    { key: "pengeluaran", label: tr("Biaya Pengeluaran", "Expense Cost"), rows: biayaEdit.pengeluaran },
                    { key: "reimbursment", label: tr("Biaya Reimbursment", "Reimbursement Cost"), rows: biayaEdit.reimbursment },
                  ].map((col) => {
                    const shown = displayBiayaRows(
                      col.rows.map((r, idx) => ({ ...r, __idx: idx }))
                    );
                    const rowItem = dataList.find((i) => i.id === currentId);
                    const meta = rowItem?.biaya_edit_meta?.[col.key];
                    return (
                      <div key={col.key} className="border rounded-xl p-3 bg-gray-50/80">
                        <p className="font-semibold text-gray-800 mb-2">{col.label}</p>
                        {shown.length === 0 ? (
                          <p className="text-xs text-gray-400">{tr("Belum ada entri", "No entries yet")}</p>
                        ) : (
                          <ul className="space-y-1 text-gray-700 max-h-40 overflow-y-auto">
                            {shown.map((r, i) => (
                              <li key={i} className="text-xs border-b border-gray-200/80 pb-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{formatRupiah(parseRibuanId(r.nominal))}</span>
                                  {role === "super_admin" ? (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleItemLunas(col.key, r.__idx)}
                                      className={`px-1.5 py-0.5 rounded border text-[10px] ${r.is_lunas ? "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200" : "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200"}`}
                                      title={r.is_lunas ? tr("Klik untuk batalkan lunas item", "Click to mark item as unpaid") : tr("Klik untuk lunaskan item", "Click to mark item as paid")}
                                    >
                                      {r.is_lunas ? tr("Lunas", "Paid") : tr("Belum", "Unpaid")}
                                    </button>
                                  ) : (
                                    <span className={`px-1.5 py-0.5 rounded border text-[10px] ${r.is_lunas ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-yellow-100 text-yellow-700 border-yellow-300"}`}>
                                      {r.is_lunas ? tr("Lunas", "Paid") : tr("Belum", "Unpaid")}
                                    </span>
                                  )}
                                </div>
                                {r.oleh && (
                                  <span className="block text-gray-500 mt-0.5 text-[10px]">
                                    {tr("Oleh", "By")}: {r.oleh}
                                    {r.created_at && (
                                      (() => {
                                        const d = new Date(r.created_at);
                                        if (!Number.isNaN(d.getTime())) {
                                          const dateStr = d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
                                          return `, ${dateStr}`;
                                        }
                                        return "";
                                      })()
                                    )}
                                  </span>
                                )}
                                {r.keterangan ? (
                                  <span className="block text-gray-600 mt-0.5">{r.keterangan}</span>
                                ) : null}
                                {/* Tampilkan foto yang sudah tersimpan */}
                                {r.photoPaths && r.photoPaths.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {r.photoPaths.map((photoPath, photoIdx) => (
                                      <a
                                        key={photoIdx}
                                        href={`/storage/${photoPath}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] hover:bg-blue-200"
                                        title={tr("Klik untuk lihat foto", "Click to view photo")}
                                      >
                                        {tr("Foto", "Photo")} {photoIdx + 1}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className="mt-2 pt-2 border-t text-amber-800 font-semibold">
                          {tr("Subtotal", "Subtotal")}: {formatRupiah(sumBiayaRows(col.rows))}
                        </p>
                        <BiayaMetaFooter meta={meta} />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-lg font-bold text-amber-900">
                    {tr("Total keseluruhan", "Grand total")}:{" "}
                    {formatRupiah(
                      sumBiayaRows(biayaEdit.jalan) +
                      sumBiayaRows(biayaEdit.pengeluaran) +
                      sumBiayaRows(biayaEdit.reimbursment)
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-3 mt-6">
                  {role === "super_admin" && (() => {
                    const item = dataList.find(i => i.id === currentId);
                    return (
                      <button
                        type="button"
                        onClick={() => item && handleSetLunas(item, !item.is_lunas)}
                        className={`px-4 py-2 rounded-lg text-white ${item?.is_lunas ? "bg-slate-600 hover:bg-slate-700" : "bg-green-600 hover:bg-green-700"}`}
                      >
                        {item?.is_lunas ? tr("Batalkan Lunas", "Mark Unpaid") : tr("Tandai Lunas", "Mark Paid")}
                      </button>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={handleExportBiaya}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Download size={18} />
                    {tr("Unduh Excel (CSV)", "Download Excel (CSV)")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditUang(true)}
                    disabled={(() => {
                      return !canEditCurrentBiayaProject;
                    })()}
                    className={`px-4 py-2 rounded-lg text-white ${(() => {
                      const locked = !canEditCurrentBiayaProject;
                      return locked ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700";
                    })()}`}
                  >
                    {tr("Edit", "Edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUangModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
                  >
                    {tr("Tutup", "Close")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {[
                    { key: "jalan", label: tr("Biaya Jalan & Keterangan", "Travel Cost & Description"), color: "border-emerald-200 bg-emerald-50/50" },
                    { key: "pengeluaran", label: tr("Biaya Pengeluaran & Keterangan", "Expense Cost & Description"), color: "border-blue-200 bg-blue-50/50" },
                    { key: "reimbursment", label: tr("Biaya Reimbursment & Keterangan", "Reimbursement Cost & Description"), color: "border-violet-200 bg-violet-50/50" },
                  ].map((col) => {
                    const editItem = dataList.find((i) => i.id === currentId);
                    const meta = editItem?.biaya_edit_meta?.[col.key];
                    return (
                      <div key={col.key} className={`rounded-xl border p-3 ${col.color}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-gray-800">{col.label}</span>
                          <button
                            type="button"
                            onClick={() => addBiayaRow(col.key)}
                            className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-emerald-700"
                            title={tr("Tambah baris", "Add row")}
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {biayaEdit[col.key].map((row, idx) => {
                            const barisLunas = Boolean(row.is_lunas);
                            const bolehEditNominal = !barisLunas;
                            const bolehEditKeterangan = true;
                            const bolehHapus = !barisLunas || role === "super_admin";
                            return (
                              <div
                                key={idx}
                                className={`bg-white rounded-lg border p-2 space-y-2 ${barisLunas ? "border-amber-200/80 bg-amber-50/30" : ""}`}
                              >
                                {row.oleh && (
                                  <p className="text-[10px] text-gray-500">
                                    {tr("Oleh", "By")}: <span className="font-medium">{row.oleh}</span>
                                    {row.created_at && (
                                      (() => {
                                        const d = new Date(row.created_at);
                                        if (!Number.isNaN(d.getTime())) {
                                          const dateStr = d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
                                          return `, ${dateStr}`;
                                        }
                                        return "";
                                      })()
                                    )}
                                  </p>
                                )}
                                {barisLunas ? (
                                  <p className="text-[10px] text-amber-800 font-medium">
                                    {tr("Sudah lunas", "Already paid")}
                                    {role === "super_admin"
                                      ? tr(" — nominal dikunci, keterangan masih bisa diubah", " - amount is locked, description can still be edited")
                                      : tr(" — nominal dikunci, keterangan masih bisa diubah", " - amount is locked, description can still be edited")}
                                    {role === "super_admin" ? tr("; hanya super admin bisa hapus baris ini", "; only super admin can delete this row") : ""}
                                  </p>
                                ) : null}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    value={row.nominal}
                                    onChange={(e) =>
                                      updateBiayaCell(
                                        col.key,
                                        idx,
                                        "nominal",
                                        formatRibuanId(digitsOnly(e.target.value))
                                      )
                                    }
                                    readOnly={!bolehEditNominal}
                                    disabled={!bolehEditNominal}
                                    className={`border w-full p-2 rounded-lg text-sm ${!bolehEditNominal ? "bg-gray-100 text-gray-600 cursor-not-allowed" : ""}`}
                                    placeholder={tr("Biaya", "Amount")}
                                  />
                                  {bolehHapus ? (
                                    <button
                                      type="button"
                                      onClick={() => removeBiayaRow(col.key, idx)}
                                      className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                                      title={tr("Hapus baris", "Delete row")}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  ) : (
                                    <span className="p-2 shrink-0 text-[10px] text-gray-400 w-10 text-center" title={tr("Tidak bisa dihapus", "Cannot be deleted")}>
                                      —
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={row.keterangan}
                                  onChange={(e) => updateBiayaCell(col.key, idx, "keterangan", e.target.value)}
                                  readOnly={!bolehEditKeterangan}
                                  disabled={!bolehEditKeterangan}
                                  className={`border w-full p-2 rounded-lg text-sm ${!bolehEditKeterangan ? "bg-gray-100 text-gray-600 cursor-not-allowed" : ""}`}
                                  placeholder={tr("Keterangan", "Description")}
                                />
                                {/* Upload Foto - Hanya untuk Pengeluaran & Reimbursment */}
                                {(col.key === "pengeluaran" || col.key === "reimbursment") && (
                                  <div className="mt-2">
                                    <label className="block text-xs text-gray-600 mb-1">{tr("Upload Foto", "Upload Photo")}</label>
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/jpeg,image/jpg,image/png,image/webp"
                                      onChange={(e) => handlePhotoSelection(col.key, idx, e.target.files)}
                                      disabled={!bolehEditKeterangan}
                                      className="w-full text-xs border rounded-lg p-1.5 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    {compressingPhotoKey === `${col.key}_${idx}` ? (
                                      <p className="text-[11px] text-blue-600 mt-1">{tr("Sedang kompres foto...", "Compressing photos...")}</p>
                                    ) : null}
                                    {/* Tampilkan foto yang sudah diupload */}
                                    {row.photoFiles?.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {row.photoFiles.map((file, fileIdx) => (
                                          <div key={fileIdx} className="relative inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200">
                                            <span className="text-[10px] text-blue-700 truncate max-w-[100px]">{file.name}</span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemovePhoto(col.key, idx, fileIdx)}
                                              className="text-red-500 hover:text-red-700"
                                              disabled={!bolehEditKeterangan}
                                              title={tr("Hapus foto", "Delete photo")}
                                            >
                                              <X size={12} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {/* Tampilkan foto yang sudah tersimpan di database */}
                                    {row.photoPaths && row.photoPaths.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        <span className="text-[11px] text-gray-500 w-full">{tr("Foto tersimpan:", "Saved photos:")}</span>
                                        {row.photoPaths.map((photoPath, photoIdx) => (
                                          <a
                                            key={photoIdx}
                                            href={`/storage/${photoPath}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100"
                                            title={tr("Klik untuk lihat foto", "Click to view photo")}
                                          >
                                            {tr("Foto", "Photo")} {photoIdx + 1}
                                            <Eye size={10} />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-gray-800">
                          {tr("Subtotal", "Subtotal")}: {formatRupiah(sumBiayaRows(biayaEdit[col.key]))}
                        </p>
                        <BiayaMetaFooter meta={meta} />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-base font-bold text-amber-900">
                    {tr("Total keseluruhan", "Grand total")}:{" "}
                    {formatRupiah(
                      sumBiayaRows(biayaEdit.jalan) +
                      sumBiayaRows(biayaEdit.pengeluaran) +
                      sumBiayaRows(biayaEdit.reimbursment)
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleUpdateUang}
                    disabled={!canEditCurrentBiayaProject}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tr("Simpan", "Save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditUang(false);
                      const item = dataList.find((i) => i.id === currentId);
                      if (item) {
                        setBiayaEdit({
                          jalan: normalizeBiayaRows(item.biaya_jalan_items),
                          pengeluaran: normalizeBiayaRows(item.biaya_pengeluaran_items),
                          reimbursment: normalizeBiayaRows(item.biaya_reimbursment_items),
                        });
                      }
                    }}
                    className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
                  >
                    {tr("Batal", "Cancel")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI STATUS LUNAS ================= */}
      {showLunasConfirmModal && lunasConfirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all animate-in fade-in zoom-in duration-200">
            {/* Header dengan icon */}
            <div className="pt-6 pb-2 px-6 flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                lunasConfirmAction.newStatus
                  ? 'bg-emerald-100'
                  : 'bg-amber-100'
              }`}>
                {lunasConfirmAction.newStatus ? (
                  <CheckCircle size={32} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={32} className="text-amber-600" />
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {lunasConfirmAction.type === 'project' ? 'Ubah Status Pembayaran' : 'Ubah Status Biaya'}
              </h3>
              <p className="text-sm text-gray-500 text-center">
                Apakah Anda yakin ingin mengubah status menjadi
              </p>
            </div>

            {/* Status yang akan diubah */}
            <div className="px-6 pb-4">
              <div className={`py-3 px-4 rounded-xl text-center font-semibold ${
                lunasConfirmAction.newStatus
                  ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-2 border-amber-200'
              }`}>
                {lunasConfirmAction.statusText}
              </div>
            </div>

            {/* Info tambahan untuk item */}
            {lunasConfirmAction.type === 'item' && (
              <div className="px-6 pb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Nominal:</p>
                  <p className="font-semibold text-gray-700">{formatRupiah(lunasConfirmAction.nominal)}</p>
                  {lunasConfirmAction.keterangan && (
                    <>
                      <p className="text-xs text-gray-500 mb-1 mt-2">Keterangan:</p>
                      <p className="text-sm text-gray-700 truncate">{lunasConfirmAction.keterangan}</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tombol Action */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleCancelLunasConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Batal
              </button>
              <button
                onClick={lunasConfirmAction.type === 'project' ? handleConfirmProjectLunas : handleConfirmItemLunas}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-medium transition-colors text-sm ${
                  lunasConfirmAction.newStatus
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Ya, Ubah Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS BARIS BIAYA ================= */}
      {showDeleteBiayaRowModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all animate-in fade-in zoom-in duration-200">
            {/* Header dengan icon */}
            <div className="pt-6 pb-2 px-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-red-100">
                <Trash2 size={32} className="text-red-600" />
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-1">
                Hapus Baris Biaya
              </h3>
              <p className="text-sm text-gray-500 text-center">
                Apakah Anda yakin ingin menghapus baris biaya ini?
              </p>
            </div>

            {/* Info tambahan */}
            {deleteBiayaRowAction && (
              <div className="px-6 pb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Kategori:</p>
                  <p className="font-semibold text-gray-700 capitalize">
                    {deleteBiayaRowAction.key === 'jalan' ? 'Biaya Jalan' :
                     deleteBiayaRowAction.key === 'pengeluaran' ? 'Biaya Pengeluaran' :
                     'Biaya Reimbursment'}
                  </p>
                </div>
              </div>
            )}

            {/* Tombol Action */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteBiayaRowModal(false);
                  setDeleteBiayaRowAction(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Batal
              </button>
              <button
                onClick={executeDeleteBiayaRow}
                className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium transition-colors text-sm bg-red-600 hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}