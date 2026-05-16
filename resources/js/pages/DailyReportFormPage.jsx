import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileText,
  Save,
  FolderOpen,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosConfig";
import tokenManager from "../utils/tokenManager";
import { useI18n } from "../i18n/index.jsx";
import { DashboardSurface } from "../components/dashboard/DashboardPrimitives.jsx";

const KINERJA_HSE_DEFAULT = [
  { no: 1, penjelasan: "Safety Talk" },
  { no: 2, penjelasan: "Alat Pelindung Diri (PPE)" },
  { no: 3, penjelasan: "Perlengkapan P3K" },
  { no: 4, penjelasan: "APAR" },
  { no: 5, penjelasan: "Kasus Fatality" },
  { no: 6, penjelasan: "Kasus Perawatan Medis" },
  { no: 7, penjelasan: "Kasus First Aid" },
  { no: 8, penjelasan: "Kasus Nearmiss" },
  { no: 9, penjelasan: "Kasus Kebakaran" },
  { no: 10, penjelasan: "Kasus Property Damage" },
  { no: 11, penjelasan: "Kasus Kerusakan Lingkungan" },
  { no: 12, penjelasan: "Masalah Lingkungan" },
  { no: 13, penjelasan: "Temuan Bahaya" },
  { no: 14, penjelasan: "Jam Kerja" },
  { no: 15, penjelasan: "Lainnya" },
];

function defaultInformasiRow() {
  return {
    id: Date.now(),
    lokasi: "",
    pekerja: "",
    jam_kerja: "",
    total_jam_kerja: "",
    total_keseluruhan: "",
    keterangan: "",
  };
}

function defaultKinerja() {
  return KINERJA_HSE_DEFAULT.map((item) => ({
    ...item,
    tidak: false,
    ya: false,
    keterangan: "",
  }));
}

function defaultForm(todayIso, userName) {
  return {
    document_no: "DR-01-HSE 026",
    rev: "-",
    page: "1-3",
    nama_pekerjaan: "",
    tanggal: todayIso,
    area_lokasi: "",
    kegiatan: "",
    jam_kerja_hari: "",
    jam_kerja_kumulatif: "",
    jam_kerja_range: "",
    total_keseluruhan_jam: "",
    catatan_rekomendasi: "",
    prepare_by: userName || "",
    prepare_jabatan: "",
    checked_by: "",
    approved_by: "",
  };
}

const KONDISI_OPTIONS = [
  { value: "", label: "-" },
  { value: "CR", label: "CR — Cerah" },
  { value: "GR", label: "GR — Gerimis" },
  { value: "MD", label: "MD — Mendung" },
  { value: "HL", label: "HL — Hujan Lebat" },
];

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const inputSm =
  "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const surfacePad = "p-5 sm:p-6";

async function parseApiError(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const json = JSON.parse(text);
      if (json.errors) {
        return Object.values(json.errors).flat().join(" ");
      }
      return json.message || fallback;
    } catch {
      return fallback;
    }
  }
  if (data.errors) {
    return Object.values(data.errors).flat().join(" ");
  }
  return data.message || fallback;
}

export default function DailyReportFormPage() {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = tokenManager.getUser();

  const basePath =
    user?.role === "super_admin"
      ? "/super_admin"
      : user?.role === "user"
        ? "/user"
        : "/admin";

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [submitting, setSubmitting] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [draftId, setDraftId] = useState(() => searchParams.get("draft") || null);
  const [draftTitle, setDraftTitle] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const [form, setForm] = useState(() => defaultForm(todayIso, user?.name));

  const [informasi, setInformasi] = useState([defaultInformasiRow()]);

  const [overtime, setOvertime] = useState({
    pekerja: "",
    jam_kerja: "",
    total_jam_kerja: "",
    total_keseluruhan: "",
    keterangan: "",
  });

  const [kinerja, setKinerja] = useState(defaultKinerja);

  const [peralatan, setPeralatan] = useState([
    { id: 1, jenis: "", jumlah: "", waktu: "", kondisi: "" },
  ]);

  useEffect(() => {
    document.title = "WEB HSR - HSE Daily Report";
  }, []);

  const applyDraftPayload = (payload) => {
    if (!payload) return;
    if (payload.form) {
      setForm((p) => ({ ...p, ...payload.form }));
    }
    if (payload.informasi?.length) {
      setInformasi(
        payload.informasi.map((row) => ({
          ...row,
          id: row.id || Date.now() + Math.random(),
        }))
      );
    }
    if (payload.overtime) {
      setOvertime((o) => ({ ...o, ...payload.overtime }));
    }
    if (payload.kinerja?.length) {
      setKinerja(
        KINERJA_HSE_DEFAULT.map((def) => {
          const saved = payload.kinerja.find((k) => k.no === def.no);
          return saved
            ? { ...def, ...saved }
            : { ...def, tidak: false, ya: false, keterangan: "" };
        })
      );
    }
    if (payload.peralatan?.length) {
      setPeralatan(
        payload.peralatan.map((p) => ({
          ...p,
          id: p.id || Date.now() + Math.random(),
        }))
      );
    }
  };

  const loadDraftById = async (id) => {
    const res = await api.get(`/daily-report/drafts/${id}`);
    const draft = res.data?.draft;
    if (!draft) return;
    setDraftId(String(draft.id));
    setDraftTitle(draft.title || "");
    applyDraftPayload(draft.payload);
    setSearchParams({ draft: String(draft.id) });
  };

  const fetchDrafts = async () => {
    try {
      const res = await api.get("/daily-report/drafts");
      setDrafts(res.data?.drafts || []);
    } catch {
      setDrafts([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchDrafts();
      const draftParam = searchParams.get("draft");
      if (draftParam && !cancelled) {
        try {
          await loadDraftById(draftParam);
        } catch {
          if (!cancelled) {
            setErrorMsg(tr("Gagal memuat draft", "Failed to load draft"));
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const updateInformasi = (id, patch) => {
    setInformasi((list) =>
      list.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const addInformasi = () => {
    setInformasi((p) => [
      ...p,
      {
        id: Date.now(),
        lokasi: "",
        pekerja: "",
        jam_kerja: "",
        total_jam_kerja: "",
        total_keseluruhan: "",
        keterangan: "",
      },
    ]);
  };

  const updateOvertime = (patch) => {
    setOvertime((o) => ({ ...o, ...patch }));
  };

  const setKinerjaCheck = (no, field) => {
    setKinerja((list) =>
      list.map((k) => {
        if (k.no !== no || k.no >= 14) return k;
        if (field === "ya") return { ...k, ya: !k.ya, tidak: false };
        return { ...k, tidak: !k.tidak, ya: false };
      })
    );
  };

  const buildDraftPayload = () => ({
    form,
    informasi,
    overtime,
    kinerja,
    peralatan,
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    setErrorMsg(null);
    try {
      const body = {
        title: draftTitle.trim() || undefined,
        payload: buildDraftPayload(),
      };
      const res = draftId
        ? await api.put(`/daily-report/drafts/${draftId}`, body)
        : await api.post("/daily-report/drafts", body);

      const saved = res.data?.draft;
      if (saved?.id) {
        setDraftId(String(saved.id));
        setDraftTitle(saved.title || draftTitle);
        setSearchParams({ draft: String(saved.id) });
      }
      setSaveMsg(res.data?.message || tr("Tersimpan", "Saved"));
      await fetchDrafts();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          tr("Gagal menyimpan laporan", "Failed to save report")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleNewForm = () => {
    setDraftId(null);
    setDraftTitle("");
    setSaveMsg(null);
    setErrorMsg(null);
    setSearchParams({});
    setForm(defaultForm(todayIso, user?.name));
    setInformasi([defaultInformasiRow()]);
    setOvertime({
      pekerja: "",
      jam_kerja: "",
      total_jam_kerja: "",
      total_keseluruhan: "",
      keterangan: "",
    });
    setKinerja(defaultKinerja());
    setPeralatan([{ id: Date.now(), jenis: "", jumlah: "", waktu: "", kondisi: "" }]);
  };

  const handleOpenDraft = async (id) => {
    if (!id) return;
    setErrorMsg(null);
    setSaveMsg(null);
    try {
      await loadDraftById(id);
    } catch {
      setErrorMsg(tr("Gagal memuat draft", "Failed to load draft"));
    }
  };

  const formatDraftLabel = (draft) => {
    const title = draft.title || tr("Tanpa judul", "Untitled");
    const stamp = draft.updated_at
      ? new Date(draft.updated_at).toLocaleString(language === "en" ? "en-GB" : "id-ID", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "";
    return stamp ? `${title} (${stamp})` : title;
  };

  const buildPayload = () => {
    const informasiPayload = informasi
      .filter((r) => r.lokasi?.trim() || r.pekerja || r.jam_kerja || r.total_jam_kerja)
      .map(({ lokasi, pekerja, jam_kerja, total_jam_kerja, total_keseluruhan, keterangan }) => ({
        lokasi: lokasi || "",
        pekerja: pekerja === "" ? 0 : parseInt(pekerja, 10) || 0,
        jam_kerja: jam_kerja === "" ? 0 : parseInt(jam_kerja, 10) || 0,
        total_jam_kerja: total_jam_kerja === "" ? 0 : parseInt(total_jam_kerja, 10) || 0,
        total_keseluruhan: total_keseluruhan === "" ? 0 : parseInt(total_keseluruhan, 10) || 0,
        keterangan: keterangan || "",
      }));

    const grandTotal =
      form.total_keseluruhan_jam === ""
        ? 0
        : parseInt(form.total_keseluruhan_jam, 10) || 0;

    return {
      document_no: form.document_no,
      rev: form.rev,
      page: form.page,
      nama_pekerjaan: form.nama_pekerjaan,
      tanggal: form.tanggal,
      area_lokasi: form.area_lokasi,
      kegiatan: form.kegiatan,
      jam_kerja_hari: String(form.jam_kerja_hari ?? ""),
      jam_kerja_kumulatif: String(form.jam_kerja_kumulatif ?? ""),
      jam_kerja_range: form.jam_kerja_range,
      total_keseluruhan_jam: grandTotal,
      catatan_rekomendasi: form.catatan_rekomendasi,
      prepare_by: form.prepare_by,
      prepare_jabatan: form.prepare_jabatan,
      checked_by: form.checked_by,
      approved_by: form.approved_by,
      informasi_kegiatan: informasiPayload,
      overtime: {
        pekerja: overtime.pekerja === "" ? 0 : parseInt(overtime.pekerja, 10) || 0,
        jam_kerja: overtime.jam_kerja === "" ? 0 : parseInt(overtime.jam_kerja, 10) || 0,
        total_jam_kerja:
          overtime.total_jam_kerja === "" ? 0 : parseInt(overtime.total_jam_kerja, 10) || 0,
        total_keseluruhan:
          overtime.total_keseluruhan === "" ? 0 : parseInt(overtime.total_keseluruhan, 10) || 0,
        keterangan: overtime.keterangan || "",
      },
      kinerja_hse: kinerja.map(({ no, tidak, ya, keterangan }) => ({
        no,
        tidak: Boolean(tidak),
        ya: Boolean(ya),
        keterangan: keterangan || "",
      })),
      peralatan: peralatan.map(({ jenis, jumlah, waktu, kondisi }) => ({
        jenis: jenis || "",
        jumlah: jumlah || "",
        waktu: waktu || "",
        kondisi: kondisi || "",
      })),
    };
  };

  const handleGenerate = async (format) => {
    setSubmitting(format);
    setErrorMsg(null);
    try {
      const res = await api.post(
        "/daily-report/generate",
        { format, ...buildPayload() },
        {
          responseType: "blob",
          headers: {
            Accept:
              format === "pdf"
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        }
      );

      const isPdf = format === "pdf";
      const blob = new Blob([res.data], {
        type: isPdf
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      if (blob.size < 50) {
        throw new Error(tr("File kosong — coba lagi", "Empty file — try again"));
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HSE_DailyReport_${form.tanggal.replace(/-/g, "")}.${isPdf ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = await parseApiError(
        err,
        tr("Gagal generate HSE Daily Report", "Failed to generate HSE Daily Report")
      );
      setErrorMsg(msg);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() =>
            navigate(user?.role === "super_admin" ? basePath : `${basePath}/kontraktor`)
          }
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          {tr("Kembali", "Back")}
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {tr("HSE Daily Report", "HSE Daily Report")}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {tr("Laporan Harian HSE — isi form lalu unduh PDF/Excel", "HSE daily report form")}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      {saveMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveMsg}
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
        <DashboardSurface className={surfacePad}>
          <SectionTitle>{tr("Simpan & muat draft", "Save & load draft")}</SectionTitle>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            {tr(
              "Simpan progress laporan untuk diedit nanti, atau buka draft yang sudah ada.",
              "Save report progress to edit later, or open an existing draft."
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {tr("Judul draft", "Draft title")}
              </label>
              <input
                type="text"
                className={inputCls}
                placeholder={tr("Contoh: Proyek A — 15/05/2026", "e.g. Project A — 15/05/2026")}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {tr("Buka draft tersimpan", "Open saved draft")}
              </label>
              <div className="relative">
                <FolderOpen
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <select
                  className={`${inputCls} pl-9`}
                  value={draftId || ""}
                  onChange={(e) => handleOpenDraft(e.target.value)}
                >
                  <option value="">
                    {drafts.length
                      ? tr("Pilih draft...", "Select a draft...")
                      : tr("Belum ada draft", "No drafts yet")}
                  </option>
                  {drafts.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {formatDraftLabel(d)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !!submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              {draftId ? tr("Perbarui", "Update") : tr("Simpan", "Save")}
            </button>
            <button
              type="button"
              onClick={handleNewForm}
              disabled={saving || !!submitting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {tr("Form baru", "New form")}
            </button>
          </div>
        </DashboardSurface>

        {/* Dokumen */}
        <DashboardSurface className={surfacePad}>
          <SectionTitle>{tr("Informasi Dokumen", "Document Info")}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Field label="Document No." value={form.document_no} onChange={(v) => updateField("document_no", v)} />
            <Field label="Rev." value={form.rev} onChange={(v) => updateField("rev", v)} />
            <Field label="Page" value={form.page} onChange={(v) => updateField("page", v)} />
          </div>
          <Field
            label={tr("Nama Pekerjaan", "Project name")}
            value={form.nama_pekerjaan}
            onChange={(v) => updateField("nama_pekerjaan", v)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label={tr("Tanggal", "Date")} type="date" value={form.tanggal} onChange={(v) => updateField("tanggal", v)} />
            <Field label={tr("Area / Lokasi", "Area")} value={form.area_lokasi} onChange={(v) => updateField("area_lokasi", v)} />
            <Field label={tr("Kegiatan", "Activity")} value={form.kegiatan} onChange={(v) => updateField("kegiatan", v)} />
            <Field label={tr("Jam Kerja Hari ini", "Work hours today")} value={form.jam_kerja_hari} onChange={(v) => updateField("jam_kerja_hari", v)} />
            <Field label={tr("Jam Kerja Kumulatif", "Cumulative hours")} value={form.jam_kerja_kumulatif} onChange={(v) => updateField("jam_kerja_kumulatif", v)} />
            <Field label={tr("Rentang Jam Kerja", "Work hour range")} value={form.jam_kerja_range} onChange={(v) => updateField("jam_kerja_range", v)} />
          </div>
        </DashboardSurface>

        {/* Informasi Kegiatan */}
        <DashboardSurface className={surfacePad}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <SectionTitle>{tr("Informasi Kegiatan", "Activity Info")}</SectionTitle>
              <AddBtn onClick={addInformasi} label={tr("Baris", "Row")} />
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  <th className="px-3 py-2.5 w-10">No</th>
                  <th className="px-3 py-2.5 min-w-[140px]">Lokasi</th>
                  <th className="px-3 py-2.5 w-20">Pekerja</th>
                  <th className="px-3 py-2.5 w-20">Jam</th>
                  <th className="px-3 py-2.5 w-24">Tot. Jam</th>
                  <th className="px-3 py-2.5 w-24">Tot. All</th>
                  <th className="px-3 py-2.5 min-w-[80px]">Ket.</th>
                  <th className="px-3 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {informasi.map((row, idx) => (
                  <tr key={row.id} className="bg-white hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-center text-slate-500">{idx + 1}</td>
                    <td className="px-2 py-1.5"><input className={inputSm} value={row.lokasi} onChange={(e) => updateInformasi(row.id, { lokasi: e.target.value })} /></td>
                    <td className="px-2 py-1.5"><input className={inputSm} type="number" min="0" value={row.pekerja} onChange={(e) => updateInformasi(row.id, { pekerja: e.target.value })} /></td>
                    <td className="px-2 py-1.5"><input className={inputSm} type="number" min="0" value={row.jam_kerja} onChange={(e) => updateInformasi(row.id, { jam_kerja: e.target.value })} /></td>
                    <td className="px-2 py-1.5"><input className={inputSm} type="number" min="0" value={row.total_jam_kerja} onChange={(e) => updateInformasi(row.id, { total_jam_kerja: e.target.value })} /></td>
                    <td className="px-2 py-1.5"><input className={inputSm} type="number" min="0" value={row.total_keseluruhan} onChange={(e) => updateInformasi(row.id, { total_keseluruhan: e.target.value })} /></td>
                    <td className="px-2 py-1.5"><input className={inputSm} value={row.keterangan} onChange={(e) => updateInformasi(row.id, { keterangan: e.target.value })} /></td>
                    <td className="px-2 py-1.5 text-center">
                      <button type="button" onClick={() => setInformasi((p) => p.length > 1 ? p.filter((x) => x.id !== row.id) : p)} className="p-1 text-rose-500 hover:bg-rose-50 rounded"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-amber-50/80">
                  <td />
                  <td className="px-3 py-2 font-semibold text-amber-900">OVERTIME</td>
                  <td className="px-2 py-1.5"><input className={inputSm} type="number" value={overtime.pekerja} onChange={(e) => updateOvertime({ pekerja: e.target.value })} /></td>
                  <td className="px-2 py-1.5"><input className={inputSm} type="number" value={overtime.jam_kerja} onChange={(e) => updateOvertime({ jam_kerja: e.target.value })} /></td>
                  <td className="px-2 py-1.5"><input className={inputSm} type="number" value={overtime.total_jam_kerja} onChange={(e) => updateOvertime({ total_jam_kerja: e.target.value })} /></td>
                  <td className="px-2 py-1.5"><input className={inputSm} type="number" value={overtime.total_keseluruhan} onChange={(e) => updateOvertime({ total_keseluruhan: e.target.value })} /></td>
                  <td className="px-2 py-1.5"><input className={inputSm} value={overtime.keterangan} onChange={(e) => updateOvertime({ keterangan: e.target.value })} /></td>
                  <td />
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={5} className="px-3 py-2.5 text-center text-slate-700">TOTAL</td>
                  <td className="px-2 py-1.5">
                    <input className={inputSm} type="number" value={form.total_keseluruhan_jam} onChange={(e) => updateField("total_keseluruhan_jam", e.target.value)} />
                  </td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </DashboardSurface>

        {/* Kinerja HSE */}
        <DashboardSurface className={surfacePad}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <SectionTitle>{tr("Kinerja HSE", "HSE Performance")}</SectionTitle>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                  <th className="px-3 py-2.5 w-10">No</th>
                  <th className="px-3 py-2.5 text-left">Penjelasan</th>
                  <th className="px-3 py-2.5 w-16 text-center">Tidak</th>
                  <th className="px-3 py-2.5 w-16 text-center">Ya</th>
                  <th className="px-3 py-2.5">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kinerja.map((k) => (
                  <tr key={k.no} className={k.no >= 14 ? "bg-slate-50" : "bg-white"}>
                    <td className="px-3 py-2 text-center text-slate-500">{k.no}</td>
                    <td className="px-3 py-2 text-slate-800">{k.penjelasan}</td>
                    <td className="px-3 py-2 text-center">
                      {k.no < 14 ? (
                        <input type="checkbox" checked={k.tidak} onChange={() => setKinerjaCheck(k.no, "tidak")} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {k.no < 14 ? (
                        <input type="checkbox" checked={k.ya} onChange={() => setKinerjaCheck(k.no, "ya")} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {k.no < 14 ? (
                        <input className={inputSm} value={k.keterangan} onChange={(e) => setKinerja((list) => list.map((x) => x.no === k.no ? { ...x, keterangan: e.target.value } : x))} placeholder="—" />
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          {k.no === 14 ? tr("Otomatis di PDF", "Auto in PDF") : form.jam_kerja_range}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </DashboardSurface>

        {/* Peralatan */}
        <DashboardSurface className={surfacePad}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <SectionTitle>{tr("Peralatan & Cuaca", "Equipment & Weather")}</SectionTitle>
                <p className="text-xs text-slate-500 mt-1">CR: Cerah · GR: Gerimis · MD: Mendung · HL: Hujan Lebat</p>
              </div>
              <AddBtn onClick={() => setPeralatan((p) => [...p, { id: Date.now(), jenis: "", jumlah: "", waktu: "", kondisi: "" }])} label={tr("Baris", "Row")} />
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                  <th className="px-3 py-2.5 w-10">No</th>
                  <th className="px-3 py-2.5 text-left">Jenis Peralatan</th>
                  <th className="px-3 py-2.5 w-16">Jumlah</th>
                  <th className="px-3 py-2.5 w-32">Waktu</th>
                  <th className="px-3 py-2.5 w-28">Kondisi</th>
                  <th className="px-3 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {peralatan.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 text-center text-slate-500">{idx + 1}</td>
                    <td className="px-2 py-1.5"><input className={inputSm} value={p.jenis} onChange={(e) => setPeralatan((list) => list.map((x) => x.id === p.id ? { ...x, jenis: e.target.value } : x))} placeholder="Jenis alat" /></td>
                    <td className="px-2 py-1.5"><input className={inputSm} value={p.jumlah} onChange={(e) => setPeralatan((list) => list.map((x) => x.id === p.id ? { ...x, jumlah: e.target.value } : x))} /></td>
                    <td className="px-2 py-1.5"><input className={inputSm} value={p.waktu} onChange={(e) => setPeralatan((list) => list.map((x) => x.id === p.id ? { ...x, waktu: e.target.value } : x))} placeholder="07:00-08:00" /></td>
                    <td className="px-2 py-1.5">
                      <select className={inputSm} value={p.kondisi} onChange={(e) => setPeralatan((list) => list.map((x) => x.id === p.id ? { ...x, kondisi: e.target.value } : x))}>
                        {KONDISI_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button type="button" onClick={() => setPeralatan((list) => list.length > 1 ? list.filter((x) => x.id !== p.id) : list)} className="p-1 text-rose-500 hover:bg-rose-50 rounded"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </DashboardSurface>

        {/* Catatan & TTD */}
        <DashboardSurface className={surfacePad}>
          <SectionTitle>{tr("Catatan dan Rekomendasi", "Notes & Recommendations")}</SectionTitle>
          <textarea
            className={`${inputCls} min-h-[100px] resize-y`}
            value={form.catatan_rekomendasi}
            onChange={(e) => updateField("catatan_rekomendasi", e.target.value)}
            placeholder={tr("Tulis catatan dan rekomendasi...", "Write notes and recommendations...")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
            <Field label="Prepare by" value={form.prepare_by} onChange={(v) => updateField("prepare_by", v)} />
            <Field label={tr("Jabatan", "Title")} value={form.prepare_jabatan} onChange={(v) => updateField("prepare_jabatan", v)} />
            <Field label="Checked by" value={form.checked_by} onChange={(v) => updateField("checked_by", v)} />
            <Field label="Approved by" value={form.approved_by} onChange={(v) => updateField("approved_by", v)} className="sm:col-span-2" />
          </div>
        </DashboardSurface>
      </form>

      {/* Sticky actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 lg:pl-72 pointer-events-none">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-3 justify-end pointer-events-auto">
          <button
            type="button"
            disabled={saving || !!submitting}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {draftId ? tr("Perbarui", "Update") : tr("Simpan", "Save")}
          </button>
          <button
            type="button"
            disabled={!!submitting}
            onClick={() => handleGenerate("xlsx")}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-5 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
          >
            {submitting === "xlsx" ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
            Excel
          </button>
          <button
            type="button"
            disabled={!!submitting}
            onClick={() => handleGenerate("pdf")}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 shadow-sm"
          >
            {submitting === "pdf" ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
            {tr("Generate PDF", "Generate PDF")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, className = "" }) {
  return <h3 className={`text-base font-semibold text-slate-800 ${className}`.trim()}>{children}</h3>;
}

function Field({ label, value, onChange, type = "text", className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</span>
      <input type={type} className={`${inputCls} mt-1.5`} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function AddBtn({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
    >
      <Plus size={16} />
      {label}
    </button>
  );
}
