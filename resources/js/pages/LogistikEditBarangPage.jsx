import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosConfig";
import { useI18n } from "../i18n";

const ASSET_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

function newId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export default function LogistikEditBarangPage() {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);

  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : "/admin";

  const [form, setForm] = useState({
    kode_barang: "",
    nama_barang: "",
    kategori: "",
    stok: 0,
    lokasi: "",
  });

  /** @type {Array<{ id: string; kind: 'server'; path: string } | { id: string; kind: 'new'; file: File; previewUrl: string }>} */
  const [photoItems, setPhotoItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const replaceInputRef = useRef(null);
  const replaceIndexRef = useRef(null);

  useEffect(() => {

    const loadData = async () => {

      try {

        const res = await api.get(`/logistik-inventory/${id}`);

        let data = null;

        if (res.data?.data) {
          data = res.data.data;
        } else if (res.data?.kode_barang) {
          data = res.data;
        }

        if (!data) {
          alert(tr("Data barang tidak ditemukan ❌", "Item data not found ❌"));
          navigate(-1);
          return;
        }

        setForm({
          kode_barang: data.kode_barang ?? "",
          nama_barang: data.nama_barang ?? "",
          kategori: data.kategori ?? "",
          stok: data.stok ?? 0,
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
        alert(tr("Gagal mengambil data barang ❌", "Failed to load item data ❌"));

      } finally {

        setLoading(false);

      }

    };

    loadData();

  }, [id, navigate]);

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
          alert(tr("Maksimal 6 foto ❗", "Maximum 6 photos ❗"));
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
      alert(tr("Pilih file gambar", "Please select an image file"));
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

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const formData = new FormData();

      formData.append("kode_barang", form.kode_barang);
      formData.append("nama_barang", form.nama_barang);
      formData.append("kategori", form.kategori);
      formData.append("stok", form.stok);
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
        `/logistik-inventory/${id}?_method=PUT`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(tr("Barang berhasil diupdate ✅", "Item updated successfully ✅"));

      navigate(`${basePath}/logistik/inventory`);

    } catch (err) {

      console.error("UPDATE ERROR:", err.response || err);
      const msg = err.response?.data?.message;
      alert(msg || tr("Gagal update barang ❌", "Failed to update item ❌"));

    }

  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading data...
      </div>
    );
  }

  return (
    <div>

      <h2 className="text-3xl font-bold mb-6">
        {tr("Edit Barang Logistik", "Edit Logistics Item")}
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
          name="kategori"
          placeholder={tr("Kategori", "Category")}
          value={form.kategori}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        <input
          type="number"
          name="stok"
          min="0"
          placeholder={tr("Stok", "Stock")}
          value={form.stok}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        <input
          type="text"
          name="lokasi"
          placeholder={tr("Lokasi Barang", "Item Location")}
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
            {tr("Foto barang", "Item Photos")}
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddFotos}
            disabled={photoItems.length >= 6}
            className="w-full border p-3 rounded disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            {tr("Maksimal 6 foto. ", "Maximum 6 photos. ")}<strong>{tr("Ganti", "Replace")}</strong>{tr(" mengganti satu foto, silang untuk hapus.", " replaces one photo, X deletes it.")}
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
                      alt={`${tr("Foto", "Photo")} ${idx + 1}`}
                      className="w-full h-28 object-cover rounded-lg border bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center hover:bg-red-700"
                      title={tr("Hapus", "Delete")}
                    >
                      ×
                    </button>
                    <button
                      type="button"
                      onClick={() => openReplace(idx)}
                      className="mt-1 w-full text-xs py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-800"
                    >
                      {tr("Ganti", "Replace")}
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
            {tr("Update", "Update")}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-400 px-5 py-2 rounded hover:bg-gray-500"
          >
            {tr("Batal", "Cancel")}
          </button>

        </div>

      </form>

    </div>
  );
}
