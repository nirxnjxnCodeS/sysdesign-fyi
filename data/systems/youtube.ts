export const youtube = {
  id: "youtube",
  title: "YouTube",
  scenario:
    "500 hours of video are uploaded to YouTube every minute. 2 billion logged-in users per month. A video uploaded in Chennai needs to be watchable in London in under 5 minutes after upload. The recommendation algorithm serves 70% of watch time. Design YouTube's core video platform.",
  decisions: [
    {
      id: 1,
      question:
        "A creator uploads a 4K, 2-hour movie (50GB raw file). Users in India, USA, and Japan all need to watch it. What's the architecture for storing and serving this video?",
      context:
        "50GB raw files can't be served directly. Multiple countries, multiple devices, multiple network speeds.",
      options: [
        {
          id: "a",
          text: "Store the raw 50GB file in a database and stream it to users on demand",
          correct: false,
          consequence:
            "50GB in a database row. 2 billion users. Database becomes a video file storage system — catastrophically wrong tool. Serving 50GB to each viewer simultaneously collapses everything.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Transcode to multiple formats/resolutions → store in S3 → distribute to CDN edge nodes globally → stream chunks to users",
          correct: true,
          consequence:
            "Raw video → encoding pipeline creates 240p/480p/720p/1080p/4K versions, each split into 6-second chunks → S3 → CDN globally. User in Japan streams from Tokyo CDN. User in India from Mumbai CDN. Adaptive bitrate picks right quality per device. YouTube scales.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Store the video on a dedicated video server, stream directly from that server globally",
          correct: false,
          consequence:
            "One server streaming 50GB to billions of simultaneous viewers. Network capacity alone makes this impossible. And the server is in one location — Japan users get terrible latency from a US server.",
          consequenceType: "failure",
        },
      ],
      learning:
        "YouTube's video pipeline: raw upload → transcoder (encodes in parallel at multiple resolutions) → split into 6-second chunks → object storage → CDN globally. 500 hours uploaded/minute = ~30,000 seconds of raw video per minute, transcoded, chunked, and distributed continuously. Adaptive Bitrate (ABR) streaming lets the client switch quality levels mid-stream based on network speed.",
    },
    {
      id: 2,
      question:
        "YouTube's recommendation algorithm drives 70% of all watch time. When a user opens YouTube, they see a personalized homepage. How do you generate these recommendations for 2 billion users?",
      context:
        "Recommendation systems are one of the most complex ML engineering problems. In a system design interview, explain the architecture, not the ML model.",
      options: [
        {
          id: "a",
          text: "When user opens the app, run the full recommendation ML model in real-time and return results",
          correct: false,
          consequence:
            "Full ML model inference for 2B simultaneous homepage loads. Even at 10ms per inference, the compute cost is astronomical. Cold-start users with no history still need recommendations. This cannot work at YouTube scale.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Pre-compute recommendations in a nightly batch job, store in a user→videos cache, serve instantly on load",
          correct: true,
          consequence:
            "Batch ML pipeline runs overnight: collaborative filtering + user history → pre-computed list of 500 candidate videos per user → stored in Redis. Homepage load = single Redis lookup. 2B users × 500 videos × ~8 bytes = ~8TB Redis cluster. Fast and scalable.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Show every user the same trending videos — no personalization",
          correct: false,
          consequence:
            "70% of YouTube watch time comes from recommendations. Removing personalization destroys engagement. Users stop opening the app. This is not a viable product decision.",
          consequenceType: "failure",
        },
      ],
      learning:
        "YouTube's recommendation pipeline has two stages: (1) Candidate generation — a lightweight model retrieves hundreds of relevant videos per user from billions of options using user watch history and embeddings. (2) Ranking — a heavier model scores those candidates by predicted watch time. This two-stage architecture runs in batch, with results cached. At serving time, the feed is fetched from cache in milliseconds.",
    },
    {
      id: 3,
      question:
        "A Mr Beast video gets 200 million views in 24 hours. Each view increments a view counter and records a watch event. How do you handle this without your database collapsing?",
      context:
        "200M writes to the same row in 24 hours = ~2,300 writes per second on one database row. This is the hot row problem.",
      options: [
        {
          id: "a",
          text: "UPDATE videos SET view_count = view_count + 1 WHERE video_id = X for every view",
          correct: false,
          consequence:
            "Row-level locking on a single row. 2,300 concurrent increments queue up. At peak (first hour: 10M views), the lock queue is thousands deep. Database stalls. Every viewer who presses play is waiting for a DB lock.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Write view events to Kafka → stream processor aggregates counts → periodic batch update to DB",
          correct: true,
          consequence:
            "View event → Kafka (instant, no DB write). Stream processor (Kafka Streams) counts views per video per minute → 1 DB write per minute per video instead of 2,300/sec. Counter is eventually consistent by ~1 minute — users don't notice.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Use a Redis counter for view counts — INCR is atomic and fast",
          correct: false,
          consequence:
            "Redis INCR is atomic and handles 2,300/sec easily. But Redis is memory-only — if it restarts, you lose all counts. And you still need to eventually persist to the database. This is a partial solution, not a complete architecture.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Kafka-based counter aggregation: view events are written to Kafka (fire-and-forget, no DB write at view time). A Kafka Streams job aggregates counts per video per time window and writes batched updates to the database. This pattern converts millions of individual writes into a small number of batch writes. YouTube's actual view counter is famously 'eventually consistent' — it sometimes freezes and updates in jumps, which is exactly this batch aggregation visible to users.",
    },
    {
      id: 4,
      question:
        "YouTube has 800 million videos. A user searches 'how to make pasta'. The search must return relevant results in under 500ms across the entire video corpus. How?",
      context:
        "SQL LIKE queries on 800M rows are impossible. You need purpose-built search infrastructure.",
      options: [
        {
          id: "a",
          text: "SELECT * FROM videos WHERE title LIKE '%pasta%' ORDER BY view_count",
          correct: false,
          consequence:
            "LIKE query with leading wildcard = full table scan on 800M rows. This takes minutes, not milliseconds. At 1B searches per day, your SQL server is permanently melted.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Index all video metadata in Elasticsearch — inverted index for fast full-text search, ranked by relevance signals",
          correct: true,
          consequence:
            "Elasticsearch maintains an inverted index: 'pasta' → [video_id_1, video_id_2, ...]. Search 'how to make pasta' → find all videos matching these terms in milliseconds. Rank by: TF-IDF relevance + view count + watch time + recency. Results in <100ms on 800M documents.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Cache the top 1000 searches and return those results for everything else",
          correct: false,
          consequence:
            "The long tail of searches is enormous. 'how to make pasta with truffle oil from scratch 2024' won't be in any cache. Search quality collapses for anything non-trivial. Most queries are unique.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Elasticsearch (or Apache Solr) is the standard for full-text search at scale. It maintains an inverted index: a mapping from each word to the list of documents containing it. This lets it find all matching videos in O(1) time regardless of corpus size. YouTube enriches this with signals: view count, watch time (CTR), freshness, channel authority. The search ranking is a separate ML model that scores Elasticsearch's candidate results.",
    },
    {
      id: 5,
      question:
        "A video upload fails midway through. The creator retries — but your system might process the same video twice, creating duplicates. How do you ensure exactly-once upload processing?",
      context:
        "Network failures during upload are common. Your backend must handle retries without creating duplicates.",
      options: [
        {
          id: "a",
          text: "On retry, check if a video with the same title exists — reject duplicates",
          correct: false,
          consequence:
            "Same title is not unique. A creator uploading 'Tutorial #47' for the 10th time would be blocked after one failed attempt. Title-based deduplication is completely wrong.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Client generates a unique upload ID before starting — server uses it as an idempotency key to deduplicate retries",
          correct: true,
          consequence:
            "Client generates UUID before first upload attempt. On retry, sends the same UUID. Server checks: 'have I seen upload_id=abc123?' Yes → return the existing job status, don't reprocess. Exactly-once semantics regardless of how many retries.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Use a distributed lock on the filename — reject concurrent uploads of files with the same name",
          correct: false,
          consequence:
            "Filename is not a reliable deduplication key — two different files can have the same name. And 'Untitled.mp4' would block every upload from every creator simultaneously.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Client-generated idempotency keys are the standard pattern for exactly-once upload semantics. The flow: client generates UUID → attaches to every attempt → server stores {upload_id → job_id} in Redis with TTL → on duplicate upload_id, return existing job status. This is the same pattern as payment systems. For large files, resumable uploads (like the TUS protocol) extend this: each chunk has its own checksum, so only failed chunks are retried, not the whole file.",
    },
  ],
  finalArchitecture:
    "Upload → Transcoder → S3 → CDN (adaptive bitrate) | Views → Kafka → Batch counter | Search → Elasticsearch | Recommendations → Batch ML → Redis cache",
  score: {
    perfect: "Video live in London 4 minutes after Chennai upload. Mr Beast's view count updating smoothly. 📹",
    good: "Solid YouTube engineer. Transcoding and CDN nailed.",
    average: "Video platform works. View counter melting under viral load.",
    poor: "Mr Beast's upload failed 3 times and created 3 duplicate videos.",
  },
};
