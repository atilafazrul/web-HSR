import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function FotoProjekPage() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= AMBIL FOTO =================
  const fetchPhotos = async () => {

    try {

      const res = await axios.get(
        `https://mansys.hsrsystem.com/api/projek-kerja/${id}/photos`
      );

      if (res.data.success) {
        setPhotos(res.data.photos);
      }

    } catch (err) {
      console.error("Gagal load foto:", err);
    }

  };


  // ================= AMBIL FILE =================
  const fetchFiles = async () => {

    try {

      const res = await axios.get(
        `https://mansys.hsrsystem.com/api/projek-kerja/${id}/files`
      );

      if (res.data.success) {
        setFiles(res.data.files);
      }

    } catch (err) {
      console.error("Gagal load file:", err);
    }

  };


  useEffect(() => {

    Promise.all([
      fetchPhotos(),
      fetchFiles()
    ]).finally(() => setLoading(false));

  }, [id]);


  // ================= TAMBAH FOTO =================
  const handleUploadPhoto = async (file) => {

    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {

      await axios.post(
        `https://mansys.hsrsystem.com/api/projek-kerja/${id}/add-photo`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      fetchPhotos();

    } catch (err) {
      alert("Gagal upload foto");
    }
  };


  // ================= TAMBAH FILE =================
  const handleUploadFile = async (file) => {

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {

      await axios.post(
        `https://mansys.hsrsystem.com/api/projek-kerja/${id}/add-file`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      fetchFiles();

    } catch (err) {
      alert("Gagal upload file");
    }
  };


  // ================= HAPUS FOTO =================
  const handleDeletePhoto = async (photoId) => {

    if (!window.confirm("Hapus foto ini?")) return;

    try {

      await axios.delete(
        `https://mansys.hsrsystem.com/api/projek-kerja/photo/${photoId}`
      );

      fetchPhotos();

    } catch (err) {
      alert("Gagal hapus foto");
    }
  };


  // ================= HAPUS FILE =================
  const handleDeleteFile = async (fileId) => {

    if (!window.confirm("Hapus file ini?")) return;

    try {

      await axios.delete(
        `https://mansys.hsrsystem.com/api/projek-kerja/file/${fileId}`
      );

      fetchFiles();

    } catch (err) {
      alert("Gagal hapus file");
    }
  };


  if (loading) {
    return <div className="p-10 text-gray-500">Loading...</div>;
  }


  return (
    <div className="p-10 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Dokumentasi Projek
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola dokumen dan foto dokumentasi projek
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-lg transition"
        >
          Kembali
        </button>

      </div>


      {/* ================= FILE DOKUMEN ================= */}

      <h2 className="text-2xl font-semibold mb-6 text-gray-700">
        Dokumen Projek
      </h2>

      <div className="space-y-4">

        {files.map(file => (

          <div
            key={file.id}
            className="flex items-center justify-between bg-white shadow-sm hover:shadow-md rounded-xl p-4 transition"
          >

            <div className="flex items-center gap-4">

              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg text-xl">
                📄
              </div>

              <div>
                <p className="font-medium text-gray-800 break-all">
                  {file.url.split('/').pop()}
                </p>

                <p className="text-sm text-gray-400">
                  File dokumentasi projek
                </p>
              </div>

            </div>

            <div className="flex gap-2">

              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
              >
                Buka
              </a>

              <button
                onClick={() => handleDeleteFile(file.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
              >
                Hapus
              </button>

            </div>

          </div>

        ))}

      </div>


      {/* Upload File */}

      <label className="mt-6 border-2 border-dashed border-gray-300 rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">

        <div className="text-4xl">
          ⬆️
        </div>

        <p className="text-gray-600 mt-2">
          Upload File Dokumentasi
        </p>

        <p className="text-sm text-gray-400">
          Klik untuk memilih file
        </p>

        <input
          type="file"
          hidden
          onChange={(e) =>
            handleUploadFile(e.target.files[0])
          }
        />

      </label>



      {/* ================= FOTO ================= */}

      <h2 className="text-2xl font-semibold mt-16 mb-6 text-gray-700">
        Foto Projek
      </h2>


      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {photos.map(photo => (

          <div
            key={photo.id}
            className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
          >

            <img
              src={photo.url}
              className="w-full h-48 object-cover"
              alt="projek"
            />

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
                Hapus
              </button>

            </div>

          </div>

        ))}


        {/* Upload Foto */}

        <label className="border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer h-56 hover:border-blue-400 hover:bg-blue-50 transition">

          <div className="text-center">

            <div className="text-4xl">
              📷
            </div>

            <p className="text-gray-500 mt-2">
              Tambah Foto
            </p>

          </div>

          <input
            type="file"
            hidden
            onChange={(e) =>
              handleUploadPhoto(e.target.files[0])
            }
          />

        </label>

      </div>

    </div>
  );
}