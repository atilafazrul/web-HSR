import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
  Search,
  Loader2,
  AlertCircle,
  Save,
  CheckCircle2,
  Briefcase,
  Calendar,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Pencil,
} from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import api from "../api/axiosConfig";
import { useI18n } from "../i18n/index.jsx";
import { DashboardSurface } from "../components/dashboard/DashboardPrimitives.jsx";
import { digitsOnly, formatRibuanId, parseRibuanId, nominalApiToInput } from "../utils/formatRupiahInput";

/* ============================================================
 * UTIL
 * ============================================================ */
const formatRupiah = (value) => {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

/** Format Rupiah ringkas: 101000000 -> "Rp 101 Jt", 1500000000 -> "Rp 1,5 M" */
const formatRupiahCompact = (value) => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1).replace(".", ",")} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(".", ",")} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(n);
};

const PROJECTS_PER_VIEW = 5;
const PROFIT_CHART_SIZE = 180;

const formatTanggal = (d, locale = "id-ID") => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

/* ============================================================
 * MAIN
 * ============================================================ */
export default function TargetPage() {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const dateLocale = language === "en" ? "en-GB" : "id-ID";

  const [projek, setProjek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [biayaLuarProjek, setBiayaLuarProjek] = useState({ by_divisi: [], grand_total: 0 });
  const [biayaLuarLoading, setBiayaLuarLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("");

  // map projek_id -> string formatted display
  const [poInputs, setPoInputs] = useState({});
  // map projek_id -> "idle" | "saving" | "saved" | "error"
  const [saveState, setSaveState] = useState({});
  const [projectSlide, setProjectSlide] = useState(0);
  const projectCarouselRef = useRef(null);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/projek-kerja", { params: { include_archived: 1 } });
      let data = res.data?.data || res.data || [];
      data = Array.isArray(data) ? data : [];
      setProjek(data);

      // Inisialisasi input PO dari data API
      const map = {};
      data.forEach((p) => {
        map[p.id] = nominalApiToInput(p.nominal_po);
      });
      setPoInputs(map);
    } catch (err) {
      console.error(err);
      setError(tr("Gagal memuat data projek", "Failed to load project data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchBiayaLuarProjek = async (divisiFilter = "") => {
    setBiayaLuarLoading(true);
    try {
      const params = divisiFilter ? { divisi: divisiFilter } : {};
      const res = await api.get("/dashboard-biaya/summary-per-divisi", { params });
      setBiayaLuarProjek(res.data?.data || { by_divisi: [], grand_total: 0 });
    } catch (err) {
      console.error(err);
      setBiayaLuarProjek({ by_divisi: [], grand_total: 0 });
    } finally {
      setBiayaLuarLoading(false);
    }
  };

  useEffect(() => {
    fetchBiayaLuarProjek(filterDivisi);
  }, [filterDivisi]);

  /* ================= HANDLERS ================= */
  const handlePoChange = (id, raw) => {
    const formatted = formatRibuanId(digitsOnly(raw));
    setPoInputs((prev) => ({ ...prev, [id]: formatted }));
    setSaveState((prev) => ({ ...prev, [id]: "idle" }));
  };

  const savePo = async (id) => {
    const value = parseRibuanId(poInputs[id] || "");
    setSaveState((prev) => ({ ...prev, [id]: "saving" }));
    try {
      const res = await api.patch(`/projek-kerja/${id}/nominal-po`, {
        nominal_po: value,
      });
      const updated = res.data?.data;
      // Update list dengan data terbaru (nominal_po, total_biaya, profit)
      setProjek((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                nominal_po: updated?.nominal_po ?? value,
                total_biaya: updated?.total_biaya ?? p.total_biaya,
                profit: updated?.profit ?? value - (p.total_biaya || 0),
              }
            : p
        )
      );
      setSaveState((prev) => ({ ...prev, [id]: "saved" }));
      // Auto reset ke idle setelah 2 detik
      setTimeout(() => {
        setSaveState((prev) => ({ ...prev, [id]: "idle" }));
      }, 2000);
    } catch (err) {
      console.error(err);
      setSaveState((prev) => ({ ...prev, [id]: "error" }));
      alert(err.response?.data?.message || tr("Gagal menyimpan nominal PO", "Failed to save PO amount"));
    }
  };

  /* ================= DERIVED ================= */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projek.filter((p) => {
      const matchSearch =
        !term ||
        (p.jenis_pekerjaan || "").toLowerCase().includes(term) ||
        (p.karyawan || "").toLowerCase().includes(term) ||
        (p.alamat || "").toLowerCase().includes(term);
      const matchStatus = !filterStatus || p.status === filterStatus;
      const matchDivisi = !filterDivisi || p.divisi === filterDivisi;
      return matchSearch && matchStatus && matchDivisi;
    });
  }, [projek, search, filterStatus, filterDivisi]);

  // Summary ikut filter aktif supaya total mencerminkan apa yang ditampilkan
  const summary = useMemo(() => {
    const list = filtered;
    const totalPO = list.reduce((s, p) => s + (Number(p.nominal_po) || 0), 0);
    const totalBiaya = list.reduce((s, p) => s + (Number(p.total_biaya) || 0), 0);
    const totalBiayaLuar = Number(biayaLuarProjek?.grand_total) || 0;
    const totalBiayaGabungan = totalBiaya + totalBiayaLuar;
    const totalProfit = totalPO - totalBiayaGabungan;
    const margin = totalPO > 0 ? (totalProfit / totalPO) * 100 : 0;
    return {
      totalPO,
      totalBiaya,
      totalBiayaLuar,
      totalBiayaGabungan,
      totalProfit,
      margin,
      count: list.length,
    };
  }, [filtered, biayaLuarProjek?.grand_total]);

  const statusOptions = useMemo(() => {
    const set = new Set();
    projek.forEach((p) => p.status && set.add(p.status));
    return Array.from(set).sort();
  }, [projek]);

  const divisiOptions = useMemo(() => {
    const set = new Set();
    projek.forEach((p) => p.divisi && set.add(p.divisi));
    return Array.from(set).sort();
  }, [projek]);

  const projectSlides = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < filtered.length; i += PROJECTS_PER_VIEW) {
      chunks.push(filtered.slice(i, i + PROJECTS_PER_VIEW));
    }
    return chunks;
  }, [filtered]);

  const projectSlideCount = projectSlides.length;
  const canSlideProjects = projectSlideCount > 1;

  useEffect(() => {
    setProjectSlide(0);
    projectCarouselRef.current?.scrollTo({ left: 0, behavior: "auto" });
  }, [search, filterStatus, filterDivisi, filtered.length]);

  const scrollToProjectSlide = (index) => {
    const el = projectCarouselRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(index, projectSlideCount - 1));
    setProjectSlide(next);
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const handleProjectCarouselScroll = () => {
    const el = projectCarouselRef.current;
    if (!el || el.clientWidth <= 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== projectSlide) setProjectSlide(idx);
  };

  const getProjectMetrics = (p) => {
    const po = parseRibuanId(poInputs[p.id] || "");
    const biaya = Number(p.total_biaya) || 0;
    const profit = po - biaya;
    const margin = po > 0 ? (profit / po) * 100 : 0;
    const dirty =
      String(parseRibuanId(poInputs[p.id] || "")) !==
      String(Math.round(Number(p.nominal_po) || 0));
    const state = saveState[p.id] || "idle";
    return { po, biaya, profit, margin, dirty, state };
  };

  /* ================= RENDER ================= */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-white to-indigo-50/40 px-5 py-5 sm:px-6 sm:py-6 shadow-sm shadow-slate-900/5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-300/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-4 h-28 w-28 rounded-full bg-emerald-300/10 blur-2xl" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600/90">
            {tr("Sales · Profit Tracker", "Sales · Profit Tracker")}
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {tr("Target & Profit Projek", "Project Target & Profit")}
          </h1>
          <div className="mt-3 h-1 w-12 rounded-full bg-indigo-500/80" />
        </div>
      </div>

      {/* SUMMARY GRID - 2 angka kiri + chart panel kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            <SummaryCard
              label={tr("Total PO", "Total PO")}
              value={formatRupiah(summary.totalPO)}
              accent="from-indigo-500 to-indigo-600"
              glow="bg-indigo-300/15"
              badge="bg-indigo-50 text-indigo-700 ring-indigo-200/70"
              icon={Wallet}
              hint={tr("Akumulasi semua PO", "Sum of all POs")}
            />
            <SummaryCard
              label={tr("Total di Dalam Projek", "Total In-Project")}
              value={formatRupiah(summary.totalBiaya)}
              accent="from-slate-500 to-slate-700"
              glow="bg-slate-300/20"
              badge="bg-slate-100 text-slate-700 ring-slate-200/70"
              icon={Receipt}
              hint={tr("Jalan + Pengeluaran + Reimburs. (dalam projek)", "Travel + Expense + Reimburs. (in project)")}
            />
          </div>
          <OutsideProjectBiayaCard
            data={biayaLuarProjek}
            loading={biayaLuarLoading}
            filterDivisi={filterDivisi}
            tr={tr}
          />
        </div>

        {/* KANAN: Profit Panel dengan donut chart (span 2 kolom di lg) */}
        <div className="lg:col-span-2">
          <ProfitPanel summary={summary} tr={tr} />
        </div>
      </div>

      {/* FILTER */}
      <DashboardSurface className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Filter size={15} className="text-slate-400" />
            <span className="text-sm font-semibold">{tr("Filter Projek", "Project Filter")}</span>
          </div>
          <span className="text-xs text-slate-500">
            {filtered.length} {tr("dari", "of")} {projek.length} {tr("projek", "projects")}
          </span>
        </div>

        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr("Cari nama projek / karyawan / lokasi...", "Search project / employee / location...")}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200/80 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm placeholder:text-slate-400 transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <FilterSelect
            label={tr("Divisi", "Division")}
            icon={Building2}
            value={filterDivisi}
            onChange={setFilterDivisi}
          >
            <option value="">{tr("Semua divisi", "All divisions")}</option>
            {divisiOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label={tr("Status", "Status")}
            icon={CheckCircle2}
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <option value="">{tr("Semua status", "All statuses")}</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </FilterSelect>
        </div>
      </DashboardSurface>

      {/* TABLE / LIST */}
      <DashboardSurface className="overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="animate-spin" size={28} />
            <p className="mt-3 text-sm">{tr("Memuat data...", "Loading data...")}</p>
          </div>
        ) : error ? (
          <div className="py-16 flex flex-col items-center justify-center text-rose-600">
            <AlertCircle size={28} />
            <p className="mt-3 text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700"
            >
              {tr("Coba lagi", "Retry")}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Briefcase size={36} className="mb-3 text-slate-300" />
            <p className="text-sm">{tr("Belum ada data projek", "No projects available")}</p>
            <p className="text-xs text-slate-400 mt-1">
              {tr("Tambahkan projek dulu di menu Projek Kerja.", "Add a project first in the Project Work menu.")}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
              <p className="min-w-0 flex-1 basis-[min(100%,12rem)] text-[11px] font-semibold uppercase leading-snug tracking-wide text-slate-500 break-words">
                {tr("Daftar Projek", "Project List")}{" "}
                <span className="font-normal normal-case text-slate-400">
                  ({tr("maks. 5 per slide", "max. 5 per slide")})
                </span>
              </p>
              {canSlideProjects && (
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs tabular-nums text-slate-500">
                    {projectSlide + 1} / {projectSlideCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToProjectSlide(projectSlide - 1)}
                    disabled={projectSlide === 0}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={tr("Projek sebelumnya", "Previous projects")}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToProjectSlide(projectSlide + 1)}
                    disabled={projectSlide >= projectSlideCount - 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={tr("Projek berikutnya", "Next projects")}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            <div
              ref={projectCarouselRef}
              onScroll={handleProjectCarouselScroll}
              className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {projectSlides.map((slideProjects, slideIdx) => (
                <div
                  key={`slide-${slideIdx}`}
                  className="w-full min-w-0 shrink-0 snap-start snap-always px-3 py-4 sm:px-4"
                >
                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {slideProjects.map((p) => {
                      const { po, biaya, profit, margin, dirty, state } = getProjectMetrics(p);
                      return (
                        <ProjectCard
                          key={p.id}
                          p={p}
                          po={po}
                          biaya={biaya}
                          profit={profit}
                          margin={margin}
                          dirty={dirty}
                          state={state}
                          poValue={poInputs[p.id] || ""}
                          onPoChange={(v) => handlePoChange(p.id, v)}
                          onPoBlur={() => dirty && savePo(p.id)}
                          dateLocale={dateLocale}
                          tr={tr}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {canSlideProjects && (
              <div className="flex justify-center gap-1.5 border-t border-slate-100 px-4 py-3">
                {projectSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToProjectSlide(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === projectSlide ? "w-6 bg-indigo-600" : "w-2 bg-slate-300 hover:bg-slate-400"
                    }`}
                    aria-label={`${tr("Slide", "Slide")} ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="border-t-2 border-slate-200 bg-slate-50/60 px-4 py-4 sm:px-5">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-semibold text-slate-800">
                    {tr("Total", "Total")}{" "}
                    <span className="font-normal text-slate-500">
                      ({filtered.length} {tr("projek", "projects")})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-indigo-600">{tr("Nominal PO", "PO Amount")}</p>
                  <p className="font-bold tabular-nums text-indigo-700">{formatRupiah(summary.totalPO)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">{tr("Total di Dalam Projek", "Total In-Project")}</p>
                  <p className="font-bold tabular-nums text-slate-800">{formatRupiah(summary.totalBiaya)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">{tr("Profit / Margin", "Profit / Margin")}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <ProfitText profit={summary.totalProfit} hasPo={summary.totalPO > 0} />
                    <MarginPill margin={summary.margin} hasPo={summary.totalPO > 0} />
                  </div>
                </div>
              </div>
            </div>

          </>
        )}
      </DashboardSurface>
    </div>
  );
}

/* ============================================================
 * SUB COMPONENTS
 * ============================================================ */
const FilterSelect = ({ label, icon: Icon, value, onChange, children }) => (
  <div>
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 ml-0.5">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-700 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm transition appearance-none cursor-pointer truncate"
      >
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const DIVISI_TONE = {
  IT:          "bg-sky-50 text-sky-700 ring-sky-200/70",
  Service:     "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  Sales:       "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
  Kontraktor:  "bg-amber-50 text-amber-800 ring-amber-200/70",
  Logistik:    "bg-violet-50 text-violet-700 ring-violet-200/70",
  Purchasing:  "bg-rose-50 text-rose-700 ring-rose-200/70",
};

const DivisiBadge = ({ divisi }) => {
  if (!divisi) return <span className="text-slate-400 text-xs">-</span>;
  const tone = DIVISI_TONE[divisi] || "bg-slate-100 text-slate-700 ring-slate-200/70";
  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tone}`}
    >
      <Building2 size={11} className="shrink-0" />
      {divisi}
    </span>
  );
};

const ProjectStatRow = ({ label, value, valueTitle }) => (
  <div className="min-w-0 space-y-1.5 py-2.5">
    <p className="text-[10px] font-semibold uppercase leading-none tracking-wider text-slate-500">{label}</p>
    <div className="flex min-w-0 justify-end">
      <div
        className="max-w-full overflow-x-auto overflow-y-hidden rounded-sm px-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/90"
        title={typeof valueTitle === "string" ? valueTitle : undefined}
      >
        {typeof value === "string" ? (
          <span className="inline-block whitespace-nowrap text-right text-[13px] font-bold tabular-nums leading-snug text-slate-800 sm:text-sm">
            {value}
          </span>
        ) : (
          <div className="inline-flex min-w-0 items-center justify-end whitespace-nowrap text-right text-[13px] font-bold leading-snug sm:text-sm">
            {value}
          </div>
        )}
      </div>
    </div>
  </div>
);

const ProjectCard = ({
  p,
  po,
  biaya,
  profit,
  margin,
  poValue,
  onPoChange,
  onPoBlur,
  state,
  dateLocale,
  tr,
}) => {
  const metaLine = [p.karyawan, p.alamat].filter(Boolean).join(" · ");

  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/40 shadow-sm ring-1 ring-slate-900/[0.04] transition hover:border-slate-300 hover:shadow-md">
      <header className="space-y-2 border-b border-slate-100 bg-white px-3.5 pb-3 pt-3.5 sm:px-4 sm:pt-4">
        <h3
          className="w-full min-w-0 text-sm font-bold leading-snug text-slate-900 break-words [overflow-wrap:anywhere]"
          title={p.jenis_pekerjaan}
        >
          {p.jenis_pekerjaan}
        </h3>
        {metaLine ? (
          <p
            className="w-full min-w-0 text-[11px] leading-relaxed text-slate-500 break-words [overflow-wrap:anywhere]"
            title={metaLine}
          >
            {metaLine}
          </p>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-slate-500">
          <DivisiBadge divisi={p.divisi} />
          <span className="inline-flex min-w-0 items-center gap-1">
            <Calendar size={12} className="shrink-0 text-slate-400" />
            {formatTanggal(p.start_date, dateLocale)}
          </span>
          {p.status ? (
            <span className="inline-flex max-w-full shrink-0 items-center rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-sky-200/80">
              {p.status}
            </span>
          ) : null}
          {p.is_archived ? (
            <span className="inline-flex max-w-full shrink-0 items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200/80">
              {tr("Arsip", "Archived")}
            </span>
          ) : null}
        </div>
      </header>

      <div className="px-3.5 py-3 sm:px-4">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {tr("Nominal PO", "PO Amount")}
        </p>
        <PoInput
          value={poValue}
          onChange={onPoChange}
          onBlur={onPoBlur}
          state={state}
          fullWidth
          compact
        />
      </div>

      <footer className="mt-auto divide-y divide-slate-200/80 border-t border-slate-100 bg-slate-50/80 px-3 py-1 sm:px-3.5">
        <ProjectStatRow label={tr("Biaya di Dalam Projek", "In-Project Cost")} value={formatRupiah(biaya)} valueTitle={formatRupiah(biaya)} />
        <ProjectStatRow
          label={tr("Profit", "Profit")}
          value={<ProfitText profit={profit} hasPo={po > 0} />}
          valueTitle={po > 0 ? formatRupiah(profit) : undefined}
        />
        <ProjectStatRow
          label={tr("Margin", "Margin")}
          value={<MarginPill margin={margin} hasPo={po > 0} />}
          valueTitle={po > 0 ? `${margin.toFixed(2)}%` : undefined}
        />
      </footer>
    </article>
  );
};

const SummaryCard = ({ label, value, accent, glow, badge, icon: Icon, hint }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/90 p-3 sm:p-4 md:p-5 shadow-sm transition-all hover:border-slate-300/90 hover:shadow-md h-full">
    <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${glow}`} />
    <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent} opacity-90`} />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl whitespace-nowrap overflow-hidden text-ellipsis">
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-[10px] text-slate-400 leading-tight">{hint}</p>
        )}
      </div>
      <div className={`flex shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-xl items-center justify-center ring-1 ring-inset transition group-hover:scale-[1.03] ${badge}`}>
        <Icon size={16} />
      </div>
    </div>
  </div>
);

const OutsideProjectBiayaCard = ({ data, loading, filterDivisi, tr }) => {
  const rows = Array.isArray(data?.by_divisi) ? data.by_divisi : [];
  const grandTotal = Number(data?.grand_total) || 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-white to-violet-50/40 p-3 sm:p-4 shadow-sm h-full">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl bg-violet-300/15" />
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-600 opacity-90" />
      <div className="relative">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
              {tr("Biaya di Luar Projek", "Off-Project Cost")}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500 leading-tight">
              {filterDivisi
                ? tr(`Per divisi · ${filterDivisi}`, `Per division · ${filterDivisi}`)
                : tr("Per divisi", "Per division")}
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-200/70">
            <Building2 size={16} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">
            {tr("Belum ada biaya di luar projek", "No off-project costs yet")}
          </p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
            {rows.map((row) => {
              const tone = DIVISI_TONE[row.divisi] || "bg-slate-100 text-slate-700 ring-slate-200/70";
              return (
                <div
                  key={row.divisi}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white/80 px-2.5 py-2 ring-1 ring-slate-200/70"
                >
                  <span className={`inline-flex max-w-[55%] items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tone}`}>
                    <Building2 size={10} className="shrink-0" />
                    <span className="truncate">{row.divisi}</span>
                  </span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-slate-800" title={formatRupiah(row.total)}>
                    {formatRupiahCompact(row.total)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-violet-100 pt-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
            {tr("Total Luar Projek", "Total Off-Project")}
          </span>
          <span className="text-sm font-bold tabular-nums text-violet-800" title={formatRupiah(grandTotal)}>
            {loading ? "—" : formatRupiahCompact(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
 * PROFIT PANEL - combines Total Profit + Margin Profit + donut chart
 * ============================================================ */
const ProfitPanel = ({ summary, tr }) => {
  const { totalPO, totalBiaya, totalBiayaLuar, totalBiayaGabungan, totalProfit, margin } = summary;
  const isProfit = totalProfit >= 0;
  const hasData = totalPO > 0;

  // Untuk donut chart: persentase biaya & profit terhadap PO
  const biayaPct = totalPO > 0 ? (totalBiayaGabungan / totalPO) * 100 : 0;
  const profitPct = totalPO > 0 ? Math.max(0, (totalProfit / totalPO) * 100) : 0;
  const overshootPct = totalPO > 0 && totalProfit < 0 ? Math.min(100, (Math.abs(totalProfit) / totalPO) * 100) : 0;

  const chartData = hasData
    ? totalProfit >= 0
      ? [
          { name: tr("Biaya", "Cost"), value: totalBiayaGabungan, color: "#475569" },
          { name: tr("Profit", "Profit"), value: totalProfit, color: "#10b981" },
        ]
      : [
          { name: tr("Biaya", "Cost"), value: totalPO, color: "#475569" },
          { name: tr("Rugi", "Loss"), value: Math.abs(totalProfit), color: "#ef4444" },
        ]
    : [{ name: tr("Belum ada data", "No data"), value: 1, color: "#e2e8f0" }];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 shadow-sm h-full">
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl ${
          !hasData ? "bg-slate-300/15" : isProfit ? "bg-emerald-300/20" : "bg-rose-300/20"
        }`}
      />
      <div
        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${
          !hasData
            ? "from-slate-300 to-slate-400"
            : isProfit
            ? "from-emerald-500 to-emerald-600"
            : "from-rose-500 to-rose-600"
        } opacity-90`}
      />

      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-5 md:p-6 items-center">
        {/* CHART KIRI */}
        <div className="flex flex-col items-center">
          <div
            className="relative mx-auto shrink-0"
            style={{ width: PROFIT_CHART_SIZE, height: PROFIT_CHART_SIZE }}
          >
            <PieChart width={PROFIT_CHART_SIZE} height={PROFIT_CHART_SIZE}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="95%"
                paddingAngle={hasData ? 2 : 0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>

            {/* CENTER LABEL */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[9px] uppercase font-semibold tracking-wider text-slate-400">
                {tr("Margin", "Margin")}
              </p>
              <p
                className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${
                  !hasData ? "text-slate-400" : isProfit ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {hasData ? `${margin.toFixed(1)}%` : "—"}
              </p>
              <div
                className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  !hasData
                    ? "bg-slate-100 text-slate-500"
                    : isProfit
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {hasData ? (
                  isProfit ? (
                    <>
                      <TrendingUp size={9} /> {tr("Untung", "Profit")}
                    </>
                  ) : (
                    <>
                      <TrendingDown size={9} /> {tr("Rugi", "Loss")}
                    </>
                  )
                ) : (
                  tr("Belum ada PO", "No PO yet")
                )}
              </div>
            </div>
          </div>

          {/* LEGEND */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px]">
            <LegendDot color="#475569" label={tr("Biaya", "Cost")} pct={biayaPct} />
            {isProfit ? (
              <LegendDot color="#10b981" label={tr("Profit", "Profit")} pct={profitPct} />
            ) : hasData ? (
              <LegendDot color="#ef4444" label={tr("Rugi", "Loss")} pct={overshootPct} />
            ) : null}
          </div>
        </div>

        {/* KANAN: Detail angka */}
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
              {tr("Total Profit", "Total Profit")}
            </p>
            <p
              className={`mt-1 text-xl sm:text-2xl font-bold tabular-nums tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${
                !hasData ? "text-slate-400" : isProfit ? "text-emerald-600" : "text-rose-600"
              }`}
              title={formatRupiah(totalProfit)}
            >
              {hasData ? formatRupiahCompact(totalProfit) : "—"}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400 tabular-nums" title={formatRupiah(totalProfit)}>
              {hasData ? formatRupiah(totalProfit) : tr("Belum ada nominal PO terinput", "No PO amount entered")}
            </p>
          </div>

          {/* Margin progress bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-slate-500 mb-1">
              <span>{tr("Margin Profit", "Profit Margin")}</span>
              <span className={`${!hasData ? "text-slate-400" : isProfit ? "text-emerald-600" : "text-rose-600"}`}>
                {hasData ? `${margin.toFixed(1)}%` : "—"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  !hasData ? "bg-slate-200" : isProfit ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-rose-400 to-rose-600"
                }`}
                style={{ width: hasData ? `${Math.min(100, Math.abs(margin))}%` : "0%" }}
              />
            </div>
          </div>

          {/* Inline mini breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
            <BreakdownItem
              label={tr("PO", "PO")}
              value={formatRupiahCompact(totalPO)}
              color="indigo"
            />
            <BreakdownItem
              label={tr("Biaya Projek", "Project Cost")}
              value={formatRupiahCompact(totalBiaya)}
              color="slate"
            />
            <BreakdownItem
              label={tr("Biaya Luar", "Off-Project")}
              value={formatRupiahCompact(totalBiayaLuar)}
              color="violet"
            />
          </div>
          <p className="pt-1 text-[9px] leading-relaxed text-slate-400">
            {tr(
              "Profit = PO − (Biaya Projek + Biaya Luar Projek)",
              "Profit = PO − (Project Cost + Off-Project Cost)"
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

const LegendDot = ({ color, label, pct }) => (
  <div className="inline-flex items-center gap-1.5 text-slate-600">
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
    <span className="font-medium">{label}</span>
    <span className="text-slate-400 tabular-nums">{pct.toFixed(0)}%</span>
  </div>
);

const BreakdownItem = ({ label, value, color }) => {
  const tone = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
    slate: "bg-slate-50 text-slate-700 ring-slate-200/70",
    violet: "bg-violet-50 text-violet-700 ring-violet-200/70",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
    rose: "bg-rose-50 text-rose-700 ring-rose-200/70",
  };
  return (
    <div className={`rounded-lg ring-1 px-2 py-1.5 ${tone[color] || tone.slate}`}>
      <p className="text-[9px] uppercase font-semibold tracking-wider opacity-70">{label}</p>
      <p className="text-xs font-bold tabular-nums truncate" title={value}>
        {value}
      </p>
    </div>
  );
};

const PoInput = ({ value, onChange, onBlur, state, fullWidth = false, compact = false }) => {
  const ring =
    state === "saving"
      ? "ring-amber-300 border-amber-300 bg-amber-50/30"
      : state === "saved"
      ? "ring-emerald-300 border-emerald-300 bg-emerald-50/30"
      : state === "error"
      ? "ring-rose-300 border-rose-300 bg-rose-50/30"
      : value
      ? "ring-slate-200 border-slate-300 bg-white focus-within:border-indigo-400 focus-within:ring-indigo-300/50"
      : "ring-indigo-200 border-indigo-300 bg-indigo-50/40 focus-within:border-indigo-500 focus-within:ring-indigo-400/50";

  return (
    <div
      className={`flex min-w-0 items-center rounded-lg border bg-white ring-1 transition ${ring} ${
        compact ? "gap-1.5 py-1.5 pl-2 pr-2" : "gap-1.5 py-2 pl-3 pr-2"
      } ${fullWidth ? "w-full" : "w-[200px]"}`}
    >
      <span className="shrink-0 text-xs font-semibold text-slate-500">Rp</span>
      <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={value ? "0" : compact ? "Nominal" : "Ketik nominal..."}
          className={`box-border min-w-full w-max max-w-none bg-transparent text-right font-semibold text-slate-900 outline-none tabular-nums placeholder:font-normal placeholder:text-slate-400 ${
            compact ? "text-[11px] placeholder:text-[11px]" : "text-sm placeholder:text-xs"
          }`}
        />
      </div>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {state === "saving" && <Loader2 size={13} className="animate-spin text-amber-500" />}
        {state === "saved" && <CheckCircle2 size={14} className="text-emerald-500" />}
        {state === "error" && <AlertCircle size={14} className="text-rose-500" />}
        {state === "idle" && !compact && (value ? <Save size={12} className="text-slate-300" /> : <Pencil size={12} className="text-indigo-400" />)}
        {state === "idle" && compact && value ? <Save size={11} className="text-slate-300" /> : null}
      </span>
    </div>
  );
};

const ProfitText = ({ profit, hasPo }) => {
  if (!hasPo) return <span className="text-slate-400 text-sm">-</span>;
  const positive = profit >= 0;
  return (
    <span
      className={`inline-block whitespace-nowrap font-bold tabular-nums leading-snug ${positive ? "text-emerald-700" : "text-rose-600"}`}
    >
      {positive ? "+" : ""}
      {formatRupiah(profit)}
    </span>
  );
};

const MarginPill = ({ margin, hasPo }) => {
  if (!hasPo) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200/70">
        -
      </span>
    );
  }
  const positive = margin >= 0;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
        positive
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70"
          : "bg-rose-50 text-rose-700 ring-1 ring-rose-200/70"
      }`}
    >
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {margin.toFixed(1)}%
    </span>
  );
};
