import React from "react";
import { Plus, Download, Trash2, FileText, Calendar, PenLine } from "lucide-react";
import { useI18n } from "../../../../i18n";
import SignaturePad from "./SignaturePad";

export const BASTForm = ({ 
  formData, 
  onInputChange, 
  onSignatureChange,
  onItemChange, 
  onAddItem, 
  onRemoveItem, 
  onSubmit, 
  onReset, 
  loading 
}) => {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  return (
    <div className="bg-white rounded-3xl shadow-md p-4 sm:p-6 lg:p-8">
      <form onSubmit={onSubmit}>
        {/* Informasi Utama */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            {tr("Informasi Dokumen", "Document Information")}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Hari - Auto from date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr("Hari (Otomatis)", "Day (Automatic)")}
              </label>
              <input
                type="text"
                name="nama_hari"
                value={formData.nama_hari}
                readOnly
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder={tr("Pilih tanggal terlebih dahulu", "Select a date first")}
              />
              <p className="text-xs text-gray-500 mt-1">{tr("Hari akan terisi otomatis dari tanggal pelaksanaan", "Day will be filled automatically from the execution date")}</p>
            </div>

            {/* Tanggal Pelaksanaan - Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr("Tanggal Pelaksanaan", "Execution Date")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  name="tanggal_bast"
                  value={formData.tanggal_bast}
                  onChange={onInputChange}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  required
                />
              </div>
              {formData.tanggal_bast_display && (
                <p className="text-sm text-gray-600 mt-1">
                  {tr("Format", "Format")}: {formData.tanggal_bast_display}
                </p>
              )}
            </div>

            {/* Tanggal Tanda Tangan - Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr("Tanggal Tanda Tangan", "Signature Date")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  name="tanggal_tanda_tangan"
                  value={formData.tanggal_tanda_tangan}
                  onChange={onInputChange}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  required
                />
              </div>
              {formData.tanggal_tanda_tangan_display && (
                <p className="text-sm text-gray-600 mt-1">
                  {tr("Format", "Format")}: {formData.tanggal_tanda_tangan_display}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr("Kota Tanda Tangan", "Signature City")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="kota_tanda_tangan"
                value={formData.kota_tanda_tangan}
                onChange={onInputChange}
                placeholder={tr("Contoh: Tangerang", "Example: Tangerang")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
              {/* <p className="text-xs text-gray-500 mt-1">
                {tr("Kota yang muncul sebelum tanggal tanda tangan di PDF", "City shown before the signature date in the PDF")}
              </p> */}
            </div>

            {/* Nama Klien */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr("Nama Klien", "Client Name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nama_klient"
                value={formData.nama_klient}
                onChange={onInputChange}
                placeholder={tr("Contoh: RS Medika", "Example: Medika Hospital")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            {/* Hasil - Text Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr("Hasil Pemeriksaan", "Inspection Result")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hasil"
                value={formData.hasil}
                onChange={onInputChange}
                placeholder={tr("Contoh: BAIK, CUKUP, RUSAK, dll.", "Example: GOOD, FAIR, DAMAGED, etc.")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {tr("Ketik hasil pemeriksaan/kondisi barang yang diserahkan", "Enter inspection result/item condition")}
              </p>
            </div>
          </div>
        </div>

        {/* Daftar Peralatan */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-2 border-b gap-3">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              {tr("Daftar Peralatan", "Equipment List")}
            </h3>
            <button
              type="button"
              onClick={onAddItem}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={16} />
              {tr("Tambah Barang", "Add Item")}
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 mb-4 items-end bg-gray-50 p-3 sm:p-4 rounded-xl">
              {/* No - Mobile: inline, Desktop: separate */}
              <div className="hidden sm:block sm:col-span-1">
                <label className="block text-sm font-medium text-gray-500 mb-2">{tr("No", "No")}</label>
                <div className="px-3 py-3 bg-white border border-gray-200 rounded-xl text-center font-semibold">
                  {index + 1}
                </div>
              </div>

              {/* Nama Alat */}
              <div className="col-span-1 sm:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="sm:hidden">{index + 1}. </span>
                  {tr("Nama Alat", "Equipment Name")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.nama_alat}
                  onChange={(e) => onItemChange(index, 'nama_alat', e.target.value)}
                  placeholder={tr("Contoh: C - ARM", "Example: C-ARM")}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              {/* Merk */}
              <div className="col-span-1 sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tr("Merk", "Brand")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.merk}
                  onChange={(e) => onItemChange(index, 'merk', e.target.value)}
                  placeholder="Contoh: Siemens"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              {/* Jumlah */}
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tr("Jumlah", "Quantity")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.jumlah}
                  onChange={(e) => onItemChange(index, 'jumlah', e.target.value)}
                  placeholder="1"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              {/* Delete Button */}
              <div className="col-span-1 sm:col-span-1">
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="w-full sm:w-auto px-3 py-2.5 sm:py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2 sm:gap-0"
                    title={tr("Hapus barang", "Delete item")}
                  >
                    <Trash2 size={18} />
                    <span className="sm:hidden ml-2">{tr("Hapus", "Delete")}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center gap-2">
            <PenLine size={20} className="text-blue-600" />
            {tr("Tanda Tangan", "Signatures")}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {tr("Opsional — kosongkan jika ingin menandatangani manual setelah cetak.", "Optional — leave blank to sign manually after printing.")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3">
              <SignaturePad
                label={tr("Tanda Tangan PT HSR", "PT HSR Signature")}
                value={formData.ttd_hsr}
                onChange={(value) => onSignatureChange("ttd_hsr", value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {tr("Nama di dalam ( )", "Name inside ( )")}
                </label>
                <input
                  type="text"
                  name="nama_ttd_hsr"
                  value={formData.nama_ttd_hsr}
                  onChange={onInputChange}
                  placeholder={tr("Contoh: Budi Santoso", "Example: Budi Santoso")}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
            <div className="space-y-3">
              <SignaturePad
                label={tr("Tanda Tangan Klien", "Client Signature")}
                value={formData.ttd_klien}
                onChange={(value) => onSignatureChange("ttd_klien", value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {tr("Nama di dalam ( )", "Name inside ( )")}
                </label>
                <input
                  type="text"
                  name="nama_ttd_klien"
                  value={formData.nama_ttd_klien}
                  onChange={onInputChange}
                  placeholder={tr("Contoh: Dr. Andi", "Example: Dr. Andi")}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            {tr("Reset", "Reset")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`
              w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2
              transition-all duration-200
              ${loading
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
              }
            `}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <Download size={20} />
                Generate PDF
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
