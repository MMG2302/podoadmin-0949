# Asistente de despliegue PodoAdmin (Windows PowerShell)
# No sustituye tu login en Cloudflare; guÃ­a y ejecuta pasos locales seguros.

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Write-Step($n, $msg) {
    Write-Host ""
    Write-Host "=== Paso $n : $msg ===" -ForegroundColor Cyan
}

function Test-Command($name) {
    $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

Write-Host "PodoAdmin - Asistente de despliegue" -ForegroundColor Green
Write-Host "Carpeta: $ProjectRoot"

if ($ProjectRoot -match "OneDrive") {
    Write-Host ""
    Write-Host "NOTA: La ruta incluye OneDrive\Escritorio (Windows suele guardar el Escritorio ahi)." -ForegroundColor DarkYellow
    Write-Host "      Puedes continuar desde el Escritorio. Si el build falla por sincronizacion, copia a C:\proyectos\podoadmin-0949" -ForegroundColor DarkYellow
}

Write-Step 1 "Comprobar Node.js"
if (-not (Test-Command "node")) {
    Write-Host "Instala Node.js LTS desde https://nodejs.org y vuelve a ejecutar este script." -ForegroundColor Red
    exit 1
}
Write-Host "Node: $(node -v)"
Write-Host "npm:  $(npm -v)"

Write-Step 2 "Instalar dependencias (npm install)"
$install = Read-Host "Ejecutar npm install? (S/n)"
if ($install -ne "n") {
    npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Step 3 "Generar claves secretas locales"
if (-not (Test-Path ".dev.vars")) {
    $setup = Read-Host "Ejecutar npm run setup:env? (S/n)"
    if ($setup -ne "n") {
        npm run setup:env
    }
} else {
    Write-Host ".dev.vars ya existe. Abrelo y copia JWT_SECRET, REFRESH_TOKEN_SECRET y CSRF_SECRET para Cloudflare."
}

Write-Step 4 "Login en Cloudflare"
Write-Host "Ejecuta en esta ventana:  npx wrangler login"
$login = Read-Host "Ya hiciste wrangler login? (s/n)"
if ($login -ne "s") {
    npx wrangler login
}

Write-Step 5 "Dashboard Cloudflare (manual)"
Write-Host @"
En https://dash.cloudflare.com :
  1) D1 -> Create database (ej. podoadmin-prod) -> copia Database ID
  2) R2 -> Create bucket (ej. podoadmin-prod)
  3) Edita wrangler.toml: name, database_id, database_name, bucket_name
  4) Anade [vars] con APP_BASE_URL (la URL *.workers.dev tras el primer deploy)
"@ -ForegroundColor Yellow
Read-Host "Pulsa Enter cuando hayas editado wrangler.toml"

Write-Step 6 "Secretos en Cloudflare"
Write-Host @"
Ejecuta (pega valores desde .dev.vars):
  npx wrangler secret put JWT_SECRET
  npx wrangler secret put REFRESH_TOKEN_SECRET
  npx wrangler secret put CSRF_SECRET
"@ -ForegroundColor Yellow
Read-Host "Pulsa Enter cuando hayas subido los 3 secretos"

Write-Step 7 "Migraciones D1 remotas"
$mig = Read-Host "Ejecutar npm run db:migrate:remote? (S/n)"
if ($mig -ne "n") {
    npm run db:migrate:remote
}

Write-Step 8 "Crear super administrador"
Write-Host 'Ejemplo:'
Write-Host '  node scripts/create-super-admin.cjs "tu@email.com" "TuPassword123!" "Tu Nombre"'
Write-Host '  npx wrangler d1 execute DB --remote --file=scripts/super-admin.sql'
$admin = Read-Host "Ya creaste el super_admin en la BD remota? (s/n)"
if ($admin -ne "s") {
    $email = Read-Host "Email del super admin"
    $pass = Read-Host "Contrasena (se mostrara en pantalla)"
    $nombre = Read-Host "Nombre"
    node scripts/create-super-admin.cjs $email $pass $nombre
    npx wrangler d1 execute DB --remote --file=scripts/super-admin.sql
}

Write-Step 9 "Build y deploy"
$deploy = Read-Host "Ejecutar npm run build y npm run deploy? (S/n)"
if ($deploy -ne "n") {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build fallo. Revisa errores arriba; si habla de 'nube', copia el proyecto a C:\proyectos\podoadmin-0949." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    npm run deploy
    Write-Host ""
    Write-Host "Copia la URL que aparece arriba y actualiza APP_BASE_URL en wrangler.toml si hace falta, luego: npm run deploy" -ForegroundColor Green
}

Write-Host ""
Write-Host "Guia completa: docs\DEPLOY_PASO_A_PASO.md" -ForegroundColor Green
Write-Host "Checklist: CHECKLIST_DEPLOY_PRODUCCION.md"
