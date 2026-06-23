import React from "react";
import { Search, Filter, FileText, User, Eye, Download, MapPin, X, Calendar, Wrench, Edit, PenLine } from "lucide-react";
import { useI18n } from "../../i18n";

// Format tanggal dari ISO string ke format yang lebih mudah dibaca
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

export default function pdfHistory({
  historyData,
  filteredHistory,
  searchTerm,
  onSearchChange,
  onView,
  closeViewModal,
  onGeneratePDF,
  onEdit,
  selectedItem,
}) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  return (
    <div className="space-y-6">
      {/* SEARCH CARD */}
      <div className="bg-white rounded-3xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 flex-1 w-full">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={tr("Cari berdasarkan customer, contact person, phone, teknisi, atau brand...", "Search by customer, contact person, phone, technician, or brand...")}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-sm">{filteredHistory.length} {tr("dari", "of")} {historyData.length} {tr("data", "records")}</span>
          </div>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white rounded-3xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Brand/Model</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{tr("Teknisi", "Technician")}</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">{tr("Aksi", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">{tr("Tidak ada data ditemukan", "No data found")}</p>
                    <p className="text-sm">{tr("Coba kata kunci lain atau buat dokumen baru", "Try another keyword or create a new document")}</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.customer}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs flex items-center gap-1">
                        <MapPin size={12} />
                        {item.kota || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <User size={14} />
                        {item.contact_person || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.phone || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{item.brand}</div>
                      <div className="text-sm text-gray-500">{item.model}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.nama_teknisi}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === "Selesai"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onView(item)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          title={tr("Lihat detail", "View detail")}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition"
                          title={tr("Edit dokumen", "Edit document")}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => onGeneratePDF(item)}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileText className="text-white" size={24} />
                <h2 className="text-xl font-bold text-white">Detail Service Report</h2>
              </div>
              <button
                onClick={closeViewModal}
                className="text-white hover:bg-white/20 p-2 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* CUSTOMER INFO */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  {tr("Informasi Customer", "Customer Information")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <span className="ml-2 font-medium">{selectedItem.customer || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Contact Person:</span>
                    <span className="ml-2 font-medium">{selectedItem.contact_person || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2 font-medium">{selectedItem.phone || "-"}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin size={14} className="text-gray-400 mr-1" />
                    <span className="text-gray-500">{tr("Kota", "City")}:</span>
                    <span className="ml-2 font-medium">{selectedItem.kota || "-"}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-gray-500 text-sm">{tr("Alamat", "Address")}:</span>
                  <p className="mt-1 text-gray-900">{selectedItem.address || "-"}</p>
                </div>
              </div>

              {/* DEVICE INFO */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Wrench size={18} className="text-blue-600" />
                  {tr("Informasi Perangkat", "Equipment Information")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Brand:</span>
                    <span className="ml-2 font-medium">{selectedItem.brand || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Model:</span>
                    <span className="ml-2 font-medium">{selectedItem.model || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Serial No:</span>
                    <span className="ml-2 font-medium">{selectedItem.serial_no || "-"}</span>
                  </div>
                </div>
              </div>

              {/* DATES */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar size={18} className="text-blue-600" />
                  {tr("Tanggal & Teknisi", "Date & Technician")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">{tr("Tanggal", "Date")}:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedItem.tanggal)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Start Date:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedItem.start_date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedItem.completed_date)}</span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="text-gray-500">{tr("Nama Teknisi", "Technician Name")}:</span>
                    <span className="ml-2 font-medium">{selectedItem.nama_teknisi || "-"}</span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="text-gray-500">{tr("Nama Client", "Client Name")}:</span>
                    <span className="ml-2 font-medium">{selectedItem.nama_client || "-"}</span>
                  </div>
                </div>
              </div>

              {(selectedItem.ttd_teknisi || selectedItem.ttd_klien) && (
                <div className="bg-gray-50 rounded-2xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <PenLine size={18} className="text-blue-600" />
                    {tr("Tanda Tangan", "Signatures")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedItem.ttd_teknisi && (
                      <div className="bg-white rounded-xl border p-4">
                        <p className="text-sm text-gray-500 mb-2">{tr("Teknisi", "Technician")}</p>
                        <img
                          src={selectedItem.ttd_teknisi}
                          alt={tr("Tanda tangan teknisi", "Technician signature")}
                          className="max-h-24 w-full object-contain bg-white rounded border mb-2"
                        />
                        {selectedItem.nama_teknisi && (
                          <p className="text-sm font-medium text-center">({selectedItem.nama_teknisi})</p>
                        )}
                      </div>
                    )}
                    {selectedItem.ttd_klien && (
                      <div className="bg-white rounded-xl border p-4">
                        <p className="text-sm text-gray-500 mb-2">Customer</p>
                        <img
                          src={selectedItem.ttd_klien}
                          alt={tr("Tanda tangan customer", "Customer signature")}
                          className="max-h-24 w-full object-contain bg-white rounded border mb-2"
                        />
                        {selectedItem.nama_client && (
                          <p className="text-sm font-medium text-center">({selectedItem.nama_client})</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DESCRIPTIONS */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3">{tr("Deskripsi", "Description")}</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 block mb-1">Problem Description:</span>
                    <p className="text-gray-900 bg-white p-3 rounded-lg border whitespace-pre-wrap">{selectedItem.problem_description || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Service Performed:</span>
                    <p className="text-gray-900 bg-white p-3 rounded-lg border whitespace-pre-wrap">{selectedItem.service_performed || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Recommendation:</span>
                    <p className="text-gray-900 bg-white p-3 rounded-lg border whitespace-pre-wrap">{selectedItem.recommendation || "-"}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={closeViewModal}
                className="px-8 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition"
              >
                {tr("Tutup", "Close")}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
