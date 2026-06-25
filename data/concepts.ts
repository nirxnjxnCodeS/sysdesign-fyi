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

export const concepts: Concept[] = [
  // ── NETWORKING ────────────────────────────────────────────────────────────
  {
    id: "client-server",
    term: "Client-Server Architecture",
    category: "Networking",
    summary: "The foundation of every web app — clients request, servers respond",
    full: `The client-server model splits responsibilities: clients (browsers, mobile apps) initiate requests; servers process them and return responses. Every HTTP request follows this pattern. The server holds the business logic and data; the client only handles presentation. This stateless request-response cycle is the starting point for every system design — understand it deeply before adding any other concept on top.`,
    appearsIn: ["All systems"],
  },
  {
    id: "dns",
    term: "DNS (Domain Name System)",
    category: "Networking",
    summary: "Translates human-readable domains to IP addresses",
    full: `When you type google.com, DNS resolves it to an IP like 142.250.80.46 — the internet's phone book. DNS resolution is cached at multiple layers: your browser, your OS, your ISP's resolver, and root nameservers. TTL (Time to Live) controls how long each layer caches the result. In interviews: "How does your client find your servers?" → DNS points to a load balancer IP. DNS also enables geographic routing — Cloudflare routes users to the nearest data center via DNS-level routing.`,
    appearsIn: ["URL Shortener", "Video Streaming", "All systems"],
  },
  {
    id: "http-https",
    term: "HTTP vs HTTPS",
    category: "Networking",
    summary: "HTTP is plain text, HTTPS encrypts everything with TLS",
    full: `HTTP = HyperText Transfer Protocol. Stateless request-response: each request is independent, no memory of previous requests. HTTPS adds TLS (Transport Layer Security) — encrypts data in transit so nobody between client and server can read it. In 2024, all production systems use HTTPS. Interview gotcha: "What happens in a TLS handshake?" → Client hello → Server certificate → Session key exchange (asymmetric crypto) → All further communication encrypted with that symmetric session key. The asymmetric key exchange is expensive, which is why TLS session resumption exists.`,
    appearsIn: ["All systems"],
  },
  {
    id: "rest-graphql",
    term: "REST vs GraphQL",
    category: "Networking",
    summary: "REST uses fixed endpoints, GraphQL lets clients request exactly what they need",
    full: `REST = multiple fixed endpoints (/users, /posts, /comments), each returning a fixed data shape. GraphQL = single endpoint (/graphql) where the client specifies exactly which fields it needs. REST pros: simple, naturally cacheable (GET requests), industry standard, easy to reason about. GraphQL pros: no over-fetching (mobile apps don't need 40 fields when they display 5), flexible, self-documenting via introspection. GraphQL cons: harder to cache (all queries are POST), N+1 query problems server-side, more complex server implementation. Use REST for simple CRUD APIs and public APIs. Use GraphQL for complex dashboards and mobile apps needing bandwidth efficiency.`,
    appearsIn: ["Chat System", "Payment System"],
  },
  {
    id: "websockets",
    term: "WebSockets",
    category: "Networking",
    summary: "Persistent two-way connection — server pushes data without client asking",
    full: `HTTP is half-duplex: client asks, server answers, connection closes. WebSockets open a persistent full-duplex connection with a single HTTP upgrade handshake — then both sides can push data at any time with minimal overhead (no HTTP headers per message). Perfect for: live chat, real-time stock prices, multiplayer games, live collaboration, live notifications. WebSocket vs Server-Sent Events (SSE): SSE is one-way (server → client only) and simpler to implement — great for dashboards, news feeds. WebSockets are bidirectional — required for chat, gaming. WebSocket vs Long Polling: long polling fakes real-time by keeping connections open waiting for data; WebSockets are genuinely persistent and far more efficient.`,
    appearsIn: ["Chat System", "Stock Price Ticker"],
  },
  {
    id: "webhooks",
    term: "Webhooks",
    category: "Networking",
    summary: "Server notifies your server when something happens — event-driven HTTP",
    full: `Instead of polling "did payment succeed?" every second, Stripe calls YOUR endpoint the moment payment succeeds. Your server receives a POST request with the event payload. Pros: no wasted polling requests, instant notification, simple HTTP. Cons: your server must be publicly accessible (no localhost), you must handle retries when your server is down, and you must validate webhook signatures (anyone on the internet could POST to your endpoint). Implementation: Stripe includes an HMAC signature in the header — you verify it with your shared secret. Always return 200 quickly and process async; if you take too long, the provider retries.`,
    appearsIn: ["Payment System", "Notification System"],
  },

  // ── SCALABILITY ───────────────────────────────────────────────────────────
  {
    id: "scaling",
    term: "Vertical vs Horizontal Scaling",
    category: "Scalability",
    summary: "Vertical = bigger server, Horizontal = more servers",
    full: `Vertical scaling (scale up): add more CPU, RAM, or faster disks to one server. Simple, no code changes, no load balancer needed. But: has a physical ceiling (largest EC2 instance still has limits), expensive at the top, and creates a single point of failure. Horizontal scaling (scale out): add more servers, distribute load. Unlimited theoretical ceiling, fault tolerant (one server dies, others keep running). Requires: stateless application servers (no local session state), a load balancer to route traffic, and distributed storage. Most modern systems use horizontal scaling for app servers and vertical scaling as a first step when database becomes the bottleneck.`,
    appearsIn: ["All systems"],
  },
  {
    id: "load-balancer",
    term: "Load Balancer",
    category: "Scalability",
    summary: "Distributes incoming traffic across multiple servers",
    full: `Sits in front of your server fleet, routing each incoming request to a server using an algorithm. Round robin: rotate through servers equally — good when requests are similar in cost. Least connections: send to the server with fewest active connections — better for variable-length requests. IP hash: same client IP always hits the same server — useful for sticky sessions. Health checks: load balancer pings servers every few seconds; removes unhealthy servers from rotation automatically. Layer 4 LB: routes based on TCP/IP — no inspection of content. Layer 7 LB: inspects HTTP headers, routes based on URL path or headers (e.g. /api to API servers, /static to CDN). AWS ALB, Nginx, HAProxy are common implementations.`,
    appearsIn: ["URL Shortener", "Payment System", "Chat System", "All systems"],
  },
  {
    id: "cdn",
    term: "CDN (Content Delivery Network)",
    category: "Scalability",
    summary: "Pre-distributes content to servers near users globally",
    full: `A CDN is a network of servers in cities worldwide. Static content (images, JS, CSS, video chunks) gets copied to all CDN nodes. A user in Mumbai hits the Mumbai CDN node, not your US origin server — latency drops from 200ms to 5ms. Cache hit ratio is critical: the more popular the content, the longer the CDN caches it. CDN cache invalidation: push a new version with a different URL (cache busting via file hashes), or send a purge request to the CDN API. CDNs can also cache 301 redirects entirely — so for URL shorteners, popular short URLs are served by Cloudflare without ever reaching your servers. Cloudflare, Fastly, AWS CloudFront are the main players.`,
    appearsIn: ["Video Streaming", "URL Shortener"],
  },
  {
    id: "rate-limiting",
    term: "Rate Limiting",
    category: "Scalability",
    summary: "Controls how many requests a client can make in a time window",
    full: `Prevents DDoS attacks, cost overruns from abusive clients, and server overload. Algorithms: Token bucket — tokens are added at a fixed rate (e.g. 100/min); each request consumes one token; allows controlled bursts up to bucket size. Sliding window — tracks request timestamps over the last N seconds; most accurate; prevents boundary attacks. Fixed window — resets counter every minute; vulnerable to the boundary attack (100 req at :59, 100 at :01 = 200 requests in 2 seconds). Implementation across distributed instances: Redis INCR + EXPIRE for shared counter state. Returns 429 Too Many Requests with a Retry-After header. Apply at API Gateway before requests hit your services.`,
    appearsIn: ["All systems with public APIs"],
  },

  // ── STORAGE ───────────────────────────────────────────────────────────────
  {
    id: "sql-nosql",
    term: "SQL vs NoSQL",
    category: "Storage",
    summary: "SQL = structured + consistent, NoSQL = flexible + scalable",
    full: `SQL (PostgreSQL, MySQL): fixed schema tables, ACID transactions, complex joins, vertical scaling. Use for financial data, anything needing transactions, or complex relationships between entities. NoSQL comes in four flavors: Document (MongoDB) — JSON-like nested data, flexible schema, good for user profiles, product catalogs. Key-Value (Redis, DynamoDB) — instant O(1) lookups by key, limited query patterns. Wide-column (Cassandra, HBase) — excellent for time-series, scales to petabytes across many nodes. Graph (Neo4j) — relationships are first-class, great for social networks. Rule of thumb: start with SQL. Move to NoSQL only when you need to scale past what a single SQL node handles, or when your access pattern is a simple key lookup at massive scale.`,
    appearsIn: ["URL Shortener", "Chat System", "Payment System", "All systems"],
  },
  {
    id: "indexing",
    term: "Database Indexing",
    category: "Storage",
    summary: "Pre-built lookup structure that makes queries faster — at the cost of writes",
    full: `Without an index: the DB scans every row to find matches — O(n) full table scan. With an index: the DB uses a B-tree or hash structure to jump directly to matching rows — O(log n). Primary index: automatically created on the primary key. Secondary index: manually created on columns you query often (e.g. user_id, email, created_at). Compound index: index on multiple columns together; column order matters — (user_id, created_at) supports queries filtering by user_id, but not created_at alone. Downside: indexes consume disk space and slow down writes, because the index must be updated on every INSERT, UPDATE, and DELETE. Rule: index columns you filter or sort by frequently. Never index low-cardinality columns like boolean flags — the index is useless if 50% of rows match.`,
    appearsIn: ["All systems with databases"],
  },
  {
    id: "replication",
    term: "Database Replication",
    category: "Storage",
    summary: "Copy data to multiple DB servers — one writes, many read",
    full: `Primary-replica (master-slave): all writes go to the primary. The primary replicates changes to one or more replicas asynchronously. Reads are distributed across replicas, scaling read throughput linearly. Replication lag: replicas may be milliseconds behind — if a user writes then immediately reads, they might read stale data. Solutions: read your own writes from primary, or synchronous replication (slower writes). Failover: if the primary fails, promote a replica to primary — can be automated with tools like Patroni for PostgreSQL. Multi-primary: multiple write nodes — complex, risks write conflicts, requires conflict resolution. Use for: read-heavy systems (most systems are read-heavy), geographic distribution (replica in each region for local reads).`,
    appearsIn: ["URL Shortener", "Chat System", "Payment System"],
  },
  {
    id: "sharding",
    term: "Database Sharding",
    category: "Storage",
    summary: "Horizontally partition data across multiple database servers",
    full: `When data is too large for one server, split it — each shard holds a subset of rows. Shard key: the column that determines which shard a row lives on. Range sharding: A-M on shard 1, N-Z on shard 2. Simple to understand but creates hotspots if one range is far more active. Hash sharding: hash(shard_key) % num_shards gives even distribution, but adding a shard reshuffles most data — cache invalidation disaster. Consistent hashing: solves the reshuffling problem — adding/removing a shard only moves a small fraction of keys. Downside of sharding: cross-shard queries are expensive. Joins across shards don't work. Schema changes must be applied to every shard. Design to avoid cross-shard queries — your shard key should colocate all related data for a user or entity on the same shard.`,
    appearsIn: ["Distributed Cache", "URL Shortener at scale"],
  },
  {
    id: "caching",
    term: "Caching",
    category: "Storage",
    summary: "Store frequently accessed data in fast memory to avoid slow DB queries",
    full: `Cache sits between your application and database. Cache hit: data found in cache → return in under 1ms. Cache miss: not found → query DB → store result in cache → return. TTL (Time to Live): how long to keep cached data before considering it stale and expiring it. Eviction policies: LRU (Least Recently Used) — evict the item that hasn't been accessed in the longest time. LFU (Least Frequently Used) — evict the item accessed the fewest times overall. Cache invalidation strategies: Write-through — write to cache AND DB simultaneously, always consistent but slower writes. Write-behind — write to cache, async write to DB, faster but risk of data loss on crash. Cache-aside (lazy loading) — app checks cache, on miss reads DB and populates cache. Most common for read-heavy systems. Thundering herd problem: many cache misses hit the DB simultaneously after a cache expiry — use mutex locking or probabilistic early expiration.`,
    appearsIn: ["URL Shortener", "Stock Price Ticker", "Fraud Detection"],
  },
  {
    id: "consistent-hashing",
    term: "Consistent Hashing",
    category: "Storage",
    summary: "Distribute data across servers so adding/removing a server only moves a small fraction of keys",
    full: `Regular modulo hashing (key % n): adding one server changes the mapping for almost all keys — mass cache invalidation, thundering herd on your DB. Consistent hashing solves this: imagine servers placed at positions on a circular ring (hash ring). Each key also hashes to a position on the ring. To find which server owns a key, walk clockwise around the ring until you hit a server. Adding a server: only keys between it and its counterclockwise neighbor move — typically 1/n of keys. Virtual nodes: each physical server is represented at 100-200 positions on the ring to ensure even load distribution even when servers have different capacities. Used by: Amazon DynamoDB, Apache Cassandra, Redis Cluster, Memcached.`,
    appearsIn: ["Distributed Cache", "URL Shortener at scale"],
  },
  {
    id: "object-storage",
    term: "Object Storage (Blob Storage)",
    category: "Storage",
    summary: "Stores unstructured data like images, videos, files — not for SQL queries",
    full: `Databases store structured, queryable data. Object storage (AWS S3, Google Cloud Storage, Azure Blob) stores binary blobs — images, videos, audio, PDFs, backups, ML datasets, logs. Each object gets a unique key (essentially a file path). Access via HTTP URL or time-limited signed URLs for private content. Infinitely scalable, extremely cheap ($0.023/GB on S3 standard). Not queryable — you cannot do SELECT * or filter by content. Pattern: store the S3 object key in your database; fetch the object directly from S3 using that key. For video: store raw upload in S3, transcoding job reads from S3, writes processed chunks back to S3, delivers via CDN.`,
    appearsIn: ["Video Streaming"],
  },

  // ── MESSAGING ─────────────────────────────────────────────────────────────
  {
    id: "message-queues",
    term: "Message Queues",
    category: "Messaging",
    summary: "Decouples services — producer drops a message, consumer processes when ready",
    full: `Producer sends a message to the queue and moves on immediately — no waiting. Consumer picks up the message independently at its own pace. This decoupling gives you: temporal decoupling (consumer can be down, messages wait), load leveling (traffic spike generates messages; consumers drain the queue at their pace), retry semantics (failed messages stay in queue and are retried). RabbitMQ: traditional message broker, great for task distribution, supports routing logic. Amazon SQS: managed, simple, at-least-once delivery, handles duplicates with deduplication IDs. Kafka is often confused with a queue but is fundamentally different — it's an event stream (see Kafka entry). Dead Letter Queue (DLQ): messages that fail repeatedly after max retries go to a DLQ for inspection — essential for production observability.`,
    appearsIn: ["Notification System", "Payment System"],
  },
  {
    id: "kafka",
    term: "Kafka (Event Streaming)",
    category: "Messaging",
    summary: "Distributed event stream — messages persist, multiple consumers read the same events",
    full: `Unlike traditional queues where a message disappears after consumption, Kafka stores messages in topics for a configurable retention period (days or weeks). Multiple consumer groups can read the same topic independently — an analytics service and a fraud detection service can both read every payment event without interfering with each other. Topics are split into partitions for parallel processing. Within a partition, ordering is guaranteed. Across partitions, no ordering guarantee. Consumer offset: Kafka tracks where each consumer group is in each partition. If a consumer crashes, it resumes from its last committed offset — zero message loss. Use Kafka over RabbitMQ when: you need event replay, multiple independent consumers, high throughput (millions of events/sec), or audit log semantics.`,
    appearsIn: ["Notification System", "Fraud Detection", "Web Crawler"],
  },

  // ── ALGORITHMS ────────────────────────────────────────────────────────────
  {
    id: "cap-theorem",
    term: "CAP Theorem",
    category: "Algorithms",
    summary: "Distributed systems can only guarantee 2 of 3: Consistency, Availability, Partition tolerance",
    full: `Consistency: every read returns the most recent write — no stale data. Availability: every request gets a response (might be stale data). Partition Tolerance: the system keeps working even if some network links between nodes fail. In real distributed systems, network partitions happen (they are unavoidable), so you must choose between CP and AP. CP (consistent + partition tolerant): when a partition occurs, the system refuses to serve stale reads — it returns an error rather than wrong data. ZooKeeper, HBase, etcd. AP (available + partition tolerant): when a partition occurs, the system continues serving requests even if some nodes have stale data. Cassandra, DynamoDB, CouchDB. Interview tip: "For this system, which matters more — consistency or availability?" Payment system → CP (never show wrong balance). Social media feed → AP (slightly stale feed is fine).`,
    appearsIn: ["Distributed Cache", "Chat System", "Payment System"],
  },
  {
    id: "idempotency",
    term: "Idempotency",
    category: "Algorithms",
    summary: "Same request N times = same result as sending it once",
    full: `Critical for payment systems and any operation that retries on failure. Without idempotency, a network timeout causes a retry, which causes a duplicate charge. Implementation: client generates a unique idempotency key (UUID) before the request and includes it in every retry of the same operation. Server stores (idempotency_key → result) in Redis with a TTL. On duplicate request: return the stored result without re-executing the operation. HTTP GET, PUT, DELETE are naturally idempotent. POST is not — you must add idempotency explicitly. Example: Stripe requires an Idempotency-Key header for all payment creation APIs. At-least-once delivery from message queues requires consumers to be idempotent — the same message may arrive twice.`,
    appearsIn: ["Payment System", "Notification System"],
  },

  // ── SECURITY ──────────────────────────────────────────────────────────────
  {
    id: "api-gateway",
    term: "API Gateway",
    category: "Security",
    summary: "Single entry point for all API traffic — handles auth, rate limiting, routing",
    full: `The API Gateway sits in front of all your microservices and handles cross-cutting concerns: authentication (verify JWT or API key before the request reaches any service), rate limiting (reject abusive clients early), SSL termination (decrypt HTTPS once at the gateway, forward plain HTTP internally), request routing (route /api/payments to payment service, /api/users to user service), response caching (return cached responses for identical requests), and logging (every request logged in one place). Without a gateway: every microservice implements its own auth, rate limiting, and logging — massive duplication and inconsistency. AWS API Gateway, Kong, NGINX, Traefik are common implementations. In interviews: always put the API Gateway before your services when drawing the architecture.`,
    appearsIn: ["Payment System", "Notification System", "All microservices architectures"],
  },
  {
    id: "acid",
    term: "ACID Transactions",
    category: "Security",
    summary: "Database guarantee: Atomic, Consistent, Isolated, Durable",
    full: `Atomic: all operations in a transaction succeed together, or all fail together — no partial state. If you debit one account and credit another, both happen or neither happens. Consistent: the database moves from one valid state to another — constraints, foreign keys, and rules are never violated mid-transaction. Isolated: concurrent transactions don't interfere with each other — each transaction sees a consistent snapshot of data. Isolation levels (read uncommitted → read committed → repeatable read → serializable) trade performance for correctness. Durable: committed transactions survive crashes — data is written to disk (WAL) before the commit returns. Use ACID when: financial transactions, inventory management, booking systems, anything where partial failure causes corruption. NoSQL tradeoff: many NoSQL databases sacrifice ACID for performance and horizontal scale. Know what guarantees your database actually provides before assuming.`,
    appearsIn: ["Payment System", "All financial systems"],
  },
];

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
