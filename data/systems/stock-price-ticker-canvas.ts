export const stockPriceTickerCanvas = {
  correctNodes: ["user", "app-server", "redis-cache", "nosql-db", "kafka"],
  criticalNodes: ["app-server", "redis-cache", "kafka"],
  correctEdges: [
    { source: "app-server", target: "kafka" },
    { source: "kafka", target: "redis-cache" },
    { source: "redis-cache", target: "user" },
    { source: "app-server", target: "nosql-db" },
  ],
  hints: {
    kafka:
      "Kafka decouples the NSE price feed from WebSocket servers — one price update fans out to all subscribers.",
    "redis-cache":
      "Redis Pub/Sub routes price updates to WebSocket servers subscribing to specific stock channels.",
    "app-server":
      "WebSocket servers hold persistent connections for 2M clients and push prices on subscription channels.",
    "nosql-db":
      "TimescaleDB or InfluxDB stores OHLC candles for historical chart queries.",
  },
  answerNodes: [
    {
      nodeId: "user",
      componentType: "user",
      label: "Trader Client",
      icon: "👤",
      color: "#3B82F6",
      x: 400,
      y: 500,
    },
    {
      nodeId: "kafka",
      componentType: "kafka",
      label: "Kafka (Price Feed)",
      icon: "📨",
      color: "#F97316",
      x: 200,
      y: 180,
    },
    {
      nodeId: "app-server",
      componentType: "app-server",
      label: "WebSocket Server",
      icon: "⚙️",
      color: "#06B6D4",
      x: 400,
      y: 340,
    },
    {
      nodeId: "redis-cache",
      componentType: "redis-cache",
      label: "Redis Pub/Sub",
      icon: "⚡",
      color: "#EF4444",
      x: 200,
      y: 340,
    },
    {
      nodeId: "nosql-db",
      componentType: "nosql-db",
      label: "TimescaleDB",
      icon: "📦",
      color: "#10B981",
      x: 620,
      y: 340,
    },
  ],
  answerEdges: [
    { source: "kafka", target: "redis-cache", label: "price events" },
    { source: "redis-cache", target: "app-server", label: "subscribed stocks" },
    { source: "app-server", target: "user", label: "WebSocket push" },
    { source: "kafka", target: "nosql-db", label: "OHLC candles" },
  ],
};
