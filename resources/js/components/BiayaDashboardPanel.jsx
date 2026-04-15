import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axiosConfig";
import { DollarSign, Eye, Pencil, Trash2, Clock, CheckCircle, AlertCircle, X } from "lucide-react";
import { digitsOnly, formatRibuanId, nominalApiToInput, parseRibuanId } from "../utils/formatRupiahInput";
import { compressImage } from "../utils/imageCompress";

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

export default function BiayaDashboardPanel({ user }) {
  const isSuperAdmin = user?.role === "super_admin";

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
    jalan: { nominal: "", keterangan: "" },
    pengeluaran: { nominal: "", keterangan: "", photoFiles: [] },
    reimbursment: { nominal: "", keterangan: "", photoFiles: [] },
  });
  const pengeluaranPhotoInputRef = useRef(null);
  const reimbPhotoInputRef = useRef(null);
  const editPhotoInputRef = useRef(null);

  // State untuk modal konfirmasi
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const kategoriWithPhotos = (key) => key === "pengeluaran" || key === "reimbursment";
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
      const [sumRes, listRes] = await Promise.all([
        api.get("/dashboard-biaya/summary"),
        api.get("/dashboard-biaya"),
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
  }, []);

  const grouped = useMemo(() => {
    const sortBelumLunasFirst = (arr) =>
      [...arr].sort((a, b) => {
        const la = a.is_lunas ? 1 : 0;
        const lb = b.is_lunas ? 1 : 0;
        if (la !== lb) return la - lb;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    return {
      jalan: sortBelumLunasFirst(items.filter((i) => i.kategori === "jalan")),
      pengeluaran: sortBelumLunasFirst(items.filter((i) => i.kategori === "pengeluaran")),
      reimbursment: sortBelumLunasFirst(items.filter((i) => i.kategori === "reimbursment")),
    };
  }, [items]);

  const submitKategori = async (kategori) => {
    const row = form[kategori];
    const nominal = parseRibuanId(row.nominal);
    if (!nominal || nominal <= 0) {
      alert("Nominal harus lebih dari 0");
      return;
    }
    if (isCompressingKategori(kategori)) {
      alert("Foto masih dikompres. Tunggu sebentar lalu coba simpan lagi.");
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
      alert(err.response?.data?.message || "Gagal simpan biaya");
    }
  };

  const toggleLunas = (row) => {
    const newStatus = !row.is_lunas;
    const statusText = newStatus ? "Lunas" : "Belum Lunas";
    setConfirmAction({
      row,
      newStatus,
      statusText,
    });
    setShowConfirmModal(true);
  };

  const handleConfirmStatus = async () => {
    if (!confirmAction) return;

    const { row, newStatus } = confirmAction;

    try {
      await api.patch(`/dashboard-biaya/${row.id}`, { is_lunas: newStatus });
      setItems((prev) =>
        prev.map((x) =>
          x.id === row.id ? { ...x, is_lunas: newStatus, lunas_at: newStatus ? new Date().toISOString() : null } : x
        )
      );
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal update lunas");
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const removeRow = async (id) => {
    if (!window.confirm("Hapus data biaya ini?")) return;
    try {
      await api.delete(`/dashboard-biaya/${id}`);
      if (editingId === id) {
        setEditingId(null);
        setEditForm({ nominal: "", keterangan: "", photoFiles: [] });
      }
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal hapus data");
    }
  };

  const startEdit = (row) => {
    if (row.is_lunas) return;
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
    if (!row || row.is_lunas) return;
    const nominal = parseRibuanId(editForm.nominal);
    if (!nominal || nominal <= 0) {
      alert("Nominal harus lebih dari 0");
      return;
    }
    if (compressingKey === "edit") {
      alert("Foto masih dikompres. Tunggu sebentar lalu coba simpan lagi.");
      return;
    }
    try {
      const kat = row.kategori;
      if (kategoriWithPhotos(kat)) {
        const fd = new FormData();
        fd.append("nominal", String(nominal));
        fd.append("keterangan", editForm.keterangan || "");
        (editForm.photoFiles || []).forEach((file) => fd.append("photos[]", file));
        await api.patch(`/dashboard-biaya/${row.id}`, fd);
      } else {
        await api.patch(`/dashboard-biaya/${row.id}`, {
          nominal,
          keterangan: editForm.keterangan || "",
        });
      }
      cancelEdit();
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyimpan perubahan");
    }
  };

  const canDeleteRow = (row) => !row.is_lunas || isSuperAdmin;
  const canEditRow = (row) => !row.is_lunas;

  return (
    <>
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-4 sm:p-5 md:p-6 lg:p-8 mb-6 sm:mb-8 md:mb-10">
      <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
        <DollarSign size={18} className="text-emerald-600" />
        Biaya Diluar Projek
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {kategoriConfig.map((k) => (
          <div key={k.key} className="rounded-xl border p-3 bg-gray-50">
            <p className="text-sm font-semibold mb-2">{k.label}</p>
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
              placeholder="Biaya"
              className="w-full border rounded-lg p-2 text-sm mb-2"
            />
            <input
              type="text"
              value={form[k.key].keterangan}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  [k.key]: { ...p[k.key], keterangan: e.target.value },
                }))
              }
              placeholder="Keterangan"
              className="w-full border rounded-lg p-2 text-sm mb-2"
            />
            {kategoriWithPhotos(k.key) ? (
              <div className="mb-2">
                <label className="block text-xs text-gray-600 mb-1">Upload foto</label>
                <input
                  ref={k.key === "pengeluaran" ? pengeluaranPhotoInputRef : reimbPhotoInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handlePhotoSelection(k.key, e.target.files)}
                  className="w-full text-xs border rounded-lg p-1.5 bg-white"
                />
                {isCompressingKategori(k.key) ? (
                  <p className="text-[11px] text-blue-600 mt-1">Sedang kompres foto...</p>
                ) : null}
                {form[k.key].photoFiles?.length > 0 ? (
                  <p className="text-[11px] text-gray-500 mt-1">
                    {form[k.key].photoFiles.length} file dipilih
                  </p>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => submitKategori(k.key)}
              disabled={isCompressingKategori(k.key)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm"
            >
              {isCompressingKategori(k.key) ? "Mengompres foto..." : `Simpan ${k.label}`}
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Summary title="Biaya Jalan" value={summary.jalan} />
        <Summary title="Pengeluaran" value={summary.pengeluaran} />
        <Summary title="Reimbursment" value={summary.reimbursment} />
        <Summary title="Total" value={summary.total} highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {kategoriConfig.map((k) => (
          <div key={k.key} className="border rounded-xl p-3">
            <p className="text-sm font-semibold mb-2">{k.label}</p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(grouped[k.key] || []).map((row) => (
                <div key={row.id} className="text-xs border rounded-lg p-2">
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
                        placeholder="Biaya"
                        className="w-full border rounded-lg p-2 text-sm"
                      />
                      <input
                        type="text"
                        value={editForm.keterangan}
                        onChange={(e) => setEditForm((f) => ({ ...f, keterangan: e.target.value }))}
                        placeholder="Keterangan"
                        className="w-full border rounded-lg p-2 text-sm"
                      />
                      {kategoriWithPhotos(row.kategori) ? (
                        <div>
                          <label className="block text-[11px] text-gray-600 mb-0.5">Upload foto</label>
                          <input
                            ref={editPhotoInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleEditPhotoSelection(e.target.files)}
                            className="w-full text-[11px] border rounded-lg p-1 bg-white"
                          />
                          {compressingKey === "edit" ? (
                            <p className="text-[11px] text-blue-600 mt-1">Sedang kompres foto...</p>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={compressingKey === "edit"}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white rounded-lg py-1.5 text-xs"
                        >
                          {compressingKey === "edit" ? "Mengompres foto..." : "Simpan"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg py-1.5 text-xs"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <p className="font-semibold">{rupiah(row.nominal)}</p>
                        {row.lunas_at && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <Clock size={10} />
                            <span>Updated: {formatDateTime(row.lunas_at)}</span>
                          </div>
                        )}
                      </div>
                      {row.keterangan ? <p className="text-gray-600">{row.keterangan}</p> : null}
                      <p className="mt-1 text-[11px] text-gray-500">
                        <span className="font-medium">{row.creator_name || row.updater_name || "-"}</span>, {formatDateTime(row.created_at)}
                      </p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {isSuperAdmin ? (
                          <button
                            type="button"
                            onClick={() => toggleLunas(row)}
                            className={`px-2 py-1 rounded border ${row.is_lunas ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-yellow-100 text-yellow-700 border-yellow-300"}`}
                          >
                            {row.is_lunas ? "Lunas" : "Belum"}
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-1 rounded border ${row.is_lunas ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-yellow-100 text-yellow-700 border-yellow-300"}`}
                          >
                            {row.is_lunas ? "Lunas" : "Belum"}
                          </span>
                        )}
                        {(row.photo_urls || []).map((url, idx) => (
                          <a
                            key={`${row.id}-ph-${idx}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Lihat lampiran ${idx + 1}`}
                            className="inline-flex items-center justify-center px-2 py-1 rounded border bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
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
                            title="Edit"
                            className="inline-flex items-center justify-center px-2 py-1 rounded border bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                          >
                            <Pencil size={12} aria-hidden />
                          </button>
                        ) : null}
                        {canDeleteRow(row) ? (
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            title="Hapus"
                            className="px-2 py-1 rounded border bg-red-100 text-red-600 border-red-300"
                          >
                            <Trash2 size={12} />
                          </button>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              ))}
              {(grouped[k.key] || []).length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada data</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {loading ? <p className="text-xs text-gray-400 mt-3">Memuat...</p> : null}
    </div>

    {/* Modal Konfirmasi Status */}
    {showConfirmModal && confirmAction && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all animate-in fade-in zoom-in duration-200">
          {/* Header dengan icon */}
          <div className="pt-6 pb-2 px-6 flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              confirmAction.newStatus
                ? 'bg-emerald-100'
                : 'bg-amber-100'
            }`}>
              {confirmAction.newStatus ? (
                <CheckCircle size={32} className="text-emerald-600" />
              ) : (
                <AlertCircle size={32} className="text-amber-600" />
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Ubah Status Biaya
            </h3>
            <p className="text-sm text-gray-500 text-center">
              Apakah Anda yakin ingin mengubah status menjadi
            </p>
          </div>

          {/* Status yang akan diubah */}
          <div className="px-6 pb-4">
            <div className={`py-3 px-4 rounded-xl text-center font-semibold ${
              confirmAction.newStatus
                ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-2 border-amber-200'
            }`}>
              {confirmAction.statusText}
            </div>
          </div>

          {/* Info tambahan */}
          {confirmAction.row && (
            <div className="px-6 pb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Nominal:</p>
                <p className="font-semibold text-gray-700">{rupiah(confirmAction.row.nominal)}</p>
                {confirmAction.row.keterangan && (
                  <>
                    <p className="text-xs text-gray-500 mb-1 mt-2">Keterangan:</p>
                    <p className="text-sm text-gray-700 truncate">{confirmAction.row.keterangan}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tombol Action */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={handleCancelConfirm}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmStatus}
              className={`flex-1 py-2.5 px-4 rounded-xl text-white font-medium transition-colors text-sm ${
                confirmAction.newStatus
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              Ya, Ubah Status
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function Summary({ title, value, highlight = false }) {
  return (
    <div className={`rounded-xl p-3 border ${highlight ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
      <p className="text-xs text-gray-600">{title}</p>
      <p className="font-bold text-sm">{rupiah(value)}</p>
    </div>
  );
}
