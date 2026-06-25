export const chatSystemCanvas = {
  correctNodes: ["user", "app-server", "kafka", "sql-db", "redis-cache"],
  criticalNodes: ["app-server", "kafka", "sql-db"],
  correctEdges: [
    { source: "user", target: "app-server" },
    { source: "app-server", target: "sql-db" },
    { source: "app-server", target: "kafka" },
    { source: "kafka", target: "app-server" },
    { source: "app-server", target: "user" },
  ],
  hints: {
    kafka:
      "Kafka routes messages between WebSocket servers — sender on Server A publishes, recipient on Server B consumes.",
    "sql-db":
      "Messages are persisted to SQL before delivery. Offline users sync from their last seen message ID on reconnect.",
    "app-server":
      "WebSocket servers hold persistent connections for users and push messages as they arrive.",
    "redis-cache":
      "Redis caches active WebSocket sessions (user_id → server_id) for fast routing without DB lookups.",
  },
  answerNodes: [
    {
      nodeId: "sender",
      componentType: "user",
      label: "Sender (Priya)",
      icon: "👤",
      color: "#3B82F6",
      x: 100,
      y: 250,
    },
    {
      nodeId: "ws-server-a",
      componentType: "app-server",
      label: "WebSocket Server A",
      icon: "⚙️",
      color: "#06B6D4",
      x: 300,
      y: 250,
    },
    {
      nodeId: "kafka",
      componentType: "kafka",
      label: "Kafka Message Bus",
      icon: "📨",
      color: "#F97316",
      x: 500,
      y: 130,
    },
    {
      nodeId: "sql-db",
      componentType: "sql-db",
      label: "Messages DB",
      icon: "🗄️",
      color: "#10B981",
      x: 500,
      y: 370,
    },
    {
      nodeId: "ws-server-b",
      componentType: "app-server",
      label: "WebSocket Server B",
      icon: "⚙️",
      color: "#06B6D4",
      x: 700,
      y: 250,
    },
    {
      nodeId: "recipient",
      componentType: "user",
      label: "Recipient (Rohan)",
      icon: "👤",
      color: "#3B82F6",
      x: 900,
      y: 250,
    },
  ],
  answerEdges: [
    { source: "sender", target: "ws-server-a", label: "WebSocket" },
    { source: "ws-server-a", target: "sql-db", label: "persist first" },
    { source: "ws-server-a", target: "kafka", label: "publish" },
    { source: "kafka", target: "ws-server-b", label: "consume" },
    { source: "ws-server-b", target: "recipient", label: "push" },
  ],
};
