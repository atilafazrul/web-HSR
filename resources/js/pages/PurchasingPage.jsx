import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Package, ListTodo, Archive } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";

const PurchasingPage = () => {
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
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold">{language === "en" ? "Purchasing Division" : "Divisi Purchasing"}</h2>
      </div>

      <p className="text-gray-500 mb-8">
        {language === "en"
          ? "Manage procurement, work progress, and purchasing documentation"
          : "Kelola pengadaan, progres pekerjaan, dan dokumentasi purchasing"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          icon={<ListTodo size={30} className="text-green-600" />}
          title={language === "en" ? "Work Progress" : "Progres Pekerjaan"}
          desc={language === "en" ? "Track purchasing status and progress" : "Pantau status dan perkembangan purchasing"}
          onClick={() => navigate(`${basePath}/purchasing/projek`)}
        />
        {!isUserRole && (
          <Card
            icon={<Archive size={30} className="text-amber-600" />}
            title={language === "en" ? "Work Archive" : "Archive Pekerjaan"}
            desc={language === "en" ? "View completed archived work" : "Lihat pekerjaan selesai yang sudah di-archive"}
            onClick={() => navigate(`${basePath}/purchasing/projek/archive`)}
          />
        )}
        {!isUserRole && (
          <Card
            icon={<ShoppingCart size={30} className="text-blue-600" />}
            title={language === "en" ? "Purchases" : "Pembelian"}
            desc={language === "en" ? "Manage item purchases" : "Kelola pembelian barang"}
            onClick={() => navigate(`${basePath}/purchasing/pembelian`)}
          />
        )}
      </div>
    </div>
  );
};

const Card = ({ icon, title, desc, onClick }) => (
  <div onClick={onClick} className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition cursor-pointer">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-500 text-sm">{desc}</p>
  </div>
);

export default PurchasingPage;
