export interface PaletteItem {
  type: string;
  icon: string;
  label: string;
}

export interface PaletteGroup {
  label: string;
  color: string;
  items: PaletteItem[];
}

export const COMPONENT_GROUPS: PaletteGroup[] = [
  {
    label: "CLIENT",
    color: "#F59E0B",
    items: [{ type: "user", icon: "👤", label: "User / Client" }],
  },
  {
    label: "ROUTING",
    color: "#F59E0B",
    items: [
      { type: "load-balancer", icon: "⚖️", label: "Load Balancer" },
      { type: "api-gateway", icon: "🌐", label: "API Gateway" },
    ],
  },
  {
    label: "COMPUTE",
    color: "#F59E0B",
    items: [
      { type: "app-server", icon: "⚙️", label: "App Server" },
      { type: "lambda", icon: "λ", label: "Lambda Function" },
    ],
  },
  {
    label: "STORAGE",
    color: "#10B981",
    items: [
      { type: "sql-db", icon: "🗄️", label: "SQL Database" },
      { type: "nosql-db", icon: "📦", label: "NoSQL Database" },
      { type: "redis-cache", icon: "⚡", label: "Redis Cache" },
      { type: "blob-storage", icon: "🪣", label: "Blob Storage" },
    ],
  },
  {
    label: "MESSAGING",
    color: "#F59E0B",
    items: [
      { type: "message-queue", icon: "📨", label: "Message Queue" },
      { type: "kafka", icon: "🌊", label: "Kafka Stream" },
    ],
  },
  {
    label: "CDN / OTHER",
    color: "#F59E0B",
    items: [
      { type: "cdn", icon: "🌍", label: "CDN" },
      { type: "auth-service", icon: "🔐", label: "Auth Service" },
    ],
  },
];

export const TYPE_COLOR: Record<string, string> = {};
for (const g of COMPONENT_GROUPS) {
  for (const item of g.items) {
    TYPE_COLOR[item.type] = g.color;
  }
}

export const TYPE_ITEM: Record<string, PaletteItem> = {};
for (const g of COMPONENT_GROUPS) {
  for (const item of g.items) {
    TYPE_ITEM[item.type] = item;
  }
}

export const COMPONENT_DESCRIPTIONS: Record<string, string> = {
  user: "The client sending requests. Represents end users accessing your system via browser or app.",
  "load-balancer":
    "Distributes traffic across multiple servers. Prevents any single server from being overwhelmed.",
  "api-gateway":
    "Entry point for API requests. Handles routing, auth, rate limiting, and request transformation.",
  "app-server":
    "Processes business logic. Stateless servers that handle requests and return responses.",
  lambda:
    "Serverless function that runs on-demand. Auto-scales to zero, billed per invocation.",
  "sql-db":
    "Relational database with ACID guarantees. Best for structured data with complex queries.",
  "nosql-db":
    "Distributed store for flexible schemas and horizontal scaling. Handles billions of simple lookups.",
  "redis-cache":
    "In-memory data store. Serves hot data in microseconds, cutting database load by 10-100×.",
  "blob-storage":
    "Object storage for files, images, and videos. Highly durable and cheap at petabyte scale.",
  "message-queue":
    "Decouples producers from consumers. Buffers work so slow consumers never lose messages.",
  kafka:
    "High-throughput distributed streaming. Retains messages for replay, handles millions of events/sec.",
  cdn: "Caches static assets at edge locations worldwide for low-latency delivery to users everywhere.",
  "auth-service":
    "Handles authentication and authorization. Issues JWTs, verifies tokens, manages sessions.",
};
