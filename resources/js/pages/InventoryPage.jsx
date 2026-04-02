import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, Search, Eye, Pencil, Trash2 } from "lucide-react";
import api from "../api/axiosConfig";

export default function InventoryPage() {

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toLowerCase();

  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : "/admin";

  const API_URL = import.meta.env.VITE_API_URL;
  const ASSET_BASE_URL = (API_URL || "").replace(/\/api\/?$/, "");

  const [barangs, setBarangs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [previewImages, setPreviewImages] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    getBarang();
  }, []);

  const getBarang = async () => {
    try {
      setLoading(true);

      const res = await api.get("/barang");

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

      await api.delete(`/barang/${id}`, {
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
      (b.merek || "") +
      (b.model || "") +
      (b.nomor_serial || "") +
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
              <th className="p-3 text-left whitespace-nowrap">Merek</th>
              <th className="p-3 text-left">Model</th>
              <th className="p-3 text-left whitespace-nowrap">Serial</th>
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
                <td colSpan="10" className="p-6 text-center text-gray-500">
                  Data tidak ditemukan
                </td>
              </tr>
            ) : (
              filteredBarang.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3">{b.kode_barang}</td>
                  <td className="p-3">{b.nama_barang}</td>
                  <td className="p-3">{b.merek || "—"}</td>
                  <td className="p-3">{b.model || "—"}</td>
                  <td className="p-3 font-mono text-xs">{b.nomor_serial || "—"}</td>
                  <td className="p-3">{b.kategori}</td>
                  <td className="p-3">{b.stok}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${b.keterangan === "Rusak"
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
                          onClick={() => {
                            const fotos = Array.isArray(b.fotos) && b.fotos.length
                              ? b.fotos
                              : (b.foto ? [b.foto] : []);
                            setPreviewImages(fotos.map((p) => `${ASSET_BASE_URL}/${p}`));
                            setPreviewIndex(0);
                          }}
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
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${b.keterangan === "Rusak"
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
                  <span className="text-gray-500">Merek:</span>
                  <p className="font-medium">{b.merek || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Model:</span>
                  <p className="font-medium">{b.model || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Serial:</span>
                  <p className="font-medium font-mono text-xs">{b.nomor_serial || "—"}</p>
                </div>
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
                    onClick={() => {
                      const fotos = Array.isArray(b.fotos) && b.fotos.length
                        ? b.fotos
                        : (b.foto ? [b.foto] : []);
                      setPreviewImages(fotos.map((p) => `${ASSET_BASE_URL}/${p}`));
                      setPreviewIndex(0);
                    }}
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
      {previewImages && previewImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setPreviewImages(null);
            setPreviewIndex(0);
          }}
        >
          <div className="relative w-full max-w-5xl flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-neutral-900 rounded-lg flex items-center justify-center min-h-[200px] max-h-[78vh] p-2">
              <img
                src={previewImages[previewIndex]}
                alt={`Foto ${previewIndex + 1}`}
                className="max-h-[76vh] max-w-full w-auto object-contain rounded"
              />
            </div>
            {previewImages.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center items-center max-h-[18vh] overflow-y-auto py-1">
                {previewImages.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewIndex(idx)}
                    className={`shrink-0 rounded-lg border-2 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 ${idx === previewIndex ? "border-blue-400 ring-1 ring-blue-400" : "border-white/20 opacity-80 hover:opacity-100"
                      }`}
                    title={`Foto ${idx + 1}`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-16 h-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setPreviewImages(null);
                setPreviewIndex(0);
              }}
              className="absolute -top-1 -right-1 sm:top-0 sm:right-0 bg-white w-9 h-9 rounded-full shadow flex items-center justify-center hover:bg-gray-100 text-lg leading-none"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}