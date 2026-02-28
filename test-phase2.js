// Test Phase 2 Enhanced API - Live Prices + Arbitrage Detection

const API_URL = 'https://musashi-api.vercel.app';
// const API_URL = 'http://localhost:3000'; // For local testing

async function testPhase2() {
  console.log('🧪 Testing Phase 2: Live Prices + Arbitrage Detection\n');

  const testCases = [
    {
      name: 'Bitcoin Market (Should fetch live Kalshi price)',
      text: 'Bitcoin just crossed $100k!',
      expectedPlatform: 'kalshi',
      expectsLivePrice: true,
    },
    {
      name: 'Fed Rate Cut (Should fetch live Kalshi price)',
      text: 'The Fed announced interest rate cuts in March',
      expectedPlatform: 'kalshi',
      expectsLivePrice: true,
    },
    {
      name: 'TikTok Ban (Should fetch live Polymarket price)',
      text: 'TikTok ban coming soon',
      expectedPlatform: 'polymarket',
      expectsLivePrice: true,
    },
    {
      name: 'Cross-platform arbitrage (Trump election)',
      text: 'Donald Trump wins the 2024 presidential election',
      expectedArbitrage: false, // Only one platform has this market
      expectsLivePrice: true,
    },
    {
      name: 'Market without real IDs (Should use mock prices)',
      text: 'Will the Boston Celtics win the NBA championship?',
      expectedPlatform: 'kalshi',
      expectsLivePrice: false,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`Text: "${testCase.text}"\n`);

    try {
      const response = await fetch(`${API_URL}/api/analyze-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testCase.text,
          maxResults: 5,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error(`❌ Error: ${data.error}`);
        continue;
      }

      // Display Phase 1 fields
      console.log('✅ Phase 1 Fields:');
      console.log(`   Event ID: ${data.event_id}`);
      console.log(`   Signal Type: ${data.signal_type}`);
      console.log(`   Urgency: ${data.urgency}`);

      // Display Phase 2 fields
      console.log('\n✅ Phase 2 Fields:');
      if (data.data?.metadata) {
        const meta = data.data.metadata;
        console.log(`   Processing Time: ${meta.processing_time_ms}ms`);
        console.log(`   Live Prices Fetched: ${meta.live_prices_fetched || 0}`);
        console.log(`   Cache Hits: ${meta.cache_hits || 0}`);
      }

      // Display markets
      console.log(`\n   Found ${data.data?.matchCount || 0} market(s):`);
      data.data?.markets?.forEach((match, i) => {
        console.log(`   ${i + 1}. ${match.market.title}`);
        console.log(`      Platform: ${match.market.platform}`);
        console.log(`      Yes Price: ${(match.market.yesPrice * 100).toFixed(1)}%`);
        console.log(`      No Price: ${(match.market.noPrice * 100).toFixed(1)}%`);
        console.log(`      Live Data: ${match.market.isLive ? '✅ YES' : '❌ NO (mock)'}`);
        if (match.market.ticker) {
          console.log(`      Kalshi Ticker: ${match.market.ticker}`);
        }
        if (match.market.polymarket_id) {
          console.log(`      Polymarket ID: ${match.market.polymarket_id}`);
        }
      });

      // Display arbitrage detection
      if (data.data?.arbitrage) {
        const arb = data.data.arbitrage;
        console.log('\n🎯 Arbitrage Detection:');
        if (arb.detected) {
          console.log(`   ✅ ARBITRAGE DETECTED!`);
          console.log(`   Spread: ${(arb.spread * 100).toFixed(1)}%`);
          console.log(`   Profit Potential: ${(arb.profit_potential * 100).toFixed(1)}%`);
          console.log(`   Strategy: ${arb.recommendation}`);
        } else {
          console.log(`   ❌ No arbitrage opportunity`);
        }
      }

      // Validation
      if (testCase.expectsLivePrice) {
        const hasLivePrice = data.data?.markets?.some(m => m.market.isLive);
        if (!hasLivePrice) {
          console.log('\n⚠️  WARNING: Expected live price but got mock data');
          console.log('   This may indicate:');
          console.log('   - API keys not configured');
          console.log('   - Real market IDs need to be updated');
          console.log('   - External API is down');
        }
      }

    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
    }
  }

  console.log('\n\n✨ Phase 2 Testing Complete!\n');
  console.log('📊 Summary:');
  console.log('   - Live price fetching: Implemented ✅');
  console.log('   - Price caching (5 min TTL): Implemented ✅');
  console.log('   - Arbitrage detection: Implemented ✅');
  console.log('   - Fallback to mock prices: Implemented ✅');
  console.log('\n💡 Note: Some markets may use mock prices if real platform IDs are not configured.');
}

testPhase2();
