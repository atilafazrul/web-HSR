import React from "react";
import { Clock, CalendarClock, Plus, Trash2 } from "lucide-react";
import { useI18n } from "../../../../i18n";

export const ScheduleGenerateSection = ({
  scheduledDates = [""],
  onScheduledDateChange,
  onAddScheduledDate,
  onRemoveScheduledDate,
  recurrenceType = "once",
  onRecurrenceTypeChange,
  recurrenceEndAt = "",
  onRecurrenceEndAtChange,
  onSchedule,
  scheduling,
  canSchedule,
  loading,
}) => {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);

  const minDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const hasValidDate = scheduledDates.some(Boolean);

  if (!canSchedule) {
    return null;
  }

  const recurrenceOptions = [
    { value: "once", label: tr("Sekali", "Once") },
    { value: "daily", label: tr("Harian", "Daily") },
    { value: "weekly", label: tr("Mingguan", "Weekly") },
    { value: "monthly", label: tr("Bulanan", "Monthly") },
  ];

  return (
    <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-6">
      <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-amber-900">
        <CalendarClock size={20} />
        {tr("Jadwalkan Generate", "Schedule Generate")}
      </h3>
      <p className="mb-4 text-sm text-amber-800">
        {tr(
          "Isi form sekarang, dokumen akan otomatis dibuat pada setiap tanggal yang Anda pilih. Pilih pengulangan agar generate berjalan otomatis (harian/mingguan/bulanan). Notifikasi WhatsApp dikirim ke admin setelah dokumen dibuat.",
          "Fill in the form now; documents will be created automatically on each date you select. Choose recurrence for automatic repeats (daily/weekly/monthly). WhatsApp notifications are sent to admin after each document is created."
        )}
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-amber-900">
            {tr("Waktu Generate", "Generate Time")}
          </label>
          <div className="space-y-3">
            {scheduledDates.map((dateValue, index) => (
              <div key={index} className="flex gap-2">
                <div className="relative flex-1">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" size={18} />
                  <input
                    type="datetime-local"
                    value={dateValue}
                    min={minDateTime()}
                    onChange={(e) => onScheduledDateChange?.(index, e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-white py-2.5 pl-10 pr-4 focus:border-amber-400 focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                {scheduledDates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveScheduledDate?.(index)}
                    className="rounded-xl border border-red-200 px-3 text-red-600 hover:bg-red-50"
                    title={tr("Hapus tanggal", "Remove date")}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onAddScheduledDate?.()}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-900"
          >
            <Plus size={16} />
            {tr("Tambah tanggal", "Add date")}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-amber-900">
              {tr("Pengulangan", "Recurrence")}
            </label>
            <select
              value={recurrenceType}
              onChange={(e) => onRecurrenceTypeChange?.(e.target.value)}
              className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 focus:border-amber-400 focus:ring-2 focus:ring-amber-300"
            >
              {recurrenceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {recurrenceType !== "once" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-amber-900">
                {tr("Berakhir pada (opsional)", "End on (optional)")}
              </label>
              <input
                type="datetime-local"
                value={recurrenceEndAt}
                min={minDateTime()}
                onChange={(e) => onRecurrenceEndAtChange?.(e.target.value)}
                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 focus:border-amber-400 focus:ring-2 focus:ring-amber-300"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onSchedule}
          disabled={loading || scheduling || !hasValidDate}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition sm:w-auto ${
            loading || scheduling || !hasValidDate
              ? "cursor-not-allowed bg-gray-300 text-gray-500"
              : "bg-amber-600 text-white hover:bg-amber-700 hover:shadow-lg"
          }`}
        >
          {scheduling ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {tr("Menyimpan jadwal...", "Saving schedule...")}
            </>
          ) : (
            <>
              <CalendarClock size={20} />
              {tr("Jadwalkan Generate", "Schedule Generate")}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
