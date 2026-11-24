import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Check,
  Save,
  Trash2,
  Settings2,
  Building2,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Layers,
} from "lucide-react";
import api from "../../api/axiosConfig";
import {
  ALL_DIVISION_MODULES,
  DIVISI_ICON_OPTIONS,
  DIVISI_IMAGE_PRESETS,
  setCachedDivisis,
} from "../../utils/divisiConfig.jsx";
import { useI18n } from "../../i18n/index.jsx";

export default function DivisiModuleModal({
  isOpen,
  onClose,
  mode = "edit", // "create" | "edit"
  initialDivisi = null,
  divisis = [],
  onSuccess,
}) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);

  const [activeMode, setActiveMode] = useState(mode);
  const [selectedSlug, setSelectedSlug] = useState(initialDivisi?.slug || divisis[0]?.slug || "it");

  const [name, setName] = useState("");
  const [subtitleId, setSubtitleId] = useState("");
  const [subtitleEn, setSubtitleEn] = useState("");
  const [iconKey, setIconKey] = useState("building");
  const [cardImage, setCardImage] = useState("/images/IT Card.png");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [checkedModules, setCheckedModules] = useState([
    "inventory",
    "progres_pekerjaan",
    "archive_pekerjaan",
  ]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setActiveMode(mode);
    setErrorMsg("");

    if (mode === "create") {
      setName("");
      setSubtitleId("");
      setSubtitleEn("");
      setIconKey("building");
      setCardImage("/images/IT Card.png");
      setImageFile(null);
      setImagePreview(null);
      setCheckedModules(["inventory", "progres_pekerjaan", "archive_pekerjaan"]);
    } else {
      const target =
        initialDivisi ||
        divisis.find((d) => d.slug === selectedSlug) ||
        divisis[0];
      if (target) {
        setSelectedSlug(target.slug);
        populateFromDivisi(target);
      }
    }
  }, [isOpen, mode, initialDivisi]);

  const populateFromDivisi = (div) => {
    setName(div.name || "");
    setSubtitleId(div.subtitle_id || "");
    setSubtitleEn(div.subtitle_en || "");
    setIconKey(div.icon_key || "building");
    setCardImage(div.card_image || "/images/IT Card.png");
    setImageFile(null);
    setImagePreview(null);
    setCheckedModules(
      Array.isArray(div.modules)
        ? div.modules
        : ["inventory", "progres_pekerjaan", "archive_pekerjaan"]
    );
    setErrorMsg("");
  };

  const handleSelectDivisiTab = (div) => {
    setActiveMode("edit");
    setSelectedSlug(div.slug);
    populateFromDivisi(div);
  };

  const handleSwitchToCreate = () => {
    setActiveMode("create");
    setName("");
    setSubtitleId("");
    setSubtitleEn("");
    setIconKey("building");
    setCardImage("/images/IT Card.png");
    setImageFile(null);
    setImagePreview(null);
    setCheckedModules(["inventory", "progres_pekerjaan", "archive_pekerjaan"]);
    setErrorMsg("");
  };

  const toggleModule = (modKey) => {
    setCheckedModules((prev) =>
      prev.includes(modKey) ? prev.filter((k) => k !== modKey) : [...prev, modKey]
    );
  };

  const selectAllModules = () => {
    setCheckedModules(ALL_DIVISION_MODULES.map((m) => m.key));
  };

  const selectBasicModules = () => {
    setCheckedModules(["inventory", "progres_pekerjaan", "archive_pekerjaan"]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const currentEditingDivisi = divisis.find((d) => d.slug === selectedSlug);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (activeMode === "create" && !name.trim()) {
      setErrorMsg(tr("Nama divisi wajib diisi!", "Division name is required!"));
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      if (activeMode === "create" || !currentEditingDivisi?.is_default) {
        formData.append("name", name.trim());
      }
      formData.append(
        "subtitle_id",
        subtitleId.trim() || `Kelola operasional dan progres pekerjaan Divisi ${name.trim()}`
      );
      formData.append(
        "subtitle_en",
        subtitleEn.trim() || `Manage operations and work progress for ${name.trim()} Division`
      );
      formData.append("icon_key", iconKey);
      formData.append("card_image", cardImage);
      if (imageFile) {
        formData.append("image_file", imageFile);
      }
      formData.append("modules", JSON.stringify(checkedModules));

      if (activeMode === "create") {
        await api.post("/divisis", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const targetId = currentEditingDivisi?.id || selectedSlug;
        await api.post(`/divisis/${targetId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      const fresh = await api.get("/divisis");
      const freshList = fresh.data?.data ?? fresh.data;
      if (Array.isArray(freshList)) {
        setCachedDivisis(freshList);
      }

      onSuccess?.(freshList);
      onClose?.();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(", ")
          : null) ||
        tr("Gagal menyimpan konfigurasi divisi", "Failed to save division configuration");
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDivisi = async () => {
    if (!currentEditingDivisi || currentEditingDivisi.is_default) return;
    if (
      !window.confirm(
        tr(
          `Yakin ingin menghapus Divisi ${currentEditingDivisi.name}?`,
          `Are you sure you want to delete ${currentEditingDivisi.name} Division?`
        )
      )
    ) {
      return;
    }

    setDeleting(true);
    setErrorMsg("");
    try {
      await api.delete(`/divisis/${currentEditingDivisi.id}`);
      const fresh = await api.get("/divisis");
      const freshList = fresh.data?.data ?? fresh.data;
      if (Array.isArray(freshList)) {
        setCachedDivisis(freshList);
      }
      onSuccess?.(freshList);
      onClose?.();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          tr("Gagal menghapus divisi", "Failed to delete division")
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={() => !saving && !deleting && onClose?.()}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Settings2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {activeMode === "create"
                  ? tr("Tambah Divisi Baru & Atur Modul", "Add New Division & Configure Modules")
                  : tr(
                      `Atur Modul & Konfigurasi Divisi ${currentEditingDivisi?.name || ""}`,
                      `Configure Modules & ${currentEditingDivisi?.name || ""} Division`
                    )}
              </h3>
              <p className="text-xs text-slate-500">
                {tr(
                  "Ceklis modul yang ingin ditampilkan pada halaman divisi atau tambahkan divisi baru",
                  "Check modules to display on the division page or add a new division"
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Division Selector Bar (Switch between existing divisions or + Tambah Divisi Baru) */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-1.5">
            {divisis.map((div) => {
              const isSelected = activeMode === "edit" && selectedSlug === div.slug;
              return (
                <button
                  key={div.slug}
                  type="button"
                  onClick={() => handleSelectDivisiTab(div)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{div.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {Array.isArray(div.modules) ? div.modules.length : 0}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleSwitchToCreate}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeMode === "create"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              <Plus size={14} />
              <span>{tr("Tambah Divisi Baru", "Add New Division")}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-6">
          {errorMsg && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Informasi Dasar Divisi */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                {tr("Nama Divisi", "Division Name")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={activeMode === "edit" && Boolean(currentEditingDivisi?.is_default)}
                  placeholder={tr("Contoh: Marketing, HRD, Finance...", "e.g. Marketing, HRD, Finance...")}
                  className={`w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm outline-none transition ${
                    activeMode === "edit" && currentEditingDivisi?.is_default
                      ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                      : "bg-white text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                  }`}
                  required
                />
              </div>
              {activeMode === "edit" && currentEditingDivisi?.is_default && (
                <p className="mt-1 text-[11px] text-slate-400">
                  {tr("Nama divisi bawaan dikunci, namun modul di bawah bebas diatur.", "Default division name is locked, but modules below can be freely edited.")}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                {tr("Deskripsi / Subjudul Halaman Divisi", "Division Page Subtitle")}
              </label>
              <input
                type="text"
                value={subtitleId}
                onChange={(e) => setSubtitleId(e.target.value)}
                placeholder={tr("Contoh: Kelola aset dan progres pekerjaan...", "e.g. Manage division assets and work progress...")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>
          </div>

          {/* Pilihan Icon Sidebar & Cover Card */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                {tr("Icon Menu Sidebar", "Sidebar Menu Icon")}
              </label>
              <div className="grid grid-cols-7 gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-2.5">
                {DIVISI_ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setIconKey(opt.key)}
                    title={opt.label}
                    className={`flex h-9 w-full items-center justify-center rounded-xl border transition cursor-pointer ${
                      iconKey === opt.key
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {opt.render(16)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                {tr("Gambar Cover Card Divisi", "Division Card Cover Image")}
              </label>
              <div className="space-y-2">
                <select
                  value={cardImage}
                  onChange={(e) => {
                    setCardImage(e.target.value);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400"
                >
                  {DIVISI_IMAGE_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                  {!DIVISI_IMAGE_PRESETS.some((p) => p.value === cardImage) && (
                    <option value={cardImage}>{tr("Gambar Kustom Saat Ini", "Current Custom Image")}</option>
                  )}
                </select>

                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                    <ImageIcon size={14} className="text-indigo-600" />
                    <span>{tr("Upload Cover Baru", "Upload New Cover")}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {(imagePreview || cardImage) && (
                    <img
                      src={imagePreview || cardImage}
                      alt="Preview"
                      className="h-8 w-14 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================= CHECKLIST MODUL DIVISI ================= */}
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800">
                  {tr("Checklist Modul Divisi", "Division Modules Checklist")}
                </h4>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  {checkedModules.length} / {ALL_DIVISION_MODULES.length} {tr("Aktif", "Active")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllModules}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                >
                  {tr("Ceklis Semua", "Check All")}
                </button>
                <button
                  type="button"
                  onClick={selectBasicModules}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                >
                  {tr("Modul Standar (3)", "Basic Modules (3)")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {ALL_DIVISION_MODULES.map((mod) => {
                const isChecked = checkedModules.includes(mod.key);
                return (
                  <label
                    key={mod.key}
                    onClick={() => toggleModule(mod.key)}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all select-none ${
                      isChecked
                        ? "border-indigo-300 bg-indigo-50/50 shadow-2xs ring-1 ring-indigo-500/15"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModule(mod.key);
                      }}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        isChecked
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      <Check size={13} strokeWidth={3} />
                    </button>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                      {mod.icon(18)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {language === "en" ? mod.titleEn : mod.titleId}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                        {language === "en" ? mod.shortDescEn : mod.shortDescId}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              {activeMode === "edit" && currentEditingDivisi && !currentEditingDivisi.is_default && (
                <button
                  type="button"
                  onClick={handleDeleteDivisi}
                  disabled={deleting || saving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>{deleting ? tr("Menghapus...", "Deleting...") : tr("Hapus Divisi", "Delete Division")}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={saving || deleting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                {tr("Batal", "Cancel")}
              </button>
              <button
                type="submit"
                disabled={saving || deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                <Save size={15} />
                <span>
                  {saving
                    ? tr("Menyimpan...", "Saving...")
                    : activeMode === "create"
                      ? tr("Simpan Divisi Baru", "Save New Division")
                      : tr("Simpan Perubahan Modul", "Save Module Changes")}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
