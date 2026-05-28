@echo off
setlocal

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo npm tidak ditemukan. Install Node.js terlebih dahulu.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo Gagal meng-install dependencies.
    pause
    exit /b 1
  )
)

if not exist ".env.local" if exist ".env.example" (
  echo Membuat .env.local dari .env.example...
  copy /Y ".env.example" ".env.local" >nul
)

echo Menjalankan development server...
call npm run dev

if errorlevel 1 (
  echo Project gagal dijalankan.
  pause
  exit /b 1
)

endlocal