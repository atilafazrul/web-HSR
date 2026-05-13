import React, { useEffect, useMemo, useState } from "react";
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
  Building2,
  Pencil,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
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

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("");

  // map projek_id -> string formatted display
  const [poInputs, setPoInputs] = useState({});
  // map projek_id -> "idle" | "saving" | "saved" | "error"
  const [saveState, setSaveState] = useState({});

  /* ================= FETCH ================= */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/projek-kerja");
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
    const totalProfit = totalPO - totalBiaya;
    const margin = totalPO > 0 ? (totalProfit / totalPO) * 100 : 0;
    return { totalPO, totalBiaya, totalProfit, margin, count: list.length };
  }, [filtered]);

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

      {/* SUMMARY GRID — 2 angka kiri + chart panel kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* KIRI: 2 stack card sederhana */}
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
            label={tr("Total Biaya", "Total Cost")}
            value={formatRupiah(summary.totalBiaya)}
            accent="from-slate-500 to-slate-700"
            glow="bg-slate-300/20"
            badge="bg-slate-100 text-slate-700 ring-slate-200/70"
            icon={Receipt}
            hint={tr("Jalan + Pengeluaran + Reimburs.", "Travel + Expense + Reimburs.")}
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
            {/* DESKTOP TABLE */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[26%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold">{tr("Projek", "Project")}</th>
                    <th className="text-left px-3 py-3.5 font-semibold">{tr("Divisi", "Division")}</th>
                    <th className="text-left px-3 py-3.5 font-semibold">{tr("Tanggal", "Date")}</th>
                    <th className="text-right px-5 py-3.5 font-semibold bg-indigo-50/40">
                      <div className="flex items-center justify-end gap-1.5">
                        <Pencil size={11} className="text-indigo-500" />
                        <span className="text-indigo-700">{tr("Nominal PO", "PO Amount")}</span>
                      </div>
                      <p className="text-[10px] font-normal text-indigo-400 normal-case tracking-normal">
                        {tr("Ketik di sini ↓", "Type here ↓")}
                      </p>
                    </th>
                    <th className="text-right px-3 py-3.5 font-semibold">{tr("Total Biaya", "Total Cost")}</th>
                    <th className="text-right px-3 py-3.5 font-semibold">{tr("Profit", "Profit")}</th>
                    <th className="text-center px-3 py-3.5 font-semibold">{tr("Margin", "Margin")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const po = parseRibuanId(poInputs[p.id] || "");
                    const biaya = Number(p.total_biaya) || 0;
                    const profit = po - biaya;
                    const margin = po > 0 ? (profit / po) * 100 : 0;
                    const dirty =
                      String(parseRibuanId(poInputs[p.id] || "")) !==
                      String(Math.round(Number(p.nominal_po) || 0));
                    const state = saveState[p.id] || "idle";

                    return (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800 truncate">{p.jenis_pekerjaan}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {p.karyawan} {p.alamat ? `· ${p.alamat}` : ""}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <DivisiBadge divisi={p.divisi} />
                        </td>
                        <td className="px-3 py-4 text-slate-600 text-xs">
                          <div className="whitespace-nowrap">{formatTanggal(p.start_date, dateLocale)}</div>
                          {p.status && (
                            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 ring-1 ring-slate-200/70">
                              {p.status}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 bg-indigo-50/20">
                          <PoInput
                            value={poInputs[p.id] || ""}
                            onChange={(v) => handlePoChange(p.id, v)}
                            onBlur={() => dirty && savePo(p.id)}
                            state={state}
                            fullWidth
                          />
                        </td>
                        <td className="px-3 py-4 text-right text-slate-700 tabular-nums whitespace-nowrap">
                          {formatRupiah(biaya)}
                        </td>
                        <td className="px-3 py-4 text-right tabular-nums whitespace-nowrap">
                          <ProfitText profit={profit} hasPo={po > 0} />
                        </td>
                        <td className="px-3 py-4 text-center">
                          <MarginPill margin={margin} hasPo={po > 0} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50/60 text-sm font-semibold text-slate-800 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-5 py-3.5" colSpan={3}>
                      {tr("Total", "Total")}{" "}
                      <span className="text-xs text-slate-500 font-normal">
                        ({filtered.length} {tr("projek", "projects")})
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-indigo-700 bg-indigo-50/20">
                      {formatRupiah(summary.totalPO)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums whitespace-nowrap">
                      {formatRupiah(summary.totalBiaya)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums whitespace-nowrap">
                      <ProfitText profit={summary.totalProfit} hasPo={summary.totalPO > 0} />
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <MarginPill margin={summary.margin} hasPo={summary.totalPO > 0} />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* MOBILE / TABLET CARDS */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filtered.map((p) => {
                const po = parseRibuanId(poInputs[p.id] || "");
                const biaya = Number(p.total_biaya) || 0;
                const profit = po - biaya;
                const margin = po > 0 ? (profit / po) * 100 : 0;
                const dirty =
                  String(parseRibuanId(poInputs[p.id] || "")) !==
                  String(Math.round(Number(p.nominal_po) || 0));
                const state = saveState[p.id] || "idle";

                return (
                  <div key={p.id} className="p-4 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800">{p.jenis_pekerjaan}</p>
                        <DivisiBadge divisi={p.divisi} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-slate-500">
                        <Calendar size={11} />
                        <span>{formatTanggal(p.start_date, dateLocale)}</span>
                        {p.status && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200/70">
                            {p.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        {tr("Nominal PO", "PO Amount")}
                      </label>
                      <PoInput
                        value={poInputs[p.id] || ""}
                        onChange={(v) => handlePoChange(p.id, v)}
                        onBlur={() => dirty && savePo(p.id)}
                        state={state}
                        fullWidth
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <MobileStat label={tr("Biaya", "Cost")} value={formatRupiah(biaya)} tone="slate" />
                      <MobileStat
                        label={tr("Profit", "Profit")}
                        value={po > 0 ? formatRupiah(profit) : "-"}
                        tone={po > 0 ? (profit >= 0 ? "emerald" : "rose") : "slate"}
                      />
                      <MobileStat
                        label={tr("Margin", "Margin")}
                        value={po > 0 ? `${margin.toFixed(1)}%` : "-"}
                        tone={po > 0 ? (margin >= 0 ? "emerald" : "rose") : "slate"}
                      />
                    </div>
                  </div>
                );
              })}
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
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${tone}`}>
      <Building2 size={11} />
      {divisi}
    </span>
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

/* ============================================================
 * PROFIT PANEL — combines Total Profit + Margin Profit + donut chart
 * ============================================================ */
const ProfitPanel = ({ summary, tr }) => {
  const { totalPO, totalBiaya, totalProfit, margin } = summary;
  const isProfit = totalProfit >= 0;
  const hasData = totalPO > 0;

  // Untuk donut chart: persentase biaya & profit terhadap PO
  const biayaPct = totalPO > 0 ? (totalBiaya / totalPO) * 100 : 0;
  const profitPct = totalPO > 0 ? Math.max(0, (totalProfit / totalPO) * 100) : 0;
  const overshootPct = totalPO > 0 && totalProfit < 0 ? Math.min(100, (Math.abs(totalProfit) / totalPO) * 100) : 0;

  const chartData = hasData
    ? totalProfit >= 0
      ? [
          { name: tr("Biaya", "Cost"), value: totalBiaya, color: "#475569" },
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
          <div className="relative w-[160px] h-[160px] sm:w-[180px] sm:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
            </ResponsiveContainer>

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
          <div className="grid grid-cols-2 gap-2 pt-1">
            <BreakdownItem
              label={tr("PO", "PO")}
              value={formatRupiahCompact(totalPO)}
              color="indigo"
            />
            <BreakdownItem
              label={tr("Biaya", "Cost")}
              value={formatRupiahCompact(totalBiaya)}
              color="slate"
            />
          </div>
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

const PoInput = ({ value, onChange, onBlur, state, fullWidth = false }) => {
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
      className={`flex items-center gap-1.5 rounded-lg border bg-white pl-3 pr-2 py-2 ring-1 transition ${ring} ${
        fullWidth ? "w-full" : "w-[200px]"
      }`}
    >
      <span className="text-xs text-slate-500 font-semibold shrink-0">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={value ? "0" : "Ketik nominal..."}
        className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold text-slate-900 tabular-nums text-right placeholder:text-indigo-400/60 placeholder:font-normal placeholder:text-xs"
      />
      <span className="w-5 h-5 flex items-center justify-center shrink-0">
        {state === "saving" && <Loader2 size={13} className="animate-spin text-amber-500" />}
        {state === "saved" && <CheckCircle2 size={14} className="text-emerald-500" />}
        {state === "error" && <AlertCircle size={14} className="text-rose-500" />}
        {state === "idle" && (
          value
            ? <Save size={12} className="text-slate-300" />
            : <Pencil size={12} className="text-indigo-400" />
        )}
      </span>
    </div>
  );
};

const ProfitText = ({ profit, hasPo }) => {
  if (!hasPo) return <span className="text-slate-400 text-sm">-</span>;
  const positive = profit >= 0;
  return (
    <span className={`font-semibold ${positive ? "text-emerald-700" : "text-rose-600"}`}>
      {positive ? "+" : ""}
      {formatRupiah(profit)}
    </span>
  );
};

const MarginPill = ({ margin, hasPo }) => {
  if (!hasPo) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 ring-1 ring-slate-200/70">
        -
      </span>
    );
  }
  const positive = margin >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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

const MobileStat = ({ label, value, tone = "slate" }) => {
  const toneClass = {
    slate: "text-slate-800",
    emerald: "text-emerald-700",
    rose: "text-rose-600",
  };
  return (
    <div className="rounded-lg bg-slate-50 ring-1 ring-slate-200/70 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
      <p className={`mt-0.5 text-xs font-bold tabular-nums truncate ${toneClass[tone] || toneClass.slate}`}>{value}</p>
    </div>
  );
};
