export const instagram = {
  id: "instagram",
  title: "Instagram",
  scenario:
    "2 billion monthly active users. 500 million photos uploaded per day. Every photo must be served globally under 100ms. A Kylie Jenner post gets 15 million likes in 24 hours. Your infrastructure must not flinch. Design Instagram's core photo sharing system.",
  decisions: [
    {
      id: 1,
      question:
        "A user uploads a 4MB photo. Where does it go? Your API server receives the upload — what's the architecture?",
      context:
        "The naive approach routes 4MB through your API server on every upload. Think about what that does at 500M photos/day.",
      options: [
        {
          id: "a",
          text: "User uploads to API server → API server stores in database → serves from there",
          correct: false,
          consequence:
            "500M photos × 4MB = 2 petabytes of binary data in your database. Every database query now has to navigate around 2PB of blob data. Database becomes impossibly slow. Storage cost: astronomical.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "API server generates a presigned S3 URL → client uploads directly to S3 → S3 triggers processing pipeline",
          correct: true,
          consequence:
            "API server never sees a single byte of photo data. Client uploads 4MB directly to S3. S3 event triggers image processor. Your API servers handle only metadata (title, user_id, s3_key). Massively scalable.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "User uploads to a dedicated file server → file server stores locally → serves from local disk",
          correct: false,
          consequence:
            "File server fills up. Now you have 500M files distributed across server disks. No redundancy. One disk failure = permanent photo loss. Can't CDN-distribute files on local disks. Wrong architecture.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Presigned URL pattern: API server generates a temporary S3 URL signed with your AWS credentials. Client uploads directly to S3 using that URL. S3 never exposes your credentials to the client. API server stays lightweight. S3 event then triggers async processing (resize to multiple resolutions, CDN distribution). This is how Instagram, Pinterest, and every photo-heavy app works.",
    },
    {
      id: 2,
      question:
        "A photo is uploaded. Before it can appear in anyone's feed, what processing must happen?",
      context:
        "Raw 4MB photos can't be served directly — think about different screen sizes and network conditions.",
      options: [
        {
          id: "a",
          text: "Serve the original 4MB photo to everyone on every device",
          correct: false,
          consequence:
            "Mobile user on 3G downloads 4MB per photo in their feed. 10 photos = 40MB per feed load. App takes 2 minutes to load. Users immediately uninstall.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Async image processing pipeline: resize to thumbnail (150px), feed resolution (640px), and full resolution — serve appropriate size per device",
          correct: true,
          consequence:
            "Phone on 3G gets 50KB thumbnail. Desktop on fibre gets 1MB full resolution. CDN serves the right size from the nearest edge node. Feed loads in milliseconds.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Compress the original photo and serve one size for everyone",
          correct: false,
          consequence:
            "One compressed size is either too large for mobile or too small for desktop. Can't win. And reprocessing later is expensive — do it right the first time.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Instagram generates 3 sizes per photo: thumbnail (150×150px, ~10KB), feed resolution (640×640px, ~100KB), full resolution (1080×1080px, ~500KB). Processing happens async via a worker pool after S3 upload. Processed images go back to S3 with CDN-friendly URLs. Client requests the appropriate size based on screen resolution and network speed.",
    },
    {
      id: 3,
      question:
        "Kylie Jenner (400M followers) posts a photo. With fan-out on write, your system tries to update 400M feed caches simultaneously. What do you do?",
      context: "Same celebrity problem as Twitter. Instagram has the same issue.",
      options: [
        {
          id: "a",
          text: "Fan-out on write for everyone — push the post ID to all 400M follower caches",
          correct: false,
          consequence:
            "400M Redis writes for one photo. Kylie posts 5 times a day. 2 billion Redis writes per day from one account. Your fanout workers are permanently backlogged. Everyone else's feed updates are delayed by hours.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Hybrid: fan-out on write for regular users, fan-out on read for celebrity accounts (>10K followers)",
          correct: true,
          consequence:
            "Regular user posts → pushed to all follower feeds (fan-out on write). Kylie posts → stored only on her own timeline. When her followers load their feed, the system fetches her recent posts and merges them in real-time. No write amplification.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Remove fan-out entirely — all feeds are generated on-demand at read time",
          correct: false,
          consequence:
            "User follows 500 accounts. Feed load = query 500 timelines + merge + rank. At 200M DAU loading feeds simultaneously, your database becomes a black hole.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Instagram uses the same hybrid fan-out as Twitter. The threshold (10K followers) is tunable. At read time, the feed service: (1) reads pre-computed feed from Redis (contains regular user posts), (2) fetches recent posts from followed celebrity accounts, (3) merges, (4) runs ML ranking, (5) returns top 20. The celebrity posts are served from a per-celebrity Redis cache, not fetched from the database.",
    },
    {
      id: 4,
      question:
        "Instagram serves 1 billion photo views per day globally. A photo uploaded in Mumbai needs to load in under 100ms for a user in New York. How?",
      context:
        "Physics says data travels at ~200ms Mumbai to New York. How do you beat physics?",
      options: [
        {
          id: "a",
          text: "Build faster servers in Mumbai",
          correct: false,
          consequence:
            "Doesn't help. The speed of light limits data to ~200ms Mumbai-New York regardless of server speed. You can't optimize your way past physics.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "CDN — pre-distribute popular photos to edge nodes near every user globally",
          correct: true,
          consequence:
            "Photo cached at New York CDN edge. New York user requests it → served from 5ms away, not 200ms away. 90%+ of photo requests served from CDN. Origin servers barely touched.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Compress photos more aggressively to make them download faster",
          correct: false,
          consequence:
            "Compression reduces file size but not network latency. Even a 1KB file takes 200ms to arrive from Mumbai. Compression solves bandwidth, not latency. Different problems.",
          consequenceType: "failure",
        },
      ],
      learning:
        "CDN cache hit rate is the key metric for Instagram's photo delivery. Photos are immutable (never edited) — perfect for aggressive CDN caching with long TTLs. Once a photo is cached at an edge node, subsequent requests in that region cost near-zero. Instagram reportedly serves ~95%+ of photo requests from CDN. Origin S3 only handles the initial cache fill.",
    },
    {
      id: 5,
      question:
        "Kylie's latest post gets 15 million likes in 24 hours. Every like triggers a database write to increment a counter and send a notification. How do you handle this without your like counter becoming a bottleneck?",
      context:
        "15M likes = 15M write operations to the same database row. That's a classic hot row problem.",
      options: [
        {
          id: "a",
          text: "UPDATE posts SET like_count = like_count + 1 WHERE post_id = X — for every like in real time",
          correct: false,
          consequence:
            "15M sequential writes to the same row. Database row-level locking means each write waits for the previous one. At peak (100K likes/second during first hour), your database is completely blocked on this one row.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Write likes to Kafka → batch aggregate every 30 seconds → update count once per batch",
          correct: true,
          consequence:
            "Individual likes go to Kafka instantly (fast). A consumer reads all likes from the last 30 seconds, counts them, does one UPDATE. Instead of 50,000 writes per 30 seconds, you do 1 write per 30 seconds. Counter is slightly approximate but users don't notice 30-second lag on like counts.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Store likes in a separate table, count them with SELECT COUNT(*) when displaying",
          correct: false,
          consequence:
            "SELECT COUNT(*) on a 15M-row likes table on every post view. At 200M DAU viewing Kylie's post, that's 200M expensive count queries. Database melts.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Counter aggregation via Kafka is the standard pattern for high-volume event counting. Likes/views/reactions are written to Kafka immediately (durable, fast). A consumer batch-aggregates every N seconds and updates the counter. This converts N million writes into 1 write every N seconds. Instagram, YouTube, and Twitter all use this pattern for view and like counts.",
    },
  ],
  finalArchitecture:
    "Upload → S3 (presigned) → Image Processor → CDN | Post → Fanout Service → Redis feeds | Likes → Kafka → Batch counter",
  score: {
    perfect: "Kylie's photo loaded in 50ms in New York. 15M likes handled. 📸",
    good: "Solid Instagram engineer. CDN and fanout working correctly.",
    average: "Photos loading. Like counter slightly broken under celebrity traffic.",
    poor: "Kylie's post just crashed the database. She has 400M followers.",
  },
};
