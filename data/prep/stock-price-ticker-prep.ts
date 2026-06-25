import type { PrepData } from "./types";

export const stockPriceTickerPrep: PrepData = {
  systemId: "stock-price-ticker",
  systemName: "Stock Price Ticker",
  sections: [
    {
      type: "interactive",
      sectionId: "requirements",
      step: "Step 1 — Requirements",
      title: "Sort the Requirements",
      subtitle:
        "Real-time financial data has strict latency and reliability requirements. Get these right before designing anything.",
      interaction: {
        type: "requirements-sort",
        items: [
          {
            id: "r1",
            text: "Display live stock prices updating in real-time",
            correctBucket: "functional",
            explanation: "The core feature — what users see and interact with.",
          },
          {
            id: "r2",
            text: "Price updates must reach users within 100ms of the exchange tick",
            correctBucket: "non-functional",
            explanation: "Latency requirement — defines how fast, not what.",
          },
          {
            id: "r3",
            text: "Show historical price charts (1D, 1W, 1M, 1Y)",
            correctBucket: "functional",
            explanation: "Chart display is a distinct functional feature users need.",
          },
          {
            id: "r4",
            text: "Support 10 million concurrent users watching prices",
            correctBucket: "non-functional",
            explanation: "Scale/concurrency requirement — a performance constraint.",
          },
          {
            id: "r5",
            text: "Execute buy/sell trades",
            correctBucket: "out-of-scope",
            explanation:
              "Trading is a separate system — the ticker only displays prices, not executes trades.",
          },
          {
            id: "r6",
            text: "System must handle 100,000 price updates per second from exchanges",
            correctBucket: "non-functional",
            explanation: "Ingestion throughput — a performance requirement.",
          },
          {
            id: "r7",
            text: "Users can set price alerts",
            correctBucket: "functional",
            explanation: "Alert creation is a functional feature — users configure it.",
          },
          {
            id: "r8",
            text: "Stock price data must never be incorrect",
            correctBucket: "non-functional",
            explanation: "Data accuracy/consistency requirement — a quality attribute.",
          },
          {
            id: "r9",
            text: "Predict future stock prices",
            correctBucket: "out-of-scope",
            explanation:
              "Price prediction is ML/analytics — a completely separate system.",
          },
          {
            id: "r10",
            text: "Users can search for any stock by ticker symbol",
            correctBucket: "functional",
            explanation: "Search is a functional capability users need.",
          },
        ],
        buckets: [
          {
            id: "functional",
            label: "Functional",
            description: "What the system does — features users interact with",
          },
          {
            id: "non-functional",
            label: "Non-Functional",
            description: "How well it performs — speed, scale, accuracy",
          },
          {
            id: "out-of-scope",
            label: "Out of Scope",
            description: "Explicitly excluded from this design",
          },
        ],
      },
    },
    {
      type: "interactive",
      sectionId: "estimation",
      step: "Step 2 — Estimation",
      title: "Work Through the Math",
      subtitle:
        "Stock tickers are extreme read-heavy systems. The math explains why polling is impossible and WebSockets are mandatory.",
      interaction: {
        type: "estimation-calculator",
        steps: [
          {
            id: "e1",
            label: "Concurrent users during market hours",
            formula: "Given assumption",
            answer: 10000000,
            unit: "users",
            userInput: false,
            hint: "",
            explanation:
              "10M concurrent users — peak during market open (9:15 AM) and close (3:30 PM).",
          },
          {
            id: "e2",
            label: "Stocks watched per user (avg)",
            formula: "Given assumption",
            answer: 5,
            unit: "stocks/user",
            userInput: false,
            hint: "",
            explanation: "Average user watches 5 stocks in their watchlist.",
          },
          {
            id: "e3",
            label: "Price updates per stock per second",
            formula: "Given assumption",
            answer: 1,
            unit: "updates/sec",
            userInput: false,
            hint: "",
            explanation:
              "NSE sends ~1 price tick per second per stock during active trading.",
          },
          {
            id: "e4",
            label: "If using polling: API calls per second",
            formula: "10M users × 5 stocks × 1 poll/sec",
            answer: 50000000,
            unit: "API calls/sec",
            userInput: true,
            hint: "Multiply concurrent users × stocks per user × polls per second",
            explanation:
              "50 MILLION API calls per second just for polling. This is why polling is impossible at this scale. WebSockets are not optional — they're mandatory.",
          },
          {
            id: "e5",
            label: "WebSocket connections needed",
            formula: "10M users × 1 connection each",
            answer: 10000000,
            unit: "WebSocket connections",
            userInput: true,
            hint: "Each user needs one persistent connection",
            explanation:
              "10M WebSocket connections. One server can hold ~50,000 connections. You need 200+ WebSocket servers behind a load balancer.",
          },
          {
            id: "e6",
            label: "Price ticks ingested per second from exchange",
            formula: "~5,000 stocks × 1 tick/sec",
            answer: 5000,
            unit: "ticks/sec from NSE",
            userInput: false,
            hint: "",
            explanation:
              "NSE lists ~5,000 securities. At 1 tick/sec each = 5,000 ticks/sec incoming. Kafka handles this trivially.",
          },
        ],
        insight:
          "The 50M API calls/sec calculation is the killer argument for WebSockets. Show this math to your interviewer before mentioning WebSockets — it makes the architecture choice obvious rather than arbitrary. 10M WebSocket connections across 200+ servers is the actual engineering challenge.",
      },
    },
    {
      type: "apiDesign",
      endpoints: [
        {
          method: "GET",
          path: "/api/v1/stocks/{symbol}",
          description: "Get current price and metadata for a stock",
          response: `// 200 OK
{
  "symbol": "RELIANCE",
  "price": 284750,         // in paise — no floats
  "change": 1250,          // absolute change in paise
  "changePercent": 0.44,   // percentage change
  "volume": 4521890,
  "marketCap": 1924000000000,
  "lastUpdated": "2024-01-15T10:00:00.123Z"
}`,
          notes: "Price in paise (integer) — same rule as payments. Sub-second timestamp for last update.",
        },
        {
          method: "WS",
          path: "wss://api.zerodha.com/v1/stream",
          description: "WebSocket endpoint for real-time price streaming",
          requestBody: `// Client sends subscription message after connecting:
{
  "action": "subscribe",
  "symbols": ["RELIANCE", "INFY", "TCS", "HDFC", "ITC"]
}`,
          response: `// Server pushes whenever subscribed price changes:
{
  "type": "price_update",
  "symbol": "RELIANCE",
  "price": 284850,
  "timestamp": "2024-01-15T10:00:01.456Z"
}`,
          notes:
            "WebSocket not HTTP — one persistent connection per user. Server pushes only when price changes, not on a timer.",
        },
        {
          method: "GET",
          path: "/api/v1/stocks/{symbol}/history",
          description: "Get historical OHLC data for charts",
          response: `// 200 OK
{
  "symbol": "RELIANCE",
  "interval": "1D",    // 1m | 5m | 1H | 1D | 1W
  "candles": [
    { "open": 284000, "high": 285200, "low": 283500, "close": 284750,
      "volume": 4521890, "timestamp": "2024-01-15T00:00:00Z" },
    ...
  ]
}`,
        },
      ],
      trap: {
        title: "WebSocket is not REST — design the protocol separately",
        content: `REST APIs are request-response. WebSockets are event-driven.
Your WebSocket API needs a message protocol: how does the client subscribe? What format are pushes? How does the server handle a client that subscribes to 100 stocks?
Common interview mistake: designing WebSocket like a REST endpoint (GET /prices).
Correct: design a subscribe/unsubscribe message protocol over the WebSocket connection.`,
      },
    },
    {
      type: "interactive",
      sectionId: "deepDive",
      step: "Step 4 — Deep Dive",
      title: "Core Real-Time Concepts",
      subtitle:
        "The architectural patterns for real-time data are reusable across stock tickers, chat, live sports scores, and more.",
      interaction: {
        type: "flashcard-deck",
        title: "Stock Price Ticker Deep Dive",
        cards: [
          {
            id: "dc1",
            front: {
              label: "CONCEPT 1",
              title: "Pub/Sub for Fan-out",
              subtitle: "One price update → millions of subscribers",
              tag: "Critical",
            },
            back: {
              explanation:
                "When RELIANCE price changes, 2 million users need that update. You can't loop through 2M WebSocket connections synchronously. Pub/Sub solves this: one message published to 'RELIANCE' topic fans out to all subscribers automatically.",
              code: `// Redis Pub/Sub for real-time fan-out
// NSE feed receives RELIANCE price update
redis.publish('stock:RELIANCE', JSON.stringify({
  price: 284850,
  timestamp: Date.now()
}))

// All WebSocket servers subscribed to 'stock:RELIANCE'
redis.subscribe('stock:RELIANCE', (message) => {
  // For each connected user watching RELIANCE:
  userConnections
    .filter(conn => conn.watchlist.includes('RELIANCE'))
    .forEach(conn => conn.send(message))
})`,
              proTip:
                "Each WebSocket server subscribes to Redis topics for the stocks its connected users watch. One price update → Redis → all 200 WebSocket servers → all 2M RELIANCE watchers.",
            },
          },
          {
            id: "dc2",
            front: {
              label: "CONCEPT 2",
              title: "Time Series DB for History",
              subtitle: "InfluxDB or TimescaleDB for OHLC chart data",
              tag: "Storage",
            },
            back: {
              explanation:
                "Live prices go through Redis Pub/Sub and are never stored there. But users need historical charts — 1 year of daily OHLC data, 1 month of hourly data. This is time-series data: always timestamped, always appended, always queried by time range. Purpose-built time-series databases handle this far better than SQL.",
              code: `-- TimescaleDB (PostgreSQL extension)
CREATE TABLE price_ticks (
  time        TIMESTAMPTZ NOT NULL,
  symbol      TEXT NOT NULL,
  price       BIGINT NOT NULL,    -- in paise
  volume      BIGINT NOT NULL
);

-- TimescaleDB auto-partitions by time
-- Continuous aggregate for OHLC:
SELECT symbol,
       time_bucket('1 hour', time) AS bucket,
       first(price, time) AS open,
       max(price) AS high,
       min(price) AS low,
       last(price, time) AS close,
       sum(volume) AS volume
FROM price_ticks
GROUP BY symbol, bucket;`,
              proTip:
                "TimescaleDB gives you SQL familiarity with time-series optimization. InfluxDB is purpose-built and faster for pure time-series but requires learning a new query language.",
            },
          },
          {
            id: "dc3",
            front: {
              label: "CONCEPT 3",
              title: "Connection Routing Problem",
              subtitle: "User A is on Server 1. Their friend's alert is on Server 7.",
              tag: "Distributed",
            },
            back: {
              explanation:
                "10M users across 200 WebSocket servers. When user_123 sets a price alert, that alert might trigger while user_123 is connected to Server 47. The alert service doesn't know which server the user is on. Solution: Redis hash tracks {userId → serverId}. Alert service looks up server, routes to it.",
              code: `// On WebSocket connect:
redis.hset('user_connections', userId, serverId)

// On disconnect:
redis.hdel('user_connections', userId)

// Alert service triggers alert for user_123:
const serverId = await redis.hget('user_connections', 'user_123')
if (serverId) {
  // Send to specific WebSocket server via internal API
  await serverRegistry[serverId].notify(userId, alertPayload)
} else {
  // User offline — store as in-app notification
  await db.saveOfflineAlert(userId, alertPayload)
}`,
              trap:
                "Forgetting the cross-server routing problem is a common interview miss. Always ask: 'What if the user is connected to a different server than the one processing the event?'",
            },
          },
          {
            id: "dc4",
            front: {
              label: "CONCEPT 4",
              title: "Market Hours vs Off-Hours",
              subtitle: "System behavior changes when NSE closes at 3:30 PM",
              tag: "Operations",
            },
            back: {
              explanation:
                "During market hours (9:15 AM - 3:30 PM): live price feeds active, WebSocket pushes constant. After hours: no new ticks, but users still open the app. The system must handle both modes without users noticing the switch.",
              code: `// Market hours check
const isMarketOpen = () => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const day = now.getDay()

  // Monday-Friday, 9:15 AM to 3:30 PM IST
  const isWeekday = day >= 1 && day <= 5
  const afterOpen  = (hours > 9) || (hours === 9 && minutes >= 15)
  const beforeClose = (hours < 15) || (hours === 15 && minutes <= 30)

  return isWeekday && afterOpen && beforeClose
}

// After hours: serve last known price from cache
// During hours: stream live from Redis Pub/Sub`,
              proTip:
                "Proactively mentioning market hours handling shows operational awareness. Senior engineers think about the full 24-hour lifecycle of a system, not just peak operation.",
            },
          },
        ],
      },
    },
    {
      type: "interactive",
      sectionId: "tradeoffs",
      step: "Step 5 — Senior Tradeoffs",
      title: "Make the Calls",
      subtitle:
        "Real-time systems have non-obvious tradeoffs between latency, consistency, and cost.",
      interaction: {
        type: "tradeoff-picker",
        scenarios: [
          {
            id: "t1",
            scenario:
              "Should you push every single price tick to users, or throttle updates to once per second?",
            context:
              "NSE sends ticks every 100-200ms. A single stock can tick 5-10 times per second during volatile trading.",
            options: [
              {
                id: "a",
                label:
                  "Push every tick — maximum freshness, users see every price change",
                correct: false,
                consequence:
                  "5-10 WebSocket messages per second per stock × 5 stocks = 25-50 messages/sec to each user. Browser can't render that fast. CPU spikes. Users report choppy UI. More bandwidth cost.",
              },
              {
                id: "b",
                label:
                  "Throttle to once per second — batch ticks, push latest price each second",
                correct: true,
                consequence:
                  "1 message/sec per stock × 5 stocks = 5 messages/sec. Smooth UI. Reduced bandwidth. Users perceive 1-second updates as 'real-time' — they can't act on 100ms precision anyway.",
              },
            ],
            seniorNote:
              "Human perception of 'real-time' is about 250ms. For retail stock prices, 1-second updates feel instantaneous. Reserve tick-by-tick streaming for professional trading terminals (Bloomberg, NEST) where millisecond precision matters. Throttling at the server side is far cheaper than pushing everything and throttling at the client.",
          },
          {
            id: "t2",
            scenario:
              "A user opens the Zerodha app after 2 hours offline. What price should they see for RELIANCE?",
            context:
              "They were disconnected. The Redis Pub/Sub messages they missed are gone — Redis Pub/Sub is fire-and-forget.",
            options: [
              {
                id: "a",
                label: "Show nothing until the next live tick arrives",
                correct: false,
                consequence:
                  "User sees a blank price field for up to 1 second. Bad UX. They think the app is broken.",
              },
              {
                id: "b",
                label:
                  "Fetch last known price from cache on WebSocket connect, then stream live",
                correct: true,
                consequence:
                  "On connect: HTTP GET /stocks/RELIANCE returns cached last price (stale by 2 hours but correct). WebSocket then streams live updates. User sees a price immediately, then it updates live. Seamless.",
              },
            ],
            seniorNote:
              "This is the 'initial state + live updates' pattern that appears in every real-time system: chat (load history, then stream new messages), collaborative docs (load current doc, then stream edits), sports scores (load current score, then stream live events). Always serve cached state on connect, then stream deltas.",
          },
          {
            id: "t3",
            scenario:
              "Your team proposes using a single shared Redis Pub/Sub instance for all price updates. What breaks at 10M users?",
            context:
              "One Redis instance has throughput limits. 5,000 stocks × multiple WebSocket servers subscribed = potential bottleneck.",
            options: [
              {
                id: "a",
                label: "Nothing breaks — Redis handles millions of operations per second",
                correct: false,
                consequence:
                  "A single Redis instance handles ~100k ops/sec. With 200 WebSocket servers each subscribing to 5,000 topics, and 5,000 price updates per second incoming, you're at the limit. Add user load and you're over.",
              },
              {
                id: "b",
                label:
                  "Redis becomes a bottleneck — shard by stock symbol across multiple Redis instances",
                correct: true,
                consequence:
                  "Partition stocks across Redis instances: stocks A-F → Redis 1, G-M → Redis 2, etc. Each WebSocket server subscribes to the Redis instances relevant to its users' watchlists. Linear scaling.",
              },
            ],
            seniorNote:
              "Redis sharding by stock symbol is the standard answer here. The shard key (first letter of ticker) gives even distribution. Each Redis instance serves a subset of stocks, so adding more Redis instances linearly increases throughput. Always think about the single shared resource that becomes a bottleneck at scale.",
          },
        ],
      },
    },
    {
      type: "cheatSheet",
      components:
        "NSE Feed → Kafka → Price Processor → Redis Pub/Sub → WebSocket Servers (200+) → Users | Time Series DB → Charts",
      numbers: [
        { label: "Concurrent users", value: "10M (peak market hours)" },
        { label: "WebSocket servers", value: "200+ (50k connections each)" },
        { label: "Polling API calls avoided", value: "50M/sec (why WebSockets)" },
        { label: "Price ticks from NSE", value: "~5,000/sec (1 per stock)" },
        { label: "Update throttle", value: "1 update/sec per stock to users" },
        { label: "Chart data retention", value: "10 years in Time Series DB" },
      ],
      decisions: [
        {
          decision: "WebSockets over polling",
          why: "50M API calls/sec with polling is impossible — one WebSocket per user handles it",
        },
        {
          decision: "Redis Pub/Sub for fan-out",
          why: "One price update fans out to 2M subscribers across 200 servers automatically",
        },
        {
          decision: "Throttle to 1 update/sec",
          why: "Human perception doesn't need sub-second; reduces bandwidth and CPU 5-10x",
        },
        {
          decision: "Time Series DB for history",
          why: "OHLC queries by time range are what time-series DBs are built for",
        },
        {
          decision: "Cached last price on connect",
          why: "User sees immediate price on app open; doesn't wait for next live tick",
        },
      ],
    },
  ],
};
