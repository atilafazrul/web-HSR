import React, { useState, useEffect, useRef } from "react";
import api from "../api/axiosConfig";
import { DollarSign, Calendar, User, TrendingUp, Download, Search, X, FileText, ChevronRight } from "lucide-react";

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

  const fetchDetailBiaya = async (createdBy) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    console.log("Fetching detail biaya for created_by:", createdBy, "bulan:", selectedMonth, "tahun:", selectedYear);

    try {
      const res = await api.get(
        `/dashboard-biaya/rekap-detail-akun?bulan=${selectedMonth}&tahun=${selectedYear}&created_by=${createdBy}`,
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
      // Clear the abort controller reference
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

    // Cari id dari mapping jika tidak ada di objek
    let akunId = akun?.id || akunIdMap[akun?.nama_akun || akun?.name];
    const akunName = akun?.nama_akun || akun?.name;

    // Jika ID tidak ditemukan di mapping, coba cari via API
    if (!akunId && akunName) {
      try {
        console.log("Mencari ID untuk akun:", akunName);
        const res = await api.get(`/dashboard-biaya/search-akun?nama=${encodeURIComponent(akunName)}&bulan=${selectedMonth}&tahun=${selectedYear}`);
        console.log("Search ID result:", res.data);
        const results = res.data?.data || [];

        // Update mapping dengan hasil pencarian
        const newMapping = {};
        results.forEach(r => {
          const name = r.nama_akun || r.name;
          if (name && r.id) {
            newMapping[name] = r.id;
          }
        });
        setAkunIdMap(prev => ({ ...prev, ...newMapping }));

        // Cari lagi ID dari hasil pencarian
        akunId = newMapping[akunName];

        if (!akunId) {
          alert(`ID untuk "${akunName}" tidak ditemukan. Pastikan nama akun sesuai.`);
          return;
        }
      } catch (err) {
        console.error("Gagal mencari ID akun:", err);
        alert(`Gagal mencari ID untuk "${akunName}". Silakan coba cari manual di kolom pencarian.`);
        return;
      }
    } else if (!akunId) {
      alert("Data akun tidak valid");
      return;
    }

    console.log("Using akunId:", akunId);

    // Buat objek akun dengan id yang ditemukan
    const akunWithId = { ...akun, id: akunId };

    setSelectedAkun(akunWithId);
    setDetailBiaya([]); // Reset detail before fetching
    setDetailLoading(true); // Show loading state
    // Clear search results to show main view with selected account
    setSearchTerm("");
    setSearchResults([]);

    try {
      await fetchDetailBiaya(akunId);
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

    // Cari id dari mapping jika tidak ada di objek
    const akunName = akun?.nama_akun || akun?.name;
    let akunId = akun?.id || akunIdMap[akunName];

    console.log("Initial akunName:", akunName);
    console.log("Initial akunId from direct lookup:", akun?.id);
    console.log("Initial akunId from mapping:", akunIdMap[akunName]);
    console.log("Final initial akunId:", akunId);

    // Jika ID tidak ditemukan di mapping, coba cari via API
    if (!akunId && akunName) {
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
          if (name && r.id) {
            newMapping[name] = r.id;
          }
        });

        console.log("New mapping created:", newMapping);
        setAkunIdMap(prev => ({ ...prev, ...newMapping }));

        // Cari lagi ID dari hasil pencarian
        akunId = newMapping[akunName];

        console.log("akunId after search:", akunId);

        if (!akunId) {
          alert(`ID untuk "${akunName}" tidak ditemukan. Pastikan nama akun sesuai.`);
          return;
        }
      } catch (err) {
        console.error("Gagal mencari ID akun:", err);
        console.error("Error response:", err.response?.data);
        alert(`Gagal mencari ID untuk "${akunName}". Silakan coba cari manual di kolom pencarian.`);
        return;
      }
    } else if (!akunId) {
      alert("Data akun tidak valid");
      return;
    }

    console.log("=== Calling fetchDetailBiaya with akunId:", akunId, "===");

    // Buat objek akun dengan id yang ditemukan
    const akunWithId = { ...akun, id: akunId };

    setSelectedAkun(akunWithId);
    setDetailBiaya([]); // Reset detail before fetching
    setDetailLoading(true); // Show loading state
    setShowDetailModal(true); // Show modal immediately with loading state

    try {
      await fetchDetailBiaya(akunId);
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

  const handleExportCSV = () => {
    // Jika ada akun terpilih, hanya export akun tersebut
    const dataToExport = selectedAkun ? [selectedAkun] : dataByAkun;

    if (dataToExport.length === 0) {
      const message = selectedAkun
        ? "Tidak ada data biaya untuk diekspor"
        : "Tidak ada data biaya";
      alert(message);
      return;
    }

    // Helper function to format number without currency symbol for CSV
    const formatNumberForCSV = (n) => new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(n || 0));

    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const accountName = selectedAkun?.nama_akun || selectedAkun?.name || "";

    let csv = `REKAPITULASI BIAYA PER AKUN\n`;
    csv += `Periode: ${monthName}\n`;
    csv += `Dibuat: ${new Date().toLocaleString("id-ID")}\n`;

    if (selectedAkun) {
      csv += `Akun: ${accountName}\n`;
    }

    csv += `\n`;
    csv += `No,Nama Akun,Biaya Jalan,Biaya Pengeluaran,Biaya Reimbursment,Total\n`;

    dataToExport.forEach((akun, idx) => {
      // Hitung total dari detailBiaya jika ada dan ini akun terpilih, gunakan data dari akun jika tidak
      let jalanTotal = akun.jalan || 0;
      let pengeluaranTotal = akun.pengeluaran || 0;
      let reimbursmentTotal = akun.reimbursment || 0;
      let total = akun.total || 0;

      // Jika ada detailBiaya dan ini akun terpilih, hitung dari detailBiaya
      if (detailBiaya.length > 0 && selectedAkun && akun.nama_akun === selectedAkun.nama_akun) {
        jalanTotal = detailBiaya.filter(d => d.kategori === 'jalan').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0);
        pengeluaranTotal = detailBiaya.filter(d => d.kategori === 'pengeluaran').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0);
        reimbursmentTotal = detailBiaya.filter(d => d.kategori === 'reimbursment').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0);
        total = jalanTotal + pengeluaranTotal + reimbursmentTotal;
      }

      csv += `${idx + 1},"${akun.nama_akun || akun.name}","${formatNumberForCSV(jalanTotal)}","${formatNumberForCSV(pengeluaranTotal)}","${formatNumberForCSV(reimbursmentTotal)}","${formatNumberForCSV(total)}"\n`;
    });

    // Add total row
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

    csv += `\nTOTAL,,"${formatNumberForCSV(totalJalan)}","${formatNumberForCSV(totalPengeluaran)}","${formatNumberForCSV(totalReimbursment)}","${formatNumberForCSV(grandTotal)}"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedAkun
      ? `rekap_biaya_${accountName}_${selectedYear}_${selectedMonth}.csv`
      : `rekap_biaya_${selectedYear}_${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
          Export CSV
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
                  {/* Debug info */}
                  <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                    detailBiaya.length: {detailBiaya?.length || 0}
                  </div>

                  {/* Summary di Modal - Hitung dari detailBiaya */}
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

                  {/* Detail Biaya per Kategori */}
                  <div className="space-y-4">
                    {['jalan', 'pengeluaran', 'reimbursment'].map(kategori => (
                      <div key={kategori} className="border rounded-xl overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 font-semibold text-sm text-gray-700">
                          {kategori === 'jalan' ? 'Biaya Jalan' : kategori === 'pengeluaran' ? 'Biaya Pengeluaran' : 'Biaya Reimbursment'}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead className="bg-white text-gray-600">
                              <tr className="text-left">
                                <th className="p-3 font-semibold">No</th>
                                <th className="p-3 font-semibold">Nominal</th>
                                <th className="p-3 font-semibold">Keterangan</th>
                                <th className="p-3 font-semibold">Status</th>
                                <th className="p-3 font-semibold">Tanggal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailBiaya
                                .filter(item => item.kategori === kategori)
                                .map((item, idx) => (
                                  <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{idx + 1}</td>
                                    <td className="p-3 text-sm font-medium">{rupiah(item.nominal)}</td>
                                    <td className="p-3 text-xs text-gray-600">{item.keterangan || '-'}</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_lunas ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {item.is_lunas ? 'Lunas' : 'Belum Lunas'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-xs text-gray-500">{formatDateTime(item.created_at)}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
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
    </div>
  );
});
