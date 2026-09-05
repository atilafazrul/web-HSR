import React from "react";
import { useParams } from "react-router-dom";
import { useBAST } from "./hooks/useBAST";
import { BASTForm } from "./components/forms/BASTForm";
import { BASTHistory } from "./components/history/BASTHistory";
import BeritaAcaraTabBar from "./components/BeritaAcaraTabBar";
import { useI18n } from "../../i18n";

export default function BASTPage() {
  const { projekId } = useParams();
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const {
    activeTab,
    setActiveTab,
    loading,
    searchTerm,
    setSearchTerm,
    formData,
    filteredHistory,
    historyAllCount,
    historyProjectCount,
    selectedItem,
    showViewModal,
    isEditing,
    editNomorSurat,
    handleInputChange,
    handleSignatureChange,
    handleItemChange,
    addItem,
    removeItem,
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
  } = useBAST(projekId);

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
          <h2 className="text-3xl font-bold">{isEditing ? "Edit BAST" : "Generate BAST"}</h2>
          <p className="text-gray-500">
            {isEditing
              ? tr("Perbarui data dokumen BAST", "Update BAST document data")
              : tr("Buat dan kelola dokumen Berita Acara Serah Terima", "Create and manage Handover Minutes documents")}
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
          <BASTForm
            formData={formData}
            onInputChange={handleInputChange}
            onSignatureChange={handleSignatureChange}
            onItemChange={handleItemChange}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onSubmit={handleSubmit}
            onReset={isEditing ? cancelEdit : resetForm}
            loading={loading}
            isEditing={isEditing}
            editNomorSurat={editNomorSurat}
            scheduleSectionProps={scheduleSectionProps}
            onScheduleGenerate={handleScheduleGenerate}
          />
        ) : (
          <BASTHistory
            filteredHistory={filteredHistory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onView={handleView}
            onEdit={handleEdit}
            onGeneratePDF={handleGeneratePDF}
            onDelete={handleDelete}
            selectedItem={selectedItem}
            showViewModal={showViewModal}
            onCloseViewModal={closeViewModal}
          />
        )}
      </div>
    </div>
  );
}
