import React, { useState, useMemo } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { Settings2, Layers } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import {
  ALL_DIVISION_MODULES,
  useDivisis,
} from "../utils/divisiConfig.jsx";
import DivisiModuleModal from "../components/divisi/DivisiModuleModal.jsx";

export default function DynamicDivisiPage({ defaultSlug = null }) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { divisis, allDivisis, refreshDivisis } = useDivisis();
  const [showManageModal, setShowManageModal] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role;
  const isSuperAdmin = role === "super_admin";
  const isUserRole = role === "user";

  const basePath =
    role === "super_admin"
      ? "/super_admin"
      : role === "user"
        ? "/user"
        : "/admin";

  const resolvedSlug = useMemo(() => {
    if (defaultSlug) return String(defaultSlug).toLowerCase();
    if (params.divisiSlug) return String(params.divisiSlug).toLowerCase();
    const parts = location.pathname.split("/").filter(Boolean);
    return (parts[1] || "it").toLowerCase();
  }, [defaultSlug, params.divisiSlug, location.pathname]);

  const currentDivisi = useMemo(() => {
    const listToSearch = allDivisis?.length > 0 ? allDivisis : divisis;
    const found = listToSearch.find(
      (d) => String(d.slug || "").toLowerCase() === resolvedSlug
    );
    if (found) return found;
    return {
      name: resolvedSlug.toUpperCase(),
      slug: resolvedSlug,
      subtitle_id: `Kelola aset dan progres pekerjaan Divisi ${resolvedSlug.toUpperCase()}`,
      subtitle_en: `Manage assets and work progress for ${resolvedSlug.toUpperCase()} Division`,
      modules: ["inventory", "progres_pekerjaan", "archive_pekerjaan"],
    };
  }, [allDivisis, divisis, resolvedSlug]);

  const enabledModuleKeys = Array.isArray(currentDivisi.modules)
    ? currentDivisi.modules
    : ["inventory", "progres_pekerjaan", "archive_pekerjaan"];

  const visibleModules = ALL_DIVISION_MODULES.filter((mod) => {
    if (!enabledModuleKeys.includes(mod.key)) return false;
    if (isUserRole && !mod.allowUserRole) return false;
    return true;
  });

  const divTitle =
    language === "en"
      ? `${currentDivisi.name} Division`
      : `Divisi ${currentDivisi.name}`;

  const divSubtitle =
    language === "en"
      ? currentDivisi.subtitle_en || `Manage ${currentDivisi.name} assets and work progress`
      : currentDivisi.subtitle_id || `Kelola aset dan progres pekerjaan ${currentDivisi.name}`;

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{divTitle}</h2>
          <p className="mt-2 text-gray-500">{divSubtitle}</p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setShowManageModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 cursor-pointer"
          >
            <Settings2 size={16} className="text-indigo-600" />
            <span>{tr("Atur Modul Divisi", "Configure Division Modules")}</span>
          </button>
        )}
      </div>

      {/* MODULE CARDS (Gambar 1) */}
      {visibleModules.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {visibleModules.map((mod) => (
            <Card
              key={mod.key}
              icon={mod.icon(24)}
              title={language === "en" ? mod.titleEn : mod.titleId}
              desc={
                language === "en"
                  ? mod.descEn(currentDivisi.name)
                  : mod.descId(currentDivisi.name)
              }
              to={mod.getPath(basePath, currentDivisi.slug)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Layers size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-700">
            {tr("Belum Ada Modul yang Diaktifkan", "No Modules Enabled Yet")}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {tr(
              "Silakan klik tombol Atur Modul Divisi untuk menceklis modul yang ingin ditampilkan pada divisi ini.",
              "Click Configure Division Modules to check the modules you want to display in this division."
            )}
          </p>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setShowManageModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer"
            >
              <Settings2 size={15} />
              <span>{tr("Ceklis Modul Sekarang", "Check Modules Now")}</span>
            </button>
          )}
        </div>
      )}

      {/* MODAL EDIT MODUL & DIVISI (SUPER ADMIN) */}
      {isSuperAdmin && (
        <DivisiModuleModal
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
          mode="edit"
          initialDivisi={currentDivisi}
          divisis={allDivisis}
          onSuccess={(_freshList, resPayload) => {
            refreshDivisis();
            if (
              resPayload?.renamed &&
              resPayload?.new_slug &&
              resPayload.new_slug !== resolvedSlug
            ) {
              navigate(`${basePath}/${resPayload.new_slug}`, { replace: true });
            }
          }}
        />
      )}
    </div>
  );
}

const Card = ({ icon, title, desc, to, onClick }) => {
  const content = (
    <>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
        {icon}
      </div>

      <h3 className="mb-2 text-xl font-semibold text-slate-800">{title}</h3>

      <p className="text-sm text-slate-500">{desc}</p>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="block cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      {content}
    </div>
  );
};
