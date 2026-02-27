import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, Package, Search } from "lucide-react";

export default function InventoryPage() {

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toLowerCase();

  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : "/admin";

  const API_URL = "http://127.0.0.1:8000";

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
          role: role // 🔥 kirim role ke backend
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
    <div>

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">

        <button
          onClick={() => navigate(`${basePath}/it`)}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
        >
          ← Kembali
        </button>

        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Package size={28} />
          Inventory Aset
        </h2>

      </div>

      {/* ACTION BAR */}
      <div className="flex justify-between items-center mb-6">

        <button
          onClick={() =>
            navigate(`${basePath}/it/inventory/tambah`)
          }
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Tambah Barang
        </button>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-2.5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg pl-9 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Kode</th>
              <th className="p-3 text-left">Nama</th>
              <th className="p-3 text-left">Kategori</th>
              <th className="p-3 text-left">Stok</th>
              <th className="p-3 text-left">Keterangan</th>
              <th className="p-3 text-left">Lokasi</th>
              <th className="p-3 text-left">Foto</th>
              <th className="p-3 text-left">Aksi</th>
            </tr>
          </thead>

          <tbody>

            {filteredBarang.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-6 text-center text-gray-500">
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

                  <td className="p-3 text-center">
                    {b.foto ? (
                      <img
                        src={`${API_URL}/${b.foto}`}
                        alt="foto"
                        onClick={() => setPreviewImage(`${API_URL}/${b.foto}`)}
                        className="w-14 h-14 object-cover rounded mx-auto border cursor-pointer hover:scale-105 transition"
                      />
                    ) : "-"}
                  </td>

                  <td className="p-3 flex gap-3">

                    <button
                      onClick={() =>
                        navigate(`${basePath}/it/inventory/edit/${b.id}`)
                      }
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>

                    {role === "super_admin" && (
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    )}

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative">
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-white px-3 py-1 rounded shadow"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}