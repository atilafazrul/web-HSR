import React from "react";
import { FolderOpen, History, Plus } from "lucide-react";

export default function BeritaAcaraTabBar({
  activeTab,
  onTabChange,
  isEditing,
  hasProject = false,
  allCount = 0,
  projectCount = 0,
  tr,
}) {
  const tabClass = (tab) =>
    `flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition ${
      activeTab === tab ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button type="button" onClick={() => onTabChange("form")} className={tabClass("form")}>
        <Plus size={18} />
        {isEditing ? tr("Edit Dokumen", "Edit Document") : tr("Buat Baru", "Create New")}
      </button>
      <button type="button" onClick={() => onTabChange("history")} className={tabClass("history")}>
        <History size={18} />
        {hasProject
          ? `${tr("Riwayat Keseluruhan", "All History")} (${allCount})`
          : `${tr("Riwayat", "History")} (${allCount})`}
      </button>
      {hasProject ? (
        <button
          type="button"
          onClick={() => onTabChange("history-project")}
          className={tabClass("history-project")}
        >
          <FolderOpen size={18} />
          {tr("Riwayat Projek", "Project History")} ({projectCount})
        </button>
      ) : null}
    </div>
  );
}
