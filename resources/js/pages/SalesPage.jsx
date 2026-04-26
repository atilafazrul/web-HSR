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
            icon={<BarChart3 size={30} className="text-blue-600" />}
            title={language === "en" ? "Target" : "Target"}
            desc={language === "en" ? "Manage sales targets and performance" : "Kelola target dan performa penjualan"}
            onClick={() => navigate(`${basePath}/sales/target`)}
          />
        )}

        {/* PROGRES */}
        <Card
          icon={<ListTodo size={30} className="text-green-600" />}
          title={language === "en" ? "Work Progress" : "Progres Pekerjaan"}
          desc={language === "en" ? "Track sales status and progress" : "Pantau status dan perkembangan penjualan"}
          onClick={() => navigate(`${basePath}/sales/projek`)}
        />

        {!isUserRole && (
          <Card
            icon={<Archive size={30} className="text-amber-600" />}
            title={language === "en" ? "Work Archive" : "Archive Pekerjaan"}
            desc={language === "en" ? "View completed archived work" : "Lihat pekerjaan selesai yang sudah di-archive"}
            onClick={() => navigate(`${basePath}/sales/projek/archive`)}
          />
        )}

        {/* BUAT PDF */}
        {!isUserRole && (
          <Card
            icon={<FileText size={30} className="text-purple-600" />}
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
    className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition cursor-pointer"
  >

    <div className="mb-4">{icon}</div>

    <h3 className="text-xl font-semibold mb-2">
      {title}
    </h3>

    <p className="text-gray-500 text-sm">
      {desc}
    </p>

  </div>
);

export default SalesPage;