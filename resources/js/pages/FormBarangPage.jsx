import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function TambahBarangPage() {

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : "/admin";

  /* ================= STATE ================= */

  const [form, setForm] = useState({
    kode_barang: "",
    nama_barang: "",
    kategori: "",
    stok: "",
    keterangan: "",
    lokasi: "",
    foto: null,
  });

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  /* ================= HANDLE CHANGE ================= */

  const handleChange = (e) => {

    const { name, value, files } = e.target;

    if (name === "foto") {

      const file = files[0];

      setForm({
        ...form,
        foto: file,
      });

      if (file) {
        setPreview(URL.createObjectURL(file));
      }

    } else {

      setForm({
        ...form,
        [name]: value,
      });

    }
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!form.kode_barang || !form.nama_barang || !form.kategori) {
      alert("Mohon lengkapi data wajib ❗");
      return;
    }

    try {

      setLoading(true);

      const formData = new FormData();

      formData.append("kode_barang", form.kode_barang);
      formData.append("nama_barang", form.nama_barang);
      formData.append("kategori", form.kategori);
      formData.append("stok", form.stok);
      formData.append("keterangan", form.keterangan);
      formData.append("lokasi", form.lokasi);

      if (form.foto) {
        formData.append("foto", form.foto);
      }

      await axios.post(
        "http://127.0.0.1:8000/api/barang",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Barang berhasil ditambahkan ✅");

      navigate(`${basePath}/it/inventory`);

    } catch (err) {

      console.error("ERROR:", err.response?.data || err);

      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Gagal menambahkan barang ❌");
      }

    } finally {

      setLoading(false);

    }
  };

  return (
    <div>

      <h2 className="text-3xl font-bold mb-6">
        Tambah Barang
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow space-y-4 max-w-xl"
      >

        <input
          type="text"
          name="kode_barang"
          placeholder="Kode Barang"
          value={form.kode_barang}
          onChange={handleChange}
          required
          className="w-full border p-3 rounded-lg"
        />

        <input
          type="text"
          name="nama_barang"
          placeholder="Nama Barang"
          value={form.nama_barang}
          onChange={handleChange}
          required
          className="w-full border p-3 rounded-lg"
        />

        <input
          type="text"
          name="kategori"
          placeholder="Kategori"
          value={form.kategori}
          onChange={handleChange}
          required
          className="w-full border p-3 rounded-lg"
        />

        <input
          type="number"
          name="stok"
          placeholder="Stok"
          value={form.stok}
          onChange={handleChange}
          required
          min="0"
          className="w-full border p-3 rounded-lg"
        />

        {/* KETERANGAN DROPDOWN */}
        <select
          name="keterangan"
          value={form.keterangan}
          onChange={handleChange}
          required
          className="w-full border p-3 rounded-lg"
        >
          <option value="">Pilih Keterangan</option>
          <option value="Siap Pakai">Siap Pakai</option>
          <option value="Rusak">Rusak</option>
        </select>

        <input
          type="text"
          name="lokasi"
          placeholder="Lokasi Barang"
          value={form.lokasi}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
        />

        <div>
          <label className="block mb-1 text-sm font-medium">
            Foto Barang
          </label>

          <input
            type="file"
            name="foto"
            accept="image/*"
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          />

          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-3 w-32 h-32 object-cover rounded-lg border"
            />
          )}
        </div>

        <div className="flex gap-3 pt-2">

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-300 px-5 py-2 rounded-lg hover:bg-gray-400"
          >
            Batal
          </button>

        </div>

      </form>

    </div>
  );
}