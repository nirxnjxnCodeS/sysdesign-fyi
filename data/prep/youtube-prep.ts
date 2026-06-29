import type { PrepData } from "./types";

export const youtubePrep: PrepData = {
  systemId: "youtube",
  systemName: "YouTube",
  sections: [
    {
      type: "interactive",
      sectionId: "requirements",
      step: "Step 1 — Requirements",
      title: "Sort the Requirements",
      subtitle:
        "YouTube is three systems in one: video upload pipeline, video delivery, and recommendation engine. Interviewers want to see you scope explicitly.",
      interaction: {
        type: "requirements-sort",
        buckets: [
          {
            id: "functional",
            label: "Functional",
            description: "What the system does — features users interact with",
          },
          {
            id: "non-functional",
            label: "Non-Functional",
            description: "How well it performs — speed, scale, reliability",
          },
          {
            id: "out-of-scope",
            label: "Out of Scope",
            description: "Explicitly excluded from this design",
          },
        ],
        items: [
          {
            id: "r1",
            text: "Upload a video and have it available for streaming",
            correctBucket: "functional",
            explanation: "Core upload pipeline — raw video must be transcoded and made available.",
          },
          {
            id: "r2",
            text: "Video must be watchable globally within 5 minutes of upload",
            correctBucket: "non-functional",
            explanation: "Upload-to-playback latency — drives parallel transcoding and CDN warm-up.",
          },
          {
            id: "r3",
            text: "Support 2 billion monthly active users",
            correctBucket: "non-functional",
            explanation: "Scale constraint — drives CDN-first architecture.",
          },
          {
            id: "r4",
            text: "Stream video at appropriate quality for user's network speed",
            correctBucket: "functional",
            explanation: "Adaptive Bitrate (ABR) streaming is a core functional feature.",
          },
          {
            id: "r5",
            text: "Live streaming (YouTube Live)",
            correctBucket: "out-of-scope",
            explanation: "Live streaming has fundamentally different architecture (no transcoding buffer) — separate scope.",
          },
          {
            id: "r6",
            text: "500 hours uploaded per minute without data loss",
            correctBucket: "non-functional",
            explanation: "Upload ingestion scale — drives the transcoding queue architecture.",
          },
          {
            id: "r7",
            text: "Personalized video recommendations on the homepage",
            correctBucket: "functional",
            explanation: "Recommendations are a core product feature driving 70% of watch time.",
          },
          {
            id: "r8",
            text: "Video search by keyword",
            correctBucket: "functional",
            explanation: "Search is a distinct functional feature requiring Elasticsearch.",
          },
          {
            id: "r9",
            text: "View count, like count, and comment count on each video",
            correctBucket: "non-functional",
            explanation: "Counters are correctness constraints — they must not be wildly inaccurate or cause hot row contention.",
          },
          {
            id: "r10",
            text: "Video content moderation and copyright detection",
            correctBucket: "out-of-scope",
            explanation: "Content moderation is a separate ML pipeline — out of scope for the core platform design.",
          },
        ],
      },
    },
    {
      type: "interactive",
      sectionId: "estimation",
      step: "Step 2 — Estimation",
      title: "Work Through the Math",
      subtitle:
        "Video storage and transcoding throughput are the defining constraints for YouTube.",
      interaction: {
        type: "estimation-calculator",
        steps: [
          {
            id: "e1",
            label: "Video uploaded per minute",
            formula: "Given assumption",
            answer: 500,
            unit: "hours/minute",
            userInput: false,
            hint: "",
            explanation: "500 hours of video per minute — YouTube's actual upload rate.",
          },
          {
            id: "e2",
            label: "Average raw video size per hour",
            formula: "Given assumption",
            answer: 25,
            unit: "GB per hour of video",
            userInput: false,
            hint: "",
            explanation: "25GB per hour of raw 1080p footage — before transcoding.",
          },
          {
            id: "e3",
            label: "Raw upload storage per day",
            formula: "500 hours/min × 60 min × 25 GB",
            answer: 750000,
            unit: "GB per day (~750TB)",
            userInput: true,
            hint: "500 hours/min × 60 min/hour × 25 GB/hour",
            explanation: "~750TB of raw video per day, before encoding multiple quality levels.",
          },
          {
            id: "e4",
            label: "Transcoded storage multiplier",
            formula: "4 quality levels × average compression",
            answer: 3,
            unit: "x raw size",
            userInput: false,
            hint: "",
            explanation: "240p, 480p, 720p, 1080p variants each chunked into 6-second segments. Total ≈ 3x raw = ~2.25PB/day.",
          },
          {
            id: "e5",
            label: "Video stream requests per second",
            formula: "2B users × 1hr average × 3600 seconds",
            answer: 555555,
            unit: "concurrent chunk requests/sec",
            userInput: true,
            hint: "2B monthly users × fraction online / 3600",
            explanation: "~500K concurrent streaming requests/second. CDN handles 95%+ — only ~25K hit origin per second.",
          },
          {
            id: "e6",
            label: "Peak view rate for a viral video",
            formula: "Mr Beast video: 10M views in first hour",
            answer: 2778,
            unit: "views/sec peak",
            userInput: true,
            hint: "10M views ÷ 3,600 seconds",
            explanation: "~2,800 simultaneous chunk requests per second for one video. CDN distributes this globally — no single origin handles all of it.",
          },
        ],
        insight:
          "750TB raw upload per day and 2.25PB after transcoding is the defining constraint. This is why: (1) raw uploads go to S3, not a database, (2) transcoding is distributed across a worker pool, (3) CDN is the only viable delivery mechanism. The 95% CDN hit rate converts 500K streaming requests/sec into only 25K reaching origin.",
      },
    },
    {
      type: "apiDesign",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/videos/upload-session",
          description: "Initialize a resumable upload session",
          requestBody: `{
  "title": "How to make pasta from scratch",
  "description": "Complete guide...",
  "fileSize": 52428800000,   // 50GB in bytes
  "mimeType": "video/mp4",
  "uploadIdempotencyKey": "client-uuid-abc123"  // prevents duplicate uploads
}`,
          response: `// 200 OK
{
  "uploadSessionId": "session_xyz789",
  "uploadUrl": "https://upload.youtube.com/upload/resumable?session=xyz789",
  "chunkSize": 8388608,   // upload in 8MB chunks
  "expiresAt": "2024-01-16T09:00:00Z"
}`,
          notes:
            "Resumable upload: client sends 8MB chunks sequentially. If connection drops, resume from last successful chunk using uploadSessionId. Idempotency key prevents duplicate video creation on retry.",
        },
        {
          method: "GET",
          path: "/api/v1/videos/{videoId}/manifest.m3u8",
          description: "Fetch HLS manifest for adaptive streaming",
          response: `// HLS Master Manifest
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=426x240
/v/{videoId}/240p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480
/v/{videoId}/480p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720
/v/{videoId}/720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=1920x1080
/v/{videoId}/1080p/index.m3u8`,
          notes:
            "HLS (HTTP Live Streaming) manifest lists all quality variants. Client picks based on network speed, switches automatically. Each quality variant has its own index pointing to 6-second .ts chunks.",
        },
        {
          method: "POST",
          path: "/api/v1/videos/{videoId}/watch-event",
          description: "Record a view event — contributes to view counter",
          requestBody: `{
  "watchDuration": 245,    // seconds watched
  "quality": "720p",
  "deviceType": "mobile"
}`,
          response: `// 200 OK - fire and forget
{ "received": true }`,
          notes:
            "Fire-and-forget: write to Kafka, return immediately. View count updates asynchronously via batch aggregation. Client doesn't wait for DB write.",
        },
      ],
      trap: {
        title: "Serving 50GB videos from a single server or database",
        content: `The three classic mistakes in YouTube system design:

1. Storing videos in a database (MySQL BLOB)
   → 50GB per video × 800M videos = physically impossible
   → Use S3/GCS for binary storage

2. Transcoding synchronously during upload
   → User waits for 50GB to transcode before video appears
   → Transcode async via message queue; video appears 'processing'

3. Serving video chunks from origin servers
   → 500K concurrent stream requests × average 1MB/chunk = 500GB/sec bandwidth
   → CDN is the only viable delivery mechanism; origin handles <5% of requests

The correct architecture:
Creator uploads → S3 (raw) → SQS triggers workers → Workers transcode → S3 (chunks) → CDN distributes
Viewer → CDN edge (HLS chunks) → if cache miss → S3 origin
`,
      },
    },
    {
      type: "interactive",
      sectionId: "deepDive",
      step: "Step 4 — Deep Dive",
      title: "Core YouTube Concepts",
      subtitle:
        "Four concepts covering the hardest problems: transcoding, streaming, recommendations, and viral scale.",
      interaction: {
        type: "flashcard-deck",
        title: "YouTube Deep Dive",
        cards: [
          {
            id: "dc1",
            front: {
              label: "CONCEPT 1",
              title: "Adaptive Bitrate Streaming (ABR)",
              subtitle: "How YouTube smoothly adjusts quality mid-stream",
              tag: "Critical",
            },
            back: {
              explanation:
                "A 50GB 4K video is split into 6-second chunks. Each chunk is transcoded at 4-5 quality levels. The client downloads chunks one at a time, choosing quality based on current bandwidth. If bandwidth drops, the next chunk is 480p instead of 1080p — no buffering.",
              code: `// HLS segment structure in S3:
// /videos/{videoId}/240p/seg-001.ts    (6 seconds of 240p video)
// /videos/{videoId}/240p/seg-002.ts
// ...
// /videos/{videoId}/1080p/seg-001.ts  (same 6 seconds, 1080p)
// /videos/{videoId}/1080p/seg-002.ts

// Client-side ABR logic (simplified):
class ABRController {
  async selectNextSegment(segmentIndex) {
    const bandwidth = await measureBandwidth()  // last 10s average

    const quality = bandwidth > 8_000_000  ? '1080p'
                  : bandwidth > 3_000_000  ? '720p'
                  : bandwidth > 1_500_000  ? '480p'
                  : '240p'

    const url = \`/v/\${videoId}/\${quality}/seg-\${segmentIndex.toString().padStart(3,'0')}.ts\`
    return fetch(url)  // served from CDN edge in <20ms
  }
}`,
              proTip:
                "6-second chunks are the sweet spot: short enough to switch quality quickly (one buffer's worth of 'wrong' quality), long enough to amortize HTTP connection overhead. Netflix uses 2-10 second segments; YouTube historically 6 seconds.",
            },
          },
          {
            id: "dc2",
            front: {
              label: "CONCEPT 2",
              title: "Transcoding Pipeline",
              subtitle: "500 hours/minute uploaded → multiple qualities in parallel",
              tag: "Architecture",
            },
            back: {
              explanation:
                "Raw video upload → SQS job per video → worker pool picks up jobs → each worker encodes all quality levels in parallel → segments uploaded to S3 → CDN pre-warmed for popular content.",
              code: `// Upload triggers transcoding job
s3.on('ObjectCreated', async (event) => {
  const { key } = event  // 'raw/videoId/original.mp4'

  await sqs.sendMessage({
    QueueUrl: TRANSCODE_QUEUE,
    MessageBody: JSON.stringify({
      videoId: extractVideoId(key),
      inputKey: key,
      qualities: ['240p', '480p', '720p', '1080p', '4k'],
      segmentDuration: 6  // seconds
    })
  })
})

// Transcoding worker (runs on GPU instances):
sqs.consume(TRANSCODE_QUEUE, async (job) => {
  const { videoId, inputKey, qualities } = job

  // Encode all qualities in parallel
  await Promise.all(qualities.map(quality =>
    transcodeToQuality(inputKey, videoId, quality)
  ))

  // Mark video as available
  await db.update('videos', { id: videoId, status: 'AVAILABLE' })

  // Notify CDN to pre-warm (for popular creators)
  if (isPopularCreator(videoId)) {
    await cdn.preWarm(videoId, qualities)
  }
})`,
              proTip:
                "GPU instances are necessary for fast video encoding. A 2-hour 4K video takes ~30 minutes to transcode on a CPU instance, ~3 minutes on a GPU. YouTube's target: video available within 5 minutes of upload. This requires GPU worker pools with auto-scaling.",
            },
          },
          {
            id: "dc3",
            front: {
              label: "CONCEPT 3",
              title: "Recommendation Architecture",
              subtitle: "How 70% of watch time is driven by an ML system",
              tag: "ML Systems",
            },
            back: {
              explanation:
                "YouTube's recommendation system has two stages: candidate generation (pick 500 relevant videos from 800M) and ranking (score those 500 to pick top 20). Both stages run in batch overnight, not at serving time.",
              code: `// Stage 1: Candidate generation (runs nightly)
// Collaborative filtering: "users like you watched these"
const candidates = await mlModel.generateCandidates({
  userId: 'user_789',
  watchHistory: last30DaysHistory,
  embedding: userEmbedding,  // dense vector of interests
  limit: 500
})
// candidates: list of 500 video_ids

// Stage 2: Ranking (runs nightly, per user)
const ranked = await rankingModel.score({
  userId: 'user_789',
  candidateVideoIds: candidates,
  features: {
    watchProbability: ...,   // will user watch > 50%?
    satisfactionScore: ...,  // will user like/share?
    freshness: ...,          // is this a new video?
    diversification: ...,    // avoid too many similar videos
  }
})

// Store result in Redis for instant serving
await redis.set(
  \`recommendations:\${userId}\`,
  JSON.stringify(ranked.slice(0, 50)),
  'EX', 86400  // refresh daily
)

// At serving time (user opens YouTube):
const homeFeed = await redis.get(\`recommendations:\${userId}\`)
// O(1) lookup — no ML inference at serve time`,
              proTip:
                "The key architectural insight: ML inference happens in batch overnight, not at serving time. Serving time is just a Redis lookup. This decouples recommendation quality (which can be improved by training better models) from serving latency (always fast, always cheap).",
            },
          },
          {
            id: "dc4",
            front: {
              label: "CONCEPT 4",
              title: "View Count at Viral Scale",
              subtitle: "Mr Beast video: 2,800 views/second without hot row lock",
              tag: "Scale",
            },
            back: {
              explanation:
                "Directly incrementing a view counter for every view creates a hot row: all 2,800 views/second queue on the same database lock. The solution: write view events to Kafka, batch aggregate, periodic UPDATE.",
              code: `// BAD: direct SQL increment per view
await db.query(
  'UPDATE videos SET view_count = view_count + 1 WHERE id = ?',
  [videoId]
)
// 2,800/sec → permanent row-level lock queue → database stalls

// GOOD: Kafka buffering + batch aggregation
// On each view event (fire and forget):
await kafka.produce('view_events', {
  videoId: 'dQw4w9WgXcQ',
  userId: 'user_123',
  watchDuration: 245,
  timestamp: Date.now()
})

// Kafka Streams consumer (runs every 60 seconds):
const events = await kafka.consume('view_events', { window: 60_000 })

const viewsByVideo = events.reduce((acc, e) => {
  acc[e.videoId] = (acc[e.videoId] ?? 0) + 1
  return acc
}, {})

// One UPDATE per video per minute instead of 2,800/second
await db.batchUpdate(
  Object.entries(viewsByVideo).map(([videoId, count]) => ({
    sql: 'UPDATE videos SET view_count = view_count + ? WHERE id = ?',
    params: [count, videoId]
  }))
)`,
              proTip:
                "YouTube's view counter is famously 'approximately accurate' — it freezes at round numbers (like 301 views, a famous quirk) while validation happens. This eventual consistency is intentional: accuracy within minutes is good enough. Nobody cares if a video shows '9,999,985 views' vs '10,000,000 views' in real-time.",
            },
          },
        ],
      },
    },
    {
      type: "interactive",
      sectionId: "tradeoffs",
      step: "Step 5 — Senior Tradeoffs",
      title: "Make the Calls",
      subtitle: "YouTube tradeoffs involve video-specific infrastructure decisions.",
      interaction: {
        type: "tradeoff-picker",
        scenarios: [
          {
            id: "t1",
            scenario: "Should you transcode to all quality levels immediately after upload, or lazily on first request?",
            context:
              "Transcoding all qualities upfront takes 3-30 minutes. Lazy transcoding delays the first viewer. 500 hours uploaded per minute.",
            options: [
              {
                id: "a",
                label: "Eager: transcode all qualities immediately after upload",
                correct: true,
                consequence:
                  "All users get smooth ABR experience from the first view. GPU instances auto-scale with upload volume. 5-minute SLA to availability is achievable. Storage cost: 3x raw (worth it for UX consistency).",
              },
              {
                id: "b",
                label: "Lazy: transcode quality levels only when first requested",
                correct: false,
                consequence:
                  "First viewer of each quality triggers transcoding (30+ second delay). For popular videos, many viewers hit the same quality simultaneously, causing a thundering herd of transcode jobs. First-viewer experience is terrible.",
              },
            ],
            seniorNote:
              "Eager transcoding is the right choice for a platform where video quality is a core product promise. The thundering herd problem of lazy transcoding is particularly bad for YouTube because videos often get burst traffic right after upload (creator shares to their audience). The GPU auto-scaling cost is justified by consistent first-view quality.",
          },
          {
            id: "t2",
            scenario: "How long should a video's CDN cache TTL be?",
            context:
              "Video chunks are immutable once transcoded. But creators can delete videos or adjust availability settings.",
            options: [
              {
                id: "a",
                label: "Very long TTL (1 year) for video chunks — immutable content",
                correct: true,
                consequence:
                  "Chunks are referenced by content-addressed URLs (hash in the URL). Deleted videos use access control at the CDN layer (signed URLs or access token validation) — CDN evicts on revocation. Long TTL = maximum cache efficiency.",
              },
              {
                id: "b",
                label: "Short TTL (1 hour) — so deleted videos clear from CDN quickly",
                correct: false,
                consequence:
                  "1-hour TTL means 95% CDN hit rate requires most popular videos to be accessed every hour. For long-tail videos watched once a week, they're never cached. CDN hit rate collapses. Storage bandwidth costs skyrocket.",
              },
            ],
            seniorNote:
              "Immutable content + long TTL + access control is the correct pattern for video delivery. Chunk URLs contain a content hash — the URL itself guarantees immutability. Video deletion is enforced via signed URL expiration or token validation at the CDN layer, not by waiting for cache TTL to expire. This separation keeps CDN efficiency high.",
          },
        ],
      },
    },
    {
      type: "cheatSheet",
      components:
        "Upload → S3 (raw) → SQS (transcode jobs) → GPU Workers → S3 (chunks) → CDN | View Events → Kafka → Batch Counter | Search → Elasticsearch | Recs → Batch ML → Redis",
      numbers: [
        { label: "Upload rate", value: "500 hours/minute" },
        { label: "Raw storage/day", value: "~750TB" },
        { label: "Transcoded storage/day", value: "~2.25PB" },
        { label: "Concurrent stream requests", value: "~500K/sec" },
        { label: "CDN hit rate", value: "~95%" },
        { label: "Peak view rate (viral)", value: "~2,800 views/sec" },
      ],
      decisions: [
        {
          decision: "S3 + SQS + GPU worker pool for transcoding",
          why: "500 hours/minute needs parallel transcoding; each video independently queued",
        },
        {
          decision: "HLS adaptive bitrate with 6-second chunks",
          why: "Smooth quality switching based on network; 6s segments balance switching speed vs overhead",
        },
        {
          decision: "CDN for video delivery with long TTL",
          why: "95% cache hit rate required; video chunks are immutable — perfect for indefinite caching",
        },
        {
          decision: "Kafka + batch aggregation for view counts",
          why: "2,800 views/sec on viral videos; hot row contention prevented by batch writes",
        },
        {
          decision: "Two-stage batch ML for recommendations",
          why: "Inference at serve time is too expensive at 2B users; batch overnight + Redis cache = O(1) serving",
        },
      ],
    },
  ],
};
