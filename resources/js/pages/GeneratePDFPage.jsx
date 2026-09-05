import React from "react";
import { useParams } from "react-router-dom";
import { usePdf } from "./generatepdf/usePdf";
import pdfForm from "./generatepdf/pdfform";
import DocumentationHistory from "./generatepdf/pdfHistory";
import BeritaAcaraTabBar from "./berita-acara/components/BeritaAcaraTabBar";
import { useI18n } from "../i18n";

export default function GeneratePDFPage({ user }) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const { projekId } = useParams();

  const {
    activeTab,
    setActiveTab,
    loading,
    searchTerm,
    setSearchTerm,
    formData,
    checkboxes,
    partsList,
    historyData,
    filteredHistory,
    historyAllCount,
    historyProjectCount,
    fetchingHistory,
    serviceTypeOptions,
    selectedItem,
    handleInputChange,
    handleSignatureChange,
    handleCheckboxChange,
    handlePartsChange,
    handleAddParts,
    handleRemoveParts,
    resetForm,
    handleSubmit,
    handleView,
    closeViewModal,
    handleGeneratePDF,
    handleEdit,
    cancelEdit,
    isEditing,
    fetchHistory,
    scheduleSectionProps,
    handleScheduleGenerate,
  } = usePdf(user, projekId);

  const handleTabChange = (tab) => {
    if (isEditing) {
      const message =
        tab === "form"
          ? tr("Anda sedang mengedit dokumen. Yakin ingin membatalkan dan membuat dokumen baru?", "You are editing a document. Are you sure you want to cancel and create a new one?")
          : tr("Anda sedang mengedit dokumen. Yakin ingin membatalkan dan melihat riwayat?", "You are editing a document. Are you sure you want to cancel and view history?");
      if (window.confirm(message)) {
        cancelEdit();
        setActiveTab(tab);
      }
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold">
              {isEditing ? "Edit Service Report" : "Generate Service Report"}
            </h2>
            <p className="text-gray-500">
              {isEditing
                ? tr("Edit dokumen", "Edit document")
                : tr("Buat dan kelola dokumen Service Report", "Create and manage Service Report documents")}
            </p>
          </div>
        </div>
      </div>

      <BeritaAcaraTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isEditing={isEditing}
        hasProject={Boolean(projekId)}
        allCount={historyAllCount}
        projectCount={historyProjectCount}
        tr={tr}
      />

      {/* CONTENT */}
      {activeTab === "form" ? (
        <div className="animate-fadeIn">
          {React.createElement(pdfForm, {
            formData,
            checkboxes,
            partsList,
            serviceTypeOptions,
            onInputChange: handleInputChange,
            onSignatureChange: handleSignatureChange,
            onCheckboxChange: handleCheckboxChange,
            onPartsChange: handlePartsChange,
            onAddParts: handleAddParts,
            onRemoveParts: handleRemoveParts,
            onSubmit: handleSubmit,
            onReset: isEditing ? cancelEdit : resetForm,
            loading,
            user,
            isEditing,
            scheduleSectionProps,
            onSchedule: handleScheduleGenerate,
          })}
        </div>
      ) : (
        <div className="animate-fadeIn">
          {fetchingHistory ? (
            <div className="bg-white rounded-3xl shadow-md p-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">{tr("Memuat riwayat dokumen...", "Loading document history...")}</p>
            </div>
          ) : (
            React.createElement(DocumentationHistory, {
              historyData,
              filteredHistory,
              searchTerm,
              onSearchChange: setSearchTerm,
              onView: handleView,
              closeViewModal,
              onGeneratePDF: handleGeneratePDF,
              onEdit: handleEdit,
              selectedItem,
            })
          )}
        </div>
      )}
    </div>
  );
}