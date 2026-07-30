import React from "react";
import { History, Plus } from "lucide-react";
import { useInvoice } from "./hooks/useInvoice";
import { InvoiceForm } from "./components/forms/InvoiceForm";
import { InvoiceHistory } from "./components/history/InvoiceHistory";
import { useI18n } from "../../i18n";

export default function InvoicePage() {
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
    formatRupiah,
    estimatedSubtotal,
    estimatedDiskon,
    estimatedPpn,
    estimatedTotal,
  } = useInvoice();

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
        <h2 className="text-3xl font-bold">{isEditing ? "Edit Invoice" : "Generate Invoice"}</h2>
        <p className="text-gray-500">
          {isEditing
            ? tr("Perbarui data Invoice", "Update invoice data")
            : tr("Buat dan kelola Invoice (Super Admin)", "Create and manage Invoices (Super Admin)")}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <button onClick={() => handleTabChange("form")} className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition ${activeTab === "form" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
          <Plus size={18} />
          {isEditing ? tr("Edit Dokumen", "Edit Document") : tr("Buat Baru", "Create New")}
        </button>
        <button onClick={() => handleTabChange("history")} className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition ${activeTab === "history" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
          <History size={18} />
          {tr("Riwayat", "History")} ({filteredHistory.length})
        </button>
      </div>

      <div className="animate-fadeIn">
        {activeTab === "form" ? (
          <InvoiceForm
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
            estimatedSubtotal={estimatedSubtotal}
            estimatedDiskon={estimatedDiskon}
            estimatedPpn={estimatedPpn}
            estimatedTotal={estimatedTotal}
          />
        ) : (
          <InvoiceHistory
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
