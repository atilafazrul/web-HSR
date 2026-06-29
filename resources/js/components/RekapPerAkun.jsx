import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axiosConfig";
import { DollarSign, Calendar, User, TrendingUp, Download, Search, X, FileText, ChevronRight } from "lucide-react";
import { saveAs } from 'file-saver';
import { useI18n } from "../i18n";

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

const getBiayaRowKey = (item) => {
  if (item?.source === "projek") {
    return `projek-${item.project_id}-${item.kategori}-${item.item_index}`;
  }
  return `dashboard-${item.id}`;
};

const createLunasGroupId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `grp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const getLunasGroupKey = (item) => {
  if (item?.lunas_group_id) return String(item.lunas_group_id);
  return `legacy-${getBiayaRowKey(item)}`;
};

const kategoriLabel = (kategori, tr) => {
  if (kategori === "jalan") return tr("Biaya Jalan", "Travel Cost");
  if (kategori === "pengeluaran") return tr("Biaya Pengeluaran", "Expense Cost");
  return tr("Biaya Reimbursment", "Reimbursement Cost");
};

const groupPaidRows = (rows) => {
  const groups = new Map();
  for (const row of rows) {
    const groupKey = getLunasGroupKey(row);
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(row);
  }

  return Array.from(groups.entries())
    .map(([groupKey, items]) => {
      const lunasAt = items.reduce((latest, item) => {
        const value = item?.lunas_at;
        if (!value) return latest;
        const time = new Date(value).getTime();
        if (Number.isNaN(time)) return latest;
        if (!latest || time > latest) return time;
        return latest;
      }, null);

      return {
        groupKey,
        items,
        total: items.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0),
        lunasAt,
      };
    })
    .sort((a, b) => (b.lunasAt || 0) - (a.lunasAt || 0));
};

const matchesBiayaHighlight = (item, target) => {
  if (!target || !item) return false;
  if (target.type === "dashboard") {
    return item.source !== "projek" && String(item.id) === String(target.id);
  }
  if (target.type === "projek") {
    return (
      item.source === "projek" &&
      String(item.project_id) === String(target.project_id) &&
      Number(item.item_index) === Number(target.item_index) &&
      String(item.kategori) === String(target.kategori)
    );
  }
  return false;
};

const parseHighlightFromParams = (params) => {
  const type = params.get("highlight_type");
  const nominal = params.get("highlight_nominal");
  const kategori = params.get("highlight_kategori");

  if (type === "dashboard") {
    const id = params.get("highlight_id");
    if (!id) return null;
    return {
      type: "dashboard",
      id,
      kategori,
      nominal: nominal != null ? Number(nominal) : null,
    };
  }

  if (type === "projek") {
    const projectId = params.get("highlight_project_id");
    const itemIndex = params.get("highlight_item_index");
    if (projectId == null || itemIndex == null || !kategori) return null;
    return {
      type: "projek",
      project_id: projectId,
      item_index: itemIndex,
      kategori,
      nominal: nominal != null ? Number(nominal) : null,
    };
  }

  return null;
};

const parseDeepLinkFromSearchParams = (params) => {
  if (params.get("detail") !== "1") return null;
  const namaAkun = params.get("nama_akun");
  if (!namaAkun) return null;
  return {
    nama_akun: namaAkun,
    created_by: params.get("created_by"),
    source: params.get("source"),
    bulan: params.get("bulan"),
    tahun: params.get("tahun"),
    highlight: parseHighlightFromParams(params),
  };
};

// Menggunakan React.memo untuk mencegah unmount/remount yang tidak perlu
export default React.memo(function RekapPerAkun({ user, onlyCurrentUser = false }) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const isSuperAdmin = user?.role === "super_admin";
  const canViewDetail = isSuperAdmin || onlyCurrentUser;
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkTargetRef = useRef(parseDeepLinkFromSearchParams(searchParams));
  const deepLinkOpenedRef = useRef(false);
  const lockedSourceTabRef = useRef(null);
  const highlightTargetRef = useRef(null);
  const [highlightedRowKey, setHighlightedRowKey] = useState(null);

  const abortControllerRef = useRef(null); // Untuk cancel request
  const [dataByAkun, setDataByAkun] = useState([]);
  const [allBiaya, setAllBiaya] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const dl = deepLinkTargetRef.current;
    const now = new Date();
    if (dl?.bulan) return String(dl.bulan).padStart(2, "0");
    return String(now.getMonth() + 1).padStart(2, "0");
  });

  const [selectedYear, setSelectedYear] = useState(() => {
    const dl = deepLinkTargetRef.current;
    const now = new Date();
    if (dl?.tahun) return Number(dl.tahun);
    return now.getFullYear();
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAkun, setSelectedAkun] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBiaya, setDetailBiaya] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmStatusItem, setConfirmStatusItem] = useState(null);
  const [selectedUnpaidKeys, setSelectedUnpaidKeys] = useState(() => new Set());
  const [showBulkLunasiConfirm, setShowBulkLunasiConfirm] = useState(false);
  const [bulkLunasiProcessing, setBulkLunasiProcessing] = useState(false);
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
      alert(err?.response?.data?.message || "Gagal memuat data rekapitulasi");
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
        alert(err.response?.data?.message || tr("Anda tidak memiliki akses untuk melihat detail biaya.", "You do not have access to view cost details."));
      } else if (err.response?.status === 422) {
        alert(err.response?.data?.message || tr("Parameter tidak lengkap", "Incomplete parameters"));
      } else {
        alert(tr("Gagal memuat detail biaya. Cek console untuk detail error.", "Failed to load cost details. Check console for error details."));
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
    if (onlyCurrentUser) return;

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
    if (onlyCurrentUser) return;

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
      alert(tr("Data akun tidak valid. User terkait mungkin sudah dihapus dari sistem.", "Invalid account data. Related user may have been deleted."));
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
      alert(tr("Data akun tidak valid", "Invalid account data"));
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

  const openDetailModal = async (akun, options = {}) => {
    console.log("=== openDetailModal called ===");
    console.log("Input akun:", akun);

    const sourceTab = options.sourceTab;
    if (sourceTab === "projek" || sourceTab === "diluar") {
      lockedSourceTabRef.current = sourceTab;
      setActiveDetailSourceTab(sourceTab);
    }

    if (options.highlight) {
      highlightTargetRef.current = options.highlight;
      setHighlightedRowKey(null);
    }

    // Cari id dari mapping atau gunakan created_by langsung
    const akunName = akun?.nama_akun || akun?.name;

    // Jika nama akun adalah "Unknown", user sudah dihapus dan data tidak valid
    // Jangan gunakan created_by sebagai fallback untuk "Unknown" karena akan menampilkan data user yang sudah dihapus
    if (akunName === 'Unknown' || akunName === 'unknown') {
      alert(tr("Data akun tidak valid. User terkait mungkin sudah dihapus dari sistem.", "Invalid account data. Related user may have been deleted."));
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
      alert(tr("Data akun tidak valid", "Invalid account data"));
      return;
    }

    console.log("=== Calling fetchDetailBiaya with akunId:", akunId, "akunName:", akunName, "===");

    // Buat objek akun dengan id yang ditemukan
    const akunWithId = { ...akun, id: akunId };

    setSelectedAkun(akunWithId);
    setDetailBiaya([]); // Reset detail before fetching
    setSelectedUnpaidKeys(new Set());
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
    lockedSourceTabRef.current = null;
    highlightTargetRef.current = null;
    setHighlightedRowKey(null);
    setSelectedUnpaidKeys(new Set());
    setShowBulkLunasiConfirm(false);
    // Don't reset selectedAkun so it can be used for other actions
  };

  const toggleUnpaidSelection = (item) => {
    const key = getBiayaRowKey(item);
    setSelectedUnpaidKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAllUnpaidInRows = (rows) => {
    const keys = rows.map(getBiayaRowKey);
    setSelectedUnpaidKeys((prev) => {
      const next = new Set(prev);
      const allSelected = keys.length > 0 && keys.every((k) => next.has(k));
      if (allSelected) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  };

  const updateDetailBiayaLunasByKeys = (keys, targetStatus, extraFields = {}) => {
    const keySet = keys instanceof Set ? keys : new Set(keys);
    setDetailBiaya((prev) =>
      (prev || []).map((row) => {
        if (!keySet.has(getBiayaRowKey(row))) return row;
        if (!targetStatus) {
          return { ...row, is_lunas: false, lunas_at: null, lunas_group_id: null };
        }
        return {
          ...row,
          is_lunas: true,
          lunas_at: extraFields.lunas_at || row.lunas_at || new Date().toISOString(),
          lunas_group_id: extraFields.lunas_group_id ?? row.lunas_group_id ?? null,
        };
      })
    );
  };

  const handleToggleDetailLunas = async (item) => {
    if (!isSuperAdmin) return;
    setConfirmStatusItem(item);
  };

  const executeToggleDetailLunas = async () => {
    if (!confirmStatusItem || !isSuperAdmin) return;
    const item = confirmStatusItem;
    const targetStatus = !Boolean(item?.is_lunas);
    const lunasGroupId = targetStatus ? createLunasGroupId() : null;
    try {
      if (item?.source === "projek") {
        if (item?.project_id == null || item?.item_index == null) {
          alert(tr("Data item projek tidak lengkap untuk update status lunas.", "Project item data is incomplete for paid-status update."));
          return;
        }
        await api.patch(`/projek-kerja/${item.project_id}/biaya-item-lunas`, {
          kategori: item.kategori,
          item_index: item.item_index,
          is_lunas: targetStatus,
          ...(lunasGroupId ? { lunas_group_id: lunasGroupId } : {}),
        });
      } else {
        await api.patch(`/dashboard-biaya/${item.id}`, {
          is_lunas: targetStatus,
          ...(lunasGroupId ? { lunas_group_id: lunasGroupId } : {}),
        });
      }

      const now = new Date().toISOString();
      updateDetailBiayaLunasByKeys(new Set([getBiayaRowKey(item)]), targetStatus, {
        lunas_group_id: lunasGroupId,
        lunas_at: targetStatus ? now : null,
      });
    } catch (err) {
      alert(err?.response?.data?.message || tr("Gagal update status lunas", "Failed to update paid status"));
    } finally {
      setConfirmStatusItem(null);
    }
  };

  const markItemsAsLunas = async (items, lunasGroupId) => {
    await Promise.all(
      items.map(async (item) => {
        if (item?.source === "projek") {
          if (item?.project_id == null || item?.item_index == null) {
            throw new Error(tr("Data item projek tidak lengkap untuk update status lunas.", "Project item data is incomplete for paid-status update."));
          }
          await api.patch(`/projek-kerja/${item.project_id}/biaya-item-lunas`, {
            kategori: item.kategori,
            item_index: item.item_index,
            is_lunas: true,
            lunas_group_id: lunasGroupId,
          });
        } else {
          await api.patch(`/dashboard-biaya/${item.id}`, {
            is_lunas: true,
            lunas_group_id: lunasGroupId,
          });
        }
      })
    );
  };

  const executeBulkLunasi = async () => {
    if (!isSuperAdmin || bulkLunasiProcessing) return;
    const items = (detailBiaya || []).filter(
      (row) => !Boolean(row.is_lunas) && selectedUnpaidKeys.has(getBiayaRowKey(row))
    );
    if (items.length === 0) return;

    setBulkLunasiProcessing(true);
    try {
      const lunasGroupId = createLunasGroupId();
      const now = new Date().toISOString();
      await markItemsAsLunas(items, lunasGroupId);
      const keys = new Set(items.map(getBiayaRowKey));
      updateDetailBiayaLunasByKeys(keys, true, { lunas_group_id: lunasGroupId, lunas_at: now });
      setSelectedUnpaidKeys(new Set());
      setShowBulkLunasiConfirm(false);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || tr("Gagal melunasi biaya terpilih", "Failed to mark selected costs as paid"));
    } finally {
      setBulkLunasiProcessing(false);
    }
  };

  const selectedUnpaidItems = useMemo(() => {
    const rows = Array.isArray(detailBiaya) ? detailBiaya : [];
    return rows.filter((row) => !Boolean(row.is_lunas) && selectedUnpaidKeys.has(getBiayaRowKey(row)));
  }, [detailBiaya, selectedUnpaidKeys]);

  const selectedUnpaidTotal = useMemo(
    () => selectedUnpaidItems.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0),
    [selectedUnpaidItems]
  );

  const detailBySource = useMemo(() => {
    const rows = Array.isArray(detailBiaya) ? detailBiaya : [];
    return {
      projek: rows.filter((r) => r.source === "projek"),
      diluar: rows.filter((r) => r.source !== "projek"),
    };
  }, [detailBiaya]);

  useEffect(() => {
    if (!showDetailModal) return;
    if (lockedSourceTabRef.current) {
      setActiveDetailSourceTab(lockedSourceTabRef.current);
      return;
    }
    if (detailBySource.projek.length > 0) {
      setActiveDetailSourceTab("projek");
    } else {
      setActiveDetailSourceTab("diluar");
    }
  }, [showDetailModal, detailBySource.projek.length, detailBySource.diluar.length]);

  useEffect(() => {
    const target = parseDeepLinkFromSearchParams(searchParams);
    if (!target) return;

    deepLinkTargetRef.current = target;
    deepLinkOpenedRef.current = false;
    setSearchParams({}, { replace: true });

    if (target.bulan) setSelectedMonth(String(target.bulan).padStart(2, "0"));
    if (target.tahun) setSelectedYear(Number(target.tahun));
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const target = deepLinkTargetRef.current;
    if (!target || deepLinkOpenedRef.current || loading || !canViewDetail) return;

    deepLinkOpenedRef.current = true;

    const sourceTab =
      target.source === "projek" ? "projek" : target.source === "diluar" ? "diluar" : null;

    const createdById = target.created_by ? Number(target.created_by) : null;
    const akun = {
      nama_akun: target.nama_akun,
      name: target.nama_akun,
      ...(createdById ? { created_by: createdById, id: createdById } : {}),
      ...(target.source === "projek" ? { source: "projek" } : {}),
    };

    void openDetailModal(akun, { sourceTab, highlight: target.highlight });
  }, [loading, canViewDetail]);

  useEffect(() => {
    if (!showDetailModal || detailLoading || !highlightTargetRef.current) return;
    if (detailBiaya.length === 0) return;

    const target = highlightTargetRef.current;
    let match = detailBiaya.find((item) => matchesBiayaHighlight(item, target));

    if (!match && target.kategori && target.nominal != null) {
      const sourceFilter = target.type === "projek" ? "projek" : "dashboard";
      match = detailBiaya.find((item) => {
        const isProjek = item.source === "projek";
        if (sourceFilter === "projek" ? !isProjek : isProjek) return false;
        return (
          item.kategori === target.kategori &&
          Math.abs(Number(item.nominal) - Number(target.nominal)) < 0.01
        );
      });
    }

    if (!match) return;

    const rowKey = getBiayaRowKey(match);
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`biaya-row-${rowKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedRowKey(rowKey);
        window.setTimeout(() => setHighlightedRowKey(null), 5000);
      }
      highlightTargetRef.current = null;
    }, 200);

    return () => window.clearTimeout(timer);
  }, [showDetailModal, detailLoading, detailBiaya, activeDetailSourceTab]);

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
    if (dataByAkun.length === 0) {
      alert(tr("Tidak ada data biaya", "No cost data"));
      return;
    }

    const params = new URLSearchParams({
      bulan: selectedMonth,
      tahun: String(selectedYear),
    });

    const accountName = selectedAkun?.nama_akun || selectedAkun?.name;
    if (accountName) {
      params.append("nama_akun", accountName);
    }

    try {
      const res = await api.get(`/dashboard-biaya/export-kas?${params.toString()}`, {
        responseType: "blob",
      });

      const monthLabel = new Date(selectedYear, Number(selectedMonth) - 1)
        .toLocaleDateString("id-ID", { month: "long" })
        .toUpperCase();
      const fallbackName = accountName
        ? `KAS_HSR_${monthLabel}_${selectedYear}_${accountName}.xlsx`
        : `KAS_HSR_${monthLabel}_${selectedYear}.xlsx`;

      const disposition = res.headers?.["content-disposition"] || "";
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const fileName = match?.[1] || fallbackName;

      saveAs(res.data, fileName);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          alert(json.message || tr("Gagal mengekspor Excel", "Failed to export Excel"));
          return;
        } catch {
          // fall through
        }
      }
      alert(
        err?.response?.data?.message ||
          tr("Gagal mengekspor Excel", "Failed to export Excel")
      );
    }
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
    <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:mb-8 sm:rounded-3xl sm:p-5 md:mb-10 md:p-6 lg:p-8">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800 sm:text-lg md:text-xl">
        <User size={18} className="text-indigo-600" />
        {tr("Rekapitulasi Per Akun", "Recap Per Account")}
      </h3>

      {!onlyCurrentUser && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={tr("Cari nama akun (contoh: aqila)...", "Search account name (e.g. aqila)...")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/30 sm:px-4 sm:py-2.5"
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
      )}

      {/* Filter Bulan & Tahun */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{tr("Bulan", "Month")}</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-2 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/30 sm:p-2.5 sm:px-4"
          >
            {months.map(m => (
              <option key={m} value={String(m).padStart(2, '0')}>
                {new Date(selectedYear, m - 1).toLocaleDateString("id-ID", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{tr("Tahun", "Year")}</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full rounded-xl border border-slate-300 p-2 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/30 sm:p-2.5 sm:px-4"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={dataByAkun.length === 0}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:px-4 sm:text-base"
        >
          <Download size={16} />
          {tr("Export Excel", "Export Excel")}
        </button>
      </div>

      {/* Selected Account Info */}
      {selectedAkun && (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">{tr("Akun Terpilih", "Selected Account")}</p>
              <p className="text-lg font-bold text-indigo-700">{selectedAkun.nama_akun || selectedAkun.name}</p>
            </div>
            {canViewDetail && (
              <button
                onClick={() => openDetailModal(selectedAkun)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
              >
                <FileText size={16} />
                {tr("Lihat Detail", "View Details")}
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">{tr("Memuat data...", "Loading data...")}</div>
      ) : isSearching ? (
        /* Search Results */
        searchLoading ? (
          <div className="text-center py-8 text-gray-500">{tr("Mencari akun...", "Searching accounts...")}</div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search size={48} className="mx-auto mb-4 text-gray-300" />
            <p>{language === "en" ? `No account "${searchTerm}" has costs in this period` : `Tidak ada akun "${searchTerm}" dengan biaya di periode ini`}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr className="text-left">
                    <th className="p-2 sm:p-4 font-semibold">{tr("Nama Akun", "Account Name")}</th>
                    <th className="p-2 sm:p-4 font-semibold">{tr("Aksi", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((akun, idx) => (
                    <tr key={akun.id || idx} className="border-b border-slate-100 transition hover:bg-slate-50">
                      <td className="p-2 sm:p-4 font-medium">{akun.nama_akun || akun.name}</td>
                      <td className="p-2 sm:p-4">
                        <button
                          onClick={() => {
                            console.log("Search result clicked:", akun);
                            handleSelectAkun(akun);
                          }}
                          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-indigo-700"
                        >
                          {tr("Pilih", "Select")}
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
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <DollarSign size={14} className="shrink-0 text-indigo-600" />
                <p className="text-xs text-slate-600 sm:text-sm">{tr("Biaya Jalan", "Travel Cost")}</p>
              </div>
              <p className="text-lg font-bold text-indigo-700 sm:text-xl">{rupiah(allBiaya.jalan)}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <DollarSign size={14} className="shrink-0 text-slate-600" />
                <p className="text-xs text-slate-600 sm:text-sm">{tr("Biaya Pengeluaran", "Expense Cost")}</p>
              </div>
              <p className="text-lg font-bold text-slate-700 sm:text-xl">{rupiah(allBiaya.pengeluaran)}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <DollarSign size={14} className="shrink-0 text-slate-600" />
                <p className="text-xs text-slate-600 sm:text-sm">{tr("Biaya Reimbursment", "Reimbursement Cost")}</p>
              </div>
              <p className="text-lg font-bold text-slate-700 sm:text-xl">{rupiah(allBiaya.reimbursment)}</p>
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
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr className="text-left">
                    <th className="p-2 sm:p-4 font-semibold">{tr("Nama Akun", "Account Name")}</th>
                    <th className="p-2 sm:p-4 font-semibold">{tr("Biaya Jalan", "Travel Cost")}</th>
                    <th className="p-2 sm:p-4 font-semibold">{tr("Biaya Pengeluaran", "Expense Cost")}</th>
                    <th className="p-2 sm:p-4 font-semibold">{tr("Biaya Reimbursment", "Reimbursement Cost")}</th>
                    <th className="p-2 sm:p-4 font-semibold">{tr("Total", "Total")}</th>
                    <th className="p-2 sm:p-4 font-semibold">{tr("Aksi", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {dataByAkun.map((akun, idx) => (
                    <tr key={idx} className="border-b border-slate-100 transition hover:bg-slate-50">
                      <td className="p-2 sm:p-4 font-medium">{akun.nama_akun}</td>
                      <td className="p-2 sm:p-4 font-semibold text-indigo-600">{rupiah(akun.jalan)}</td>
                      <td className="p-2 sm:p-4 font-semibold text-slate-700">{rupiah(akun.pengeluaran)}</td>
                      <td className="p-2 sm:p-4 font-semibold text-slate-700">{rupiah(akun.reimbursment)}</td>
                      <td className="p-2 sm:p-4 text-emerald-600 font-semibold">{rupiah(akun.total)}</td>
                      {canViewDetail && (
                        <td className="p-2 sm:p-4">
                          <button
                            onClick={() => {
                              console.log("Main table Detail clicked:", akun);
                              openDetailModal(akun);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-indigo-700"
                          >
                            {tr("Detail", "Detail")}
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      )}
                      {!canViewDetail && (
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
            <p>{tr("Periode", "Period")}: {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}</p>
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
                  {tr("Detail Biaya", "Cost Details")}: {selectedAkun.nama_akun || selectedAkun.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {tr("Periode", "Period")}: {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
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
                  <p>{tr("Memuat detail biaya...", "Loading cost details...")}</p>
                </div>
              ) : detailBiaya.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">{tr("Tidak ada data biaya untuk akun ini pada periode terpilih", "No cost data for this account in selected period")}</p>
                  {!canViewDetail && (
                    <p className="text-sm text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                      <span className="font-semibold">{tr("Perhatian", "Notice")}:</span> {tr("Fitur detail biaya hanya dapat diakses oleh superadmin.", "Cost detail feature can only be accessed by super admin.")}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-4">
                    {selectedAkun?.nama_akun || selectedAkun?.name} - {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-4">
                    <div className="text-center">
                      <p className="mb-1 text-xs text-slate-500">{tr("Biaya Jalan", "Travel Cost")}</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {rupiah(detailBiaya.filter(d => d.kategori === 'jalan').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="mb-1 text-xs text-slate-500">{tr("Biaya Pengeluaran", "Expense Cost")}</p>
                      <p className="text-2xl font-bold text-slate-700">
                        {rupiah(detailBiaya.filter(d => d.kategori === 'pengeluaran').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="mb-1 text-xs text-slate-500">{tr("Biaya Reimbursment", "Reimbursement Cost")}</p>
                      <p className="text-2xl font-bold text-slate-700">
                        {rupiah(detailBiaya.filter(d => d.kategori === 'reimbursment').reduce((sum, d) => sum + (Number(d.nominal) || 0), 0))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="mb-1 text-xs text-slate-500">Total</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {rupiah(detailBiaya.reduce((sum, d) => sum + (Number(d.nominal) || 0), 0))}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="inline-flex rounded-lg bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setActiveDetailSourceTab("projek")}
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition ${
                          activeDetailSourceTab === "projek"
                            ? "bg-white text-indigo-700 shadow-sm"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        {tr("Biaya Projek", "Project Costs")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDetailSourceTab("diluar")}
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition ${
                          activeDetailSourceTab === "diluar"
                            ? "bg-white text-indigo-700 shadow-sm"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        {tr("Biaya Diluar Projek", "Non-Project Costs")}
                      </button>
                    </div>
                  </div>

                  {[
                    {
                      key: "projek",
                      title: tr("Biaya Projek", "Project Costs"),
                      rows: detailBySource.projek,
                    },
                    {
                      key: "diluar",
                      title: tr("Biaya Diluar Projek", "Non-Project Costs"),
                      rows: detailBySource.diluar,
                    },
                  ]
                    .filter((sourceBlock) => sourceBlock.key === activeDetailSourceTab)
                    .map((sourceBlock) => (
                    <div key={sourceBlock.key} className="border rounded-xl p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">{sourceBlock.title}</h4>
                        <span className="text-xs text-gray-500">{sourceBlock.rows.length} {tr("transaksi", "transactions")}</span>
                      </div>

                      {["belum", "lunas"].map((statusKey) => {
                        const statusRows = sourceBlock.rows.filter((r) =>
                          statusKey === "lunas" ? Boolean(r.is_lunas) : !Boolean(r.is_lunas)
                        );
                        return (
                          <div key={`${sourceBlock.key}-${statusKey}`} className="mb-4 last:mb-0">
                            <h5 className={`text-sm font-semibold mb-2 ${statusKey === "lunas" ? "text-emerald-700" : "text-amber-700"}`}>
                              {statusKey === "lunas" ? tr("Lunas", "Paid") : tr("Belum Lunas", "Unpaid")}
                            </h5>

                            {["jalan", "pengeluaran", "reimbursment"].map((kategori) => {
                              const rows = statusRows.filter((item) => item.kategori === kategori);
                              const showCheckboxes = statusKey === "belum" && isSuperAdmin;
                              const kategoriGroups = statusKey === "lunas" ? groupPaidRows(rows) : [];
                              const kategoriTotal = showCheckboxes
                                ? rows
                                    .filter((item) => selectedUnpaidKeys.has(getBiayaRowKey(item)))
                                    .reduce((sum, item) => sum + (Number(item.nominal) || 0), 0)
                                : rows.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
                              const allRowsSelected =
                                showCheckboxes &&
                                rows.length > 0 &&
                                rows.every((item) => selectedUnpaidKeys.has(getBiayaRowKey(item)));
                              const someRowsSelected =
                                showCheckboxes &&
                                rows.some((item) => selectedUnpaidKeys.has(getBiayaRowKey(item)));
                              const emptyColSpan = showCheckboxes ? 7 : 6;

                              const renderItemRow = (item, idx, rowOptions = {}) => {
                                const rowKey = getBiayaRowKey(item);
                                const isHighlighted = highlightedRowKey === rowKey;
                                const isSelected = rowOptions.isSelected ?? selectedUnpaidKeys.has(rowKey);
                                return (
                                  <tr
                                    key={`${rowOptions.rowKeyPrefix || ""}${item.id}-${idx}`}
                                    id={`biaya-row-${rowKey}`}
                                    className={`border-b border-slate-100 transition-colors ${
                                      isHighlighted
                                        ? "bg-amber-100 ring-2 ring-inset ring-amber-400"
                                        : isSelected
                                          ? "bg-indigo-50 hover:bg-indigo-100"
                                          : "hover:bg-slate-50"
                                    }`}
                                  >
                                    {showCheckboxes && (
                                      <td className="p-2 text-center">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => toggleUnpaidSelection(item)}
                                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                      </td>
                                    )}
                                    <td className="p-2">{idx + 1}</td>
                                    <td className="p-2 font-medium">{rupiah(item.nominal)}</td>
                                    <td className="p-2 text-slate-600">{item.keterangan || "-"}</td>
                                    <td className="p-2">
                                      {(() => {
                                        const photoUrls = getPhotoUrlsFromItem(item);
                                        if (photoUrls.length === 0) {
                                          return <span className="text-slate-400">-</span>;
                                        }
                                        return (
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            {photoUrls.map((url, photoIdx) => (
                                              <a
                                                key={`${item.id}-photo-${photoIdx}`}
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-1 text-[11px] text-indigo-700 hover:bg-indigo-200"
                                                title={`${tr("Lihat foto", "View photo")} ${photoIdx + 1}`}
                                              >
                                                {photoUrls.length === 1 ? tr("Lihat", "View") : `${tr("Foto", "Photo")} ${photoIdx + 1}`}
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
                                              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                          }`}
                                          title={item.is_lunas ? tr("Klik untuk ubah ke Belum Lunas", "Click to change to Unpaid") : tr("Klik untuk ubah ke Lunas", "Click to change to Paid")}
                                        >
                                          {item.is_lunas ? tr("Lunas", "Paid") : tr("Belum Lunas", "Unpaid")}
                                        </button>
                                      ) : (
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_lunas ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                          {item.is_lunas ? tr("Lunas", "Paid") : tr("Belum Lunas", "Unpaid")}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2 text-slate-500">{formatDateTime(item.created_at)}</td>
                                  </tr>
                                );
                              };

                              return (
                                <div key={`${sourceBlock.key}-${statusKey}-${kategori}`} className="border rounded-lg overflow-hidden mb-3 last:mb-0">
                                  <div className="bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                                    {kategoriLabel(kategori, tr)}
                                  </div>

                                  {statusKey === "lunas" ? (
                                    kategoriGroups.length === 0 ? (
                                      <div className="p-3 text-gray-400 text-center text-xs">
                                        {tr("Tidak ada data", "No data")}
                                      </div>
                                    ) : (
                                      kategoriGroups.map((group, groupIdx) => (
                                        <div key={group.groupKey} className="border-t border-emerald-100">
                                          <div className="bg-emerald-50 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-700">
                                            <span className="font-semibold text-emerald-800">
                                              {tr("Pembayaran", "Payment")} #{kategoriGroups.length - groupIdx}
                                              <span className="ml-1.5 font-normal">
                                                · {group.items.length} {tr("transaksi", "transactions")}
                                              </span>
                                            </span>
                                            <span className="flex flex-wrap items-center gap-2">
                                              {group.lunasAt && (
                                                <span>{tr("Dilunasi", "Paid on")}: {formatDateTime(new Date(group.lunasAt).toISOString())}</span>
                                              )}
                                              <span className="font-bold">{rupiah(group.total)}</span>
                                            </span>
                                          </div>
                                          <div className="overflow-x-auto">
                                            <table className="min-w-full text-xs">
                                              <thead className="bg-white text-slate-600">
                                                <tr className="text-left">
                                                  <th className="p-2 font-semibold">{tr("No", "No")}</th>
                                                  <th className="p-2 font-semibold">{tr("Nominal", "Amount")}</th>
                                                  <th className="p-2 font-semibold">{tr("Keterangan", "Description")}</th>
                                                  <th className="p-2 font-semibold">{tr("Foto", "Photo")}</th>
                                                  <th className="p-2 font-semibold">{tr("Status", "Status")}</th>
                                                  <th className="p-2 font-semibold">{tr("Tanggal", "Date")}</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {group.items.map((item, idx) =>
                                                  renderItemRow(item, idx, { rowKeyPrefix: `${group.groupKey}-` })
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      ))
                                    )
                                  ) : (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                      <thead className="bg-white text-slate-600">
                                        <tr className="text-left">
                                          {showCheckboxes && (
                                            <th className="p-2 w-10 text-center">
                                              <input
                                                type="checkbox"
                                                checked={allRowsSelected}
                                                ref={(el) => {
                                                  if (el) el.indeterminate = someRowsSelected && !allRowsSelected;
                                                }}
                                                onChange={() => toggleSelectAllUnpaidInRows(rows)}
                                                title={tr("Pilih semua", "Select all")}
                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                              />
                                            </th>
                                          )}
                                          <th className="p-2 font-semibold">{tr("No", "No")}</th>
                                          <th className="p-2 font-semibold">{tr("Nominal", "Amount")}</th>
                                          <th className="p-2 font-semibold">{tr("Keterangan", "Description")}</th>
                                          <th className="p-2 font-semibold">{tr("Foto", "Photo")}</th>
                                          <th className="p-2 font-semibold">{tr("Status", "Status")}</th>
                                          <th className="p-2 font-semibold">{tr("Tanggal", "Date")}</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {rows.length === 0 ? (
                                          <tr>
                                            <td colSpan={emptyColSpan} className="p-3 text-gray-400 text-center">
                                              {tr("Tidak ada data", "No data")}
                                            </td>
                                          </tr>
                                        ) : (
                                          rows.map((item, idx) => renderItemRow(item, idx))
                                        )}
                                      </tbody>
                                      <tfoot>
                                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-800">
                                          <td className="p-2" colSpan={showCheckboxes ? 2 : 1}>
                                            {showCheckboxes && someRowsSelected
                                              ? tr("Total Terpilih", "Selected Total")
                                              : tr("Total", "Total")}
                                          </td>
                                          <td className="p-2">{rupiah(kategoriTotal)}</td>
                                          <td className="p-2" colSpan={4}></td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                  )}

                                  {statusKey === "lunas" && rows.length > 0 && (
                                    <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
                                      <span>{tr("Total", "Total")}</span>
                                      <span>{rupiah(kategoriTotal)}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold ${statusKey === "lunas" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                              <span>
                                {statusKey === "lunas"
                                  ? tr("Total Lunas", "Total Paid")
                                  : isSuperAdmin && selectedUnpaidItems.length > 0
                                    ? tr("Total Terpilih (Belum Lunas)", "Selected Total (Unpaid)")
                                    : tr("Total Belum Lunas", "Total Unpaid")}
                              </span>
                              <span>
                                {statusKey === "lunas"
                                  ? rupiah(statusRows.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0))
                                  : isSuperAdmin
                                    ? rupiah(selectedUnpaidTotal)
                                    : rupiah(statusRows.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0))}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex justify-between items-center gap-3">
              <p className="text-sm text-gray-500">
                {tr("Total", "Total")} {detailBiaya.length} {tr("transaksi", "transactions")}
                {isSuperAdmin && selectedUnpaidItems.length > 0 && (
                  <span className="ml-2 text-indigo-600 font-medium">
                    · {selectedUnpaidItems.length} {tr("terpilih", "selected")} ({rupiah(selectedUnpaidTotal)})
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                {isSuperAdmin && selectedUnpaidItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowBulkLunasiConfirm(true)}
                    disabled={bulkLunasiProcessing}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg font-medium transition text-sm"
                  >
                    {bulkLunasiProcessing
                      ? tr("Memproses...", "Processing...")
                      : `${tr("Lunasi Terpilih", "Pay Selected")} (${selectedUnpaidItems.length})`}
                  </button>
                )}
                <button
                  onClick={closeDetailModal}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition"
                >
                  {tr("Tutup", "Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkLunasiConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="pt-6 pb-2 px-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-emerald-100">
                <FileText size={30} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{tr("Lunasi Biaya Terpilih", "Pay Selected Costs")}</h3>
              <p className="text-sm text-gray-500 text-center">
                {tr(
                  `Anda akan melunasi ${selectedUnpaidItems.length} transaksi sekaligus.`,
                  `You are about to mark ${selectedUnpaidItems.length} transactions as paid at once.`
                )}
              </p>
            </div>

            <div className="px-6 pb-4">
              <div className="bg-emerald-50 border-2 border-emerald-200 py-3 px-4 rounded-xl text-center font-semibold text-emerald-700">
                {tr("Total", "Total")}: {rupiah(selectedUnpaidTotal)}
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowBulkLunasiConfirm(false)}
                disabled={bulkLunasiProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm disabled:opacity-60"
              >
                {tr("Batal", "Cancel")}
              </button>
              <button
                onClick={executeBulkLunasi}
                disabled={bulkLunasiProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium transition-colors text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
              >
                {bulkLunasiProcessing ? tr("Memproses...", "Processing...") : tr("Ya, Lunasi", "Yes, Pay")}
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
