import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, FileText, History, Plus } from "lucide-react";
import { usePdf } from "./generatepdf/usePdf";
import pdfForm from "./generatepdf/pdfform";
import DocumentationHistory from "./generatepdf/pdfHistory";
import { useI18n } from "../i18n";

export default function GeneratePDFPage({ user }) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const navigate = useNavigate();
  const location = useLocation();
  const { projekId } = useParams();

  // Divisi from URL:
  // - Legacy: /{role}/{divisi}/buat-pdf
  // - Berita Acara: /{role}/berita-acara/service-report (use user.divisi, or none for super_admin)
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const buatPdfIndex = pathSegments.findIndex((seg) => seg === "buat-pdf");
  const isUnderBeritaAcara = pathSegments.includes("service-report");

  let currentDivisi = "";
  if (buatPdfIndex > 0) {
    currentDivisi = pathSegments[buatPdfIndex - 1].toUpperCase();
  } else if (isUnderBeritaAcara) {
    currentDivisi = user?.role === "super_admin"
      ? ""
      : (user?.divisi || "SERVICE").toUpperCase();
  } else {
    currentDivisi = (user?.divisi || "SERVICE").toUpperCase();
  }

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
    selectedItem,
    handleInputChange,
    handleSignatureChange,
    handleCheckboxChange,
    handlePartsChange,
    handleAddParts,
    handleRemoveParts,
    resetForm,
    handleSubmit,
    handleView,
    closeViewModal,
    handleGeneratePDF,
    handleEdit,
    cancelEdit,
    isEditing,
    fetchHistory,
    scheduledAt,
    setScheduledAt,
    scheduling,
    handleScheduleGenerate,
    canSchedule,
  } = usePdf(user, currentDivisi, projekId);

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold">
              {isEditing ? "Edit Service Report" : "Generate Service Report"}
            </h2>
            <p className="text-gray-500">
              {currentDivisi
                ? `${tr("Divisi", "Division")} ${currentDivisi} - `
                : ""}
              {isEditing
                ? tr("Edit dokumen", "Edit document")
                : tr("Buat dan kelola dokumen Service Report", "Create and manage Service Report documents")}
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            if (isEditing) {
              if (window.confirm(tr("Anda sedang mengedit dokumen. Yakin ingin membatalkan dan membuat dokumen baru?", "You are editing a document. Are you sure you want to cancel and create a new one?"))) {
                cancelEdit();
                setActiveTab("form");
              }
            } else {
              setActiveTab("form");
            }
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${activeTab === "form"
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
        >
          <Plus size={18} />
          {isEditing ? tr("Edit Dokumen", "Edit Document") : tr("Buat Baru", "Create New")}
        </button>
        <button
          onClick={() => {
            if (isEditing) {
              if (window.confirm(tr("Anda sedang mengedit dokumen. Yakin ingin membatalkan dan melihat riwayat?", "You are editing a document. Are you sure you want to cancel and view history?"))) {
                cancelEdit();
                setActiveTab("history");
              }
            } else {
              setActiveTab("history");
            }
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${activeTab === "history"
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
        >
          <History size={18} />
          {tr("Riwayat", "History")} ({historyData.length})
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
            onSignatureChange: handleSignatureChange,
            onCheckboxChange: handleCheckboxChange,
            onPartsChange: handlePartsChange,
            onAddParts: handleAddParts,
            onRemoveParts: handleRemoveParts,
            onSubmit: handleSubmit,
            onReset: isEditing ? cancelEdit : resetForm,
            loading,
            user,
            isEditing,
            scheduledAt,
            onScheduledAtChange: setScheduledAt,
            onSchedule: handleScheduleGenerate,
            scheduling,
            canSchedule,
          })}
        </div>
      ) : (
        <div className="animate-fadeIn">
          {fetchingHistory ? (
            <div className="bg-white rounded-3xl shadow-md p-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">{tr("Memuat riwayat dokumen...", "Loading document history...")}</p>
            </div>
          ) : (
            React.createElement(DocumentationHistory, {
              historyData,
              filteredHistory,
              searchTerm,
              onSearchChange: setSearchTerm,
              onView: handleView,
              closeViewModal,
              onGeneratePDF: handleGeneratePDF,
              onEdit: handleEdit,
              selectedItem,
            })
          )}
        </div>
      )}
    </div>
  );
}