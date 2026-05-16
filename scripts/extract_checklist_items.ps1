param([string]$Type = "planning")

$base = "$env:TEMP\hsr_checklist_parse\$Type"
if (-not (Test-Path "$base\xl\worksheets\sheet1.xml")) {
    $src = if ($Type -eq "planning") {
        "C:\Users\atila\Downloads\Week1 HSR FORM WORK CHECKLIST (PLANNING).xlsx"
    } else {
        "C:\Users\atila\Downloads\Week1 HSR FORM WORK CHECKLIST (REALISASI).xlsx"
    }
    New-Item -ItemType Directory -Path $base -Force | Out-Null
    Copy-Item $src "$base\file.zip"
    Expand-Archive "$base\file.zip" -DestinationPath $base -Force
}

$sheetPath = "$base\xl\worksheets\sheet1.xml"
$ssPath = "$base\xl\sharedStrings.xml"

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
$byRow = @{}
foreach ($row in $sheet.worksheet.sheetData.row) {
    $rnum = [int]$row.r
    $cells = @{}
    foreach ($c in $row.c) {
        $cell = Get-CellValue $c
        $cells[$cell.col] = $cell.val
    }
    $byRow[$rnum] = $cells
}

$items = @()
foreach ($r in ($byRow.Keys | Sort-Object)) {
    if ($r -lt 37) { continue }
    $cells = $byRow[$r]
    $label = $cells['H']
    if (-not $label) { continue }
    $label = [string]$label
    if ($label.Length -lt 2) { continue }
    $isSection = $label -match '^(OT-|PRELIMINARY|RADIOLOGY|MRI|CSSD|Demolition|Adaptation)' -and $label -notmatch '^-'
    $items += [pscustomobject]@{
        row = $r
        label = $label
        is_section = $isSection
        col_c = $cells['C']
        col_d = $cells['D']
        col_e = $cells['E']
    }
}

Write-Host "Type: $Type Total items:" $items.Count
$items | Select-Object -First 30 | Format-Table -AutoSize
$items | Select-Object -Last 10 | Format-Table -AutoSize

$out = @{
    type = $Type
    items = $items | ForEach-Object { @{ row = $_.row; label = $_.label; is_section = $_.is_section } }
}
$outPath = "c:\laragon\www\web-HSR\storage\app\private\templates\checklist_$Type.json"
New-Item -ItemType Directory -Path (Split-Path $outPath) -Force | Out-Null
$out | ConvertTo-Json -Depth 5 | Set-Content $outPath -Encoding UTF8
Write-Host "Saved to $outPath"
