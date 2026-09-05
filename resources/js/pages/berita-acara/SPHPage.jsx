import React from "react";
import { useParams } from "react-router-dom";
import { useSPH } from "./hooks/useSPH";
import { SPHForm } from "./components/forms/SPHForm";
import { SPHHistory } from "./components/history/SPHHistory";
import BeritaAcaraTabBar from "./components/BeritaAcaraTabBar";
import { useI18n } from "../../i18n";

export default function SPHPage() {
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
    editNomorSurat,
    handleInputChange,
    handleRichTextChange,
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
    formatRupiah,
    estimatedTotal,
  } = useSPH(projekId);

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
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold">{isEditing ? "Edit SPH" : "Generate SPH"}</h2>
        <p className="text-gray-500">
          {isEditing
            ? tr("Perbarui data Surat Penawaran Harga", "Update price quotation letter data")
            : tr("Buat dan kelola Surat Penawaran Harga (SPH)", "Create and manage Price Quotation Letters (SPH)")}
        </p>
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
          <SPHForm
            formData={formData}
            nextNomorSurat={nextNomorSurat}
            fetchingNomor={fetchingNomor}
            onInputChange={handleInputChange}
            onRichTextChange={handleRichTextChange}
            onItemChange={handleItemChange}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onSubmit={handleSubmit}
            onReset={isEditing ? cancelEdit : resetForm}
            loading={loading}
            isEditing={isEditing}
            editNomorSurat={editNomorSurat}
            formatRupiah={formatRupiah}
            estimatedTotal={estimatedTotal}
            scheduleSectionProps={scheduleSectionProps}
            onScheduleGenerate={handleScheduleGenerate}
          />
        ) : (
          <SPHHistory
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
            formatRupiah={formatRupiah}
          />
        )}
      </div>
    </div>
  );
}
