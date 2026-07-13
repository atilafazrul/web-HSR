import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, ClipboardCheck, Wrench, FileSignature, Receipt, ArrowLeft, ClipboardList } from "lucide-react";
import api from "../api/axiosConfig";
import { useI18n } from "../i18n";

export default function BeritaAcaraPage() {
  const navigate = useNavigate();
  const { projekId } = useParams();
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(Boolean(projekId));

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : "/admin";

  const beritaAcaraBase = projekId
    ? `${basePath}/projek-kerja/berita-acara/${projekId}`
    : `${basePath}/berita-acara`;

  useEffect(() => {
    if (!projekId) {
      setLoadingProject(false);
      return;
    }

    const fetchProject = async () => {
      setLoadingProject(true);
      try {
        const res = await api.get(`/projek-kerja/${projekId}`);
        setProject(res.data?.data || res.data);
      } catch (error) {
        console.error("Gagal memuat data projek:", error);
      } finally {
        setLoadingProject(false);
      }
    };

    fetchProject();
  }, [projekId]);

  const handleBackToProject = () => {
    const divisi = String(project?.divisi || "").toLowerCase();
    const divisiPath = ["it", "service", "sales", "kontraktor", "logistik", "purchasing"].includes(divisi)
      ? divisi
      : "it";
    navigate(`${basePath}/${divisiPath}/projek`);
  };

  return (
    <div>
      {projekId && (
        <button
          type="button"
          onClick={handleBackToProject}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          {tr("Kembali ke Data Projek Kerja", "Back to Project Data")}
        </button>
      )}

      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-3xl font-bold">
          {tr("Berita Acara", "Minutes Report")}
        </h2>
      </div>

      {projekId && (
        <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
          {loadingProject ? (
            <p className="text-sm text-indigo-700">{tr("Memuat data projek...", "Loading project data...")}</p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                {tr("Projek", "Project")}
              </p>
              <p className="text-base font-semibold text-slate-800">
                {project?.jenis_pekerjaan || tr("Projek tidak ditemukan", "Project not found")}
              </p>
              {project?.alamat && (
                <p className="text-sm text-slate-600">{project.alamat}</p>
              )}
            </>
          )}
        </div>
      )}

      <p className="text-gray-500 mb-8">
        {tr(
          "Pilih jenis berita acara yang ingin Anda buat atau kelola",
          "Choose the type of minutes report you want to create or manage"
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          icon={<Wrench size={24} className="text-indigo-600" />}
          title="BAM"
          subtitle={tr("Berita Acara Maintenance", "Maintenance Minutes Report")}
          onClick={() => navigate(`${beritaAcaraBase}/bam`)}
        />

        <Card
          icon={<ClipboardCheck size={24} className="text-indigo-600" />}
          title="BAUF"
          subtitle={tr("Berita Acara Uji Fungsi", "Function Test Minutes Report")}
          onClick={() => navigate(`${beritaAcaraBase}/bauf`)}
        />

        <Card
          icon={<FileText size={24} className="text-indigo-600" />}
          title="BAST"
          subtitle={tr("Berita Acara Serah Terima", "Handover Minutes Report")}
          onClick={() => navigate(`${beritaAcaraBase}/bast`)}
        />

        <Card
          icon={<FileSignature size={24} className="text-indigo-600" />}
          title="SPPD"
          subtitle={tr("Surat Perintah Perjalanan Dinas", "Official Travel Order")}
          onClick={() => navigate(`${beritaAcaraBase}/sppd`)}
        />

        <Card
          icon={<Receipt size={24} className="text-indigo-600" />}
          title="SPH"
          subtitle={tr("Surat Penawaran Harga", "Price Quotation Letter")}
          onClick={() => navigate(`${beritaAcaraBase}/sph`)}
        />

        <Card
          icon={<ClipboardList size={24} className="text-indigo-600" />}
          title="Service Report"
          subtitle={tr("Laporan Pekerjaan Servis", "Service Work Report")}
          onClick={() => navigate(`${beritaAcaraBase}/service-report`)}
        />
      </div>
    </div>
  );
}

const Card = ({ icon, title, subtitle, onClick }) => (
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

    <p className="text-sm text-slate-500">
      {subtitle}
    </p>
  </div>
);
