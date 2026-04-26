import React from "react";
import { Search, Eye, Download, Trash2, Edit } from "lucide-react";
import { formatDate } from "../../utils/dateHelpers";
import { useI18n } from "../../../../i18n";

export const SPPDHistory = ({ 
  filteredHistory, searchTerm, onSearchChange, onView, onGeneratePDF, onDelete, onEdit, selectedItem, showViewModal, onCloseViewModal
}) => {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  return (
    <div className="bg-white rounded-3xl shadow-md p-4 sm:p-6">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={tr("Cari berdasarkan nomor surat, nama pegawai, atau tujuan...", "Search by letter number, employee name, or destination...")}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">{tr("Belum ada riwayat dokumen SPPD", "No SPPD document history yet")}</p>
          <p className="text-sm mt-2">{tr("Dokumen yang Anda buat akan muncul di sini", "Documents you create will appear here")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{tr("No. Surat", "Letter No.")}</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{tr("Nama Pegawai", "Employee Name")}</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{tr("Tujuan", "Destination")}</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden md:table-cell">{tr("Tanggal", "Date")}</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">{tr("Aksi", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item, index) => (
                <tr key={item.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800">{item.nomor_surat}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{item.nama_pegawai}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{item.tempat_tujuan}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{formatDate(item.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onView(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title={tr("Lihat Detail", "View Detail")}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        title={tr("Edit dokumen", "Edit document")}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onGeneratePDF(item)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title={tr("Hapus", "Delete")}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold">{tr("Detail SPPD", "SPPD Detail")}</h2>
                <button onClick={onCloseViewModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">{tr("Nomor Surat", "Letter Number")}</label>
                    <p className="text-sm font-medium">{selectedItem.nomor_surat}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Nama Pegawai", "Employee Name")}</label>
                    <p className="text-sm font-medium">{selectedItem.nama_pegawai}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Pejabat Pemberi Perintah", "Commanding Officer")}</label>
                    <p className="text-sm font-medium">{selectedItem.pejabat_perintah}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Jabatan", "Position")}</label>
                    <p className="text-sm font-medium">{selectedItem.jabatan}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Tempat Berangkat", "Departure Location")}</label>
                    <p className="text-sm font-medium">{selectedItem.tempat_berangkat}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Tempat Tujuan", "Destination")}</label>
                    <p className="text-sm font-medium">{selectedItem.tempat_tujuan}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Transportasi", "Transportation")}</label>
                    <p className="text-sm font-medium">{selectedItem.transportasi}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Tanggal Berangkat", "Departure Date")}</label>
                    <p className="text-sm font-medium">{selectedItem.tanggal_berangkat}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Tanggal Kembali", "Return Date")}</label>
                    <p className="text-sm font-medium">{selectedItem.tanggal_kembali}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Pengikut", "Companion")}</label>
                    <p className="text-sm font-medium">{selectedItem.pengikut_nama || '-'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">{tr("Maksud Perjalanan", "Trip Purpose")}</label>
                  <p className="text-sm font-medium">{selectedItem.maksud}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">{tr("Atas Beban", "Charged To")}</label>
                    <p className="text-sm font-medium">{selectedItem.atas_beban}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Keterangan", "Notes")}</label>
                    <p className="text-sm font-medium">{selectedItem.keterangan || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Dibuat Oleh", "Created By")}</label>
                    <p className="text-sm font-medium">{selectedItem.dibuat_oleh}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{tr("Disetujui Oleh", "Approved By")}</label>
                    <p className="text-sm font-medium">{selectedItem.approve_nama} ({selectedItem.approve_jabatan})</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};