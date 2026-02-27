/**
 * DeepSeek API client for advanced sentiment analysis
 */

export interface DeepSeekSentimentResult {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-1
  reasoning: string;
  marketAction: 'buy' | 'sell' | 'hold';
  actionConfidence: number; // 0-1
  keyPoints: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DeepSeekAnalysisRequest {
  text: string;
  context?: string; // Optional context about related markets
  marketTitle?: string; // Optional market being analyzed
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Analyze text sentiment using DeepSeek API
 */
export async function analyzeWithDeepSeek(
  request: DeepSeekAnalysisRequest,
  apiKey: string
): Promise<DeepSeekSentimentResult> {
  try {
    const prompt = buildAnalysisPrompt(request);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a prediction market analyst. Analyze text for sentiment and provide trading recommendations for prediction markets like Polymarket and Kalshi. Always respond in valid JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from DeepSeek API');
    }

    const result = JSON.parse(content) as DeepSeekSentimentResult;
    return result;
  } catch (error) {
    console.error('[Musashi] DeepSeek API error:', error);
    // Fallback to neutral sentiment
    return {
      sentiment: 'neutral',
      confidence: 0,
      reasoning: 'Analysis failed',
      marketAction: 'hold',
      actionConfidence: 0,
      keyPoints: [],
      riskLevel: 'high',
    };
  }
}

/**
 * Build analysis prompt for DeepSeek
 */
function buildAnalysisPrompt(request: DeepSeekAnalysisRequest): string {
  let prompt = `Analyze the following text for prediction market trading insights:\n\n"${request.text}"\n\n`;

  if (request.marketTitle) {
    prompt += `Related Market: "${request.marketTitle}"\n\n`;
  }

  if (request.context) {
    prompt += `Context: ${request.context}\n\n`;
  }

  prompt += `Provide analysis in this exact JSON format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "marketAction": "buy" | "sell" | "hold",
  "actionConfidence": 0.0-1.0,
  "keyPoints": ["point 1", "point 2", "point 3"],
  "riskLevel": "low" | "medium" | "high"
}

Guidelines:
- sentiment: Overall sentiment toward the event/outcome
- confidence: How confident you are in the sentiment (0-1)
- reasoning: 1-2 sentence explanation
- marketAction: Recommended action for prediction markets
- actionConfidence: Confidence in the trading recommendation (0-1)
- keyPoints: 2-4 key insights from the text
- riskLevel: Risk assessment for taking a position

Focus on factual analysis and clear signals.`;

  return prompt;
}

/**
 * Batch analyze multiple texts
 */
export async function batchAnalyzeWithDeepSeek(
  texts: string[],
  apiKey: string
): Promise<DeepSeekSentimentResult[]> {
  const results = await Promise.all(
    texts.map((text) => analyzeWithDeepSeek({ text }, apiKey))
  );
  return results;
}

/**
 * Aggregate sentiment from multiple analyses
 */
export function aggregateSentiment(
  results: DeepSeekSentimentResult[]
): DeepSeekSentimentResult {
  if (results.length === 0) {
    return {
      sentiment: 'neutral',
      confidence: 0,
      reasoning: 'No data to analyze',
      marketAction: 'hold',
      actionConfidence: 0,
      keyPoints: [],
      riskLevel: 'high',
    };
  }

  // Count sentiments
  const sentimentCounts = {
    bullish: 0,
    bearish: 0,
    neutral: 0,
  };

  let totalConfidence = 0;
  const allKeyPoints: string[] = [];
  let riskScore = 0;

  results.forEach((result) => {
    sentimentCounts[result.sentiment]++;
    totalConfidence += result.confidence;
    allKeyPoints.push(...result.keyPoints);

    // Risk scoring
    if (result.riskLevel === 'high') riskScore += 3;
    else if (result.riskLevel === 'medium') riskScore += 2;
    else riskScore += 1;
  });

  // Determine overall sentiment
  const maxSentiment = Object.entries(sentimentCounts).reduce((a, b) =>
    sentimentCounts[a[0] as keyof typeof sentimentCounts] >
    sentimentCounts[b[0] as keyof typeof sentimentCounts]
      ? a
      : b
  )[0] as 'bullish' | 'bearish' | 'neutral';

  const avgConfidence = totalConfidence / results.length;
  const avgRiskScore = riskScore / results.length;

  const riskLevel: 'low' | 'medium' | 'high' =
    avgRiskScore < 1.5 ? 'low' : avgRiskScore < 2.5 ? 'medium' : 'high';

  // Determine market action
  let marketAction: 'buy' | 'sell' | 'hold' = 'hold';
  if (maxSentiment === 'bullish' && avgConfidence > 0.6) marketAction = 'buy';
  else if (maxSentiment === 'bearish' && avgConfidence > 0.6) marketAction = 'sell';

  // Get unique key points
  const uniqueKeyPoints = Array.from(new Set(allKeyPoints)).slice(0, 5);

  return {
    sentiment: maxSentiment,
    confidence: avgConfidence,
    reasoning: `Aggregated from ${results.length} analyses`,
    marketAction,
    actionConfidence: avgConfidence,
    keyPoints: uniqueKeyPoints,
    riskLevel,
  };
}
