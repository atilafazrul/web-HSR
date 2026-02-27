import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function EditBarangPage() {

  const { id } = useParams();
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
    stok: 0,
    keterangan: "Siap Pakai",
    lokasi: "",
    foto: null,
  });

  const [loading, setLoading] = useState(true);


  /* ================= LOAD DATA ================= */

  useEffect(() => {

    const loadData = async () => {

      try {

        const res = await axios.get(
          `http://127.0.0.1:8000/api/barang/${id}`
        );

        let data = null;

        if (res.data?.data) {
          data = res.data.data;
        } else if (res.data?.kode_barang) {
          data = res.data;
        }

        if (!data) {
          alert("Data barang tidak ditemukan ❌");
          navigate(-1);
          return;
        }

        setForm({
          kode_barang: data.kode_barang ?? "",
          nama_barang: data.nama_barang ?? "",
          kategori: data.kategori ?? "",
          stok: data.stok ?? 0,
          keterangan: data.keterangan ?? "Siap Pakai",
          lokasi: data.lokasi ?? "",
          foto: null,
        });

      } catch (err) {

        console.error("LOAD ERROR:", err);
        alert("Gagal mengambil data barang ❌");

      } finally {

        setLoading(false);

      }

    };

    loadData();

  }, [id, navigate]);


  /* ================= HANDLE CHANGE ================= */

  const handleChange = (e) => {

    const { name, value, files } = e.target;

    if (name === "foto") {

      setForm(prev => ({
        ...prev,
        foto: files[0],
      }));

    } else {

      setForm(prev => ({
        ...prev,
        [name]: value,
      }));

    }

  };


  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

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
        `http://127.0.0.1:8000/api/barang/${id}?_method=PUT`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Barang berhasil diupdate ✅");

      navigate(`${basePath}/it/inventory`);

    } catch (err) {

      console.error("UPDATE ERROR:", err.response || err);
      alert("Gagal update barang ❌");

    }

  };


  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading data...
      </div>
    );
  }


  /* ================= UI ================= */

  return (
    <div>

      <h2 className="text-3xl font-bold mb-6">
        Edit Barang
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow space-y-4 max-w-xl"
      >

        {/* KODE (DIKUNCI) */}
        <input
          type="text"
          name="kode_barang"
          value={form.kode_barang}
          disabled
          className="w-full border p-3 rounded bg-gray-100"
        />

        {/* NAMA (DIKUNCI) */}
        <input
          type="text"
          name="nama_barang"
          value={form.nama_barang}
          disabled
          className="w-full border p-3 rounded bg-gray-100"
        />

        {/* KATEGORI */}
        <input
          type="text"
          name="kategori"
          placeholder="Kategori"
          value={form.kategori}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        {/* STOK */}
        <input
          type="number"
          name="stok"
          min="0"
          placeholder="Stok"
          value={form.stok}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        {/* KETERANGAN (DROPDOWN BARU) */}
        <select
          name="keterangan"
          value={form.keterangan}
          onChange={handleChange}
          className={`w-full border p-3 rounded ${
            form.keterangan === "Rusak"
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-600"
          }`}
        >
          <option value="Siap Pakai">Siap Pakai</option>
          <option value="Rusak">Rusak</option>
        </select>

        {/* LOKASI */}
        <input
          type="text"
          name="lokasi"
          placeholder="Lokasi Barang"
          value={form.lokasi}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        {/* FOTO */}
        <input
          type="file"
          name="foto"
          accept="image/*"
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        {/* BUTTON */}
        <div className="flex gap-3 pt-2">

          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
          >
            Update
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-400 px-5 py-2 rounded hover:bg-gray-500"
          >
            Batal
          </button>

        </div>

      </form>

    </div>
  );
}