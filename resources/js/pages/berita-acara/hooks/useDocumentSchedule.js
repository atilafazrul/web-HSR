import { useState } from "react";
import api from "../../../api/axiosConfig";

const tr = (id, en) => {
  if (typeof window === "undefined") return id;
  return localStorage.getItem("app_language") === "en" ? en : id;
};

export const useDocumentSchedule = (projekKerjaId, documentType) => {
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = async (formPayload, formElement = null) => {
    if (!projekKerjaId) {
      alert(tr(
        "Jadwal generate hanya tersedia dari halaman proyek.",
        "Scheduled generate is only available from the project page."
      ));
      return false;
    }

    if (formElement && !formElement.reportValidity()) {
      return false;
    }

    if (!scheduledAt) {
      alert(tr(
        "Pilih tanggal dan waktu generate terlebih dahulu.",
        "Please select a generate date and time first."
      ));
      return false;
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      alert(tr(
        "Waktu jadwal harus di masa depan.",
        "Scheduled time must be in the future."
      ));
      return false;
    }

    setScheduling(true);
    try {
      const response = await api.post("/berita-acara/scheduled", {
        projek_kerja_id: Number(projekKerjaId),
        document_type: documentType,
        scheduled_at: scheduledDate.toISOString(),
        form_payload: formPayload,
      });

      const formatted = scheduledDate.toLocaleString("id-ID", {
        dateStyle: "full",
        timeStyle: "short",
      });

      alert(
        `${tr("Jadwal generate berhasil disimpan!", "Generate schedule saved successfully!")}\n` +
        `${tr("Akan di-generate pada", "Will be generated on")}: ${formatted}\n` +
        `${tr("Notifikasi WhatsApp akan dikirim ke admin setelah dokumen dibuat.", "A WhatsApp notification will be sent to the admin after the document is created.")}`
      );

      setScheduledAt("");
      return response.data;
    } catch (error) {
      console.error("Error scheduling document:", error);
      const message = error.response?.data?.message
        || error.response?.data?.errors
        || tr("Gagal menyimpan jadwal. Periksa kembali data form.", "Failed to save schedule. Please check the form data.");
      alert(typeof message === "string" ? message : JSON.stringify(message));
      return false;
    } finally {
      setScheduling(false);
    }
  };

  return {
    scheduledAt,
    setScheduledAt,
    scheduling,
    handleSchedule,
    canSchedule: Boolean(projekKerjaId),
  };
};
