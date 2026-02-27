// Test script for Musashi API
// Usage: node test-api.js

const API_URL = process.env.MUSASHI_API_URL || 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Musashi API...\n');
  console.log(`API URL: ${API_URL}\n`);

  const testCases = [
    {
      name: 'Fed Rate Cut',
      text: 'The Fed is likely to cut interest rates in March after inflation cooled to 2.9%',
    },
    {
      name: 'Bitcoin Price',
      text: 'Bitcoin just crossed $100k! Institutional adoption is accelerating.',
    },
    {
      name: 'Trump Election',
      text: 'Trump leads in latest polls ahead of 2024 presidential election',
    },
    {
      name: 'AI Regulation',
      text: 'OpenAI calls for government regulation of artificial intelligence',
    },
    {
      name: 'Ethereum',
      text: 'Ethereum Layer 2 solutions are seeing massive growth in DeFi',
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`Text: "${testCase.text}"\n`);

    try {
      const startTime = Date.now();

      const response = await fetch(`${API_URL}/api/analyze-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testCase.text,
          minConfidence: 0.25,
          maxResults: 3,
        }),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        console.error(`❌ Error: ${response.status} ${response.statusText}`);
        const error = await response.text();
        console.error(error);
        continue;
      }

      const data = await response.json();

      if (!data.success) {
        console.error(`❌ API Error: ${data.error}`);
        continue;
      }

      console.log(`✅ Success (${latency}ms)`);
      console.log(`Found ${data.data.matchCount} market(s):\n`);

      data.data.markets.forEach((match, i) => {
        console.log(`${i + 1}. ${match.market.title}`);
        console.log(`   Platform: ${match.market.platform}`);
        console.log(`   Confidence: ${(match.confidence * 100).toFixed(1)}%`);
        console.log(`   YES: ${(match.market.yesPrice * 100).toFixed(0)}% | NO: ${(match.market.noPrice * 100).toFixed(0)}%`);
        console.log(`   Keywords: ${match.matchedKeywords.slice(0, 5).join(', ')}`);
        console.log(`   URL: ${match.market.url}\n`);
      });

    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
    }

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✨ Testing complete!\n');
}

testAPI();
