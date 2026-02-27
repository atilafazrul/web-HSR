import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, FileText, History, Plus } from "lucide-react";
import { usePdf } from "./generatepdf/usePdf";
import pdfForm from "./generatepdf/pdfform";
import DocumentationHistory from "./generatepdf/pdfHistory";

export default function GeneratePDFPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract divisi from URL pathname
  // Path format: /super_admin/it/buat-pdf, /admin/service/buat-pdf, etc.
  const pathSegments = location.pathname.split('/');
  // Find the segment before 'buat-pdf' which should be the divisi
  const buatPdfIndex = pathSegments.findIndex(seg => seg === 'buat-pdf');
  const currentDivisi = buatPdfIndex > 0
    ? pathSegments[buatPdfIndex - 1].toUpperCase()
    : "IT";

  // Use the custom hook
  const {
    activeTab,
    setActiveTab,
    loading,
    searchTerm,
    setSearchTerm,
    formData,
    checkboxes,
    partsList,
    historyData,
    filteredHistory,
    fetchingHistory,
    serviceTypeOptions,
    handleInputChange,
    handleCheckboxChange,
    handlePartsChange,
    handleAddParts,
    handleRemoveParts,
    resetForm,
    handleSubmit,
    handleView,
    handleGeneratePDF,
  } = usePdf(user, currentDivisi);

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
          <div>
            <h2 className="text-3xl font-bold">Generate Service Report</h2>
            <p className="text-gray-500">
              Divisi {currentDivisi} - Buat dan kelola dokumen Service Report
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${activeTab === "form"
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
        >
          <Plus size={18} />
          Buat Baru
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${activeTab === "history"
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
        >
          <History size={18} />
          Riwayat ({historyData.length})
        </button>
      </div>

      {/* CONTENT */}
      {activeTab === "form" ? (
        <div className="animate-fadeIn">
          {React.createElement(pdfForm, {
            formData,
            checkboxes,
            partsList,
            serviceTypeOptions,
            onInputChange: handleInputChange,
            onCheckboxChange: handleCheckboxChange,
            onPartsChange: handlePartsChange,
            onAddParts: handleAddParts,
            onRemoveParts: handleRemoveParts,
            onSubmit: handleSubmit,
            onReset: resetForm,
            loading,
            user,
          })}
        </div>
      ) : (
        <div className="animate-fadeIn">
          {fetchingHistory ? (
            <div className="bg-white rounded-3xl shadow-md p-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Memuat riwayat dokumen...</p>
            </div>
          ) : (
            React.createElement(DocumentationHistory, {
              historyData,
              filteredHistory,
              searchTerm,
              onSearchChange: setSearchTerm,
              onView: handleView,
              onGeneratePDF: handleGeneratePDF,
            })
          )}
        </div>
      )}
    </div>
  );
}