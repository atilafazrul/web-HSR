import React from "react";
import { Plus, Download, Trash2, Calendar, Receipt } from "lucide-react";
import { useI18n } from "../../../../i18n";
import { RichTextEditor } from "./RichTextEditor";
import { ScheduleGenerateSection } from "./ScheduleGenerateSection";

export const SPHForm = ({
  formData,
  nextNomorSurat,
  fetchingNomor,
  onInputChange,
  onRichTextChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
  onReset,
  loading,
  formatRupiah,
  estimatedTotal,
  scheduledAt,
  onScheduledAtChange,
  onScheduleGenerate,
  scheduling,
  canSchedule,
}) => {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);

  return (
    <div className="bg-white rounded-3xl shadow-md p-4 sm:p-6 lg:p-8">
      <form id="sph-form" onSubmit={onSubmit}>
        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {tr("Preview Nomor Surat", "Letter Number Preview")}
          </p>
          <p className="text-lg font-semibold text-slate-800">
            {fetchingNomor ? tr("Memuat...", "Loading...") : nextNomorSurat}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Lampiran", "Attachment")}</label>
            <input type="text" name="lampiran" value={formData.lampiran} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Perihal", "Subject")}</label>
            <input type="text" name="perihal" value={formData.perihal} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Penerima (Yth.)", "Recipient")} <span className="text-red-500">*</span></label>
            <input type="text" name="penerima_nama" value={formData.penerima_nama} onChange={onInputChange} placeholder={tr("Contoh: PT. Hayati Semesta Raharja", "Example: PT. Hayati Semesta")} className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50" required />
          </div>
        </div>

        <div className="mb-8">
          <RichTextEditor
            label={tr("Paragraf Pembuka", "Opening Paragraph")}
            value={formData.paragraf_pembuka}
            onChange={(value) => onRichTextChange("paragraf_pembuka", value)}
            minHeight={160}
            editorKey="sph-pembuka"
          />
        </div>

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between border-b pb-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <Receipt size={20} className="text-blue-600" />
              {tr("Rincian Penawaran", "Quotation Details")}
            </h3>
            <button type="button" onClick={onAddItem} className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">
              <Plus size={16} />
              {tr("Tambah Item", "Add Item")}
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div key={index} className="mb-4 rounded-xl bg-gray-50 p-4">
              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Nama Item", "Item Name")} *</label>
                  <input type="text" value={item.nama_item} onChange={(e) => onItemChange(index, "nama_item", e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5" required />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">QTY *</label>
                  <input type="text" value={item.qty} onChange={(e) => onItemChange(index, "qty", e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5" required />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Harga", "Price")} *</label>
                  <input type="number" min="0" value={item.harga} onChange={(e) => onItemChange(index, "harga", e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5" required />
                </div>
                <div className="md:col-span-3 flex items-end">
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => onRemoveItem(index)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2.5 text-white hover:bg-red-700">
                      <Trash2 size={16} />
                      {tr("Hapus", "Delete")}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Deskripsi", "Description")}</label>
                <textarea
                  value={item.deskripsi}
                  onChange={(e) => onItemChange(index, "deskripsi", e.target.value)}
                  rows={4}
                  placeholder={tr("Satu baris per poin. Gunakan bullet jika perlu.", "One line per point. Use bullets if needed.")}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5"
                />
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
            <span className="text-sm text-gray-600">{tr("Estimasi Total", "Estimated Total")}: </span>
            <span className="text-lg font-bold text-blue-700">{formatRupiah(estimatedTotal)}</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Kota Tanda Tangan", "Signature City")}</label>
            <input type="text" name="kota_tanda_tangan" value={formData.kota_tanda_tangan} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Tanggal Tanda Tangan", "Signature Date")} *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="date" name="tanggal_tanda_tangan" value={formData.tanggal_tanda_tangan} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4" required />
            </div>
            {formData.tanggal_tanda_tangan_display && (
              <p className="mt-1 text-sm text-gray-600">{formData.tanggal_tanda_tangan_display}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Nama Penandatangan", "Signatory Name")}</label>
            <input type="text" name="nama_penandatangan" value={formData.nama_penandatangan} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Jabatan", "Position")}</label>
            <input type="text" name="jabatan_penandatangan" value={formData.jabatan_penandatangan} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50" />
          </div>
        </div>

        <div className="mb-8">
          <RichTextEditor
            label={tr("Syarat dan Ketentuan", "Terms and Conditions")}
            value={formData.syarat_ketentuan}
            onChange={(value) => onRichTextChange("syarat_ketentuan", value)}
            minHeight={180}
            editorKey="sph-syarat"
          />
        </div>

        <div className="mb-8">
          <RichTextEditor
            label={tr("Paragraf Penutup / Kontak", "Closing / Contact Paragraph")}
            value={formData.paragraf_penutup}
            onChange={(value) => onRichTextChange("paragraf_penutup", value)}
            minHeight={120}
            editorKey="sph-penutup"
          />
        </div>

        <ScheduleGenerateSection
          scheduledAt={scheduledAt}
          onScheduledAtChange={onScheduledAtChange}
          onSchedule={() => onScheduleGenerate?.(document.getElementById("sph-form"))}
          scheduling={scheduling}
          canSchedule={canSchedule}
          loading={loading}
        />

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button type="button" onClick={onReset} className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-600 hover:bg-gray-50">
            {tr("Reset", "Reset")}
          </button>
          <button type="submit" disabled={loading} className={`flex items-center justify-center gap-2 rounded-xl px-8 py-3 font-medium text-white ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
            {loading ? tr("Generating...", "Generating...") : <><Download size={20} />{tr("Generate PDF", "Generate PDF")}</>}
          </button>
        </div>
      </form>
    </div>
  );
};
