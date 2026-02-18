// Keyword-based market matcher
// Uses word-boundary matching, synonym expansion, and phrase extraction

import { Market, MarketMatch } from '../types/market';
import { mockMarkets } from '../data/mock-markets';

// ─── Stop words ──────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them',
  'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all',
  'just', 'so', 'than', 'too', 'very', 'not', 'no', 'yes',
]);

// Domain-specific noise words that appear in nearly every financial/political tweet
// and produce false positives when used as matching signals
const DOMAIN_NOISE_WORDS = new Set([
  'market', 'markets', 'price', 'prices', 'trading', 'trade',
  'buy', 'sell', 'stock', 'stocks', 'invest', 'investing',
  'predict', 'prediction', 'odds', 'bet', 'betting', 'chance', 'probability',
  'likely', 'unlikely', 'bullish', 'bearish',
  'soon', 'today', 'tomorrow', 'week', 'month', 'year',
  'thread', 'breaking', 'update', 'report', 'says', 'said',
  'now', 'latest',
]);

// ─── Synonym / alias map ─────────────────────────────────────────────────────
// Maps tweet tokens (what people write) → canonical market keywords
// Supports multi-word keys via bigram/trigram extraction

export const SYNONYM_MAP: Record<string, string[]> = {
  // Fed / Monetary Policy
  'fed':              ['federal reserve', 'fomc', 'interest rates'],
  'federal reserve':  ['fed', 'fomc', 'interest rates'],
  'fomc':             ['fed', 'federal reserve', 'interest rates'],
  'jerome powell':    ['fed', 'federal reserve', 'fomc'],
  'powell':           ['fed', 'federal reserve', 'fomc'],
  'janet yellen':     ['treasury', 'fiscal policy'],
  'yellen':           ['treasury', 'fiscal policy'],
  'rate hike':        ['interest rates', 'fed', 'fomc'],
  'rate cut':         ['interest rates', 'fed', 'fomc'],
  'interest rate':    ['fed', 'fomc', 'monetary policy'],
  'basis points':     ['interest rates', 'rate hike', 'rate cut'],
  'bps':              ['basis points', 'interest rates'],
  'dot plot':         ['fomc', 'fed', 'interest rates'],
  'quantitative easing': ['fed', 'monetary policy'],
  'qe':               ['quantitative easing', 'fed'],

  // Economics
  'cpi':              ['inflation', 'consumer price index'],
  'inflation':        ['cpi', 'consumer price index', 'cost of living'],
  'pce':              ['inflation', 'consumer spending'],
  'gdp':              ['economic growth', 'recession'],
  'recession':        ['gdp', 'economic downturn', 'contraction'],
  'unemployment':     ['jobs', 'labor market', 'payrolls', 'jobless'],
  'nfp':              ['nonfarm payrolls', 'jobs', 'unemployment'],
  'nonfarm payrolls': ['jobs', 'unemployment', 'labor market'],
  'payrolls':         ['jobs', 'unemployment', 'labor market'],
  'layoffs':          ['unemployment', 'jobs', 'labor market'],
  'sp500':            ['s&p 500', 'stocks', 'equities'],
  's&p 500':          ['sp500', 'stocks', 'equities'],
  's&p':              ['sp500', 's&p 500', 'stocks'],
  'nasdaq':           ['stocks', 'equities', 'tech stocks'],
  'dow':              ['stocks', 'equities', 'dow jones'],
  'dow jones':        ['dow', 'stocks', 'equities'],
  'yield curve':      ['bonds', 'treasuries', 'interest rates'],
  'treasuries':       ['bonds', 'yield curve', 'interest rates'],

  // Politics
  'potus':            ['president', 'white house'],
  'white house':      ['president', 'administration'],
  'gop':              ['republican', 'republicans'],
  'rnc':              ['republican', 'republicans'],
  'dnc':              ['democrat', 'democrats'],
  'doge':             ['spending cuts', 'government efficiency', 'dogecoin', 'crypto', 'meme coin'],
  'doj':              ['justice department', 'attorney general'],
  'scotus':           ['supreme court'],
  'supreme court':    ['scotus'],
  'senate':           ['congress', 'legislation'],
  'house':            ['congress', 'legislation', 'house of representatives'],
  'congress':         ['senate', 'legislation', 'house'],
  'executive order':  ['president', 'administration', 'white house'],

  // Crypto
  'btc':              ['bitcoin'],
  'bitcoin':          ['btc', 'crypto'],
  'eth':              ['ethereum'],
  'ethereum':         ['eth', 'crypto'],
  'sol':              ['solana'],
  'solana':           ['sol', 'crypto'],
  'xrp':              ['ripple'],
  'ripple':           ['xrp'],
  'sec':              ['securities', 'regulation', 'crypto regulation'],
  'gensler':          ['sec', 'crypto regulation'],
  'etf':              ['exchange traded fund', 'bitcoin etf', 'spot etf'],
  'spot etf':         ['etf', 'bitcoin etf', 'sec'],
  'defi':             ['decentralized finance', 'crypto'],
  'stablecoin':       ['usdc', 'usdt', 'tether'],
  'usdc':             ['stablecoin', 'crypto'],
  'usdt':             ['stablecoin', 'tether', 'crypto'],
  'halving':          ['bitcoin', 'btc', 'crypto'],
  'coinbase':         ['crypto', 'bitcoin', 'exchange'],
  'binance':          ['crypto', 'exchange'],
  // Ethereum ecosystem
  'l2':               ['layer 2', 'ethereum', 'eth'],
  'layer2':           ['layer 2', 'ethereum', 'eth'],
  'layer-2':          ['layer 2', 'ethereum', 'eth'],
  'layer 2':          ['ethereum', 'eth', 'scaling'],
  'web3':             ['ethereum', 'eth', 'defi', 'crypto'],
  'dapp':             ['ethereum', 'eth', 'defi'],
  'dapps':            ['ethereum', 'eth', 'defi'],
  'gas fees':         ['ethereum', 'eth'],
  'gas fee':          ['ethereum', 'eth'],
  'gwei':             ['ethereum', 'eth', 'gas fees'],
  'merge':            ['ethereum', 'eth', 'proof of stake'],
  'proof of stake':   ['ethereum', 'eth', 'staking'],
  'pos':              ['proof of stake', 'ethereum', 'staking'],
  'staking':          ['ethereum', 'eth', 'proof of stake'],
  'ens':              ['ethereum', 'eth'],
  'nft':              ['ethereum', 'eth', 'digital art'],
  'nfts':             ['ethereum', 'eth', 'nft'],
  'polygon':          ['ethereum', 'eth', 'layer 2'],
  'arbitrum':         ['ethereum', 'eth', 'layer 2'],
  'optimism':         ['ethereum', 'eth', 'layer 2'],
  'base':             ['ethereum', 'eth', 'layer 2'],
  'vitalik':          ['ethereum', 'eth', 'buterin'],
  'buterin':          ['ethereum', 'eth', 'vitalik'],
  // Solana
  'phantom':          ['solana', 'sol', 'crypto'],
  'pump fun':         ['solana', 'sol', 'memecoin'],
  'memecoin':         ['crypto', 'solana', 'doge'],
  'meme coin':        ['crypto', 'solana', 'doge'],
  // Other crypto
  'dogecoin':         ['doge', 'crypto'],
  'shib':             ['shiba', 'crypto', 'memecoin'],
  'pepe':             ['memecoin', 'crypto'],
  'altcoin':          ['crypto', 'altcoins'],
  'altcoins':         ['crypto', 'altcoin'],
  'bull run':         ['crypto', 'bitcoin', 'btc'],
  'bear market':      ['crypto', 'recession'],
  'crypto winter':    ['crypto', 'bitcoin', 'bear market'],
  'on-chain':         ['crypto', 'blockchain', 'defi'],
  'blockchain':       ['crypto', 'ethereum', 'bitcoin'],
  'wallet':           ['crypto', 'ethereum', 'bitcoin'],
  'metamask':         ['ethereum', 'eth', 'defi', 'web3'],
  'kraken':           ['crypto', 'exchange'],
  'ftx':              ['crypto', 'exchange', 'sec'],
  'sbf':              ['ftx', 'crypto', 'sec'],

  // Tech / AI
  'openai':           ['ai', 'artificial intelligence', 'chatgpt', 'gpt', 'llm'],
  'chatgpt':          ['openai', 'ai', 'llm'],
  'gpt':              ['openai', 'chatgpt', 'ai', 'llm'],
  'gpt-4':            ['openai', 'chatgpt', 'ai', 'llm'],
  'anthropic':        ['ai', 'claude', 'llm', 'artificial intelligence'],
  'claude':           ['anthropic', 'ai', 'llm'],
  'gemini':           ['google', 'ai', 'llm'],
  'llm':              ['ai', 'artificial intelligence'],
  'agi':              ['artificial general intelligence', 'ai'],
  'sam altman':       ['openai', 'ai', 'chatgpt'],
  'altman':           ['openai', 'ai', 'chatgpt'],
  'jensen huang':     ['nvidia', 'nvda', 'gpu', 'ai chips'],
  'huang':            ['nvidia', 'nvda', 'gpu'],
  'nvda':             ['nvidia'],
  'nvidia':           ['nvda', 'gpu', 'ai chips', 'semiconductors'],
  'gpu':              ['nvidia', 'nvda', 'chips'],
  'chips':            ['semiconductors', 'nvidia', 'tsmc'],
  'semiconductors':   ['chips', 'nvidia', 'tsmc', 'intel'],
  'tsmc':             ['semiconductors', 'chips', 'taiwan'],
  'aapl':             ['apple'],
  'apple':            ['aapl', 'iphone', 'tim cook'],
  'tim cook':         ['apple', 'aapl'],
  'msft':             ['microsoft'],
  'microsoft':        ['msft'],
  'googl':            ['google', 'alphabet'],
  'google':           ['googl', 'alphabet'],
  'alphabet':         ['google', 'googl'],
  'meta':             ['facebook', 'instagram'],
  'big tech':         ['apple', 'google', 'microsoft', 'meta', 'amazon'],
  'faang':            ['big tech', 'apple', 'google', 'meta', 'amazon'],
  'eu ai act':        ['ai regulation', 'artificial intelligence', 'regulation'],

  // Geopolitics
  'nato':             ['alliance', 'military', 'europe', 'ukraine'],
  'ukraine':          ['russia', 'war', 'nato', 'zelensky'],
  'zelensky':         ['ukraine', 'russia'],
  'putin':            ['russia', 'ukraine', 'kremlin'],
  'kremlin':          ['russia', 'putin'],
  'prc':              ['china', 'beijing'],
  'beijing':          ['china', 'xi jinping'],
  'xi jinping':       ['china', 'beijing'],
  'xi':               ['china', 'xi jinping', 'beijing'],
  'taiwan':           ['china', 'semiconductors', 'tsmc'],
  'gaza':             ['israel', 'hamas', 'middle east', 'conflict'],
  'israel':           ['gaza', 'hamas', 'middle east'],
  'ceasefire':        ['ukraine', 'russia', 'peace', 'conflict'],
  'peace deal':       ['ukraine', 'russia', 'peace agreement', 'ceasefire'],

  // Sports
  'nfl':              ['football', 'super bowl'],
  'nba':              ['basketball'],
  'mlb':              ['baseball'],
  'nhl':              ['hockey'],
  'super bowl':       ['nfl', 'football'],
  'march madness':    ['ncaa', 'basketball'],
  'world cup':        ['soccer', 'football', 'fifa'],
  'fifa':             ['soccer', 'world cup'],
  'mahomes':          ['chiefs', 'kansas city', 'nfl', 'super bowl'],
  'patrick mahomes':  ['chiefs', 'kansas city', 'nfl', 'super bowl'],
  'celtics':          ['boston', 'nba', 'basketball'],
  'lakers':           ['los angeles', 'nba', 'basketball'],

  // Climate / Energy
  'crude':            ['oil', 'wti', 'energy'],
  'wti':              ['oil', 'crude', 'energy'],
  'brent':            ['oil', 'crude', 'energy'],
  'opec':             ['oil', 'energy', 'production cuts'],
  'ev':               ['electric vehicle', 'tesla', 'clean energy'],
  'electric vehicle': ['ev', 'tesla'],
  'tesla':            ['ev', 'electric vehicle', 'elon musk'],
  'elon musk':        ['tesla', 'spacex', 'twitter', 'x', 'doge'],
  'musk':             ['tesla', 'elon musk', 'spacex', 'doge'],
  'elon':             ['elon musk', 'tesla', 'spacex', 'doge'],
  'net zero':         ['climate', 'emissions', 'carbon'],
  'paris agreement':  ['climate', 'emissions', 'net zero'],
  'carbon':           ['climate', 'emissions', 'carbon tax'],
  'global warming':   ['climate change', 'climate', 'temperature'],
  'climate change':   ['global warming', 'climate', 'emissions'],

  // Trade / Tariffs (2025 dominant news topic)
  'tariff':           ['trade war', 'trade deal', 'import tax', 'china trade', 'trade'],
  'tariffs':          ['tariff', 'trade war', 'trade deal', 'import tax'],
  'trade war':        ['tariff', 'tariffs', 'china', 'trade deal'],
  'trade deal':       ['tariff', 'tariffs', 'trade war', 'trade'],
  'import tax':       ['tariff', 'tariffs', 'trade'],
  'sanctions':        ['trade', 'russia', 'china', 'iran'],

  // Immigration / Border
  'deportation':      ['immigration', 'border', 'ice', 'migrants', 'undocumented'],
  'deport':           ['deportation', 'immigration', 'ice', 'border'],
  'immigration':      ['border', 'deportation', 'ice', 'migrants'],
  'border':           ['immigration', 'deportation', 'wall'],
  'migrants':         ['immigration', 'border', 'deportation'],
  'ice':              ['deportation', 'immigration', 'border'],

  // AI Models & Companies (2025/2026)
  'deepseek':         ['ai', 'llm', 'china ai', 'artificial intelligence'],
  'llama':            ['meta', 'ai', 'llm', 'open source ai'],
  'mistral':          ['ai', 'llm', 'artificial intelligence'],
  'grok':             ['xai', 'elon musk', 'ai', 'llm'],
  'xai':              ['grok', 'elon musk', 'ai'],
  'perplexity':       ['ai', 'search', 'llm'],
  'cursor':           ['ai', 'coding', 'developer tools'],
  'copilot':          ['microsoft', 'msft', 'ai', 'github'],
  'sora':             ['openai', 'ai', 'video ai'],
  'o1':               ['openai', 'chatgpt', 'ai', 'reasoning'],
  'o3':               ['openai', 'chatgpt', 'ai', 'reasoning'],

  // Specific people (2025)
  'trump':            ['president', 'potus', 'administration', 'gop', 'republican'],
  'donald trump':     ['trump', 'potus', 'president', 'republican'],
  'biden':            ['president', 'potus', 'democrat', 'administration'],
  'harris':           ['democrat', 'kamala', 'vice president'],
  'marco rubio':      ['senate', 'republican', 'secretary of state'],
  'rfk':              ['health', 'vaccines', 'kennedy'],
  'vivek':            ['doge', 'republican', 'government efficiency'],

  // Stocks / Companies (2025)
  'palantir':         ['pltr', 'data analytics', 'defense'],
  'pltr':             ['palantir'],
  'saylor':           ['bitcoin', 'btc', 'microstrategy', 'mstr'],
  'microstrategy':    ['bitcoin', 'btc', 'mstr', 'saylor'],
  'mstr':             ['microstrategy', 'bitcoin', 'btc'],
  'blackrock':        ['etf', 'bitcoin etf', 'institutional'],
  'robinhood':        ['stocks', 'crypto', 'retail investing'],
  'ipo':              ['stocks', 'listing', 'public offering'],

  // Geopolitics / Countries
  'japan':            ['japanese', 'yen', 'nikkei', 'jpy'],
  'japanese':         ['japan', 'yen'],
  'china':            ['chinese', 'prc', 'beijing', 'xi'],
  'india':            ['modi', 'rupee', 'bse'],
  'germany':          ['german', 'euro', 'bund', 'europe'],
  'uk':               ['britain', 'gbp', 'pound', 'boe'],
  'iran':             ['nuclear', 'sanctions', 'middle east'],
  'north korea':      ['kim jong un', 'nuclear', 'missiles'],

  // More crypto (2025)
  'sui':              ['crypto', 'layer 1'],
  'apt':              ['aptos', 'crypto', 'layer 1'],
  'aptos':            ['apt', 'crypto', 'layer 1'],
  'ton':              ['telegram', 'crypto'],
  'bnb':              ['binance', 'crypto'],
  'avax':             ['avalanche', 'crypto'],
  'avalanche':        ['avax', 'crypto'],
  'trump coin':       ['crypto', 'meme coin'],
  'meme':             ['memecoin', 'crypto', 'doge'],
  'stablecoin bill':  ['stablecoin', 'crypto regulation', 'congress'],
  'crypto bill':      ['crypto regulation', 'sec', 'congress'],
  'strategic reserve':['bitcoin', 'btc', 'crypto'],

  // ── Wall Street / Banks / Institutions ───────────────────────────────────
  'goldman sachs':    ['bitcoin', 'crypto', 'bank', 'institutional', 'wall street'],
  'goldman':          ['goldman sachs', 'bank', 'wall street'],
  'david solomon':    ['goldman sachs', 'bitcoin', 'bank'],
  'solomon':          ['goldman sachs', 'bank', 'bitcoin'],
  'jpmorgan':         ['bank', 'jamie dimon', 'financial', 'wall street'],
  'jp morgan':        ['jpmorgan', 'bank', 'jamie dimon'],
  'jamie dimon':      ['jpmorgan', 'bank', 'bitcoin'],
  'dimon':            ['jpmorgan', 'bank', 'jamie dimon'],
  'morgan stanley':   ['bank', 'wall street', 'institutional'],
  'bank of america':  ['bank', 'bofa', 'financial'],
  'bofa':             ['bank of america', 'bank'],
  'wells fargo':      ['bank', 'financial'],
  'citigroup':        ['bank', 'citi', 'financial'],
  'citi':             ['citigroup', 'bank'],
  'hsbc':             ['bank', 'financial'],
  'wall street':      ['banks', 'financial', 'stocks', 'institutional'],
  'larry fink':       ['blackrock', 'etf', 'bitcoin etf', 'institutional'],
  'fink':             ['blackrock', 'etf', 'bitcoin etf'],
  'ray dalio':        ['bridgewater', 'hedge fund', 'investment'],
  'dalio':            ['bridgewater', 'investment'],
  'warren buffett':   ['berkshire', 'stocks', 'investment'],
  'buffett':          ['berkshire', 'stocks'],
  'berkshire':        ['warren buffett', 'stocks', 'insurance'],
  'citadel':          ['ken griffin', 'market maker', 'hedge fund'],
  'ken griffin':      ['citadel', 'hedge fund'],
  'bridgewater':      ['ray dalio', 'hedge fund'],
  'ubs':              ['bank', 'switzerland', 'financial'],
  'deutsche bank':    ['bank', 'german', 'financial'],
  'standard chartered': ['bank', 'financial'],

  // ── Institutional crypto adoption ─────────────────────────────────────────
  'fidelity':         ['bitcoin etf', 'fbtc', 'etf', 'institutional'],
  'fbtc':             ['fidelity', 'bitcoin etf', 'etf'],
  'ibit':             ['blackrock', 'bitcoin etf', 'etf'],
  'gbtc':             ['grayscale', 'bitcoin etf', 'crypto'],
  'grayscale':        ['gbtc', 'bitcoin etf', 'crypto', 'etf'],
  'bitwise':          ['bitcoin etf', 'etf', 'crypto'],
  'ark invest':       ['cathie wood', 'etf', 'bitcoin etf'],
  'cathie wood':      ['ark invest', 'etf', 'bitcoin'],
  'cathie':           ['ark invest', 'bitcoin etf'],
  'institutional adoption': ['bitcoin', 'crypto', 'etf'],
  'institutional':    ['bitcoin', 'etf', 'wall street'],
  'treasury':         ['bitcoin', 'strategic reserve', 'government'],

  // ── Crypto news phrases ───────────────────────────────────────────────────
  'hodl':             ['bitcoin', 'btc', 'crypto'],
  'holds bitcoin':    ['bitcoin', 'btc', 'crypto'],
  'owns bitcoin':     ['bitcoin', 'btc', 'crypto'],
  'buys bitcoin':     ['bitcoin', 'btc', 'crypto'],
  'bought bitcoin':   ['bitcoin', 'btc', 'crypto'],
  'adding bitcoin':   ['bitcoin', 'btc', 'crypto'],
  'digital gold':     ['bitcoin', 'btc', 'store of value'],
  'store of value':   ['bitcoin', 'btc', 'gold'],
  'proof of work':    ['bitcoin', 'btc', 'mining'],
  'pow':              ['proof of work', 'bitcoin', 'mining'],
  'mining':           ['bitcoin', 'btc', 'hashrate'],
  'hashrate':         ['bitcoin', 'btc', 'mining'],
  'satoshi':          ['bitcoin', 'btc'],
  'sats':             ['bitcoin', 'btc', 'satoshi'],
  'lightning':        ['bitcoin', 'btc', 'lightning network'],
  'ordinals':         ['bitcoin', 'btc', 'nft'],
  'runes':            ['bitcoin', 'btc'],
  'taproot':          ['bitcoin', 'btc'],
  'all time high':    ['bitcoin', 'crypto', 'stocks', 'ath'],
  'ath':              ['all time high', 'bitcoin', 'crypto'],
  'all-time high':    ['bitcoin', 'crypto', 'ath'],
  'new high':         ['bitcoin', 'crypto', 'stocks'],
  '100k':             ['bitcoin', 'btc', 'price target'],
  '150k':             ['bitcoin', 'btc', 'price target'],
  '200k':             ['bitcoin', 'btc', 'price target'],

  // ── Politics / Executive branch (2025-2026) ───────────────────────────────
  'scott bessent':    ['treasury', 'fiscal', 'secretary treasury'],
  'bessent':          ['treasury', 'fiscal policy'],
  'howard lutnick':   ['commerce', 'cantor fitzgerald', 'trade'],
  'lutnick':          ['commerce', 'trade'],
  'peter navarro':    ['tariff', 'trade war', 'china'],
  'navarro':          ['tariff', 'trade war'],
  'robert kennedy':   ['rfk', 'health', 'vaccines'],
  'department of government efficiency': ['doge', 'spending cuts'],

  // ── Tech companies / AI (2025-2026) ──────────────────────────────────────
  'amazon':           ['amzn', 'aws', 'cloud', 'bezos'],
  'amzn':             ['amazon'],
  'jeff bezos':       ['amazon', 'amzn'],
  'bezos':            ['amazon', 'amzn'],
  'andy jassy':       ['amazon', 'aws'],
  'spacex':           ['elon musk', 'rockets', 'starship'],
  'starship':         ['spacex', 'elon musk'],
  'starlink':         ['spacex', 'elon musk', 'satellite'],
  'mark zuckerberg':  ['meta', 'facebook', 'instagram'],
  'zuckerberg':       ['meta', 'facebook', 'ai'],
  'sundar pichai':    ['google', 'alphabet', 'ai'],
  'satya nadella':    ['microsoft', 'msft', 'ai'],
  'intel':            ['semiconductors', 'chips'],
  'amd':              ['semiconductors', 'chips', 'gpu'],
  'qualcomm':         ['semiconductors', 'chips', 'mobile'],
  'arm':              ['semiconductors', 'chips'],

  // ── Macro / Global economy ────────────────────────────────────────────────
  'ecb':              ['european central bank', 'euro', 'interest rates'],
  'european central bank': ['ecb', 'euro', 'interest rates'],
  'boe':              ['bank of england', 'pound', 'interest rates'],
  'bank of england':  ['boe', 'pound', 'interest rates'],
  'pboc':             ['china', 'yuan', 'interest rates'],
  'boj':              ['bank of japan', 'yen', 'japan'],
  'bank of japan':    ['boj', 'yen', 'japan'],
  'dollar':           ['usd', 'dxy', 'currency'],
  'dxy':              ['dollar', 'usd', 'currency'],
  'usd':              ['dollar', 'dxy'],
  'euro':             ['eur', 'ecb', 'europe'],
  'eur':              ['euro', 'ecb'],
  'yen':              ['jpy', 'japan', 'boj'],
  'jpy':              ['yen', 'japan'],
  'yuan':             ['cny', 'rmb', 'china'],
  'gold':             ['xau', 'precious metals', 'store of value', 'commodity'],
  'xau':              ['gold', 'precious metals'],
  'silver':           ['xag', 'precious metals', 'commodity'],
  'commodities':      ['gold', 'oil', 'energy', 'agriculture'],
  'housing market':   ['real estate', 'mortgage', 'fed'],
  'mortgage':         ['housing market', 'real estate', 'interest rates', 'fed'],
  'real estate':      ['housing market', 'mortgage'],
  'debt ceiling':     ['congress', 'fiscal', 'treasury'],
  'default':          ['debt', 'treasury', 'bonds'],
  'bonds':            ['treasuries', 'yield', 'interest rates'],
  'yield':            ['bonds', 'treasuries', 'interest rates'],

  // ── Sports / Entertainment (expanded) ────────────────────────────────────
  'chiefs':           ['kansas city', 'nfl', 'mahomes', 'super bowl'],
  'eagles':           ['philadelphia', 'nfl', 'super bowl'],
  'rams':             ['los angeles', 'nfl', 'super bowl'],
  'bills':            ['buffalo', 'nfl', 'super bowl'],
  'warriors':         ['golden state', 'nba', 'basketball'],
  'heat':             ['miami', 'nba', 'basketball'],
  'knicks':           ['new york', 'nba', 'basketball'],
  'lebron':           ['lakers', 'nba', 'basketball'],
  'curry':            ['warriors', 'nba', 'basketball'],
  'messi':            ['soccer', 'football', 'inter miami'],
  'ronaldo':          ['soccer', 'football', 'cr7'],
  'wimbledon':        ['tennis', 'grand slam'],
  'us open':          ['tennis', 'grand slam'],
  'masters':          ['golf', 'augusta'],
  'oscars':           ['academy awards', 'movies', 'film'],
  'academy awards':   ['oscars', 'movies', 'film'],
  'grammy':           ['music', 'awards'],
  'emmys':            ['tv', 'television', 'awards'],

  // ── Geopolitics (extended) ────────────────────────────────────────────────
  'middle east':      ['israel', 'gaza', 'iran', 'saudi'],
  'saudi':            ['saudi arabia', 'oil', 'opec'],
  'saudi arabia':     ['saudi', 'oil', 'opec'],
  'hamas':            ['gaza', 'israel', 'middle east'],
  'hezbollah':        ['israel', 'middle east', 'iran'],
  'kim jong un':      ['north korea', 'nuclear', 'missiles'],
  'kim':              ['north korea', 'nuclear'],
  'modi':             ['india', 'bjp'],
  'macron':           ['france', 'europe', 'eu'],
  'sunak':            ['uk', 'britain'],
  'scholz':           ['germany', 'german', 'eu'],
  'europe':           ['eu', 'european', 'ecb'],
  'eu':               ['europe', 'european union'],
  'africa':           ['emerging markets'],
  'latin america':    ['emerging markets'],
};

// ─── Utility functions ───────────────────────────────────────────────────────

/** Returns true if a character is a word character (letter, digit, apostrophe) */
function isWordChar(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 97 && code <= 122) || // a-z
    (code >= 65 && code <= 90)  || // A-Z
    (code >= 48 && code <= 57)  || // 0-9
    code === 39                    // apostrophe
  );
}

/**
 * Checks whether `term` appears in `text` as a whole word (respects word boundaries).
 * Avoids creating new RegExp objects per call for performance.
 */
function hasWordBoundaryMatch(text: string, term: string): boolean {
  const termLower = term.toLowerCase();
  const textLower = text.toLowerCase();
  let idx = textLower.indexOf(termLower);
  while (idx !== -1) {
    const before = idx === 0 || !isWordChar(textLower[idx - 1]);
    const after  =
      idx + termLower.length >= textLower.length ||
      !isWordChar(textLower[idx + termLower.length]);
    if (before && after) return true;
    idx = textLower.indexOf(termLower, idx + 1);
  }
  return false;
}

/**
 * Generates unigrams, bigrams, and trigrams from cleaned text.
 * Enables multi-word synonym keys like "jerome powell" or "rate cut".
 */
function extractPhrases(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const phrases: string[] = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(words[i] + ' ' + words[i + 1]);
  }
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
  }
  return phrases;
}

/**
 * Expands a token list with synonyms from SYNONYM_MAP.
 * Both the original tokens and their aliases are included.
 */
function expandWithSynonyms(tokens: string[]): string[] {
  const expanded = new Set<string>(tokens);
  for (const token of tokens) {
    const syns = SYNONYM_MAP[token.toLowerCase()];
    if (syns) {
      for (const s of syns) expanded.add(s);
    }
  }
  return Array.from(expanded);
}

/**
 * Extracts meaningful tokens from a market title for supplementary matching.
 * These are weighted lower than explicit market keywords.
 */
function extractTitleTokens(title: string): string[] {
  const TITLE_STOPS = new Set([
    'will', 'the', 'a', 'an', 'in', 'on', 'at', 'by', 'for', 'to', 'of',
    'and', 'or', 'is', 'be', 'has', 'have', 'are', 'was', 'were', 'been',
    'do', 'does', 'did', '2024', '2025', '2026', '2027', 'before', 'after',
    'end', 'yes', 'no', 'than', 'over', 'under', 'above', 'below', 'hit',
    'reach', 'win', 'lose', 'pass', 'major', 'us', 'use', 'its', 'their',
    'any', 'all', 'into', 'out', 'up', 'down',
  ]);
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !TITLE_STOPS.has(w));
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

// Cap the normalization denominator so markets with large keyword lists
// (20-40 keywords from description extraction) don't get artificially low scores.
// Without this cap, a perfect bitcoin+btc+crypto match on a 25-keyword market
// scores 2.2/25 = 0.088 — below threshold despite being a strong signal.
const DENOMINATOR_CAP = 5;

interface MatchCounts {
  exactMatches:   number; // tweet token directly matches market keyword
  synonymMatches: number; // tweet token matched via synonym expansion
  titleMatches:   number; // tweet token matches market title word (not in keywords[])
  totalChecked:   number; // number of market keywords evaluated
}

function computeScore(r: MatchCounts): number {
  if (r.totalChecked === 0) return 0;

  // Weighted sum: exact > synonym > title
  const weighted =
    r.exactMatches   * 1.0 +
    r.synonymMatches * 0.6 +
    r.titleMatches   * 0.3;

  // Normalize by keyword list length, capped to avoid penalizing markets
  // that happen to have many keywords from description extraction.
  const denominator = Math.min(r.totalChecked, DENOMINATOR_CAP);
  const normalized = weighted / denominator;

  // Small coverage bonus for matching multiple distinct keywords
  const totalMatched = r.exactMatches + r.synonymMatches + r.titleMatches;
  const coverageBonus = Math.min(0.2, (totalMatched - 1) * 0.05);

  return Math.min(1.0, normalized + (totalMatched > 0 ? coverageBonus : 0));
}

// ─── KeywordMatcher class ────────────────────────────────────────────────────

export class KeywordMatcher {
  private markets: Market[];
  private minConfidence: number;
  private maxResults: number;

  constructor(
    markets: Market[] = mockMarkets,
    minConfidence: number = 0.12,
    maxResults: number = 5
  ) {
    this.markets = markets;
    this.minConfidence = minConfidence;
    this.maxResults = maxResults;
  }

  /**
   * Match a tweet to relevant markets, returning results sorted by confidence.
   */
  public match(tweetText: string): MarketMatch[] {
    // Step 1: Extract raw tokens (unigrams + bigrams + trigrams) from tweet
    const rawTokens = this.extractKeywords(tweetText);
    if (rawTokens.length === 0) return [];

    // Step 2: Expand with synonyms — done once, reused for all markets
    const expandedTokens  = expandWithSynonyms(rawTokens);
    const rawTokenSet      = new Set(rawTokens);
    const expandedTokenSet = new Set(expandedTokens);

    const matches: MarketMatch[] = [];

    for (const market of this.markets) {
      const result = this.scoreMarket(market, rawTokenSet, expandedTokenSet);
      if (result.confidence >= this.minConfidence) {
        matches.push(result);
      }
    }

    matches.sort((a, b) => b.confidence - a.confidence);
    return matches.slice(0, this.maxResults);
  }

  /**
   * Extract and clean keywords from tweet text.
   * Returns unigrams + bigrams + trigrams, filtered for noise.
   */
  private extractKeywords(text: string): string[] {
    let normalized = text.toLowerCase();

    // Remove URLs and mentions
    normalized = normalized.replace(/https?:\/\/[^\s]+/g, '');
    normalized = normalized.replace(/@\w+/g, '');

    // Extract hashtags as plain words
    const hashtags = Array.from(text.matchAll(/#(\w+)/g)).map(m => m[1].toLowerCase());

    // Remove special chars, preserve & for "s&p"
    normalized = normalized.replace(/[^a-z0-9\s&']/g, ' ');
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // Generate unigrams + bigrams + trigrams
    const phrases = extractPhrases(normalized);

    // Filter: single tokens must pass stop-word + noise-word checks
    const filtered = phrases.filter(token => {
      if (token.includes(' ')) {
        // Multi-word phrases: only length filter (phrases are inherently specific)
        return token.length > 4;
      }
      return (
        token.length > 2 &&
        !STOP_WORDS.has(token) &&
        !DOMAIN_NOISE_WORDS.has(token)
      );
    });

    // Merge with hashtags and deduplicate
    return [...new Set([...filtered, ...hashtags])];
  }

  /**
   * Score a single market against the pre-computed tweet token sets.
   */
  private scoreMarket(
    market: Market,
    rawTokenSet: Set<string>,
    expandedTokenSet: Set<string>
  ): MarketMatch {
    const matchedKeywords: string[] = [];
    let exactMatches   = 0;
    let synonymMatches = 0;
    let titleMatches   = 0;

    const explicitKeywords = market.keywords.map(k => k.toLowerCase());

    for (const mk of explicitKeywords) {
      if (expandedTokenSet.has(mk)) {
        if (rawTokenSet.has(mk)) {
          exactMatches++;
        } else {
          synonymMatches++;
        }
        matchedKeywords.push(mk);
      } else if (mk.includes(' ') && hasWordBoundaryMatch(
        Array.from(expandedTokenSet).join(' '), mk
      )) {
        // Multi-word SYNONYM_MAP key matched a phrase in expanded tokens
        synonymMatches++;
        matchedKeywords.push(mk);
      }
    }

    // Title-word fallback: check if any tweet token appears in the market title.
    // Weighted lower than explicit keyword matches; catches cases where
    // generateKeywords() misses a term that's clearly in the title.
    const titleTokens = extractTitleTokens(market.title);
    for (const tt of titleTokens) {
      if (!matchedKeywords.includes(tt) && expandedTokenSet.has(tt)) {
        titleMatches++;
        matchedKeywords.push(tt);
      }
    }

    const confidence = computeScore({
      exactMatches,
      synonymMatches,
      titleMatches,
      totalChecked: explicitKeywords.length,
    });

    return { market, confidence, matchedKeywords };
  }

  /** Update confidence threshold */
  public setMinConfidence(minConfidence: number): void {
    this.minConfidence = minConfidence;
  }

  /** Update max results */
  public setMaxResults(maxResults: number): void {
    this.maxResults = maxResults;
  }
}

// Singleton instance
export const matcher = new KeywordMatcher();
