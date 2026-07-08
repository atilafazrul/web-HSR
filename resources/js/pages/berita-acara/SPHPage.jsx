import React from "react";
import { useParams } from "react-router-dom";
import { History, Plus } from "lucide-react";
import { useSPH } from "./hooks/useSPH";
import { SPHForm } from "./components/forms/SPHForm";
import { SPHHistory } from "./components/history/SPHHistory";
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
    selectedItem,
    showViewModal,
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
    scheduledAt,
    setScheduledAt,
    scheduling,
    handleScheduleGenerate,
    canSchedule,
    formatRupiah,
    estimatedTotal,
  } = useSPH(projekId);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Generate SPH</h2>
        <p className="text-gray-500">
          {tr("Buat dan kelola Surat Penawaran Harga (SPH)", "Create and manage Price Quotation Letters (SPH)")}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <button onClick={() => setActiveTab("form")} className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition ${activeTab === "form" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
          <Plus size={18} />
          {tr("Buat Baru", "Create New")}
        </button>
        <button onClick={() => setActiveTab("history")} className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition ${activeTab === "history" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
          <History size={18} />
          {tr("Riwayat", "History")} ({filteredHistory.length})
        </button>
      </div>

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
            onReset={resetForm}
            loading={loading}
            formatRupiah={formatRupiah}
            estimatedTotal={estimatedTotal}
            scheduledAt={scheduledAt}
            onScheduledAtChange={setScheduledAt}
            onScheduleGenerate={handleScheduleGenerate}
            scheduling={scheduling}
            canSchedule={canSchedule}
          />
        ) : (
          <SPHHistory
            filteredHistory={filteredHistory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onView={handleView}
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
