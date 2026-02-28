// Test Phase 1 Enhanced API

const API_URL = 'https://musashi-api.vercel.app';

async function testPhase1() {
  console.log('🧪 Testing Phase 1 Enhanced API\n');

  const testCases = [
    {
      name: 'Breaking News (Should be HIGH urgency)',
      text: 'Breaking news: Bitcoin just crossed $100k!',
    },
    {
      name: 'Fed Rate Cut (Should be news_event)',
      text: 'The Fed announced interest rate cuts in March',
    },
    {
      name: 'Casual Interest (Should be LOW urgency)',
      text: 'I think Trump might win the election',
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
          maxResults: 2,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error(`❌ Error: ${data.error}`);
        continue;
      }

      // Display Phase 1 enhancements
      console.log('✅ Phase 1 Enhanced Fields:');
      console.log(`   Event ID: ${data.event_id}`);
      console.log(`   Signal Type: ${data.signal_type}`);
      console.log(`   Urgency: ${data.urgency}`);

      // Display metadata
      if (data.data?.metadata) {
        const meta = data.data.metadata;
        console.log(`   Processing Time: ${meta.processing_time_ms}ms`);
        console.log(`   Sources Checked: ${meta.sources_checked}`);
        console.log(`   Markets Analyzed: ${meta.markets_analyzed}`);
        console.log(`   Model Version: ${meta.model_version}`);
      }

      // Display markets
      console.log(`\n   Found ${data.data?.matchCount || 0} market(s):`);
      data.data?.markets?.forEach((match, i) => {
        console.log(`   ${i + 1}. ${match.market.title}`);
        console.log(`      Confidence: ${(match.confidence * 100).toFixed(1)}%`);
        console.log(`      Platform: ${match.market.platform}`);
      });

    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
    }
  }

  console.log('\n\n✨ Phase 1 Testing Complete!\n');
}

testPhase1();
