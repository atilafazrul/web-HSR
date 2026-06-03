import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axiosConfig";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  X,
  Download,
  Check,
  Ban,
  Building2,
  CalendarRange,
  ChevronDown,
  FileText,
} from "lucide-react";
import {
  DashboardSurface,
} from "../components/dashboard/DashboardPrimitives.jsx";
import { useI18n } from "../i18n/index.jsx";

/* ============================================================
 * KONSTAN
 * ============================================================ */
const NAMA_BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const NAMA_BULAN_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const JENIS_CUTI_MAP = {
  "Cuti Tahunan":    "Annual Leave",
  "Cuti Sakit":      "Sick Leave",
  "Cuti Melahirkan": "Maternity Leave",
  "Cuti Menikah":    "Marriage Leave",
  "Cuti Penting":    "Compassionate Leave",
  "Cuti Lainnya":    "Other Leave",
};

const STATUS_META = {
  pending: {
    pill: "bg-amber-50/90 text-amber-800 ring-1 ring-amber-200/70",
    icon: Clock,
  },
  approved: {
    pill: "bg-emerald-50/90 text-emerald-800 ring-1 ring-emerald-200/70",
    icon: CheckCircle2,
  },
  rejected: {
    pill: "bg-rose-50/90 text-rose-800 ring-1 ring-rose-200/70",
    icon: XCircle,
  },
};

/* ============================================================
 * UTILS
 * ============================================================ */
const formatTanggal = (d, locale = "id-ID") => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const formatDateTime = (d, locale = "id-ID") => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
};

const translateJenisCuti = (value, lang) =>
  lang === "en" ? JENIS_CUTI_MAP[value] || value : value;

const statusLabel = (status, lang) => {
  if (lang === "en") {
    return status === "pending" ? "Pending" : status === "approved" ? "Approved" : "Rejected";
  }
  return status === "pending" ? "Menunggu" : status === "approved" ? "Disetujui" : "Ditolak";
};

const StatusPill = ({ status, lang }) => {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.pill}`}>
      <Icon size={12} />
      {statusLabel(status, lang)}
    </span>
  );
};

/* ============================================================
 * MAIN
 * ============================================================ */
export default function CutiApprovalPage() {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const dateLocale = language === "en" ? "en-GB" : "id-ID";
  const NAMA_BULAN = language === "en" ? NAMA_BULAN_EN : NAMA_BULAN_ID;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");

  const [actingId, setActingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  /* ================= FETCH ================= */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/cuti");
      setItems(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setError(tr("Gagal memuat data pengajuan cuti", "Failed to load leave requests"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= ACTIONS ================= */
  const handleApprove = async (item) => {
    const msg = tr(
      `Setujui pengajuan cuti dari ${item.nama_pengaju}?`,
      `Approve leave request from ${item.nama_pengaju}?`
    );
    if (!window.confirm(msg)) return;
    setActingId(item.id);
    try {
      const res = await api.post(`/cuti/${item.id}/approve`);
      setItems((prev) => prev.map((i) => (i.id === item.id ? res.data.data : i)));
      if (detail?.id === item.id) setDetail(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || tr("Gagal menyetujui cuti", "Failed to approve leave"));
    } finally {
      setActingId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      alert(tr("Alasan penolakan wajib diisi", "Rejection reason is required"));
      return;
    }
    setActingId(rejectTarget.id);
    try {
      const res = await api.post(`/cuti/${rejectTarget.id}/reject`, {
        alasan_penolakan: rejectReason.trim(),
      });
      setItems((prev) => prev.map((i) => (i.id === rejectTarget.id ? res.data.data : i)));
      if (detail?.id === rejectTarget.id) setDetail(res.data.data);
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      alert(err.response?.data?.message || tr("Gagal menolak cuti", "Failed to reject leave"));
    } finally {
      setActingId(null);
    }
  };

  const resetFilter = () => {
    setSearch("");
    setFilterStatus("");
    setFilterDivisi("");
    setFilterBulan("");
    setFilterTahun("");
  };

  /* ================= DERIVED ================= */
  const summary = useMemo(() => {
    const s = { total: items.length, pending: 0, approved: 0, rejected: 0 };
    items.forEach((i) => {
      if (s[i.status] !== undefined) s[i.status] += 1;
    });
    return s;
  }, [items]);

  const divisiOptions = useMemo(() => {
    const set = new Set();
    items.forEach((i) => i.divisi_pengaju && set.add(i.divisi_pengaju));
    return Array.from(set).sort();
  }, [items]);

  const tahunOptions = useMemo(() => {
    const set = new Set();
    items.forEach((it) => {
      if (it.tanggal_mulai) set.add(new Date(it.tanggal_mulai).getFullYear());
    });
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((it) => {
      const matchSearch =
        !term ||
        (it.nama_pengaju || "").toLowerCase().includes(term) ||
        (it.jenis_cuti || "").toLowerCase().includes(term) ||
        (it.alasan || "").toLowerCase().includes(term);
      const matchStatus = !filterStatus || it.status === filterStatus;
      const matchDivisi = !filterDivisi || it.divisi_pengaju === filterDivisi;

      let matchBulan = true;
      let matchTahun = true;
      if (it.tanggal_mulai && (filterBulan || filterTahun)) {
        const d = new Date(it.tanggal_mulai);
        if (filterBulan) matchBulan = d.getMonth() + 1 === Number(filterBulan);
        if (filterTahun) matchTahun = d.getFullYear() === Number(filterTahun);
      } else if (filterBulan || filterTahun) {
        matchBulan = false;
        matchTahun = false;
      }

      return matchSearch && matchStatus && matchDivisi && matchBulan && matchTahun;
    });
  }, [items, search, filterStatus, filterDivisi, filterBulan, filterTahun]);

  const hasActiveFilter = !!(search || filterStatus || filterDivisi || filterBulan || filterTahun);

  /* ================= RENDER ================= */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-white to-indigo-50/40 px-5 py-5 sm:px-6 sm:py-6 shadow-sm shadow-slate-900/5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-300/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-4 h-28 w-28 rounded-full bg-emerald-300/10 blur-2xl" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600/90">
            {tr("Manajemen Cuti", "Leave Management")}
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {tr("Approval Pengajuan Cuti", "Leave Request Approval")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-xl">
            {tr(
              "Tinjau dan setujui / tolak pengajuan cuti dari seluruh karyawan.",
              "Review and approve / reject leave requests from all employees."
            )}
          </p>
          <div className="mt-3 h-1 w-12 rounded-full bg-indigo-500/80" />
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard label={tr("Total", "Total")} value={summary.total} accent="from-slate-500 to-slate-700" glow="bg-slate-300/20" badge="bg-slate-100 text-slate-700 ring-slate-200/70" icon={CalendarDays} />
        <SummaryCard label={tr("Menunggu", "Pending")} value={summary.pending} accent="from-amber-400 to-amber-500" glow="bg-amber-300/15" badge="bg-amber-50 text-amber-800 ring-amber-200/70" icon={Clock} highlight={summary.pending > 0} />
        <SummaryCard label={tr("Disetujui", "Approved")} value={summary.approved} accent="from-emerald-500 to-emerald-600" glow="bg-emerald-300/15" badge="bg-emerald-50 text-emerald-800 ring-emerald-200/70" icon={CheckCircle2} />
        <SummaryCard label={tr("Ditolak", "Rejected")} value={summary.rejected} accent="from-rose-500 to-rose-600" glow="bg-rose-300/15" badge="bg-rose-50 text-rose-800 ring-rose-200/70" icon={XCircle} />
      </div>

      {/* FILTER */}
      <DashboardSurface className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Filter size={15} className="text-slate-400" />
            <span className="text-sm font-semibold">{tr("Filter", "Filter")}</span>
          </div>
          {hasActiveFilter && (
            <button
              onClick={resetFilter}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              <X size={12} /> {tr("Reset filter", "Reset filter")}
            </button>
          )}
        </div>

        {/* Search row */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr("Cari nama / alasan...", "Search name / reason...")}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200/80 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm placeholder:text-slate-400 transition"
          />
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <FilterSelect
            label={tr("Status", "Status")}
            icon={CheckCircle2}
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <option value="">{tr("Semua status", "All statuses")}</option>
            <option value="pending">{tr("Menunggu", "Pending")}</option>
            <option value="approved">{tr("Disetujui", "Approved")}</option>
            <option value="rejected">{tr("Ditolak", "Rejected")}</option>
          </FilterSelect>

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
            label={tr("Bulan", "Month")}
            icon={CalendarRange}
            value={filterBulan}
            onChange={setFilterBulan}
          >
            <option value="">{tr("Semua bulan", "All months")}</option>
            {NAMA_BULAN.map((nama, idx) => (
              <option key={nama} value={idx + 1}>{nama}</option>
            ))}
          </FilterSelect>

          <FilterSelect
            label={tr("Tahun", "Year")}
            icon={CalendarDays}
            value={filterTahun}
            onChange={setFilterTahun}
          >
            <option value="">{tr("Semua tahun", "All years")}</option>
            {tahunOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </FilterSelect>
        </div>
      </DashboardSurface>

      {/* LIST */}
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
            <CalendarDays size={36} className="mb-3 text-slate-300" />
            <p className="text-sm">{tr("Tidak ada pengajuan yang sesuai filter", "No request matches the filter")}</p>
          </div>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold">{tr("Pengaju", "Requester")}</th>
                    <th className="text-left px-5 py-3.5 font-semibold">{tr("Divisi", "Division")}</th>
                    <th className="text-left px-5 py-3.5 font-semibold">{tr("Jenis", "Type")}</th>
                    <th className="text-left px-5 py-3.5 font-semibold">{tr("Periode", "Period")}</th>
                    <th className="text-left px-5 py-3.5 font-semibold">{tr("Status", "Status")}</th>
                    <th className="text-right px-5 py-3.5 font-semibold">{tr("Aksi", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it) => (
                    <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{it.nama_pengaju}</p>
                        <p className="text-xs text-slate-400 capitalize">{it.role_pengaju?.replace(/_/g, " ")}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{it.divisi_pengaju || "-"}</td>
                      <td className="px-5 py-4 text-slate-700 font-medium">{translateJenisCuti(it.jenis_cuti, language)}</td>
                      <td className="px-5 py-4 text-slate-600">
                        <p>{formatTanggal(it.tanggal_mulai, dateLocale)} – {formatTanggal(it.tanggal_selesai, dateLocale)}</p>
                        <p className="text-xs text-slate-400 tabular-nums">{it.jumlah_hari} {tr("hari", "days")}</p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={it.status} lang={language} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDetail(it)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                          >
                            {tr("Detail", "Detail")}
                          </button>
                          {it.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(it)}
                                disabled={actingId === it.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-60 transition shadow-sm shadow-emerald-900/10"
                              >
                                <Check size={13} /> {tr("Setujui", "Approve")}
                              </button>
                              <button
                                onClick={() => {
                                  setRejectTarget(it);
                                  setRejectReason("");
                                }}
                                disabled={actingId === it.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold disabled:opacity-60 transition ring-1 ring-rose-200"
                              >
                                <Ban size={13} /> {tr("Tolak", "Reject")}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE / TABLET */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filtered.map((it) => (
                <div key={it.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{it.nama_pengaju}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {it.divisi_pengaju || "-"} · {it.role_pengaju?.replace(/_/g, " ")}
                      </p>
                    </div>
                    <StatusPill status={it.status} lang={language} />
                  </div>
                  <div className="text-sm text-slate-700 mb-1 font-medium">{translateJenisCuti(it.jenis_cuti, language)}</div>
                  <p className="text-xs text-slate-500 mb-3">
                    {formatTanggal(it.tanggal_mulai, dateLocale)} – {formatTanggal(it.tanggal_selesai, dateLocale)} ({it.jumlah_hari} {tr("hari", "days")})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setDetail(it)}
                      className="flex-1 min-w-[80px] py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition"
                    >
                      {tr("Detail", "Detail")}
                    </button>
                    {it.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(it)}
                          disabled={actingId === it.id}
                          className="flex-1 min-w-[80px] py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-1 transition"
                        >
                          <Check size={13} /> {tr("Setujui", "Approve")}
                        </button>
                        <button
                          onClick={() => {
                            setRejectTarget(it);
                            setRejectReason("");
                          }}
                          disabled={actingId === it.id}
                          className="flex-1 min-w-[80px] py-2 text-xs bg-white hover:bg-rose-50 text-rose-600 rounded-lg font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-1 transition ring-1 ring-rose-200"
                        >
                          <Ban size={13} /> {tr("Tolak", "Reject")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DashboardSurface>

      {/* MODAL DETAIL */}
      {detail && (
        <Modal onClose={() => setDetail(null)} title={tr("Detail Pengajuan Cuti", "Leave Request Detail")}>
          <DetailContent
            item={detail}
            language={language}
            tr={tr}
            dateLocale={dateLocale}
            onApprove={() => handleApprove(detail)}
            onReject={() => {
              setRejectTarget(detail);
              setRejectReason("");
            }}
            actingId={actingId}
          />
        </Modal>
      )}

      {/* MODAL REJECT */}
      {rejectTarget && (
        <Modal
          onClose={() => {
            setRejectTarget(null);
            setRejectReason("");
          }}
          title={tr(`Tolak Cuti — ${rejectTarget.nama_pengaju}`, `Reject Leave — ${rejectTarget.nama_pengaju}`)}
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {tr("Berikan alasan penolakan untuk pengajuan cuti", "Provide a rejection reason for the leave request")}{" "}
              <span className="font-semibold text-slate-800">{translateJenisCuti(rejectTarget.jenis_cuti, language)}</span>.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={tr("Tuliskan alasan penolakan...", "Write the rejection reason...")}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-300/40 outline-none text-sm resize-none placeholder:text-slate-400"
            />
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
              >
                {tr("Batal", "Cancel")}
              </button>
              <button
                onClick={submitReject}
                disabled={actingId === rejectTarget.id}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 transition shadow-sm shadow-rose-900/10"
              >
                {actingId === rejectTarget.id && <Loader2 size={14} className="animate-spin" />}
                {tr("Tolak Pengajuan", "Reject Request")}
              </button>
            </div>
          </div>
        </Modal>
      )}
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
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  </div>
);

const SummaryCard = ({ label, value, accent, glow, badge, icon: Icon, highlight = false }) => (
  <div
    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-slate-50/90 p-3 sm:p-4 md:p-5 shadow-sm transition-all hover:shadow-md ${
      highlight ? "border-amber-200/80 ring-1 ring-amber-100" : "border-slate-200/80 hover:border-slate-300/90"
    }`}
  >
    <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${glow}`} />
    <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent} opacity-90`} />
    <div className="relative flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p>
        <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl md:text-2xl">
          {value}
        </p>
      </div>
      <div className={`flex shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl items-center justify-center ring-1 ring-inset transition group-hover:scale-[1.03] ${badge}`}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-slate-900/20 max-h-[90vh] flex flex-col ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
          <X size={18} />
        </button>
      </div>
      <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
    </div>
  </div>
);

/* ====== Detail building blocks ====== */
const SectionLabel = ({ icon: Icon, children }) => (
  <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
    {Icon && <Icon size={12} className="text-slate-400" />}
    {children}
  </p>
);

const InlineInfo = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">{label}</p>
    <p className="text-sm text-slate-800 font-semibold mt-0.5">{value || "-"}</p>
  </div>
);

const initialOf = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
};

const DetailContent = ({ item, language, tr, dateLocale, onApprove, onReject, actingId }) => {
  const isApproved = item.status === "approved";
  const isRejected = item.status === "rejected";
  const isPending = item.status === "pending";

  return (
    <div className="space-y-4 text-sm">
      {/* HEADER — leave type + status */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-4 ring-1 ring-slate-200/70 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
            {tr("Jenis Cuti", "Leave Type")}
          </p>
          <p className="text-lg font-bold text-slate-900 mt-0.5 truncate">
            {translateJenisCuti(item.jenis_cuti, language)}
          </p>
        </div>
        <StatusPill status={item.status} lang={language} />
      </div>

      {/* REQUESTER CARD */}
      <div className="rounded-2xl bg-white p-3.5 ring-1 ring-slate-200/70 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-slate-900/20">
          {initialOf(item.nama_pengaju)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">{item.nama_pengaju}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="capitalize">{item.role_pengaju?.replace(/_/g, " ")}</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1">
              <Building2 size={11} className="text-slate-400" />
              {item.divisi_pengaju || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* PERIOD CARD */}
      <div className="rounded-2xl bg-slate-50/70 p-4 ring-1 ring-slate-200/70">
        <SectionLabel icon={CalendarRange}>{tr("Periode Cuti", "Leave Period")}</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          <InlineInfo label={tr("Mulai", "Start")} value={formatTanggal(item.tanggal_mulai, dateLocale)} />
          <InlineInfo label={tr("Selesai", "End")} value={formatTanggal(item.tanggal_selesai, dateLocale)} />
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">{tr("Total", "Total")}</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {item.jumlah_hari} <span className="font-medium text-slate-500">{tr("hari", "days")}</span>
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200/70">
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">{tr("Diajukan pada", "Submitted on")}</p>
          <p className="text-sm text-slate-700 font-medium mt-0.5">{formatDateTime(item.created_at, dateLocale)}</p>
        </div>
      </div>

      {/* REASON */}
      <div>
        <SectionLabel>{tr("Alasan", "Reason")}</SectionLabel>
        <div className="relative rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/70">
          <span className="absolute left-0 top-3 bottom-3 w-1 bg-slate-300 rounded-r-full" />
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pl-3">{item.alasan}</p>
        </div>
      </div>

      {/* ATTACHMENT */}
      {item.lampiran_url && (
        <div>
          <SectionLabel>{tr("Lampiran", "Attachment")}</SectionLabel>
          <a
            href={item.lampiran_url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 p-3 rounded-xl bg-white ring-1 ring-slate-200/70 hover:ring-slate-300 hover:bg-slate-50/80 transition"
          >
            <div className="h-10 w-10 rounded-lg bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <FileText size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{tr("Buka lampiran", "Open attachment")}</p>
              <p className="text-xs text-slate-500">{tr("Klik untuk membuka file", "Click to view the file")}</p>
            </div>
            <Download size={16} className="text-slate-400 group-hover:text-slate-700 transition" />
          </a>
        </div>
      )}

      {/* APPROVED CARD */}
      {isApproved && (
        <div className="rounded-2xl bg-emerald-50/60 p-4 ring-1 ring-emerald-200/60">
          <div className="flex items-center gap-2 text-emerald-800 text-[10px] font-semibold uppercase tracking-wider mb-3">
            <CheckCircle2 size={13} /> {tr("Telah Disetujui", "Approved")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InlineInfo label={tr("Diproses oleh", "Processed by")} value={item.approved_by_nama || "-"} />
            <InlineInfo label={tr("Tanggal proses", "Processed on")} value={formatDateTime(item.approved_at, dateLocale)} />
          </div>
        </div>
      )}

      {/* REJECTED CARD */}
      {isRejected && (
        <div className="rounded-2xl bg-rose-50/60 p-4 ring-1 ring-rose-200/60 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 text-[10px] font-semibold uppercase tracking-wider">
            <XCircle size={13} /> {tr("Pengajuan Ditolak", "Request Rejected")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InlineInfo label={tr("Diproses oleh", "Processed by")} value={item.approved_by_nama || "-"} />
            <InlineInfo label={tr("Tanggal proses", "Processed on")} value={formatDateTime(item.approved_at, dateLocale)} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-rose-700/80 mb-1">
              {tr("Alasan penolakan", "Rejection reason")}
            </p>
            <p className="text-sm text-rose-800 whitespace-pre-wrap bg-white/60 rounded-lg p-3 ring-1 ring-rose-200/50 leading-relaxed">
              {item.alasan_penolakan}
            </p>
          </div>
        </div>
      )}

      {/* ACTIONS — pending only */}
      {isPending && (
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onReject}
            disabled={actingId === item.id}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 transition ring-1 ring-rose-200"
          >
            <Ban size={14} /> {tr("Tolak", "Reject")}
          </button>
          <button
            onClick={onApprove}
            disabled={actingId === item.id}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 transition shadow-sm shadow-emerald-900/10"
          >
            {actingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {tr("Setujui", "Approve")}
          </button>
        </div>
      )}
    </div>
  );
};
