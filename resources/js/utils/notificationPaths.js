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
 * Arahkan ke halaman daftar Projek Kerja + query `projek_id` untuk sorot baris proyek.
 * @param {{ type?: string, data?: Record<string, unknown> }} notification
 * @param {{ role?: string, divisi?: string }} user
 */
export function resolveNotificationPath(notification, user) {
  const data = notification?.data || {};
  const projekId = data.projek_kerja_id;
  const role = user?.role || "admin";
  const base = roleBasePath(role);
  const projectSlug = resolveDivisiSlug(data.divisi);
  const userSlug = resolveDivisiSlug(user?.divisi);

  if (!projekId) {
    return `${base}/dashboard`;
  }

  const id = encodeURIComponent(String(projekId));
  const withProjekQuery = (path) => `${path}?projek_id=${id}`;

  if (role === "super_admin") {
    const slug = projectSlug;
    return slug
      ? withProjekQuery(`${base}/${slug}/projek`)
      : withProjekQuery(`${base}/projek-kerja`);
  }

  if (role === "user") {
    const slug = userSlug;
    return slug ? withProjekQuery(`${base}/${slug}/projek`) : `${base}/dashboard`;
  }

  // Admin: buka daftar divisi sendiri (proyek undangan tetap muncul di API)
  const slug = userSlug || projectSlug;
  return slug ? withProjekQuery(`${base}/${slug}/projek`) : `${base}/dashboard`;
}
