import React from "react";
import { useParams } from "react-router-dom";
import { History, Plus } from "lucide-react";
import { useBAUF } from "./hooks/useBAUF";
import { BAUFForm } from "./components/forms/BAUFForm";
import { BAUFHistory } from "./components/history/BAUFHistory";
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

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleTabChange("form")}
          className={'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ' + (activeTab === "form" ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100')}
        >
          <Plus size={18} />
          {isEditing ? tr("Edit Dokumen", "Edit Document") : tr("Buat Baru", "Create New")}
        </button>
        <button
          onClick={() => handleTabChange("history")}
          className={'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ' + (activeTab === "history" ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100')}
        >
          <History size={18} />
          {tr("Riwayat", "History")} ({filteredHistory.length})
        </button>
      </div>

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
