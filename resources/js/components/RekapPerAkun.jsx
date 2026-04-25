import React, { useState, useEffect, useRef, useMemo } from "react";
import api from "../api/axiosConfig";
import { DollarSign, Calendar, User, TrendingUp, Download, Search, X, FileText, ChevronRight } from "lucide-react";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const formatMonth = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
  });
};

const formatDateTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  const datePart = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(":", ".");
  return `${datePart} ${timePart}`;
};

const getPhotoUrlsFromItem = (item) => {
  const raw = Array.isArray(item?.photo_urls) ? item.photo_urls : [];
  return raw
    .map((u) => String(u || "").trim())
    .filter((u) => u !== "");
};

// Menggunakan React.memo untuk mencegah unmount/remount yang tidak perlu
export default React.memo(function RekapPerAkun({ user }) {
  const isSuperAdmin = user?.role === "super_admin";
  console.log("User role:", user?.role, "isSuperAdmin:", isSuperAdmin);

  const abortControllerRef = useRef(null); // Untuk cancel request
  const [dataByAkun, setDataByAkun] = useState([]);
  const [allBiaya, setAllBiaya] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return String(now.getMonth() + 1).padStart(2, '0');
  });

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAkun, setSelectedAkun] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBiaya, setDetailBiaya] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmStatusItem, setConfirmStatusItem] = useState(null);
  const [activeDetailSourceTab, setActiveDetailSourceTab] = useState("projek");
  // Mapping nama_akun ke id untuk mencari id dari dataByAkun yang tidak punya id
  const [akunIdMap, setAkunIdMap] = useState({});

  const months = [];
  for (let i = 0; i < 12; i++) {
    months.push(i + 1);
  }

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }

  const fetchRekap = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard-biaya/rekap-per-akun?bulan=${selectedMonth}&tahun=${selectedYear}`);

      setDataByAkun(res.data?.data?.by_akun || []);
      setAllBiaya(res.data?.data?.all || []);
    } catch (err) {
      console.error("Gagal load rekap:", err);
      alert("Gagal memuat data rekapitulasi");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailBiaya = async (namaAkun, createdById = null) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    console.log("Fetching detail biaya for:", namaAkun, "createdById:", createdById, "bulan:", selectedMonth, "tahun:", selectedYear);

    try {
      // Gunakan created_by jika ada (untuk dashboard), gunakan nama_akun untuk projects
      const params = new URLSearchParams({
        bulan: selectedMonth,
        tahun: selectedYear,
      });

      // Kirim keduanya jika tersedia:
      // - created_by untuk data dashboard_biayas
      // - nama_akun untuk data biaya dari projek (field "oleh")
      if (createdById) {
        params.append('created_by', createdById);
      }
      if (namaAkun) {
        params.append('nama_akun', namaAkun);
      }

      const res = await api.get(
        `/dashboard-biaya/rekap-detail-akun?${params.toString()}`,
        { signal: controller.signal }
      );
      console.log("Detail biaya response:", res);
      console.log("Detail biaya data:", res.data);

      const detailData = res.data?.data || [];
      console.log("Setting detailBiaya with", detailData.length, "items:", detailData);

      // Log detail setiap item untuk debugging
      if (detailData.length > 0) {
        detailData.forEach((item, idx) => {
          console.log(`Item ${idx}:`, {
            id: item.id,
            kategori: item.kategori,
            nominal: item.nominal,
            keterangan: item.keterangan,
            is_lunas: item.is_lunas,
            created_at: item.created_at
          });
        });
      }

      setDetailBiaya(detailData);
    } catch (err) {
      // Don't show error if request was cancelled
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        console.log("Request cancelled");
        return;
      }

      console.error("Gagal load detail biaya:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      if (err.response?.status === 403) {
        alert("Anda tidak memiliki akses untuk melihat detail biaya. Hanya superadmin yang bisa mengakses.");
      } else if (err.response?.status === 422) {
        alert(err.response?.data?.message || "Parameter tidak lengkap");
      } else {
        alert("Gagal memuat detail biaya. Cek console untuk detail error.");
      }
    } finally {
      // Clear abort controller reference
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  // Fetch semua account ID untuk membangun mapping
  const fetchAllAccountIds = async () => {
    try {
      // Cari dengan wildcard untuk mendapatkan semua akun
      const res = await api.get(`/dashboard-biaya/search-akun?nama=%&bulan=${selectedMonth}&tahun=${selectedYear}`);

      const results = res.data?.data || [];

      // Build mapping dari nama_akun ke id
      const idMap = {};
      results.forEach(r => {
        const name = r.nama_akun || r.name;
        if (name && r.id) {
          idMap[name] = r.id;
        }
      });
      setAkunIdMap(idMap);
    } catch (err) {
      console.error("Gagal fetch account IDs:", err);
      // Tidak alert error karena ini opsional
    }
  };

  const handleSearch = async (value) => {
    setSearchTerm(value);
    if (!value) {
      resetSearch();
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get(`/dashboard-biaya/search-akun?nama=${encodeURIComponent(value)}&bulan=${selectedMonth}&tahun=${selectedYear}`);

      console.log("Search results:", res.data);
      const results = res.data?.data || [];
      setSearchResults(results);

      // Build mapping dari nama_akun ke id
      const idMap = {};
      results.forEach(r => {
        const name = r.nama_akun || r.name;
        if (name && r.id) {
          idMap[name] = r.id;
        }
      });
      setAkunIdMap(prev => ({ ...prev, ...idMap }));

      // JANGAN reset selectedAkun jika dia sama dengan akun yang sedang dipilih
      // Hanya reset jika akun terpilih berubah
      if (!selectedAkun || (results.length > 0 && !results.find(r => r.id === selectedAkun?.id))) {
        setSelectedAkun(null);
        setDetailBiaya([]);
      }
    } catch (err) {
      console.error("Gagal search akun:", err);
      if (err.response?.status === 422) {
        // Jika 422, berarti tidak ada akun dengan biaya di periode ini
        setSearchResults([]);
      }
      alert(err.response?.data?.message || "Gagal mencari akun");
    } finally {
      setSearchLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setSelectedAkun(null);
    setDetailBiaya([]);
    setDetailLoading(false);
  };

  const handleSelectAkun = async (akun) => {
    console.log("handleSelectAkun called with:", akun);

    // Cari id dari mapping atau gunakan id langsung
    let akunId = akun?.id || akunIdMap[akun?.nama_akun || akun?.name];
    const akunName = akun?.nama_akun || akun?.name;

    // Jika nama akun adalah "Unknown", user sudah dihapus dan data tidak valid
    if (akunName === 'Unknown' || akunName === 'unknown') {
      alert("Data akun tidak valid. User terkait mungkin sudah dihapus dari sistem.");
      return;
    }

    // Jika ID tidak ditemukan di mapping dan bukan dari projek, coba cari via API
    if (!akunId && akunName && akun.source !== 'projek') {
      try {
        console.log("Mencari ID untuk akun:", akunName);
        const res = await api.get(`/dashboard-biaya/search-akun?nama=${encodeURIComponent(akunName)}&bulan=${selectedMonth}&tahun=${selectedYear}`);
        console.log("Search ID result:", res.data);
        const results = res.data?.data || [];

        // Update mapping dengan hasil pencarian
        const newMapping = {};
        results.forEach(r => {
          const name = r.nama_akun || r.name;
          if (name && r.id && r.id !== 0) {
            newMapping[name] = r.id;
          }
        });
        setAkunIdMap(prev => ({ ...prev, ...newMapping }));

        // Cari lagi ID dari hasil pencarian
        akunId = newMapping[akunName];

        if (!akunId) {
          // Lanjut saja dengan nama_akun jika tidak ada ID
          console.log("No ID found, will use nama_akun only");
        }
      } catch (err) {
        console.error("Gagal mencari ID akun:", err);
        // Lanjut saja dengan nama_akun jika search gagal
      }
    }

    // Validasi minimal harus punya nama_akun
    if (!akunName) {
      alert("Data akun tidak valid");
      return;
    }

    console.log("Using akunId:", akunId, "akunName:", akunName, "source:", akun.source);

    // Buat objek akun dengan id yang ditemukan
    const akunWithId = { ...akun, id: akunId };

    setSelectedAkun(akunWithId);
    setDetailBiaya([]); // Reset detail before fetching
    setDetailLoading(true); // Show loading state
    // Clear search results to show main view with selected account
    setSearchTerm("");
    setSearchResults([]);

    try {
      // Jika akun dari projek atau tidak punya ID, gunakan nama_akun
      // Jika dari dashboard dan punya ID, gunakan created_by
      if (akun.source === 'projek' || !akunId || akunId === 0 || akunId === '0') {
        await fetchDetailBiaya(akunName, null);
      } else {
        // Kirim juga nama akun agar detail dari sumber projek tetap ikut terambil.
        await fetchDetailBiaya(akunName, akunWithId.id);
      }
    } catch (err) {
      console.error("Error fetching detail:", err);
      // Error sudah ditangani di fetchDetailBiaya
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetailModal = async (akun) => {
    console.log("=== openDetailModal called ===");
    console.log("Input akun:", akun);

    // Cari id dari mapping atau gunakan created_by langsung
    const akunName = akun?.nama_akun || akun?.name;

    // Jika nama akun adalah "Unknown", user sudah dihapus dan data tidak valid
    // Jangan gunakan created_by sebagai fallback untuk "Unknown" karena akan menampilkan data user yang sudah dihapus
    if (akunName === 'Unknown' || akunName === 'unknown') {
      alert("Data akun tidak valid. User terkait mungkin sudah dihapus dari sistem.");
      return;
    }

    const createdByFromData = akun?.created_by; // Gunakan created_by dari dataByAkun jika ada
    let akunId = akun?.id || createdByFromData || akunIdMap[akunName];

    console.log("Initial akunName:", akunName);
    console.log("Initial akunId from direct lookup:", akun?.id);
    console.log("Initial created_by from data:", createdByFromData);
    console.log("Initial akunId from mapping:", akunIdMap[akunName]);
    console.log("Final initial akunId:", akunId);

    // Jika ID tidak ditemukan dan bukan dari projek, coba cari via API
    if (!akunId && akunName && akun.source !== 'projek') {
      try {
        console.log("Searching for ID for akun:", akunName);
        const res = await api.get(`/dashboard-biaya/search-akun?nama=${encodeURIComponent(akunName)}&bulan=${selectedMonth}&tahun=${selectedYear}`);
        console.log("Search API response:", res.data);
        const results = res.data?.data || [];

        console.log("Search results:", results);

        // Update mapping dengan hasil pencarian
        const newMapping = {};
        results.forEach(r => {
          const name = r.nama_akun || r.name;
          if (name && r.id && r.id !== 0) {
            newMapping[name] = r.id;
          }
        });

        console.log("New mapping created:", newMapping);
        setAkunIdMap(prev => ({ ...prev, ...newMapping }));

        // Cari lagi ID dari hasil pencarian
        akunId = newMapping[akunName];

        console.log("akunId after search:", akunId);

        if (!akunId) {
          // Jika tidak ada ID, gunakan nama_akun saja
          console.log("No ID found, will use nama_akun only");
        }
      } catch (err) {
        console.error("Gagal mencari ID akun:", err);
        console.error("Error response:", err.response?.data);
        // Lanjut saja dengan nama_akun jika search gagal
      }
    }

    // Validasi minimal harus punya nama_akun
    if (!akunName) {
      alert("Data akun tidak valid");
      return;
    }

    console.log("=== Calling fetchDetailBiaya with akunId:", akunId, "akunName:", akunName, "===");

    // Buat objek akun dengan id yang ditemukan
    const akunWithId = { ...akun, id: akunId };

    setSelectedAkun(akunWithId);
    setDetailBiaya([]); // Reset detail before fetching
    setDetailLoading(true); // Show loading state
    setShowDetailModal(true); // Show modal immediately with loading state

    try {
      // Jika akun dari projek atau tidak punya ID, gunakan nama_akun
      // Jika dari dashboard dan punya ID, gunakan created_by
      if (akun.source === 'projek' || !akunId || akunId === 0 || akunId === '0') {
        await fetchDetailBiaya(akunName, null);
      } else {
        // Kirim juga nama akun agar detail dari sumber projek tetap ikut terambil.
        await fetchDetailBiaya(akunName, akunId);
      }
      console.log("fetchDetailBiaya completed");
    } catch (err) {
      console.error("Error opening modal:", err);
      // Error sudah ditangani di fetchDetailBiaya
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    // Don't reset selectedAkun so it can be used for other actions
  };

  const handleToggleDetailLunas = async (item) => {
    if (!isSuperAdmin) return;
    setConfirmStatusItem(item);
  };

  const executeToggleDetailLunas = async () => {
    if (!confirmStatusItem || !isSuperAdmin) return;
    const item = confirmStatusItem;
    const targetStatus = !Boolean(item?.is_lunas);
    try {
      if (item?.source === "projek") {
        if (item?.project_id == null || item?.item_index == null) {
          alert("Data item projek tidak lengkap untuk update status lunas.");
          return;
        }
        await api.patch(`/projek-kerja/${item.project_id}/biaya-item-lunas`, {
          kategori: item.kategori,
          item_index: item.item_index,
          is_lunas: targetStatus,
        });
      } else {
        await api.patch(`/dashboard-biaya/${item.id}`, { is_lunas: targetStatus });
      }

      setDetailBiaya((prev) =>
        (prev || []).map((row) =>
          row.id === item.id ? { ...row, is_lunas: targetStatus } : row
        )
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal update status lunas");
    } finally {
      setConfirmStatusItem(null);
    }
  };

  const detailBySource = useMemo(() => {
    const rows = Array.isArray(detailBiaya) ? detailBiaya : [];
    return {
      projek: rows.filter((r) => r.source === "projek"),
      diluar: rows.filter((r) => r.source !== "projek"),
    };
  }, [detailBiaya]);

  useEffect(() => {
    if (!showDetailModal) return;
    if (detailBySource.projek.length > 0) {
      setActiveDetailSourceTab("projek");
    } else {
      setActiveDetailSourceTab("diluar");
    }
  }, [showDetailModal, detailBySource.projek.length, detailBySource.diluar.length]);

  useEffect(() => {
    fetchRekap();
  }, [selectedMonth, selectedYear]);

  // Refresh search when period changes if there's an active search term
  useEffect(() => {
    if (searchTerm) {
      handleSearch(searchTerm);
    }
  }, [selectedMonth, selectedYear]);

  // Cleanup when component unmounts - cancel any pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleExportCSV = async () => {
    // Jika ada akun terpilih, hanya export akun tersebut
    const dataToExport = selectedAkun ? [selectedAkun] : dataByAkun;

    if (dataToExport.length === 0) {
      const message = selectedAkun
        ? "Tidak ada data biaya untuk diekspor"
        : "Tidak ada data biaya";
      alert(message);
      return;
    }

    // Helper function to format number without currency symbol
    const formatNumberForCSV = (n) => new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(n || 0));

    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const accountName = selectedAkun?.nama_akun || selectedAkun?.name || "";

    // Format waktu dengan format Tanggal, Bulan, dan Tahun kemudian jam
    const now = new Date();
    const tanggal = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
    const waktuDibuat = `${tanggal} ${jam}`;

    // Buat workbook baru
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekap Biaya');

    // Set kolom width
    worksheet.columns = [
      { width: 5 },
      { width: 25 },
      { width: 20 },
      { width: 25 },
      { width: 20 },
      { width: 20 },
    ];

    // Header title
    worksheet.mergeCells('A1:F1');
    const cellA1 = worksheet.getCell('A1');
    cellA1.value = 'REKAPITULASI BIAYYA PER AKUN';
    cellA1.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    cellA1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF172238' } };
    cellA1.alignment = { horizontal: 'center', vertical: 'middle' };

    // Periode
    worksheet.mergeCells('A2:F2');
    const cellA2 = worksheet.getCell('A2');
    cellA2.value = `Periode: ${monthName}`;
    cellA2.font = { bold: true, size: 11 };
    cellA2.alignment = { horizontal: 'left', vertical: 'middle' };

    // Dibuat
    worksheet.mergeCells('A3:F3');
    const cellA3 = worksheet.getCell('A3');
    cellA3.value = `Dibuat: ${waktuDibuat}`;
    cellA3.font = { size: 10 };
    cellA3.alignment = { horizontal: 'left', vertical: 'middle' };

    // Akun (jika ada akun terpilih)
    if (selectedAkun) {
      worksheet.mergeCells('A4:F4');
      const cellA4 = worksheet.getCell('A4');
      cellA4.value = `Akun: ${accountName}`;
      cellA4.font = { bold: true, size: 11 };
      cellA4.alignment = { horizontal: 'left', vertical: 'middle' };
    }

    // Header tabel
    const headers = ['No.', 'Nama Akun', 'Biaya Jalan', 'Biaya Pengeluaran ', 'Biaya Reimbursment', 'Total'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(6, index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });

    // Data
    dataToExport.forEach((akun, idx) => {
      let jalanTotal = akun.jalan || 0;
      let pengeluaranTotal = akun.pengeluaran || 0;
      let reimbursmentTotal = akun.reimbursment || 0;
      let total = akun.total || 0;

      if (detailBiaya.length > 0 && selectedAkun && akun.nama_akun === selectedAkun.nama_akun) {
        jalanTotal = detailBiaya.filter(d => d.kategori === 'jalan').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0);
        pengeluaranTotal = detailBiaya.filter(d => d.kategori === 'pengeluaran').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0);
        reimbursmentTotal = detailBiaya.filter(d => d.kategori === 'reimbursment').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0);
        total = jalanTotal + pengeluaranTotal + reimbursmentTotal;
      }

      const rowIndex = idx + 7;
      const rowData = [
        idx + 1,
        akun.nama_akun || akun.name,
        formatNumberForCSV(jalanTotal),
        formatNumberForCSV(pengeluaranTotal),
        formatNumberForCSV(reimbursmentTotal),
        formatNumberForCSV(total),
      ];

      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(rowIndex, colIndex + 1);
        cell.value = value;
        cell.font = { size: 10 };
        cell.alignment = {
          horizontal: colIndex === 0 ? 'center' : 'left',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        // Warna latar baris selang-seling
        if (idx % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        }
      });
    });

    // Total row
    const totalJalan = dataToExport.reduce((sum, a) => {
      if (detailBiaya.length > 0 && selectedAkun && a.nama_akun === selectedAkun.nama_akun) {
        return sum + detailBiaya.filter(d => d.kategori === 'jalan').reduce((s, d) => s + (Number(d.nominal) || 0), 0);
      }
      return sum + (Number(a.jalan) || 0);
    }, 0);

    const totalPengeluaran = dataToExport.reduce((sum, a) => {
      if (detailBiaya.length > 0 && selectedAkun && a.nama_akun === selectedAkun.nama_akun) {
        return sum + detailBiaya.filter(d => d.kategori === 'pengeluaran').reduce((s, d) => s + (Number(d.nominal) || 0), 0);
      }
      return sum + (Number(a.pengeluaran) || 0);
    }, 0);

    const totalReimbursment = dataToExport.reduce((sum, a) => {
      if (detailBiaya.length > 0 && selectedAkun && a.nama_akun === selectedAkun.nama_akun) {
        return sum + detailBiaya.filter(d => d.kategori === 'reimbursment').reduce((s, d) => s + (Number(d.nominal) || 0), 0);
      }
      return sum + (Number(a.reimbursment) || 0);
    }, 0);

    const grandTotal = totalJalan + totalPengeluaran + totalReimbursment;

    const totalRowIndex = dataToExport.length + 7;
    const totalData = ['', '', formatNumberForCSV(totalJalan), formatNumberForCSV(totalPengeluaran), formatNumberForCSV(totalReimbursment), formatNumberForCSV(grandTotal)];

    totalData.forEach((value, colIndex) => {
      const cell = worksheet.getCell(totalRowIndex, colIndex + 1);
      cell.value = value;
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });

    // Generate buffer dan save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, selectedAkun
      ? `rekap_biaya_${accountName}_${selectedYear}_${selectedMonth}.xlsx`
      : `rekap_biaya_${selectedYear}_${selectedMonth}.xlsx`);
  };

  // Filter akun berdasarkan search term
  const filteredAkun = searchTerm
    ? dataByAkun.filter(akun =>
        akun.nama_akun.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : dataByAkun;

  // Search results dari API - gunakan searchResults saat mencari
  const displayData = searchTerm ? searchResults : dataByAkun;

  // Cek apakah sedang dalam mode pencarian
  const isSearching = searchTerm.length > 0;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-4 sm:p-5 md:p-6 lg:p-8 mb-6 sm:mb-8 md:mb-10">
      <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
        <User size={18} className="text-blue-600" />
        Rekapitulasi Per Akun
      </h3>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cari nama akun (contoh: aqila)..."
            className="w-full border border-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          {searchTerm && (
            <button
              onClick={resetSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
          {!searchTerm && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Search size={18} />
            </div>
          )}
        </div>
      </div>

      {/* Filter Bulan & Tahun */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bulan</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 px-3 sm:px-4 p-2 sm:p-2.5 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          >
            {months.map(m => (
              <option key={m} value={String(m).padStart(2, '0')}>
                {new Date(selectedYear, m - 1).toLocaleDateString("id-ID", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tahun</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-300 px-3 sm:px-4 p-2 sm:p-2.5 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={dataByAkun.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm sm:text-base"
        >
          <Download size={16} />
          Export Excel
        </button>
      </div>

      {/* Selected Account Info */}
      {selectedAkun && (
        <div className="mb-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Akun Terpilih</p>
              <p className="text-lg font-bold text-blue-700">{selectedAkun.nama_akun || selectedAkun.name}</p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => openDetailModal(selectedAkun)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <FileText size={16} />
                Lihat Detail
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      ) : isSearching ? (
        /* Search Results */
        searchLoading ? (
          <div className="text-center py-8 text-gray-500">Mencari akun...</div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Tidak ada akun "{searchTerm}" dengan biaya di periode ini</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr className="text-left">
                    <th className="p-2 sm:p-4 font-semibold">Nama Akun</th>
                    <th className="p-2 sm:p-4 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((akun, idx) => (
                    <tr key={akun.id || idx} className="border-b hover:bg-blue-50 transition">
                      <td className="p-2 sm:p-4 font-medium">{akun.nama_akun || akun.name}</td>
                      <td className="p-2 sm:p-4">
                        <button
                          onClick={() => {
                            console.log("Search result clicked:", akun);
                            handleSelectAkun(akun);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1"
                        >
                          Pilih
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <DollarSign size={14} className="text-blue-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-gray-600">Biaya Jalan</p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-blue-700">{rupiah(allBiaya.jalan)}</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <DollarSign size={14} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-gray-600">Biaya Pengeluaran</p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-amber-700">{rupiah(allBiaya.pengeluaran)}</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-3 sm:p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <DollarSign size={14} className="text-purple-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-gray-600">Biaya Reimbursment</p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-purple-700">{rupiah(allBiaya.reimbursment)}</p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 border border-emerald-100">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <TrendingUp size={14} className="text-emerald-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-gray-600">Total</p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-emerald-700">{rupiah(allBiaya.total)}</p>
            </div>
          </div>

          {/* Table Per Akun */}
          <div className="border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr className="text-left">
                    <th className="p-2 sm:p-4 font-semibold">Nama Akun</th>
                    <th className="p-2 sm:p-4 font-semibold">Biaya Jalan</th>
                    <th className="p-2 sm:p-4 font-semibold">Biaya Pengeluaran</th>
                    <th className="p-2 sm:p-4 font-semibold">Biaya Reimbursment</th>
                    <th className="p-2 sm:p-4 font-semibold">Total</th>
                    <th className="p-2 sm:p-4 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dataByAkun.map((akun, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition">
                      <td className="p-2 sm:p-4 font-medium">{akun.nama_akun}</td>
                      <td className="p-2 sm:p-4 text-blue-600 font-semibold">{rupiah(akun.jalan)}</td>
                      <td className="p-2 sm:p-4 text-amber-600 font-semibold">{rupiah(akun.pengeluaran)}</td>
                      <td className="p-2 sm:p-4 text-purple-600 font-semibold">{rupiah(akun.reimbursment)}</td>
                      <td className="p-2 sm:p-4 text-emerald-600 font-semibold">{rupiah(akun.total)}</td>
                      {isSuperAdmin && (
                        <td className="p-2 sm:p-4">
                          <button
                            onClick={() => {
                              console.log("Main table Detail clicked:", akun);
                              openDetailModal(akun);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1"
                          >
                            Detail
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      )}
                      {!isSuperAdmin && (
                        <td className="p-2 sm:p-4">
                          <span className="text-xs text-gray-400 italic">-</span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Periode: {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}</p>
          </div>
        </>
      )}

      {/* Modal Detail Biaya */}
      {showDetailModal && selectedAkun && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Detail Biaya: {selectedAkun.nama_akun || selectedAkun.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Periode: {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
                </p>
              </div>
              <button
                onClick={closeDetailModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                  <p>Memuat detail biaya...</p>
                </div>
              ) : detailBiaya.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Tidak ada data biaya untuk akun ini pada periode terpilih</p>
                  {!isSuperAdmin && (
                    <p className="text-sm text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                      <span className="font-semibold">Perhatian:</span> Fitur detail biaya hanya dapat diakses oleh superadmin.
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-4">
                    {selectedAkun?.nama_akun || selectedAkun?.name} - {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Biaya Jalan</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {rupiah(detailBiaya.filter(d => d.kategori === 'jalan').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Biaya Pengeluaran</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {rupiah(detailBiaya.filter(d => d.kategori === 'pengeluaran').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Biaya Reimbursment</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {rupiah(detailBiaya.filter(d => d.kategori === 'reimbursment').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Total</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {rupiah(detailBiaya.reduce((sum, d) => sum + (Number(d.nominal) || 0), 0))}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="inline-flex rounded-lg bg-gray-100 p-1">
                      <button
                        type="button"
                        onClick={() => setActiveDetailSourceTab("projek")}
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition ${
                          activeDetailSourceTab === "projek"
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        Biaya Projek
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDetailSourceTab("diluar")}
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition ${
                          activeDetailSourceTab === "diluar"
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        Biaya Diluar Projek
                      </button>
                    </div>
                  </div>

                  {[
                    {
                      key: "projek",
                      title: "Biaya Projek",
                      rows: detailBySource.projek,
                    },
                    {
                      key: "diluar",
                      title: "Biaya Diluar Projek",
                      rows: detailBySource.diluar,
                    },
                  ]
                    .filter((sourceBlock) => sourceBlock.key === activeDetailSourceTab)
                    .map((sourceBlock) => (
                    <div key={sourceBlock.key} className="border rounded-xl p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">{sourceBlock.title}</h4>
                        <span className="text-xs text-gray-500">{sourceBlock.rows.length} transaksi</span>
                      </div>

                      {["belum", "lunas"].map((statusKey) => {
                        const statusRows = sourceBlock.rows.filter((r) =>
                          statusKey === "lunas" ? Boolean(r.is_lunas) : !Boolean(r.is_lunas)
                        );
                        return (
                          <div key={`${sourceBlock.key}-${statusKey}`} className="mb-4 last:mb-0">
                            <h5 className={`text-sm font-semibold mb-2 ${statusKey === "lunas" ? "text-emerald-700" : "text-amber-700"}`}>
                              {statusKey === "lunas" ? "Lunas" : "Belum Lunas"}
                            </h5>

                            {["jalan", "pengeluaran", "reimbursment"].map((kategori) => {
                              const rows = statusRows.filter((item) => item.kategori === kategori);
                              return (
                                <div key={`${sourceBlock.key}-${statusKey}-${kategori}`} className="border rounded-lg overflow-hidden mb-3 last:mb-0">
                                  <div className="bg-gray-100 px-3 py-2 font-medium text-xs text-gray-700">
                                    {kategori === "jalan" ? "Biaya Jalan" : kategori === "pengeluaran" ? "Biaya Pengeluaran" : "Biaya Reimbursment"}
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                      <thead className="bg-white text-gray-600">
                                        <tr className="text-left">
                                          <th className="p-2 font-semibold">No</th>
                                          <th className="p-2 font-semibold">Nominal</th>
                                          <th className="p-2 font-semibold">Keterangan</th>
                                          <th className="p-2 font-semibold">Foto</th>
                                          <th className="p-2 font-semibold">Status</th>
                                          <th className="p-2 font-semibold">Tanggal</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {rows.length === 0 ? (
                                          <tr>
                                            <td colSpan={6} className="p-3 text-gray-400 text-center">
                                              Tidak ada data
                                            </td>
                                          </tr>
                                        ) : (
                                          rows.map((item, idx) => (
                                            <tr key={`${item.id}-${idx}`} className="border-b hover:bg-gray-50">
                                              <td className="p-2">{idx + 1}</td>
                                              <td className="p-2 font-medium">{rupiah(item.nominal)}</td>
                                              <td className="p-2 text-gray-600">{item.keterangan || "-"}</td>
                                              <td className="p-2">
                                                {(() => {
                                                  const photoUrls = getPhotoUrlsFromItem(item);
                                                  if (photoUrls.length === 0) {
                                                    return <span className="text-gray-400">-</span>;
                                                  }
                                                  return (
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                      {photoUrls.map((url, photoIdx) => (
                                                        <a
                                                          key={`${item.id}-photo-${photoIdx}`}
                                                          href={url}
                                                          target="_blank"
                                                          rel="noreferrer"
                                                          className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 text-[11px]"
                                                          title={`Lihat foto ${photoIdx + 1}`}
                                                        >
                                                          {photoUrls.length === 1 ? "Lihat" : `Foto ${photoIdx + 1}`}
                                                        </a>
                                                      ))}
                                                    </div>
                                                  );
                                                })()}
                                              </td>
                                              <td className="p-2">
                                                {isSuperAdmin ? (
                                                  <button
                                                    type="button"
                                                    onClick={() => handleToggleDetailLunas(item)}
                                                    className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                                                      item.is_lunas
                                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                    }`}
                                                    title={item.is_lunas ? "Klik untuk ubah ke Belum Lunas" : "Klik untuk ubah ke Lunas"}
                                                  >
                                                    {item.is_lunas ? "Lunas" : "Belum Lunas"}
                                                  </button>
                                                ) : (
                                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_lunas ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                    {item.is_lunas ? "Lunas" : "Belum Lunas"}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="p-2 text-gray-500">{formatDateTime(item.created_at)}</td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Total {detailBiaya.length} transaksi
              </p>
              <button
                onClick={closeDetailModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmStatusItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="pt-6 pb-2 px-6 flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                !confirmStatusItem.is_lunas ? "bg-emerald-100" : "bg-amber-100"
              }`}>
                <FileText size={30} className={!confirmStatusItem.is_lunas ? "text-emerald-600" : "text-amber-600"} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Ubah Status Biaya</h3>
              <p className="text-sm text-gray-500 text-center">
                Apakah Anda yakin ingin mengubah status menjadi
              </p>
            </div>

            <div className="px-6 pb-4">
              <div className={`py-3 px-4 rounded-xl text-center font-semibold ${
                !confirmStatusItem.is_lunas
                  ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-2 border-amber-200"
              }`}>
                {!confirmStatusItem.is_lunas ? "Lunas" : "Belum Lunas"}
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Nominal:</p>
                <p className="font-semibold text-gray-700">{rupiah(confirmStatusItem.nominal)}</p>
                {confirmStatusItem.keterangan && (
                  <>
                    <p className="text-xs text-gray-500 mb-1 mt-2">Keterangan:</p>
                    <p className="text-sm text-gray-700">{confirmStatusItem.keterangan}</p>
                  </>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setConfirmStatusItem(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Batal
              </button>
              <button
                onClick={executeToggleDetailLunas}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-medium transition-colors text-sm ${
                  !confirmStatusItem.is_lunas
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                Ya, Ubah Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
