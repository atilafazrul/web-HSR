export const scopeDocumentHistory = (
  historyData,
  searchTerm,
  matchItem,
  activeTab,
  projekKerjaId
) => {
  const list = Array.isArray(historyData) ? historyData : [];
  const term = String(searchTerm || "").toLowerCase();
  const projectHistory = projekKerjaId
    ? list.filter((item) => Number(item?.projek_kerja_id) === Number(projekKerjaId))
    : [];
  const scoped = activeTab === "history-project" ? projectHistory : list;

  return {
    filteredHistory: scoped.filter((item) => matchItem(item, term)),
    historyAllCount: list.length,
    historyProjectCount: projectHistory.length,
  };
};
