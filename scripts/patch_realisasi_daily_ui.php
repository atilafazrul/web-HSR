<?php

$path = dirname(__DIR__) . '/resources/js/pages/WorkChecklistFormPage.jsx';
$content = file_get_contents($path);

$start = strpos($content, '          {/* Daftar Pekerjaan */}');
$end = strpos($content, '          {/* Pekerjaan tambahan (realisasi) */}', $start);
if ($start === false || $end === false) {
    fwrite(STDERR, "markers not found\n");
    exit(1);
}

$replacement = <<<'JS'
          {/* Daftar Pekerjaan / Checklist harian */}
          <DashboardSurface className={surfacePad}>
            <motion.div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <SectionTitle>
                  {layoutMode === "weekly"
                    ? tr("Checklist Harian", "Daily Checklist")
                    : tr("Daftar Pekerjaan", "Work Items")}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({layoutMode === "weekly" ? dailyEntries.length : workItems.length})
                  </span>
                </SectionTitle>
                {layoutMode === "weekly" && (
                  <AddBtn onClick={addDailyEntry} label={tr("Tambah Hari", "Add Day")} />
                )}
              </div>
              {layoutMode === "weekly" ? (
                <div className="p-4 space-y-4">
                  {dailyEntries.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      {tr(
                        "Klik Tambah Hari untuk mengisi minggu, hari, tanggal, dan checklist.",
                        "Click Add Day to enter week, day, date, and checklist."
                      )}
                    </p>
                  ) : (
                    dailyEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {tr("Entri checklist", "Checklist entry")}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeDailyEntry(entry.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            title={tr("Hapus", "Remove")}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <label className="block">
                            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                              {tr("Urutan Hari", "Day slot")}
                            </span>
                            <select
                              className={`${inputCls} mt-1`}
                              value={entry.check_row}
                              onChange={(e) => onDailySlotChange(entry.id, e.target.value)}
                            >
                              <option value="">
                                {tr("— Pilih —", "— Select —")}
                              </option>
                              {weekSlots.map((slot) => {
                                const used =
                                  usedCheckRows.has(String(slot.check_row)) &&
                                  String(entry.check_row) !== String(slot.check_row);
                                return (
                                  <option
                                    key={slot.check_row}
                                    value={slot.check_row}
                                    disabled={used}
                                  >
                                    {tr("Hari ke", "Day")} {slot.col_d}
                                  </option>
                                );
                              })}
                            </select>
                          </label>
                          <Field
                            label={tr("Minggu", "Week")}
                            value={entry.minggu}
                            onChange={(v) => updateDailyEntry(entry.id, { minggu: v })}
                          />
                          <Field
                            label={tr("Hari", "Day")}
                            value={entry.hari}
                            onChange={(v) => updateDailyEntry(entry.id, { hari: v })}
                          />
                          <label className="block">
                            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                              {tr("Tanggal", "Date")}
                            </span>
                            <input
                              type="date"
                              className={`${inputCls} mt-1`}
                              value={entry.tanggal}
                              onChange={(e) =>
                                updateDailyEntry(entry.id, { tanggal: e.target.value })
                              }
                            />
                          </label>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 pt-1">
                          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={entry.sesuai}
                              onChange={() => setDailyCheck(entry.id, "sesuai")}
                              className={checkCls}
                            />
                            {tr("Sesuai", "OK")}
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={entry.tidak_sesuai}
                              onChange={() => setDailyCheck(entry.id, "tidak_sesuai")}
                              className={checkCls}
                            />
                            {tr("Tidak Sesuai", "NOK")}
                          </label>
                        </motion.div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="max-h-[min(65vh,560px)] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[640px]">
                    <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                      <tr className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        <th className="px-3 py-2.5 min-w-[200px]">
                          {tr("Nama Kegiatan", "Activity")}
                        </th>
                        <th className="px-3 py-2.5 w-20 text-center">{tr("Sesuai", "OK")}</th>
                        <th className="px-3 py-2.5 w-24 text-center">
                          {tr("Tidak", "NOK")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemStates.map((item) => {
                        if (item.is_section) {
                          return (
                            <tr key={`section-${item.row}`} className="bg-indigo-50/90">
                              <td
                                colSpan={3}
                                className="px-3 py-2 text-xs font-bold text-indigo-900 uppercase tracking-wide"
                              >
                                {item.label}
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={item.row} className="bg-white hover:bg-slate-50/60">
                            <td className="px-3 py-2 text-slate-800 align-top leading-snug">
                              {item.label}
                            </td>
                            <td className="px-3 py-2 text-center align-middle">
                              <input
                                type="checkbox"
                                checked={item.sesuai}
                                onChange={() => setCheck(item.row, "sesuai")}
                                className={checkCls}
                              />
                            </td>
                            <td className="px-3 py-2 text-center align-middle">
                              <input
                                type="checkbox"
                                checked={item.tidak_sesuai}
                                onChange={() => setCheck(item.row, "tidak_sesuai")}
                                className={checkCls}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DashboardSurface>

JS;

$replacement = str_replace('motion.div', 'motion.div', $replacement);
$replacement = str_replace('motion.div', 'div', $replacement);

$content = substr($content, 0, $start) . $replacement . substr($content, $end);
file_put_contents($path, $content);
echo "patched ok\n";
