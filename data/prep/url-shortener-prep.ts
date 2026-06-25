import type { PrepData } from "./types";

export const urlShortenerPrep: PrepData = {
  systemId: "url-shortener",
  systemName: "URL Shortener",
  sections: [
    // ── Section 1: Requirements (interactive) ────────────────────────────────
    {
      type: "interactive",
      sectionId: "requirements",
      step: "Step 1 — Requirements",
      title: "Sort the Requirements",
      subtitle:
        "Drag each item into the correct bucket. Interviewers test whether you know the difference between functional and non-functional.",
      interaction: {
        type: "requirements-sort",
        buckets: [
          {
            id: "functional",
            label: "Functional",
            description: "What the system does",
          },
          {
            id: "non-functional",
            label: "Non-Functional",
            description: "How well it performs",
          },
          {
            id: "out-of-scope",
            label: "Out of Scope",
            description: "Not in this design",
          },
        ],
        items: [
          {
            id: "r1",
            text: "Shorten a long URL → return a unique short code",
            correctBucket: "functional",
            explanation:
              "Core feature — it's the primary action the system must perform.",
          },
          {
            id: "r2",
            text: "99.99% uptime — redirects must never fail",
            correctBucket: "non-functional",
            explanation:
              "This is an availability SLA — a performance characteristic, not a feature.",
          },
          {
            id: "r3",
            text: "Redirect short URL to original URL",
            correctBucket: "functional",
            explanation: "The system's primary read operation — it must DO this.",
          },
          {
            id: "r4",
            text: "Redirect in under 10ms latency",
            correctBucket: "non-functional",
            explanation: "Latency is a non-functional (performance) requirement.",
          },
          {
            id: "r5",
            text: "User authentication and login",
            correctBucket: "out-of-scope",
            explanation:
              "Most URL shorteners allow anonymous creation. Explicitly out of scope for this design.",
          },
          {
            id: "r6",
            text: "Support custom aliases (e.g. sysdesign.fyi/my-brand)",
            correctBucket: "functional",
            explanation:
              "A distinct feature the system may or may not support — but if asked, it's functional.",
          },
          {
            id: "r7",
            text: "Handle 100M new URLs created per day",
            correctBucket: "non-functional",
            explanation:
              "Scale and throughput are non-functional requirements — they constrain HOW the system performs.",
          },
          {
            id: "r8",
            text: "Real-time analytics dashboard",
            correctBucket: "out-of-scope",
            explanation:
              "A dashboard is a full product feature. Click counting may be in scope, but a full dashboard is not.",
          },
        ],
      },
    },

    // ── Section 2: Estimation (interactive) ──────────────────────────────────
    {
      type: "interactive",
      sectionId: "estimation",
      step: "Step 2 — Estimation",
      title: "Work Through the Math",
      subtitle:
        "Fill in the blank cells. Within ±10% is accepted — you're showing reasoning, not memorised answers.",
      interaction: {
        type: "estimation-calculator",
        insight: `This math drives every architecture decision:
→ 91TB rules out a single SQL node — you need NoSQL sharding
→ 115,000 reads/sec would destroy an unprotected DB — Redis cache is non-negotiable
→ 200,000 peak req/sec requires multiple app servers behind a load balancer
Always do the math before drawing boxes.`,
        steps: [
          {
            id: "daily-creates",
            label: "New URLs per day",
            formula: "given assumption",
            answer: 100_000_000,
            unit: "URLs/day",
            userInput: false,
            hint: "",
            explanation: "This is our starting assumption.",
          },
          {
            id: "write-qps",
            label: "Write QPS",
            formula: "100M ÷ 86,400 =",
            answer: 1160,
            unit: "writes/sec",
            userInput: true,
            hint: "There are 86,400 seconds in a day. Divide 100M by that.",
            explanation:
              "100,000,000 ÷ 86,400 ≈ 1,157 — round to ~1,160 writes/sec.",
          },
          {
            id: "daily-reads",
            label: "Daily redirects (100:1 ratio)",
            formula: "100M × 100 =",
            answer: 10_000_000_000,
            unit: "redirects/day",
            userInput: false,
            hint: "",
            explanation: "100:1 read/write ratio means 10 billion reads per day.",
          },
          {
            id: "read-qps",
            label: "Read QPS (avg)",
            formula: "10B ÷ 86,400 =",
            answer: 115_740,
            unit: "reads/sec",
            userInput: true,
            hint: "Divide 10 billion by 86,400 seconds in a day.",
            explanation: "10,000,000,000 ÷ 86,400 ≈ 115,740 reads/sec average.",
          },
          {
            id: "storage",
            label: "Storage (5 years)",
            formula: "100M × 365 × 5 × 500B =",
            answer: 91_250_000_000_000,
            unit: "bytes (~91 TB)",
            userInput: true,
            hint: "100M URLs/day × 1825 days × 500 bytes each. Express in terabytes.",
            explanation:
              "182.5B URLs × 500B each ≈ 91.25 TB. This rules out a single SQL instance.",
          },
        ],
      },
    },

    // ── Section 3: API Design (static) ───────────────────────────────────────
    {
      type: "apiDesign",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/urls",
          description: "Create a new short URL",
          requestBody: `{
  "longUrl": "https://amazon.in/very/long/product/url",
  "customAlias": "my-product",    // optional
  "expiresAt": "2025-12-31"       // optional
}`,
          response: `// 201 Created
{
  "shortCode": "x7k2p",
  "shortUrl": "https://sysdesign.fyi/x7k2p",
  "longUrl": "https://amazon.in/very/long/product/url",
  "createdAt": "2024-01-15T10:00:00Z"
}`,
          errors: "400 (invalid URL format), 409 (custom alias already taken)",
        },
        {
          method: "GET",
          path: "/{shortCode}",
          description: "Redirect to the original URL",
          response: `// 301 Permanent Redirect  (or 302 if analytics enabled)
Location: https://amazon.in/very/long/product/url`,
          notes:
            "301 = permanent → browsers cache it, less server load, but kills analytics\n302 = temporary → every click hits your server, perfect for click tracking",
        },
        {
          method: "GET",
          path: "/api/v1/urls/{shortCode}/stats",
          description: "Get click analytics (only if analytics is in scope)",
          response: `// 200 OK
{
  "shortCode": "x7k2p",
  "clickCount": 14892,
  "createdAt": "2024-01-15T10:00:00Z",
  "lastClickedAt": "2024-01-20T15:30:00Z"
}`,
        },
      ],
      trap: {
        title: "301 vs 302 — the classic trap question",
        content: `301 = Permanent redirect. Browser caches it — subsequent clicks never hit your servers. Less load, but you lose click analytics entirely (browser never calls you again).

302 = Temporary redirect. Every single click hits your server. Perfect for tracking analytics. But higher server load at scale.

The right answer: "It depends on requirements." Ask: "Is click analytics in scope?" That answer decides which status code to use. This is exactly the kind of trade-off question interviewers are testing.`,
      },
    },

    // ── Section 4: Deep Dive (interactive) ───────────────────────────────────
    {
      type: "interactive",
      sectionId: "deepDive",
      step: "Step 4 — Deep Dive",
      title: "Short Code Generation",
      subtitle:
        "Flip each card to understand the three approaches. Know all three — interviewers ask follow-ups on each.",
      interaction: {
        type: "flashcard-deck",
        title: "Short Code Generation — 3 approaches",
        cards: [
          {
            id: "c1",
            front: {
              label: "METHOD 1",
              title: "MD5 / SHA256 Hash",
              subtitle: "Hash the long URL, take the first 6 characters",
              tag: "Avoid",
            },
            back: {
              explanation:
                "Take the full long URL, run MD5 or SHA256 on it, then take the first 6 characters of the hex output as the short code.",
              code: `shortCode = md5(longUrl).substring(0, 6)\n// e.g. md5("https://amazon.in/...") = "a3f9b2..."`,
              trap:
                "Two different URLs can hash to the same 6-character prefix — collision. Handling collisions requires re-hashing or appending counters, which adds complexity. Don't use this.",
            },
          },
          {
            id: "c2",
            front: {
              label: "METHOD 2",
              title: "Auto-increment + Base62",
              subtitle: "Convert a DB integer ID to a compact alphanumeric code",
              tag: "Recommended",
            },
            back: {
              explanation:
                "Every new URL gets an auto-incrementing integer from the database. Convert that integer to Base62 (a-z, A-Z, 0-9) to produce a compact short code.",
              code: `id = db.nextId()       // e.g. 1,000,000\ncode = toBase62(id)    // → "x7k2p"\n\n// 6 chars = 62^6 = 56.8 billion unique codes`,
              proTip:
                "62^6 = 56.8 billion unique codes. At 100M URLs/day, that's enough for 1,568 years. Safe to start with 6 chars.",
              trap:
                "Sequential IDs are predictable — a competitor can enumerate your URLs by incrementing. Use a shuffle or scrambler in the Base62 alphabet if privacy matters.",
            },
          },
          {
            id: "c3",
            front: {
              label: "METHOD 3",
              title: "Pre-generated Code Pool",
              subtitle: "Generate codes in advance, assign on demand",
              tag: "Advanced",
            },
            back: {
              explanation:
                "A background worker generates millions of random 6-char codes in advance and stores them in a 'code_pool' table. When a URL is created, the app atomically takes one code, marks it 'used', and assigns it.",
              code: `-- code_pool table\nid         BIGINT PRIMARY KEY\ncode       VARCHAR(8) UNIQUE NOT NULL\nstatus     ENUM('available', 'used')\n\n-- Atomic assignment\nUPDATE code_pool SET status='used'\nWHERE status='available' LIMIT 1\nRETURNING code;`,
              proTip:
                "Zero collision risk. No computation at request time. The pre-generation worker runs asynchronously. Used by large-scale URL shorteners like Bitly.",
            },
          },
          {
            id: "c4",
            front: {
              label: "DECISION",
              title: "Which to use?",
              subtitle: "The right choice depends on your priorities",
              tag: "Recommended",
            },
            back: {
              explanation:
                "For an interview: recommend Auto-increment + Base62. It's simple, collision-free, and easy to explain. Mention the pre-generation pool as the advanced alternative for production scale.",
              proTip:
                "When the interviewer asks follow-ups about collisions or enumeration attacks, you've already shown you know the trade-offs. That's the point.",
            },
          },
        ],
      },
    },

    // ── Section 5: Tradeoffs (interactive) ───────────────────────────────────
    {
      type: "interactive",
      sectionId: "tradeoffs",
      step: "Step 5 — Senior Tradeoffs",
      title: "Make the Calls",
      subtitle:
        "Pick an option for each scenario. Then read what a senior engineer adds.",
      interaction: {
        type: "tradeoff-picker",
        scenarios: [
          {
            id: "t1",
            scenario:
              "Your URL shortener needs to track how many times each short URL is clicked. Which redirect type do you use?",
            context:
              "Context: analytics is confirmed in scope. Scale: 100k redirects/sec.",
            options: [
              {
                id: "t1a",
                label: "301 Permanent Redirect",
                correct: false,
                consequence:
                  "Browsers cache 301s permanently. After the first click, the browser goes directly to the destination — your server never sees subsequent clicks. Analytics breaks entirely.",
              },
              {
                id: "t1b",
                label: "302 Temporary Redirect",
                correct: true,
                consequence:
                  "Every click passes through your server, so you can count it. Higher server load, but analytics works correctly.",
              },
            ],
            seniorNote:
              "The right answer is always 'it depends on requirements.' If analytics is in scope, 302 is the only viable choice. If you need to reduce server load and analytics isn't critical, 301 saves significant infrastructure cost.",
          },
          {
            id: "t2",
            scenario:
              "At 91TB over 5 years, which database do you choose for the primary URL store?",
            context:
              "Access pattern: 99% of queries are single-key lookups by short_code. No joins needed.",
            options: [
              {
                id: "t2a",
                label: "PostgreSQL with read replicas",
                correct: false,
                consequence:
                  "91TB won't fit in a single SQL instance. You'd need vertical scaling to the point of impracticality, and horizontal sharding of relational DBs is complex and operationally painful.",
              },
              {
                id: "t2b",
                label: "Cassandra or DynamoDB (NoSQL key-value)",
                correct: true,
                consequence:
                  "Short_code as the partition key gives O(1) lookups. Horizontal sharding across hundreds of nodes is Cassandra's core design. 91TB is routine.",
              },
            ],
            seniorNote:
              "The access pattern is pure key-value — there are no JOINs, no complex queries, no transactions needed. When the schema is this simple AND the data is this large, NoSQL wins clearly. Never use NoSQL just because it's trendy — use it when the access pattern fits.",
          },
          {
            id: "t3",
            scenario:
              "Two users simultaneously request the same custom alias 'nike'. How do you handle this?",
            context:
              "Your app servers are horizontally scaled — multiple instances are running.",
            options: [
              {
                id: "t3a",
                label: "Application-level lock: check if alias exists, then insert",
                correct: false,
                consequence:
                  "Race condition. Both servers check simultaneously, both see alias is free, both insert — one succeeds, one corrupts data or throws an unhandled error.",
              },
              {
                id: "t3b",
                label:
                  "Database UNIQUE constraint on short_code: first write wins, second gets a conflict error",
                correct: true,
                consequence:
                  "The DB enforces uniqueness atomically. First write succeeds. Second write gets a unique constraint violation — catch it, return 409 Conflict to the user. Clean, correct, and simple.",
              },
            ],
            seniorNote:
              "Always push uniqueness enforcement to the database, not the application layer. Application-level 'check then insert' is a TOCTOU (time-of-check time-of-use) race condition that manifests under load. The UNIQUE constraint is free insurance.",
          },
          {
            id: "t4",
            scenario:
              "A tweet with your short URL goes viral — 1M requests/sec hit a single Redis key. What do you do?",
            context: "Your Redis cache is otherwise healthy. This is a hot key problem.",
            options: [
              {
                id: "t4a",
                label: "Scale up the Redis instance — give it more memory and CPU",
                correct: false,
                consequence:
                  "Single-node Redis has throughput limits around 100k ops/sec. Vertical scaling won't get you to 1M/sec, and you still have a single point of contention.",
              },
              {
                id: "t4b",
                label:
                  "Replicate the hot key across multiple Redis nodes or use in-process LRU cache in app servers",
                correct: true,
                consequence:
                  "Distributing the hot key across N nodes divides the load by N. In-process caching is even better — the redirect never leaves the app server process for ultra-popular URLs.",
              },
            ],
            seniorNote:
              "The hot key problem is a classic interview follow-up. The solution is to spread the load: either replicate the key across multiple Redis nodes (all nodes serve reads for the hot key) or add an in-process LRU cache at the app layer so the Redis cluster isn't needed at all for ultra-viral URLs. Most candidates miss this.",
          },
        ],
      },
    },

    // ── Section 6: Cheat Sheet (static) ──────────────────────────────────────
    {
      type: "cheatSheet",
      components: "User → CDN → Load Balancer → App Servers → Redis Cache → NoSQL DB",
      numbers: [
        { label: "Write QPS", value: "~1,200/sec" },
        { label: "Read QPS (avg)", value: "~120,000/sec" },
        { label: "Read QPS (peak)", value: "~200,000/sec" },
        { label: "Storage (5yr)", value: "~91 TB" },
        { label: "Cache size", value: "~1 TB (LRU)" },
        { label: "Short code space", value: "56B unique (6-char Base62)" },
        { label: "CDN offload", value: "~95% of reads" },
      ],
      decisions: [
        {
          decision: "Base62 over hash",
          why: "No collision risk, deterministic, no extra lookup needed",
        },
        {
          decision: "NoSQL over SQL at scale",
          why: "91TB needs horizontal sharding; pure KV schema fits NoSQL perfectly",
        },
        {
          decision: "Redis LRU cache",
          why: "80/20 rule — cache 20% of URLs, serve 80% of traffic without touching DB",
        },
        {
          decision: "CDN for 301 redirects",
          why: "Eliminates server load entirely for popular URLs — the highest-value optimization",
        },
        {
          decision: "Multiple app servers",
          why: "200k req/sec at peak exceeds single-server capacity; stateless design enables horizontal scaling",
        },
        {
          decision: "302 if analytics needed",
          why: "Every click must hit your server to be counted; 301 breaks analytics",
        },
      ],
    },
  ],
};
