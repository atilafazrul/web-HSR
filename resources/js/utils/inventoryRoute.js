/** Slug divisi yang memakai InventoryPage / FormBarangPage / EditBarangPage */
export const INVENTORY_DIVISI_SLUGS = ["it", "service", "kontraktor", "purchasing", "siplah"];

export function getBasePathFromRole(role) {
  if (role === "super_admin") return "/super_admin";
  if (role === "user") return "/user";
  return "/admin";
}

export function getInventoryDivisiFromPath(pathname) {
  const match = pathname.match(/\/([^/]+)\/inventory/);
  if (match && !["super_admin", "admin", "user"].includes(match[1])) {
    return match[1];
  }
  return "it";
}

export function inventoryListPath(role, divisi) {
  return `${getBasePathFromRole(role)}/${divisi}/inventory`;
}
