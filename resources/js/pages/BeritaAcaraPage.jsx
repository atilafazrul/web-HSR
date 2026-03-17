import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ClipboardCheck } from "lucide-react";

export default function BeritaAcaraPage() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : "/admin";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold">
          Berita Acara
        </h2>
      </div>

      <p className="text-gray-500 mb-8">
        Pilih jenis berita acara yang ingin Anda buat atau kelola
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BAUF */}
        <Card
          icon={<ClipboardCheck size={30} className="text-blue-600" />}
          title="BAUF"
          subtitle="Berita Acara Uji Fungsi"
          onClick={() => navigate(`${basePath}/berita-acara/bauf`)}
        />

        {/* BAST */}
        <Card
          icon={<FileText size={30} className="text-green-600" />}
          title="BAST"
          subtitle="Berita Acara Serah Terima"
          onClick={() => navigate(`${basePath}/berita-acara/bast`)}
        />
      </div>
    </div>
  );
}

/* CARD COMPONENT */
const Card = ({ icon, title, subtitle, desc, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition cursor-pointer"
  >
    <div className="mb-4">
      {icon}
    </div>

    <h3 className="text-xl font-semibold mb-1">
      {title}
    </h3>

    <p className="text-sm text-gray-500 mb-3">
      {subtitle}
    </p>

    <p className="text-gray-500 text-sm">
      {desc}
    </p>
  </div>
);
