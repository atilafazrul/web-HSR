import React from "react";
import { Plus, Download, Trash2, Calendar, Receipt, Edit, X, Save, RefreshCw } from "lucide-react";
import { useI18n } from "../../../../i18n";
import { RichTextEditor } from "./RichTextEditor";
import { ScheduleGenerateSection } from "./ScheduleGenerateSection";
import { RupiahInput } from "./RupiahInput";
import { parseRibuanId } from "../../../../utils/formatRupiahInput";

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
  isEditing = false,
  editNomorSurat = "",
  formatRupiah,
  estimatedSubtotal,
  estimatedDiskon,
  estimatedPpn,
  estimatedTotal,
  scheduleSectionProps,
  onScheduleGenerate,
  onApplyPembukaTemplate,
  onAddRekapCategory,
  onRemoveRekapCategory,
  onUpdateRekapCategory,
  onUpdateRekapCategoryMeta,
  onAddRekapItem,
  onRemoveRekapItem,
  onUpdateRekapItem,
  onSyncRekapToMainItems,
  rekapCategorySubtotals = [],
  rekapSubtotal = 0,
  rekapVat = 0,
  rekapGrandTotal = 0,
}) => {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const isKontraktor = (formData.divisi || "it").toLowerCase() === "kontraktor";
  const isRekapActive = isKontraktor && Boolean(formData.pakai_rekapitulasi);

  return (
    <div className="bg-white rounded-3xl shadow-md p-4 sm:p-6 lg:p-8">
      <form id="sph-form" onSubmit={onSubmit}>
        {isEditing && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Edit size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-orange-800">{tr("Mode Edit", "Edit Mode")}</p>
              <p className="text-sm text-orange-600">{tr("Nomor surat", "Letter number")}: {editNomorSurat}</p>
            </div>
          </div>
        )}
        {!isEditing && (
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/60 backdrop-blur-sm px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {tr("Preview Nomor Surat", "Letter Number Preview")}
          </p>
          <p className="text-lg font-semibold font-mono text-slate-800">
            {fetchingNomor ? tr("Memuat...", "Loading...") : nextNomorSurat}
          </p>
        </div>
        )}

        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Divisi", "Division")}</label>
            <select
              name="divisi"
              value={formData.divisi || "it"}
              onChange={onInputChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 capitalize font-medium text-gray-800 focus:bg-white"
            >
              <option value="it">IT & Sistem</option>
              <option value="service">Service & Alat Kesehatan</option>
              <option value="kontraktor">Kontraktor & Ruang Medis</option>
              <option value="sales">Sales</option>
              <option value="logistik">Logistik</option>
              <option value="purchasing">Purchasing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Lampiran", "Attachment")}</label>
            <input type="text" name="lampiran" value={formData.lampiran} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Perihal", "Subject")}</label>
            <input type="text" name="perihal" value={formData.perihal} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50" required />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Penerima (Yth.)", "Recipient")} <span className="text-red-500">*</span></label>
            <input type="text" name="penerima_nama" value={formData.penerima_nama} onChange={onInputChange} placeholder={tr("Contoh: PT. Hayati Semesta Raharja", "Example: PT. Hayati Semesta")} className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50" required />
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium text-gray-700">
              {tr("Paragraf Pembuka", "Opening Paragraph")}
            </label>
            {onApplyPembukaTemplate && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium mr-1">{tr("Pilih Template:", "Select Template:")}</span>
                <button
                  type="button"
                  onClick={() => onApplyPembukaTemplate("service")}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium shadow-xs transition cursor-pointer ${
                    formData.divisi === "service"
                      ? "border-slate-800 bg-slate-800 text-white font-semibold"
                      : "border-slate-200/80 bg-white/70 backdrop-blur-sm text-slate-700 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  Divisi Service
                </button>
                <button
                  type="button"
                  onClick={() => onApplyPembukaTemplate("kontraktor")}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium shadow-xs transition cursor-pointer ${
                    formData.divisi === "kontraktor"
                      ? "border-slate-800 bg-slate-800 text-white font-semibold"
                      : "border-slate-200/80 bg-white/70 backdrop-blur-sm text-slate-700 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  Divisi Kontraktor
                </button>
                <button
                  type="button"
                  onClick={() => onApplyPembukaTemplate("it")}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium shadow-xs transition cursor-pointer ${
                    formData.divisi === "it"
                      ? "border-slate-800 bg-slate-800 text-white font-semibold"
                      : "border-slate-200/80 bg-white/70 backdrop-blur-sm text-slate-700 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  Divisi IT
                </button>
              </div>
            )}
          </div>
          <RichTextEditor
            label=""
            value={formData.paragraf_pembuka}
            onChange={(value) => onRichTextChange("paragraf_pembuka", value)}
            minHeight={160}
            editorKey={`sph-pembuka-${formData.divisi || "it"}-${formData.templateVersion || 0}`}
          />
        </div>

        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-2">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Receipt size={20} className="text-slate-600" />
                {isRekapActive
                  ? tr("Tabel Halaman 1: Ringkasan Penawaran", "Page 1: Quotation Summary Table")
                  : tr("Rincian Penawaran", "Quotation Details")}
              </h3>
              {isRekapActive && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {tr(
                    "Tabel ini terhubung otomatis dengan Kategori Pekerjaan pada Rekapitulasi Halaman 2 (format Kontraktor).",
                    "This table is automatically linked to Work Categories on Page 2 Recapitulation (Contractor format)."
                  )}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="flex cursor-pointer items-center gap-2 select-none rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm px-3 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-white hover:border-slate-300 transition">
                <input
                  type="checkbox"
                  name="pakai_ppn"
                  checked={Boolean(formData.pakai_ppn)}
                  onChange={onInputChange}
                  className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400 cursor-pointer"
                />
                <span>{tr("Gunakan PPN", "Use VAT/PPN")}</span>
              </label>
              {!isRekapActive && (
                <label className="flex cursor-pointer items-center gap-2 select-none rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm px-3 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-white hover:border-slate-300 transition">
                  <input
                    type="checkbox"
                    name="pakai_diskon"
                    checked={Boolean(formData.pakai_diskon)}
                    onChange={onInputChange}
                    className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400 cursor-pointer"
                  />
                  <span>{tr("Gunakan Diskon", "Use Discount")}</span>
                </label>
              )}
              <label className="flex cursor-pointer items-center gap-2 select-none rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm px-3 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-white hover:border-slate-300 transition">
                <input
                  type="checkbox"
                  name="show_total"
                  checked={formData.show_total !== false}
                  onChange={onInputChange}
                  className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400 cursor-pointer"
                />
                <span>{tr("Tampilkan Total", "Show Total")}</span>
              </label>
              {!isRekapActive && (
                <button
                  type="button"
                  onClick={onAddItem}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 backdrop-blur-sm px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white hover:border-slate-300 hover:text-slate-900 transition cursor-pointer"
                >
                  <Plus size={15} />
                  {tr("Tambah Item", "Add Item")}
                </button>
              )}
            </div>
          </div>

          {isRekapActive ? (
            /* TABEL RINGKASAN HALAMAN 1 (TERHUBUNG OTOMATIS DARI REKAPITULASI) */
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 backdrop-blur-sm p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                      1
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {tr("Tabel Ringkasan Halaman 1", "Page 1 Summary Table")}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {tr(
                          "Setiap baris di bawah adalah Kategori Pekerjaan dari Rekapitulasi Halaman 2. Harga terhitung otomatis.",
                          "Each row below is a Work Category from Page 2 Recapitulation. Prices are auto-calculated."
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {tr("Terhubung Otomatis", "Live Connected")}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-12 text-center">No.</th>
                        <th className="py-2.5 px-3 min-w-[200px]">{tr("Deskripsi (Kategori Pekerjaan)", "Description (Work Category)")}</th>
                        <th className="py-2.5 px-3 w-20 text-center">QTY</th>
                        <th className="py-2.5 px-3 w-24 text-center">Unit</th>
                        <th className="py-2.5 px-3 w-40 text-right">{tr("Harga (Subtotal)", "Price (Subtotal)")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(formData.rekapitulasi_data || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                            {tr(
                              "Belum ada kategori pekerjaan pada Rekapitulasi. Tambahkan kategori pada bagian Halaman 2 di bawah.",
                              "No work categories yet. Add categories in Page 2 section below."
                            )}
                          </td>
                        </tr>
                      ) : (
                        (formData.rekapitulasi_data || []).map((cat, idx) => {
                          const catSubtotal = rekapCategorySubtotals[idx] || 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/60 transition">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-600">{idx + 1}.</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {cat.judul_kategori || (
                                  <span className="text-slate-400 italic">
                                    {tr(`(Kategori ${cat.nomor_romawi || idx + 1} belum diberi nama)`, `(Category ${cat.nomor_romawi || idx + 1} unnamed)`)}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="text"
                                  value={cat.qty || "1"}
                                  onChange={(e) => onUpdateRekapCategoryMeta && onUpdateRekapCategoryMeta(idx, "qty", e.target.value)}
                                  className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center font-medium text-slate-800 focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                                  placeholder="1"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="text"
                                  value={cat.unit || "Ls"}
                                  onChange={(e) => onUpdateRekapCategoryMeta && onUpdateRekapCategoryMeta(idx, "unit", e.target.value)}
                                  className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center font-medium text-slate-800 focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                                  placeholder="Ls"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                                {formatRupiah(catSubtotal)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {(formData.rekapitulasi_data || []).length > 0 && (
                      <tfoot className="border-t border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
                        <tr>
                          <td colSpan={4} className="py-2 px-3 text-right">{tr("Total", "Total")}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{formatRupiah(rekapSubtotal)}</td>
                        </tr>
                        {Boolean(formData.pakai_ppn) && (
                          <tr>
                            <td colSpan={4} className="py-2 px-3 text-right">
                              <span className="flex items-center justify-end gap-1.5">
                                <span>PPN</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  name="ppn_persen"
                                  value={formData.ppn_persen || "11"}
                                  onChange={onInputChange}
                                  className="w-14 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-center font-bold text-slate-800"
                                />
                                <span>%</span>
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{formatRupiah(rekapVat)}</td>
                          </tr>
                        )}
                        <tr className="border-t border-slate-200 bg-slate-100/80 font-bold text-slate-900 text-sm">
                          <td colSpan={4} className="py-2.5 px-3 text-right">
                            {tr("Total Harga", "Total Price")}
                            {formData.show_total === false && (
                              <span className="ml-2 text-xs font-normal text-amber-600">({tr("Disembunyikan di PDF", "Hidden on PDF")})</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">{formatRupiah(rekapGrandTotal)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* TABEL MANUAL UNTUK NON-REKAPITULASI (STANDAR) */
            <>
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
                      <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Harga Satuan", "Unit Price")} *</label>
                      <RupiahInput
                        value={item.harga}
                        onChange={(val) => onItemChange(index, "harga", val)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5"
                        placeholder="10.000"
                        required
                      />
                    </div>
                    <div className="md:col-span-3 flex items-end">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveItem(index)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200/80 bg-red-50/60 backdrop-blur-sm px-3 py-2.5 text-xs font-medium text-red-600 shadow-xs hover:bg-red-100/80 hover:border-red-300 transition cursor-pointer"
                        >
                          <Trash2 size={15} />
                          {tr("Hapus", "Delete")}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <RichTextEditor
                      label={tr("Deskripsi", "Description")}
                      value={item.deskripsi}
                      onChange={(value) => onItemChange(index, "deskripsi", value)}
                      minHeight={120}
                      editorKey={`sph-deskripsi-${index}`}
                      allowImages
                      hint={tr(
                        "Tulis keterangan, lalu klik ikon gambar di toolbar untuk sisip foto di antara teks.",
                        "Write the description, then click the image icon in the toolbar to insert a photo between the text."
                      )}
                    />
                  </div>
                </div>
              ))}

              {formData.pakai_ppn || formData.pakai_diskon ? (
                <div className="ml-auto w-full max-w-md space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 backdrop-blur-sm p-4 transition shadow-xs">
                  {formData.show_total === false && (
                    <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                      {tr("Catatan: Baris total disembunyikan pada dokumen PDF", "Note: Total row is hidden on the PDF document")}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-600">{tr("Sub Total", "Sub Total")}</span>
                    <span className="font-semibold tabular-nums text-slate-800">{formatRupiah(estimatedSubtotal)}</span>
                  </div>
                  {Boolean(formData.pakai_diskon) && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{tr("Diskon", "Discount")}</span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            name="diskon_persen"
                            value={formData.diskon_persen}
                            onChange={onInputChange}
                            className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 text-center focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                            placeholder="0"
                          />
                          <span className="ml-1 text-xs text-gray-600">%</span>
                        </div>
                      </div>
                      <span className="font-semibold tabular-nums text-red-600">- {formatRupiah(estimatedDiskon)}</span>
                    </div>
                  )}
                  {Boolean(formData.pakai_ppn) && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{tr("PPN", "VAT/PPN")}</span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            name="ppn_persen"
                            value={formData.ppn_persen}
                            onChange={onInputChange}
                            className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 text-center focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                            placeholder="11"
                          />
                          <span className="ml-1 text-xs text-gray-600">%</span>
                        </div>
                      </div>
                      <span className="font-semibold tabular-nums text-slate-800">{formatRupiah(estimatedPpn)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
                    <span className="font-bold text-slate-800">
                      {tr("Total", "Total")}
                      {formData.show_total === false && (
                        <span className="ml-2 text-xs font-normal text-amber-600">({tr("Disembunyikan di PDF", "Hidden on PDF")})</span>
                      )}
                    </span>
                    <span className="text-lg font-bold tabular-nums text-slate-900">{formatRupiah(estimatedTotal)}</span>
                  </div>
                </div>
              ) : (
                formData.show_total !== false ? (
                  <div className="ml-auto w-full max-w-md rounded-2xl border border-slate-200/80 bg-slate-50/70 backdrop-blur-sm px-4 py-3 transition shadow-xs">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-600">{tr("Estimasi Total", "Estimated Total")}: </span>
                      <span className="text-lg font-bold tabular-nums text-slate-900">{formatRupiah(estimatedTotal ?? estimatedSubtotal)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="ml-auto w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 transition text-right">
                    <p className="text-xs font-medium text-amber-700">
                      {tr("Catatan: Total harga disembunyikan pada dokumen PDF.", "Note: Total price is hidden on the PDF document.")}
                    </p>
                  </div>
                )
              )}
            </>
          )}
        </div>

        {/* ================= SECTION REKAPITULASI (OPSIONAL - KHUSUS DIVISI KONTRAKTOR) ================= */}
        {isKontraktor && (
          <div className="mb-8 rounded-3xl border border-slate-200/80 bg-slate-50/50 backdrop-blur-sm p-4 sm:p-6 transition shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-3 select-none">
                <input
                  type="checkbox"
                  name="pakai_rekapitulasi"
                  checked={Boolean(formData.pakai_rekapitulasi)}
                  onChange={onInputChange}
                  className="h-5 w-5 rounded border-slate-300 text-slate-800 focus:ring-slate-400 cursor-pointer"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    {tr("Halaman 2: Rekapitulasi Rincian Pekerjaan (Detail & Breakdown)", "Page 2: Work Details Recapitulation (Detail & Breakdown)")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {tr(
                      "Format Kontraktor: rincian material & jasa per kategori pekerjaan. Setiap kategori di bawah otomatis menjadi baris pada Tabel Halaman 1.",
                      "Contractor format: material & labor details per category. Each category below automatically forms a row on Page 1 Table."
                    )}
                  </p>
                </div>
              </label>
            </div>
            {Boolean(formData.pakai_rekapitulasi) && onSyncRekapToMainItems && (
              <button
                type="button"
                onClick={onSyncRekapToMainItems}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-white hover:border-slate-300 hover:text-slate-900 transition cursor-pointer"
                title={tr("Refresh atau paksa sinkronisasi subtotal kategori ke Halaman 1", "Refresh or force sync category subtotals to Page 1")}
              >
                <RefreshCw size={14} className="text-slate-600" />
                {tr("Refresh Sinkronisasi Halaman 1", "Refresh Page 1 Sync")}
              </button>
            )}
          </div>

          {Boolean(formData.pakai_rekapitulasi) && (
            <div className="mt-4 space-y-5 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {tr("Judul / Proyek Rekapitulasi (Banner Rekapitulasi)", "Recapitulation / Project Title")}
                </label>
                <input
                  type="text"
                  name="rekapitulasi_judul"
                  value={formData.rekapitulasi_judul || ""}
                  onChange={onInputChange}
                  placeholder={formData.perihal || tr("Contoh: RENOVASI GEDUNG UTAMA KLINIK RAWAT INAP HIDUP BARU", "Example: CLINIC RENOVATION PROJECT")}
                  className="w-full rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm px-4 py-2.5 text-sm uppercase font-semibold text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* DAFTAR KATEGORI PEKERJAAN */}
              <div className="space-y-4">
                {(formData.rekapitulasi_data || []).map((cat, catIdx) => (
                  <div
                    key={catIdx}
                    className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-xs"
                  >
                    {/* Header Kategori */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                      <div className="flex flex-wrap flex-1 items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-xs font-bold text-white shadow-xs">
                          {cat.nomor_romawi || catIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={cat.judul_kategori || ""}
                          onChange={(e) => onUpdateRekapCategory && onUpdateRekapCategory(catIdx, "judul_kategori", e.target.value)}
                          placeholder={tr(`Nama Kategori ${cat.nomor_romawi || catIdx + 1} (cth: PEKERJAAN PERSIAPAN)`, `Category ${cat.nomor_romawi || catIdx + 1} Name`)}
                          className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold uppercase text-slate-800 focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                          required
                        />
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <label className="flex items-center gap-1">
                            <span className="text-[11px] font-medium text-slate-400">QTY:</span>
                            <input
                              type="text"
                              value={cat.qty || "1"}
                              onChange={(e) => onUpdateRekapCategoryMeta && onUpdateRekapCategoryMeta(catIdx, "qty", e.target.value)}
                              className="w-12 rounded border border-slate-200 bg-white px-1.5 py-1 text-center font-medium text-slate-700"
                              placeholder="1"
                            />
                          </label>
                          <label className="flex items-center gap-1">
                            <span className="text-[11px] font-medium text-slate-400">Unit:</span>
                            <input
                              type="text"
                              value={cat.unit || "Ls"}
                              onChange={(e) => onUpdateRekapCategoryMeta && onUpdateRekapCategoryMeta(catIdx, "unit", e.target.value)}
                              className="w-14 rounded border border-slate-200 bg-white px-1.5 py-1 text-center font-medium text-slate-700"
                              placeholder="Ls"
                            />
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100/80 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                          Sub Total: <strong className="text-slate-900 font-bold">{formatRupiah(rekapCategorySubtotals[catIdx] || 0)}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveRekapCategory && onRemoveRekapCategory(catIdx)}
                          className="flex items-center gap-1 rounded-lg border border-red-200/70 bg-red-50/50 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100/70 hover:border-red-300 transition cursor-pointer"
                          title={tr("Hapus Kategori", "Delete Category")}
                        >
                          <Trash2 size={13} />
                          {tr("Hapus Kategori", "Delete")}
                        </button>
                      </div>
                    </div>

                    {/* Tabel Rincian Item Pekerjaan */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200/80 text-slate-500 uppercase tracking-wider">
                            <th className="py-2 px-1 w-8 text-center">No</th>
                            <th className="py-2 px-2 min-w-[200px]">{tr("Deskripsi Pekerjaan", "Work Description")} *</th>
                            <th className="py-2 px-2 w-20 text-center">{tr("Satuan", "Unit")}</th>
                            <th className="py-2 px-2 w-16 text-center">Vol</th>
                            <th className="py-2 px-2 w-32 text-right">{tr("Material (Rp)", "Material (Rp)")}</th>
                            <th className="py-2 px-2 w-32 text-right">{tr("Jasa (Rp)", "Labor (Rp)")}</th>
                            <th className="py-2 px-2 w-32 text-right font-bold">{tr("Total Item", "Item Total")}</th>
                            <th className="py-2 px-1 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(cat.items || []).map((item, itemIdx) => {
                            const volNum = Math.max(0, Number(item.vol) || 1);
                            const matNum = parseRibuanId(item.material);
                            const jasaNum = parseRibuanId(item.jasa);
                            const itemTotal = Math.round(volNum * (matNum + jasaNum));

                            return (
                              <tr key={itemIdx} className="hover:bg-slate-50/60">
                                <td className="py-2 px-1 text-center font-medium text-slate-500">
                                  {item.nomor ?? itemIdx + 1}
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={item.deskripsi || ""}
                                    onChange={(e) => onUpdateRekapItem && onUpdateRekapItem(catIdx, itemIdx, "deskripsi", e.target.value)}
                                    placeholder={tr("Uraian pekerjaan...", "Work description...")}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                                    required
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={item.satuan || ""}
                                    onChange={(e) => onUpdateRekapItem && onUpdateRekapItem(catIdx, itemIdx, "satuan", e.target.value)}
                                    placeholder="ls / m2 / unit"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-center focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={item.vol ?? "1"}
                                    onChange={(e) => onUpdateRekapItem && onUpdateRekapItem(catIdx, itemIdx, "vol", e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-center focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <RupiahInput
                                    value={item.material}
                                    onChange={(val) => onUpdateRekapItem && onUpdateRekapItem(catIdx, itemIdx, "material", val)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-right focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <RupiahInput
                                    value={item.jasa}
                                    onChange={(val) => onUpdateRekapItem && onUpdateRekapItem(catIdx, itemIdx, "jasa", val)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-right focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right font-semibold text-slate-800 tabular-nums">
                                  {formatRupiah(itemTotal)}
                                </td>
                                <td className="py-2 px-1 text-center">
                                  {(cat.items || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => onRemoveRekapItem && onRemoveRekapItem(catIdx, itemIdx)}
                                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                      title={tr("Hapus Baris", "Delete Row")}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onAddRekapItem && onAddRekapItem(catIdx)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-white hover:border-slate-300 hover:text-slate-900 transition cursor-pointer"
                      >
                        <Plus size={13} />
                        {tr("Tambah Item ke Kategori Ini", "Add Item to this Category")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tambah Kategori Baru & Ringkasan */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onAddRekapCategory}
                  className="flex items-center gap-2 rounded-xl border border-slate-300/90 bg-white/90 backdrop-blur-sm px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-white hover:border-slate-400 hover:text-slate-900 transition cursor-pointer"
                >
                  <Plus size={15} />
                  {tr("Tambah Kategori Pekerjaan Baru", "Add New Work Category")}
                </button>

                {/* Ringkasan Rekapitulasi */}
                <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-3.5 space-y-1.5 text-xs shadow-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{tr("Total Rekapitulasi:", "Rekapitulasi Total:")}</span>
                    <span className="font-semibold tabular-nums text-slate-800">{formatRupiah(rekapSubtotal)}</span>
                  </div>
                  {Boolean(formData.pakai_ppn) && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT / PPN ({formData.ppn_persen || 11}%):</span>
                      <span className="font-semibold tabular-nums text-slate-800">{formatRupiah(rekapVat)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-bold text-slate-900">
                    <span>{tr("Grand Total Rekapitulasi:", "Grand Total:")}</span>
                    <span className="tabular-nums">{formatRupiah(rekapGrandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

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
            editorKey={`sph-syarat-${formData.divisi || "it"}-${formData.templateVersion || 0}`}
          />
        </div>

        <div className="mb-8">
          <RichTextEditor
            label={tr("Paragraf Penutup / Kontak", "Closing / Contact Paragraph")}
            value={formData.paragraf_penutup}
            onChange={(value) => onRichTextChange("paragraf_penutup", value)}
            minHeight={120}
            editorKey={`sph-penutup-${formData.divisi || "it"}-${formData.templateVersion || 0}`}
          />
        </div>

        <ScheduleGenerateSection
          {...scheduleSectionProps}
          canSchedule={scheduleSectionProps?.canSchedule && !isEditing}
          onSchedule={() => onScheduleGenerate?.(document.getElementById("sph-form"))}
          loading={loading}
        />

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onReset}
            className={`rounded-xl border border-slate-200/90 bg-white/80 backdrop-blur-sm px-6 py-3 font-medium text-slate-700 shadow-sm hover:bg-white hover:border-slate-300 hover:text-slate-900 transition cursor-pointer ${isEditing ? "border-orange-200/80 bg-orange-50/60 text-orange-700 hover:bg-orange-100/80" : ""}`}
          >
            {isEditing ? <span className="flex items-center justify-center gap-2"><X size={18} />{tr("Batal Edit", "Cancel Edit")}</span> : tr("Reset", "Reset")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center justify-center gap-2 rounded-xl px-8 py-3 font-medium text-white shadow-sm backdrop-blur-sm transition cursor-pointer ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800 border border-slate-800"}`}
          >
            {loading ? (isEditing ? tr("Menyimpan...", "Saving...") : tr("Generating...", "Generating...")) : isEditing ? <><Save size={20} />{tr("Simpan Perubahan", "Save Changes")}</> : <><Download size={20} />{tr("Generate PDF", "Generate PDF")}</>}
          </button>
        </div>
      </form>
    </div>
  );
};
