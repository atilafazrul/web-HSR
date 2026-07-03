import React from "react";
import { Save, FileText, Calendar, Edit, X, PenLine } from "lucide-react";
import { useI18n } from "../../../../i18n";
import SignaturePad from "./SignaturePad";

export const SPPDForm = ({
  formData, onInputChange, onSignatureChange, onSubmit, onReset, loading, nextNomorSurat, fetchingNomor, isEditing
}) => {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  return (
    <div className="bg-white rounded-3xl shadow-md p-4 sm:p-6 lg:p-8">
      <form onSubmit={onSubmit}>
        <div className="mb-6">
          {/* EDITING INDICATOR */}
          {isEditing && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Edit size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-orange-800">{tr("Mode Edit", "Edit Mode")}</p>
                <p className="text-sm text-orange-600">{tr("Perbarui data dokumen SPPD", "Update SPPD document data")}</p>
              </div>
            </div>
          )}

          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            {isEditing ? tr("Edit Dokumen SPPD", "Edit SPPD Document") : tr("Informasi Dokumen", "Document Information")}
          </h3>

          {!isEditing && fetchingNomor && (
            <div className="mb-4 p-3 bg-blue-50 rounded-xl text-blue-600 text-sm">
              {tr("Memuat nomor surat...", "Loading letter number...")}
            </div>
          )}

          {!isEditing && !fetchingNomor && nextNomorSurat && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">{tr("Nomor Surat", "Letter Number")}:</span>
              <span className="ml-2 font-semibold text-gray-800">{nextNomorSurat}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Pejabat Pemberi Perintah", "Commanding Officer")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="pejabat_perintah"
                value={formData.pejabat_perintah}
                onChange={onInputChange}
                placeholder={tr("Nama Pemberi Perintah", "Officer Name")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Nama / NIP Pegawai", "Employee Name / ID")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="nama_pegawai"
                value={formData.nama_pegawai}
                onChange={onInputChange}
                placeholder={tr("Nama Pegawai yang ditugaskan", "Assigned employee name")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Jabatan", "Position")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="jabatan"
                value={formData.jabatan}
                onChange={onInputChange}
                placeholder={tr("Jabatan Pegawai yang ditugaskan", "Assigned employee position")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Tempat Berangkat", "Departure Location")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="tempat_berangkat"
                value={formData.tempat_berangkat}
                onChange={onInputChange}
                placeholder={tr("Contoh: Tangerang", "Example: Tangerang")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Tempat Tujuan", "Destination")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="tempat_tujuan"
                value={formData.tempat_tujuan}
                onChange={onInputChange}
                placeholder={tr("Contoh: Rumah Sakit", "Example: Hospital")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Transportasi", "Transportation")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="transportasi"
                value={formData.transportasi}
                onChange={onInputChange}
                placeholder={tr("Contoh: Kendaraan Roda 4", "Example: 4-wheel vehicle")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Tanggal Berangkat", "Departure Date")} <span className="text-red-500">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  name="tanggal_berangkat"
                  value={formData.tanggal_berangkat}
                  onChange={onInputChange}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  required
                />
              </div>
              {formData.tanggal_berangkat_display && (
                <p className="text-sm text-gray-600 mt-1">{tr("Format", "Format")}: {formData.tanggal_berangkat_display}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Tanggal Kembali", "Return Date")} <span className="text-red-500">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  name="tanggal_kembali"
                  value={formData.tanggal_kembali}
                  onChange={onInputChange}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  required
                />
              </div>
              {formData.tanggal_kembali_display && (
                <p className="text-sm text-gray-600 mt-1">{tr("Format", "Format")}: {formData.tanggal_kembali_display}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Maksud Perjalanan Dinas", "Business Trip Purpose")} <span className="text-red-500">*</span></label>
              <textarea
                name="maksud"
                value={formData.maksud}
                onChange={onInputChange}
                placeholder={tr("Pekerjaan yang dilakukan", "Task to be performed")}
                rows={2}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Pengikut Perjalanan (Nama/NIP)", "Travel Companion (Name/ID)")}</label>
              <input
                type="text"
                name="pengikut_nama"
                value={formData.pengikut_nama}
                onChange={onInputChange}
                placeholder={tr("Nama Pengikut", "Companion name")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">{tr("Kosongkan jika tidak ada pengikut", "Leave blank if no companion")}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Atas Beban", "Charged To")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="atas_beban"
                value={formData.atas_beban}
                onChange={onInputChange}
                placeholder={tr("Contoh: Perjalanan Dinas", "Example: Business Trip")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Keterangan", "Notes")}</label>
              <textarea
                name="keterangan"
                value={formData.keterangan}
                onChange={onInputChange}
                placeholder={tr("Keterangan tambahan (opsional)", "Additional notes (optional)")}
                rows={2}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Dibuat Oleh", "Created By")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="dibuat_oleh"
                value={formData.dibuat_oleh}
                onChange={onInputChange}
                placeholder={tr("Pembuat Dokumen", "Document creator")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Tanggal Tanda Tangan", "Signature Date")} <span className="text-red-500">*</span></label>
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
                <p className="text-sm text-gray-600 mt-1">{tr("Format", "Format")}: {formData.tanggal_tanda_tangan_display}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Nama Penyetuju", "Approver Name")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="approve_nama"
                value={formData.approve_nama}
                onChange={onInputChange}
                placeholder={tr("Nama Penyetuju", "Approver name")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Jabatan Penyetuju", "Approver Position")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="approve_jabatan"
                value={formData.approve_jabatan}
                onChange={onInputChange}
                placeholder={tr("Jabatan Penyetuju", "Approver position")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>
          </div>
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
                label={tr("Tanda Tangan Dibuat Oleh", "Created By Signature")}
                value={formData.ttd_dibuat_oleh}
                onChange={(value) => onSignatureChange("ttd_dibuat_oleh", value)}
              />
              <p className="text-xs text-gray-500">
                {tr("Nama akan diambil dari field Dibuat Oleh di atas.", "Name will be taken from the Created By field above.")}
              </p>
            </div>
            <div className="space-y-3">
              <SignaturePad
                label={tr("Tanda Tangan Menyetujui", "Approver Signature")}
                value={formData.ttd_menyetujui}
                onChange={(value) => onSignatureChange("ttd_menyetujui", value)}
              />
              <p className="text-xs text-gray-500">
                {tr("Nama akan diambil dari field Nama Penyetuju di atas.", "Name will be taken from the Approver Name field above.")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onReset}
            className={'w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition ' + (isEditing ? 'text-orange-700 bg-orange-100 hover:bg-orange-200' : 'border border-gray-300 text-gray-600 hover:bg-gray-50')}
          >
            {isEditing ? (
              <span className="flex items-center justify-center gap-2">
                <X size={18} />
                {tr("Batal Edit", "Cancel Edit")}
              </span>
            ) : (
              "Reset"
            )}
          </button>
          <button
            type="submit"
            disabled={loading}
            className={'w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 ' + (loading ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg')}
          >
            {loading ? (
              <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>{tr("Menyimpan...", "Saving...")}</>
            ) : (
              <><Save size={20} />{isEditing ? tr("Simpan Perubahan", "Save Changes") : tr("Simpan Dokumen", "Save Document")}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};