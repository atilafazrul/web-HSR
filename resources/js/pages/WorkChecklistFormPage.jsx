import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  FileSpreadsheet,
  Save,
  FolderOpen,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../api/axiosConfig";
import tokenManager from "../utils/tokenManager";
import { useI18n } from "../i18n/index.jsx";
import { DashboardSurface } from "../components/dashboard/DashboardPrimitives.jsx";

const CHECK_TYPES = {
  planning: {
    titleId: "Form Work Checklist — Planning",
    titleEn: "Work Checklist Form — Planning",
  },
  realisasi: {
    titleId: "Form Work Checklist — Realisasi",
    titleEn: "Work Checklist Form — Realisasi",
  },
};

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const inputSm =
  "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const surfacePad = "p-5 sm:p-6";

const checkCls =
  "h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500";

function buildDefaultItemState(item) {
  return {
    row: item.row,
    label: item.label,
    is_section: item.is_section,
    col_c: item.col_c || "",
    col_d: item.col_d || "",
    sesuai: false,
    tidak_sesuai: false,
  };
}

function buildWeekSlot(group) {
  return {
    check_row: group.check_row,
    col_d: group.col_d || "",
    activity_rows: (group.activities || []).map((a) => a.row),
  };
}

function newPekerjaanLine() {
  return { id: Date.now() + Math.random(), text: "" };
}

function newDailyEntry() {
  return {
    id: Date.now(),
    check_row: "",
    minggu: "",
    hari: "",
    tanggal: "",
    pekerjaan: [newPekerjaanLine()],
    sesuai: false,
    tidak_sesuai: false,
  };
}

export default function WorkChecklistFormPage() {
  const { type: typeParam } = useParams();
  const type = typeParam === "realisasi" ? "realisasi" : "planning";
  const meta = CHECK_TYPES[type];

  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = tokenManager.getUser();

  const role = user?.role;
  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : role === "user"
        ? "/user"
        : "/admin";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [layoutMode, setLayoutMode] = useState("rows");
  const [itemStates, setItemStates] = useState([]);
  const [weekSlots, setWeekSlots] = useState([]);
  const [dailyEntries, setDailyEntries] = useState([]);
  const [customItems, setCustomItems] = useState([]);
  const [draftId, setDraftId] = useState(() => searchParams.get("draft") || null);
  const [draftTitle, setDraftTitle] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const structureItemsRef = useRef([]);

  const [header, setHeader] = useState({
    minggu_ke: "",
    site: "",
    pemberi_tugas: "",
    pengawas: "",
    sub_kontraktor: "",
    catatan: "",
    dibuat_oleh: user?.name || "",
    disetujui_oleh: "",
  });

  useEffect(() => {
    document.title = "WEB HSR - " + tr(meta.titleId, meta.titleEn);
  }, [language, type]);

  const applyDraftPayload = (payload) => {
    if (!payload) return;
    if (payload.header) {
      setHeader((p) => ({ ...p, ...payload.header }));
    }
    if (payload.layoutMode === "weekly") {
      setDailyEntries(
        (payload.dailyEntries || []).map((e) => ({
          ...e,
          id: e.id || Date.now() + Math.random(),
          pekerjaan: (e.pekerjaan || []).map((line) => ({
            ...line,
            id: line.id || Date.now() + Math.random(),
          })),
        }))
      );
    } else if (payload.itemStates?.length) {
      setItemStates(payload.itemStates);
    }
    setCustomItems(
      (payload.customItems || []).map((c) => ({
        ...c,
        id: c.id || Date.now() + Math.random(),
      }))
    );
  };

  const loadDraftById = async (id) => {
    const res = await api.get(`/work-checklist/drafts/${id}`);
    const draft = res.data?.draft;
    if (!draft) return;
    setDraftId(String(draft.id));
    setDraftTitle(draft.title || "");
    applyDraftPayload(draft.payload);
    setSearchParams({ draft: String(draft.id) });
  };

  const fetchDrafts = async () => {
    try {
      const res = await api.get("/work-checklist/drafts", { params: { type } });
      setDrafts(res.data?.drafts || []);
    } catch {
      setDrafts([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await api.get("/work-checklist/structure", {
          params: { type },
        });
        if (cancelled) return;
        const mode = res.data?.layout === "weekly" ? "weekly" : "rows";
        setLayoutMode(mode);
        if (mode === "weekly") {
          const slots = (res.data?.groups || [])
            .filter((g) => g.check_row)
            .map(buildWeekSlot);
          setWeekSlots(slots);
          if (!searchParams.get("draft")) {
            setDailyEntries([]);
            setItemStates([]);
          }
        } else {
          setWeekSlots([]);
          setDailyEntries([]);
          const defaultItems = (res.data?.items || []).map(buildDefaultItemState);
          structureItemsRef.current = defaultItems;
          if (!searchParams.get("draft")) {
            setItemStates(defaultItems);
          }
        }

        await fetchDrafts();

        const draftParam = searchParams.get("draft");
        if (draftParam) {
          await loadDraftById(draftParam);
        }
      } catch {
        if (!cancelled) {
          setErrorMsg(
            tr("Gagal memuat struktur checklist", "Failed to load checklist structure")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  const workItems = useMemo(
    () => itemStates.filter((i) => !i.is_section),
    [itemStates]
  );

  const usedCheckRows = useMemo(
    () => new Set(dailyEntries.map((e) => String(e.check_row)).filter(Boolean)),
    [dailyEntries]
  );

  const updateHeader = (key, value) =>
    setHeader((p) => ({ ...p, [key]: value }));

  const updateItem = (row, patch) => {
    setItemStates((list) =>
      list.map((it) => (it.row === row ? { ...it, ...patch } : it))
    );
  };

  const setCheck = (row, field) => {
    setItemStates((list) =>
      list.map((it) => {
        if (it.row !== row) return it;
        if (field === "sesuai") {
          return { ...it, sesuai: !it.sesuai, tidak_sesuai: false };
        }
        return { ...it, tidak_sesuai: !it.tidak_sesuai, sesuai: false };
      })
    );
  };

  const addDailyEntry = () => {
    setDailyEntries((p) => [...p, newDailyEntry()]);
  };

  const updateDailyEntry = (id, patch) => {
    setDailyEntries((p) =>
      p.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  const removeDailyEntry = (id) => {
    setDailyEntries((p) => p.filter((e) => e.id !== id));
  };

  const setDailyCheck = (id, field) => {
    setDailyEntries((p) =>
      p.map((e) => {
        if (e.id !== id) return e;
        if (field === "sesuai") {
          return { ...e, sesuai: !e.sesuai, tidak_sesuai: false };
        }
        return { ...e, tidak_sesuai: !e.tidak_sesuai, sesuai: false };
      })
    );
  };

  const getEntrySlot = (entry) =>
    weekSlots.find((s) => String(s.check_row) === String(entry.check_row));

  const maxPekerjaanForEntry = (entry) => {
    const rows = getEntrySlot(entry)?.activity_rows;
    return rows?.length ? rows.length : 8;
  };

  const onDailySlotChange = (id, checkRow) => {
    const slot = weekSlots.find((s) => String(s.check_row) === String(checkRow));
    setDailyEntries((p) =>
      p.map((e) => {
        if (e.id !== id) return e;
        return {
          ...e,
          check_row: checkRow,
          hari: slot?.col_d || e.hari,
        };
      })
    );
  };

  const addPekerjaanLine = (entryId) => {
    setDailyEntries((p) =>
      p.map((e) => {
        if (e.id !== entryId) return e;
        const lines = e.pekerjaan || [];
        if (lines.length >= maxPekerjaanForEntry(e)) return e;
        return { ...e, pekerjaan: [...lines, newPekerjaanLine()] };
      })
    );
  };

  const updatePekerjaanLine = (entryId, lineId, text) => {
    setDailyEntries((p) =>
      p.map((e) => {
        if (e.id !== entryId) return e;
        return {
          ...e,
          pekerjaan: e.pekerjaan.map((line) =>
            line.id === lineId ? { ...line, text } : line
          ),
        };
      })
    );
  };

  const removePekerjaanLine = (entryId, lineId) => {
    setDailyEntries((p) =>
      p.map((e) => {
        if (e.id !== entryId) return e;
        const next = e.pekerjaan.filter((line) => line.id !== lineId);
        return {
          ...e,
          pekerjaan: next.length ? next : [newPekerjaanLine()],
        };
      })
    );
  };

  const addCustomItem = () => {
    setCustomItems((p) => [
      ...p,
      {
        id: Date.now(),
        nama_kegiatan: "",
        tanggal: "",
        sesuai: false,
        tidak_sesuai: false,
        paraf: "",
      },
    ]);
  };

  const updateCustom = (id, patch) => {
    setCustomItems((p) =>
      p.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
  };

  const removeCustom = (id) => {
    setCustomItems((p) => p.filter((x) => x.id !== id));
  };

  const buildPayload = () => {
    const items =
      layoutMode === "weekly"
        ? dailyEntries.filter((e) => e.check_row).flatMap((e) => {
            const slot = getEntrySlot(e);
            const activityRows = slot?.activity_rows?.length
              ? slot.activity_rows
              : [Number(e.check_row)];

            const header = {
              row: Number(e.check_row),
              col_c: e.minggu?.trim() || null,
              col_d: e.hari?.trim() || null,
              tanggal: e.tanggal || null,
              sesuai: !!e.sesuai,
              tidak_sesuai: !!e.tidak_sesuai,
            };

            const workLines = (e.pekerjaan || [])
              .map((line, i) => ({
                row: activityRows[i] ?? activityRows[activityRows.length - 1],
                nama_kegiatan: line.text?.trim() || "",
              }))
              .filter((line) => line.nama_kegiatan);

            return [header, ...workLines];
          })
        : itemStates
            .filter((it) => !it.is_section)
            .map((it) => ({
              row: it.row,
              sesuai: !!it.sesuai,
              tidak_sesuai: !!it.tidak_sesuai,
            }));

    const custom_items = customItems
      .filter((c) => c.nama_kegiatan?.trim())
      .map((c) => ({
        nama_kegiatan: c.nama_kegiatan,
        tanggal: c.tanggal || null,
        sesuai: !!c.sesuai,
        tidak_sesuai: !!c.tidak_sesuai,
        paraf: c.paraf || "",
      }));

    return { type, ...header, items, custom_items };
  };

  const buildDraftPayload = () => ({
    header,
    layoutMode,
    dailyEntries,
    itemStates,
    customItems,
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    setErrorMsg(null);
    try {
      const body = {
        type,
        title: draftTitle.trim() || undefined,
        payload: buildDraftPayload(),
      };
      const res = draftId
        ? await api.put(`/work-checklist/drafts/${draftId}`, body)
        : await api.post("/work-checklist/drafts", body);

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
          tr("Gagal menyimpan checklist", "Failed to save checklist")
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
    setHeader({
      minggu_ke: "",
      site: "",
      pemberi_tugas: "",
      pengawas: "",
      sub_kontraktor: "",
      catatan: "",
      dibuat_oleh: user?.name || "",
      disetujui_oleh: "",
    });
    if (layoutMode === "weekly") {
      setDailyEntries([]);
    } else {
      setItemStates(
        structureItemsRef.current.map((it) => ({
          ...it,
          sesuai: false,
          tidak_sesuai: false,
        }))
      );
    }
    setCustomItems([]);
  };

  const handleOpenDraft = async (id) => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    setSaveMsg(null);
    try {
      await loadDraftById(id);
    } catch {
      setErrorMsg(tr("Gagal memuat draft", "Failed to load draft"));
    } finally {
      setLoading(false);
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

  const handleGenerate = async () => {
    setSubmitting("xlsx");
    setErrorMsg(null);
    try {
      const res = await api.post(
        "/work-checklist/generate",
        { ...buildPayload(), format: "xlsx" },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.download = `WorkChecklist_${type}_${stamp}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      let msg = tr("Gagal generate file", "Failed to generate file");
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) msg = json.message;
        } catch {
          /* ignore */
        }
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-32">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() =>
            navigate(role === "super_admin" ? basePath : `${basePath}/kontraktor`)
          }
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          {tr("Kembali", "Back")}
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {tr(meta.titleId, meta.titleEn)}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {tr(
              "Isi informasi umum dan checklist lalu unduh Excel",
              "Fill in the form and download Excel"
            )}
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

      {loading ? (
        <DashboardSurface className={`${surfacePad} flex items-center justify-center py-16 text-slate-500`}>
          <Loader2 className="animate-spin mr-2" size={20} />
          {tr("Memuat checklist...", "Loading checklist...")}
        </DashboardSurface>
      ) : (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <DashboardSurface className={surfacePad}>
            <SectionTitle>{tr("Simpan & muat draft", "Save & load draft")}</SectionTitle>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              {tr(
                "Simpan progress untuk diedit nanti, atau buka draft yang sudah ada.",
                "Save your progress to edit later, or open an existing draft."
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
                  placeholder={tr("Contoh: Site A — Minggu 3", "e.g. Site A — Week 3")}
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

          {/* Informasi Umum */}
          <DashboardSurface className={surfacePad}>
            <SectionTitle>{tr("Informasi Umum", "General Information")}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={tr("Minggu Ke", "Week No.")}
                value={header.minggu_ke}
                onChange={(v) => updateHeader("minggu_ke", v)}
              />
              <Field
                label={tr("Site", "Site")}
                value={header.site}
                onChange={(v) => updateHeader("site", v)}
              />
              <Field
                label={tr("Pemberi Tugas", "Task Giver")}
                hint={tr("(Footer: Disetujui Oleh)", "(Footer: Approved by)")}
                value={header.pemberi_tugas}
                onChange={(v) => updateHeader("pemberi_tugas", v)}
              />
              <Field
                label={tr("Pengawas", "Supervisor")}
                hint={tr("(Footer: Diawasi Oleh)", "(Footer: Supervised by)")}
                value={header.pengawas}
                onChange={(v) => updateHeader("pengawas", v)}
              />
              <Field
                label={tr("Sub Kontraktor", "Sub Contractor")}
                hint={tr("(Footer: Dibuat Oleh)", "(Footer: Prepared by)")}
                value={header.sub_kontraktor}
                onChange={(v) => updateHeader("sub_kontraktor", v)}
              />
              <Field
                label={tr("Nama Penandatangan (Dibuat)", "Signatory name (Prepared)")}
                value={header.dibuat_oleh}
                onChange={(v) => updateHeader("dibuat_oleh", v)}
              />
              <Field
                label={tr("Nama Penandatangan (Disetujui)", "Signatory name (Approved)")}
                value={header.disetujui_oleh}
                onChange={(v) => updateHeader("disetujui_oleh", v)}
              />
            </div>
            <label className="block mt-4">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                {tr("Catatan", "Notes")}
              </span>
              <textarea
                className={`${inputCls} mt-1.5 min-h-[88px] resize-y`}
                value={header.catatan}
                onChange={(e) => updateHeader("catatan", e.target.value)}
                placeholder={tr("Catatan tambahan...", "Additional notes...")}
              />
            </label>
          </DashboardSurface>

          {/* Daftar Pekerjaan / Checklist harian */}
          <DashboardSurface className={surfacePad}>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <SectionTitle>
                  {layoutMode === "weekly"
                    ? tr("Checklist Harian", "Daily Checklist")
                    : tr("Daftar Pekerjaan", "Work Items")}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({layoutMode === "weekly" ? dailyEntries.length : workItems.length})
                  </span>
                </SectionTitle>
                {layoutMode === "weekly" && (
                  <AddBtn onClick={addDailyEntry} label={tr("Tambah Hari", "Add Day")} />
                )}
              </div>
              {layoutMode === "weekly" ? (
                <div className="p-4 space-y-4">
                  {dailyEntries.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      {tr(
                        "Klik Tambah Hari untuk mengisi minggu, hari, tanggal, pekerjaan, dan checklist.",
                        "Click Add Day to enter week, day, date, work items, and checklist."
                      )}
                    </p>
                  ) : (
                    dailyEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {tr("Entri checklist", "Checklist entry")}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeDailyEntry(entry.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            title={tr("Hapus", "Remove")}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <label className="block">
                            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                              {tr("Urutan Hari", "Day slot")}
                            </span>
                            <select
                              className={`${inputCls} mt-1`}
                              value={entry.check_row}
                              onChange={(e) => onDailySlotChange(entry.id, e.target.value)}
                            >
                              <option value="">
                                {tr("— Pilih —", "— Select —")}
                              </option>
                              {weekSlots.map((slot) => {
                                const used =
                                  usedCheckRows.has(String(slot.check_row)) &&
                                  String(entry.check_row) !== String(slot.check_row);
                                return (
                                  <option
                                    key={slot.check_row}
                                    value={slot.check_row}
                                    disabled={used}
                                  >
                                    {tr("Hari ke", "Day")} {slot.col_d}
                                  </option>
                                );
                              })}
                            </select>
                          </label>
                          <Field
                            label={tr("Minggu", "Week")}
                            value={entry.minggu}
                            onChange={(v) => updateDailyEntry(entry.id, { minggu: v })}
                          />
                          <Field
                            label={tr("Hari", "Day")}
                            value={entry.hari}
                            onChange={(v) => updateDailyEntry(entry.id, { hari: v })}
                          />
                          <label className="block">
                            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                              {tr("Tanggal", "Date")}
                            </span>
                            <input
                              type="date"
                              className={`${inputCls} mt-1`}
                              value={entry.tanggal}
                              onChange={(e) =>
                                updateDailyEntry(entry.id, { tanggal: e.target.value })
                              }
                            />
                          </label>

                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                              {tr("Pekerjaan", "Work items")}
                            </span>
                            <button
                              type="button"
                              onClick={() => addPekerjaanLine(entry.id)}
                              disabled={
                                entry.pekerjaan?.length >= maxPekerjaanForEntry(entry)
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
                            >
                              <Plus size={14} />
                              {tr("Tambah", "Add")}
                            </button>
                          </div>
                          {(entry.pekerjaan || []).map((line, li) => (
                            <div key={line.id} className="flex gap-2 items-start">
                              <span className="mt-2.5 text-xs text-slate-400 w-5 shrink-0">
                                {li + 1}.
                              </span>
                              <textarea
                                className={`${inputCls} min-h-[72px] resize-y flex-1`}
                                placeholder={tr(
                                  "Nama kegiatan / pekerjaan...",
                                  "Activity / work description..."
                                )}
                                value={line.text}
                                onChange={(ev) =>
                                  updatePekerjaanLine(entry.id, line.id, ev.target.value)
                                }
                              />
                              {(entry.pekerjaan || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePekerjaanLine(entry.id, line.id)}
                                  className="mt-2 p-1 text-rose-500 hover:bg-rose-50 rounded shrink-0"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-1">
                          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={entry.sesuai}
                              onChange={() => setDailyCheck(entry.id, "sesuai")}
                              className={checkCls}
                            />
                            {tr("Sesuai", "OK")}
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={entry.tidak_sesuai}
                              onChange={() => setDailyCheck(entry.id, "tidak_sesuai")}
                              className={checkCls}
                            />
                            {tr("Tidak Sesuai", "NOK")}
                          </label>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="max-h-[min(65vh,560px)] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[640px]">
                    <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                      <tr className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        <th className="px-3 py-2.5 min-w-[200px]">
                          {tr("Nama Kegiatan", "Activity")}
                        </th>
                        <th className="px-3 py-2.5 w-20 text-center">{tr("Sesuai", "OK")}</th>
                        <th className="px-3 py-2.5 w-24 text-center">
                          {tr("Tidak", "NOK")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemStates.map((item) => {
                        if (item.is_section) {
                          return (
                            <tr key={`section-${item.row}`} className="bg-indigo-50/90">
                              <td
                                colSpan={3}
                                className="px-3 py-2 text-xs font-bold text-indigo-900 uppercase tracking-wide"
                              >
                                {item.label}
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={item.row} className="bg-white hover:bg-slate-50/60">
                            <td className="px-3 py-2 text-slate-800 align-top leading-snug">
                              {item.label}
                            </td>
                            <td className="px-3 py-2 text-center align-middle">
                              <input
                                type="checkbox"
                                checked={item.sesuai}
                                onChange={() => setCheck(item.row, "sesuai")}
                                className={checkCls}
                              />
                            </td>
                            <td className="px-3 py-2 text-center align-middle">
                              <input
                                type="checkbox"
                                checked={item.tidak_sesuai}
                                onChange={() => setCheck(item.row, "tidak_sesuai")}
                                className={checkCls}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DashboardSurface>
          {/* Pekerjaan tambahan (realisasi) */}
          {type === "realisasi" && (
            <DashboardSurface className={surfacePad}>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <SectionTitle>
                    {tr("Pekerjaan Tambahan", "Additional Work Items")}
                  </SectionTitle>
                  <AddBtn onClick={addCustomItem} label={tr("Tambah", "Add")} />
                </div>
                {customItems.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-500 text-center">
                    {tr(
                      "Klik Tambah untuk pekerjaan di luar template.",
                      "Click Add for items not in the template."
                    )}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse min-w-[520px]">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                          <th className="px-3 py-2.5 text-left">
                            {tr("Nama Kegiatan", "Activity")}
                          </th>
                          <th className="px-3 py-2.5 w-20 text-center">{tr("Sesuai", "OK")}</th>
                          <th className="px-3 py-2.5 w-24 text-center">{tr("Tidak", "NOK")}</th>
                          <th className="px-3 py-2.5 w-24">{tr("Paraf", "Initial")}</th>
                          <th className="px-3 py-2.5 w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customItems.map((c) => (
                          <tr key={c.id}>
                            <td className="px-2 py-1.5">
                              <input
                                className={inputSm}
                                placeholder={tr("Nama kegiatan", "Activity name")}
                                value={c.nama_kegiatan}
                                onChange={(e) =>
                                  updateCustom(c.id, { nama_kegiatan: e.target.value })
                                }
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={c.sesuai}
                                onChange={() =>
                                  updateCustom(c.id, {
                                    sesuai: !c.sesuai,
                                    tidak_sesuai: false,
                                  })
                                }
                                className={checkCls}
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={c.tidak_sesuai}
                                onChange={() =>
                                  updateCustom(c.id, {
                                    tidak_sesuai: !c.tidak_sesuai,
                                    sesuai: false,
                                  })
                                }
                                className={checkCls}
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                className={inputSm}
                                value={c.paraf}
                                onChange={(e) =>
                                  updateCustom(c.id, { paraf: e.target.value })
                                }
                              />
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeCustom(c.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </DashboardSurface>
          )}
        </form>
      )}

      {!loading && (
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
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 shadow-sm"
            >
              {submitting === "xlsx" ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <FileSpreadsheet size={18} />
              )}
              Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-base font-semibold text-slate-800">{children}</h3>;
}

function Field({ label, hint, value, onChange, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
        {label}
        {hint && (
          <span className="ml-1 font-normal normal-case text-slate-400">{hint}</span>
        )}
      </span>
      <input
        className={`${inputCls} mt-1.5`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
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
