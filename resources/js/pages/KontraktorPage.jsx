import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ListTodo,
  Archive,
  FilePlus2,
  ClipboardList,
  CalendarDays,
} from "lucide-react";
import { useI18n } from "../i18n/index.jsx";

const KontraktorPage = () => {
  const { language } = useI18n();

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
  const isUserRole = role === "user";

  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : role === "user"
        ? "/user"
        : "/admin";

  return (
    <div>

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">

        {/*
        <button
          onClick={() => navigate(`${basePath}/dashboard`)}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
        >
          ← Kembali
        </button>
        */}

        <h2 className="text-3xl font-bold">
          {language === "en" ? "Contractor Division" : "Divisi Kontraktor"}
        </h2>
      </div>

      <p className="text-gray-500 mb-8">
        {language === "en" ? "Manage contractor inventory and work progress" : "Kelola inventory dan progres pekerjaan kontraktor"}
      </p>

      {/* CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* INVENTORY */}
        {!isUserRole && (
          <Card
            icon={<Package size={24} className="text-indigo-600" />}
            title="Inventory"
            desc={language === "en" ? "Manage contractor stock and equipment" : "Kelola stok dan peralatan kontraktor"}
            onClick={() => navigate(`${basePath}/kontraktor/inventory`)}
          />
        )}

        {/* PROGRES */}
        <Card
          icon={<ListTodo size={24} className="text-indigo-600" />}
          title={language === "en" ? "Work Progress" : "Progres Pekerjaan"}
          desc={language === "en" ? "Track project status and progress" : "Pantau status dan perkembangan proyek"}
          onClick={() => navigate(`${basePath}/kontraktor/projek`)}
        />

        {!isUserRole && (
          <Card
            icon={<Archive size={24} className="text-indigo-600" />}
            title={language === "en" ? "Work Archive" : "Archive Pekerjaan"}
            desc={language === "en" ? "View completed archived work" : "Lihat pekerjaan selesai yang sudah di-archive"}
            onClick={() => navigate(`${basePath}/kontraktor/projek/archive`)}
          />
        )}

        {/* FORM RFI */}
        {!isUserRole && (
          <Card
            icon={<FilePlus2 size={24} className="text-indigo-600" />}
            title={language === "en" ? "Form RFI" : "Form RFI"}
            desc={language === "en" ? "Fill the RFI template and download" : "Isi template RFI dan unduh Excel"}
            onClick={() => navigate(`${basePath}/kontraktor/rfi`)}
          />
        )}

        {!isUserRole && (
          <Card
            icon={<ClipboardList size={24} className="text-indigo-600" />}
            title={language === "en" ? "Work Checklist Planning" : "Form Work Checklist Planning"}
            desc={
              language === "en"
                ? "Fill planning checklist and export Excel/PDF"
                : "Isi checklist planning dan unduh Excel/PDF"
            }
            onClick={() => navigate(`${basePath}/kontraktor/work-checklist/planning`)}
          />
        )}

        {!isUserRole && (
          <Card
            icon={<ClipboardList size={24} className="text-indigo-600" />}
            title={language === "en" ? "Work Checklist Realisasi" : "Form Work Checklist Realisasi"}
            desc={
              language === "en"
                ? "Fill realization checklist and export Excel/PDF"
                : "Isi checklist realisasi dan unduh Excel/PDF"
            }
            onClick={() => navigate(`${basePath}/kontraktor/work-checklist/realisasi`)}
          />
        )}

        {!isUserRole && (
          <Card
            icon={<CalendarDays size={24} className="text-indigo-600" />}
            title={language === "en" ? "Daily Report" : "Daily Report"}
            desc={
              language === "en"
                ? "Fill daily site report and export Excel/PDF"
                : "Isi laporan harian proyek dan unduh Excel/PDF"
            }
            onClick={() => navigate(`${basePath}/kontraktor/daily-report`)}
          />
        )}

      </div>
    </div>
  );
};


/* CARD */
const Card = ({ icon, title, desc, onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
  >
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">{icon}</div>

    <h3 className="mb-2 text-xl font-semibold text-slate-800">
      {title}
    </h3>

    <p className="text-sm text-slate-500">
      {desc}
    </p>
  </div>
);

export default KontraktorPage;