export const stockPriceTicker = {
  id: "stock-price-ticker",
  title: "Stock Price Ticker",
  scenario:
    "You're the lead engineer at a trading platform. 2 million users watch stock prices live. SEBI just mandated sub-second price updates for all retail platforms. Right now your app refreshes every 5 seconds. Traders are losing money on stale prices. Rebuild it before markets open on Monday.",
  decisions: [
    {
      id: 1,
      question:
        "Your app currently polls the price API every 5 seconds. That means 2 million users × 720 requests/hour = 1.4 billion API calls per day. Is this sustainable?",
      context:
        "You're hitting the NSE feed API which charges per request. Your bill is ₹12 lakh/month. And prices are still 5 seconds stale.",
      options: [
        {
          id: "a",
          text: "Poll faster — every 1 second gives near-real-time prices",
          correct: false,
          consequence:
            "7 billion API calls per day. ₹60 lakh/month. NSE rate-limits you at 4 PM. Every trader sees 'price unavailable' at market close.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Keep 5-second polling but cache aggressively on the server",
          correct: false,
          consequence:
            "Better, but users still see prices that are 5-10 seconds stale. For a ₹50,000 trade, that's the difference between profit and loss.",
          consequenceType: "failure",
        },
        {
          id: "c",
          text: "Push updates to the client — server sends prices when they change",
          correct: true,
          consequence:
            "Server receives 1 price update, pushes to 2M clients. Cost drops 99.9%. Price arrives in <200ms. You just made polling obsolete.",
          consequenceType: "success",
        },
      ],
      learning:
        "Pull vs Push — polling is client-initiated: 'anything new?' every N seconds, regardless. Push is server-initiated: server broadcasts only when data changes. For real-time data with many consumers, push multiplies efficiency. One price change → one server receive → broadcast to millions. This is the fundamental shift from REST polling to event-driven architecture.",
    },
    {
      id: 2,
      question:
        "You've decided to push prices to clients. HTTP connections close after a response. How do you keep a persistent connection open to push live data?",
      context:
        "2 million users have the app open. You need to send price updates within 200ms of receiving them from NSE.",
      options: [
        {
          id: "a",
          text: "Long polling — client waits, server holds the response open",
          correct: false,
          consequence:
            "Each long-poll holds a server thread. 2 million concurrent users = 2 million threads. Server runs out of memory in 3 minutes.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "WebSockets — full-duplex persistent connection over TCP",
          correct: true,
          consequence:
            "Each user upgrades HTTP to WebSocket once. Server pushes prices as they arrive. 2M connections, <1ms per message, no thread-per-connection overhead.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Server-Sent Events — one-way stream from server to client",
          correct: false,
          consequence:
            "Works but limited to 6 SSE connections per browser. Users with multiple tabs hit the limit. And SSE doesn't support binary frames.",
          consequenceType: "failure",
        },
      ],
      learning:
        "WebSockets — a single HTTP upgrade handshake establishes a persistent, bidirectional TCP connection. Unlike HTTP (1 request → 1 response → close), WebSocket keeps the channel open indefinitely. Server can push any time without client asking. 2M concurrent WebSocket connections is routine for a properly tuned Go or Node server with event-loop I/O.",
    },
    {
      id: 3,
      question:
        "Your price feed from NSE covers 5,000 stocks. Each user watches 5-20 stocks. How does the server know which users to push a RELIANCE update to?",
      context:
        "You have 2M users and 5,000 stocks. Naively, you'd check all 2M users for every price update — that's 10B checks/second.",
      options: [
        {
          id: "a",
          text: "Broadcast every price change to every connected user",
          correct: false,
          consequence:
            "Every user receives 5,000 updates/second. Client JavaScript can't process this. Battery dies. Browser freezes. Users uninstall.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Pub/Sub — users subscribe to specific stock channels, server publishes to those channels",
          correct: true,
          consequence:
            "User subscribes to 'RELIANCE', 'TCS', 'INFY'. Only receives updates for their 3 stocks. Server fan-out is O(subscribers), not O(all users).",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Store user watchlists in Redis, filter each update against all watchlists",
          correct: false,
          consequence:
            "For 5,000 price updates/second × 2M user checks = 10B Redis lookups/second. Redis runs out of connections in 8 seconds.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Pub/Sub (Publish-Subscribe) — producers publish events to a named channel ('RELIANCE.price'). Consumers subscribe to channels they care about. The broker delivers only relevant messages. This decouples who publishes from who receives, and scales fan-out gracefully. Redis Pub/Sub or Kafka topics both implement this pattern.",
    },
    {
      id: 4,
      question:
        "A user's mobile connection drops for 30 seconds during trading hours. Their WebSocket closes. When they reconnect, how does your server handle it?",
      context:
        "Trading apps must show current prices instantly on reconnect. A 30-second gap in a volatile market is significant.",
      options: [
        {
          id: "a",
          text: "Buffer all missed messages and replay them on reconnect",
          correct: false,
          consequence:
            "30 seconds × 5,000 updates = 150,000 messages queued per user. On reconnect, 2MB of stale prices flood in. Client freezes processing old data.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Fire-and-forget — reconnect gets the next live update, no replay",
          correct: true,
          consequence:
            "User reconnects. Server sends current prices for their watchlist immediately. Then resumes live updates. No stale data, no queue overflow.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Require user to reload the page to get fresh prices",
          correct: false,
          consequence:
            "'Please refresh to see current prices' — every trading app that said this in 2010 lost users to competitors who didn't.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Fire-and-forget reconnect — for real-time price feeds, the latest value is always more useful than historical replay. On reconnect: (1) fetch current prices for the user's watchlist, (2) resume live subscription. Replaying missed events is appropriate for ordered data (chat, orders) but not for time-series snapshots where only the latest matters.",
    },
    {
      id: 5,
      question:
        "A user opens a RELIANCE price chart for the last 6 months. This is historical OHLC data — 180 days × 400+ stocks. Where do you store this?",
      context:
        "This data is write-once (NSE closes, you write the day's candle), read-many (every chart load). You need fast range queries: 'give me RELIANCE from Jan 1 to June 30'.",
      options: [
        {
          id: "a",
          text: "Postgres with a timestamp index — we already use it",
          correct: false,
          consequence:
            "Works at small scale. At 400 stocks × 390 minute-candles/day × 252 trading days = 39M rows/year. Range queries slow down as table grows. Joins become painful.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Time Series Database (InfluxDB / TimescaleDB) built for OHLC data",
          correct: true,
          consequence:
            "Columnar storage, time-indexed compression, 10x faster range queries than row-store Postgres. 6-month chart loads in 40ms instead of 4 seconds.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Store in Redis — it's already fast",
          correct: false,
          consequence:
            "Redis is in-memory. 39M rows of OHLC data per year = 6GB RAM per year just for price history. At 5 years, you need 30GB of RAM for data that's queried infrequently.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Time Series Databases — purpose-built for timestamped data with columnar compression (OHLC values compress 10x), built-in time-bucketing queries (avg per hour, max per day), and automatic data retention policies. TimescaleDB extends Postgres with these capabilities. InfluxDB is standalone. Both outperform row-store databases for range scans on time-ordered data.",
    },
  ],
  finalArchitecture:
    "NSE Feed → Price Service → Kafka → WebSocket Server (Pub/Sub) → 2M Clients | TimescaleDB for historical charts",
  score: {
    perfect: "Sub-200ms prices. Traders thank you personally.",
    good: "Mostly real-time. One edge case loses a trader money.",
    average: "Better than polling. Not good enough for active traders.",
    poor: "Still polling every 5 seconds. Traders switch to Zerodha.",
  },
};
