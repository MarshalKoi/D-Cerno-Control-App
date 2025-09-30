# PowerShell script to test production build
Write-Host "Testing D-Cerno Control App Production Build" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

$productionPath = ".\src-tauri\target\release\d-cerno-control-app.exe"

if (Test-Path $productionPath) {
    Write-Host "✅ Production executable found" -ForegroundColor Green
    Write-Host "Starting production app..." -ForegroundColor Yellow
    Write-Host "Monitor the console for sidecar config loading messages" -ForegroundColor Cyan
    Write-Host "Expected behavior:" -ForegroundColor White
    Write-Host "  1. Sidecar process should start" -ForegroundColor White
    Write-Host "  2. Config should be loaded from one of the attempted paths" -ForegroundColor White
    Write-Host "  3. API health check should succeed on one of the ports (8000-8002)" -ForegroundColor White
    Write-Host "  4. Microphone toggle should work" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "Press any key to start the app..." -ForegroundColor Yellow
    Read-Host
    
    # Start the production app
    Start-Process -FilePath $productionPath -WorkingDirectory ".\src-tauri\target\release"
} else {
    Write-Host "❌ Production executable not found at: $productionPath" -ForegroundColor Red
    Write-Host "Please run 'npm run tauri build' first" -ForegroundColor Yellow
}