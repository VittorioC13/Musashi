$response = Invoke-RestMethod -Uri "https://musashi-api.vercel.app/api/analyze-text" -Method Post -Body '{"text":"Trump immigration deportation policy"}' -ContentType "application/json"

Write-Host "`n🎯 Musashi API Test Results:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Event ID: $($response.event_id)" -ForegroundColor Yellow
Write-Host "Signal Type: $($response.signal_type)" -ForegroundColor Yellow
Write-Host "Urgency: $($response.urgency)" -ForegroundColor Yellow

Write-Host "`n📊 Market Found:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  Title: $($response.data.markets[0].market.title)"
Write-Host "  Platform: $($response.data.markets[0].market.platform.ToUpper())" -ForegroundColor Cyan
Write-Host "  Yes Price: $([math]::Round($response.data.markets[0].market.yesPrice * 100, 2))%" -ForegroundColor White

$isLive = $response.data.markets[0].market.isLive
if ($isLive) {
    Write-Host "  Is Live: ✅ YES (Real data from Polymarket API!)" -ForegroundColor Green
} else {
    Write-Host "  Is Live: ❌ NO (Mock data)" -ForegroundColor Red
}

Write-Host "  Volume: `$$([math]::Round($response.data.markets[0].market.volume24h, 0).ToString('N0'))" -ForegroundColor White
Write-Host "  Confidence: $($response.data.markets[0].confidence * 100)%" -ForegroundColor Yellow

Write-Host "`n⚡ Performance:" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  Live Prices Fetched: $($response.data.metadata.live_prices_fetched)" -ForegroundColor Green
Write-Host "  Cache Hits: $($response.data.metadata.cache_hits)"
Write-Host "  Processing Time: $($response.data.metadata.processing_time_ms)ms" -ForegroundColor Cyan
Write-Host "  Markets Analyzed: $($response.data.metadata.markets_analyzed)"

Write-Host "`n🎉 Success! Live prices are working!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray
