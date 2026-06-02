import React, { createContext, useContext, useMemo, useState } from "react";

const I18nContext = createContext({
  language: "id",
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

const translations = {
  id: {
    appLoading: "Memuat...",
    language: "Bahasa",
    menu: "Menu",
    dashboard: "Dashboard",
    employee: "Karyawan",
    expenseRecap: "Rekap Biaya Karyawan",
    minutesReport: "Berita Acara",
    leaveRequest: "Pengajuan Cuti",
    leaveApproval: "Approval Cuti",
    division: "Divisi",
    profile: "Profil",
    logout: "Keluar",
    sessionEnded: "Sesi Berakhir",
    sessionEndedDesc: "Sesi Anda telah berakhir. Masuk kembali untuk melanjutkan.",
    reLogin: "Masuk Kembali",
    loginFailed: "Login gagal",
    tooManyRedirect: "Terlalu banyak redirect. Silakan coba lagi.",
    welcomeBack: "Selamat Datang Kembali",
    signInSubtitle: "Masuk untuk mengakses dashboard Anda",
    activeDivision: "Divisi Aktif:",
    emailAddress: "Alamat Email",
    emailPlaceholder: "Masukkan email Anda",
    password: "Kata Sandi",
    passwordPlaceholder: "Masukkan kata sandi Anda",
    rememberMe: "Ingat saya",
    signingIn: "Sedang masuk...",
    signIn: "Masuk",
    needHelp: "Butuh bantuan? Hubungi administrator sistem Anda",
    securedBadge: "Diamankan dengan enkripsi tingkat enterprise",
    notifications: "Notifikasi",
    markAllRead: "Tandai semua dibaca",
    noNotifications: "Belum ada notifikasi",
    loadingNotifications: "Memuat notifikasi...",
    deleteNotification: "Hapus notifikasi",
    deleteNotificationTitle: "Hapus Notifikasi",
    deleteNotificationDesc: "Notifikasi ini akan dihapus permanen dan tidak dapat dikembalikan.",
    deleteAllNotificationsTitle: "Hapus Semua Notifikasi",
    deleteAllNotificationsDesc: "Semua notifikasi akan dihapus permanen dan tidak dapat dikembalikan.",
    deleteAllNotifications: "Hapus semua",
    totalNotifications: "Total notifikasi",
    confirmDelete: "Ya, Hapus",
    cancel: "Batal",
    deleting: "Menghapus...",
  },
  en: {
    appLoading: "Loading...",
    language: "Language",
    menu: "Menu",
    dashboard: "Dashboard",
    employee: "Employees",
    expenseRecap: "Employee Expense Recap",
    minutesReport: "Minutes Report",
    leaveRequest: "Leave Request",
    leaveApproval: "Leave Approval",
    division: "Division",
    profile: "Profile",
    logout: "Logout",
    sessionEnded: "Session Ended",
    sessionEndedDesc: "Your session has ended. Please sign in again to continue.",
    reLogin: "Sign In Again",
    loginFailed: "Login failed",
    tooManyRedirect: "Too many redirects. Please try again.",
    welcomeBack: "Welcome Back",
    signInSubtitle: "Sign in to access your dashboard",
    activeDivision: "Active Division:",
    emailAddress: "Email Address",
    emailPlaceholder: "Enter your email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    rememberMe: "Remember me",
    signingIn: "Signing in...",
    signIn: "Sign In",
    needHelp: "Need help? Contact your system administrator",
    securedBadge: "Secured with enterprise-grade encryption",
    notifications: "Notifications",
    markAllRead: "Mark all read",
    noNotifications: "No notifications yet",
    loadingNotifications: "Loading notifications...",
    deleteNotification: "Delete notification",
    deleteNotificationTitle: "Delete Notification",
    deleteNotificationDesc: "This notification will be permanently removed and cannot be restored.",
    deleteAllNotificationsTitle: "Delete All Notifications",
    deleteAllNotificationsDesc: "All notifications will be permanently removed and cannot be restored.",
    deleteAllNotifications: "Delete all",
    totalNotifications: "Total notifications",
    confirmDelete: "Yes, Delete",
    cancel: "Cancel",
    deleting: "Deleting...",
  },
};

const uiIdToEn = {
  "Selamat Datang": "Welcome",
  "Selamat Datang Kembali": "Welcome Back",
  "Masuk": "Sign In",
  "Keluar": "Logout",
  "Simpan": "Save",
  "Simpan Projek": "Save Project",
  "Menyimpan...": "Saving...",
  "Batal": "Cancel",
  "Tutup": "Close",
  "Tambah": "Add",
  "Tambah Barang": "Add Item",
  "Tambah Foto": "Add Photo",
  "Hapus": "Delete",
  "Edit": "Edit",
  "Cari...": "Search...",
  "Cari barang...": "Search items...",
  "Cari inventory...": "Search inventory...",
  "Pilih Divisi": "Select Division",
  "Pilih karyawan Sales dulu": "Select Sales employee first",
  "Pilih karyawan Sales...": "Select Sales employee...",
  "Pilih akun user untuk monitoring": "Select user account for monitoring",
  "Memuat...": "Loading...",
  "Loading...": "Loading...",
  "Tidak ada data yang ditemukan": "No data found",
  "Tidak ada data yang cocok": "No matching data",
  "Data tidak ditemukan": "No data found",
  "Dashboard User": "User Dashboard",
  "Divisi": "Division",
  "Divisi IT": "IT Division",
  "Divisi Service": "Service Division",
  "Divisi Sales": "Sales Division",
  "Divisi Kontraktor": "Contractor Division",
  "Divisi Logistik": "Logistics Division",
  "Divisi Purchasing": "Purchasing Division",
  "Progres Pekerjaan": "Work Progress",
  "Archive Pekerjaan": "Work Archive",
  "Buat PDF": "Create PDF",
  "Pembelian": "Purchases",
  "Data Projek Kerja": "Project Data",
  "Dokumentasi Projek": "Project Documentation",
  "Dokumen Projek": "Project Documents",
  "Foto Projek": "Project Photos",
  "Deskripsi Pekerjaan": "Work Description",
  "Deskripsi": "Description",
  "Barang yang Dibeli": "Purchased Items",
  "Barang": "Items",
  "Barang sudah siap": "Items Ready",
  "Timeline Status": "Status Timeline",
  "Biaya Jalan": "Travel Cost",
  "Biaya Pengeluaran": "Expense Cost",
  "Biaya Reimbursment": "Reimbursement Cost",
  "Biaya Diluar Projek": "Non-Project Costs",
  "Belum Lunas": "Unpaid",
  "Sudah Lunas": "Paid",
  "Lunas": "Paid",
  "Belum": "Unpaid",
  "Total Tugas": "Total Tasks",
  "Total": "Total",
  "Unduh Excel (CSV)": "Download Excel (CSV)",
  "Yakin hapus project ini?": "Are you sure you want to delete this project?",
  "Yakin hapus barang ini?": "Are you sure you want to delete this item?",
  "Gagal hapus data": "Failed to delete data",
  "Gagal update status": "Failed to update status",
  "Gagal update deskripsi": "Failed to update description",
  "Gagal simpan data": "Failed to save data",
  "Data berhasil disimpan": "Data saved successfully",
  "Semua Divisi": "All Divisions",
  "Semua Status": "All Statuses",
  "Tugas": "Task",
  "Karyawan": "Employee",
  "Lokasi": "Location",
  "Tanggal": "Date",
  "Status": "Status",
  "Aksi": "Actions",
  "Lihat": "View",
  "Lihat Foto": "View Photo",
  "Selesai": "Completed",
  "Proses": "In Progress",
  "Terlambat": "Delayed",
  "Dibuat": "Created",
  "Persiapan": "Preparation",
  "Proses Pekerjaan": "Work In Progress",
  "Tanpa Status": "No Status",
  "Ringkasan progres pekerjaan berdasarkan status terbaru.": "Work progress summary based on latest status.",
  "Ringkasan pekerjaan berdasarkan semua status yang aktif.": "Work summary based on all active statuses.",
  "Aktivitas Pekerjaan Divisi Anda": "Your Division Work Activities",
  "Aktivitas Pekerjaan Semua Divisi": "All Division Work Activities",
  "Menampilkan": "Showing",
  "dari": "of",
  "data": "records",
  "Informasi Pribadi": "Personal Information",
  "Dokumen": "Documents",
  "Nama Lengkap": "Full Name",
  "Nomor Telepon": "Phone Number",
  "Alamat": "Address",
  "Dokumen Identitas": "Identity Documents",
  "Akte Kelahiran": "Birth Certificate",
  "Sertifikat": "Certificates",
  "Belum ada dokumen": "No documents yet",
  "Klik atau drag file di sini": "Click or drag file here",
  "Klik atau drag untuk tambah file": "Click or drag to add files",
  "File tersimpan": "Saved file",
  "Lihat Dokumen": "View Document",
  "Kembali": "Back",
  "Kembali ke Folder": "Back to Folders",
  "Folder Dokumen": "Document Folders",
  "Folder Foto": "Photo Folders",
  "Buat Folder Dokumen": "Create Document Folder",
  "Buat Folder Foto": "Create Photo Folder",
  "Buat folder dokumen baru": "Create new document folder",
  "Buat folder foto baru": "Create new photo folder",
};

const uiEnToId = Object.fromEntries(Object.entries(uiIdToEn).map(([id, en]) => [en, id]));

export function applyUiTranslationOnce(targetLanguage) {
  if (typeof document === "undefined" || !document.body) return;
  const map = targetLanguage === "en" ? uiIdToEn : uiEnToId;
  const attrsToTranslate = ["placeholder", "title", "aria-label"];
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);

  const translateText = (text) => {
    if (!text || typeof text !== "string") return text;
    let next = text;
    for (const key of keys) {
      if (!key) continue;
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      next = next.replace(new RegExp(escaped, "g"), map[key]);
    }
    return next;
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let current = walker.nextNode();
  while (current) {
    const parentTag = current.parentElement?.tagName;
    if (parentTag !== "SCRIPT" && parentTag !== "STYLE") textNodes.push(current);
    current = walker.nextNode();
  }
  textNodes.forEach((node) => {
    const next = translateText(node.nodeValue || "");
    if (next !== node.nodeValue) node.nodeValue = next;
  });

  const elements = document.body.querySelectorAll("*");
  elements.forEach((el) => {
    attrsToTranslate.forEach((attr) => {
      const val = el.getAttribute(attr);
      if (!val) return;
      const next = translateText(val);
      if (next !== val) el.setAttribute(attr, next);
    });
  });
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("app_language") || "id");

  const value = useMemo(() => {
    const t = (key, fallback) => translations[language]?.[key] || fallback || key;
    const setAppLanguage = (nextLanguage) => {
      setLanguage(nextLanguage);
      localStorage.setItem("app_language", nextLanguage);
      localStorage.setItem("login_language", nextLanguage);
    };

    return {
      language,
      setLanguage: setAppLanguage,
      t,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
