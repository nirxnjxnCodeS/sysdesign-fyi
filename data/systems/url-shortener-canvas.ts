export const urlShortenerCanvas = {
  correctNodes: ["user", "load-balancer", "app-server", "redis-cache", "nosql-db"],
  criticalNodes: ["user", "redis-cache", "nosql-db"],
  correctEdges: [
    { source: "user", target: "load-balancer" },
    { source: "load-balancer", target: "app-server" },
    { source: "app-server", target: "redis-cache" },
    { source: "redis-cache", target: "nosql-db" },
    { source: "app-server", target: "nosql-db" }, // acceptable alternative
  ],
  hints: {
    "load-balancer":
      "Without a load balancer, one server handles all 10M users — it will crash.",
    "redis-cache":
      "Without Redis, every redirect hits the database. At scale, the DB collapses.",
    "nosql-db":
      "SQL struggles with billions of simple key-value lookups. NoSQL scales horizontally.",
    "app-server":
      "You need at least one server to process URL expansion and creation requests.",
  },
  answerNodes: [
    {
      componentType: "user",
      label: "User / Client",
      icon: "👤",
      color: "#3B82F6",
      x: 400,
      y: 50,
    },
    {
      componentType: "load-balancer",
      label: "Load Balancer",
      icon: "⚖️",
      color: "#8B5CF6",
      x: 400,
      y: 180,
    },
    {
      componentType: "app-server",
      label: "App Server",
      icon: "⚙️",
      color: "#06B6D4",
      x: 400,
      y: 310,
    },
    {
      componentType: "redis-cache",
      label: "Redis Cache",
      icon: "⚡",
      color: "#F97316",
      x: 200,
      y: 440,
    },
    {
      componentType: "nosql-db",
      label: "NoSQL Database",
      icon: "📦",
      color: "#10B981",
      x: 600,
      y: 440,
    },
  ],
  answerEdges: [
    { source: "user", target: "load-balancer", label: undefined },
    { source: "load-balancer", target: "app-server", label: undefined },
    { source: "app-server", target: "redis-cache", label: "cache hit" },
    { source: "app-server", target: "nosql-db", label: "cache miss" },
  ],
};
