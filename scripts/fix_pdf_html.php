<?php

$path = dirname(__DIR__) . '/app/Http/Controllers/WorkChecklistController.php';
$lines = file($path);
$out = [];

foreach ($lines as $line) {
    if (str_contains($line, 'preg_replace') && str_contains($line, 'sheet')) {
        continue;
    }
    if (str_contains($line, "str_replace('motion.div'")) {
        continue;
    }
    if (str_contains($line, '.check { font-size: 14pt')) {
        continue;
    }
    $out[] = $line;
}

file_put_contents($path, implode('', $out));
echo "done\n";
