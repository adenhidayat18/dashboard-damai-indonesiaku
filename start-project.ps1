$ErrorActionPreference = 'Stop'

Set-Location -Path $PSScriptRoot

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host 'npm tidak ditemukan. Install Node.js terlebih dahulu.'
    Read-Host 'Tekan Enter untuk keluar'
    exit 1
}

if (-not (Test-Path 'node_modules')) {
    Write-Host 'Installing dependencies...'
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Gagal meng-install dependencies.'
        Read-Host 'Tekan Enter untuk keluar'
        exit $LASTEXITCODE
    }
}

if (-not (Test-Path '.env.local') -and (Test-Path '.env.example')) {
    Write-Host 'Membuat .env.local dari .env.example...'
    Copy-Item '.env.example' '.env.local'
}

Write-Host 'Menjalankan development server...'
npm run dev

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Project gagal dijalankan.'
    Read-Host 'Tekan Enter untuk keluar'
    exit $LASTEXITCODE
}