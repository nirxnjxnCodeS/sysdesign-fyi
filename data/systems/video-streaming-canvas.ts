export const videoStreamingCanvas = {
  correctNodes: ["user", "cdn", "blob-storage", "app-server", "message-queue"],
  criticalNodes: ["cdn", "blob-storage", "app-server"],
  correctEdges: [
    { source: "app-server", target: "blob-storage" },
    { source: "blob-storage", target: "cdn" },
    { source: "cdn", target: "user" },
    { source: "app-server", target: "message-queue" },
  ],
  hints: {
    cdn:
      "CDN edge nodes cache video chunks close to users — a London viewer gets chunks from Frankfurt, not Mumbai.",
    "blob-storage":
      "S3 or similar object storage holds transcoded video chunks for all quality levels (360p to 4K).",
    "app-server":
      "The encoding service receives raw uploads, triggers workers via queue, and writes transcoded output to S3.",
    "message-queue":
      "An async queue distributes encoding jobs across many workers for parallel transcoding.",
  },
  answerNodes: [
    {
      nodeId: "user",
      componentType: "user",
      label: "Viewer",
      icon: "👤",
      color: "#3B82F6",
      x: 700,
      y: 340,
    },
    {
      nodeId: "cdn",
      componentType: "cdn",
      label: "CDN Edge",
      icon: "🌐",
      color: "#F59E0B",
      x: 500,
      y: 340,
    },
    {
      nodeId: "blob-storage",
      componentType: "blob-storage",
      label: "S3 (Transcoded)",
      icon: "🗃️",
      color: "#10B981",
      x: 300,
      y: 340,
    },
    {
      nodeId: "app-server",
      componentType: "app-server",
      label: "Encoding Service",
      icon: "⚙️",
      color: "#06B6D4",
      x: 100,
      y: 200,
    },
    {
      nodeId: "message-queue",
      componentType: "message-queue",
      label: "Encoding Queue",
      icon: "📬",
      color: "#8B5CF6",
      x: 300,
      y: 100,
    },
  ],
  answerEdges: [
    { source: "app-server", target: "message-queue", label: "transcode jobs" },
    { source: "message-queue", target: "app-server", label: "worker picks up" },
    { source: "app-server", target: "blob-storage", label: "write chunks" },
    { source: "blob-storage", target: "cdn", label: "origin pull" },
    { source: "cdn", target: "user", label: "HLS stream" },
  ],
};
