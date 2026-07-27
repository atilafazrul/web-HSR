import { useState } from "react";
import api from "../../../api/axiosConfig";

const tr = (id, en) => {
  if (typeof window === "undefined") return id;
  return localStorage.getItem("app_language") === "en" ? en : id;
};

const RECURRENCE_LABELS = {
  once: { id: "Sekali", en: "Once" },
  daily: { id: "Harian", en: "Daily" },
  weekly: { id: "Mingguan", en: "Weekly" },
  monthly: { id: "Bulanan", en: "Monthly" },
};

export const useDocumentSchedule = (projekKerjaId, documentType) => {
  const [scheduledDates, setScheduledDates] = useState([""]);
  const [recurrenceType, setRecurrenceType] = useState("once");
  const [recurrenceEndAt, setRecurrenceEndAt] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const updateScheduledDate = (index, value) => {
    setScheduledDates((dates) => dates.map((d, i) => (i === index ? value : d)));
  };

  const addScheduledDate = () => {
    setScheduledDates((dates) => [...dates, ""]);
  };

  const removeScheduledDate = (index) => {
    setScheduledDates((dates) => {
      if (dates.length <= 1) {
        return [""];
      }
      return dates.filter((_, i) => i !== index);
    });
  };

  const resetScheduleForm = () => {
    setScheduledDates([""]);
    setRecurrenceType("once");
    setRecurrenceEndAt("");
  };

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

    const filledDates = scheduledDates.filter(Boolean);
    if (filledDates.length === 0) {
      alert(tr(
        "Pilih minimal satu tanggal dan waktu generate.",
        "Please select at least one generate date and time."
      ));
      return false;
    }

    const now = new Date();
    const parsedDates = filledDates.map((value) => new Date(value));
    const invalidDate = parsedDates.find(
      (date) => Number.isNaN(date.getTime()) || date <= now
    );

    if (invalidDate) {
      alert(tr(
        "Semua waktu jadwal harus di masa depan.",
        "All scheduled times must be in the future."
      ));
      return false;
    }

    if (recurrenceEndAt) {
      const endDate = new Date(recurrenceEndAt);
      if (Number.isNaN(endDate.getTime()) || endDate <= now) {
        alert(tr(
          "Tanggal berakhir pengulangan harus di masa depan.",
          "Recurrence end date must be in the future."
        ));
        return false;
      }
    }

    setScheduling(true);
    try {
      const payload = {
        projek_kerja_id: Number(projekKerjaId),
        document_type: documentType,
        scheduled_dates: parsedDates.map((date) => date.toISOString()),
        recurrence_type: recurrenceType,
        form_payload: formPayload,
      };

      if (recurrenceType !== "once" && recurrenceEndAt) {
        payload.recurrence_end_at = new Date(recurrenceEndAt).toISOString();
      }

      const response = await api.post("/berita-acara/scheduled", payload);

      const formattedDates = parsedDates
        .map((date) => date.toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" }))
        .join("\n• ");

      const recurrenceLabel = RECURRENCE_LABELS[recurrenceType] || RECURRENCE_LABELS.once;
      const recurrenceText = localStorage.getItem("app_language") === "en"
        ? recurrenceLabel.en
        : recurrenceLabel.id;

      alert(
        `${response.data?.message || tr("Jadwal generate berhasil disimpan!", "Generate schedule saved successfully!")}\n\n` +
        `${tr("Tanggal", "Dates")}:\n• ${formattedDates}\n` +
        `${tr("Pengulangan", "Recurrence")}: ${recurrenceText}\n` +
        `${tr("Notifikasi WhatsApp akan dikirim ke admin setelah dokumen dibuat.", "A WhatsApp notification will be sent to the admin after the document is created.")}`
      );

      resetScheduleForm();
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

  const scheduleSectionProps = {
    scheduledDates,
    onScheduledDateChange: updateScheduledDate,
    onAddScheduledDate: addScheduledDate,
    onRemoveScheduledDate: removeScheduledDate,
    recurrenceType,
    onRecurrenceTypeChange: setRecurrenceType,
    recurrenceEndAt,
    onRecurrenceEndAtChange: setRecurrenceEndAt,
    scheduling,
    canSchedule: Boolean(projekKerjaId),
  };

  return {
    scheduleSectionProps,
    handleSchedule,
    scheduledAt: scheduledDates[0] || "",
    setScheduledAt: (value) => updateScheduledDate(0, value),
    scheduling,
    canSchedule: Boolean(projekKerjaId),
  };
};
