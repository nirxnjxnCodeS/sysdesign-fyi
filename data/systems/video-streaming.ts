export const videoStreaming = {
  id: "video-streaming",
  title: "Video Streaming",
  scenario:
    "You just joined as the first streaming engineer at an OTT startup. You have 5 million subscribers and a Bollywood studio about to drop their biggest film. Release night is in 72 hours. Right now, video is served as a single file from one S3 bucket. Three people watching simultaneously brought the server down last week. Build it before the world shows up.",
  decisions: [
    {
      id: 1,
      question:
        "Your server currently serves the entire MP4 file when a user clicks play. A 2-hour film is 8GB. The user starts watching in 3 minutes. What's wrong with this approach?",
      context:
        "5 million users hit play at 9 PM. Each needs to download 8GB before playback starts. Your server has a 40Gbps uplink.",
      options: [
        {
          id: "a",
          text: "Increase server bandwidth — buy more uplink capacity",
          correct: false,
          consequence:
            "5M × 8GB = 40 petabytes to transfer on release night. No server on earth has enough uplink. And users wait 3 minutes just to start watching.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Split video into small chunks — serve only what the user is about to watch",
          correct: true,
          consequence:
            "User gets chunk 1 (10 seconds). Playback starts in 1 second. While they watch chunk 1, chunk 2 downloads. Server only ever sends the next few seconds.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Use progressive download — start playing before full download completes",
          correct: false,
          consequence:
            "Still downloading the full 8GB in order. If the user skips to minute 90, they must download all 90 minutes first. 5M simultaneous progressive downloads = bandwidth collapse.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Chunked streaming — video is split into small segments (2-10 seconds each). The client downloads a manifest file listing all chunks, then fetches them sequentially as playback progresses. HLS (HTTP Live Streaming) and DASH both use this model. Only the chunks being watched consume bandwidth. Seeking jumps to a specific chunk — no linear download required.",
    },
    {
      id: 2,
      question:
        "Your subscribers are on everything — a 5G iPhone, a 2Mbps rural connection, a 4K OLED TV, and a 2013 laptop. The film is 8GB at 4K. How do you serve everyone?",
      context:
        "One quality level means 4K buffers on 2Mbps connections. SD quality insults 4K TV owners. You need one system that handles all.",
      options: [
        {
          id: "a",
          text: "Serve 4K to everyone — best quality is best experience",
          correct: false,
          consequence:
            "User on 2Mbps tries to stream 4K (15Mbps required). Buffer fills in 2 seconds. Video stalls every 10 seconds. They give up and call customer support.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Ask users to select quality manually (360p / 720p / 1080p / 4K)",
          correct: false,
          consequence:
            "At peak traffic, a user picks 1080p. Network degrades. Video stalls. They manually switch to 720p — too late, they already left a 2-star review.",
          consequenceType: "failure",
        },
        {
          id: "c",
          text: "Adaptive Bitrate (ABR) — encode multiple quality levels, client switches automatically",
          correct: true,
          consequence:
            "Video exists as 360p, 720p, 1080p, 4K chunks. Client measures bandwidth every 2 seconds. Fast connection? Upgrade to 4K. Slow? Drop to 720p seamlessly. No stalls.",
          consequenceType: "success",
        },
      ],
      learning:
        "Adaptive Bitrate Streaming — the video is encoded at multiple bitrates (e.g., 400Kbps, 1.5Mbps, 4Mbps, 15Mbps). The manifest lists all versions. The client's ABR algorithm monitors download speed and buffer depth, switching to a higher or lower quality level mid-stream without interruption. Netflix, YouTube, and every major OTT platform use HLS or DASH with ABR.",
    },
    {
      id: 3,
      question:
        "Your server is in Mumbai. A user in London clicks play. The chunks travel 7,000 km. Every HTTP request takes 140ms round-trip just from physics. How do you fix latency for global users?",
      context:
        "10 seconds of buffering before playback = 37% of users give up (Netflix data). Physics limits your Mumbai server.",
      options: [
        {
          id: "a",
          text: "Replicate the server to London, Frankfurt, Singapore",
          correct: false,
          consequence:
            "Maintaining 4 full video servers, each with a copy of your entire library, costs ₹4 crore/month. And you need to keep them in sync for every new upload.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "CDN — serve chunks from edge nodes closest to each user",
          correct: true,
          consequence:
            "London user requests a chunk. CDN edge in Frankfurt (200km away) has it cached. 4ms round-trip instead of 140ms. Playback starts in 0.8 seconds.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Pre-download the video to users' devices the night before",
          correct: false,
          consequence:
            "Your app downloads 8GB overnight. User has 64GB phone with 2GB free. Most users disable 'offline downloads'. And live sports still doesn't work.",
          consequenceType: "failure",
        },
      ],
      learning:
        "CDN (Content Delivery Network) — a global network of edge servers (Cloudflare, Akamai, AWS CloudFront) that cache your video chunks close to users. First request for a chunk misses the CDN (origin fetch from S3). Every subsequent request for that chunk serves from the edge. For popular content, 99%+ of requests are cache hits — origin barely sees traffic.",
    },
    {
      id: 4,
      question:
        "A filmmaker uploads a raw 4K ProRes video (200GB). In 30 minutes, 5 million users must be able to stream it at 360p, 720p, 1080p, and 4K. What's the pipeline?",
      context:
        "Raw footage is uncompressed, incompatible with browsers, and 200GB. You need compressed, chunked, multi-quality output in 30 minutes.",
      options: [
        {
          id: "a",
          text: "Transcode on the web server that receives the upload",
          correct: false,
          consequence:
            "Transcoding 200GB of ProRes to 4 quality levels takes 6 hours on a single server, pegging CPU at 100%. While transcoding, the web server can't serve users.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Dedicated encoding pipeline: upload → raw S3 → encoding workers → transcoded S3 → CDN",
          correct: true,
          consequence:
            "File lands in raw S3. 50 encoding workers split the video into scenes and transcode in parallel. All qualities ready in 18 minutes. Pushed to CDN. Users stream.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Transcode at stream time — encode each quality when a user requests it",
          correct: false,
          consequence:
            "First 1080p request triggers transcoding — takes 10 minutes. User waits. While transcoding, 100,000 users request 1080p simultaneously. Server melts.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Async encoding pipeline — upload triggers an event (S3 → SQS → encoding workers). Workers use FFmpeg to transcode to multiple bitrates in parallel, splitting into chunks. Output goes to a separate S3 bucket. CDN origins from this output bucket. The web server that accepted the upload is never involved in encoding. Separation of concerns at infrastructure level.",
    },
    {
      id: 5,
      question:
        "A user is watching on a 50Mbps fiber connection. The video is playing at 4K. Midway through the film, they switch to mobile hotspot — suddenly only 3Mbps available. What should happen?",
      context:
        "4K requires 15Mbps. 3Mbps can only sustain 720p. The switch happened silently — the app didn't know until the buffer started draining.",
      options: [
        {
          id: "a",
          text: "Keep serving 4K chunks — the user chose 4K quality",
          correct: false,
          consequence:
            "Buffer holds 10 seconds of 4K. Drains in 10 seconds. Video freezes mid-scene. User sees the spinning wheel. 1-star review: 'App keeps buffering'.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Pause and ask the user to pick a lower quality",
          correct: false,
          consequence:
            "Video pauses during a tense scene. 'Your network is slow. Please select quality.' User is frustrated. They selected 'auto' for a reason.",
          consequenceType: "failure",
        },
        {
          id: "c",
          text: "ABR algorithm detects bandwidth drop and switches quality mid-stream",
          correct: true,
          consequence:
            "Buffer health drops below 5 seconds. ABR switches next chunk request to 720p. Playback continues without interruption. User might not even notice the quality shift.",
          consequenceType: "success",
        },
      ],
      learning:
        "ABR quality switching — the client's ABR algorithm continuously measures two signals: (1) throughput of the last N chunk downloads, (2) current buffer depth. When buffer falls below a threshold, it preemptively requests a lower-quality chunk. The transition is seamless because the chunk boundary is a natural cut point. Netflix's BOLA algorithm and buffer-based rate adaptation are the industry standard implementations.",
    },
  ],
  finalArchitecture:
    "Upload → Raw S3 → Encoding Workers (FFmpeg) → Transcoded S3 → CDN Edge → Client (HLS/DASH + ABR)",
  score: {
    perfect: "5M users, zero buffering. The studio calls to say thank you.",
    good: "Smooth for most. London users still notice the lag.",
    average: "It streams. 4K users are disappointed. Rural users gave up.",
    poor: "Server crashed at 9:01 PM. Release night became a PR disaster.",
  },
};
