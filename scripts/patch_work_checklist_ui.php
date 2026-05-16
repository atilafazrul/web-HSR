<?php

$path = dirname(__DIR__) . '/resources/js/pages/WorkChecklistFormPage.jsx';
$content = file_get_contents($path);

$markerStart = '                  <span className="ml-2 text-sm font-normal text-slate-500">';
$markerEnd = '          {/* Pekerjaan tambahan (realisasi) */}';

$start = strpos($content, $markerStart);
$end = strpos($content, $markerEnd, $start);
if ($start === false || $end === false) {
    fwrite(STDERR, "markers not found\n");
    exit(1);
}

$replacement = <<<'JS'
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({layoutMode === "weekly" ? weekCheckCount : workItems.length})
                  </span>
                </SectionTitle>
              </div>
              <p className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 bg-amber-50/50">
                {layoutMode === "weekly"
                  ? tr(
                      "Centang per minggu (hari) — sesuai baris Excel.",
                      "Check per week/day — matches Excel rows."
                    )
                  : tr("Centang per baris pekerjaan.", "Check per work item row.")}
              </p>
              <motion.div className="max-h-[min(65vh,560px)] overflow-y-auto overflow-x-auto">
                {layoutMode === "weekly" ? (
                  <div className="divide-y divide-slate-100">
                    {weekGroups.map((group, gi) => {
                      if (group.is_section) {
                        return (
                          <div
                            key={`section-${gi}`}
                            className="bg-indigo-50/80 px-4 py-3"
                          >
                            <p className="text-xs font-bold text-indigo-900 uppercase">
                              {group.section_title}
                            </p>
                            <ul className="mt-2 space-y-1">
                              {group.activities.map((a) => (
                                <li
                                  key={a.row}
                                  className="text-sm text-slate-700 pl-3 border-l-2 border-indigo-200"
                                >
                                  {a.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }

                      return (
                        <div key={group.check_row} className="bg-white">
                          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {tr("Minggu", "Week")} {group.col_c}
                                <span className="text-slate-500 font-normal">
                                  {" "}
                                  · {tr("Hari", "Day")} {group.col_d}
                                </span>
                              </p>
                              {group.tanggal && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {group.tanggal}
                                </p>
                              )}
                            </div>
                            <motion.div className="flex items-center gap-5">
                              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={group.sesuai}
                                  onChange={() => setWeekCheck(gi, "sesuai")}
                                  className={checkCls}
                                />
                                {tr("Sesuai", "OK")}
                              </label>
                              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={group.tidak_sesuai}
                                  onChange={() => setWeekCheck(gi, "tidak_sesuai")}
                                  className={checkCls}
                                />
                                {tr("Tidak Sesuai", "NOK")}
                              </label>
                            </div>
                          </div>
                          <ul className="px-4 py-3 space-y-2">
                            {group.activities.map((a) => (
                              <li
                                key={a.row}
                                className="text-sm text-slate-700 leading-snug pl-3 border-l-2 border-slate-200"
                              >
                                {a.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          </DashboardSurface>

JS;

$replacement = str_replace('motion.div', 'div', $replacement);

$content = substr($content, 0, $start) . $replacement . substr($content, $end);
file_put_contents($path, $content);
echo "patched ok\n";
