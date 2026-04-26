import React from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import {
  Package,
  ListTodo,
  FileText,
  Archive
} from "lucide-react";

const ServicePage = () => {
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

        <h2 className="text-3xl font-bold">
          {language === "en" ? "Service Division" : "Divisi Service"}
        </h2>

      </div>

      <p className="text-gray-500 mb-8">
        {language === "en" ? "Manage inventory and service jobs" : "Kelola inventory dan pekerjaan servis"}
      </p>

      {/* CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* INVENTORY */}
        {!isUserRole && (
          <Card
            icon={<Package size={30} className="text-blue-600" />}
            title="Inventory"
            desc={language === "en" ? "Manage service stock and equipment" : "Kelola stok dan peralatan servis"}
            onClick={() => navigate(`${basePath}/service/inventory`)}
          />
        )}

        {/* PROGRES */}
        <Card
          icon={<ListTodo size={30} className="text-green-600" />}
          title={language === "en" ? "Work Progress" : "Progres Pekerjaan"}
          desc={language === "en" ? "Track service work status" : "Pantau status pekerjaan servis"}
          onClick={() => navigate(`${basePath}/service/projek`)}
        />

        {!isUserRole && (
          <Card
            icon={<Archive size={30} className="text-amber-600" />}
            title={language === "en" ? "Work Archive" : "Archive Pekerjaan"}
            desc={language === "en" ? "View completed archived work" : "Lihat pekerjaan selesai yang sudah di-archive"}
            onClick={() => navigate(`${basePath}/service/projek/archive`)}
          />
        )}


        {/* BUAT PDF */}
        {!isUserRole && (
          <Card
            icon={<FileText size={30} className="text-purple-600" />}
            title={language === "en" ? "Create PDF" : "Buat PDF"}
            desc={language === "en" ? "Generate service work PDF" : "Buat PDF pekerjaan servis"}
            onClick={() => navigate(`${basePath}/service/buat-pdf`)}
          />
        )}

      </div>

    </div>
  );
};


/* CARD COMPONENT */
const Card = ({ icon, title, desc, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition cursor-pointer"
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

export default ServicePage;