$ErrorActionPreference = 'Stop'

Write-Host "[1/4] Checking required files..."
$requiredFiles = @(
  "public/index.html",
  "public/js/main.js",
  "public/js/data.js",
  "public/js/render.js",
  "public/js/state.js",
  "public/styles/main.css",
  "public/styles/themes.css",
  "firebase.json"
)

$missing = @()
foreach ($file in $requiredFiles) {
  if (-not (Test-Path $file)) {
    $missing += $file
  }
}

if ($missing.Count -gt 0) {
  Write-Error ("Missing required files:`n- " + ($missing -join "`n- "))
}

Write-Host "[2/4] Checking legacy files were removed..."
$legacyFiles = @(
  "public/app.js",
  "public/menu.json",
  "public/style/style.css",
  "public/style/theme.css"
)

$legacyFound = @()
foreach ($file in $legacyFiles) {
  if (Test-Path $file) {
    $legacyFound += $file
  }
}

if ($legacyFound.Count -gt 0) {
  Write-Error ("Legacy files still exist:`n- " + ($legacyFound -join "`n- "))
}

Write-Host "[3/4] Checking Firebase hosting config..."
$firebaseConfig = Get-Content -Raw -Path "firebase.json" | ConvertFrom-Json
if ($null -eq $firebaseConfig.hosting) {
  Write-Error "firebase.json has no hosting section."
}
if ($firebaseConfig.hosting.public -ne "public") {
  Write-Error "firebase.json hosting.public must be 'public'."
}

Write-Host "[4/4] Checking Google Sheets CSV endpoint..."
$csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSRDRCkhLhChA5_9hur2SiPJ8cjlPDTQ2tbVNsvdZphTh3CXRyiTDQEbqq2sVO_A4PTRs9evtwbf6DQ/pub?gid=0&single=true&output=csv"
$response = Invoke-WebRequest -Uri $csvUrl -Method Head -TimeoutSec 20 -UseBasicParsing
if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) {
  Write-Error "CSV endpoint is not healthy. HTTP $($response.StatusCode)"
}

Write-Host "Sanity check passed. Ready to deploy." -ForegroundColor Green
