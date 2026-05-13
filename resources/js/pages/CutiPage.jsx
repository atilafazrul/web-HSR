import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axiosConfig";
import tokenManager from "../utils/tokenManager";
import {
  Plus,
  X,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Trash2,
  Pencil,
  Loader2,
  Search,
  Filter,
  Paperclip,
  AlertCircle,
  CalendarRange,
  ChevronDown,
} from "lucide-react";
import {
  DashboardSurface,
} from "../components/dashboard/DashboardPrimitives.jsx";
import { useI18n } from "../i18n/index.jsx";

/* ============================================================
 * KONSTAN
 * ============================================================ */
const JENIS_CUTI_OPTIONS = [
  { id: "Cuti Tahunan",    en: "Annual Leave" },
  { id: "Cuti Sakit",      en: "Sick Leave" },
  { id: "Cuti Melahirkan", en: "Maternity Leave" },
  { id: "Cuti Menikah",    en: "Marriage Leave" },
  { id: "Cuti Penting",    en: "Compassionate Leave" },
  { id: "Cuti Lainnya",    en: "Other Leave" },
];

const NAMA_BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const NAMA_BULAN_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_META = {
  pending: {
    pill: "bg-amber-50/90 text-amber-800 ring-1 ring-amber-200/70",
    icon: Clock,
    accent: "from-amber-400 to-amber-500",
    glow: "bg-amber-300/15",
  },
  approved: {
    pill: "bg-emerald-50/90 text-emerald-800 ring-1 ring-emerald-200/70",
    icon: CheckCircle2,
    accent: "from-emerald-500 to-emerald-600",
    glow: "bg-emerald-300/15",
  },
  rejected: {
    pill: "bg-rose-50/90 text-rose-800 ring-1 ring-rose-200/70",
    icon: XCircle,
    accent: "from-rose-500 to-rose-600",
    glow: "bg-rose-300/15",
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

const hitungJumlahHari = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s) || isNaN(e)) return 0;
  const diff = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
};

const translateJenisCuti = (value, lang) => {
  const found = JENIS_CUTI_OPTIONS.find((o) => o.id === value);
  if (!found) return value;
  return lang === "en" ? found.en : found.id;
};

const statusLabel = (status, lang) => {
  if (lang === "en") {
    return status === "pending" ? "Pending" : status === "approved" ? "Approved" : "Rejected";
  }
  return status === "pending" ? "Menunggu" : status === "approved" ? "Disetujui" : "Ditolak";
};

/* ============================================================
 * STATUS PILL
 * ============================================================ */
const StatusPill = ({ status, lang }) => {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.pill}`}
    >
      <Icon size={12} />
      {statusLabel(status, lang)}
    </span>
  );
};

/* ============================================================
 * MAIN
 * ============================================================ */
export default function CutiPage() {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const dateLocale = language === "en" ? "en-GB" : "id-ID";
  const NAMA_BULAN = language === "en" ? NAMA_BULAN_EN : NAMA_BULAN_ID;

  const currentUser = tokenManager.getUser();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBulan, setFilterBulan] = useState(""); // "" = semua, 1..12
  const [filterTahun, setFilterTahun] = useState(""); // "" = semua

  const [detail, setDetail] = useState(null);

  const emptyForm = {
    jenis_cuti: "Cuti Tahunan",
    tanggal_mulai: "",
    tanggal_selesai: "",
    alasan: "",
    lampiran: null,
    hapus_lampiran: false,
  };
  const [form, setForm] = useState(emptyForm);

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

  /* ================= FORM HANDLERS ================= */
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      jenis_cuti: item.jenis_cuti,
      tanggal_mulai: item.tanggal_mulai || "",
      tanggal_selesai: item.tanggal_selesai || "",
      alasan: item.alasan || "",
      lampiran: null,
      hapus_lampiran: false,
      _existingLampiran: item.lampiran_url,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.jenis_cuti || !form.tanggal_mulai || !form.tanggal_selesai || !form.alasan?.trim()) {
      alert(tr("Lengkapi semua field yang wajib diisi", "Please fill in all required fields"));
      return;
    }

    if (new Date(form.tanggal_selesai) < new Date(form.tanggal_mulai)) {
      alert(tr("Tanggal selesai tidak boleh sebelum tanggal mulai", "End date cannot be before start date"));
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("jenis_cuti", form.jenis_cuti);
      fd.append("tanggal_mulai", form.tanggal_mulai);
      fd.append("tanggal_selesai", form.tanggal_selesai);
      fd.append("alasan", form.alasan);
      if (form.lampiran) fd.append("lampiran", form.lampiran);
      if (editingId && form.hapus_lampiran) fd.append("hapus_lampiran", "1");

      if (editingId) {
        await api.post(`/cuti/${editingId}/update`, fd);
      } else {
        await api.post("/cuti", fd);
      }

      await fetchData();
      closeForm();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {}).flat().join("\n") ||
        tr("Gagal menyimpan pengajuan cuti", "Failed to save leave request");
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmMsg = tr(
      `Hapus pengajuan cuti "${translateJenisCuti(item.jenis_cuti, "id")}" tanggal ${formatTanggal(item.tanggal_mulai, "id-ID")}?`,
      `Delete leave request "${translateJenisCuti(item.jenis_cuti, "en")}" on ${formatTanggal(item.tanggal_mulai, "en-GB")}?`
    );
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.delete(`/cuti/${item.id}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      const msg = err.response?.data?.message || tr("Gagal menghapus pengajuan", "Failed to delete request");
      alert(msg);
    }
  };

  const resetFilter = () => {
    setSearch("");
    setFilterStatus("");
    setFilterBulan("");
    setFilterTahun("");
  };

  /* ================= DERIVED ================= */
  const tahunOptions = useMemo(() => {
    const set = new Set();
    items.forEach((it) => {
      if (it.tanggal_mulai) set.add(new Date(it.tanggal_mulai).getFullYear());
    });
    set.add(new Date().getFullYear()); // Selalu sertakan tahun sekarang
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  const summary = useMemo(() => {
    const s = { total: items.length, pending: 0, approved: 0, rejected: 0 };
    items.forEach((i) => {
      if (s[i.status] !== undefined) s[i.status] += 1;
    });
    return s;
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((it) => {
      const matchSearch =
        !term ||
        (it.jenis_cuti || "").toLowerCase().includes(term) ||
        (it.alasan || "").toLowerCase().includes(term);
      const matchStatus = !filterStatus || it.status === filterStatus;

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

      return matchSearch && matchStatus && matchBulan && matchTahun;
    });
  }, [items, search, filterStatus, filterBulan, filterTahun]);

  const hasActiveFilter = !!(search || filterStatus || filterBulan || filterTahun);

  /* ================= RENDER ================= */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-white to-indigo-50/40 px-5 py-5 sm:px-6 sm:py-6 shadow-sm shadow-slate-900/5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-300/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-4 h-28 w-28 rounded-full bg-emerald-300/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600/90">
              {tr("Manajemen Cuti", "Leave Management")}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {tr("Pengajuan Cuti", "Leave Request")}
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              {tr(
                "Kelola pengajuan cuti Anda. Pengajuan akan ditinjau dan disetujui oleh Super Admin.",
                "Manage your leave requests. Submissions will be reviewed and approved by Super Admin."
              )}
            </p>
            <div className="mt-3 h-1 w-12 rounded-full bg-indigo-500/80" />
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-slate-900/10 transition active:scale-[0.99]"
          >
            <Plus size={16} />
            {tr("Ajukan Cuti", "Request Leave")}
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard label={tr("Total", "Total")} value={summary.total} accent="from-slate-500 to-slate-700" glow="bg-slate-300/20" badge="bg-slate-100 text-slate-700 ring-slate-200/70" icon={CalendarDays} />
        <SummaryCard label={tr("Menunggu", "Pending")} value={summary.pending} accent="from-amber-400 to-amber-500" glow="bg-amber-300/15" badge="bg-amber-50 text-amber-800 ring-amber-200/70" icon={Clock} />
        <SummaryCard label={tr("Disetujui", "Approved")} value={summary.approved} accent="from-emerald-500 to-emerald-600" glow="bg-emerald-300/15" badge="bg-emerald-50 text-emerald-800 ring-emerald-200/70" icon={CheckCircle2} />
        <SummaryCard label={tr("Ditolak", "Rejected")} value={summary.rejected} accent="from-rose-500 to-rose-600" glow="bg-rose-300/15" badge="bg-rose-50 text-rose-800 ring-rose-200/70" icon={XCircle} />
      </div>

      {/* FILTER BAR */}
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
            placeholder={tr("Cari jenis cuti / alasan...", "Search leave type / reason...")}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200/80 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm placeholder:text-slate-400 transition"
          />
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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

      {/* CONTENT */}
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
            <p className="text-sm">
              {hasActiveFilter
                ? tr("Tidak ada pengajuan yang sesuai filter", "No request matches the filter")
                : tr("Belum ada pengajuan cuti", "No leave requests yet")}
            </p>
            {!hasActiveFilter && (
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"
              >
                <Plus size={14} /> {tr("Buat pengajuan pertama", "Create your first request")}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold">{tr("Jenis Cuti", "Leave Type")}</th>
                    <th className="text-left px-5 py-3.5 font-semibold">{tr("Periode", "Period")}</th>
                    <th className="text-left px-5 py-3.5 font-semibold">{tr("Hari", "Days")}</th>
                    <th className="text-left px-5 py-3.5 font-semibold">{tr("Alasan", "Reason")}</th>
                    <th className="text-left px-5 py-3.5 font-semibold">{tr("Status", "Status")}</th>
                    <th className="text-right px-5 py-3.5 font-semibold">{tr("Aksi", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it) => (
                    <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4 font-semibold text-slate-800">{translateJenisCuti(it.jenis_cuti, language)}</td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>{formatTanggal(it.tanggal_mulai, dateLocale)}</div>
                        <div className="text-xs text-slate-400">{tr("s/d", "to")} {formatTanggal(it.tanggal_selesai, dateLocale)}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-medium tabular-nums">{it.jumlah_hari} {tr("hari", "days")}</td>
                      <td className="px-5 py-4 text-slate-600 max-w-xs">
                        <p className="line-clamp-2">{it.alasan}</p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={it.status} lang={language} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <IconBtn onClick={() => setDetail(it)} title={tr("Lihat detail", "View detail")} tone="slate">
                            <FileText size={15} />
                          </IconBtn>
                          {it.status === "pending" && (
                            <>
                              <IconBtn onClick={() => openEdit(it)} title={tr("Edit", "Edit")} tone="indigo">
                                <Pencil size={15} />
                              </IconBtn>
                              <IconBtn onClick={() => handleDelete(it)} title={tr("Hapus", "Delete")} tone="rose">
                                <Trash2 size={15} />
                              </IconBtn>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((it) => (
                <div key={it.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-slate-800">{translateJenisCuti(it.jenis_cuti, language)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatTanggal(it.tanggal_mulai, dateLocale)} – {formatTanggal(it.tanggal_selesai, dateLocale)} ({it.jumlah_hari} {tr("hari", "days")})
                      </p>
                    </div>
                    <StatusPill status={it.status} lang={language} />
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">{it.alasan}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDetail(it)}
                      className="flex-1 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition"
                    >
                      {tr("Detail", "Detail")}
                    </button>
                    {it.status === "pending" && (
                      <>
                        <button
                          onClick={() => openEdit(it)}
                          className="flex-1 py-2 text-xs bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 font-semibold transition"
                        >
                          {tr("Edit", "Edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(it)}
                          className="flex-1 py-2 text-xs bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-700 font-semibold transition"
                        >
                          {tr("Hapus", "Delete")}
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

      {/* MODAL FORM */}
      {showForm && (
        <Modal
          onClose={closeForm}
          title={
            editingId
              ? tr("Edit Pengajuan Cuti", "Edit Leave Request")
              : tr("Ajukan Cuti", "Request Leave")
          }
        >
          <form onSubmit={submit} className="space-y-4">
            <Field label={tr("Jenis Cuti", "Leave Type")} required>
              <select
                value={form.jenis_cuti}
                onChange={(e) => setForm({ ...form, jenis_cuti: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm bg-white"
                required
              >
                {JENIS_CUTI_OPTIONS.map((j) => (
                  <option key={j.id} value={j.id}>
                    {language === "en" ? j.en : j.id}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={tr("Tanggal Mulai", "Start Date")} required>
                <input
                  type="date"
                  value={form.tanggal_mulai}
                  onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm"
                  required
                />
              </Field>
              <Field label={tr("Tanggal Selesai", "End Date")} required>
                <input
                  type="date"
                  value={form.tanggal_selesai}
                  min={form.tanggal_mulai || undefined}
                  onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm"
                  required
                />
              </Field>
            </div>

            {form.tanggal_mulai && form.tanggal_selesai && (
              <div className="bg-slate-50 text-slate-700 text-sm rounded-xl px-4 py-2.5 ring-1 ring-slate-200/70">
                {tr("Total hari cuti:", "Total leave days:")}{" "}
                <span className="font-semibold text-slate-900">
                  {hitungJumlahHari(form.tanggal_mulai, form.tanggal_selesai)} {tr("hari", "days")}
                </span>
              </div>
            )}

            <Field label={tr("Alasan", "Reason")} required>
              <textarea
                rows={4}
                value={form.alasan}
                onChange={(e) => setForm({ ...form, alasan: e.target.value })}
                placeholder={tr(
                  "Tuliskan alasan pengajuan cuti Anda...",
                  "Write your reason for leave request..."
                )}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm resize-none placeholder:text-slate-400"
                required
                maxLength={2000}
              />
            </Field>

            <Field label={tr("Lampiran (opsional, max 5MB)", "Attachment (optional, max 5MB)")}>
              {editingId && form._existingLampiran && !form.hapus_lampiran && !form.lampiran && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-slate-50 rounded-lg ring-1 ring-slate-200/70 text-sm">
                  <Paperclip size={14} className="text-slate-500" />
                  <a
                    href={form._existingLampiran}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-slate-700 hover:text-slate-900 truncate font-medium"
                  >
                    {tr("Lihat lampiran lama", "View existing attachment")}
                  </a>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, hapus_lampiran: true })}
                    className="text-rose-600 hover:text-rose-700 text-xs font-medium"
                  >
                    {tr("Hapus", "Remove")}
                  </button>
                </div>
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={(e) => setForm({ ...form, lampiran: e.target.files?.[0] || null, hapus_lampiran: false })}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold hover:file:bg-slate-200 file:transition"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                {tr(
                  "Format: JPG, PNG, PDF, DOC. Untuk cuti sakit, lampirkan surat dokter.",
                  "Format: JPG, PNG, PDF, DOC. For sick leave, attach a doctor's note."
                )}
              </p>
            </Field>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
              >
                {tr("Batal", "Cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 transition active:scale-[0.99]"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {editingId
                  ? tr("Simpan Perubahan", "Save Changes")
                  : tr("Kirim Pengajuan", "Submit Request")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL DETAIL */}
      {detail && (
        <Modal onClose={() => setDetail(null)} title={tr("Detail Pengajuan Cuti", "Leave Request Detail")}>
          <DetailContent item={detail} currentUser={currentUser} language={language} tr={tr} dateLocale={dateLocale} />
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

const SummaryCard = ({ label, value, accent, glow, badge, icon: Icon }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/90 p-3 sm:p-4 md:p-5 shadow-sm transition-all hover:border-slate-300/90 hover:shadow-md">
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

const IconBtn = ({ children, onClick, title, tone = "slate" }) => {
  const tones = {
    slate: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
    indigo: "hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700",
    rose: "hover:bg-rose-50 text-rose-600 hover:text-rose-700",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition ${tones[tone]}`}
    >
      {children}
    </button>
  );
};

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
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

const DetailContent = ({ item, language, tr, dateLocale }) => {
  const isApproved = item.status === "approved";
  const isRejected = item.status === "rejected";

  return (
    <div className="space-y-4 text-sm">
      {/* HEADER */}
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
          <p className="text-sm text-slate-700 font-medium mt-0.5">{formatTanggal(item.created_at, dateLocale)}</p>
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
            <InlineInfo label={tr("Tanggal proses", "Processed on")} value={formatTanggal(item.approved_at, dateLocale)} />
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
            <InlineInfo label={tr("Tanggal proses", "Processed on")} value={formatTanggal(item.approved_at, dateLocale)} />
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
    </div>
  );
};
