import React from "react";

/** Latar belakang halaman dashboard (seragam di admin / super admin / user) */
export const dashboardShellBgClass =
  "flex min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-100 via-[#f0f4fc] to-indigo-50/40";

/** Kartu konten utama: putih, border halus, bayangan ringan */
export function DashboardSurface({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white/95 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/[0.03] backdrop-blur-sm ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/** Judul sambutan */
export function DashboardWelcome({ greeting, name, tag }) {
  const showTag = typeof tag === "string" && tag.trim() !== "";
  return (
    <header className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-white to-indigo-50/50 px-5 py-5 sm:px-6 sm:py-6 shadow-sm shadow-slate-900/5">
      <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-indigo-400/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />
      {showTag ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600/90">{tag.trim()}</p>
      ) : null}
      <h1 className={`text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl ${showTag ? "mt-1" : "mt-0"}`}>
        {greeting}
        {name ? <span className="text-indigo-700">, {name}</span> : null}
      </h1>
      <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
    </header>
  );
}

/** Judul section + deskripsi opsional */
export function DashboardSectionHeading({ title, subtitle, className = "" }) {
  return (
    <div className={`mb-4 sm:mb-5 ${className}`.trim()}>
      <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg md:text-xl">{title}</h2>
      {subtitle ? <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500 sm:text-sm">{subtitle}</p> : null}
    </div>
  );
}

const COLOR_MAP = {
  blue: {
    badge: "bg-sky-50 text-sky-700 ring-sky-200/80",
    dot: "from-sky-500 to-indigo-500",
    glow: "bg-sky-400/10",
  },
  green: {
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
    dot: "from-emerald-500 to-teal-500",
    glow: "bg-emerald-400/10",
  },
  yellow: {
    badge: "bg-amber-50 text-amber-900 ring-amber-200/80",
    dot: "from-amber-400 to-orange-500",
    glow: "bg-amber-400/10",
  },
  red: {
    badge: "bg-rose-50 text-rose-800 ring-rose-200/80",
    dot: "from-rose-500 to-red-600",
    glow: "bg-rose-400/10",
  },
};

/** Kartu ringkasan angka (status / total) */
export function DashboardSummaryCard({ title, value, icon, color = "blue", isMobile }) {
  const theme = COLOR_MAP[color] || COLOR_MAP.blue;
  const iconBox =
    isMobile === true
      ? "h-9 w-9 rounded-lg sm:h-10 sm:w-10"
      : "h-10 w-10 rounded-xl sm:h-11 sm:w-11 md:h-12 md:w-12 lg:h-14 lg:w-14";

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/90 p-3 shadow-sm transition-all hover:border-slate-300/90 hover:shadow-md sm:rounded-2xl sm:p-4 md:p-5">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${theme.glow}`} />
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${theme.dot} opacity-90`} />
      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">{title}</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl md:text-2xl lg:text-3xl">
            {value}
          </p>
        </div>
        <div
          className={`flex shrink-0 items-center justify-center ring-1 ring-inset transition group-hover:scale-[1.03] ${iconBox} ${theme.badge}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/**
 * Pill status di tabel aktivitas projek: satu baris (nowrap) + warna per status.
 */
export function projekActivityStatusPillClass(status) {
  const s = String(status || "").trim();
  const base =
    "inline-flex max-w-full shrink-0 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap";
  switch (s) {
    case "Selesai":
      return `${base} bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/70`;
    case "Proses":
    case "Proses Pekerjaan":
      return `${base} bg-amber-100 text-amber-900 ring-1 ring-amber-200/70`;
    case "Terlambat":
      return `${base} bg-rose-100 text-rose-800 ring-1 ring-rose-200/70`;
    case "Persiapan":
      return `${base} bg-sky-100 text-sky-900 ring-1 ring-sky-200/70`;
    case "Dibuat":
      return `${base} bg-slate-100 text-slate-800 ring-1 ring-slate-200/60`;
    case "Editing":
      return `${base} bg-violet-100 text-violet-900 ring-1 ring-violet-200/70`;
    case "Invoicing":
      return `${base} bg-indigo-100 text-indigo-900 ring-1 ring-indigo-200/70`;
    case "Barang sudah siap":
      return `${base} bg-teal-100 text-teal-900 ring-1 ring-teal-200/80`;
    default:
      return `${base} bg-slate-100 text-slate-700 ring-1 ring-slate-200/60`;
  }
}
