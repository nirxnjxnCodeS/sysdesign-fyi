export const paymentSystemCanvas = {
  correctNodes: ["user", "load-balancer", "app-server", "sql-db", "redis-cache"],
  criticalNodes: ["user", "app-server", "sql-db"],
  correctEdges: [
    { source: "user", target: "load-balancer" },
    { source: "load-balancer", target: "app-server" },
    { source: "app-server", target: "redis-cache" },
    { source: "app-server", target: "sql-db" },
    { source: "redis-cache", target: "sql-db" },
  ],
  hints: {
    "load-balancer":
      "On Diwali, 10M users pay simultaneously. One server can't handle it — you need traffic distribution.",
    "redis-cache":
      "Idempotency key lookups must be sub-millisecond. Redis caches payment IDs to prevent duplicate charges.",
    "sql-db":
      "Payments need ACID transactions — atomicity, consistency, isolation, durability. SQL is the right choice here.",
    "app-server":
      "The Payment Service coordinates 2PC, validates idempotency keys, and writes to the audit log.",
  },
  answerNodes: [
    {
      nodeId: "user",
      componentType: "user",
      label: "User / Client",
      icon: "👤",
      color: "#3B82F6",
      x: 400,
      y: 50,
    },
    {
      nodeId: "load-balancer",
      componentType: "load-balancer",
      label: "Load Balancer",
      icon: "⚖️",
      color: "#8B5CF6",
      x: 400,
      y: 180,
    },
    {
      nodeId: "app-server",
      componentType: "app-server",
      label: "Payment Service",
      icon: "⚙️",
      color: "#06B6D4",
      x: 400,
      y: 310,
    },
    {
      nodeId: "redis-cache",
      componentType: "redis-cache",
      label: "Redis (Idempotency)",
      icon: "⚡",
      color: "#F97316",
      x: 180,
      y: 450,
    },
    {
      nodeId: "sql-db",
      componentType: "sql-db",
      label: "SQL Database",
      icon: "🗄️",
      color: "#10B981",
      x: 620,
      y: 450,
    },
  ],
  answerEdges: [
    { source: "user", target: "load-balancer" },
    { source: "load-balancer", target: "app-server" },
    { source: "app-server", target: "redis-cache", label: "idempotency check" },
    { source: "app-server", target: "sql-db", label: "ACID transaction" },
  ],
};
