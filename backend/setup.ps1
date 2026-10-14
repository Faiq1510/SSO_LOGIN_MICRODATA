# ============================================================
# setup.ps1 — SSO Project Dev Setup (Windows + Podman + WSL2)
# Jalankan sebagai Administrator:
#   Right-click PowerShell → Run as administrator
#   lalu: .\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   SSO Project — Dev Environment Setup     " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Cek apakah dijalankan sebagai Administrator ──────────
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent() `
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-Not $isAdmin) {
    Write-Host "❌ Script ini harus dijalankan sebagai Administrator." -ForegroundColor Red
    Write-Host "   Klik kanan PowerShell → 'Run as administrator'" -ForegroundColor Yellow
    exit 1
}

# ── 2. Salin .env jika belum ada ────────────────────────────
if (-Not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "📄 File .env dibuat dari .env.example." -ForegroundColor Yellow
        Write-Host "   ⚠️  Buka file .env dan isi nilai yang diperlukan sebelum melanjutkan." -ForegroundColor Yellow
        Write-Host ""
        $confirm = Read-Host "Sudah mengisi .env? (y/n)"
        if ($confirm -ne "y") {
            Write-Host "Setup dibatalkan. Isi .env terlebih dahulu lalu jalankan script ini kembali." -ForegroundColor Red
            exit 0
        }
    } else {
        Write-Host "⚠️  File .env tidak ditemukan dan .env.example tidak tersedia." -ForegroundColor Yellow
        Write-Host "   Pastikan file .env sudah ada sebelum menjalankan compose." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ File .env sudah ada." -ForegroundColor Green
}

# ── 3. Pastikan Podman machine berjalan ─────────────────────
Write-Host ""
Write-Host "🔄 Memeriksa status Podman machine..." -ForegroundColor Cyan

$machineInfo = podman machine list --format "{{.Running}}" 2>$null
if ($machineInfo -notmatch "true") {
    Write-Host "   Podman machine belum berjalan. Memulai..." -ForegroundColor Yellow
    podman machine start
    Start-Sleep -Seconds 5
}
Write-Host "✅ Podman machine berjalan." -ForegroundColor Green

# ── 4. Ambil IP WSL2 secara otomatis ────────────────────────
Write-Host ""
Write-Host "🔍 Mengambil IP WSL2..." -ForegroundColor Cyan

$wslIP = (podman machine ssh "hostname -I" 2>$null).Trim().Split(" ")[0]

if (-Not $wslIP) {
    Write-Host "❌ Tidak dapat mengambil IP WSL2. Pastikan Podman machine sudah berjalan." -ForegroundColor Red
    exit 1
}
Write-Host "✅ IP WSL2: $wslIP" -ForegroundColor Green

# ── 5. Daftarkan aturan Firewall ─────────────────────────────
Write-Host ""
Write-Host "🔥 Mengatur Windows Firewall..." -ForegroundColor Cyan

$ports = @(
    @{ Port = 3000; Name = "SSO App" },
    @{ Port = 5432; Name = "PostgreSQL" },
    @{ Port = 5050; Name = "pgAdmin" }
)

foreach ($entry in $ports) {
    $ruleName = "Allow $($entry.Name) $($entry.Port)"
    $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if (-Not $existing) {
        New-NetFirewallRule `
            -DisplayName $ruleName `
            -Direction Inbound `
            -LocalPort $entry.Port `
            -Protocol TCP `
            -Action Allow `
            -Profile Any | Out-Null
        Write-Host "   ✅ Firewall rule ditambahkan: $ruleName" -ForegroundColor Green
    } else {
        Write-Host "   ✅ Firewall rule sudah ada: $ruleName" -ForegroundColor DarkGray
    }
}

# ── 6. Hapus port-proxy lama lalu buat yang baru ─────────────
Write-Host ""
Write-Host "🔀 Mengatur port-proxy (WSL2 → localhost)..." -ForegroundColor Cyan

foreach ($entry in $ports) {
    # Hapus rule lama jika ada (IP WSL bisa berubah setelah restart)
    netsh interface portproxy delete v4tov4 `
        listenport=$($entry.Port) listenaddress=0.0.0.0 2>$null | Out-Null

    # Tambahkan rule baru
    netsh interface portproxy add v4tov4 `
        listenaddress=0.0.0.0 `
        listenport=$($entry.Port) `
        connectaddress=$wslIP `
        connectport=$($entry.Port) | Out-Null

    Write-Host "   ✅ localhost:$($entry.Port) → $wslIP`:$($entry.Port)" -ForegroundColor Green
}

# ── 7. Jalankan Podman Compose ───────────────────────────────
Write-Host ""
Write-Host "🚀 Menjalankan semua service via podman compose..." -ForegroundColor Cyan
podman compose -f docker-compose.yml up -d

# ── 8. Verifikasi container berjalan ─────────────────────────
Write-Host ""
Write-Host "🔍 Memeriksa status container..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ── 9. Ringkasan ─────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   ✅ Setup selesai!                        " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Akses aplikasi:" -ForegroundColor White
Write-Host "  🌐 App      → http://localhost:3000" -ForegroundColor Cyan
Write-Host "  🗄️  pgAdmin  → http://localhost:5050" -ForegroundColor Cyan
Write-Host "       Email   : admin@admin.com" -ForegroundColor DarkGray
Write-Host "       Password: baseball123" -ForegroundColor DarkGray
Write-Host "  🐘 Database → localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Catatan: Jika restart PC, jalankan setup.ps1 kembali" -ForegroundColor Yellow
Write-Host "   karena IP WSL2 dapat berubah setelah restart." -ForegroundColor Yellow
Write-Host ""
