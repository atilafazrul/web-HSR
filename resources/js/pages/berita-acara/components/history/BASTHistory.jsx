import React from "react";
import { Search, Download, Eye, Trash2, FileText } from "lucide-react";
import { formatDate } from "../../utils/dateHelpers";

export const BASTHistory = ({ 
  filteredHistory, 
  searchTerm, 
  onSearchChange, 
  onView, 
  onGeneratePDF, 
  onDelete,
  selectedItem,
  showViewModal,
  onCloseViewModal
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-md p-4 sm:p-6 lg:p-8">
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nomor surat atau nama klien..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Belum ada dokumen BAST yang dibuat</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                      {item.nomor_surat}
                    </span>
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                      {item.hasil || 'BAIK'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-base sm:text-lg text-gray-800">{item.nama_klient}</h4>
                  <p className="text-gray-500 text-sm mt-1">
                    {item.nama_hari}, {item.tanggal_bast}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {item.items?.length || 0} barang • Dibuat: {formatDate(item.created_at)}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => onView(item)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition flex items-center justify-center gap-1"
                    title="Lihat Detail"
                  >
                    <Eye size={16} />
                    <span className="sm:hidden text-sm">Lihat</span>
                  </button>
                  <button
                    onClick={() => onGeneratePDF(item)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition flex items-center justify-center gap-1"
                    title="Download PDF"
                  >
                    <Download size={16} />
                    <span className="sm:hidden text-sm">PDF</span>
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-1"
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                    <span className="sm:hidden text-sm">Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-xl font-bold">Detail BAST</h3>
              <button
                onClick={onCloseViewModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <label className="text-sm text-blue-600 font-medium">Nomor Surat</label>
                <p className="text-base sm:text-lg font-bold text-blue-800">{selectedItem.nomor_surat}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Klien</label>
                  <p className="font-medium">{selectedItem.nama_klient}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Hasil</label>
                  <p className="font-medium text-green-600">{selectedItem.hasil || 'BAIK'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Hari</label>
                  <p className="font-medium">{selectedItem.nama_hari}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tanggal BAST</label>
                  <p className="font-medium">{selectedItem.tanggal_bast}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tanggal Tanda Tangan</label>
                  <p className="font-medium">{selectedItem.tanggal_tanda_tangan}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block">Daftar Peralatan</label>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[300px]">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left border">No</th>
                        <th className="p-2 text-left border">Nama Alat</th>
                        <th className="p-2 text-left border">Merk</th>
                        <th className="p-2 text-left border">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem.items?.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 border">{index + 1}</td>
                          <td className="p-2 border">{item.nama_alat}</td>
                          <td className="p-2 border">{item.merk}</td>
                          <td className="p-2 border">{item.jumlah}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={onCloseViewModal}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
