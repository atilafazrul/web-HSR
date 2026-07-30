import React from "react";
import { Search, Download, Eye, Trash2, FileText, Edit } from "lucide-react";
import { formatDate } from "../../utils/dateHelpers";
import { useI18n } from "../../../../i18n";

export const POHistory = ({
  filteredHistory,
  searchTerm,
  onSearchChange,
  onView,
  onGeneratePDF,
  onDelete,
  onEdit,
  selectedItem,
  showViewModal,
  onCloseViewModal,
  formatRupiah,
}) => {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);

  return (
    <div className="bg-white rounded-3xl shadow-md p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={tr("Cari nomor PO atau vendor...", "Search PO number or vendor...")}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="py-12 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">{tr("Belum ada dokumen PO yang dibuat", "No PO documents have been created yet")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6 transition hover:shadow-md">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div className="flex-1">
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{item.nomor_surat}</span>
                  <h4 className="mt-2 text-lg font-semibold text-gray-800">{item.to_nama}</h4>
                  <p className="mt-1 text-sm text-gray-500">PO Date: {item.tanggal_po}</p>
                  <p className="mt-2 text-sm font-medium text-green-700">{formatRupiah(item.total_harga)}</p>
                  <p className="mt-1 text-xs text-gray-400">{tr("Dibuat", "Created")}: {formatDate(item.created_at)}</p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <button onClick={() => onView(item)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-100 px-3 py-2 text-blue-600 hover:bg-blue-200 sm:flex-none">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => onEdit?.(item)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-100 px-3 py-2 text-amber-700 hover:bg-amber-200 sm:flex-none" title={tr("Edit", "Edit")}>
                    <Edit size={16} />
                  </button>
                  <button onClick={() => onGeneratePDF(item)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-100 px-3 py-2 text-green-600 hover:bg-green-200 sm:flex-none">
                    <Download size={16} />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-red-600 hover:bg-red-200 sm:flex-none">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showViewModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold">{selectedItem.nomor_surat}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>To:</strong> {selectedItem.to_nama}</p>
              <p><strong>PO Date:</strong> {selectedItem.tanggal_po}</p>
              <p><strong>Payment Term:</strong> {selectedItem.payment_term}</p>
              <p><strong>Sub Total:</strong> {formatRupiah(selectedItem.subtotal)}</p>
              <p><strong>PPN:</strong> {formatRupiah(selectedItem.ppn_nominal)}</p>
              <p><strong>Total:</strong> {formatRupiah(selectedItem.total_harga)}</p>
              <p><strong>{tr("Item", "Items")}:</strong> {selectedItem.items?.length || 0}</p>
            </div>
            <button onClick={onCloseViewModal} className="mt-6 w-full rounded-xl bg-gray-100 py-3 font-medium text-gray-700 hover:bg-gray-200">
              {tr("Tutup", "Close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
