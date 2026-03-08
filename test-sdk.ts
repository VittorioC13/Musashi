const { MusashiAgent } = require('./src/sdk/musashi-agent');

async function testSDK() {
  const agent = new MusashiAgent('https://musashi-api.vercel.app');

  // Test 1: Analyze text
  console.log('Testing text analysis...');
  try {
    const signal = await agent.analyzeText('Bitcoin hits $100k!');
    console.log('Signal type:', signal.signal_type);
    console.log('Urgency:', signal.urgency);
    console.log('Sentiment:', signal.sentiment ?? 'none (no matched markets)');
    console.log('Suggested action:', signal.suggested_action ?? 'none (no matched markets)');
  } catch (error) {
    console.error('Analyze text failed:', toErrorMessage(error));
  }

  // Test 2: Get arbitrage
  console.log('\nTesting arbitrage detection...');
  try {
    const arbs = await agent.getArbitrage({ minSpread: 0.05 });
    console.log(`Found ${arbs.length} arbitrage opportunities`);
  } catch (error) {
    console.error('Arbitrage query failed:', toErrorMessage(error));
  }

  // Test 3: Get movers
  console.log('\nTesting market movers...');
  try {
    const movers = await agent.getMovers({ minChange: 0.05 });
    console.log(`Found ${movers.length} market movers`);
  } catch (error) {
    console.error('Movers query failed:', toErrorMessage(error));
  }

  // Test 4: Get feed
  console.log('\nTesting feed...');
  try {
    const tweets = await agent.getFeed({ limit: 10 });
    console.log(`Feed contains ${tweets.length} tweets`);
  } catch (error) {
    const message = toErrorMessage(error);
    if (isUpstashQuotaError(message)) {
      console.warn('Feed unavailable: Upstash request quota exceeded on server (not a local SDK issue).');
    } else {
      console.error('Feed query failed:', message);
    }
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isUpstashQuotaError(message: string): boolean {
  return message.includes('max requests limit exceeded') || message.includes('upstash');
}

testSDK().catch(console.error);
