import React from "react";
import { useParams } from "react-router-dom";
import { useSPPD } from "./hooks/useSPPD";
import { SPPDForm } from "./components/forms/SPPDForm";
import { SPPDHistory } from "./components/history/SPPDHistory";
import BeritaAcaraTabBar from "./components/BeritaAcaraTabBar";
import { useI18n } from "../../i18n";

export default function SPPDPage() {
  const { projekId } = useParams();
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const {
    activeTab,
    setActiveTab,
    loading,
    fetchingNomor,
    nextNomorSurat,
    searchTerm,
    setSearchTerm,
    formData,
    filteredHistory,
    historyAllCount,
    historyProjectCount,
    selectedItem,
    showViewModal,
    isEditing,
    handleInputChange,
    handleSignatureChange,
    resetForm,
    handleSubmit,
    handleView,
    closeViewModal,
    handleGeneratePDF,
    handleDelete,
    handleEdit,
    cancelEdit,
    scheduleSectionProps,
    handleScheduleGenerate,
  } = useSPPD(projekId);

  const handleTabChange = (tab) => {
    if (isEditing) {
      if (window.confirm(tr("Anda sedang mengedit dokumen. Yakin ingin membatalkan?", "You are editing a document. Are you sure you want to cancel?"))) {
        cancelEdit();
        setActiveTab(tab);
      }
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">{isEditing ? "Edit SPPD" : "Generate SPPD"}</h2>
          <p className="text-gray-500">
            {isEditing
              ? tr("Perbarui data dokumen SPPD", "Update SPPD document data")
              : tr("Buat dan kelola dokumen Surat Perintah Perjalanan Dinas", "Create and manage Official Travel Order documents")}
          </p>
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

      <div className="animate-fadeIn">
        {activeTab === "form" ? (
          <SPPDForm
            formData={formData}
            onInputChange={handleInputChange}
            onSignatureChange={handleSignatureChange}
            onSubmit={handleSubmit}
            onReset={isEditing ? cancelEdit : resetForm}
            loading={loading}
            nextNomorSurat={nextNomorSurat}
            fetchingNomor={fetchingNomor}
            isEditing={isEditing}
            scheduleSectionProps={scheduleSectionProps}
            onScheduleGenerate={handleScheduleGenerate}
          />
        ) : (
          <SPPDHistory
            filteredHistory={filteredHistory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onView={handleView}
            onGeneratePDF={handleGeneratePDF}
            onDelete={handleDelete}
            onEdit={handleEdit}
            selectedItem={selectedItem}
            showViewModal={showViewModal}
            onCloseViewModal={closeViewModal}
          />
        )}
      </div>
    </div>
  );
}