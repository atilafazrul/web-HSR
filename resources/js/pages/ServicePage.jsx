import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, FileText, ListTodo } from "lucide-react";

export default function ServicePage() {

  const navigate = useNavigate();

  // =============================
  // AMBIL USER DARI LOCALSTORAGE
  // =============================
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  // =============================
  // DETEKSI ROLE
  // =============================
  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : "/admin";


  return (
    <div>

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">

        <button
          onClick={() => navigate(`${basePath}/dashboard`)}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
        >
          ← Kembali
        </button>

        <h2 className="text-3xl font-bold">
          Divisi Service
        </h2>

      </div>


      <p className="text-gray-500 mb-8">
        Kelola inventory, progres pekerjaan, dan riwayat servis
      </p>


      {/* CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


        {/* INVENTORY */}
        <Card
          icon={<Package size={30} className="text-blue-600" />}
          title="Inventory"
          desc="Kelola stok dan peralatan servis"
          onClick={() => navigate(`${basePath}/service/inventory`)}
        />


        {/* PROGRES */}
        <Card
          icon={<ListTodo size={30} className="text-green-600" />}
          title="Progres Pekerjaan"
          desc="Pantau status pekerjaan"
          onClick={() => navigate(`${basePath}/service/projek`)}
        />


        {/* DOKUMENTASI */}
        <Card
          icon={<FileText size={30} className="text-purple-600" />}
          title="Dokumentasi"
          desc="Dokumentasi servis"
          onClick={() => navigate(`${basePath}/service/riwayat`)}
        />


      </div>

    </div>
  );
}



/* CARD */
const Card = ({ icon, title, desc, onClick }) => {

  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-2xl shadow
      hover:shadow-xl transition cursor-pointer select-none"
    >

      <div className="mb-4">
        {icon}
      </div>

      <h3 className="text-xl font-semibold mb-2">
        {title}
      </h3>

      <p className="text-gray-500 text-sm">
        {desc}
      </p>

    </div>
  );
};