import React from "react";
import { Plus, Download, Trash2, Calendar, FileSpreadsheet, Edit, X, Save, AlertCircle } from "lucide-react";
import { useI18n } from "../../../../i18n";
import { parseRibuanId } from "../../../../utils/formatRupiahInput";
import { RichTextEditor } from "./RichTextEditor";
import { RupiahInput } from "./RupiahInput";

export const InvoiceForm = ({
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
  isDuplicateNomor = null,
  onSuggestNextNomor = () => {},
}) => {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);

  return (
    <div className="min-w-0 overflow-x-auto rounded-3xl bg-white p-4 shadow-md sm:p-6 lg:p-8">
      <form id="invoice-form" onSubmit={onSubmit} className="min-w-0">
        {isEditing && (
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <Edit size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-orange-800">{tr("Mode Edit", "Edit Mode")}</p>
                <p className="text-sm text-orange-600">
                  {tr("Nomor Invoice", "Invoice Number")}: <span className="font-mono font-bold text-slate-800">{nextNomorSurat || editNomorSurat}</span>
                </p>
              </div>
            </div>
            <span className="text-xs text-orange-700 bg-orange-100 px-2.5 py-1 rounded-lg">
              {tr("No. Urut (001) dapat disesuaikan di kolom bawah", "Sequence No. (001) can be customized below")}
            </span>
          </div>
        )}

        {!isEditing && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                {tr("Preview Nomor Invoice", "Invoice Number Preview")}
              </p>
              <p className="text-lg font-semibold text-slate-800 font-mono">
                {fetchingNomor ? tr("Memuat...", "Loading...") : nextNomorSurat}
              </p>
            </div>
            <span className="text-xs text-blue-700 bg-blue-100/80 font-medium px-2.5 py-1 rounded-lg">
              {tr("No. Urut (001) dapat diedit di kolom bawah", "Sequence No. (001) can be edited below")}
            </span>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {tr("Divisi", "Division")} *
            </label>
            <select
              name="divisi"
              value={formData.divisi || "it"}
              onChange={onInputChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="it">DIVISI IT (INV-DIVIT)</option>
              <option value="sales">DIVISI SALES (INV-DIVSAL)</option>
              <option value="service">DIVISI SERVICE (INV-DIVSER)</option>
              <option value="bhp">Barang Habis Pakai BHP (INV-DIVPRO)</option>
              <option value="kontraktor">DIVISI KONTRAKTOR (INV-DIVKON)</option>
              <option value="logistik">DIVISI LOGISTIK (INV-DIVLOG)</option>
              <option value="purchasing">DIVISI PURCHASING (INV-DIVPUR)</option>
              <option value="siplah">DIVISI SIPLAH (INV-DIVSIP)</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 flex items-center justify-between">
              <span>{tr("Nomor Urut Invoice", "Invoice Sequence Number")} *</span>
              <span className="text-xs text-indigo-600 font-medium">{tr("Dapat diedit (misal: 001)", "Editable (e.g. 001)")}</span>
            </label>
            <input
              type="text"
              name="nomor_urut"
              value={formData.nomor_urut ?? "001"}
              onChange={onInputChange}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (/^\d+$/.test(val)) {
                  onInputChange({ target: { name: "nomor_urut", value: val.padStart(3, "0") } });
                }
              }}
              placeholder="001"
              className={`w-full rounded-xl border px-4 py-3 font-mono font-semibold outline-none transition ${
                isDuplicateNomor
                  ? "border-red-400 bg-red-50/50 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-gray-200 bg-gray-50 text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              }`}
              required
            />
            {isDuplicateNomor ? (
              <div className="mt-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 shadow-sm animate-fadeIn">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-800">
                      {tr("Nomor Invoice Sudah Digunakan!", "Invoice Number Already Used!")}
                    </p>
                    <p className="mt-1 leading-relaxed text-red-600">
                      {tr(
                        `Nomor urut ${isDuplicateNomor.nomor_urut} sudah terdaftar pada ${isDuplicateNomor.nomor_surat} (${isDuplicateNomor.divisi ? "Divisi " + String(isDuplicateNomor.divisi).toUpperCase() : "divisi lain"}). Meskipun divisi berbeda, nomor urut invoice tidak boleh kembar!`,
                        `Sequence number ${isDuplicateNomor.nomor_urut} is already registered on ${isDuplicateNomor.nomor_surat} (${isDuplicateNomor.divisi ? "Division " + String(isDuplicateNomor.divisi).toUpperCase() : "another division"}). Even with different divisions, sequence numbers cannot be duplicated!`
                      )}
                    </p>
                    {onSuggestNextNomor && (
                      <button
                        type="button"
                        onClick={onSuggestNextNomor}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-200 transition cursor-pointer"
                      >
                        {tr("Gunakan nomor berikutnya otomatis", "Use next available number")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                {tr("Ubah angka ini jika ingin menggunakan nomor urut tertentu.", "Edit this number to customize the sequence number.")}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{tr("Tanggal Invoice", "Invoice Date")} *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="date" name="tanggal_invoice" value={formData.tanggal_invoice} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4" required={!formData.tanggal_invoice_display} />
            </div>
            {formData.tanggal_invoice_display && <p className="mt-1 text-sm text-gray-600">{formData.tanggal_invoice_display}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{tr("Jatuh Tempo", "Due Date")}</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="date" name="tanggal_jatuh_tempo" value={formData.tanggal_jatuh_tempo} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4" />
            </div>
            {formData.tanggal_jatuh_tempo_display && <p className="mt-1 text-sm text-gray-600">{formData.tanggal_jatuh_tempo_display}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">NO. PO</label>
            <input
              type="text"
              name="no_po"
              value={formData.no_po}
              onChange={onInputChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              placeholder={tr("Nomor Purchase Order (opsional)", "Purchase Order Number (optional)")}
            />
          </div>


          {/* ── Toggle TTD ── */}
          <div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 h-full">
              <div>
                <p className="text-sm font-medium text-gray-700">{tr("Tanda Tangan (TTD)", "Signature (TTD)")}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formData.pakai_ttd
                    ? tr("TTD dicetak di PDF", "Signature printed on PDF")
                    : tr("Tanpa TTD", "Without signature")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onInputChange({ target: { name: "pakai_ttd", value: !formData.pakai_ttd } })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.pakai_ttd ? "bg-blue-600" : "bg-gray-300"
                }`}
                aria-pressed={formData.pakai_ttd}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.pakai_ttd ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ── Toggle Cap ── */}
          <div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 h-full">
              <div>
                <p className="text-sm font-medium text-gray-700">{tr("Cap Perusahaan", "Company Stamp")}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formData.pakai_cap
                    ? tr("Cap dicetak di PDF", "Stamp printed on PDF")
                    : tr("Tanpa cap", "Without stamp")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onInputChange({ target: { name: "pakai_cap", value: !formData.pakai_cap } })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.pakai_cap ? "bg-purple-600" : "bg-gray-300"
                }`}
                aria-pressed={formData.pakai_cap}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.pakai_cap ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {formData.pakai_ttd && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{tr("Nama Penandatangan", "Signatory Name")}</label>
                <input type="text" name="nama_penandatangan" value={formData.nama_penandatangan} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{tr("Jabatan", "Title")}</label>
                <input type="text" name="jabatan_penandatangan" value={formData.jabatan_penandatangan} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{tr("Diskon (Rp)", "Discount (Rp)")}</label>
            <RupiahInput
              name="diskon"
              value={formData.diskon}
              onChange={(val) => onInputChange({ target: { name: "diskon", value: val } })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-400">{tr("Nominal potongan langsung, bukan persentase", "Flat discount amount, not a percentage")}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">PPN (%)</label>
            <input type="number" min="0" max="100" step="0.01" name="ppn_persen" value={formData.ppn_persen} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Bill To</h3>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Nama Klien", "Client Name")} *</label>
            <input type="text" name="bill_to_nama" value={formData.bill_to_nama} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" required />
          </div>
          <div className="mb-3">
            <RichTextEditor
              label={tr("Alamat", "Address")}
              value={formData.bill_to_alamat}
              onChange={(value) => onRichTextChange("bill_to_alamat", value)}
              minHeight={100}
              editorKey="invoice-bill-to-alamat"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Telepon", "Phone")}</label>
            <input type="text" name="bill_to_telepon" value={formData.bill_to_telepon} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" placeholder="(0361) 3003030" />
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between border-b pb-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <FileSpreadsheet size={20} className="text-blue-600" />
              {tr("Item Invoice", "Invoice Items")}
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Unit</label>
                  <input type="text" value={item.unit} onChange={(e) => onItemChange(index, "unit", e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5" placeholder="pcs" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Qty *</label>
                  <input type="number" min="1" value={item.qty} onChange={(e) => onItemChange(index, "qty", e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5" required />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Harga (Rp)", "Price (Rp)")} *</label>
                  <RupiahInput
                    value={item.harga}
                    onChange={(val) => onItemChange(index, "harga", val)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5"
                    placeholder="245.000"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                  <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-700">
                    {formatRupiah(parseRibuanId(item.harga) * Math.max(1, Number(item.qty || 1) || 1))}
                  </div>
                </div>
              </div>
              {formData.items.length > 1 && (
                <button type="button" onClick={() => onRemoveItem(index)} className="flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">
                  <Trash2 size={16} />
                  {tr("Hapus", "Delete")}
                </button>
              )}
            </div>
          ))}

          <div className="ml-auto w-full max-w-md space-y-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex items-start justify-between gap-4 text-sm">
              <span className="shrink-0 text-gray-600">{tr("Sub Total", "Sub Total")}</span>
              <span className="text-right font-semibold tabular-nums text-slate-800">{formatRupiah(estimatedSubtotal)}</span>
            </div>
            {estimatedDiskon > 0 && (
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="shrink-0 text-gray-600">{tr("Diskon", "Discount")}</span>
                <span className="text-right font-semibold tabular-nums text-red-600">- {formatRupiah(estimatedDiskon)}</span>
              </div>
            )}
            <div className="flex items-start justify-between gap-4 text-sm">
              <span className="shrink-0 text-gray-600">PPN ({formData.ppn_persen || 11}%)</span>
              <span className="text-right font-semibold tabular-nums text-slate-800">{formatRupiah(estimatedPpn)}</span>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-blue-100 pt-2">
              <span className="shrink-0 text-base font-bold text-blue-700">{tr("Total", "Total")}</span>
              <span className="text-right text-base font-bold tabular-nums text-blue-700">{formatRupiah(estimatedTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <RichTextEditor
              label="Note"
              value={formData.catatan}
              onChange={(value) => onRichTextChange("catatan", value)}
              minHeight={130}
              editorKey={`invoice-catatan-${Number(formData.ppn_persen || 0) > 0 ? "ppn" : "nonppn"}`}
            />
          </div>
          <div>
            <RichTextEditor
              label="TERMS"
              value={formData.terms}
              onChange={(value) => onRichTextChange("terms", value)}
              minHeight={130}
              editorKey="invoice-terms"
            />
          </div>
        </div>

        <div className="flex flex-col justify-end gap-3 sm:flex-row">
          <button type="button" onClick={onReset} className={`rounded-xl px-6 py-3 font-medium ${isEditing ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
            {isEditing ? <span className="flex items-center justify-center gap-2"><X size={18} />{tr("Batal Edit", "Cancel Edit")}</span> : tr("Reset", "Reset")}
          </button>
          <button
            type="submit"
            disabled={loading || Boolean(isDuplicateNomor)}
            className={`flex items-center justify-center gap-2 rounded-xl px-8 py-3 font-medium text-white transition ${
              loading || isDuplicateNomor
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            title={isDuplicateNomor ? tr("Nomor invoice sudah terdaftar", "Invoice number already registered") : undefined}
          >
            {loading ? (isEditing ? tr("Menyimpan...", "Saving...") : tr("Generating...", "Generating...")) : isEditing ? <><Save size={20} />{tr("Simpan Perubahan", "Save Changes")}</> : <><Download size={20} />{tr("Generate PDF", "Generate PDF")}</>}
          </button>
        </div>
      </form>
    </div>
  );
};
