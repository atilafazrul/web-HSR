import React from "react";
import { Search, Filter, FileText, User, Eye, Download, MapPin } from "lucide-react";

export default function pdfHistory({
  historyData,
  filteredHistory,
  searchTerm,
  onSearchChange,
  onView,
  onGeneratePDF,
}) {
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
                placeholder="Cari berdasarkan customer, contact person, phone, teknisi, atau brand..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <Filter size={18} />
            <span className="text-sm">{filteredHistory.length} dari {historyData.length} data</span>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Teknisi</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Tidak ada data ditemukan</p>
                    <p className="text-sm">Coba kata kunci lain atau buat dokumen baru</p>
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
                          title="Lihat detail"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => onGeneratePDF(item)}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition"
                          title="Generate PDF"
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
    </div>
  );
}
