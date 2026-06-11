import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axiosConfig";
import {
  Activity,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Globe,
  Clock,
  Shield,
} from "lucide-react";
import { DashboardSurface } from "../components/dashboard/DashboardPrimitives.jsx";
import { useI18n } from "../i18n/index.jsx";

const ACTION_LABELS_ID = {
  login: "Login",
  login_failed: "Login Gagal",
  error: "Error",
  logout: "Logout",
  create: "Buat",
  update: "Ubah",
  delete: "Hapus",
  view: "Lihat",
  approve: "Setujui",
  reject: "Tolak",
  archive: "Arsip",
  unarchive: "Buka Arsip",
  export: "Ekspor",
  download: "Unduh",
  status: "Status",
  biaya: "Biaya",
  lunas: "Lunas",
  photo: "Foto",
  file: "File",
  folder: "Folder",
  audit: "Audit",
};

const ACTION_LABELS_EN = {
  login: "Login",
  login_failed: "Failed Login",
  error: "Error",
  logout: "Logout",
  create: "Create",
  update: "Update",
  delete: "Delete",
  view: "View",
  approve: "Approve",
  reject: "Reject",
  archive: "Archive",
  unarchive: "Unarchive",
  export: "Export",
  download: "Download",
  status: "Status",
  biaya: "Expense",
  lunas: "Paid",
  photo: "Photo",
  file: "File",
  folder: "Folder",
  audit: "Audit",
};

const MODULE_LABELS_ID = {
  auth: "Autentikasi",
  profile: "Profil",
  karyawan: "Karyawan",
  projek_kerja: "Proyek Kerja",
  inventory: "Inventory",
  purchasing: "Purchasing",
  biaya: "Biaya",
  service: "Service",
  berita_acara: "Berita Acara",
  cuti: "Cuti",
  notifikasi: "Notifikasi",
  kontraktor: "Kontraktor",
  dokumen: "Dokumen",
  sistem: "Sistem",
};

const MODULE_LABELS_EN = {
  auth: "Authentication",
  profile: "Profile",
  karyawan: "Employees",
  projek_kerja: "Projects",
  inventory: "Inventory",
  purchasing: "Purchasing",
  biaya: "Expenses",
  service: "Service",
  berita_acara: "Minutes Report",
  cuti: "Leave",
  notifikasi: "Notifications",
  kontraktor: "Contractor",
  dokumen: "Documents",
  sistem: "System",
};

const isLogError = (log) =>
  (log?.status_code ?? 0) >= 400 || log?.action === "login_failed" || log?.action === "error";

const actionPillClass = (action) => {
  if (action === "login_failed" || action === "error" || action === "delete" || action === "reject") {
    return "bg-rose-50 text-rose-700 ring-rose-200/70";
  }
  if (action === "login" || action === "create" || action === "approve") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200/70";
  }
  if (action === "update" || action === "status" || action === "biaya") {
    return "bg-amber-50 text-amber-800 ring-amber-200/70";
  }
  return "bg-slate-50 text-slate-700 ring-slate-200/70";
};

const formatDateTime = (value, locale) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return value;
  }
};

export default function ActivityLogPage() {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const dateLocale = language === "en" ? "en-GB" : "id-ID";
  const actionLabels = language === "en" ? ACTION_LABELS_EN : ACTION_LABELS_ID;
  const moduleLabels = language === "en" ? MODULE_LABELS_EN : MODULE_LABELS_ID;

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [summary, setSummary] = useState({ total: 0, today: 0, unique_users_today: 0, errors_today: 0 });
  const [filterOptions, setFilterOptions] = useState({ modules: [], actions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get("/activity-logs/summary");
      setSummary(res.data?.data || { total: 0, today: 0, unique_users_today: 0, errors_today: 0 });
    } catch {
      // optional
    }
  }, []);

  const fetchFilters = useCallback(async () => {
    try {
      const res = await api.get("/activity-logs/filters");
      setFilterOptions(res.data?.data || { modules: [], actions: [] });
    } catch {
      // optional
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchFilters();
  }, [fetchSummary, fetchFilters]);

  useEffect(() => {
    let cancelled = false;

    const loadLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, per_page: 25 };
        if (search.trim()) params.search = search.trim();
        if (module) params.module = module;
        if (action) params.action = action;
        if (statusFilter) params.status = statusFilter;
        if (from) params.from = from;
        if (to) params.to = to;

        const res = await api.get("/activity-logs", { params });
        if (cancelled) return;

        const payload = res.data?.data;
        setLogs(payload?.data || []);
        setPagination({
          current_page: payload?.current_page || 1,
          last_page: payload?.last_page || 1,
          total: payload?.total || 0,
        });
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(
          err.response?.data?.message ||
            (language === "en"
              ? "Failed to load activity logs"
              : "Gagal memuat log aktivitas")
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLogs();

    return () => {
      cancelled = true;
    };
  }, [search, module, action, statusFilter, from, to, page, language]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 25 };
      if (search.trim()) params.search = search.trim();
      if (module) params.module = module;
      if (action) params.action = action;
      if (statusFilter) params.status = statusFilter;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await api.get("/activity-logs", { params });
      const payload = res.data?.data;
      setLogs(payload?.data || []);
      setPagination({
        current_page: payload?.current_page || 1,
        last_page: payload?.last_page || 1,
        total: payload?.total || 0,
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          (language === "en"
            ? "Failed to load activity logs"
            : "Gagal memuat log aktivitas")
      );
    } finally {
      setLoading(false);
    }
  }, [search, module, action, statusFilter, from, to, page, language]);

  const hasActiveFilter = useMemo(
    () => !!(search || module || action || statusFilter || from || to),
    [search, module, action, statusFilter, from, to]
  );

  const resetFilters = () => {
    setSearch("");
    setModule("");
    setAction("");
    setStatusFilter("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-white to-violet-50/40 px-5 py-5 sm:px-6 sm:py-6 shadow-sm shadow-slate-900/5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-violet-300/15 blur-2xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              <Shield size={14} />
              {tr("Super Admin", "Super Admin")}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {tr("Log Aktivitas", "Activity Log")}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {tr(
                "Pantau aksi penting: pembayaran, biaya, pembelian, proyek, foto/dokumen, karyawan, dan cuti.",
                "Monitor important actions: payments, expenses, purchases, projects, photos/documents, employees, and leave."
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchLogs();
              fetchSummary();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            {tr("Muat Ulang", "Refresh")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardSurface className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {tr("Total Log", "Total Logs")}
              </p>
              <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
            </div>
          </div>
        </DashboardSurface>
        <DashboardSurface className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {tr("Hari Ini", "Today")}
              </p>
              <p className="text-2xl font-bold text-slate-900">{summary.today}</p>
            </div>
          </div>
        </DashboardSurface>
        <DashboardSurface className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {tr("Error Hari Ini", "Errors Today")}
              </p>
              <p className="text-2xl font-bold text-slate-900">{summary.errors_today ?? 0}</p>
            </div>
          </div>
        </DashboardSurface>
        <DashboardSurface className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-100 p-2.5 text-sky-700">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {tr("Pengguna Aktif Hari Ini", "Active Users Today")}
              </p>
              <p className="text-2xl font-bold text-slate-900">{summary.unique_users_today}</p>
            </div>
          </div>
        </DashboardSurface>
      </div>

      <DashboardSurface className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter size={16} />
          {tr("Filter", "Filter")}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
          <div className="relative xl:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={tr("Cari pengguna, deskripsi, route...", "Search user, description, route...")}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <select
            value={module}
            onChange={(e) => {
              setModule(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">{tr("Semua Modul", "All Modules")}</option>
            {filterOptions.modules.map((m) => (
              <option key={m} value={m}>
                {moduleLabels[m] || m}
              </option>
            ))}
          </select>

          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">{tr("Semua Aksi", "All Actions")}</option>
            {filterOptions.actions.map((a) => (
              <option key={a} value={a}>
                {actionLabels[a] || a}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">{tr("Semua Status", "All Status")}</option>
            <option value="success">{tr("Sukses", "Success")}</option>
            <option value="error">{tr("Error / Gagal", "Error / Failed")}</option>
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />

          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 text-sm font-medium text-violet-700 hover:text-violet-800"
          >
            {tr("Reset filter", "Reset filters")}
          </button>
        )}
      </DashboardSurface>

      <DashboardSurface className="overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            {tr("Memuat log aktivitas...", "Loading activity logs...")}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 px-5 py-10 text-rose-600">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-16 text-center text-slate-500">
            {tr("Belum ada log aktivitas.", "No activity logs yet.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{tr("Waktu", "Time")}</th>
                  <th className="px-4 py-3">{tr("Pengguna", "User")}</th>
                  <th className="px-4 py-3">{tr("Modul", "Module")}</th>
                  <th className="px-4 py-3">{tr("Aksi", "Action")}</th>
                  <th className="px-4 py-3">{tr("Deskripsi", "Description")}</th>
                  <th className="px-4 py-3">{tr("Status", "Status")}</th>
                  <th className="px-4 py-3">{tr("IP", "IP")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const hasError = isLogError(log);
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`cursor-pointer hover:bg-slate-50/80 ${hasError ? "bg-rose-50/40" : ""}`}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatDateTime(log.created_at, dateLocale)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{log.user_name || tr("Sistem", "System")}</div>
                          <div className="text-xs text-slate-500">{log.user_email || "-"}</div>
                          {log.user_role && (
                            <div className="mt-0.5 text-xs text-slate-400">{log.user_role}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {moduleLabels[log.module] || log.module || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${actionPillClass(log.action)}`}
                          >
                            {actionLabels[log.action] || log.action}
                          </span>
                        </td>
                        <td className="max-w-xs px-4 py-3 text-slate-700">
                          <div className="truncate">{log.description}</div>
                          <div className="truncate text-xs text-slate-400">
                            {log.method} {log.route}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {hasError ? (
                            <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200/70">
                              {log.status_code || "ERR"}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
                              {log.status_code || "OK"}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                          <div className="inline-flex items-center gap-1">
                            <Globe size={12} />
                            {log.ip_address || "-"}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid gap-3 text-sm md:grid-cols-2">
                              <div>
                                <p className="font-semibold text-slate-700">{tr("Detail", "Details")}</p>
                                <p className="mt-1 text-slate-600">
                                  {tr("Status HTTP", "HTTP Status")}: {log.status_code || "-"}
                                </p>
                                <p className="text-slate-600 break-all">
                                  User Agent: {log.user_agent || "-"}
                                </p>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-700">{tr("Data Tambahan", "Additional Data")}</p>
                                <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                                  {JSON.stringify(log.properties || {}, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && pagination.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-500">
              {tr("Halaman", "Page")} {pagination.current_page} / {pagination.last_page} ({pagination.total}{" "}
              {tr("total", "total")})
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </DashboardSurface>
    </div>
  );
}
