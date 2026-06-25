import type { PrepData } from "./types";

export const videoStreamingPrep: PrepData = {
  systemId: "video-streaming",
  systemName: "Video Streaming",
  sections: [
    {
      type: "interactive",
      sectionId: "requirements",
      step: "Step 1 — Requirements",
      title: "Sort the Requirements",
      subtitle:
        "Video streaming has both upload-side and playback-side requirements. Interviewers expect you to cover both.",
      interaction: {
        type: "requirements-sort",
        items: [
          {
            id: "r1",
            text: "Users can upload videos",
            correctBucket: "functional",
            explanation: "Upload is a core feature — the supply side of the platform.",
          },
          {
            id: "r2",
            text: "Video playback must start within 2 seconds of pressing play",
            correctBucket: "non-functional",
            explanation: "Startup latency target — a performance requirement.",
          },
          {
            id: "r3",
            text: "Stream video in multiple quality levels (240p to 4K)",
            correctBucket: "functional",
            explanation:
              "Multi-quality streaming is a functional capability the system provides.",
          },
          {
            id: "r4",
            text: "Support 500 million daily active viewers",
            correctBucket: "non-functional",
            explanation: "Scale requirement — DAU is a performance constraint.",
          },
          {
            id: "r5",
            text: "Live streaming",
            correctBucket: "out-of-scope",
            explanation:
              "Live streaming is a fundamentally different system from on-demand VOD — explicitly out of scope.",
          },
          {
            id: "r6",
            text: "Automatically adjust quality based on network speed",
            correctBucket: "functional",
            explanation: "Adaptive bitrate is a functional behavior the player exhibits.",
          },
          {
            id: "r7",
            text: "Zero video buffering for users on stable connections",
            correctBucket: "non-functional",
            explanation: "Buffering rate is a quality/reliability requirement.",
          },
          {
            id: "r8",
            text: "Content recommendation algorithm",
            correctBucket: "out-of-scope",
            explanation:
              "Recommendation ML is a separate system — out of scope for this design.",
          },
          {
            id: "r9",
            text: "Global delivery with low latency in every country",
            correctBucket: "non-functional",
            explanation:
              "Geographic latency requirement — a performance constraint requiring CDN.",
          },
          {
            id: "r10",
            text: "Users can search for videos",
            correctBucket: "functional",
            explanation: "Search is a functional capability users need.",
          },
        ],
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
      },
    },
    {
      type: "interactive",
      sectionId: "estimation",
      step: "Step 2 — Estimation",
      title: "Work Through the Math",
      subtitle:
        "Video streaming is massively bandwidth-heavy. These numbers explain why CDN is non-negotiable.",
      interaction: {
        type: "estimation-calculator",
        steps: [
          {
            id: "e1",
            label: "Daily active viewers",
            formula: "Given assumption",
            answer: 500000000,
            unit: "DAU",
            userInput: false,
            hint: "",
            explanation: "500M DAU — YouTube scale.",
          },
          {
            id: "e2",
            label: "Average watch time per user per day",
            formula: "Given assumption",
            answer: 30,
            unit: "minutes/day",
            userInput: false,
            hint: "",
            explanation:
              "30 minutes/day average — people watch multiple videos.",
          },
          {
            id: "e3",
            label: "Average video bitrate (1080p)",
            formula: "Given assumption",
            answer: 5,
            unit: "Mbps",
            userInput: false,
            hint: "",
            explanation: "1080p at ~5 Mbps is Netflix's standard streaming bitrate.",
          },
          {
            id: "e4",
            label: "Total bandwidth needed",
            formula: "500M × 5 Mbps (if all simultaneous)",
            answer: 2500000000,
            unit: "Mbps (if all watch at once)",
            userInput: true,
            hint: "Multiply DAU by bitrate (worst case: all watching simultaneously)",
            explanation:
              "2.5 billion Mbps = 2.5 Petabits/sec in the extreme case. Even at 10% concurrency, that's 250 Tbps. No single server farm handles this — CDN is mandatory.",
          },
          {
            id: "e5",
            label: "Storage for 1 hour of video uploaded per second",
            formula: "1 hour × 3600 seconds × 5 Mbps ÷ 8 bits",
            answer: 2250,
            unit: "MB per hour of video at 1080p",
            userInput: true,
            hint: "Convert 1 hour of 5 Mbps video to megabytes: 5 Mbps × 3600 seconds ÷ 8",
            explanation:
              "~2.25 GB per hour of 1080p video. Multiply by 5 quality levels (240p to 4K) = ~8 GB stored per hour of uploaded video.",
          },
          {
            id: "e6",
            label: "Storage for 500 hours uploaded per minute (YouTube scale)",
            formula: "500 × 8 GB × 60 minutes/hr",
            answer: 240000,
            unit: "GB/hour (240 TB/hour)",
            userInput: true,
            hint: "500 hours/minute × 8GB/hour × 60 minutes",
            explanation:
              "240 TB of new video storage per hour. This is why YouTube uses Google's global storage infrastructure and aggressive compression.",
          },
        ],
        insight:
          "The bandwidth number (250 Tbps at 10% concurrency) makes the CDN architecture obvious — you can't serve this from data centers alone. CDN nodes distributed globally serve 95%+ of all video bytes. The storage number (240 TB/hour) explains why encoding efficiency matters enormously — every percentage of compression saved translates to petabytes.",
      },
    },
    {
      type: "apiDesign",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/videos/upload",
          description: "Initiate video upload — returns a signed upload URL",
          requestBody: `{
  "title": "My Video",
  "description": "...",
  "fileSize": 2147483648,    // bytes (2GB)
  "mimeType": "video/mp4"
}`,
          response: `// 200 OK — signed S3 URL for direct upload
{
  "videoId": "vid_abc123",
  "uploadUrl": "https://s3.amazonaws.com/bucket/vid_abc123?X-Amz-Signature=...",
  "expiresAt": "2024-01-15T11:00:00Z"  // URL expires in 1 hour
}
// Client uploads directly to S3 using uploadUrl
// Server is not in the upload path — S3 handles the bytes`,
          notes:
            "Presigned URL pattern — client uploads directly to S3, not through your server. Eliminates server bandwidth cost for large uploads.",
        },
        {
          method: "GET",
          path: "/api/v1/videos/{videoId}/manifest",
          description: "Get HLS/DASH manifest for video player",
          response: `// 200 OK — HLS manifest
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=426x240
https://cdn.example.com/vid_abc123/240p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
https://cdn.example.com/vid_abc123/480p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
https://cdn.example.com/vid_abc123/720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
https://cdn.example.com/vid_abc123/1080p/index.m3u8`,
          notes:
            "HLS manifest lists all quality variants. Video player picks appropriate quality based on bandwidth. CDN URLs — not origin server.",
        },
      ],
      trap: {
        title: "Never route video bytes through your application server",
        content: `Application servers handle API logic. They should never be in the path of video byte delivery.
Upload: Client → S3 directly via presigned URL (server just generates the URL)
Playback: Client → CDN directly via manifest URL (server just provides the manifest)
If your design has video bytes flowing through your app servers, you've made a critical mistake.
At 250 Tbps, routing through app servers would require millions of servers. CDN handles it with distributed edge nodes.`,
      },
    },
    {
      type: "interactive",
      sectionId: "deepDive",
      step: "Step 4 — Deep Dive",
      title: "Core Video Streaming Concepts",
      subtitle: "These are the concepts that make Netflix feel fast everywhere in the world.",
      interaction: {
        type: "flashcard-deck",
        title: "Video Streaming Deep Dive",
        cards: [
          {
            id: "dc1",
            front: {
              label: "CONCEPT 1",
              title: "Video Chunking",
              subtitle: "Split video into 2-10 second segments for streaming",
              tag: "Foundation",
            },
            back: {
              explanation:
                "A 2GB movie file can't stream — the user would wait hours for it to download. Split it into 4-10 second chunks. The player downloads chunk 1, starts playing immediately, downloads chunk 2 in the background. Playback starts after just the first chunk.",
              code: `// FFmpeg chunking command
ffmpeg -i input.mp4 \\
  -c:v libx264 -crf 23 \\
  -hls_time 6 \\           // 6-second chunks
  -hls_list_size 0 \\      // keep all chunks in manifest
  -f hls \\                // HLS format
  output.m3u8             // manifest + chunk files

// Output files:
// output.m3u8         — manifest (list of chunks)
// output000.ts        — chunk 0: seconds 0-6
// output001.ts        — chunk 1: seconds 6-12
// output002.ts        — chunk 2: seconds 12-18
// ...`,
              proTip:
                "6-second chunks are the Netflix/YouTube standard. Too short = too many HTTP requests. Too long = slow startup and large quality switches.",
            },
          },
          {
            id: "dc2",
            front: {
              label: "CONCEPT 2",
              title: "Adaptive Bitrate (ABR)",
              subtitle: "Automatically switch quality based on network speed",
              tag: "Critical",
            },
            back: {
              explanation:
                "Same video encoded at multiple quality levels (240p to 4K). The video player monitors download speed for each chunk. If the last chunk downloaded slowly — switch to lower quality for next chunk. If quickly — switch up. Users never buffer — they just see quality change.",
              code: `// Player ABR logic (simplified)
function selectQuality(availableBandwidth) {
  if (availableBandwidth > 10_000_000) return '4K'      // >10 Mbps
  if (availableBandwidth > 5_000_000)  return '1080p'   // >5 Mbps
  if (availableBandwidth > 2_000_000)  return '720p'    // >2 Mbps
  if (availableBandwidth > 800_000)    return '480p'    // >800 Kbps
  return '240p'                                          // <800 Kbps
}

// On each chunk completion:
const downloadedBytes = chunk.size
const downloadTime = chunk.endTime - chunk.startTime
const estimatedBandwidth = (downloadedBytes * 8) / downloadTime
const nextQuality = selectQuality(estimatedBandwidth)`,
              trap:
                "ABR switches happen between chunks, not mid-chunk. This is why chunk size matters — 6-second chunks mean quality switches happen at 6-second intervals, which users barely notice.",
            },
          },
          {
            id: "dc3",
            front: {
              label: "CONCEPT 3",
              title: "CDN Architecture",
              subtitle: "Pre-distribute video chunks to servers near every user",
              tag: "Scale",
            },
            back: {
              explanation:
                "A CDN is a network of servers in hundreds of cities worldwide. Before a video is publicly released, Netflix pre-loads its chunks to every CDN node globally. When a Mumbai user presses play, chunks come from the Mumbai CDN node at ~5ms latency, not from US servers at ~200ms.",
              code: `// Video publication pipeline
1. Creator uploads → S3 origin
2. Encoding service creates 5 quality versions
3. Each version split into 6-second chunks
4. CDN pre-warming: push popular content to all edge nodes
5. For new/unpopular content: serve from origin, cache on first request

// CDN cache hit (95% of requests):
User → CDN edge (Mumbai) → [cache hit] → Video chunk (5ms)

// CDN cache miss (5% of requests):
User → CDN edge → [cache miss] → S3 origin (200ms)
                → Cache chunk at edge for future requests`,
              proTip:
                "Netflix pre-fills CDN nodes during off-peak hours (2-4 AM) with content likely to be popular the next day. This is called 'proactive caching' and it's why Netflix starts instantly even for new releases.",
            },
          },
          {
            id: "dc4",
            front: {
              label: "CONCEPT 4",
              title: "Encoding Pipeline",
              subtitle: "Raw upload → 5 quality versions → CDN",
              tag: "Architecture",
            },
            back: {
              explanation:
                "Raw video (often 50-100GB for a movie) must be transcoded into multiple formats and qualities before streaming is possible. This is computationally expensive and must be done asynchronously — the user shouldn't wait for it.",
              code: `// Encoding pipeline (event-driven)
1. Upload complete → S3 event → SQS message
2. Encoding workers pick up job from SQS
3. FFmpeg transcodes to 5 qualities in parallel:
   - 240p:  400 Kbps video + 96 Kbps audio
   - 480p:  1.4 Mbps video + 128 Kbps audio
   - 720p:  2.8 Mbps video + 192 Kbps audio
   - 1080p: 5.0 Mbps video + 256 Kbps audio
   - 4K:    15-25 Mbps video + 512 Kbps audio
4. Each quality chunked into 6-second HLS segments
5. Chunks uploaded to S3
6. HLS manifest generated and stored
7. Video marked "READY" in database
8. CDN pre-warming triggered for popular content`,
              proTip:
                "Encoding is CPU-intensive. Netflix uses ~300,000 CPU cores for video encoding. Use spot/preemptible instances for cost savings — encoding jobs are fault-tolerant and can restart from checkpoints.",
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
      subtitle:
        "Video streaming tradeoffs involve significant cost implications. Think about scale.",
      interaction: {
        type: "tradeoff-picker",
        scenarios: [
          {
            id: "t1",
            scenario:
              "Should you store video files in your database or in object storage (S3)?",
            context:
              "A 2GB movie file needs to be stored and served to millions of users.",
            options: [
              {
                id: "a",
                label: "Database — everything in one place, easy to query",
                correct: false,
                consequence:
                  "A 2GB binary blob in a DB row makes every query that touches that table scan past 2GB of binary data. DB backups become enormous. No CDN integration. DB CPU wasted on I/O. Never store binary files in a database.",
              },
              {
                id: "b",
                label: "Object storage (S3) — store URL/key in DB, bytes in S3",
                correct: true,
                consequence:
                  "DB stores only metadata (title, S3 key, duration, status). S3 stores the actual bytes, served directly to CDN. Infinitely scalable, cheap ($0.023/GB), CDN-native. The DB stays fast and focused on structured data.",
              },
            ],
            seniorNote:
              "The rule: databases store structured data, object stores store blobs. Store the S3 key (a string like 'videos/vid_abc123/1080p/chunk001.ts') in the DB, not the video itself. This applies to any binary data: images, audio, documents.",
          },
          {
            id: "t2",
            scenario:
              "A user in rural India on 2G uploads a video. The encoding pipeline takes 30 minutes. How do you handle this?",
            context:
              "Video is uploaded but not yet processed. User expects to see their video available.",
            options: [
              {
                id: "a",
                label: "Block the upload API response until encoding completes",
                correct: false,
                consequence:
                  "30-minute blocking API call. Connection timeout. User has no idea if their upload succeeded. Terrible UX. Never block on long-running operations.",
              },
              {
                id: "b",
                label:
                  "Accept upload, return immediately, process async, notify when ready",
                correct: true,
                consequence:
                  "202 Accepted on upload. Video marked PROCESSING. Async encoding in background. Push notification/email when READY. User can leave the app. Clean, scalable, correct.",
              },
            ],
            seniorNote:
              "Async processing with status polling or push notification is the pattern for any operation taking more than 2 seconds. Upload → accept → process async → notify. This pattern appears in payments, document generation, ML inference, and encoding. Memorize it.",
          },
          {
            id: "t3",
            scenario:
              "How do you handle a video that suddenly goes viral — 10 million concurrent viewers after a celebrity shares it?",
            context:
              "The video was uploaded yesterday. CDN might not have it pre-cached on all nodes.",
            options: [
              {
                id: "a",
                label:
                  "Nothing special — CDN handles it automatically through cache miss then cache fill",
                correct: false,
                consequence:
                  "First request to each CDN node is a cache miss — hits S3 origin. With 10M viewers hitting 500+ CDN nodes simultaneously, that's potentially 500 simultaneous S3 requests for the same file. S3 can handle it, but origin load spikes.",
              },
              {
                id: "b",
                label:
                  "Detect viral trajectory early, proactively push to all CDN nodes before it trends",
                correct: true,
                consequence:
                  "Monitor view velocity. At 100k views/hour and climbing, trigger CDN pre-warming: push all video chunks to all edge nodes. By the time it hits 1M views, every CDN node has it cached. Zero origin requests at peak.",
              },
            ],
            seniorNote:
              "Viral content detection + proactive CDN warming is how Netflix handles major show releases and how YouTube handles viral videos. The monitoring system watches view velocity (views per minute) and triggers pre-warming when a video is accelerating. This is an operational pattern worth mentioning — it shows you think about emergent system behavior, not just steady-state.",
          },
        ],
      },
    },
    {
      type: "cheatSheet",
      components:
        "Upload: Client → S3 (presigned URL) → Encoding Pipeline → S3 chunks | Playback: Client → CDN → S3 (cache miss only)",
      numbers: [
        { label: "DAU", value: "500M viewers" },
        { label: "Bandwidth at 10% concurrency", value: "~250 Tbps" },
        { label: "Storage per hour of video", value: "~8 GB (all 5 qualities)" },
        { label: "New storage per hour (YouTube scale)", value: "~240 TB" },
        { label: "CDN cache hit rate target", value: ">95% of requests" },
        { label: "Playback startup target", value: "<2 seconds" },
      ],
      decisions: [
        {
          decision: "S3 for video storage",
          why: "Never store binary blobs in DB — S3 is infinitely scalable, CDN-native, cheap",
        },
        {
          decision: "CDN for delivery",
          why: "250 Tbps cannot be served from data centers — CDN edge nodes near every user",
        },
        {
          decision: "HLS chunking (6-second segments)",
          why: "Playback starts after first chunk; quality switches happen between chunks",
        },
        {
          decision: "Adaptive bitrate (ABR)",
          why: "Same video at 5 quality levels — player picks based on bandwidth, no buffering",
        },
        {
          decision: "Async encoding pipeline",
          why: "30+ minute encoding must not block the upload response — async with notification",
        },
      ],
    },
  ],
};
