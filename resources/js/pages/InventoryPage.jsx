import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, Package, Search, Eye, Pencil, Trash2 } from "lucide-react";

export default function InventoryPage() {

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toLowerCase();

  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : "/admin";

  const API_URL = "https://mansys.hsrsystem.com/api";

  const [barangs, setBarangs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    getBarang();
  }, []);

  const getBarang = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/api/barang`);

      let data = res.data;

      if (data?.data && Array.isArray(data.data)) {
        data = data.data;
      }

      setBarangs(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data barang");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {

    if (!window.confirm("Yakin hapus barang ini?")) return;

    try {

      await axios.delete(`${API_URL}/api/barang/${id}`, {
        headers: {
          role: role
        }
      });

      alert("Barang berhasil dihapus ✅");
      getBarang();

    } catch (err) {

      console.error(err);

      if (err.response?.status === 403) {
        alert("❌ Hanya super admin yang bisa menghapus barang");
      } else {
        alert("Gagal menghapus barang ❌");
      }
    }
  };

  /* ================= SEARCH FILTER ================= */
  const filteredBarang = barangs.filter((b) => {

    const text =
      (b.kode_barang || "") +
      (b.nama_barang || "") +
      (b.kategori || "") +
      (b.keterangan || "") +
      (b.lokasi || "");

    return text.toLowerCase().includes(search.toLowerCase());
  });

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="text-center p-10 text-gray-500">
        Loading data inventory...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Package size={24} className="sm:w-[28px] sm:h-[28px]" />
          <span className="hidden xs:inline">Inventory Aset</span>
          <span className="xs:hidden">Inventory Aset</span>
        </h2>
      </div>

      {/* ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">

        {/* Tombol Tambah Barang */}
        <button
          onClick={() =>
            navigate(`${basePath}/it/inventory/tambah`)
          }
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Tambah Barang</span>
        </button>

        {/* Search Bar */}
        <div className="relative w-full sm:w-auto">
          <Search
            size={18}
            className="absolute left-3 top-2.5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg pl-9 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

      </div>

      {/* TABLE - Tampilan Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Kode</th>
              <th className="p-3 text-left">Nama</th>
              <th className="p-3 text-left">Kategori</th>
              <th className="p-3 text-left">Stok</th>
              <th className="p-3 text-left">Keterangan</th>
              <th className="p-3 text-left">Lokasi</th>
              <th className="p-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredBarang.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  Data tidak ditemukan
                </td>
              </tr>
            ) : (
              filteredBarang.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3">{b.kode_barang}</td>
                  <td className="p-3">{b.nama_barang}</td>
                  <td className="p-3">{b.kategori}</td>
                  <td className="p-3">{b.stok}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        b.keterangan === "Rusak"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {b.keterangan || "Siap Pakai"}
                    </span>
                  </td>
                  <td className="p-3">{b.lokasi}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {b.foto && (
                        <button
                          onClick={() => setPreviewImage(`${API_URL}/${b.foto}`)}
                          className="text-gray-600 hover:text-black"
                          title="Lihat Foto"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`${basePath}/it/inventory/edit/${b.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      {role === "super_admin" && (
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TABLE - Tampilan Mobile/Tablet */}
      <div className="block md:hidden space-y-3">
        {filteredBarang.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">
            Data tidak ditemukan
          </div>
        ) : (
          filteredBarang.map((b) => (
            <div key={b.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
              {/* Header dengan Kode dan Nama */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-semibold text-gray-500">{b.kode_barang}</span>
                  <h3 className="font-medium text-base mt-1">{b.nama_barang}</h3>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    b.keterangan === "Rusak"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {b.keterangan || "Siap Pakai"}
                </span>
              </div>

              {/* Detail Barang */}
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Kategori:</span>
                  <p className="font-medium">{b.kategori}</p>
                </div>
                <div>
                  <span className="text-gray-500">Stok:</span>
                  <p className="font-medium">{b.stok}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Lokasi:</span>
                  <p className="font-medium">{b.lokasi}</p>
                </div>
              </div>

              {/* Action Buttons - Icons Only */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                {b.foto && (
                  <button
                    onClick={() => setPreviewImage(`${API_URL}/${b.foto}`)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg transition flex items-center justify-center"
                    title="Lihat Foto"
                  >
                    <Eye size={20} />
                  </button>
                )}
                <button
                  onClick={() => navigate(`${basePath}/it/inventory/edit/${b.id}`)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-600 p-3 rounded-lg transition flex items-center justify-center"
                  title="Edit"
                >
                  <Pencil size={20} />
                </button>
                {role === "super_admin" && (
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 p-3 rounded-lg transition flex items-center justify-center"
                    title="Hapus"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-full">
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[80vh] max-w-full rounded-lg shadow-lg object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-white w-8 h-8 rounded-full shadow flex items-center justify-center hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}