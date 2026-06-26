export type ConceptCategory =
  | "Networking"
  | "Scalability"
  | "Storage"
  | "Messaging"
  | "Algorithms"
  | "Security";

export interface Concept {
  id: string;
  term: string;
  category: ConceptCategory;
  summary: string;
  full: string;
  appearsIn: string[];
}

export const categoryColors: Record<ConceptCategory, { bg: string; text: string; border: string }> = {
  Networking: {
    bg: "rgba(245, 158, 11, 0.08)",
    text: "#F59E0B",
    border: "rgba(245, 158, 11, 0.3)",
  },
  Scalability: {
    bg: "rgba(16, 185, 129, 0.08)",
    text: "#10B981",
    border: "rgba(16, 185, 129, 0.3)",
  },
  Storage: {
    bg: "rgba(6, 182, 212, 0.08)",
    text: "#06B6D4",
    border: "rgba(6, 182, 212, 0.3)",
  },
  Messaging: {
    bg: "rgba(167, 139, 250, 0.08)",
    text: "#A78BFA",
    border: "rgba(167, 139, 250, 0.3)",
  },
  Algorithms: {
    bg: "rgba(244, 63, 94, 0.08)",
    text: "#F43F5E",
    border: "rgba(244, 63, 94, 0.3)",
  },
  Security: {
    bg: "rgba(249, 115, 22, 0.08)",
    text: "#F97316",
    border: "rgba(249, 115, 22, 0.3)",
  },
};

export const concepts: Concept[] = [
  // ── NETWORKING ────────────────────────────────────────────────────────────
  {
    id: "client-server",
    term: "Client-Server Architecture",
    category: "Networking",
    summary: "Every app you've ever used runs on this — clients ask, servers answer",
    full: `Here's the thing nobody tells you: every single system design interview starts here, and most candidates skip past it too fast.

The model is simple. A client (your browser, your phone app) sends a request. A server receives it, does something, and sends back a response. That's it. But this simple pattern creates a fundamental constraint that shapes everything: the client is always the one who initiates. The server never reaches out unprompted — unless you add WebSockets, which is a whole different story.

Why does this matter in interviews? Because when your interviewer asks "how does the user get updated prices?" you need to know the difference between the client asking (polling) and the server pushing (WebSockets). Both start from understanding this model.

One more thing: servers are stateless by default. Each request is independent — the server doesn't remember your last request. This is actually a feature, not a bug. It's what allows you to add 10 more servers behind a load balancer and have any of them handle any request. State lives in a database, not in the server's memory.

Interview answer in one line: "Clients initiate requests, servers process and respond, and because servers are stateless, we can scale horizontally by adding more servers behind a load balancer."`,
    appearsIn: ["All systems"],
  },
  {
    id: "dns",
    term: "DNS (Domain Name System)",
    category: "Networking",
    summary: "The internet's phone book — turns 'google.com' into an IP address your computer can actually use",
    full: `You type google.com. Your browser has absolutely no idea where that is. So it asks DNS — and within milliseconds, it has an IP address like 142.250.80.46 that it can actually connect to.

Think of DNS like a contact list. You know your friend as "Rahul" but your phone needs their actual number to call them. DNS converts human-readable names to machine-readable IPs.

Here's the part that matters for system design: DNS has multiple caching layers. Your browser caches it. Your OS caches it. Your ISP's resolver caches it. Root nameservers sit at the top. Each level has a TTL (Time to Live) — a timer after which the cache expires and needs to be refreshed.

The TTL is a design decision with real consequences. Low TTL (60 seconds) = DNS changes propagate fast, but every minute someone is hitting a DNS server. High TTL (24 hours) = efficient, but if you change your server IP, some users will still be pointed at the old one for up to 24 hours.

This comes up in interviews two ways. First: "How does a client find your servers?" → DNS points to your load balancer's IP. Second: "How do you route users to the nearest data center?" → Geographic DNS routing (what Cloudflare does) — users in India get an IP pointing to an India server, users in the US get a US server IP. Same domain, different IPs based on where you are.`,
    appearsIn: ["URL Shortener", "Video Streaming", "All systems"],
  },
  {
    id: "http-https",
    term: "HTTP vs HTTPS",
    category: "Networking",
    summary: "HTTP sends your data as plain text. HTTPS encrypts it so nobody in between can read it.",
    full: `Imagine sending a postcard vs a sealed envelope. HTTP is a postcard — anyone who handles it on the way can read everything. HTTPS is a sealed envelope — only the sender and recipient can read it.

HTTP (HyperText Transfer Protocol) is the foundation of data communication on the web. Every time you visit a website, your browser and the server are speaking HTTP. But there's a problem: if you're on public WiFi and you submit a login form over HTTP, anyone on that network can intercept your password in plain text.

HTTPS fixes this with TLS (Transport Layer Security). Before any data is exchanged, your browser and the server do a TLS handshake: they agree on encryption keys, verify the server's identity via SSL certificate, and establish an encrypted channel. Everything after that is gibberish to anyone eavesdropping.

Here's the interview gotcha: what actually happens in a TLS handshake?
1. Client hello — "I support these encryption algorithms"
2. Server hello — "Let's use this one, here's my certificate"
3. Key exchange — client verifies the certificate, they agree on a symmetric session key using asymmetric crypto
4. Done — all further communication encrypted with that session key

Why symmetric after the key exchange? Because asymmetric encryption (RSA) is expensive. You use it just long enough to securely share a symmetric key, then switch to the faster symmetric encryption for everything else.

In 2024: every production system uses HTTPS. If your system design uses HTTP, your interviewer will notice.`,
    appearsIn: ["All systems"],
  },
  {
    id: "rest-graphql",
    term: "REST vs GraphQL",
    category: "Networking",
    summary: "REST gives you fixed menus. GraphQL lets you order exactly what you want.",
    full: `Here's the analogy that made this click for me: REST is like a restaurant with a fixed menu. You want a burger, you order the burger — you get the whole thing, whether you wanted the fries or not. GraphQL is like a custom order: "I want the patty, the top bun, and the cheese, but no fries and no bottom bun." You get exactly what you asked for, nothing more.

REST (Representational State Transfer) uses multiple fixed endpoints. GET /users/123 returns a user object — all of it, every field. GET /users/123/posts returns their posts. You might need to call three endpoints to render one screen.

GraphQL uses a single endpoint (/graphql) where the client sends a query specifying exactly which fields it needs. One request, exactly the right data.

So why doesn't everyone use GraphQL? Trade-offs:

REST wins when:
→ You need caching (GET requests cache naturally in browsers and CDNs; GraphQL's POST requests don't)
→ Your API is public (REST is what developers expect)
→ Your team is small and simplicity matters
→ You're building CRUD APIs with straightforward data needs

GraphQL wins when:
→ Mobile apps need bandwidth efficiency (don't send 40 fields when the app shows 5)
→ Your frontend is complex with many different views needing different data shapes
→ You have multiple frontend clients (web, iOS, Android) all needing different slices of the same data

GraphQL gotchas to mention in interviews: N+1 query problem (a query for 100 users might trigger 100 separate database queries for their posts — fix with DataLoader/batching), harder to cache, more complex server implementation.

The honest answer in interviews: "I'd use REST for its simplicity and cacheability unless we have a specific need for GraphQL's flexibility — and even then, I'd consider whether the added complexity is worth it."`,
    appearsIn: ["Chat System", "Payment System"],
  },
  {
    id: "websockets",
    term: "WebSockets",
    category: "Networking",
    summary: "A permanent phone call between browser and server — unlike HTTP which is a text message every time",
    full: `HTTP works like texting. You send a message, they reply, conversation over. For a web page, that's fine — you load the page, done.

But imagine building WhatsApp using texting. Every second, your app would send "any new messages?" and the server would reply "nope" or "yes, here they are." That's polling — and at scale with millions of users, it's a disaster.

WebSockets work like a phone call. You dial once (one HTTP handshake to upgrade the connection), and then both sides can speak at any time. The line stays open. The server can push a message to you the instant it arrives, without you asking for it.

This is how every real-time application works: WhatsApp, Slack, Zerodha's stock ticker, multiplayer games, live sports scores.

The technical flow:
1. Client sends an HTTP request with "Upgrade: websocket" header
2. Server responds with 101 Switching Protocols
3. The TCP connection stays open — now it's a WebSocket
4. Either side can send frames at any time
5. Connection closes when either side sends a close frame

When do you use WebSockets vs regular HTTP?
→ Data changes frequently AND users need it immediately → WebSockets
→ Data changes occasionally and a small delay is fine → Polling or Server-Sent Events
→ Data only flows one way (server→client) → Server-Sent Events (simpler than WebSockets)

The scale challenge: one server can hold ~50,000 WebSocket connections. With 10 million users, you need 200+ WebSocket servers. And if User A (Server 1) sends a message to User B (Server 7), you need a way to route between servers — usually Redis Pub/Sub.`,
    appearsIn: ["Chat System", "Stock Price Ticker"],
  },
  {
    id: "webhooks",
    term: "Webhooks",
    category: "Networking",
    summary: "Instead of you constantly asking 'did it happen yet?', the service calls YOU when it does",
    full: `You order a package. You have two options: refresh the tracking page every hour, or sign up for SMS notifications so they call you when it arrives.

Polling is the first approach. Webhooks are the second.

A webhook is just an HTTP callback. When something happens in System A, System A makes a POST request to a URL you gave it (your server's endpoint) with data about what happened. You receive the event, process it, done.

The classic example: Razorpay/Stripe payment. You don't want to poll "did the payment succeed?" every second. Instead, you give Razorpay a webhook URL like api.yourapp.com/webhooks/payment. When payment succeeds, Razorpay calls that URL with the payment details. You update your order status. Done.

The gotchas nobody mentions:
→ Your endpoint must be publicly accessible — webhooks from Razorpay can't reach localhost:3000
→ You must validate the webhook signature — anyone could POST to your webhook URL. Stripe signs every webhook request with a secret; you verify it before processing
→ Make your handler idempotent — webhook providers retry failed deliveries, so you might receive the same event multiple times. Process each unique event ID only once
→ Respond quickly (within 5 seconds) — if your handler is slow, the provider thinks it failed and retries

Webhooks vs Polling:
Polling: simple to implement, wastes resources checking when nothing has changed
Webhooks: efficient, real-time, but requires a publicly accessible endpoint and signature validation

Interview answer: "I'd use webhooks for event-driven integrations like payment callbacks because polling wastes resources. The key implementation details are signature validation to prevent spoofing and idempotent handlers to safely handle retries."`,
    appearsIn: ["Payment System", "Notification System"],
  },

  // ── SCALABILITY ────────────────────────────────────────────────────────────
  {
    id: "vertical-horizontal-scaling",
    term: "Vertical vs Horizontal Scaling",
    category: "Scalability",
    summary: "Vertical = buy a bigger machine. Horizontal = buy more machines.",
    full: `Your app is slow. Traffic is growing. You need to scale.

Option 1 — Vertical scaling (scale up): get a bigger server. More CPU, more RAM, faster storage. Simple — no code changes, no architecture changes. Your single server just gets beefier.

Option 2 — Horizontal scaling (scale out): add more servers. Keep the same size servers but add 10 of them. Put a load balancer in front to distribute traffic.

So why not just always scale vertically? Two reasons:
First, there's a ceiling. The biggest server AWS offers is currently around 448 CPU cores and 24TB RAM. Beyond that, you can't go bigger.
Second, it's a single point of failure. One server = if it goes down, your entire app goes down.

Horizontal scaling sounds better, but it requires your application to be stateless. If Server A handled a user's login and stored their session in memory, Server B has no idea who that user is. That's why sessions go in Redis (shared across all servers) and files go in S3 (not on individual servers).

The honest rule of thumb:
→ Start vertical — it's simpler, no architecture changes needed
→ Switch to horizontal when you approach the ceiling, need high availability, or want to scale specific components independently

One nuance for interviews: you can scale vertically and horizontally at the same time. Use larger servers AND have multiple of them. Most production systems do this.`,
    appearsIn: ["URL Shortener", "Payment System", "All systems"],
  },
  {
    id: "load-balancer",
    term: "Load Balancer",
    category: "Scalability",
    summary: "The traffic cop that distributes requests across your servers so none of them get overwhelmed",
    full: `Imagine a bank with 10 tellers but only one entrance. A load balancer is the person at the entrance who says "Teller 3 is free, go there. Next! Teller 7 is free, go there."

A load balancer sits in front of your servers and distributes incoming requests using an algorithm:

Round robin: rotate through servers in order. Request 1 → Server 1, Request 2 → Server 2, Request 3 → Server 3, Request 4 → Server 1 again. Simple, works when servers are identical.

Least connections: send each request to whichever server has the fewest active connections. Better when requests have wildly different processing times.

IP hash: hash the client's IP address to determine which server they always go to. The same client always hits the same server. Useful when you need session stickiness.

Load balancers also do health checks — they periodically ping each server and automatically stop sending traffic to any server that's down. This is why horizontal scaling gives you high availability: one server crashes, the load balancer just routes around it.

Two types you'll encounter:
Layer 4 (network level): routes based on IP and TCP port, very fast, no awareness of HTTP content
Layer 7 (application level): can route based on URL path, headers, content — more expensive but more flexible. "/api requests go to API servers, /static requests go to file servers."

The thing interviewers want to hear: "The load balancer itself can become a single point of failure, so you run two of them in active-passive mode — if the active one fails, the passive one takes over via anycast or DNS failover."`,
    appearsIn: ["URL Shortener", "Payment System", "Chat System", "All systems"],
  },
  {
    id: "cdn",
    term: "CDN (Content Delivery Network)",
    category: "Scalability",
    summary: "Pre-copy your content to servers near your users so they don't have to wait for it to travel from the US",
    full: `Your servers are in Mumbai. Your users are in Bangalore, Singapore, London, and São Paulo. The laws of physics say data can only travel so fast — roughly 200ms from Mumbai to London. For a video chunk that needs to arrive every 6 seconds, that 200ms matters.

A CDN solves geography by cheating it. Instead of your content living in one place, it gets copied to hundreds of servers in cities worldwide — called edge nodes or Points of Presence (PoPs). A user in London gets content from the London PoP. A user in Singapore gets it from the Singapore PoP. Both get it in ~5ms instead of 200ms.

How it works:
1. User in London requests a video chunk
2. Request goes to the nearest CDN edge node (London)
3. Cache hit? Return immediately from London. Fast.
4. Cache miss? Edge node fetches from your origin server in Mumbai, caches it, returns it. Next user in London gets a cache hit.

What you put on a CDN:
→ Static assets: JS, CSS, images — stuff that doesn't change per user
→ Video chunks: Netflix pre-loads popular movies to all CDN edges before release day
→ Cached API responses: some CDNs can cache GET responses

What you DON'T put on a CDN:
→ Dynamic user data: your account balance, your DMs, anything personalized
→ POST/PUT/DELETE requests: CDNs cache, they don't execute

The interview insight: CDNs don't just reduce latency — they dramatically reduce load on your origin servers. If a popular video is served from CDN 95% of the time, your origin servers only handle 5% of requests. This is why Netflix's servers don't collapse when a new season drops.`,
    appearsIn: ["Video Streaming", "URL Shortener"],
  },
  {
    id: "rate-limiting",
    term: "Rate Limiting",
    category: "Scalability",
    summary: "Controls how many requests a client can make in a time window — protects your servers from abuse and your wallet from runaway API costs",
    full: `I learned about rate limiting the hard way. I built a tool that called the Claude API in a loop — a bug caused it to fire hundreds of requests before I killed the process. Without a rate limiter on my side, I'd have burned through my credits in minutes.

Rate limiting answers one question: "Has this client made too many requests recently?" If yes, return 429 Too Many Requests. If no, let it through.

The algorithms, in order of sophistication:

Fixed window: count requests per minute, reset at :00. If limit is 100, you can send 100 requests from :59 to :00 and another 100 from :00 to :01 — 200 requests in 2 seconds. This boundary attack is a real exploit.

Sliding window: instead of "requests this minute," track "requests in the last 60 seconds from right now." Rolling window catches the boundary attack. More accurate but uses more memory (you store timestamps, not just a count).

Token bucket: a bucket fills with tokens at a fixed rate (e.g. 10 tokens per second, max 100 tokens). Each request consumes one token. If the bucket is empty, reject the request. This allows controlled bursts — up to 100 requests at once if you've been idle — while enforcing an average rate.

Where you store the counter matters enormously. In-memory means each server instance has its own counter — with 10 servers, your "100 requests/minute" limit becomes "1,000 requests/minute" effectively. Move the counter to Redis (shared across all instances) with INCR and EXPIRE for correct distributed rate limiting.

The 429 response should include a Retry-After header telling the client when they can try again. Well-behaved clients respect this. DDoS attackers don't — but that's what your firewall is for.`,
    appearsIn: ["Rate Limiter (standalone system)"],
  },

  // ── STORAGE ────────────────────────────────────────────────────────────────
  {
    id: "sql-nosql",
    term: "SQL vs NoSQL",
    category: "Storage",
    summary: "SQL = structured + consistent + relational. NoSQL = flexible + scalable + specialized.",
    full: `This is the question that comes up in every single system design interview. And the answer is never "SQL is better" or "NoSQL is better" — it's always "it depends on your access patterns."

SQL (PostgreSQL, MySQL) gives you:
→ ACID transactions — the bank never loses your money because two operations run simultaneously
→ Complex queries — JOIN across 5 tables in one query
→ Strict schema — every row has the same columns, enforced
→ Vertical scaling — get a bigger server. Horizontal sharding exists but is painful.

NoSQL comes in flavors:
→ Key-Value (Redis, DynamoDB): O(1) lookup by key. Insanely fast. Can't query by value. Perfect for caches, sessions, URL shortener mappings.
→ Document (MongoDB): JSON-like documents. Flexible schema — each document can have different fields. Good for user profiles, product catalogs with varying attributes.
→ Wide-Column (Cassandra): optimized for massive write throughput and time-series data. Netflix uses it for viewing history. Scales to petabytes horizontally.
→ Graph (Neo4j): relationships are first-class citizens. Social networks, fraud detection, recommendation engines.

The decision framework:
→ Need transactions that span multiple rows/tables? → SQL
→ Simple key-value lookups at massive scale? → Key-Value NoSQL
→ Need to scale writes to millions per second? → Wide-column NoSQL
→ Flexible schema with rich queries? → Document NoSQL
→ Starting a new project and unsure? → SQL. It's easier to migrate from SQL to NoSQL than the reverse.

Interview trap: "We chose NoSQL for scalability." This is often wrong. PostgreSQL with read replicas handles most scale. Only move to NoSQL when you have a specific reason — write throughput, schema flexibility, or a data model that fits a NoSQL pattern better.`,
    appearsIn: ["URL Shortener", "Chat System", "Payment System", "All systems"],
  },
  {
    id: "database-indexing",
    term: "Database Indexing",
    category: "Storage",
    summary: "A pre-built shortcut that lets the database find rows in milliseconds instead of scanning millions of rows one by one",
    full: `Without an index, a database finds rows by reading every single row until it finds matches. Imagine finding a word in a dictionary by reading every page from the beginning. With an index, it's like using the alphabetical tabs — you jump directly to the right section.

Under the hood, most indexes use a B-tree (Balanced Tree) data structure. The tree is sorted, so finding a value takes O(log n) instead of O(n). For a table with 100 million rows, O(n) might mean scanning 100M rows; O(log n) means ~27 comparisons.

Types of indexes:
→ Primary key index: automatically created on the primary key (id). Every table has one.
→ Secondary index: manually created on columns you filter by. CREATE INDEX ON users(email) so WHERE email = 'x@y.com' is fast.
→ Composite index: index on multiple columns. INDEX ON (user_id, created_at) makes "get all posts by user X in the last month" fast. Column order matters — the index is useful if you filter by user_id, by (user_id, created_at), but not by created_at alone.
→ Unique index: enforces uniqueness (like email must be unique) while also making lookups fast.

The trade-off nobody mentions enough: indexes slow down writes. Every INSERT, UPDATE, DELETE must update every index on that table. A table with 10 indexes has 10 data structures to maintain on every write.

Rules of thumb:
→ Index columns you filter by (WHERE clause)
→ Index columns you join on (foreign keys)
→ Index columns you sort by (ORDER BY) if you sort frequently
→ Don't index columns with low cardinality (boolean true/false — an index on this is almost useless)
→ Don't over-index write-heavy tables

Interview answer: "I'd add an index on short_code in the URL shortener because every redirect is a lookup by short_code. Without it, every redirect scans the entire 91TB table. With it, redirect is O(log n) — milliseconds regardless of table size."`,
    appearsIn: ["URL Shortener", "Payment System", "All systems"],
  },
  {
    id: "database-replication",
    term: "Database Replication",
    category: "Storage",
    summary: "Copy your database to multiple servers — one handles writes, the rest handle reads",
    full: `Your database is getting hammered. 115,000 read requests per second for URL redirects. But writes are only 1,200 per second. The ratio is 100:1. Why is one server doing all the work?

Replication solves this. You have one primary (or master) that handles all writes. Every write is replicated to one or more replicas (or read replicas). Reads can go to any replica. Now your 115,000 reads/sec are distributed across 5 replicas — each handling 23,000 reads/sec instead of one handling 115,000.

How replication works:
1. Write comes in to primary
2. Primary commits to its own storage
3. Primary sends a replication log to all replicas
4. Replicas apply the changes
5. Replicas are now up-to-date (within milliseconds — called replication lag)

Replication lag is the gotcha. Between step 2 and step 4, a user might read from a replica and see stale data. You just liked a tweet, you refresh, and your like is gone. That's replication lag — you were redirected to a replica that hadn't received the write yet.

For most systems, millisecond lag is fine. For some (banking, any system where you immediately read what you just wrote), you need to either:
→ Read from primary for critical reads (defeats the purpose for those reads but keeps them consistent)
→ Route the user's own reads to primary for a short window after they write

Failover: what happens when the primary goes down? You promote one replica to primary. Modern managed databases (AWS RDS, Supabase) handle this automatically. Manual failover takes minutes; automatic takes seconds.

Leader-leader (multi-primary): multiple nodes accept writes. Sounds great. Creates conflict resolution nightmares when two nodes receive conflicting writes simultaneously. Only use when you absolutely need it (global write latency requirements).`,
    appearsIn: ["URL Shortener", "Payment System", "Chat System"],
  },
  {
    id: "database-sharding",
    term: "Database Sharding",
    category: "Storage",
    summary: "Split your database horizontally across multiple servers when it's too big for one machine",
    full: `91 terabytes of URL mappings. No single database server holds 91TB comfortably. Solution: split the data across multiple servers. Each server holds a slice (shard) of the total data.

The shard key is everything. It decides which rows go to which shard. Choose wrong and you create hotspots — one shard getting hammered while others sit idle.

Sharding strategies:

Range sharding: short codes A-F → Shard 1, G-M → Shard 2, N-Z → Shard 3.
Simple but creates hotspots if your data isn't evenly distributed. If everyone creates URLs starting with 'a', Shard 1 is overloaded.

Hash sharding: hash(shard_key) % num_shards determines the shard.
Even distribution regardless of key patterns. But adding a new shard means rehashing — most keys move to different shards, invalidating all your caches. Painful.

Consistent hashing: uses a ring to assign keys to shards. Adding or removing a shard only moves a small fraction of keys. This is what Redis Cluster, Cassandra, and DynamoDB use.

The problems with sharding that interviewers love:
→ Cross-shard queries are expensive or impossible. "Get all URLs created by user X" requires querying all shards if the shard key isn't user_id.
→ Cross-shard transactions require 2PC (Two-Phase Commit) — complex and slow.
→ Rebalancing (resharding) when you add more shards is painful.
→ Hot shard problem: a viral tweet's short code all go to one shard. Cache at the application layer to protect it.

The honest advice: don't shard until you have to. Run on one big server, add read replicas, optimize queries. When a single primary can no longer handle writes — then shard. Sharding is the last resort, not the first move.`,
    appearsIn: ["URL Shortener", "Distributed Cache"],
  },
  {
    id: "caching",
    term: "Caching",
    category: "Storage",
    summary: "Store frequently accessed data in fast memory so you stop hitting the database for the same thing a million times",
    full: `The 80/20 rule applies brutally to web traffic: 20% of your content drives 80% of your reads. A viral tweet, a trending product, a popular short URL — the same tiny fraction of data gets read over and over.

Without caching: every one of those reads hits your database. At 115,000 reads/sec, your database melts.

With caching (Redis): the popular data lives in RAM. A Redis lookup takes under 1 millisecond. Same 115,000 reads/sec, but 95% of them never touch the database.

The patterns:

Cache-aside (most common): application checks cache first. Miss → query database → store in cache → return. Hit → return from cache. The application manages the cache explicitly.

Write-through: write to cache AND database simultaneously on every write. Cache is always fresh. But every write is slower (two operations). And you're caching data that might never be read again.

Write-behind (write-back): write to cache only, then asynchronously flush to database. Very fast writes. Risk: if cache crashes before flushing, you lose data. Only for data you can afford to lose.

Read-through: cache sits in front of database. On miss, the cache itself (not your application) fetches from database and stores. Application only talks to cache.

The TTL decision: every cached item has a Time to Live — after which it expires and gets evicted. Too short: you're hitting the database constantly, cache isn't helping. Too long: users see stale data. The right TTL depends entirely on how often the underlying data changes and how much staleness users will tolerate.

Eviction policies for when the cache is full:
LRU (Least Recently Used): evict whatever was accessed least recently. Good for most cases.
LFU (Least Frequently Used): evict whatever is accessed least often overall. Better for very stable hot data.

Cache invalidation — the hardest problem: how do you ensure cached data stays consistent with the database? When you update a URL's destination, the cached old destination must be invalidated. Options: delete the key (next request is a cache miss, fresh from DB), update the key (atomic but complex), or just let TTL expire (simplest, but stale for up to TTL duration).`,
    appearsIn: ["URL Shortener", "Stock Price Ticker", "Fraud Detection", "All systems"],
  },
  {
    id: "consistent-hashing",
    term: "Consistent Hashing",
    category: "Storage",
    summary: "A smarter way to distribute data across servers so adding or removing one server doesn't reshuffle everything",
    full: `Here's the problem regular hashing has: you have 10 Redis servers and you assign keys using key % 10. You add an 11th server. Now key % 11 gives completely different results. Almost every cached key is now on the "wrong" server — your cache is invalidated. 115,000 requests all miss at once. Your database dies.

Consistent hashing solves this with a ring.

Imagine a circle (0 to 2^32, or just think 0 to 360 degrees like a clock). You hash each server to a position on this ring. You hash each key to a position on this ring. To find which server owns a key: from the key's position, walk clockwise until you hit a server. That server owns the key.

Now add a new server. It gets hashed to a position on the ring. Only the keys between this new server and its predecessor need to move. All other keys are unaffected. Instead of reshuffling 90%+ of keys (like with modulo), you reshuffle only 1/n of keys.

Remove a server: only the keys that were on that server move to the next server clockwise. Everyone else is unaffected.

The virtual nodes problem: random hash positions don't guarantee even distribution. One server might end up with 40% of the ring, another with 5%. Fix: give each physical server multiple virtual positions on the ring (typically 100-200). The randomness averages out, each server ends up with roughly equal arc length.

This is not just a theoretical concept — it's how Redis Cluster, Cassandra, DynamoDB, and Amazon's Dynamo paper all distribute data. If you mention consistent hashing in an interview, explain virtual nodes. That's the signal that you actually understand it, not just memorized the name.`,
    appearsIn: ["Distributed Cache", "URL Shortener"],
  },
  {
    id: "object-storage",
    term: "Object Storage (Blob Storage)",
    category: "Storage",
    summary: "Where you store files, images, and videos — not in your database, but in a massively scalable file system in the cloud",
    full: `A 2GB movie file. A user's profile photo. 100,000 server log files. These don't belong in your database. Databases are built for structured, queryable data — rows and columns. Trying to store binary blobs in a database bloats your tables, slows down every query that touches them, and makes backups enormous.

Object storage (AWS S3, Google Cloud Storage, Cloudflare R2) is built for binary data. You store a file, you get back a key (like a file path). To retrieve it, you use the key. That's it — there's no querying by content, no joins, no indexes.

Why object storage instead of just a server's filesystem?
→ Infinitely scalable — S3 stores exabytes. Your server's disk fills up.
→ Durability — S3 replicates your data across multiple availability zones. 11 nines of durability (99.999999999%).
→ CDN-ready — S3 integrates directly with CloudFront. Your files are globally distributed.
→ Cheap — ~$0.023/GB/month on S3. Disk space on a server is more expensive per GB at scale.

The pattern: store the S3 key in your database, not the file itself.

Database row: { videoId: "vid_abc", s3Key: "videos/vid_abc/1080p/", title: "My Video" }

To serve the video: look up the s3Key in your database, then either redirect to the S3 URL directly or generate a presigned URL (a temporary, expiring link) if the content is private.

Presigned URLs are the security pattern: your S3 bucket is private (no public access). When a user wants to download their file, your server generates a presigned URL with a 1-hour expiry. The user uses that URL to download directly from S3 — your server isn't in the bandwidth path, and the URL expires before anyone can share it.`,
    appearsIn: ["Video Streaming"],
  },

  // ── MESSAGING ─────────────────────────────────────────────────────────────
  {
    id: "message-queues",
    term: "Message Queues",
    category: "Messaging",
    summary: "A buffer between services — the sender drops a message and moves on, the receiver processes it when ready",
    full: `50,000 orders placed on Zomato simultaneously. Each needs a notification. If your order service tries to send all 50,000 notifications synchronously — waiting for each one to complete before moving to the next — users are waiting 10 minutes for their order confirmation. Your servers are overwhelmed. Everything breaks.

Message queues solve this by decoupling who sends from who processes.

The producer (order service) drops a message on the queue: "order_123 needs a notification." Done. It moves on. The order is confirmed for the user in milliseconds.

The consumer (notification worker) picks up messages from the queue at its own pace. It might process 1,000 notifications per second. With 50,000 queued, it works through them in 50 seconds. Users get notifications slightly delayed — but no systems crashed.

Benefits:
→ Decoupling: order service doesn't need to know about notification service. They're independent.
→ Buffering: absorbs traffic spikes. Festival sale generates 100x normal traffic — the queue holds the extra load and workers process it as fast as they can.
→ Retry: failed messages can be automatically retried. Dead letter queues hold messages that fail repeatedly for manual inspection.
→ Fan-out: one message can be consumed by multiple independent consumers. One "order placed" event triggers push notification AND email AND restaurant notification AND delivery partner alert.

Common message queue tools:
→ RabbitMQ: traditional queue with rich routing. Messages are deleted after consumption.
→ AWS SQS: managed, simple, at-least-once delivery guarantee.
→ Kafka: not a traditional queue — an event stream. Messages persist and can be replayed. Multiple consumer groups read independently. Use when you need persistence or multiple independent consumers.

The "at-least-once" vs "exactly-once" distinction matters for interviews: most queues guarantee at-least-once delivery (you might get the same message twice). Make your consumers idempotent — processing the same message twice should have the same result as processing it once.`,
    appearsIn: ["Notification System", "Payment System", "Video Streaming"],
  },
  {
    id: "kafka",
    term: "Kafka (Event Streaming)",
    category: "Messaging",
    summary: "A distributed event stream where messages persist and multiple consumers can independently read the same events",
    full: `Traditional message queues work like a to-do list: you add a task, someone completes it, the task is gone. Kafka works like a commit log: every event is written in order and stays there for as long as you configure (days, weeks, forever). Multiple readers can read the same log at their own pace without interfering with each other.

This distinction sounds subtle but changes everything about what you can build.

With RabbitMQ: notification service consumes an event → event is gone → analytics service never sees it.
With Kafka: notification service reads the event → event stays → analytics service also reads it independently → fraud detection also reads it independently. One event, many consumers.

Key concepts:
→ Topic: a named stream of events. "order-events", "payment-events", "user-actions".
→ Partition: topics are split into partitions for parallelism. Partition 0, Partition 1, Partition 2. Events with the same key always go to the same partition (ensuring ordering for that key).
→ Consumer group: a set of consumers that together consume a topic. If you have 3 partitions and 3 consumers in a group, each consumer handles 1 partition in parallel.
→ Offset: every event in a partition has a sequential number (offset). Each consumer group tracks its own offset — where it left off. Crash and restart → resume from last committed offset. Zero messages lost.
→ Retention: events stay in Kafka for the configured retention period (default 7 days). You can replay old events — reprocess the last week of events through a new service.

When to use Kafka vs a simpler queue:
→ Multiple independent consumers reading the same events → Kafka
→ Need to replay historical events → Kafka
→ Need event ordering within a key → Kafka
→ Simple task queue with one consumer → SQS/RabbitMQ (simpler, cheaper)
→ Real-time fire-and-forget pub/sub → Redis Pub/Sub (faster, no persistence)

The tradeoff: Kafka is operationally complex. Running a Kafka cluster requires managing brokers, ZooKeeper/KRaft, partitions, replication. Use managed Kafka (Confluent Cloud, AWS MSK) unless you enjoy operations.`,
    appearsIn: ["Notification System", "Fraud Detection", "Web Crawler", "Stock Price Ticker"],
  },

  // ── ALGORITHMS ────────────────────────────────────────────────────────────
  {
    id: "cap-theorem",
    term: "CAP Theorem",
    category: "Algorithms",
    summary: "In a distributed system, you can only guarantee 2 of 3: Consistency, Availability, Partition Tolerance",
    full: `In 2000, Eric Brewer proved something uncomfortable: a distributed system dealing with a network partition (some nodes can't talk to others) must choose between being consistent OR being available. You cannot have both.

Let's define the terms:
→ Consistency: every read returns the most recent write. If you deposit ₹500 and immediately check your balance, you see ₹500 more. No stale reads.
→ Availability: every request gets a response (not an error). The system is always up.
→ Partition Tolerance: the system keeps working even when network messages between nodes are lost or delayed.

The theorem: you must choose Partition Tolerance (networks fail — this isn't optional in distributed systems), so the real choice is CP vs AP.

CP (Consistent + Partition Tolerant): when a partition occurs, refuse requests rather than risk returning stale data. You get consistency but sacrifice availability. Example: ZooKeeper, HBase. Your bank account balance is CP — you'd rather get an error than see the wrong balance.

AP (Available + Partition Tolerant): when a partition occurs, keep serving requests even if some nodes have stale data. You get availability but accept temporary inconsistency. Example: Cassandra, DynamoDB. Your Twitter feed is AP — seeing a slightly old feed is fine; a 503 error is not.

The nuance interviewers want: CAP isn't binary. "Eventual consistency" is the AP path — the system will become consistent eventually, once the partition heals and nodes sync. How long is "eventually"? Milliseconds to seconds for most systems. Your Zomato rating might take a few seconds to sync across all data centers — you've experienced this.

Interview application: "For the payment system, I'd choose CP — we can return an error during a partition but we must never show a user an incorrect balance. For the social feed, I'd choose AP — temporary staleness in the feed is far preferable to returning errors to users."`,
    appearsIn: ["Distributed Cache", "Chat System", "Payment System"],
  },
  {
    id: "idempotency",
    term: "Idempotency",
    category: "Algorithms",
    summary: "Doing the same operation N times has the same result as doing it once — critical for safe retries",
    full: `You tap Pay on GPay. Network drops. App retries 3 times. Without idempotency: ₹500 gets charged 4 times. With idempotency: ₹500 gets charged exactly once, regardless of how many times the request arrives.

Idempotency means the result of an operation is the same whether you perform it once or a hundred times.

HTTP GET is naturally idempotent: fetch the same URL a million times, you still get the same data (assuming it doesn't change), and no state is modified.

HTTP POST is NOT naturally idempotent: submit a form, and each submission creates a new record. Submit it 3 times, you have 3 records.

How to make POST idempotent:
1. Client generates a UUID before making the request: idempotency_key = UUID()
2. Client includes it in the header: Idempotency-Key: "pay_abc123"
3. Server checks: have I seen this key before?
   → No: process the request, store (key → result) in Redis
   → Yes: return the stored result without processing again

The key lives in Redis with a TTL (24 hours is common). After TTL, if the same key comes in, you treat it as a new request.

This pattern is everywhere in payments: Stripe, Razorpay, and PayPal all require Idempotency-Key headers on mutation endpoints. It's why when you accidentally double-tap Pay, your bank account only loses money once.

Beyond payments: idempotency matters whenever you have retries. Email sending (only send once even if the job retries), file uploads (only process once even if the upload webhook fires multiple times), order creation (only create one order even if the network caused multiple submissions).

The mental model: an idempotent operation is like pressing a light switch that's already on. Pressing it again doesn't make it more on. The result is the same.`,
    appearsIn: ["Payment System"],
  },

  // ── SECURITY ─────────────────────────────────────────────────────────────
  {
    id: "api-gateway",
    term: "API Gateway",
    category: "Security",
    summary: "A single front door for all your APIs — handles auth, rate limiting, routing, and logging in one place",
    full: `You have 12 microservices. Every one of them needs authentication. Every one needs rate limiting. Every one needs logging. Do you implement all of that in each service separately? Or do you put it in one place that all traffic flows through?

An API Gateway is that one place.

It sits between your clients (browsers, mobile apps) and your backend services. Every request comes through the gateway first. The gateway handles:

→ Authentication: verify the JWT token before the request reaches any service. Services can trust that requests they receive are authenticated.
→ Rate limiting: one rate limiter at the gateway instead of 12 separate ones.
→ Request routing: /api/users/* → User Service, /api/payments/* → Payment Service, /api/videos/* → Video Service. The client talks to one domain.
→ SSL termination: HTTPS between client and gateway, HTTP (or internal TLS) between gateway and services. Certificates managed in one place.
→ Request/response transformation: add headers, modify responses, handle versioning.
→ Logging and observability: every request logged in one place with a correlation ID that traces through all downstream services.

Popular API Gateways: AWS API Gateway, Kong, NGINX (configured as gateway), Traefik, Envoy.

The trade-off: the API Gateway is a single point of failure and a potential bottleneck. Run multiple gateway instances behind a load balancer. And be careful about putting business logic in the gateway — it should be a routing and cross-cutting concerns layer, not a place where feature code lives.

Interview answer: "I'd put an API Gateway in front of all microservices to handle authentication, rate limiting, and routing centrally. This prevents duplicating cross-cutting concerns in every service and gives us a single point for observability. The gateway itself runs as multiple instances to avoid being a single point of failure."`,
    appearsIn: ["Payment System", "Notification System"],
  },
  {
    id: "acid-transactions",
    term: "ACID Transactions",
    category: "Security",
    summary: "The four guarantees that make databases trustworthy — especially critical for anything involving money",
    full: `Your bank runs on ACID. Without it, your money would randomly disappear, appear, or duplicate whenever two operations happened at the same time. ACID is what makes databases reliable for data that actually matters.

ACID stands for four properties:

Atomic: a transaction either fully completes or fully fails — never partially. You transfer ₹500 from your account to a friend's. That's two operations: deduct from yours, add to theirs. If the server crashes between operations, the deduction rolls back automatically. Your ₹500 comes back. Your friend gets nothing. Clean state.

Consistent: a transaction brings the database from one valid state to another valid state. If your account balance has a "must be >= 0" constraint, a transaction that would make it negative is rejected — even if it's technically valid SQL.

Isolated: concurrent transactions don't interfere with each other. If 1,000 people are buying the last concert ticket simultaneously, only one succeeds. Without isolation, all 1,000 might see "1 ticket available," all purchase it, and you've sold one ticket to 1,000 people.

Durable: once a transaction commits, it stays committed — even if the server crashes immediately after. Data is written to disk (and usually replicated) before the commit is acknowledged.

Why NoSQL often lacks full ACID:
Most NoSQL databases sacrifice some ACID properties for performance and scalability. Cassandra gives you atomicity at the row level but not across multiple rows. This is fine for many use cases (social feeds, event logs) but a dealbreaker for financial systems.

Interview application: "Payment systems require full ACID transactions — the atomic debit/credit pair must be all-or-nothing. This is why I'd use PostgreSQL, not Cassandra, for the payment database. The ACID requirement is non-negotiable when real money is involved."`,
    appearsIn: ["Payment System"],
  },
];
