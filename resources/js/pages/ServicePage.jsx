import React from "react";
import { Package, FileText, History } from "lucide-react";

const ServicePage = ({ goBack }) => {
  return (
    <div>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={goBack}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
        >
          ← Kembali
        </button>

        <h2 className="text-3xl font-bold">Service</h2>
      </div>

      <p className="text-gray-500 mb-8">
        Kelola inventory, dokumentasi dan riwayat pekerjaan service
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* INVENTORY */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <Package size={30} className="text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Inventory Barang</h3>
          <p className="text-gray-500 text-sm">
            Kelola stok barang dan sparepart service
          </p>
        </div>

        {/* DOKUMENTASI */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <FileText size={30} className="text-green-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Dokumentasi & Laporan Servis
          </h3>
          <p className="text-gray-500 text-sm">
            Upload laporan kerja dan bukti dokumentasi
          </p>
        </div>

        {/* RIWAYAT */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <History size={30} className="text-purple-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Riwayat Pekerjaan
          </h3>
          <p className="text-gray-500 text-sm">
            Lihat histori pekerjaan service
          </p>
        </div>

      </div>
    </div>
  );
};

export default ServicePage;
