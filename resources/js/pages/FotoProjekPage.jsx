import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axiosConfig";
import { compressImage } from "../utils/imageCompress";
import { useI18n } from "../i18n/index.jsx";

export default function FotoProjekPage() {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [fileFolders, setFileFolders] = useState([]);
  const [photoFolders, setPhotoFolders] = useState([]);
  const [selectedFileFolder, setSelectedFileFolder] = useState("");
  const [selectedPhotoFolder, setSelectedPhotoFolder] = useState("");
  const [newFileFolderName, setNewFileFolderName] = useState("");
  const [newPhotoFolderName, setNewPhotoFolderName] = useState("");
  const [projectTaskName, setProjectTaskName] = useState("");

  const fetchPhotos = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/projek-kerja/${id}/photos`
      );

      if (res.data.success) {
        setPhotos(res.data.photos || []);
      }

    } catch (err) {
      console.error("Gagal load foto:", err);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/projek-kerja/${id}/files`
      );

      if (res.data.success) {
        setFiles(res.data.files || []);
      }

    } catch (err) {
      console.error("Gagal load file:", err);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/projek-kerja/${id}/folders`
      );
      if (res.data?.success) {
        setFileFolders(res.data.file_folders || []);
        setPhotoFolders(res.data.photo_folders || []);
      }
    } catch (err) {
      console.error("Gagal load folder:", err);
    }
  };

  const fetchProjectDetail = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/projek-kerja/${id}`);
      if (res.data?.success) {
        const taskName = String(res.data?.data?.jenis_pekerjaan || "").trim();
        setProjectTaskName(taskName);
      }
    } catch (err) {
      console.error("Gagal load detail projek:", err);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchPhotos(),
      fetchFiles(),
      fetchFolders(),
      fetchProjectDetail(),
    ]).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const baseTitle = tr("Dokumentasi Projek", "Project Documentation");
    const fullTitle = projectTaskName ? `${baseTitle} - ${projectTaskName}` : baseTitle;
    document.title = `WEB HSR - ${fullTitle}`;
  }, [projectTaskName, language]);

  const getFolderFromUrl = (url, mediaRoot) => {
    const marker = `/storage/${mediaRoot}/${id}/`;
    const idx = String(url || "").indexOf(marker);
    if (idx < 0) return "";
    const relative = String(url).slice(idx + marker.length);
    const parts = relative.split("/").filter(Boolean);
    if (parts.length <= 1) return "";
    parts.pop();
    return parts.join("/");
  };

  const folderRouteState = useMemo(() => {
    const m = location.pathname.match(/\/projek-kerja\/foto\/[^/]+\/folder\/(file|photo)\/(.+)$/i);
    if (!m) return { inFolder: false, type: null, folder: "" };
    return {
      inFolder: true,
      type: String(m[1]).toLowerCase(),
      folder: decodeURIComponent(m[2] || ""),
    };
  }, [location.pathname]);

  const basePath = useMemo(() => {
    const idx = location.pathname.indexOf(`/projek-kerja/foto/${id}`);
    if (idx < 0) return "";
    return location.pathname.slice(0, idx);
  }, [location.pathname, id]);

  const divisiToPath = (divisi) => {
    const key = String(divisi || "").toLowerCase().trim();
    const map = {
      it: "it",
      service: "service",
      sales: "sales",
      kontraktor: "kontraktor",
      logistik: "logistik",
      purchasing: "purchasing",
    };
    return map[key] || "";
  };

  const backToProjekPath = useMemo(() => {
    const role = String(storedUser?.role || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
    const divisiPath = divisiToPath(storedUser?.divisi);
    if (role === "user" && divisiPath) return `/user/${divisiPath}/projek`;
    if (role === "admin" && divisiPath) return `/admin/${divisiPath}/projek`;
    if (role === "super_admin" && divisiPath) return `/super_admin/${divisiPath}/projek`;
    if (role === "super_admin") return "/super_admin/projek-kerja";
    if (role === "admin") return "/admin/dashboard";
    if (role === "user") return "/user/dashboard";
    return "/";
  }, [storedUser]);

  const openFolder = (type, folderName) => {
    if (!folderName) return;
    navigate(`${basePath}/projek-kerja/foto/${id}/folder/${type}/${encodeURIComponent(folderName)}`);
  };

  const goFolderHome = () => {
    navigate(`${basePath}/projek-kerja/foto/${id}`);
  };

  const getActiveFileFolderName = () => {
    if (folderRouteState.inFolder && folderRouteState.type === "file") {
      return folderRouteState.folder;
    }
    const fromInput = String(newFileFolderName || "").trim();
    if (fromInput) return fromInput;
    const fromSelect = String(selectedFileFolder || "").trim();
    return fromSelect || "";
  };

  const getActivePhotoFolderName = () => {
    if (folderRouteState.inFolder && folderRouteState.type === "photo") {
      return folderRouteState.folder;
    }
    const fromInput = String(newPhotoFolderName || "").trim();
    if (fromInput) return fromInput;
    const fromSelect = String(selectedPhotoFolder || "").trim();
    return fromSelect || "";
  };

  const handleCreateFolder = async (type) => {
    const folderName = String(
      type === "file" ? newFileFolderName : newPhotoFolderName
    ).trim();
    if (!folderName) {
      alert(tr("Isi nama folder dulu.", "Please enter folder name first."));
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/projek-kerja/${id}/folders`, {
        type,
        folder_name: folderName,
      });
      const finalFolderName = String(res?.data?.folder_name || folderName).trim();
      await fetchFolders();
      if (type === "file") {
        setSelectedFileFolder(finalFolderName);
        setNewFileFolderName("");
        if (!folderRouteState.inFolder) openFolder("file", finalFolderName);
      } else {
        setSelectedPhotoFolder(finalFolderName);
        setNewPhotoFolderName("");
        if (!folderRouteState.inFolder) openFolder("photo", finalFolderName);
      }
    } catch (err) {
      alert(err?.response?.data?.message || tr("Gagal membuat folder", "Failed to create folder"));
    }
  };

  const handleUploadPhoto = async (files) => {
    const fileArray = Array.isArray(files) ? files : [files].filter(Boolean);
    if (fileArray.length === 0) return;
    if (fileArray.length > 3) {
      alert(tr("Maksimal 3 foto per sekali upload.", "Maximum 3 photos per upload."));
      return;
    }

    const folderName = getActivePhotoFolderName();
    if (!folderName) {
      alert(tr("Buat atau pilih folder foto terlebih dahulu sebelum upload.", "Create or select photo folder before upload."));
      return;
    }

    setUploadBusy(true);
    try {
      const uploadPromises = fileArray.map(async (file) => {
        const ready = await compressImage(file);
        const formData = new FormData();
        formData.append("photo", ready);
        formData.append("folder_name", folderName);

        return axios.post(
          `${import.meta.env.VITE_API_URL}/projek-kerja/${id}/add-photo`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      });

      await Promise.all(uploadPromises);
      await fetchPhotos();
      await fetchFolders();
    } catch (err) {
      alert(tr("Gagal upload foto", "Failed to upload photo"));
    } finally {
      setUploadBusy(false);
    }
  };

  const handleUploadFile = async (files) => {
    const fileArray = Array.isArray(files) ? files : [files].filter(Boolean);
    if (fileArray.length === 0) return;
    if (fileArray.length > 3) {
      alert(tr("Maksimal 3 file per sekali upload.", "Maximum 3 files per upload."));
      return;
    }

    const folderName = getActiveFileFolderName();
    if (!folderName) {
      alert(tr("Buat atau pilih folder dokumen terlebih dahulu sebelum upload.", "Create or select document folder before upload."));
      return;
    }

    setUploadBusy(true);
    try {
      const uploadPromises = fileArray.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder_name", folderName);

        return axios.post(
          `${import.meta.env.VITE_API_URL}/projek-kerja/${id}/add-file`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      });

      await Promise.all(uploadPromises);
      await fetchFiles();
      await fetchFolders();
    } catch (err) {
      alert(tr("Gagal upload file", "Failed to upload file"));
    } finally {
      setUploadBusy(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm(tr("Hapus foto ini?", "Delete this photo?"))) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/projek-kerja/photo/${photoId}`
      );
      await fetchPhotos();
    } catch (err) {
      alert(tr("Gagal hapus foto", "Failed to delete photo"));
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm(tr("Hapus file ini?", "Delete this file?"))) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/projek-kerja/file/${fileId}`
      );
      await fetchFiles();
    } catch (err) {
      alert(tr("Gagal hapus file", "Failed to delete file"));
    }
  };

  if (loading) {
    return <div className="p-10 text-gray-500">Loading...</div>;
  }

  const currentFolder = folderRouteState.folder;
  const folderFiles = files.filter(
    (f) => getFolderFromUrl(f.url, "projek-kerja-files") === currentFolder
  );
  const folderPhotos = photos.filter(
    (p) => getFolderFromUrl(p.url, "projek-kerja-photos") === currentFolder
  );

  return (
    <div className="relative min-h-screen bg-slate-50">

      {uploadBusy && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg px-8 py-6 flex flex-col items-center gap-2 text-gray-700">
            <span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">{tr("Mengompres & mengunggah...", "Compressing & uploading...")}</p>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* HEADER */}
      <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {projectTaskName
              ? `${tr("Dokumentasi Projek", "Project Documentation")} - ${projectTaskName}`
              : tr("Dokumentasi Projek", "Project Documentation")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {tr("Kelola dokumen dan foto dokumentasi projek", "Manage project documentation files and photos")}
          </p>
        </div>
        <button
          onClick={() => (folderRouteState.inFolder ? goFolderHome() : navigate(backToProjekPath))}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {folderRouteState.inFolder ? tr("Kembali ke Folder", "Back to Folders") : tr("Kembali", "Back")}
        </button>
      </div>

      {!folderRouteState.inFolder ? (
        <>
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-slate-800">{tr("Folder Dokumen", "Document Folders")}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={newFileFolderName}
                onChange={(e) => setNewFileFolderName(e.target.value)}
                placeholder={tr("Buat folder dokumen baru", "Create new document folder")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 placeholder:text-slate-400 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => handleCreateFolder("file")}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                {tr("Buat Folder Dokumen", "Create Document Folder")}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {fileFolders.length === 0 ? (
                <p className="col-span-full rounded-lg bg-slate-50 p-3 text-sm text-slate-500">{tr("Belum ada folder dokumen.", "No document folders yet.")}</p>
              ) : (
                fileFolders.map((folder) => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => openFolder("file", folder)}
                    className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                  >
                    <span className="text-3xl leading-none">📁</span>
                    <span className="line-clamp-2 text-center text-xs font-medium text-slate-700 break-all">
                      {folder}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-slate-800">{tr("Folder Foto", "Photo Folders")}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={newPhotoFolderName}
                onChange={(e) => setNewPhotoFolderName(e.target.value)}
                placeholder={tr("Buat folder foto baru", "Create new photo folder")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 placeholder:text-slate-400 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => handleCreateFolder("photo")}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                {tr("Buat Folder Foto", "Create Photo Folder")}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {photoFolders.length === 0 ? (
                <p className="col-span-full rounded-lg bg-slate-50 p-3 text-sm text-slate-500">{tr("Belum ada folder foto.", "No photo folders yet.")}</p>
              ) : (
                photoFolders.map((folder) => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => openFolder("photo", folder)}
                    className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <span className="text-3xl leading-none">📁</span>
                    <span className="line-clamp-2 text-center text-xs font-medium text-slate-700 break-all">
                      {folder}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {tr("Folder", "Folder")}: {currentFolder}
            </h3>
            <p className="text-sm text-gray-500">
              {(folderRouteState.type === "file" ? tr("Dokumen", "Documents") : tr("Foto", "Photos"))} {tr("di dalam folder ini.", "inside this folder.")}
            </p>
          </div>

          {folderRouteState.type === "file" ? (
            <>
              <h2 className="mb-4 text-xl font-semibold text-slate-800">{tr("Dokumen Projek", "Project Documents")}</h2>
              <div className="space-y-4">
                {folderFiles.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                    {tr("Belum ada dokumen di folder ini.", "No documents in this folder yet.")}
                  </div>
                ) : folderFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 text-blue-600 p-3 rounded-lg text-xl">📄</div>
                      <div>
                        <p className="font-medium text-gray-800 break-all">{file.url.split("/").pop()}</p>
                        <p className="text-sm text-gray-400">{tr("File dokumentasi projek", "Project documentation file")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        {tr("Buka", "Open")}
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        {tr("Hapus", "Delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <label className="mt-4 flex h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white transition hover:border-blue-400 hover:bg-blue-50">
                <div className="text-4xl">⬆️</div>
                <p className="mt-2 text-slate-700">{tr("Upload File Dokumentasi", "Upload Documentation File")}</p>
                <p className="text-sm text-slate-400">{tr("Klik untuk memilih file", "Click to choose file")}</p>
                <input
                  type="file"
                  multiple
                  hidden
                  disabled={uploadBusy}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    e.target.value = "";
                    if (files.length > 3) {
                      alert(tr("Maksimal 3 file per sekali upload.", "Maximum 3 files per upload."));
                      return;
                    }
                    if (files.length > 0) await handleUploadFile(files);
                  }}
                />
              </label>
            </>
          ) : (
            <>
              <h2 className="mb-4 text-xl font-semibold text-slate-800">{tr("Foto Projek", "Project Photos")}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {folderPhotos.length === 0 ? (
                  <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                    {tr("Belum ada foto di folder ini.", "No photos in this folder yet.")}
                  </div>
                ) : folderPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <img src={photo.url} className="w-full h-48 object-cover" alt="projek" />
                    <div className="p-4 flex justify-between">
                      <a
                        href={photo.url}
                        download
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        {tr("Hapus", "Delete")}
                      </button>
                    </div>
                  </div>
                ))}
                <label className="flex h-56 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white transition hover:border-blue-400 hover:bg-blue-50">
                  <div className="text-center">
                    <div className="text-4xl">📷</div>
                    <p className="mt-2 text-slate-500">{tr("Tambah Foto", "Add Photo")}</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={uploadBusy}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      e.target.value = "";
                      if (files.length > 3) {
                        alert(tr("Maksimal 3 foto per sekali upload.", "Maximum 3 photos per upload."));
                        return;
                      }
                      if (files.length > 0) await handleUploadPhoto(files);
                    }}
                  />
                </label>
              </div>
            </>
          )}
        </>
      )}
      </div>
    </div>
  );
}