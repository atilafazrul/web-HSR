import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { useI18n } from "../../i18n/index.jsx";
import { resolveNotificationPath } from "../../utils/notificationPaths.js";
import NotificationDeleteConfirmModal from "./NotificationDeleteConfirmModal.jsx";

function formatRelativeTime(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return language === "en" ? "Just now" : "Baru saja";
  if (diffMin < 60) {
    return language === "en" ? `${diffMin} min ago` : `${diffMin} menit lalu`;
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return language === "en" ? `${diffHr} hr ago` : `${diffHr} jam lalu`;
  }
  return date.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationDropdown({ user }) {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const rootRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      const payload = res.data?.data ?? [];
      setItems(Array.isArray(payload) ? payload : []);
      setUnreadCount(Number(res.data?.unread_count ?? 0));
    } catch {
      // silent — bell tetap tampil tanpa data
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const onOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", onOutside);
    }
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  useEffect(() => {
    if (!confirmDialog) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !deleting) {
        setConfirmDialog(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirmDialog, deleting]);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) {
      fetchNotifications();
    }
  };

  const handleItemClick = async (notification) => {
    if (!notification.read_at) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        setItems((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // tetap navigasi meski mark-read gagal
      }
    }
    setOpen(false);
    const target = resolveNotificationPath(notification, user);
    navigate(target);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.put("/notifications/read-all");
      setItems((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleDeleteClick = (e, notification) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmDialog({ mode: "single", notification });
  };

  const handleDeleteAllClick = (e) => {
    e.stopPropagation();
    if (items.length === 0) return;
    setConfirmDialog({ mode: "all" });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog || deleting) return;

    setDeleting(true);
    try {
      if (confirmDialog.mode === "all") {
        await api.delete("/notifications");
        setItems([]);
        setUnreadCount(0);
      } else if (confirmDialog.notification) {
        const res = await api.delete(`/notifications/${confirmDialog.notification.id}`);
        setItems((prev) => prev.filter((n) => n.id !== confirmDialog.notification.id));
        if (res.data?.was_unread) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
      }
      setConfirmDialog(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          onClick={handleOpen}
          className="p-2 rounded-lg hover:bg-gray-100 relative"
          style={{ minWidth: "44px", minHeight: "44px", touchAction: "manipulation" }}
          aria-label={t("notifications", "Notifications")}
          aria-expanded={open}
        >
          <Bell size={20} className="text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-[60] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">
                {t("notifications", "Notifications")}
              </h3>
              {items.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {t("markAllRead", "Mark all read")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteAllClick}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    {t("deleteAllNotifications", "Delete all")}
                  </button>
                </div>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading && items.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">
                  {t("loadingNotifications", "Loading...")}
                </p>
              ) : items.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">
                  {t("noNotifications", "No notifications")}
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {items.map((n) => (
                    <li key={n.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => handleItemClick(n)}
                        className={`w-full text-left px-4 py-3 pr-10 hover:bg-gray-50 transition ${
                          !n.read_at ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {formatRelativeTime(n.created_at, language)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, n)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition"
                        aria-label={t("deleteNotification", "Delete notification")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <NotificationDeleteConfirmModal
        open={Boolean(confirmDialog)}
        mode={confirmDialog?.mode || "single"}
        notification={confirmDialog?.notification || null}
        totalCount={items.length}
        deleting={deleting}
        onCancel={() => !deleting && setConfirmDialog(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
