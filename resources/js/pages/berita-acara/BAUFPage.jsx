import React from "react";
import { useParams } from "react-router-dom";
import { useBAUF } from "./hooks/useBAUF";
import { BAUFForm } from "./components/forms/BAUFForm";
import { BAUFHistory } from "./components/history/BAUFHistory";
import BeritaAcaraTabBar from "./components/BeritaAcaraTabBar";
import { useI18n } from "../../i18n";

export default function BAUFPage() {
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
  } = useBAUF(projekId);

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
          <h2 className="text-3xl font-bold">{isEditing ? "Edit BAUF" : "Generate BAUF"}</h2>
          <p className="text-gray-500">
            {isEditing
              ? tr("Perbarui data dokumen BAUF", "Update BAUF document data")
              : tr("Buat dan kelola dokumen Berita Acara Uji Fungsi", "Create and manage Function Test Minutes documents")}
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
          <BAUFForm
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
          <BAUFHistory
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
