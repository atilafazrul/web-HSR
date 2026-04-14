import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosConfig";
import { Edit3, ArrowLeft } from "lucide-react";

export default function EditProjekKerjaPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const role = user?.role;
  const divisiUser = user?.divisi;

  const canEditProjectByDivisi = (projectDivisi) =>
    role === "super_admin" ||
    String(projectDivisi || "").toLowerCase().trim() ===
      String(divisiUser || "").toLowerCase().trim();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [usersByDivisi, setUsersByDivisi] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [karyawanInput, setKaryawanInput] = useState("");
  const [form, setForm] = useState({
    divisi: "",
    jenis_pekerjaan: "",
    karyawan: "",
    pic_karyawan: "",
    karyawan_terlibat: [],
    alamat: "",
    status: "Dibuat",
    start_date: "",
    problem_description: "",
    barang_dibeli: "",
  });

  useEffect(() => {
    const fetchOne = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/projek-kerja/${id}`);
        const data = res.data?.data || res.data;
        setProject(data);
        setForm({
          divisi: data?.divisi || "",
          jenis_pekerjaan: data?.jenis_pekerjaan || "",
          karyawan: data?.karyawan || "",
          pic_karyawan: data?.pic_karyawan || "",
          karyawan_terlibat: Array.isArray(data?.karyawan_terlibat) && data.karyawan_terlibat.length > 0
            ? data.karyawan_terlibat
            : [data?.karyawan, data?.pic_karyawan].filter(Boolean),
          alamat: data?.alamat || "",
          status: data?.status || "Dibuat",
          start_date: data?.start_date ? String(data.start_date).split("T")[0] : "",
          problem_description: data?.problem_description || "",
          barang_dibeli: data?.barang_dibeli || "",
        });
      } catch (err) {
        const msg = err.response?.data?.message || "Gagal memuat data project";
        alert(msg);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchOne();
  }, [id, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      const targetDivisi = form?.divisi || project?.divisi;
      if (!targetDivisi) return;
      setUsersLoading(true);
      try {
        const res = await api.get("/karyawan");
        const users = res.data?.data || res.data || [];
        const target = String(targetDivisi || "").toLowerCase().trim();
        const filtered = users.filter(
          (u) => String(u?.divisi || "").toLowerCase().trim() === target
        );
        setUsersByDivisi(filtered);
      } catch (err) {
        console.error("Fetch users by divisi error:", err);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [project?.divisi, form?.divisi]);

  const canEdit = canEditProjectByDivisi(project?.divisi);

  const handleSave = async () => {
    if (!canEdit) {
      alert("Anda tidak punya akses untuk mengubah project ini.");
      return;
    }
    if (!form.divisi) {
      alert("Pilih divisi tujuan (oper) dulu.");
      return;
    }
    setSaving(true);
    try {
      // Buat karyawan string dari karyawan_terlibat array (dipisahkan koma)
      const karyawanString = Array.isArray(form.karyawan_terlibat) && form.karyawan_terlibat.length > 0
        ? form.karyawan_terlibat.join(", ")
        : form.karyawan || "";

      await api.put(`/projek-kerja/${id}`, {
        divisi: form.divisi,
        jenis_pekerjaan: form.jenis_pekerjaan,
        karyawan: karyawanString,
        pic_karyawan: Array.isArray(form.karyawan_terlibat) && form.karyawan_terlibat.length > 0
          ? form.karyawan_terlibat[form.karyawan_terlibat.length - 1]
          : form.karyawan || "",
        karyawan_terlibat: form.karyawan_terlibat || [],
        alamat: form.alamat,
        status: form.status,
        start_date: form.start_date,
        problem_description: form.problem_description,
        barang_dibeli: form.barang_dibeli,
      });
      alert("Berhasil disimpan");
      navigate(-1);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join("\n")
          : null) ||
        "Gagal menyimpan perubahan project";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Memuat...</div>;
  }

  const addKaryawanTerlibat = () => {
    const n = karyawanInput.trim();
    if (!n) return;
    setForm((p) => {
      const list = Array.isArray(p.karyawan_terlibat) ? p.karyawan_terlibat : [];
      const exists = list.some((x) => String(x).toLowerCase() === n.toLowerCase());
      if (exists) return p;
      return { ...p, karyawan_terlibat: [...list, n] };
    });
    setKaryawanInput("");
  };

  const removeKaryawanTerlibat = (name) => {
    setForm((p) => ({
      ...p,
      karyawan_terlibat: (p.karyawan_terlibat || []).filter(
        (x) => String(x).toLowerCase() !== String(name).toLowerCase()
      ),
    }));
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Edit3 className="text-purple-600" />
            Edit Projek Kerja
          </h2>
          <p className="text-sm text-gray-500">
            Edit data projek dan oper ke divisi lain.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
      </div>

      {!canEdit ? (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          Anda tidak punya akses untuk mengubah project ini.
        </div>
      ) : null}

      <div className="bg-white border rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Divisi Tujuan (Oper)
            </label>
            <select
              value={form.divisi}
              onChange={(e) => setForm((p) => ({ ...p, divisi: e.target.value }))}
              className="border p-3 rounded-xl w-full"
              disabled={!canEdit || saving}
              required
            >
              <option value="">Pilih Divisi</option>
              <option value="IT">IT</option>
              <option value="Service">Service</option>
              <option value="Kontraktor">Kontraktor</option>
              <option value="Sales">Sales</option>
              <option value="Logistik">Logistik</option>
              <option value="Purchasing">Purchasing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="border p-3 rounded-xl w-full"
              disabled={!canEdit || saving}
            >
              <option value="Dibuat">Dibuat</option>
              <option value="Persiapan">Persiapan</option>
              <option value="Proses Pekerjaan">Proses Pekerjaan</option>
              <option value="Editing">Editing</option>
              <option value="Invoicing">Invoicing</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Jenis Pekerjaan
            </label>
            <input
              value={form.jenis_pekerjaan}
              onChange={(e) => setForm((p) => ({ ...p, jenis_pekerjaan: e.target.value }))}
              className="border p-3 rounded-xl w-full"
              disabled={!canEdit || saving}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Karyawan (Sales)
            </label>
            <input
              value={form.karyawan}
              className="border p-3 rounded-xl w-full bg-gray-100"
              disabled
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Karyawan Terlibat ({form?.divisi || project?.divisi || "-"})
            </label>
            <div className="flex gap-2">
              <input
                value={karyawanInput}
                onChange={(e) => setKaryawanInput(e.target.value)}
                list="pic-karyawan-list"
                placeholder={usersLoading ? "Memuat karyawan..." : `Tambah karyawan ${form?.divisi || project?.divisi || ""}`}
                className="border p-3 rounded-xl w-full"
                disabled={!canEdit || saving || usersLoading}
              />
              <button
                type="button"
                onClick={addKaryawanTerlibat}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-xl disabled:opacity-50"
                disabled={!canEdit || saving || usersLoading}
              >
                Tambah
              </button>
            </div>
            <datalist id="pic-karyawan-list">
              {usersByDivisi.map((u) => (
                <option key={u.id} value={(u?.name || u?.email || `#${u?.id}`).trim()} />
              ))}
            </datalist>
            <div className="mt-2 flex flex-wrap gap-2">
              {(form.karyawan_terlibat || []).map((nama) => (
                <span
                  key={nama}
                  className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs border border-blue-200"
                >
                  {nama}
                  <button
                    type="button"
                    onClick={() => removeKaryawanTerlibat(nama)}
                    className="text-red-600 hover:text-red-700"
                    disabled={!canEdit || saving}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              className="projek-kerja-date-input w-full min-w-0 max-w-full shrink rounded-xl border pl-3 pr-3 text-base leading-none outline-none focus:ring-2 focus:ring-blue-400/40"
              disabled={!canEdit || saving}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Lokasi
            </label>
            <input
              value={form.alamat}
              onChange={(e) => setForm((p) => ({ ...p, alamat: e.target.value }))}
              className="border p-3 rounded-xl w-full"
              disabled={!canEdit || saving}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Deskripsi
            </label>
            <textarea
              value={form.problem_description}
              onChange={(e) => setForm((p) => ({ ...p, problem_description: e.target.value }))}
              className="border p-3 rounded-xl w-full h-28"
              disabled={!canEdit || saving}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Barang yang Dibeli
            </label>
            <textarea
              value={form.barang_dibeli}
              onChange={(e) => setForm((p) => ({ ...p, barang_dibeli: e.target.value }))}
              className="border p-3 rounded-xl w-full h-24"
              disabled={!canEdit || saving}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
            disabled={saving}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canEdit || saving || !form.divisi}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
