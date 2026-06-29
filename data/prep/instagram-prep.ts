import type { PrepData } from "./types";

export const instagramPrep: PrepData = {
  systemId: "instagram",
  systemName: "Instagram",
  sections: [
    {
      type: "interactive",
      sectionId: "requirements",
      step: "Step 1 — Requirements",
      title: "Sort the Requirements",
      subtitle:
        "Instagram combines a social feed system with a photo delivery system. Interviewers want to see you handle both concerns explicitly.",
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
            text: "Upload a photo and have it appear in followers' feeds",
            correctBucket: "functional",
            explanation: "The core write path — photo upload + fan-out to followers.",
          },
          {
            id: "r2",
            text: "Photos must load in under 100ms globally",
            correctBucket: "non-functional",
            explanation: "Photo delivery latency — drives the CDN architecture.",
          },
          {
            id: "r3",
            text: "Support 2 billion monthly active users",
            correctBucket: "non-functional",
            explanation: "Scale constraint — determines why fan-out on write needs a celebrity exception.",
          },
          {
            id: "r4",
            text: "Like and comment on photos",
            correctBucket: "functional",
            explanation: "Engagement actions — each like is a high-volume counter update event.",
          },
          {
            id: "r5",
            text: "Direct messaging (DMs) between users",
            correctBucket: "out-of-scope",
            explanation: "DMs are a separate system with separate real-time delivery infrastructure.",
          },
          {
            id: "r6",
            text: "500 million photos uploaded per day without data loss",
            correctBucket: "non-functional",
            explanation: "Upload durability and throughput — drives S3 presigned URL pattern.",
          },
          {
            id: "r7",
            text: "Feed must show photos in ranked order based on relevance",
            correctBucket: "functional",
            explanation: "Algorithmic ranking is a product feature — not just an optimization.",
          },
          {
            id: "r8",
            text: "Instagram Shopping and product tagging",
            correctBucket: "out-of-scope",
            explanation: "Shopping is a separate product surface — different data model and service.",
          },
          {
            id: "r9",
            text: "Celebrity accounts (400M+ followers) must not cause system degradation",
            correctBucket: "non-functional",
            explanation: "Celebrity fan-out constraint — drives the hybrid push/pull design.",
          },
          {
            id: "r10",
            text: "Photos must be served at appropriate resolution per device",
            correctBucket: "functional",
            explanation: "Adaptive image serving is a functional feature — different sizes for thumbnail vs full view.",
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
        "Photo storage and CDN are the defining constraints. Get these numbers right and the rest follows.",
      interaction: {
        type: "estimation-calculator",
        steps: [
          {
            id: "e1",
            label: "Photos uploaded per day",
            formula: "Given assumption",
            answer: 500000000,
            unit: "photos/day",
            userInput: false,
            hint: "",
            explanation: "500M photos/day — Instagram's actual scale.",
          },
          {
            id: "e2",
            label: "Average photo size (original)",
            formula: "Given assumption",
            answer: 4,
            unit: "MB",
            userInput: false,
            hint: "",
            explanation: "4MB average for a typical smartphone photo before processing.",
          },
          {
            id: "e3",
            label: "Raw storage per day",
            formula: "500M × 4MB",
            answer: 2000000000,
            unit: "MB (2 petabytes)",
            userInput: true,
            hint: "Multiply photos by average size",
            explanation: "2 petabytes of raw photos per day. This is why you never store binary in a database.",
          },
          {
            id: "e4",
            label: "Photo upload QPS",
            formula: "500M ÷ 86,400",
            answer: 5787,
            unit: "uploads/sec",
            userInput: true,
            hint: "Divide daily uploads by seconds in a day",
            explanation: "~5,800 uploads/sec average. Peak (evenings) is 3-4x higher: ~20,000 uploads/sec.",
          },
          {
            id: "e5",
            label: "Photos served per day (1B views)",
            formula: "Given assumption",
            answer: 1000000000,
            unit: "photo views/day",
            userInput: false,
            hint: "",
            explanation: "1B photo views/day. Read:write ratio is 2:1 — Instagram is more read-heavy than write-heavy.",
          },
          {
            id: "e6",
            label: "CDN cache hit rate target",
            formula: "Given assumption",
            answer: 95,
            unit: "% of requests served from CDN",
            userInput: false,
            hint: "",
            explanation: "95% CDN hit rate means only 5% of 1B = 50M requests reach origin S3. Photos are immutable — once cached, they stay cached forever.",
          },
        ],
        insight:
          "2 petabytes/day of raw storage is the defining number. It explains every storage decision: S3 (not a database), presigned URLs (API server never touches binary), CDN (2PB can't be served from one origin). The 95% CDN hit rate is equally important — it means your origin infrastructure only handles 50M daily requests instead of 1B.",
      },
    },
    {
      type: "apiDesign",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/media/upload-url",
          description: "Get a presigned S3 URL for direct photo upload",
          requestBody: `{
  "contentType": "image/jpeg",
  "fileSize": 4200000,          // bytes
  "checksum": "sha256:abc..."   // for integrity validation
}`,
          response: `// 200 OK
{
  "uploadUrl": "https://s3.amazonaws.com/instagram-uploads/...",
  "mediaId": "media_xyz789",    // reference this when posting
  "expiresIn": 300              // URL valid for 5 minutes
}`,
          notes:
            "Client uploads directly to S3 using this presigned URL — API server never receives the photo bytes. After upload, S3 triggers the image processing pipeline.",
        },
        {
          method: "POST",
          path: "/api/v1/posts",
          description: "Create a post with already-uploaded media",
          requestBody: `{
  "mediaId": "media_xyz789",    // from upload step
  "caption": "Sunset in Goa 🌅",
  "location": { "name": "Goa, India" },
  "altText": "Orange sunset over Arabian Sea"
}`,
          response: `// 201 Created
{
  "postId": "post_abc123",
  "status": "processing",       // image resizing in progress
  "cdnUrls": {
    "thumbnail": "https://cdn.instagram.com/p/abc/t.jpg",
    "feed": "https://cdn.instagram.com/p/abc/f.jpg",
    "full": "https://cdn.instagram.com/p/abc/l.jpg"
  }
}`,
          notes:
            "Post created immediately, but CDN URLs may not be warm yet — image processing is async. Feed fanout also happens async after post creation.",
        },
        {
          method: "GET",
          path: "/api/v1/feed",
          description: "Fetch user's home feed (paginated)",
          response: `// 200 OK
{
  "posts": [
    {
      "postId": "post_abc123",
      "author": { "id": "user_456", "username": "priya.designs" },
      "imageUrls": {
        "thumbnail": "https://cdn.instagram.com/...",
        "feed": "https://cdn.instagram.com/..."
      },
      "likeCount": 1420,
      "caption": "Sunset in Goa 🌅"
    }
  ],
  "nextCursor": "post_abc100"
}`,
          notes: "Cursor-based pagination. Feed is pre-computed in Redis for active users.",
        },
      ],
      trap: {
        title: "Never store binary data in your database",
        content: `The most common junior mistake: storing photos as BLOB columns in MySQL.

500M photos/day × 4MB = 2PB per day in your database.
Query performance collapses. Backup times are measured in weeks.
Horizontal scaling becomes impossible.

The correct pattern:
1. Get presigned S3 URL → client uploads directly to S3
2. S3 stores the binary, returns an object key
3. Database only stores the S3 key: "s3://instagram-photos/2024/01/abc.jpg"
4. All reads go through CDN — S3 is just the origin

This pattern is the same for photos, videos, audio, PDFs — any binary data.
The database stores metadata and keys. S3 stores the bytes.`,
      },
    },
    {
      type: "interactive",
      sectionId: "deepDive",
      step: "Step 4 — Deep Dive",
      title: "Core Instagram Concepts",
      subtitle:
        "Three concepts that cover photo delivery, social feed, and high-volume counters.",
      interaction: {
        type: "flashcard-deck",
        title: "Instagram Deep Dive",
        cards: [
          {
            id: "dc1",
            front: {
              label: "CONCEPT 1",
              title: "Image Processing Pipeline",
              subtitle: "Why one upload becomes 6 files",
              tag: "Architecture",
            },
            back: {
              explanation:
                "A single uploaded photo must become multiple resolution variants for different device types and network conditions. This processing happens asynchronously after the S3 upload, triggered by an S3 event notification.",
              code: `// S3 event triggers image processor lambda
async function processUpload(s3Event) {
  const { key } = s3Event.Records[0].s3.object
  const rawPhoto = await s3.getObject({ Key: key })

  const variants = [
    { suffix: 't', size: 150,  quality: 80 },   // thumbnail
    { suffix: 'f', size: 640,  quality: 85 },   // feed view
    { suffix: 'l', size: 1080, quality: 90 },   // full view
    { suffix: 'h', size: 1080, quality: 95 },   // high quality
  ]

  await Promise.all(variants.map(async (v) => {
    const processed = await sharp(rawPhoto)
      .resize(v.size, v.size, { fit: 'cover' })
      .jpeg({ quality: v.quality })
      .toBuffer()

    const outputKey = key.replace('/raw/', \`/\${v.suffix}/\`)
    await s3.putObject({ Key: outputKey, Body: processed })
  }))

  // Notify post service: photos are ready
  await sqs.sendMessage({ MessageBody: JSON.stringify({ postId, variants }) })
}`,
              proTip:
                "Processing is parallelized — all 4 variants generate simultaneously using Promise.all. The 4K original is never served to users; it's kept for potential future re-processing (e.g., if you add a new size format). Storage cost for originals is worth the flexibility.",
            },
          },
          {
            id: "dc2",
            front: {
              label: "CONCEPT 2",
              title: "CDN Immutability Advantage",
              subtitle: "Why Instagram's CDN hit rate exceeds 95%",
              tag: "Performance",
            },
            back: {
              explanation:
                "Photos on Instagram are immutable — once posted, they never change. This makes them perfect for aggressive CDN caching with infinite TTL. A photo cached in New York CDN stays cached forever — no cache invalidation problem.",
              code: `// Cache-Control header on all photo uploads to S3
const headers = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  // max-age = 1 year; 'immutable' tells browser: don't revalidate
  'Content-Type': 'image/jpeg',
}

// CDN configuration (CloudFront example):
{
  "DefaultCacheBehavior": {
    "CachePolicyId": "long-term-immutable",
    "TTL": { "DefaultTTL": 31536000, "MaxTTL": 31536000 },
    "Compress": true
  }
}

// Result: after first request, photo is cached at CDN edge forever.
// 1B daily photo views × 95% CDN hit rate = only 50M origin requests/day
// vs 1B requests hitting S3 directly`,
              proTip:
                "Immutability + CDN is the most powerful performance combination in web systems. Instagram leverages this: photos never change, so they can be cached indefinitely at edge nodes worldwide. The content hash in the URL ensures cache busting is never needed — new post = new URL.",
            },
          },
          {
            id: "dc3",
            front: {
              label: "CONCEPT 3",
              title: "Like Counter at Kylie Scale",
              subtitle: "15 million likes in 24 hours without hot row lock contention",
              tag: "Scale",
            },
            back: {
              explanation:
                "Direct SQL increments for every like collapse at 2,300 likes/second peak. The solution: write likes to Kafka immediately, batch-aggregate counts periodically, do one SQL UPDATE per batch window.",
              code: `// BAD: direct SQL increment for every like
await db.query(
  'UPDATE posts SET like_count = like_count + 1 WHERE id = ?',
  [postId]
)
// Row-level lock on this row. At 2,300/sec: permanent lock queue.

// GOOD: Kafka buffering + batch aggregation
// 1. Write like event to Kafka (no DB write)
await kafka.produce('like_events', {
  postId: 'post_kylie_xyz',
  userId: 'user_fan_123',
  timestamp: Date.now()
})

// 2. Batch consumer runs every 30 seconds:
const likeEvents = await kafka.consume('like_events', {
  maxWait: 30_000,  // 30 seconds
  maxMessages: 100_000
})

const countsByPost = groupBy(likeEvents, e => e.postId)
  .map(([postId, events]) => ({ postId, count: events.length }))

// 3. One UPDATE per post per 30 seconds (not per like)
await db.batchUpdate(
  'UPDATE posts SET like_count = like_count + ? WHERE id = ?',
  countsByPost.map(({ postId, count }) => [count, postId])
)`,
              proTip:
                "The 30-second batch window means like counts are eventually consistent by ~30 seconds. Users don't notice — Kylie's post shows '14,999,892 likes' vs '15,000,000 likes' in real-time and nobody cares. Instagram displays approximate like counts for very popular posts anyway.",
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
      subtitle: "Instagram tradeoffs involve both product quality and infrastructure cost.",
      interaction: {
        type: "tradeoff-picker",
        scenarios: [
          {
            id: "t1",
            scenario: "Should photos be served via S3 directly or through a CDN?",
            context:
              "S3 is cheaper per GB. CDN has edge nodes. 1B photo views per day, globally distributed users.",
            options: [
              {
                id: "a",
                label: "CDN — serve from 200+ global edge nodes",
                correct: true,
                consequence:
                  "Photos served from the nearest edge node. New York user gets Mumbai photo in 5ms from NY CDN, not 200ms from Mumbai S3. 95% cache hit rate means S3 handles only 50M requests/day. CDN cost is justified by latency improvement.",
              },
              {
                id: "b",
                label: "S3 directly — cheaper and simpler without CDN overhead",
                correct: false,
                consequence:
                  "Every request hits S3 origin. 1B requests/day × latency from wherever the S3 region is. Global users get terrible photo load times. S3 isn't designed for high-concurrency consumer serving. Not viable.",
              },
            ],
            seniorNote:
              "CDN is mandatory for any consumer-facing media product with global users. The cost calculation: CDN edge serving costs more per GB than S3, but eliminates the need for massive S3 origin capacity to handle 1B daily requests. And the user experience improvement (5ms vs 200ms latency) is non-negotiable at Instagram's scale.",
          },
          {
            id: "t2",
            scenario: "How do you handle the image processing pipeline failing for a batch of uploads?",
            context:
              "50,000 photos uploaded between 9-9:05 PM. Image processing worker crashes. Photos are stored raw in S3 but not resized.",
            options: [
              {
                id: "a",
                label: "S3 event → SQS dead letter queue → retry processing on recovery",
                correct: true,
                consequence:
                  "S3 events go to SQS queue. Failed processing messages go to a dead letter queue (DLQ). On worker recovery, DLQ messages are retried. Photos process eventually. Users see their posts after recovery — not an error.",
              },
              {
                id: "b",
                label: "Return an error to the user on upload if processing fails",
                correct: false,
                consequence:
                  "Processing is async — it happens after the upload is already in S3. There's no synchronous failure to return. And making upload UX dependent on processing availability couples two independent systems.",
              },
            ],
            seniorNote:
              "Async pipelines must use durable queues (SQS, not in-memory). Processing failures are recoverable — the raw photo is safe in S3. The DLQ pattern ensures no upload is permanently lost due to a transient worker failure. This is why you decouple upload (S3) from processing (worker queue) — failures in one don't affect the other.",
          },
        ],
      },
    },
    {
      type: "cheatSheet",
      components:
        "Upload → S3 (presigned URL) → Image Processor → CDN | Post → Fanout → Redis feeds | Likes → Kafka → Batch → DB",
      numbers: [
        { label: "Photos uploaded/day", value: "500M" },
        { label: "Raw storage/day", value: "~2 petabytes" },
        { label: "Upload QPS", value: "~5,800/sec avg, 20K/sec peak" },
        { label: "Photo views/day", value: "1 billion" },
        { label: "CDN cache hit rate", value: "~95%" },
        { label: "Peak like rate (viral post)", value: "~2,300 likes/sec" },
      ],
      decisions: [
        {
          decision: "Presigned S3 URLs for upload",
          why: "API server never handles binary — clients upload 4MB directly to S3",
        },
        {
          decision: "Async image processing via SQS",
          why: "S3 upload decoupled from resizing; failures retried via dead letter queue",
        },
        {
          decision: "CDN for photo delivery",
          why: "Photos are immutable — 95% CDN hit rate; global users get <50ms latency",
        },
        {
          decision: "Hybrid fan-out (push regular, pull celebrity)",
          why: "400M-follower accounts make pure fan-out on write unsustainable",
        },
        {
          decision: "Kafka + batch aggregation for like counts",
          why: "Prevents hot row contention on viral posts; 2,300 likes/sec → 1 DB write per 30 seconds",
        },
      ],
    },
  ],
};
