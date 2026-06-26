import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { DollarSign, Eye, Pencil, Trash2, Clock, CheckCircle, AlertCircle, X } from "lucide-react";
import { digitsOnly, formatRibuanId, nominalApiToInput, parseRibuanId } from "../utils/formatRupiahInput";
import { compressImage } from "../utils/imageCompress";
import { useI18n } from "../i18n/index.jsx";
import { DashboardSurface } from "./dashboard/DashboardPrimitives.jsx";

const kategoriConfig = [
  { key: "jalan", label: "Biaya Jalan" },
  { key: "pengeluaran", label: "Biaya Pengeluaran" },
  { key: "reimbursment", label: "Biaya Reimbursment" },
];

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

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

export default function BiayaDashboardPanel({ user, showInput = true, scopeUserId = null }) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const isSuperAdmin = user?.role === "super_admin";

  const location = useLocation();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const rowRefs = useRef({});
  const handledHighlightRef = useRef(null);
  const highlightTimersRef = useRef([]);
  const [pendingHighlightId, setPendingHighlightId] = useState(null);
  const [highlightId, setHighlightId] = useState(null);

  const [summary, setSummary] = useState({
    jalan: 0,
    pengeluaran: 0,
    reimbursment: 0,
    total: 0,
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compressingKey, setCompressingKey] = useState(null);

  const [form, setForm] = useState({
    jalan: { nominal: "", keterangan: "", photoFiles: [] },
    pengeluaran: { nominal: "", keterangan: "", photoFiles: [] },
    reimbursment: { nominal: "", keterangan: "", photoFiles: [] },
  });
  const jalanPhotoInputRef = useRef(null);
  const pengeluaranPhotoInputRef = useRef(null);
  const reimbPhotoInputRef = useRef(null);
  const editPhotoInputRef = useRef(null);

  // State untuk modal konfirmasi
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  const kategoriWithPhotos = (key) => key === "jalan" || key === "pengeluaran" || key === "reimbursment";
  const isCompressingKategori = (key) => compressingKey === key;

  const handlePhotoSelection = async (kategori, fileList) => {
    const files = fileList ? Array.from(fileList) : [];
    setCompressingKey(kategori);
    try {
      const compressed = await Promise.all(files.map((file) => compressImage(file)));
      setForm((p) => ({
        ...p,
        [kategori]: {
          ...p[kategori],
          photoFiles: compressed,
        },
      }));
    } finally {
      setCompressingKey((current) => (current === kategori ? null : current));
    }
  };

  const handleEditPhotoSelection = async (fileList) => {
    const files = fileList ? Array.from(fileList) : [];
    const editKey = "edit";
    setCompressingKey(editKey);
    try {
      const compressed = await Promise.all(files.map((file) => compressImage(file)));
      setEditForm((f) => ({
        ...f,
        photoFiles: compressed,
      }));
    } finally {
      setCompressingKey((current) => (current === editKey ? null : current));
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    nominal: "",
    keterangan: "",
    photoFiles: [],
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const queryParams = isSuperAdmin && scopeUserId ? { user_id: scopeUserId } : undefined;
      const [sumRes, listRes] = await Promise.all([
        api.get("/dashboard-biaya/summary", { params: queryParams }),
        api.get("/dashboard-biaya", { params: queryParams }),
      ]);
      setSummary(sumRes.data?.data || {});
      setItems(listRes.data?.data || []);
    } catch (err) {
      console.error("Gagal load dashboard biaya", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [scopeUserId]);

  // Simpan ID dari query notifikasi, lalu bersihkan URL.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get("biaya_diluar");
    if (!idParam) return;

    setPendingHighlightId(String(idParam));

    params.delete("biaya_diluar");
    const nextQuery = params.toString();
    navigate(`${location.pathname}${nextQuery ? `?${nextQuery}` : ""}`, { replace: true });
  }, [location.search, location.pathname, navigate]);

  // Bersihkan timer highlight saat komponen di-unmount.
  useEffect(
    () => () => {
      highlightTimersRef.current.forEach((t) => window.clearTimeout(t));
      highlightTimersRef.current = [];
    },
    []
  );

  // Setelah data dimuat, scroll ke panel biaya dan sorot baris terkait.
  useEffect(() => {
    if (!pendingHighlightId || loading) return;
    if (handledHighlightRef.current === pendingHighlightId) return;

    const target = items.find(
      (item) => String(item.id) === String(pendingHighlightId)
    );
    if (!target) return; // Tunggu data; jika memang tidak ada, biarkan tanpa highlight.

    handledHighlightRef.current = pendingHighlightId;
    const targetId = String(target.id);
    setHighlightId(targetId);

    const scrollToTarget = () => {
      const el =
        document.getElementById(`biaya-diluar-row-${targetId}`) ||
        rowRefs.current[targetId];

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }

      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    };

    // Timer disimpan di ref agar tidak terhapus oleh perubahan state lain.
    highlightTimersRef.current.forEach((t) => window.clearTimeout(t));
    const scrollTimer = window.setTimeout(() => {
      if (!scrollToTarget()) {
        window.setTimeout(scrollToTarget, 400);
      }
    }, 200);
    const clearTimer = window.setTimeout(() => setHighlightId(null), 5000);
    highlightTimersRef.current = [scrollTimer, clearTimer];
  }, [pendingHighlightId, loading, items]);

  const groupedByLunas = useMemo(() => {
    const byNewest = (arr) => [...arr].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const build = (isLunas) => ({
      jalan: byNewest((items || []).filter((i) => i.kategori === "jalan" && Boolean(i.is_lunas) === isLunas)),
      pengeluaran: byNewest((items || []).filter((i) => i.kategori === "pengeluaran" && Boolean(i.is_lunas) === isLunas)),
      reimbursment: byNewest((items || []).filter((i) => i.kategori === "reimbursment" && Boolean(i.is_lunas) === isLunas)),
    });
    return {
      belum: build(false),
      lunas: build(true),
    };
  }, [items]);

  const submitKategori = async (kategori) => {
    const row = form[kategori];
    const nominal = parseRibuanId(row.nominal);
    if (!nominal || nominal <= 0) {
      alert(tr("Nominal harus lebih dari 0", "Amount must be greater than 0"));
      return;
    }
    if (isCompressingKategori(kategori)) {
      alert(tr("Foto masih dikompres. Tunggu sebentar lalu coba simpan lagi.", "Photos are still being compressed. Please wait and try saving again."));
      return;
    }
    try {
      if (kategoriWithPhotos(kategori)) {
        const fd = new FormData();
        fd.append("kategori", kategori);
        fd.append("nominal", String(nominal));
        fd.append("keterangan", row.keterangan || "");
        (row.photoFiles || []).forEach((file) => fd.append("photos[]", file));
        await api.post("/dashboard-biaya", fd);
        if (kategori === "jalan" && jalanPhotoInputRef.current) {
          jalanPhotoInputRef.current.value = "";
        }
        if (kategori === "pengeluaran" && pengeluaranPhotoInputRef.current) {
          pengeluaranPhotoInputRef.current.value = "";
        }
        if (kategori === "reimbursment" && reimbPhotoInputRef.current) {
          reimbPhotoInputRef.current.value = "";
        }
        setForm((p) => ({
          ...p,
          [kategori]: { nominal: "", keterangan: "", photoFiles: [] },
        }));
      } else {
        await api.post("/dashboard-biaya", {
          kategori,
          nominal,
          keterangan: row.keterangan || "",
        });
        setForm((p) => ({ ...p, [kategori]: { nominal: "", keterangan: "" } }));
      }
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || tr("Gagal simpan biaya", "Failed to save costs"));
    }
  };

  const toggleLunas = (row) => {
    const newStatus = !row.is_lunas;
    const statusText = newStatus ? tr("Lunas", "Paid") : tr("Belum Lunas", "Unpaid");
    setConfirmAction({
      type: "status",
      row,
      newStatus,
      statusText,
    });
    setShowConfirmModal(true);
  };

  const requestDeleteRow = (row) => {
    setConfirmAction({
      type: "delete",
      row,
    });
    setShowConfirmModal(true);
  };

  const kategoriLabel = (key) => {
    const found = kategoriConfig.find((k) => k.key === key);
    if (!found) return key || "-";
    return tr(
      found.label,
      key === "jalan" ? "Travel Cost" : key === "pengeluaran" ? "Expense Cost" : "Reimbursement Cost"
    );
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || confirmProcessing) return;

    setConfirmProcessing(true);
    try {
      if (confirmAction.type === "delete") {
        const { row } = confirmAction;
        await api.delete(`/dashboard-biaya/${row.id}`);
        if (editingId === row.id) {
          setEditingId(null);
          setEditForm({ nominal: "", keterangan: "", photoFiles: [] });
        }
        fetchAll();
      } else {
        const { row, newStatus } = confirmAction;
        await api.patch(`/dashboard-biaya/${row.id}`, { is_lunas: newStatus });
        setItems((prev) =>
          prev.map((x) =>
            x.id === row.id ? { ...x, is_lunas: newStatus, lunas_at: newStatus ? new Date().toISOString() : null } : x
          )
        );
        fetchAll();
      }
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (err) {
      const fallback =
        confirmAction.type === "delete"
          ? tr("Gagal hapus data", "Failed to delete data")
          : tr("Gagal update lunas", "Failed to update payment status");
      alert(err.response?.data?.message || fallback);
    } finally {
      setConfirmProcessing(false);
    }
  };

  const handleCancelConfirm = () => {
    if (confirmProcessing) return;
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({
      nominal: nominalApiToInput(row.nominal) || formatRibuanId(String(Math.round(Number(row.nominal || 0)))),
      keterangan: row.keterangan || "",
      photoFiles: [],
    });
    if (editPhotoInputRef.current) editPhotoInputRef.current.value = "";
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ nominal: "", keterangan: "", photoFiles: [] });
    if (editPhotoInputRef.current) editPhotoInputRef.current.value = "";
  };

  const saveEdit = async () => {
    const row = items.find((i) => i.id === editingId);
    if (!row) return;
    const nominal = parseRibuanId(editForm.nominal);
    if (!row.is_lunas && (!nominal || nominal <= 0)) {
      alert(tr("Nominal harus lebih dari 0", "Amount must be greater than 0"));
      return;
    }
    try {
      const payload = {
        keterangan: editForm.keterangan || "",
      };
      if (!row.is_lunas) {
        payload.nominal = nominal;
      }
      await api.patch(`/dashboard-biaya/${row.id}`, payload);
      cancelEdit();
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || tr("Gagal menyimpan perubahan", "Failed to save changes"));
    }
  };

  const canDeleteRow = (row) => !row.is_lunas;
  const canEditRow = () => true;

  const renderKategoriCard = (k, rows) => (
    <div
      key={k.key}
      className="rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-sm ring-1 ring-slate-900/[0.02]"
    >
      <p className="mb-2 border-b border-slate-100 pb-2 text-sm font-bold tracking-tight text-slate-800">
        {tr(k.label, k.key === "jalan" ? "Travel Cost" : k.key === "pengeluaran" ? "Expense Cost" : "Reimbursement Cost")}
      </p>
      <div className="max-h-56 space-y-2 overflow-y-auto pr-0.5">
        {(rows || []).map((row) => (
          <div
            key={row.id}
            id={`biaya-diluar-row-${row.id}`}
            ref={(el) => {
              rowRefs.current[String(row.id)] = el;
            }}
            className={`rounded-lg border p-2.5 text-xs shadow-sm transition ${
              String(highlightId) === String(row.id)
                ? "border-amber-300 bg-amber-50 ring-2 ring-amber-400/70"
                : "border-slate-200/80 bg-slate-50/40 hover:border-slate-300/90 hover:bg-white"
            }`}
          >
            {editingId === row.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={editForm.nominal}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      nominal: formatRibuanId(digitsOnly(e.target.value)),
                    }))
                  }
                  placeholder={tr("Biaya", "Amount")}
                  disabled={row.is_lunas}
                  readOnly={row.is_lunas}
                  className={`w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 ${row.is_lunas ? "cursor-not-allowed bg-slate-100 text-slate-500" : "bg-white"}`}
                />
                <textarea
                  value={editForm.keterangan}
                  onChange={(e) => setEditForm((f) => ({ ...f, keterangan: e.target.value }))}
                  placeholder={tr("Keterangan", "Description")}
                  className="min-h-[60px] w-full resize-y rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                  rows="2"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    {tr("Simpan", "Save")}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-slate-200"
                  >
                    {tr("Batal", "Cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold tabular-nums text-slate-900">{rupiah(row.nominal)}</p>
                  {row.lunas_at && (
                    <div className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200/60">
                      <Clock size={10} />
                      <span>{tr("Diperbarui", "Updated")}: {formatDateTime(row.lunas_at)}</span>
                    </div>
                  )}
                </div>
                {row.keterangan ? <p className="mt-1 whitespace-pre-wrap break-words text-slate-600">{row.keterangan}</p> : null}
                <p className="mt-1.5 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-600">{row.creator_name || row.updater_name || "-"}</span>, {formatDateTime(row.created_at)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {isSuperAdmin ? (
                    <button
                      type="button"
                      onClick={() => toggleLunas(row)}
                      className={`rounded-md border px-2 py-1 text-[10px] font-semibold transition ${row.is_lunas ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"}`}
                    >
                      {row.is_lunas ? tr("Lunas", "Paid") : tr("Belum", "Unpaid")}
                    </button>
                  ) : (
                    <span
                      className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${row.is_lunas ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900"}`}
                    >
                      {row.is_lunas ? tr("Lunas", "Paid") : tr("Belum", "Unpaid")}
                    </span>
                  )}
                  {(row.photo_urls || []).map((url, idx) => (
                    <a
                      key={`${row.id}-ph-${idx}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${tr("Lihat lampiran", "View attachment")} ${idx + 1}`}
                      className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Eye size={12} aria-hidden />
                      {(row.photo_urls || []).length > 1 ? (
                        <span className="ml-0.5 text-[10px] font-medium tabular-nums">{idx + 1}</span>
                      ) : null}
                    </a>
                  ))}
                  {canEditRow(row) ? (
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      title={tr("Edit", "Edit")}
                      className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Pencil size={12} aria-hidden />
                    </button>
                  ) : null}
                  {canDeleteRow(row) ? (
                    <button
                      type="button"
                      onClick={() => requestDeleteRow(row)}
                      title={tr("Hapus", "Delete")}
                      className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        ))}
        {(rows || []).length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 py-4 text-center text-xs text-slate-400">
            {tr("Belum ada data", "No data yet")}
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <DashboardSurface ref={panelRef} className="mb-6 p-4 sm:mb-8 sm:p-5 md:mb-10 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-indigo-500/10 ring-1 ring-emerald-500/20">
            <DollarSign size={22} className="text-emerald-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {tr("Biaya Diluar Projek", "Non-Project Costs")}
            </h3>
            <p className="mt-0.5 max-w-xl text-xs text-slate-500 sm:text-sm">
              {tr("Catat biaya per kategori; kelola status lunas di bawah.", "Record costs per category; manage paid status below.")}
            </p>
          </div>
        </div>
      </div>

      {showInput && (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {kategoriConfig.map((k) => (
            <div
              key={k.key}
              className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-sm ring-1 ring-slate-900/[0.02]"
            >
              <p className="mb-3 text-sm font-bold text-slate-800">
                {tr(k.label, k.key === "jalan" ? "Travel Cost" : k.key === "pengeluaran" ? "Expense Cost" : "Reimbursement Cost")}
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={form[k.key].nominal}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    [k.key]: {
                      ...p[k.key],
                      nominal: formatRibuanId(digitsOnly(e.target.value)),
                    },
                  }))
                }
                placeholder={tr("Biaya", "Amount")}
                className="mb-2 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
              <textarea
                value={form[k.key].keterangan}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    [k.key]: { ...p[k.key], keterangan: e.target.value },
                  }))
                }
                placeholder={tr("Keterangan", "Description")}
                className="mb-2 min-h-[60px] w-full resize-y rounded-lg border border-slate-200 bg-white p-2.5 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                rows="2"
              />
              {kategoriWithPhotos(k.key) ? (
                <div className="mb-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">{tr("Upload foto", "Upload photos")}</label>
                  <input
                    ref={
                      k.key === "jalan"
                        ? jalanPhotoInputRef
                        : k.key === "pengeluaran"
                          ? pengeluaranPhotoInputRef
                          : reimbPhotoInputRef
                    }
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handlePhotoSelection(k.key, e.target.files)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs file:mr-2 file:rounded file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-indigo-700"
                  />
                  {isCompressingKategori(k.key) ? (
                    <p className="text-[11px] text-blue-600 mt-1">{tr("Sedang kompres foto...", "Compressing photos...")}</p>
                  ) : null}
                  {form[k.key].photoFiles?.length > 0 ? (
                    <p className="text-[11px] text-gray-500 mt-1">
                      {form[k.key].photoFiles.length} {tr("file dipilih", "files selected")}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => submitKategori(k.key)}
                disabled={isCompressingKategori(k.key)}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-900/10 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {isCompressingKategori(k.key)
                  ? tr("Mengompres foto...", "Compressing photos...")
                  : `${tr("Simpan", "Save")} ${tr(k.label, k.key === "jalan" ? "Travel Cost" : k.key === "pengeluaran" ? "Expense Cost" : "Reimbursement Cost")}`}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Summary title={tr("Biaya Jalan", "Travel Cost")} value={summary.jalan} tone="sky" />
        <Summary title={tr("Pengeluaran", "Expenses")} value={summary.pengeluaran} tone="violet" />
        <Summary title={tr("Reimbursment", "Reimbursement")} value={summary.reimbursment} tone="teal" />
        <Summary title={tr("Total", "Total")} value={summary.total} highlight tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/70 to-white p-4 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-5">
          <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <span className="h-2 w-2 rounded-full bg-slate-400 shadow-sm shadow-slate-400/40" />
            {tr("Belum Lunas", "Unpaid")}
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {kategoriConfig.map((k) => renderKategoriCard(k, groupedByLunas.belum[k.key]))}
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-b from-indigo-50/40 to-white p-4 shadow-sm ring-1 ring-indigo-900/[0.03] sm:p-5">
          <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/35" />
            {tr("Sudah Lunas", "Paid")}
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {kategoriConfig.map((k) => renderKategoriCard(k, groupedByLunas.lunas[k.key]))}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          {tr("Memuat...", "Loading...")}
        </p>
      ) : null}
    </DashboardSurface>

    {/* Modal Konfirmasi */}
    {showConfirmModal && confirmAction && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
        onClick={handleCancelConfirm}
      >
        <div
          className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
          onClick={(e) => e.stopPropagation()}
        >
          {confirmAction.type === "delete" ? (
            <>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={confirmProcessing}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                aria-label={tr("Batal", "Cancel")}
              >
                <X size={18} />
              </button>
              <div className="flex flex-col items-center px-6 pb-2 pt-7 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 shadow-inner ring-1 ring-red-100">
                  <Trash2 size={30} className="text-red-600" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {tr("Hapus Data Biaya", "Delete Cost Data")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {tr(
                    "Data biaya ini akan dihapus permanen dan tidak dapat dikembalikan.",
                    "This cost entry will be permanently removed and cannot be restored."
                  )}
                </p>
              </div>
              {confirmAction.row && (
                <div className="px-6 pb-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {kategoriLabel(confirmAction.row.kategori)}
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {rupiah(confirmAction.row.nominal)}
                    </p>
                    {confirmAction.row.keterangan ? (
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                        {confirmAction.row.keterangan}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
              <div className="flex gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  disabled={confirmProcessing}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {tr("Batal", "Cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={confirmProcessing}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-500/25 transition hover:from-red-700 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {confirmProcessing
                    ? tr("Menghapus...", "Deleting...")
                    : tr("Ya, Hapus", "Yes, Delete")}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center px-6 pb-2 pt-6">
                <div
                  className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full ${
                    confirmAction.newStatus ? "bg-emerald-100" : "bg-amber-100"
                  }`}
                >
                  {confirmAction.newStatus ? (
                    <CheckCircle size={32} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={32} className="text-amber-600" />
                  )}
                </div>
                <h3 className="mb-1 text-lg font-bold text-gray-800">
                  {tr("Ubah Status Biaya", "Change Cost Status")}
                </h3>
                <p className="text-center text-sm text-gray-500">
                  {tr(
                    "Apakah Anda yakin ingin mengubah status menjadi",
                    "Are you sure you want to change status to"
                  )}
                </p>
              </div>
              <div className="px-6 pb-4">
                <div
                  className={`rounded-xl px-4 py-3 text-center font-semibold ${
                    confirmAction.newStatus
                      ? "border-2 border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-2 border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {confirmAction.statusText}
                </div>
              </div>
              {confirmAction.row && (
                <div className="px-6 pb-4">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="mb-1 text-xs text-gray-500">{tr("Nominal", "Amount")}:</p>
                    <p className="font-semibold text-gray-700">{rupiah(confirmAction.row.nominal)}</p>
                    {confirmAction.row.keterangan && (
                      <>
                        <p className="mb-1 mt-2 text-xs text-gray-500">{tr("Keterangan", "Description")}:</p>
                        <p className="truncate text-sm text-gray-700">{confirmAction.row.keterangan}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  disabled={confirmProcessing}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
                >
                  {tr("Batal", "Cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={confirmProcessing}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-70 ${
                    confirmAction.newStatus
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {confirmProcessing
                    ? tr("Memproses...", "Processing...")
                    : tr("Ya, Ubah Status", "Yes, Change Status")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}

function Summary({ title, value, highlight = false, tone = "slate" }) {
  const tones = {
    slate: "from-slate-50 to-white border-slate-200/90",
    sky: "from-indigo-50/70 to-white border-indigo-200/60",
    violet: "from-slate-50/90 to-white border-slate-200/90",
    teal: "from-slate-50/90 to-white border-slate-200/90",
    amber: "from-indigo-50/50 to-white border-indigo-200/60",
  };
  const bar = {
    slate: "from-slate-400 to-slate-600",
    sky: "from-indigo-500 to-indigo-600",
    violet: "from-slate-400 to-slate-500",
    teal: "from-slate-400 to-slate-500",
    amber: "from-indigo-500 to-indigo-600",
  };
  const t = highlight ? "amber" : tone;
  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-3 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-3.5 ${tones[t] || tones.slate}`}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-90 ${bar[t] || bar.slate}`} />
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-sm font-bold tabular-nums text-slate-900 sm:text-base">{rupiah(value)}</p>
    </div>
  );
}
