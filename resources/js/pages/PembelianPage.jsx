import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Package,
  Plus,
  Trash2,
  Eye,
  X,
  Upload
} from "lucide-react";

export default function PembelianPage() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Tambah
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    no_po: "",
    nama_barang: "",
    supplier: "",
    tanggal: "",
    harga: "",
    status: "Proses",
    foto: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Foto / Preview
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const fetchPembelian = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/pembelian");
      setDataList(res.data.data);
    } catch (error) {
      console.error("Gagal load pembelian:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPembelian();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, foto: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("no_po", form.no_po);
      formData.append("nama_barang", form.nama_barang);
      formData.append("supplier", form.supplier);
      formData.append("tanggal", form.tanggal);
      formData.append("harga", form.harga);
      formData.append("status", form.status);

      if (form.foto) {
        formData.append("foto", form.foto);
      }

      await axios.post("http://127.0.0.1:8000/api/pembelian", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowAddModal(false);
      setForm({
        no_po: "",
        nama_barang: "",
        supplier: "",
        tanggal: "",
        harga: "",
        status: "Proses",
        foto: null,
      });

      fetchPembelian();
    } catch (err) {
      console.error("Gagal tambah pembelian", err);
      alert(err.response?.data?.message || "Gagal menambah data pembelian");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const itemToUpdate = dataList.find((item) => item.id === id);

      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("no_po", itemToUpdate.no_po);
      formData.append("nama_barang", itemToUpdate.nama_barang);
      formData.append("supplier", itemToUpdate.supplier);
      formData.append("tanggal", itemToUpdate.tanggal);
      formData.append("harga", itemToUpdate.harga);
      formData.append("status", newStatus);

      await axios.post(`http://127.0.0.1:8000/api/pembelian/${id}`, formData);

      setDataList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      console.error("Gagal update status", error);
      alert("Gagal mengupdate status pembelian");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      await axios.delete(`http://127.0.0.1:8000/api/pembelian/${id}`, {
        headers: {
          role: user?.role
        }
      });
      setDataList((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Gagal hapus", error);
      alert("Gagal menghapus data pembelian. Pastikan anda memiliki role yang tepat.");
    }
  };

  const handleFormatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(angka);
  };

  if (loading) {
    return <div className="p-4 sm:p-8 text-center text-gray-500">Loading data...</div>;
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Package className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Data Pembelian Barang
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Kelola barang
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition shadow text-sm sm:text-base"
        >
          <Plus size={18} className="flex-shrink-0" />
          <span className="whitespace-nowrap">Tambah Pembelian</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr className="text-left">
                <th className="p-2 sm:p-4 font-semibold">No. PO</th>
                <th className="p-2 sm:p-4 font-semibold">Nama Barang</th>
                <th className="p-2 sm:p-4 font-semibold hidden sm:table-cell">Supplier</th>
                <th className="p-2 sm:p-4 font-semibold hidden md:table-cell">Tanggal</th>
                <th className="p-2 sm:p-4 font-semibold">Harga</th>
                <th className="p-2 sm:p-4 font-semibold">Status</th>
                <th className="p-2 sm:p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 sm:p-8 text-center text-gray-500">
                    Tidak ada data pembelian.
                  </td>
                </tr>
              ) : (
                dataList.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-2 sm:p-4 font-medium">{item.no_po}</td>
                    <td className="p-2 sm:p-4">
                      <div className="font-medium">{item.nama_barang}</div>
                      <div className="text-xs text-gray-500 sm:hidden">{item.supplier}</div>
                      <div className="text-xs text-gray-400 sm:hidden">{item.tanggal}</div>
                    </td>
                    <td className="p-2 sm:p-4 hidden sm:table-cell">{item.supplier}</td>
                    <td className="p-2 sm:p-4 hidden md:table-cell">{item.tanggal}</td>
                    <td className="p-2 sm:p-4 text-green-600 font-semibold whitespace-nowrap">{handleFormatRupiah(item.harga)}</td>
                    <td className="p-2 sm:p-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border outline-none ${item.status === "Diterima"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }`}
                      >
                        <option value="Proses">Proses</option>
                        <option value="Diterima">Diterima</option>
                      </select>
                    </td>
                    <td className="p-2 sm:p-4 text-center">
                      <div className="flex justify-center gap-1 sm:gap-2">
                        {item.foto ? (
                          <button
                            onClick={() => {
                              setSelectedPhoto(`http://127.0.0.1:8000/${item.foto}`);
                              setShowPhotoModal(true);
                            }}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-1.5 sm:p-2 rounded-lg transition"
                            title="Lihat Gambar"
                          >
                            <Eye size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="bg-gray-100 text-gray-400 p-1.5 sm:p-2 rounded-lg cursor-not-allowed"
                            title="Tidak Ada Gambar"
                          >
                            <Eye size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-600 p-1.5 sm:p-2 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 size={14} className="sm:w-4 sm:h-4" />
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

      {/* ================= MODAL TAMBAH DATA ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-3 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 sm:px-6 py-3 sm:py-4 border-b flex justify-between items-center z-10">
              <h3 className="text-lg sm:text-xl font-bold">Tambah Data Pembelian</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">No. PO</label>
                  <input
                    name="no_po"
                    value={form.no_po}
                    onChange={handleChange}
                    placeholder="PO-2026-001"
                    className="border border-gray-300 px-3 sm:px-4 p-2 sm:p-2.5 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                  <input
                    name="nama_barang"
                    value={form.nama_barang}
                    onChange={handleChange}
                    placeholder="Nama Barang"
                    className="border border-gray-300 px-3 sm:px-4 p-2 sm:p-2.5 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    name="supplier"
                    value={form.supplier}
                    onChange={handleChange}
                    placeholder="Nama Supplier"
                    className="border border-gray-300 px-3 sm:px-4 p-2 sm:p-2.5 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    name="tanggal"
                    value={form.tanggal}
                    onChange={handleChange}
                    className="border border-gray-300 px-3 sm:px-4 p-2 sm:p-2.5 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    name="harga"
                    value={form.harga}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="border border-gray-300 px-3 sm:px-4 p-2 sm:p-2.5 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 sm:p-2.5 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    required
                  >
                    <option value="Proses">Proses</option>
                    <option value="Diterima">Diterima</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Upload Gambar / Invoice</label>
                <label
                  htmlFor="uploadFoto"
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 text-center hover:bg-gray-50 transition cursor-pointer flex flex-col items-center"
                >
                  <Upload className="text-gray-400 mb-2" size={24} />
                  <span className="font-medium text-gray-600 text-sm">Klik untuk upload gambar</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {form.foto ? form.foto.name : "Format didukung: JPG, PNG (Max 2MB)"}
                  </span>
                  <input
                    id="uploadFoto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Pembelian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL FOTO / INVOICE ================= */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-3 sm:p-4 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full bg-white rounded-xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/50 hover:bg-white text-gray-800 p-2 rounded-full transition z-10"
            >
              <X size={18} />
            </button>
            <div className="p-2 bg-gray-100 flex justify-center items-center min-h-[200px] sm:min-h-[300px]">
              <img
                src={selectedPhoto}
                alt="Bukti Pembelian"
                className="max-h-[70vh] sm:max-h-[80vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
