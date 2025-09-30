# PowerShell script to test production build
Write-Host "Testing D-Cerno Control App Production Build" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

$productionPath = ".\src-tauri\target\release\d-cerno-control-app.exe"

if (Test-Path $productionPath) {
    Write-Host "✅ Production executable found" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "🔧 Recent fixes applied:" -ForegroundColor Cyan
    Write-Host "  • Enhanced startup retry logic (10 attempts with 1s delays)" -ForegroundColor White
    Write-Host "  • Port caching to avoid repeated health checks" -ForegroundColor White
    Write-Host "  • Improved sidecar health monitoring (15s startup window)" -ForegroundColor White
    Write-Host "  • Better error messages during startup phase" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "Expected behavior:" -ForegroundColor Yellow
    Write-Host "  1. Sidecar process should start with health checks" -ForegroundColor White
    Write-Host "  2. Config should be loaded from bundled sidecar resources" -ForegroundColor White
    Write-Host "  3. API health check should succeed (with retries if needed)" -ForegroundColor White
    Write-Host "  4. Microphone toggle should work reliably" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "Note: If API shows as offline initially, it should auto-recover" -ForegroundColor Yellow
    Write-Host "within 10 seconds due to the new retry mechanism." -ForegroundColor Yellow
    Write-Host "" -ForegroundColor White
    Write-Host "Press any key to start the app..." -ForegroundColor Green
    Read-Host
    
    # Start the production app
    Start-Process -FilePath $productionPath -WorkingDirectory ".\src-tauri\target\release"
} else {
    Write-Host "❌ Production executable not found at: $productionPath" -ForegroundColor Red
    Write-Host "Please run 'npm run tauri build' first" -ForegroundColor Yellow
}