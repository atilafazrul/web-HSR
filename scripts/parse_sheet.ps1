$sheetPath = "$env:TEMP\hsr_checklist_parse\planning\xl\worksheets\sheet1.xml"
$ssPath = "$env:TEMP\hsr_checklist_parse\planning\xl\sharedStrings.xml"

[xml]$ssxml = Get-Content $ssPath
$strings = @()
foreach ($si in $ssxml.sst.si) {
    if ($si.t) { $strings += [string]$si.t }
    elseif ($si.r) { $strings += (($si.r | ForEach-Object { [string]$_.t }) -join '') }
    else { $strings += '' }
}

function Get-CellValue($c) {
    $ref = $c.r
    $col = ($ref -replace '\d+','')
    $row = [int]($ref -replace '\D+','')
    $v = $c.v
    if ($null -eq $v) { return @{ col=$col; row=$row; val='' } }
    $t = $c.t
    if ($t -eq 's') { return @{ col=$col; row=$row; val=$strings[[int]$v] } }
    return @{ col=$col; row=$row; val=[string]$v }
}

[xml]$sheet = Get-Content $sheetPath
$rows = @{}
foreach ($row in $sheet.worksheet.sheetData.row) {
    $rnum = [int]$row.r
    foreach ($c in $row.c) {
        $cell = Get-CellValue $c
        if ($cell.val -ne '') {
            if (-not $rows.ContainsKey($rnum)) { $rows[$rnum] = @() }
            $rows[$rnum] += "$($cell.col)=$($cell.val)"
        }
    }
}

1..50 | ForEach-Object {
    if ($rows.ContainsKey($_)) {
        Write-Host "R$_`: $($rows[$_] -join ' | ')"
    }
}
