import React from "react";
import { useNavigate } from "react-router-dom";
import { Archive, BarChart3, FileText, ListTodo } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";

const SalesPage = () => {
  const { language } = useI18n();

  const navigate = useNavigate();

  // =============================
  // AMBIL USER DARI LOCALSTORAGE
  // =============================
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

        <h2 className="text-3xl font-bold">
          {language === "en" ? "Sales Division" : "Divisi Sales"}
        </h2>
      </div>


      <p className="text-gray-500 mb-8">
        {language === "en"
          ? "Manage targets, work progress, and sales documentation"
          : "Kelola target, progres pekerjaan, dan dokumentasi penjualan"}
      </p>


      {/* CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* TARGET */}
        {!isUserRole && (
          <Card
            icon={<BarChart3 size={24} className="text-indigo-600" />}
            title={language === "en" ? "Target" : "Target"}
            desc={language === "en" ? "Manage sales targets and performance" : "Kelola target dan performa penjualan"}
            onClick={() => navigate(`${basePath}/sales/target`)}
          />
        )}

        {/* PROGRES */}
        <Card
          icon={<ListTodo size={24} className="text-indigo-600" />}
          title={language === "en" ? "Work Progress" : "Progres Pekerjaan"}
          desc={language === "en" ? "Track sales status and progress" : "Pantau status dan perkembangan penjualan"}
          onClick={() => navigate(`${basePath}/sales/projek`)}
        />

        {!isUserRole && (
          <Card
            icon={<Archive size={24} className="text-indigo-600" />}
            title={language === "en" ? "Work Archive" : "Archive Pekerjaan"}
            desc={language === "en" ? "View completed archived work" : "Lihat pekerjaan selesai yang sudah di-archive"}
            onClick={() => navigate(`${basePath}/sales/projek/archive`)}
          />
        )}

        {/* BUAT PDF */}
        {!isUserRole && (
          <Card
            icon={<FileText size={24} className="text-indigo-600" />}
            title={language === "en" ? "Create PDF" : "Buat PDF"}
            desc={language === "en" ? "Generate sales work PDF" : "Buat PDF pekerjaan sales"}
            onClick={() => navigate(`${basePath}/sales/buat-pdf`)}
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

export default SalesPage;