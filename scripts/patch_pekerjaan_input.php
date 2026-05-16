<?php

$path = dirname(__DIR__) . '/resources/js/pages/WorkChecklistFormPage.jsx';
$content = file_get_contents($path);

$search = <<<'TXT'
                          </label>
                        </div>
                        <motion.div className="flex flex-wrap items-center gap-6 pt-1">
TXT;
$search = str_replace('motion.div', 'div', $search);

$insert = <<<'JS'

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                              {tr("Pekerjaan", "Work items")}
                            </span>
                            <button
                              type="button"
                              onClick={() => addPekerjaanLine(entry.id)}
                              disabled={
                                entry.pekerjaan?.length >= maxPekerjaanForEntry(entry)
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
                            >
                              <Plus size={14} />
                              {tr("Tambah", "Add")}
                            </button>
                          </motion.div>
                          {(entry.pekerjaan || []).map((line, li) => (
                            <div key={line.id} className="flex gap-2 items-start">
                              <span className="mt-2.5 text-xs text-slate-400 w-5 shrink-0">
                                {li + 1}.
                              </span>
                              <textarea
                                className={`${inputCls} min-h-[72px] resize-y flex-1`}
                                placeholder={tr(
                                  "Nama kegiatan / pekerjaan...",
                                  "Activity / work description..."
                                )}
                                value={line.text}
                                onChange={(ev) =>
                                  updatePekerjaanLine(entry.id, line.id, ev.target.value)
                                }
                              />
                              {(entry.pekerjaan || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePekerjaanLine(entry.id, line.id)}
                                  className="mt-2 p-1 text-rose-500 hover:bg-rose-50 rounded shrink-0"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </motion.div>
                          ))}
                        </motion.div>
JS;
$insert = str_replace('motion.div', 'motion.div', $insert);
$insert = str_replace('motion.div', 'motion.div', $insert);
$insert = str_replace('motion.div', 'div', $insert);

$replace = "                          </label>\r\n                        </motion.div>{$insert}\r\n                        <motion.div className=\"flex flex-wrap items-center gap-6 pt-1\">";
$replace = str_replace('motion.div', 'motion.div', $replace);
$replace = str_replace('motion.div', 'div', $replace);

if (strpos($content, $search) === false) {
  // try CRLF
  $search = str_replace("\n", "\r\n", $search);
  $replace = str_replace("\n", "\r\n", str_replace('motion.div', 'div', "                          </label>\r\n                        </motion.div>{$insert}\r\n                        <motion.div className=\"flex flex-wrap items-center gap-6 pt-1\">"));
  $replace = str_replace('motion.div', 'div', $replace);
}

if (strpos($content, $search) === false) {
    fwrite(STDERR, "search not found\n");
    exit(1);
}

$content = str_replace($search, $replace, $content);
file_put_contents($path, $content);
echo "patched ok\n";
