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

function buildRekapAkunPath(base, data) {
  const params = new URLSearchParams();
  params.set("detail", "1");

  const namaAkun = data.nama_akun || data.created_by_name || data.oleh;
  if (namaAkun) {
    params.set("nama_akun", String(namaAkun));
  }
  if (data.created_by) {
    params.set("created_by", String(data.created_by));
  }
  if (data.bulan) {
    params.set("bulan", String(data.bulan));
  }
  if (data.tahun) {
    params.set("tahun", String(data.tahun));
  }

  const scope = data.scope;
  if (scope === "dalam_projek") {
    params.set("source", "projek");
  } else if (scope === "diluar_projek") {
    params.set("source", "diluar");
  }

  if (data.dashboard_biaya_id) {
    params.set("highlight_type", "dashboard");
    params.set("highlight_id", String(data.dashboard_biaya_id));
    if (data.kategori) params.set("highlight_kategori", String(data.kategori));
    if (data.nominal != null) params.set("highlight_nominal", String(data.nominal));
  } else if (
    data.projek_kerja_id != null &&
    data.item_index != null &&
    data.kategori
  ) {
    params.set("highlight_type", "projek");
    params.set("highlight_project_id", String(data.projek_kerja_id));
    params.set("highlight_item_index", String(data.item_index));
    params.set("highlight_kategori", String(data.kategori));
    if (data.nominal != null) params.set("highlight_nominal", String(data.nominal));
  }

  return `${base}/rekap-akun?${params.toString()}`;
}

/**
 * Arahkan ke halaman daftar Projek Kerja + query `projek_id` untuk sorot baris proyek.
 * @param {{ type?: string, data?: Record<string, unknown> }} notification
 * @param {{ role?: string, divisi?: string }} user
 */
export function resolveNotificationPath(notification, user) {
  const data = notification?.data || {};
  const type = notification?.type || "";
  const projekId = data.projek_kerja_id;
  const role = user?.role || "admin";
  const base = roleBasePath(role);
  const projectSlug = resolveDivisiSlug(data.divisi);
  const userSlug = resolveDivisiSlug(user?.divisi);

  if (type === "biaya_diluar_projek" || type === "biaya_projek") {
    return buildRekapAkunPath(base, data);
  }

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
