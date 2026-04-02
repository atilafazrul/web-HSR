import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosConfig";

const ASSET_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

function newId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

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
    merek: "",
    model: "",
    nomor_serial: "",
    kategori: "",
    stok: 0,
    keterangan: "Siap Pakai",
    lokasi: "",
  });

  /** @type {Array<{ id: string; kind: 'server'; path: string } | { id: string; kind: 'new'; file: File; previewUrl: string }>} */
  const [photoItems, setPhotoItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const replaceInputRef = useRef(null);
  const replaceIndexRef = useRef(null);

  /* ================= LOAD DATA ================= */

  useEffect(() => {

    const loadData = async () => {

      try {

        const res = await api.get(`/barang/${id}`);

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
          merek: data.merek ?? "",
          model: data.model ?? "",
          nomor_serial: data.nomor_serial ?? "",
          kategori: data.kategori ?? "",
          stok: data.stok ?? 0,
          keterangan: data.keterangan ?? "Siap Pakai",
          lokasi: data.lokasi ?? "",
        });

        const paths = Array.isArray(data.fotos) && data.fotos.length > 0
          ? data.fotos
          : (data.foto ? [data.foto] : []);

        setPhotoItems(
          paths.map((path) => ({
            id: newId(),
            kind: "server",
            path,
          }))
        );

      } catch (err) {

        console.error("LOAD ERROR:", err);
        alert("Gagal mengambil data barang ❌");

      } finally {

        setLoading(false);

      }

    };

    loadData();

  }, [id, navigate]);


  /* ================= PHOTOS ================= */

  const handleAddFotos = (e) => {
    const selected = Array.from(e.target.files || []);
    const keyOf = (f) => `${f?.name || ""}__${f?.size || 0}`;

    setPhotoItems((prev) => {
      const existingKeys = new Set(
        prev.filter((p) => p.kind === "new").map((p) => keyOf(p.file))
      );
      const next = [...prev];

      for (const f of selected) {
        if (next.length >= 6) {
          alert("Maksimal 6 foto ❗");
          break;
        }
        const k = keyOf(f);
        if (existingKeys.has(k)) continue;
        existingKeys.add(k);
        const previewUrl = URL.createObjectURL(f);
        next.push({ id: newId(), kind: "new", file: f, previewUrl });
      }

      return next;
    });

    e.target.value = "";
  };

  const handleRemovePhoto = (indexToRemove) => {
    setPhotoItems((prev) => {
      const item = prev[indexToRemove];
      if (item?.kind === "new" && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const openReplace = (idx) => {
    replaceIndexRef.current = idx;
    replaceInputRef.current?.click();
  };

  const handleReplaceChange = (e) => {
    const file = e.target.files?.[0];
    const idx = replaceIndexRef.current;
    e.target.value = "";
    replaceIndexRef.current = null;

    if (!file || idx == null) return;
    if (!file.type.startsWith("image/")) {
      alert("Pilih file gambar");
      return;
    }

    setPhotoItems((prev) => {
      const old = prev[idx];
      if (old?.kind === "new" && old.previewUrl) {
        URL.revokeObjectURL(old.previewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      return prev.map((it, i) =>
        i === idx
          ? { id: newId(), kind: "new", file, previewUrl }
          : it
      );
    });
  };


  /* ================= FORM FIELDS ================= */

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));

  };


  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

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

      const plan = [];
      const files = [];

      for (const it of photoItems) {
        if (it.kind === "server") {
          plan.push(it.path);
        } else {
          plan.push("__UPLOAD__");
          files.push(it.file);
        }
      }

      formData.append("foto_slots", JSON.stringify(plan));
      files.forEach((f) => formData.append("fotos[]", f));

      await api.post(
        `/barang/${id}?_method=PUT`,
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
      const msg = err.response?.data?.message;
      alert(msg || "Gagal update barang ❌");

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

        <input
          type="text"
          name="kode_barang"
          value={form.kode_barang}
          disabled
          className="w-full border p-3 rounded bg-gray-100"
        />

        <input
          type="text"
          name="nama_barang"
          value={form.nama_barang}
          disabled
          className="w-full border p-3 rounded bg-gray-100"
        />

        <input
          type="text"
          name="merek"
          placeholder="Merek"
          value={form.merek}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        <input
          type="text"
          name="model"
          placeholder="Model"
          value={form.model}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        <input
          type="text"
          name="nomor_serial"
          placeholder="Serial number"
          value={form.nomor_serial}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        <input
          type="text"
          name="kategori"
          placeholder="Kategori"
          value={form.kategori}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        <input
          type="number"
          name="stok"
          min="0"
          placeholder="Stok"
          value={form.stok}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        <select
          name="keterangan"
          value={form.keterangan}
          onChange={handleChange}
          className={`w-full border p-3 rounded ${form.keterangan === "Rusak"
            ? "bg-red-100 text-red-600"
            : "bg-green-100 text-green-600"
            }`}
        >
          <option value="Siap Pakai">Siap Pakai</option>
          <option value="Rusak">Rusak</option>
        </select>

        <input
          type="text"
          name="lokasi"
          placeholder="Lokasi Barang"
          value={form.lokasi}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        <input
          ref={replaceInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleReplaceChange}
        />

        <div>
          <label className="block mb-1 text-sm font-medium">
            Foto barang
          </label>
          <input
            type="file"
            name="fotos_add"
            accept="image/*"
            multiple
            onChange={handleAddFotos}
            disabled={photoItems.length >= 6}
            className="w-full border p-3 rounded disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maksimal 6 foto. Klik <strong>Ganti</strong> untuk mengganti satu foto, atau silang untuk hapus.
          </p>

          {photoItems.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {photoItems.map((it, idx) => {
                const src =
                  it.kind === "server"
                    ? `${ASSET_BASE}/${it.path}`
                    : it.previewUrl;

                return (
                  <div key={it.id} className="relative w-full">
                    <img
                      src={src}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-28 object-cover rounded-lg border bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center hover:bg-red-700"
                      title="Hapus"
                    >
                      ×
                    </button>
                    <button
                      type="button"
                      onClick={() => openReplace(idx)}
                      className="mt-1 w-full text-xs py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-800"
                    >
                      Ganti
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
