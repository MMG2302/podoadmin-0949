# Verificación previa al deploy de PodoAdmin (Windows)
# Ejecuta la misma lógica que scripts/prepare-deploy.cjs

param(
    [switch]$Build,
    [switch]$DryRun,
    [switch]$Full
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "PodoAdmin — prepare-deploy" -ForegroundColor Green
Write-Host "Carpeta: $ProjectRoot`n"

$nodeArgs = @("scripts/prepare-deploy.cjs")
if ($Full) {
    $nodeArgs += "--full"
} else {
    if ($Build) { $nodeArgs += "--build" }
    if ($DryRun) { $nodeArgs += "--dry-run" }
}

& node @nodeArgs
exit $LASTEXITCODE
