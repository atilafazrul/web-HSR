import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ClipboardCheck, Wrench, FileSignature } from "lucide-react";
import { useI18n } from "../i18n";

export default function BeritaAcaraPage() {
  const navigate = useNavigate();
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);

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
          {tr("Berita Acara", "Minutes Report")}
        </h2>
      </div>

      <p className="text-gray-500 mb-8">
        {tr(
          "Pilih jenis berita acara yang ingin Anda buat atau kelola",
          "Choose the type of minutes report you want to create or manage"
        )}
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BAM */}
        <Card
          icon={<Wrench size={30} className="text-purple-600" />}
          title="BAM"
          subtitle={tr("Berita Acara Maintenance", "Maintenance Minutes Report")}
          onClick={() => navigate(`${basePath}/berita-acara/bam`)}
        />

        {/* BAUF */}
        <Card
          icon={<ClipboardCheck size={30} className="text-blue-600" />}
          title="BAUF"
          subtitle={tr("Berita Acara Uji Fungsi", "Function Test Minutes Report")}
          onClick={() => navigate(`${basePath}/berita-acara/bauf`)}
        />

        {/* BAST */}
        <Card
          icon={<FileText size={30} className="text-green-600" />}
          title="BAST"
          subtitle={tr("Berita Acara Serah Terima", "Handover Minutes Report")}
          onClick={() => navigate(`${basePath}/berita-acara/bast`)}
        />

        {/* SPPD */}
        <Card
          icon={<FileSignature size={30} className="text-orange-600" />}
          title="SPPD"
          subtitle={tr("Surat Perintah Perjalanan Dinas", "Official Travel Order")}
          onClick={() => navigate(`${basePath}/berita-acara/sppd`)}
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
