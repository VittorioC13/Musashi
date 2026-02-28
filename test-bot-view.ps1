# What a bot sees when calling Musashi API

Write-Host "`n🤖 BOT'S VIEW: Raw API Response" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray

$response = Invoke-RestMethod -Uri "https://musashi-api.vercel.app/api/analyze-text" -Method Post -Body '{"text":"Trump immigration deportation policy"}' -ContentType "application/json"

# Show the full JSON that the bot receives
$response | ConvertTo-Json -Depth 10

Write-Host "`n`n🧠 BOT'S DECISION LOGIC:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Simulate bot's decision making
$market = $response.data.markets[0].market
$metadata = $response.data.metadata

Write-Host "`n1️⃣ CHECK: Is this real news or noise?" -ForegroundColor White
Write-Host "   signal_type = '$($response.signal_type)'" -ForegroundColor Green
if ($response.signal_type -eq "news_event") {
    Write-Host "   ✅ CONFIRMED NEWS - High confidence trade" -ForegroundColor Green
} elseif ($response.signal_type -eq "sentiment_shift") {
    Write-Host "   ⚠️ OPINION/SENTIMENT - Medium confidence" -ForegroundColor Yellow
} else {
    Write-Host "   ❌ NOISE - Skip trade" -ForegroundColor Red
}

Write-Host "`n2️⃣ CHECK: How urgent is this?" -ForegroundColor White
Write-Host "   urgency = '$($response.urgency)'" -ForegroundColor Green
if ($response.urgency -eq "critical") {
    Write-Host "   🚨 BREAKING - Trade NOW! (within 10 seconds)" -ForegroundColor Red
} elseif ($response.urgency -eq "high") {
    Write-Host "   ⚡ IMPORTANT - Trade soon (within 1 minute)" -ForegroundColor Yellow
} else {
    Write-Host "   💤 LOW - Can wait" -ForegroundColor Gray
}

Write-Host "`n3️⃣ CHECK: Are prices live?" -ForegroundColor White
Write-Host "   isLive = $($market.isLive)" -ForegroundColor Green
if ($market.isLive) {
    Write-Host "   ✅ REAL PRICES - Can trade immediately" -ForegroundColor Green
} else {
    Write-Host "   ❌ MOCK PRICES - Don't trade" -ForegroundColor Red
}

Write-Host "`n4️⃣ CHECK: Have I seen this event before?" -ForegroundColor White
Write-Host "   event_id = '$($response.event_id)'" -ForegroundColor Green
Write-Host "   ✅ Save to database to avoid duplicate trades" -ForegroundColor Green

Write-Host "`n5️⃣ TRADING DECISION:" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$currentPrice = $market.yesPrice
$volume = $market.volume24h

Write-Host "   Current Price: $([math]::Round($currentPrice * 100, 2))%" -ForegroundColor Cyan
Write-Host "   Market Volume: `$$([math]::Round($volume, 0).ToString('N0'))" -ForegroundColor Cyan
Write-Host "   Platform: $($market.platform.ToUpper())" -ForegroundColor Cyan

if ($response.signal_type -eq "news_event" -and $response.urgency -eq "critical" -and $market.isLive) {
    Write-Host "`n   🎯 BOT DECISION: BUY $10,000 at $([math]::Round($currentPrice * 100, 2))%" -ForegroundColor Green
    Write-Host "   📈 Expected Profit: Market likely to move 10-20% higher" -ForegroundColor Green
    Write-Host "   ⏱️ Hold Time: 60-300 seconds" -ForegroundColor Green
} elseif ($response.signal_type -eq "sentiment_shift" -and $response.urgency -eq "high" -and $market.isLive) {
    Write-Host "`n   💰 BOT DECISION: BUY $5,000 at $([math]::Round($currentPrice * 100, 2))%" -ForegroundColor Yellow
    Write-Host "   📈 Expected Profit: Market may move 5-10% higher" -ForegroundColor Yellow
    Write-Host "   ⏱️ Hold Time: 5-30 minutes" -ForegroundColor Yellow
} else {
    Write-Host "`n   ⏸️ BOT DECISION: SKIP - Not confident enough" -ForegroundColor Gray
}

Write-Host "`n`n💡 KEY INSIGHTS:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "• Bot gets ALL info in ONE API call (no need to fetch prices separately)" -ForegroundColor White
Write-Host "• Processing time: $($metadata.processing_time_ms)ms (fast enough to beat humans)" -ForegroundColor White
Write-Host "• Live prices updated in real-time (no stale data)" -ForegroundColor White
Write-Host "• event_id prevents trading same news 100 times" -ForegroundColor White
Write-Host "• signal_type + urgency = confidence scoring system" -ForegroundColor White
Write-Host "`n"
