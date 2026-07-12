/** Pemetaan nama divisi → segmen URL (selaras dengan UserDashboard / AdminDashboard). */
const DIVISI_TO_PATH = {
  it: "it",
  service: "service",
  sales: "sales",
  kontraktor: "kontraktor",
  logistik: "logistik",
  purchasing: "purchasing",
};

export function resolveDivisiSlug(divisi) {
  const key = String(divisi || "")
    .trim()
    .toLowerCase();
  if (!key) return "";
  return DIVISI_TO_PATH[key] || key.replace(/\s+/g, "");
}

function roleBasePath(role) {
  if (role === "super_admin") return "/super_admin";
  if (role === "user") return "/user";
  return "/admin";
}

/**
 * Bangun path ke halaman daftar Projek Kerja sesuai role, lengkap dengan query string opsional.
 */
function buildProjekListPath(base, role, data, user, query) {
  const projectSlug = resolveDivisiSlug(data.divisi);
  const userSlug = resolveDivisiSlug(user?.divisi);
  const suffix = query ? `?${query}` : "";

  if (role === "super_admin") {
    return projectSlug
      ? `${base}/${projectSlug}/projek${suffix}`
      : `${base}/projek-kerja${suffix}`;
  }

  if (role === "user") {
    return userSlug ? `${base}/${userSlug}/projek${suffix}` : `${base}/dashboard`;
  }

  // Admin: buka daftar divisi sendiri (proyek undangan tetap muncul di API)
  const slug = userSlug || projectSlug;
  return slug ? `${base}/${slug}/projek${suffix}` : `${base}/dashboard`;
}

/**
 * Tentukan tujuan navigasi saat notifikasi diklik.
 * - Biaya di dalam projek  → buka projek terkait (modal biaya proyek).
 * - Biaya di luar projek   → buka panel "Biaya Diluar Projek" pada dashboard.
 * - Notifikasi proyek      → buka daftar projek & sorot barisnya.
 * @param {{ type?: string, data?: Record<string, unknown> }} notification
 * @param {{ role?: string, divisi?: string }} user
 */
export function resolveNotificationPath(notification, user) {
  const data = notification?.data || {};
  const type = notification?.type || "";
  const projekId = data.projek_kerja_id;
  const role = user?.role || "admin";
  const base = roleBasePath(role);

  // Biaya di luar projek → dashboard (panel Biaya Diluar Projek), sorot baris terkait.
  if (type === "biaya_diluar_projek") {
    const params = new URLSearchParams();
    if (data.dashboard_biaya_id != null) {
      params.set("biaya_diluar", String(data.dashboard_biaya_id));
    }
    const q = params.toString();
    return `${base}/dashboard${q ? `?${q}` : ""}`;
  }

  // Biaya di dalam projek → buka projek terkait dan tampilkan modal biaya proyek.
  if (type === "biaya_projek") {
    if (!projekId) return `${base}/dashboard`;
    const query = `open_biaya=${encodeURIComponent(String(projekId))}`;
    return buildProjekListPath(base, role, data, user, query);
  }

  if (type === "cuti_pengajuan_baru") {
    return `${base}/cuti-approval`;
  }

  if (type === "cuti_disetujui" || type === "cuti_ditolak") {
    return `${base}/cuti`;
  }

  if (type === "biaya_dilunasi") {
    if (data.scope === "diluar_projek") {
      const params = new URLSearchParams();
      if (data.dashboard_biaya_id != null) {
        params.set("biaya_diluar", String(data.dashboard_biaya_id));
      }
      const q = params.toString();
      return `${base}/dashboard${q ? `?${q}` : ""}`;
    }

    if (projekId) {
      const query = `open_biaya=${encodeURIComponent(String(projekId))}`;
      return buildProjekListPath(base, role, data, user, query);
    }

    return `${base}/dashboard`;
  }

  if (!projekId) {
    return `${base}/dashboard`;
  }

  const query = `projek_id=${encodeURIComponent(String(projekId))}`;
  return buildProjekListPath(base, role, data, user, query);
}
