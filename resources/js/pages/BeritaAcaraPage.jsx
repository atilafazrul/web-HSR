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
          icon={<Wrench size={24} className="text-indigo-600" />}
          title="BAM"
          subtitle={tr("Berita Acara Maintenance", "Maintenance Minutes Report")}
          onClick={() => navigate(`${basePath}/berita-acara/bam`)}
        />

        {/* BAUF */}
        <Card
          icon={<ClipboardCheck size={24} className="text-indigo-600" />}
          title="BAUF"
          subtitle={tr("Berita Acara Uji Fungsi", "Function Test Minutes Report")}
          onClick={() => navigate(`${basePath}/berita-acara/bauf`)}
        />

        {/* BAST */}
        <Card
          icon={<FileText size={24} className="text-indigo-600" />}
          title="BAST"
          subtitle={tr("Berita Acara Serah Terima", "Handover Minutes Report")}
          onClick={() => navigate(`${basePath}/berita-acara/bast`)}
        />

        {/* SPPD */}
        <Card
          icon={<FileSignature size={24} className="text-indigo-600" />}
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
    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
  >
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
      {icon}
    </div>

    <h3 className="mb-1 text-xl font-semibold text-slate-800">
      {title}
    </h3>

    <p className="mb-3 text-sm text-slate-500">
      {subtitle}
    </p>

    <p className="text-sm text-slate-500">
      {desc}
    </p>
  </div>
);
