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
    scheduledAt,
    setScheduledAt,
    scheduling,
    handleScheduleGenerate,
    canSchedule,
  } = useBAUF(projekId);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Generate BAUF</h2>
          <p className="text-gray-500">
            {tr(
              "Buat dan kelola dokumen Berita Acara Uji Fungsi",
              "Create and manage Function Test Minutes documents"
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("form")}
          className={'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ' + (activeTab === "form" ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100')}
        >
          <Plus size={18} />
          {tr("Buat Baru", "Create New")}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ' + (activeTab === "history" ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100')}
        >
          <History size={18} />
          {tr("Riwayat", "History")} ({filteredHistory.length})
        </button>
      </div>

      {/* Content */}
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
            onReset={resetForm}
            loading={loading}
            scheduledAt={scheduledAt}
            onScheduledAtChange={setScheduledAt}
            onScheduleGenerate={handleScheduleGenerate}
            scheduling={scheduling}
            canSchedule={canSchedule}
          />
        ) : (
          <BAUFHistory
            filteredHistory={filteredHistory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onView={handleView}
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
