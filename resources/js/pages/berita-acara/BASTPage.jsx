import React from "react";
import { History, Plus } from "lucide-react";
import { useBAST } from "./hooks/useBAST";
import { BASTForm } from "./components/forms/BASTForm";
import { BASTHistory } from "./components/history/BASTHistory";

export default function BASTPage() {
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
    handleItemChange,
    addItem,
    removeItem,
    resetForm,
    handleSubmit,
    handleView,
    closeViewModal,
    handleGeneratePDF,
    handleDelete,
  } = useBAST();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Generate BAST</h2>
          <p className="text-gray-500">
            Buat dan kelola dokumen Berita Acara Serah Terima
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
            activeTab === "form"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Plus size={18} />
          Buat Baru
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
            activeTab === "history"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <History size={18} />
          Riwayat ({filteredHistory.length})
        </button>
      </div>

      {/* Content */}
      <div className="animate-fadeIn">
        {activeTab === "form" ? (
          <BASTForm
            formData={formData}
            onInputChange={handleInputChange}
            onItemChange={handleItemChange}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onSubmit={handleSubmit}
            onReset={resetForm}
            loading={loading}
          />
        ) : (
          <BASTHistory
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
