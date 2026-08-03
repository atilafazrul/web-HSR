import React from "react";
import { Plus, Download, Trash2, Calendar, ShoppingCart, Edit, X, Save } from "lucide-react";
import { useI18n } from "../../../../i18n";
import { parseRibuanId } from "../../../../utils/formatRupiahInput";
import { RichTextEditor } from "./RichTextEditor";
import { RupiahInput } from "./RupiahInput";

export const POForm = ({
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
}) => {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);

  return (
    <div className="min-w-0 overflow-x-auto rounded-3xl bg-white p-4 shadow-md sm:p-6 lg:p-8">
      <form id="po-form" onSubmit={onSubmit} className="min-w-0">
        {isEditing && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Edit size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-orange-800">{tr("Mode Edit", "Edit Mode")}</p>
              <p className="text-sm text-orange-600">{tr("Nomor PO", "PO Number")}: {editNomorSurat}</p>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {tr("Preview Nomor PO", "PO Number Preview")}
            </p>
            <p className="text-lg font-semibold text-slate-800">
              {fetchingNomor ? tr("Memuat...", "Loading...") : nextNomorSurat}
            </p>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{tr("Tanggal PO", "PO Date")} *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="date" name="tanggal_po" value={formData.tanggal_po} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4" required={!formData.tanggal_po_display} />
            </div>
            {formData.tanggal_po_display && <p className="mt-1 text-sm text-gray-600">{formData.tanggal_po_display}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{tr("Kota", "City")}</label>
            <input type="text" name="kota_tanda_tangan" value={formData.kota_tanda_tangan} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{tr("Nama Penandatangan", "Signatory Name")}</label>
            <input type="text" name="nama_penandatangan" value={formData.nama_penandatangan} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
          </div>
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

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">To</h3>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Nama Vendor", "Vendor Name")} *</label>
              <input type="text" name="to_nama" value={formData.to_nama} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" required />
            </div>
            <div>
              <RichTextEditor
                label={tr("Alamat Vendor", "Vendor Address")}
                value={formData.to_alamat}
                onChange={(value) => onRichTextChange("to_alamat", value)}
                minHeight={110}
                editorKey="po-to-alamat"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Ship To / Location Project</h3>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Nama", "Name")}</label>
              <input type="text" name="ship_to_nama" value={formData.ship_to_nama} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
            </div>
            <div>
              <RichTextEditor
                label={tr("Alamat", "Address")}
                value={formData.ship_to_alamat}
                onChange={(value) => onRichTextChange("ship_to_alamat", value)}
                minHeight={110}
                editorKey="po-ship-to-alamat"
              />
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">FOB</label>
            <input type="text" name="fob" value={formData.fob} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Shipped Via</label>
            <input type="text" name="shipped_via" value={formData.shipped_via} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Payment Term</label>
            <input type="text" name="payment_term" value={formData.payment_term} onChange={onInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between border-b pb-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <ShoppingCart size={20} className="text-blue-600" />
              {tr("Item Purchase Order", "Purchase Order Items")}
            </h3>
            <button type="button" onClick={onAddItem} className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">
              <Plus size={16} />
              {tr("Tambah Item", "Add Item")}
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div key={index} className="mb-4 rounded-xl bg-gray-50 p-4">
              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Kode Item", "Item Code")}</label>
                  <input type="text" value={item.kode_item} onChange={(e) => onItemChange(index, "kode_item", e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5" placeholder="TM0539AA" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Qty *</label>
                  <input type="number" min="1" value={item.qty} onChange={(e) => onItemChange(index, "qty", e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5" required />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Harga Satuan (Rp)", "Unit Price (Rp)")} *</label>
                  <RupiahInput
                    value={item.harga}
                    onChange={(val) => onItemChange(index, "harga", val)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5"
                    placeholder="352.200"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Total Baris", "Line Total")}</label>
                  <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-700">
                    {formatRupiah(parseRibuanId(item.harga) * Math.max(1, Number(item.qty || 1) || 1))}
                  </div>
                </div>
                <div className="flex items-end md:col-span-2">
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => onRemoveItem(index)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2.5 text-white hover:bg-red-700">
                      <Trash2 size={16} />
                      {tr("Hapus", "Delete")}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{tr("Deskripsi", "Description")} *</label>
                <textarea value={item.deskripsi} onChange={(e) => onItemChange(index, "deskripsi", e.target.value)} rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5" required />
              </div>
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

        <div className="flex flex-col justify-end gap-3 sm:flex-row">
          <button type="button" onClick={onReset} className={`rounded-xl px-6 py-3 font-medium ${isEditing ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
            {isEditing ? <span className="flex items-center justify-center gap-2"><X size={18} />{tr("Batal Edit", "Cancel Edit")}</span> : tr("Reset", "Reset")}
          </button>
          <button type="submit" disabled={loading} className={`flex items-center justify-center gap-2 rounded-xl px-8 py-3 font-medium text-white ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
            {loading ? (isEditing ? tr("Menyimpan...", "Saving...") : tr("Generating...", "Generating...")) : isEditing ? <><Save size={20} />{tr("Simpan Perubahan", "Save Changes")}</> : <><Download size={20} />{tr("Generate PDF", "Generate PDF")}</>}
          </button>
        </div>
      </form>
    </div>
  );
};
