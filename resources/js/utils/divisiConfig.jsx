import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  ListTodo,
  Archive,
  FileText,
  BarChart3,
  ShoppingCart,
  Truck,
  FilePlus2,
  ClipboardList,
  CalendarDays,
  Monitor,
  Wrench,
  Hammer,
  GraduationCap,
  Building2,
  Briefcase,
  Users,
  Wallet,
  Layers,
  Globe,
  Shield,
} from "lucide-react";
import api from "../api/axiosConfig";

/**
 * Daftar seluruh modul yang tersedia untuk setiap divisi.
 * Super Admin dapat menceklis / meng-uncheck modul mana saja pada setiap divisi.
 */
export const ALL_DIVISION_MODULES = [
  {
    key: "inventory",
    titleId: "Inventory",
    titleEn: "Inventory",
    descId: (divName) => `Kelola perangkat, peralatan, dan stok barang ${divName}`,
    descEn: (divName) => `Manage devices, equipment, and stock for ${divName}`,
    shortDescId: "Kelola perangkat, server, peralatan, dan stok barang divisi",
    shortDescEn: "Manage division devices, equipment, and stock",
    icon: (size = 24) => <Package size={size} className="text-indigo-600" />,
    allowUserRole: false,
    getPath: (basePath, slug) =>
      slug === "logistik"
        ? `${basePath}/${slug}/inventory-umum`
        : `${basePath}/${slug}/inventory`,
  },
  {
    key: "progres_pekerjaan",
    titleId: "Progres Pekerjaan",
    titleEn: "Work Progress",
    descId: (divName) => `Pantau status dan perkembangan pekerjaan ${divName}`,
    descEn: (divName) => `Track work status and progress for ${divName}`,
    shortDescId: "Pantau status dan perkembangan projek/pekerjaan divisi",
    shortDescEn: "Track work status and project progress",
    icon: (size = 24) => <ListTodo size={size} className="text-indigo-600" />,
    allowUserRole: true,
    getPath: (basePath, slug) => `${basePath}/${slug}/projek`,
  },
  {
    key: "archive_pekerjaan",
    titleId: "Archive Pekerjaan",
    titleEn: "Work Archive",
    descId: () => "Lihat pekerjaan selesai yang sudah di-archive",
    descEn: () => "View completed archived work",
    shortDescId: "Lihat daftar pekerjaan selesai yang sudah di-archive",
    shortDescEn: "View completed work that has been archived",
    icon: (size = 24) => <Archive size={size} className="text-indigo-600" />,
    allowUserRole: false,
    getPath: (basePath, slug) => `${basePath}/${slug}/projek/archive`,
  },
  {
    key: "berita_acara",
    titleId: "Berita Acara",
    titleEn: "Minutes Report",
    descId: (divName) => `Buat dan kelola berita acara ${divName}`,
    descEn: (divName) => `Create and manage minutes reports for ${divName}`,
    shortDescId: "Buat & kelola dokumen BAM, BAST, BAUF, SPPD, SPH, PO, Invoice, Service Report",
    shortDescEn: "Create & manage BAM, BAST, BAUF, SPPD, SPH, PO, Invoice, Service Report",
    icon: (size = 24) => <FileText size={size} className="text-indigo-600" />,
    allowUserRole: false,
    getPath: (basePath, slug) => `${basePath}/${slug}/berita-acara`,
  },
  {
    key: "target",
    titleId: "Target",
    titleEn: "Target",
    descId: () => "Kelola target dan performa penjualan",
    descEn: () => "Manage sales targets and performance",
    shortDescId: "Kelola target dan pencapaian performa penjualan",
    shortDescEn: "Manage targets and sales performance",
    icon: (size = 24) => <BarChart3 size={size} className="text-indigo-600" />,
    allowUserRole: false,
    getPath: (basePath, slug) => `${basePath}/${slug}/target`,
  },
  {
    key: "pembelian",
    titleId: "Pembelian",
    titleEn: "Purchases",
    descId: () => "Kelola pembelian barang",
    descEn: () => "Manage item purchases",
    shortDescId: "Kelola pengadaan dan daftar pembelian barang",
    shortDescEn: "Manage procurement and item purchases",
    icon: (size = 24) => <ShoppingCart size={size} className="text-indigo-600" />,
    allowUserRole: false,
    getPath: (basePath, slug) => `${basePath}/${slug}/pembelian`,
  },
  {
    key: "inventory_logistik",
    titleId: "Inventory Logistik",
    titleEn: "Logistics Inventory",
    descId: () => "Kelola perangkat dan stok barang logistik",
    descEn: () => "Manage logistics devices and stock",
    shortDescId: "Kelola inventaris dan stok barang khusus logistik",
    shortDescEn: "Manage dedicated logistics inventory and stock",
    icon: (size = 24) => <Truck size={size} className="text-indigo-600" />,
    allowUserRole: false,
    getPath: (basePath, slug) =>
      slug === "logistik"
        ? `${basePath}/logistik/inventory`
        : `${basePath}/${slug}/logistik-inventory`,
  },
  {
    key: "rfi",
    titleId: "Form RFI",
    titleEn: "Form RFI",
    descId: () => "Isi template RFI dan unduh Excel",
    descEn: () => "Fill the RFI template and download",
    shortDescId: "Isi formulir Request For Information (RFI) dan unduh Excel",
    shortDescEn: "Fill Request For Information (RFI) template and export Excel",
    icon: (size = 24) => <FilePlus2 size={size} className="text-indigo-600" />,
    allowUserRole: false,
    getPath: (basePath, slug) => `${basePath}/${slug}/rfi`,
  },
  {
    key: "work_checklist_planning",
    titleId: "Form Work Checklist Planning",
    titleEn: "Work Checklist Planning",
    descId: () => "Isi checklist planning dan unduh Excel/PDF",
    descEn: () => "Fill planning checklist and export Excel/PDF",
    shortDescId: "Isi Work Checklist tahap Planning dan ekspor Excel/PDF",
    shortDescEn: "Fill Planning Work Checklist and export Excel/PDF",
    icon: (size = 24) => <ClipboardList size={size} className="text-indigo-600" />,
    allowUserRole: false,
    getPath: (basePath, slug) => `${basePath}/${slug}/work-checklist/planning`,
  },
  {
    key: "work_checklist_realisasi",
    titleId: "Form Work Checklist Realisasi",
    titleEn: "Work Checklist Realisasi",
    descId: () => "Isi checklist realisasi dan unduh Excel/PDF",
    descEn: () => "Fill realization checklist and export Excel/PDF",
    shortDescId: "Isi Work Checklist tahap Realisasi dan ekspor Excel/PDF",
    shortDescEn: "Fill Realization Work Checklist and export Excel/PDF",
    icon: (size = 24) => <ClipboardList size={size} className="text-indigo-600" />,
    allowUserRole: false,
    getPath: (basePath, slug) => `${basePath}/${slug}/work-checklist/realisasi`,
  },
  {
    key: "daily_report",
    titleId: "Daily Report",
    titleEn: "Daily Report",
    descId: () => "Isi laporan harian proyek dan unduh Excel/PDF",
    descEn: () => "Fill daily site report and export Excel/PDF",
    shortDescId: "Isi laporan harian proyek (Daily Report) dan ekspor Excel/PDF",
    shortDescEn: "Fill daily project site report and export Excel/PDF",
    icon: (size = 24) => <CalendarDays size={size} className="text-indigo-600" />,
    allowUserRole: false,
    getPath: (basePath, slug) => `${basePath}/${slug}/daily-report`,
  },
];

export const DEFAULT_DIVISIS = [
  {
    id: 1,
    name: "IT",
    slug: "it",
    subtitle_id: "Kelola aset dan progres pekerjaan IT",
    subtitle_en: "Manage IT assets and work progress",
    icon_key: "monitor",
    card_image: "/images/IT Card.png",
    modules: ["inventory", "progres_pekerjaan", "archive_pekerjaan"],
    is_default: true,
    sort_order: 1,
  },
  {
    id: 2,
    name: "Service",
    slug: "service",
    subtitle_id: "Kelola inventory dan pekerjaan servis",
    subtitle_en: "Manage inventory and service jobs",
    icon_key: "wrench",
    card_image: "/images/Card Service.png",
    modules: ["inventory", "progres_pekerjaan", "archive_pekerjaan", "berita_acara"],
    is_default: true,
    sort_order: 2,
  },
  {
    id: 3,
    name: "Kontraktor",
    slug: "kontraktor",
    subtitle_id: "Kelola inventory dan progres pekerjaan kontraktor",
    subtitle_en: "Manage contractor inventory and work progress",
    icon_key: "hammer",
    card_image: "/images/Kontraktor Card.png",
    modules: [
      "inventory",
      "progres_pekerjaan",
      "archive_pekerjaan",
      "rfi",
      "work_checklist_planning",
      "work_checklist_realisasi",
      "daily_report",
    ],
    is_default: true,
    sort_order: 3,
  },
  {
    id: 4,
    name: "Sales",
    slug: "sales",
    subtitle_id: "Kelola target, progres pekerjaan, dan dokumentasi penjualan",
    subtitle_en: "Manage targets, work progress, and sales documentation",
    icon_key: "bar_chart",
    card_image: "/images/Card Sales.png",
    modules: ["target", "progres_pekerjaan", "archive_pekerjaan"],
    is_default: true,
    sort_order: 4,
  },
  {
    id: 5,
    name: "Logistik",
    slug: "logistik",
    subtitle_id: "Kelola pengiriman, progres pekerjaan, dan dokumentasi logistik",
    subtitle_en: "Manage deliveries, work progress, and logistics documentation",
    icon_key: "truck",
    card_image: "/images/logistik card.png",
    modules: ["progres_pekerjaan", "archive_pekerjaan", "inventory_logistik"],
    is_default: true,
    sort_order: 5,
  },
  {
    id: 6,
    name: "Purchasing",
    slug: "purchasing",
    subtitle_id: "Kelola pengadaan, progres pekerjaan, dan dokumentasi purchasing",
    subtitle_en: "Manage procurement, work progress, and purchasing documentation",
    icon_key: "shopping_cart",
    card_image: "/images/Purchasing Card.png",
    modules: ["inventory", "progres_pekerjaan", "archive_pekerjaan", "pembelian"],
    is_default: true,
    sort_order: 6,
  },
  {
    id: 7,
    name: "SIPLAH",
    slug: "siplah",
    subtitle_id: "Kelola progres pekerjaan dan dokumentasi SIPLAH",
    subtitle_en: "Manage SIPLAH work progress and documentation",
    icon_key: "graduation_cap",
    card_image: "/images/Purchasing Card.png",
    modules: ["inventory", "progres_pekerjaan", "archive_pekerjaan"],
    is_default: true,
    sort_order: 7,
  },
];

export const DIVISI_ICON_OPTIONS = [
  { key: "monitor", label: "Monitor / IT", render: (size = 18) => <Monitor size={size} /> },
  { key: "wrench", label: "Service / Alat", render: (size = 18) => <Wrench size={size} /> },
  { key: "hammer", label: "Kontraktor", render: (size = 18) => <Hammer size={size} /> },
  { key: "bar_chart", label: "Sales / Grafik", render: (size = 18) => <BarChart3 size={size} /> },
  { key: "truck", label: "Logistik", render: (size = 18) => <Truck size={size} /> },
  { key: "shopping_cart", label: "Purchasing", render: (size = 18) => <ShoppingCart size={size} /> },
  { key: "graduation_cap", label: "Edukasi / SIPLAH", render: (size = 18) => <GraduationCap size={size} /> },
  { key: "building", label: "Gedung / Divisi", render: (size = 18) => <Building2 size={size} /> },
  { key: "briefcase", label: "Bisnis / Kantor", render: (size = 18) => <Briefcase size={size} /> },
  { key: "users", label: "Tim / SDM", render: (size = 18) => <Users size={size} /> },
  { key: "wallet", label: "Keuangan", render: (size = 18) => <Wallet size={size} /> },
  { key: "layers", label: "Operasional", render: (size = 18) => <Layers size={size} /> },
  { key: "globe", label: "Digital / Umum", render: (size = 18) => <Globe size={size} /> },
  { key: "shield", label: "Keamanan / Legal", render: (size = 18) => <Shield size={size} /> },
];

export const DIVISI_IMAGE_PRESETS = [
  { label: "Cover IT", value: "/images/IT Card.png" },
  { label: "Cover Service", value: "/images/Card Service.png" },
  { label: "Cover Kontraktor", value: "/images/Kontraktor Card.png" },
  { label: "Cover Sales", value: "/images/Card Sales.png" },
  { label: "Cover Logistik", value: "/images/logistik card.png" },
  { label: "Cover Purchasing", value: "/images/Purchasing Card.png" },
];

export function getDivisiIcon(iconKey, size = 18) {
  const found = DIVISI_ICON_OPTIONS.find((o) => o.key === iconKey);
  return found ? found.render(size) : <Building2 size={size} />;
}

const STORAGE_KEY = "hsr_divisis_cache_v1";
let inflightDivisiPromise = null;
let lastDivisiFetchTime = 0;

export function getCachedDivisis() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DIVISIS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_DIVISIS;
}

export function setCachedDivisis(list) {
  try {
    if (Array.isArray(list) && list.length > 0) {
      lastDivisiFetchTime = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("hsr-divisis-updated", { detail: list }));
    }
  } catch {
    // ignore
  }
}

export function useDivisis() {
  const [allDivisis, setAllDivisis] = useState(() => getCachedDivisis());
  const [loadingDivisis, setLoadingDivisis] = useState(false);

    const fetchDivisis = useCallback(async (force = false) => {
      const now = Date.now();
      if (!force && now - lastDivisiFetchTime < 15000) {
        return;
      }
      if (inflightDivisiPromise) {
        try {
          const list = await inflightDivisiPromise;
          if (Array.isArray(list) && list.length > 0) {
            setAllDivisis(list);
          }
        } catch {
          // ignore
        }
        return;
      }

      try {
        setLoadingDivisis(true);
        inflightDivisiPromise = api.get("/divisis").then((res) => res.data?.data ?? res.data);
        const list = await inflightDivisiPromise;
        if (Array.isArray(list) && list.length > 0) {
          setAllDivisis(list);
          setCachedDivisis(list);
        }
      } catch (err) {
        console.error("Gagal memuat daftar divisi:", err);
      } finally {
        inflightDivisiPromise = null;
        setLoadingDivisis(false);
      }
    }, []);

    useEffect(() => {
      fetchDivisis(false);
      const onUpdated = (e) => {
        if (Array.isArray(e.detail) && e.detail.length > 0) {
          setAllDivisis(e.detail);
        } else {
          setAllDivisis(getCachedDivisis());
        }
      };
      window.addEventListener("hsr-divisis-updated", onUpdated);
      return () => window.removeEventListener("hsr-divisis-updated", onUpdated);
    }, [fetchDivisis]);

    const activeDivisis = allDivisis.filter((d) => d?.is_active !== false);

    return {
      divisis: activeDivisis.length > 0 ? activeDivisis : allDivisis,
      allDivisis,
      loadingDivisis,
      refreshDivisis: () => fetchDivisis(true),
    };
  }
