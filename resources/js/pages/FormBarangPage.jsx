import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

async function compressImage(file, maxW = 1600, maxH = 1600, quality = 0.75) {
  if (!file || !file.type?.startsWith("image/")) return file;

  const imgUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = imgUrl;
    });

    const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
    const width = Math.round(img.width * ratio);
    const height = Math.round(img.height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );

    if (!blob) return file;
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

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
    merek: "",
    model: "",
    nomor_serial: "",
    kategori: "",
    stok: "",
    keterangan: "",
    lokasi: "",
    fotos: [],
  });

  const [loading, setLoading] = useState(false);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [previews, setPreviews] = useState([]);

  /* ================= HANDLE CHANGE ================= */

  const handleChange = async (e) => {

    const { name, value, files } = e.target;

    if (name === "fotos") {
      const selected = Array.from(files || []);
      setProcessingPhotos(true);
      const compressed = await Promise.all(
        selected.map((f) => compressImage(f))
      );
      setForm((prev) => {
        // Dedup by (name + size) so re-picking same file won't duplicate
        const keyOf = (f) => `${f?.name || ""}__${f?.size || 0}`;
        const existingKeys = new Set((prev.fotos || []).map(keyOf));
        const uniqueSelected = compressed.filter((f) => {
          const k = keyOf(f);
          if (existingKeys.has(k)) return false;
          existingKeys.add(k);
          return true;
        });

        const merged = [...(prev.fotos || []), ...uniqueSelected];
        const limited = merged.slice(0, 6);

        if (merged.length > 6) {
          alert("Maksimal 6 foto ❗");
        }

        // Update previews in sync with files (append, not replace)
        setPreviews((prevPrev) => {
          const nextPrev = [...prevPrev, ...uniqueSelected.map((f) => URL.createObjectURL(f))];
          // If we exceed 6, revoke the extra object URLs we won't use
          if (nextPrev.length > 6) {
            nextPrev.slice(6).forEach((u) => URL.revokeObjectURL(u));
          }
          return nextPrev.slice(0, 6);
        });

        return {
          ...prev,
          fotos: limited,
        };
      });

      // allow re-selecting the same file again
      e.target.value = "";
      setProcessingPhotos(false);

    } else {

      setForm({
        ...form,
        [name]: value,
      });

    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      fotos: prev.fotos.filter((_, idx) => idx !== indexToRemove),
    }));

    setPreviews((prev) => {
      if (prev[indexToRemove]) {
        URL.revokeObjectURL(prev[indexToRemove]);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
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
      formData.append("merek", form.merek || "");
      formData.append("model", form.model || "");
      formData.append("nomor_serial", form.nomor_serial || "");
      formData.append("kategori", form.kategori);
      formData.append("stok", form.stok);
      formData.append("keterangan", form.keterangan);
      formData.append("lokasi", form.lokasi);

      if (form.fotos?.length) {
        form.fotos.forEach((f) => formData.append("fotos[]", f));
      }

      await api.post(
        `/barang`,
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
        className="relative bg-white p-6 rounded-xl shadow space-y-4 max-w-xl"
      >
        {(processingPhotos || loading) && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-blue-700">
              <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">
                {processingPhotos ? "Memproses foto..." : "Mengupload data..."}
              </p>
            </div>
          </div>
        )}

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
          name="merek"
          placeholder="Merek"
          value={form.merek}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
        />

        <input
          type="text"
          name="model"
          placeholder="Model"
          value={form.model}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
        />

        <input
          type="text"
          name="nomor_serial"
          placeholder="Serial number"
          value={form.nomor_serial}
          onChange={handleChange}
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
            name="fotos"
            accept="image/*"
            multiple
            onChange={handleChange}
            disabled={processingPhotos || loading}
            className="w-full border p-2 rounded-lg disabled:opacity-60"
          />
          <p className="text-xs text-gray-500 mt-1">Maksimal 6 foto (otomatis dikompres)</p>
          {processingPhotos && (
            <div className="mt-2 inline-flex items-center gap-2 text-xs text-blue-600">
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Memproses foto...
            </div>
          )}

          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {previews.map((src, idx) => (
                <div key={idx} className="relative w-24 h-24">
                  <img
                    src={src}
                    alt={`Preview ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center hover:bg-red-700"
                    title="Hapus foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">

          <button
            type="submit"
            disabled={loading || processingPhotos}
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