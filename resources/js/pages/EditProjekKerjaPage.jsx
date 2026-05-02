import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosConfig";
import { Edit3, ArrowLeft } from "lucide-react";
import { useI18n } from "../i18n";
import { DashboardSurface, DashboardSectionHeading } from "../components/dashboard/DashboardPrimitives.jsx";

const projekField =
  "w-full rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15";
const projekFieldReadonly =
  "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600";

export default function EditProjekKerjaPage() {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
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
  const [userAccountOptions, setUserAccountOptions] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [karyawanInput, setKaryawanInput] = useState("");
  const [inviteUserInput, setInviteUserInput] = useState("");
  const [inviteUserError, setInviteUserError] = useState("");
  const [form, setForm] = useState({
    divisi: "",
    jenis_pekerjaan: "",
    karyawan: "",
    pic_karyawan: "",
    karyawan_terlibat: [],
    invited_user_ids: [],
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
          invited_user_ids: Array.isArray(data?.invited_user_ids)
            ? data.invited_user_ids.map((v) => String(v || "").trim()).filter((v) => v !== "")
            : [],
          alamat: data?.alamat || "",
          status: data?.status || "Dibuat",
          start_date: data?.start_date ? String(data.start_date).split("T")[0] : "",
          problem_description: data?.problem_description || "",
          barang_dibeli: data?.barang_dibeli || "",
        });
      } catch (err) {
      const msg = err.response?.data?.message || tr("Gagal memuat data project", "Failed to load project data");
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
      setUsersLoading(true);
      try {
        const res = await api.get("/karyawan");
        const users = res.data?.data || res.data || [];
        const adminOnly = users.filter((u) => {
          const roleName = String(u?.role || "")
            .toLowerCase()
            .trim()
            .replace(/[\s-]+/g, "_");
          return roleName === "admin";
        });
        const allKaryawan = adminOnly.filter((u) => String(u?.name || u?.email || "").trim() !== "");
        const userOnly = users.filter((u) => {
          const roleName = String(u?.role || "")
            .toLowerCase()
            .trim()
            .replace(/[\s-]+/g, "_");
          return roleName === "user";
        });
        setUsersByDivisi(allKaryawan);
        setUserAccountOptions(userOnly);
      } catch (err) {
        console.error("Fetch users by divisi error:", err);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const canEdit = canEditProjectByDivisi(project?.divisi);

  const handleSave = async () => {
    if (!canEdit) {
      alert(tr("Anda tidak punya akses untuk mengubah project ini.", "You do not have access to edit this project."));
      return;
    }
    if (!form.divisi) {
      alert(tr("Pilih divisi tujuan (oper) dulu.", "Please select target division first."));
      return;
    }
    setSaving(true);
    try {
      const finalInvitedNames = getFinalInvitedNamesForSave();
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
        invited_user_ids: finalInvitedNames,
        alamat: form.alamat,
        status: form.status,
        start_date: form.start_date,
        problem_description: form.problem_description,
        barang_dibeli: form.barang_dibeli,
      });
      alert(tr("Berhasil disimpan", "Saved successfully"));
      navigate(-1);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join("\n")
          : null) ||
        tr("Gagal menyimpan perubahan project", "Failed to save project changes");
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-3 p-4 sm:p-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200/80" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
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

  const inviteDisplayName = (u) => (u?.name || u?.email || `#${u?.id}`).trim();

  const addInviteUser = () => {
    const keyword = inviteUserInput.trim();
    if (!keyword) return;

    const match = userAccountOptions.find(
      (u) => inviteDisplayName(u).toLowerCase() === keyword.toLowerCase()
    );
    if (!match) {
      setInviteUserError(tr("Pilih akun user dari daftar", "Select a user account from the list"));
      return;
    }

    setForm((prev) => {
      const nextNames = Array.isArray(prev.invited_user_ids) ? [...prev.invited_user_ids] : [];
      const selectedName = inviteDisplayName(match);
      if (nextNames.some((name) => String(name).toLowerCase() === selectedName.toLowerCase())) {
        setInviteUserError(tr("Akun user ini sudah di-invite", "This user account is already invited"));
        return prev;
      }
      setInviteUserError("");
      return { ...prev, invited_user_ids: [...nextNames, selectedName] };
    });
    setInviteUserInput("");
  };

  const removeInviteUser = (name) => {
    setForm((prev) => ({
      ...prev,
      invited_user_ids: (prev.invited_user_ids || []).filter(
        (item) => String(item).toLowerCase() !== String(name).toLowerCase()
      ),
    }));
  };

  const getFinalInvitedNamesForSave = () => {
    const current = Array.isArray(form.invited_user_ids) ? [...form.invited_user_ids] : [];
    const pending = inviteUserInput.trim();
    if (pending) {
      const match = userAccountOptions.find(
        (u) => inviteDisplayName(u).toLowerCase() === pending.toLowerCase()
      );
      if (match) {
        const selectedName = inviteDisplayName(match);
        const exists = current.some((name) => String(name).toLowerCase() === selectedName.toLowerCase());
        if (!exists) current.push(selectedName);
      }
    }
    return current
      .map((name) => String(name || "").trim())
      .filter((name) => name !== "");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-indigo-500/10 ring-1 ring-violet-500/20">
            <Edit3 size={22} className="text-violet-700" />
          </div>
          <DashboardSectionHeading
            className="!mb-0"
            title={tr("Edit Projek Kerja", "Edit Project")}
            subtitle={tr("Edit data projek dan oper ke divisi lain.", "Edit project data and transfer it to another division.")}
          />
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          {tr("Kembali", "Back")}
        </button>
      </div>

      {!canEdit ? (
        <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
          {tr("Anda tidak punya akses untuk mengubah project ini.", "You do not have access to edit this project.")}
        </div>
      ) : null}

      <DashboardSurface className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tr("Divisi Tujuan (Oper)", "Target Division (Transfer)")}
            </label>
            <select
              value={form.divisi}
              onChange={(e) => setForm((p) => ({ ...p, divisi: e.target.value }))}
              className={projekField}
              disabled={!canEdit || saving}
              required
            >
              <option value="">{tr("Pilih Divisi", "Select Division")}</option>
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
              {tr("Status", "Status")}
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className={projekField}
              disabled={!canEdit || saving}
            >
              <option value="Dibuat">{tr("Dibuat", "Created")}</option>
              <option value="Persiapan">{tr("Persiapan", "Preparation")}</option>
              <option value="Proses Pekerjaan">{tr("Proses Pekerjaan", "Work In Progress")}</option>
              <option value="Editing">Editing</option>
              <option value="Invoicing">Invoicing</option>
              <option value="Selesai">{tr("Selesai", "Completed")}</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tr("Jenis Pekerjaan", "Work Type")}
            </label>
            <input
              value={form.jenis_pekerjaan}
              onChange={(e) => setForm((p) => ({ ...p, jenis_pekerjaan: e.target.value }))}
              className={projekField}
              disabled={!canEdit || saving}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tr("Karyawan (Sales)", "Employee (Sales)")}
            </label>
            <input
              value={form.karyawan}
              className={projekFieldReadonly}
              disabled
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tr("Karyawan Terlibat", "Involved Employees")} ({tr("Semua Divisi", "All Divisions")})
            </label>
            <div className="flex gap-2">
              <select
                value={karyawanInput}
                onChange={(e) => setKaryawanInput(e.target.value)}
                className={projekField}
                disabled={!canEdit || saving || usersLoading}
              >
                <option value="">{usersLoading ? tr("Memuat karyawan...", "Loading employees...") : tr("Pilih karyawan", "Select employee")}</option>
                {usersByDivisi.map((u) => (
                  <option key={u.id} value={(u?.name || u?.email || `#${u?.id}`).trim()}>
                    {`${u?.name || u?.email || `#${u?.id}`}${u?.divisi ? ` (${u.divisi})` : ""}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addKaryawanTerlibat}
                className="rounded-xl bg-indigo-600 px-4 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                disabled={!canEdit || saving || usersLoading || !karyawanInput}
              >
                {tr("Tambah", "Add")}
              </button>
            </div>
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
              {tr("Invite User (Monitoring)", "Invite User (Monitoring)")}
            </label>
            <div className="flex gap-2">
              <select
                value={inviteUserInput}
                onChange={(e) => setInviteUserInput(e.target.value)}
                className={projekField}
                disabled={!canEdit || saving || usersLoading}
              >
                <option value="">{usersLoading ? tr("Memuat akun user...", "Loading user accounts...") : tr("Pilih akun user", "Select user account")}</option>
                {userAccountOptions.map((u) => (
                  <option key={u.id} value={inviteDisplayName(u)}>
                    {inviteDisplayName(u)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addInviteUser}
                className="rounded-xl bg-indigo-600 px-4 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                disabled={!canEdit || saving || usersLoading || !inviteUserInput}
              >
                Invite
              </button>
            </div>
            {inviteUserError ? (
              <p className="text-[11px] text-red-600 mt-1">{inviteUserError}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {(form.invited_user_ids || []).map((name) => {
                return (
                  <span
                    key={name}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs border border-indigo-200"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeInviteUser(name)}
                      className="text-red-600 hover:text-red-700"
                      disabled={!canEdit || saving}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tr("Tanggal", "Date")}
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              className={`projek-kerja-date-input ${projekField} min-w-0 max-w-full shrink pl-3 pr-3 text-base leading-none`}
              disabled={!canEdit || saving}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tr("Lokasi", "Location")}
            </label>
            <input
              value={form.alamat}
              onChange={(e) => setForm((p) => ({ ...p, alamat: e.target.value }))}
              className={projekField}
              disabled={!canEdit || saving}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tr("Deskripsi", "Description")}
            </label>
            <textarea
              value={form.problem_description}
              onChange={(e) => setForm((p) => ({ ...p, problem_description: e.target.value }))}
              className={`${projekField} h-28 resize-y`}
              disabled={!canEdit || saving}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tr("Barang yang Dibeli", "Purchased Items")}
            </label>
            <textarea
              value={form.barang_dibeli}
              onChange={(e) => setForm((p) => ({ ...p, barang_dibeli: e.target.value }))}
              className={`${projekField} h-24 resize-y`}
              disabled={!canEdit || saving}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            disabled={saving}
          >
            {tr("Batal", "Cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-900/15 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || saving || !form.divisi}
          >
            {saving ? tr("Menyimpan...", "Saving...") : tr("Simpan", "Save")}
          </button>
        </div>
      </DashboardSurface>
    </div>
  );
}
