import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  Loader2,
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import api from "../api/axiosConfig";
import tokenManager from "../utils/tokenManager";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { DashboardSurface } from "../components/dashboard/DashboardPrimitives.jsx";

const MAX_PIHAK = 7;
const MAX_PERMINTAAN = 4;
const MAX_DOKUMENTASI = 20;

export default function RfiFormPage() {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const navigate = useNavigate();
  const user = tokenManager.getUser();

  const role = user?.role;
  const basePath =
    role === "super_admin" ? "/super_admin" : role === "user" ? "/user" : "/admin";

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [form, setForm] = useState({
    kepada: "",
    tanggal: todayIso,
    oleh: user?.name || "",
    perusahaan: "PT. Hayati Semesta Raharja (HSR)",
    perihal: "",
    lampiran: "",
    note: "",
    nama_perusahaan_kiri: "PT. Hayati Semesta Raharja (HSR)",
    nama_perusahaan_tengah: "PT. Indosopha Sakti",
    pemberi_tugas: "",
  });

  const [pihakTerlibat, setPihakTerlibat] = useState([""]);
  const [permintaan, setPermintaan] = useState([""]);
  const [dokumentasi, setDokumentasi] = useState([{ nama_ruangan: "", foto: null }]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    document.title = "WEB HSR - " + tr("Form RFI", "RFI Form");
  }, [language]);

  /* ============================================================
   * HANDLERS
   * ============================================================ */
  const updateField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const addPihak = () => {
    if (pihakTerlibat.length >= MAX_PIHAK) return;
    setPihakTerlibat((p) => [...p, ""]);
  };
  const removePihak = (idx) => setPihakTerlibat((p) => p.filter((_, i) => i !== idx));
  const updatePihak = (idx, v) =>
    setPihakTerlibat((p) => p.map((x, i) => (i === idx ? v : x)));

  const addPermintaan = () => {
    if (permintaan.length >= MAX_PERMINTAAN) return;
    setPermintaan((p) => [...p, ""]);
  };
  const removePermintaan = (idx) =>
    setPermintaan((p) => p.filter((_, i) => i !== idx));
  const updatePermintaan = (idx, v) =>
    setPermintaan((p) => p.map((x, i) => (i === idx ? v : x)));

  const addDokumentasi = () => {
    if (dokumentasi.length >= MAX_DOKUMENTASI) return;
    setDokumentasi((p) => [...p, { nama_ruangan: "", foto: null }]);
  };
  const removeDokumentasi = (idx) =>
    setDokumentasi((p) => p.filter((_, i) => i !== idx));
  const updateDokumentasi = (idx, patch) =>
    setDokumentasi((p) => p.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  /* ============================================================
   * SUBMIT — kirim FormData ke backend, terima file xlsx, trigger download
   * ============================================================ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));

      pihakTerlibat
        .filter((s) => s && s.trim() !== "")
        .forEach((s, i) => fd.append(`pihak_terlibat[${i}]`, s));

      permintaan
        .filter((s) => s && s.trim() !== "")
        .forEach((s, i) => fd.append(`permintaan[${i}]`, s));

      dokumentasi.forEach((d, i) => {
        if ((d.nama_ruangan && d.nama_ruangan.trim() !== "") || d.foto) {
          fd.append(`dokumentasi[${i}][nama_ruangan]`, d.nama_ruangan || "");
          if (d.foto) fd.append(`dokumentasi[${i}][foto]`, d.foto);
        }
      });

      const res = await api.post("/kontraktor/rfi/generate", fd, {
        responseType: "blob",
        headers: { Accept: "application/octet-stream" },
      });

      // Trigger download
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date()
        .toISOString()
        .replace(/[-:T]/g, "")
        .slice(0, 14);
      a.download = `RFI_${stamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      // Coba parse error blob -> JSON
      let msg = tr("Gagal generate RFI", "Failed to generate RFI");
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          msg = json.message || msg;
        } catch { /* abaikan */ }
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
   * RENDER
   * ============================================================ */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-white to-indigo-50/40 px-5 py-5 sm:px-6 sm:py-6 shadow-sm shadow-slate-900/5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-300/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-4 h-28 w-28 rounded-full bg-emerald-300/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(`${basePath}/kontraktor`)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition mb-2"
            >
              <ArrowLeft size={13} /> {tr("Kembali", "Back")}
            </button>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600/90">
              {tr("Kontraktor · Dokumen", "Contractor · Document")}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {tr("Form RFI — Request For Information", "RFI Form — Request For Information")}
            </h1>
            <div className="mt-3 h-1 w-12 rounded-full bg-indigo-500/80" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* === HEADER INFO === */}
        <DashboardSurface className="p-4 sm:p-5 md:p-6">
          <SectionTitle title={tr("Header Surat", "Letter Header")} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={tr("Kepada", "To")}>
              <input
                value={form.kepada}
                onChange={(e) => updateField("kepada", e.target.value)}
                placeholder={tr("Nama / instansi penerima", "Recipient name / institution")}
                className="input"
              />
            </Field>
            <Field label={tr("Oleh", "From")}>
              <input
                value={form.oleh}
                onChange={(e) => updateField("oleh", e.target.value)}
                className="input"
              />
            </Field>
            <Field label={tr("Tanggal", "Date")}>
              <input
                type="date"
                value={form.tanggal}
                onChange={(e) => updateField("tanggal", e.target.value)}
                className="input"
              />
            </Field>
            <Field label={tr("Perusahaan", "Company")}>
              <input
                value={form.perusahaan}
                onChange={(e) => updateField("perusahaan", e.target.value)}
                className="input"
              />
            </Field>
            <Field label={tr("Perihal", "Subject")}>
              <input
                value={form.perihal}
                onChange={(e) => updateField("perihal", e.target.value)}
                placeholder={tr("Subjek surat", "Letter subject")}
                className="input"
              />
            </Field>
            <Field label={tr("Lampiran", "Attachment")}>
              <input
                value={form.lampiran}
                onChange={(e) => updateField("lampiran", e.target.value)}
                placeholder={tr("Mis. 1 berkas, foto, dll.", "e.g., 1 file, photo, etc.")}
                className="input"
              />
            </Field>
          </div>
        </DashboardSurface>

        {/* === PIHAK YANG TERLIBAT === */}
        <DashboardSurface className="p-4 sm:p-5 md:p-6">
          <SectionTitle
            title={tr("Pihak Yang Terlibat", "Parties Involved")}
            hint={tr(`Maksimal ${MAX_PIHAK} pihak`, `Up to ${MAX_PIHAK} parties`)}
          />
          <div className="space-y-2">
            {pihakTerlibat.map((p, idx) => (
              <RepeatRow
                key={idx}
                index={idx + 1}
                value={p}
                placeholder={tr("Nama pihak / posisi / perusahaan", "Party name / position / company")}
                onChange={(v) => updatePihak(idx, v)}
                onRemove={pihakTerlibat.length > 1 ? () => removePihak(idx) : null}
              />
            ))}
          </div>
          {pihakTerlibat.length < MAX_PIHAK && (
            <button
              type="button"
              onClick={addPihak}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
            >
              <Plus size={14} /> {tr("Tambah pihak", "Add party")}
            </button>
          )}
        </DashboardSurface>

        {/* === PERMINTAAN APPROVAL === */}
        <DashboardSurface className="p-4 sm:p-5 md:p-6">
          <SectionTitle
            title={tr("Daftar Permintaan Approval", "Approval Request List")}
            hint={tr(`Maksimal ${MAX_PERMINTAAN} permintaan`, `Up to ${MAX_PERMINTAAN} requests`)}
          />
          <div className="space-y-2">
            {permintaan.map((p, idx) => (
              <RepeatRow
                key={idx}
                index={idx + 1}
                value={p}
                placeholder={tr(
                  "Tuliskan permintaan / kegiatan yang butuh approval",
                  "Write the request / activity that needs approval"
                )}
                onChange={(v) => updatePermintaan(idx, v)}
                onRemove={permintaan.length > 1 ? () => removePermintaan(idx) : null}
                multiline
              />
            ))}
          </div>
          {permintaan.length < MAX_PERMINTAAN && (
            <button
              type="button"
              onClick={addPermintaan}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
            >
              <Plus size={14} /> {tr("Tambah permintaan", "Add request")}
            </button>
          )}
        </DashboardSurface>

        {/* === NOTE === */}
        <DashboardSurface className="p-4 sm:p-5 md:p-6">
          <SectionTitle title={tr("Catatan / Note", "Note")} />
          <textarea
            value={form.note}
            onChange={(e) => updateField("note", e.target.value)}
            rows={5}
            placeholder={tr(
              "Tuliskan catatan tambahan untuk surat RFI...",
              "Write additional notes for the RFI letter..."
            )}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm resize-none placeholder:text-slate-400"
          />
        </DashboardSurface>

        {/* === FOOTER PENANDATANGAN === */}
        <DashboardSurface className="p-4 sm:p-5 md:p-6">
          <SectionTitle title={tr("Footer / Penandatangan", "Footer / Signatories")} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label={tr("Perusahaan Pembuat", "Author Company")}>
              <input
                value={form.nama_perusahaan_kiri}
                onChange={(e) => updateField("nama_perusahaan_kiri", e.target.value)}
                className="input"
              />
            </Field>
            <Field label={tr("Perusahaan Penengah", "Intermediate Company")}>
              <input
                value={form.nama_perusahaan_tengah}
                onChange={(e) => updateField("nama_perusahaan_tengah", e.target.value)}
                className="input"
              />
            </Field>
            <Field label={tr("Pemberi Tugas", "Project Owner")}>
              <input
                value={form.pemberi_tugas}
                onChange={(e) => updateField("pemberi_tugas", e.target.value)}
                placeholder={tr("Nama / instansi pemberi tugas", "Owner name / institution")}
                className="input"
              />
            </Field>
          </div>
        </DashboardSurface>

        {/* === DOKUMENTASI (Sheet 2) === */}
        <DashboardSurface className="p-4 sm:p-5 md:p-6">
          <SectionTitle
            title={tr("Lampiran Dokumentasi Foto", "Photo Documentation Attachment")}
            hint={tr(
              "Foto dimasukkan ke sheet kedua (Dokumentasi).",
              "Photos will be placed on the second sheet (Documentation)."
            )}
          />
          <div className="space-y-3">
            {dokumentasi.map((d, idx) => (
              <DokumentasiRow
                key={idx}
                index={idx + 1}
                data={d}
                onChange={(patch) => updateDokumentasi(idx, patch)}
                onRemove={dokumentasi.length > 1 ? () => removeDokumentasi(idx) : null}
                tr={tr}
              />
            ))}
          </div>
          {dokumentasi.length < MAX_DOKUMENTASI && (
            <button
              type="button"
              onClick={addDokumentasi}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
            >
              <Plus size={14} /> {tr("Tambah baris dokumentasi", "Add documentation row")}
            </button>
          )}
        </DashboardSurface>

        {/* === ERROR BANNER === */}
        {errorMsg && (
          <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200/70 p-3 text-rose-700 text-sm flex items-start gap-2">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* === SUBMIT BAR === */}
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pt-4 pb-2 -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/kontraktor`)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
            >
              {tr("Batal", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 transition shadow-sm shadow-slate-900/10"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {tr("Memproses...", "Processing...")}
                </>
              ) : (
                <>
                  <Download size={14} />
                  {tr("Generate & Download RFI", "Generate & Download RFI")}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Local styles untuk class .input */}
      <style>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240 / 0.8);
          background: white;
          outline: none;
          font-size: 0.875rem;
          transition: all 150ms;
        }
        .input::placeholder { color: rgb(148 163 184); }
        .input:focus {
          border-color: rgb(148 163 184);
          box-shadow: 0 0 0 2px rgb(203 213 225 / 0.5);
        }
      `}</style>
    </div>
  );
}

/* ============================================================
 * SUB COMPONENTS
 * ============================================================ */
const SectionTitle = ({ title, hint }) => (
  <div className="mb-4">
    <h2 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h2>
    {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
      {label}
    </label>
    {children}
  </div>
);

const RepeatRow = ({ index, value, onChange, onRemove, placeholder, multiline = false }) => (
  <div className="flex items-start gap-2">
    <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 ring-1 ring-slate-200/70 text-slate-600 font-semibold text-sm flex items-center justify-center">
      {index}.
    </div>
    {multiline ? (
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200/80 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm resize-none placeholder:text-slate-400"
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 rounded-lg border border-slate-200/80 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm placeholder:text-slate-400"
      />
    )}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 w-9 h-9 rounded-lg text-rose-600 hover:bg-rose-50 transition flex items-center justify-center"
        title="Hapus"
      >
        <Trash2 size={15} />
      </button>
    )}
  </div>
);

const DokumentasiRow = ({ index, data, onChange, onRemove, tr }) => {
  const inputId = `rfi-foto-${index}`;
  const previewUrl = data.foto ? URL.createObjectURL(data.foto) : null;

  // Cleanup object URL ketika file berubah / unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.foto]);

  return (
    <div className="rounded-xl bg-slate-50/70 ring-1 ring-slate-200/70 p-3">
      <div className="flex items-start gap-2 mb-2">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-white ring-1 ring-slate-200/70 text-slate-600 font-semibold text-sm flex items-center justify-center">
          {index}.
        </div>
        <input
          value={data.nama_ruangan}
          onChange={(e) => onChange({ nama_ruangan: e.target.value })}
          placeholder={tr("Nama ruangan / lokasi", "Room name / location")}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200/80 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50 outline-none text-sm placeholder:text-slate-400"
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 w-9 h-9 rounded-lg text-rose-600 hover:bg-rose-50 transition flex items-center justify-center"
            title="Hapus"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="pl-11">
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={(e) => onChange({ foto: e.target.files?.[0] || null })}
          className="hidden"
        />
        {previewUrl ? (
          <div className="flex items-center gap-3 p-2 bg-white rounded-lg ring-1 ring-slate-200/70">
            <img src={previewUrl} alt="preview" className="w-16 h-16 object-cover rounded-md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">{data.foto.name}</p>
              <p className="text-xs text-slate-500">
                {(data.foto.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ foto: null })}
              className="text-rose-600 hover:text-rose-700 p-1.5 rounded hover:bg-rose-50 transition"
              title="Hapus foto"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white ring-1 ring-slate-200/70 hover:bg-slate-50 text-xs font-medium text-slate-600 transition"
          >
            <ImageIcon size={13} />
            {tr("Pilih foto (JPG/PNG, max 5MB)", "Choose photo (JPG/PNG, max 5MB)")}
          </label>
        )}
      </div>
    </div>
  );
};
