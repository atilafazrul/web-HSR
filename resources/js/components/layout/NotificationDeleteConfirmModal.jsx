import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useI18n } from "../../i18n/index.jsx";

export default function NotificationDeleteConfirmModal({
  open,
  mode = "single",
  notification = null,
  totalCount = 0,
  deleting = false,
  onCancel,
  onConfirm,
}) {
  const { t } = useI18n();

  if (!open) return null;

  const isAll = mode === "all";
  const title = isAll
    ? t("deleteAllNotificationsTitle", "Delete All Notifications")
    : t("deleteNotificationTitle", "Delete Notification");

  const description = isAll
    ? t(
        "deleteAllNotificationsDesc",
        "All notifications will be permanently removed and cannot be restored."
      )
    : t(
        "deleteNotificationDesc",
        "This notification will be permanently removed and cannot be restored."
      );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-delete-title"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

        <button
          type="button"
          onClick={onCancel}
          disabled={deleting}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          aria-label={t("cancel", "Cancel")}
        >
          <X size={18} />
        </button>

        <div className="px-6 pt-7 pb-2 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 shadow-inner ring-1 ring-red-100">
            {isAll ? (
              <AlertTriangle size={30} className="text-red-600" strokeWidth={2} />
            ) : (
              <Trash2 size={30} className="text-red-600" strokeWidth={2} />
            )}
          </div>

          <h3 id="notif-delete-title" className="text-lg font-bold text-slate-800">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        </div>

        <div className="px-6 pb-5">
          {isAll ? (
            <div className="rounded-xl border border-red-100 bg-red-50/70 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-red-500/90">
                {t("totalNotifications", "Total notifications")}
              </p>
              <p className="mt-1 text-2xl font-bold text-red-700">{totalCount}</p>
            </div>
          ) : notification ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                {notification.title}
              </p>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{notification.message}</p>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-500/25 transition hover:from-red-700 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {deleting
              ? t("deleting", "Deleting...")
              : t("confirmDelete", "Yes, Delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
