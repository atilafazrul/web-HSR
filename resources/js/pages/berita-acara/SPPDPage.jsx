import React from "react";
import { History, Plus } from "lucide-react";
import { useSPPD } from "./hooks/useSPPD";
import { SPPDForm } from "./components/forms/SPPDForm";
import { SPPDHistory } from "./components/history/SPPDHistory";
import { useI18n } from "../../i18n";

export default function SPPDPage() {
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
  } = useSPPD();

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