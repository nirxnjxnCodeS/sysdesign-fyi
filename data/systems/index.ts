import type { SystemMeta } from "@/lib/types";

export const systems: SystemMeta[] = [
  {
    id: "url-shortener",
    name: "URL Shortener",
    description: "Design a system that shortens long URLs and redirects billions of requests per day.",
    difficulty: "Beginner",
    icon: "🔗",
    tags: ["Hashing", "Caching", "Redirection"],
    estimatedTime: "15 min",
  },
  {
    id: "payment-system",
    name: "Payment System",
    description: "Build a fault-tolerant payment processor that guarantees exactly-once transactions.",
    difficulty: "Advanced",
    icon: "💳",
    tags: ["Idempotency", "ACID", "Distributed Locks"],
    estimatedTime: "30 min",
  },
  {
    id: "notification-system",
    name: "Notification System",
    description: "Architect a multi-channel notification engine that delivers millions of alerts reliably.",
    difficulty: "Intermediate",
    icon: "🔔",
    tags: ["Message Queues", "Fan-out", "Push/Pull"],
    estimatedTime: "20 min",
  },
  {
    id: "stock-price-ticker",
    name: "Stock Price Ticker",
    description: "Design a real-time stock price system with sub-millisecond latency and global distribution.",
    difficulty: "Intermediate",
    icon: "📈",
    tags: ["WebSockets", "Time-series", "Pub/Sub"],
    estimatedTime: "20 min",
  },
  {
    id: "chat-system",
    name: "Chat System",
    description: "Build WhatsApp-scale messaging with end-to-end delivery guarantees and offline sync.",
    difficulty: "Intermediate",
    icon: "💬",
    tags: ["WebSockets", "Message Ordering", "Presence"],
    estimatedTime: "25 min",
  },
  {
    id: "video-streaming",
    name: "Video Streaming",
    description: "Architect a Netflix-scale video platform with adaptive bitrate and global CDN delivery.",
    difficulty: "Advanced",
    icon: "🎥",
    tags: ["CDN", "Transcoding", "Adaptive Streaming"],
    estimatedTime: "35 min",
  },
];

export const difficultyBadge: Record<string, string> = {
  Beginner:
    "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20",
  Intermediate:
    "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20",
  Advanced:
    "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-400/10 dark:border-rose-400/20",
};
