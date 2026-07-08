import React from "react";
import { Clock, CalendarClock } from "lucide-react";
import { useI18n } from "../../../../i18n";

export const ScheduleGenerateSection = ({
  scheduledAt,
  onScheduledAtChange,
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

  if (!canSchedule) {
    return null;
  }

  return (
    <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-6">
      <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-amber-900">
        <CalendarClock size={20} />
        {tr("Jadwalkan Generate (Sekali)", "Schedule Generate (Once)")}
      </h3>
      <p className="mb-4 text-sm text-amber-800">
        {tr(
          "Isi form sekarang, dokumen akan otomatis dibuat pada waktu yang Anda pilih. Setelah generate, admin akan menerima notifikasi WhatsApp.",
          "Fill in the form now; the document will be created automatically at your chosen time. After generation, the admin will receive a WhatsApp notification."
        )}
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-amber-900">
            {tr("Waktu Generate", "Generate Time")}
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" size={18} />
            <input
              type="datetime-local"
              value={scheduledAt}
              min={minDateTime()}
              onChange={(e) => onScheduledAtChange(e.target.value)}
              className="w-full rounded-xl border border-amber-200 bg-white py-2.5 pl-10 pr-4 focus:border-amber-400 focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onSchedule}
          disabled={loading || scheduling || !scheduledAt}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition sm:w-auto ${
            loading || scheduling || !scheduledAt
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
