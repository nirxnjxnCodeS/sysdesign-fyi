import type { PrepData } from "./types";

export const twitterFeedPrep: PrepData = {
  systemId: "twitter-feed",
  systemName: "Twitter / X Feed",
  sections: [
    {
      type: "interactive",
      sectionId: "requirements",
      step: "Step 1 — Requirements",
      title: "Sort the Requirements",
      subtitle:
        "Social feed systems have deceptively nuanced requirements. Interviewers expect you to separate the feed-core from the recommendation layer.",
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
            text: "Post a tweet and have it appear on followers' feeds",
            correctBucket: "functional",
            explanation: "The primary write path — the core feature of a social feed.",
          },
          {
            id: "r2",
            text: "Feed must load in under 200ms",
            correctBucket: "non-functional",
            explanation: "Latency target — drives the pre-computation fan-out architecture.",
          },
          {
            id: "r3",
            text: "Support 200 million daily active users",
            correctBucket: "non-functional",
            explanation: "Scale constraint — this is why a naive pull model fails.",
          },
          {
            id: "r4",
            text: "Show tweets from accounts the user follows",
            correctBucket: "functional",
            explanation: "Feed composition rule — the fundamental read requirement.",
          },
          {
            id: "r5",
            text: "Direct messaging between users",
            correctBucket: "out-of-scope",
            explanation: "DMs are a separate service — different data model, different infrastructure.",
          },
          {
            id: "r6",
            text: "Handle celebrity accounts with 100M+ followers without write amplification",
            correctBucket: "non-functional",
            explanation: "The celebrity fan-out constraint — drives the hybrid push/pull design.",
          },
          {
            id: "r7",
            text: "Show tweets in ranked order (not just chronological)",
            correctBucket: "functional",
            explanation: "Algorithmic ranking is a core product feature, not just an optimization.",
          },
          {
            id: "r8",
            text: "Real-time trend detection and trending hashtags",
            correctBucket: "out-of-scope",
            explanation: "Trend detection is a separate analytics system — out of scope for the feed design.",
          },
          {
            id: "r9",
            text: "Tweet images and video must be served globally under 100ms",
            correctBucket: "non-functional",
            explanation: "Media latency SLA — drives CDN architecture for media separately from text feeds.",
          },
          {
            id: "r10",
            text: "Users can like, retweet, and reply to tweets",
            correctBucket: "functional",
            explanation: "Engagement actions are functional features that also generate feed events.",
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
        "The fan-out write volume is the critical number. It determines whether fan-out on write is viable for regular users.",
      interaction: {
        type: "estimation-calculator",
        steps: [
          {
            id: "e1",
            label: "Daily active users",
            formula: "Given assumption",
            answer: 200000000,
            unit: "DAU",
            userInput: false,
            hint: "",
            explanation: "200M DAU — Twitter/X scale.",
          },
          {
            id: "e2",
            label: "Tweets posted per user per day",
            formula: "Given assumption",
            answer: 0.5,
            unit: "tweets/user/day",
            userInput: false,
            hint: "",
            explanation: "Most users read much more than they post. 0.5 tweets/DAU/day is a reasonable average.",
          },
          {
            id: "e3",
            label: "Total tweets per day",
            formula: "200M × 0.5",
            answer: 100000000,
            unit: "tweets/day",
            userInput: true,
            hint: "Multiply DAU by tweets per user",
            explanation: "100M tweets per day — the write volume your system must handle.",
          },
          {
            id: "e4",
            label: "Tweet write QPS",
            formula: "100M ÷ 86,400",
            answer: 1157,
            unit: "writes/sec",
            userInput: true,
            hint: "Divide daily tweets by seconds in a day",
            explanation: "~1,200 tweet writes/sec — manageable. The real challenge is fan-out multiplied by follower count.",
          },
          {
            id: "e5",
            label: "Average followers per user",
            formula: "Given assumption",
            answer: 100,
            unit: "followers",
            userInput: false,
            hint: "",
            explanation: "100 average followers per user. But the distribution is extremely skewed — most have <50, a few have 100M+.",
          },
          {
            id: "e6",
            label: "Fan-out writes per second (to Redis)",
            formula: "1,200 tweets/sec × 100 followers",
            answer: 120000,
            unit: "Redis writes/sec",
            userInput: true,
            hint: "Multiply tweet write QPS by average followers",
            explanation: "120,000 Redis writes/sec for fan-out. This is why pre-computation is necessary — and why celebrities break the model.",
          },
        ],
        insight:
          "The fan-out write rate (120K/sec) is 100x higher than the tweet write rate (1.2K/sec). This single number explains every architectural decision: pre-computed timelines in Redis, hybrid fan-out for celebrities, and why feed reads must be O(1). If you remember one number from this estimation, it's the fan-out multiplier.",
      },
    },
    {
      type: "apiDesign",
      endpoints: [
        {
          method: "GET",
          path: "/api/v1/feed",
          description: "Fetch the authenticated user's home timeline",
          response: `// 200 OK
{
  "tweets": [
    {
      "id": "tweet_abc123",
      "author": { "id": "user_456", "handle": "@priya", "name": "Priya" },
      "content": "Just shipped our new feed ranking model 🚀",
      "createdAt": "2024-01-15T09:00:00Z",
      "likes": 1420,
      "retweets": 89,
      "mediaUrls": ["https://cdn.twitter.com/img/abc.jpg"]
    }
  ],
  "nextCursor": "tweet_abc100",  // cursor for pagination
  "hasMore": true
}`,
          notes:
            "Cursor-based pagination is critical — offset pagination requires scanning skipped rows at the DB level.",
        },
        {
          method: "POST",
          path: "/api/v1/tweets",
          description: "Post a new tweet — triggers fan-out pipeline",
          requestBody: `{
  "content": "Just shipped our new feed ranking model 🚀",
  "mediaIds": ["media_xyz"],     // pre-uploaded via presigned URL
  "replyToTweetId": null         // null for original tweets
}`,
          response: `// 201 Created
{
  "tweetId": "tweet_abc123",
  "createdAt": "2024-01-15T09:00:00Z",
  "status": "published"
}`,
          notes:
            "Media uploaded separately via presigned S3 URL before posting — API server never handles binary data.",
        },
        {
          method: "POST",
          path: "/api/v1/tweets/{tweetId}/like",
          description: "Like a tweet — triggers async counter increment",
          response: `// 200 OK
{ "liked": true, "likeCount": 1421 }`,
          notes: "Like count is eventually consistent — written to Kafka, aggregated in batch. Don't expect the exact count to update atomically.",
        },
      ],
      trap: {
        title: "Offset pagination breaks at social feed scale",
        content: `LIMIT 20 OFFSET 10000 forces the database to scan and discard 10,000 rows before returning 20.
On a feed with billions of entries, this is catastrophically slow.

Cursor-based pagination: WHERE tweet_id < :cursor ORDER BY tweet_id DESC LIMIT 20
Uses the index directly — O(log n) regardless of how deep into the feed you paginate.

Every high-scale feed system uses cursor pagination. The cursor is typically the last tweet_id seen — opaque to the client, efficient at the DB level.`,
      },
    },
    {
      type: "interactive",
      sectionId: "deepDive",
      step: "Step 4 — Deep Dive",
      title: "Core Feed Concepts",
      subtitle:
        "These four concepts separate a naive feed design from one that handles 200M DAU without melting.",
      interaction: {
        type: "flashcard-deck",
        title: "Twitter Feed Deep Dive",
        cards: [
          {
            id: "dc1",
            front: {
              label: "CONCEPT 1",
              title: "Fan-out on Write vs Read",
              subtitle: "Do you pre-compute feeds or compute them on demand?",
              tag: "Critical",
            },
            back: {
              explanation:
                "Fan-out on write: when a tweet is posted, push the tweet ID to all followers' Redis timelines immediately. Feed reads = O(1) Redis sorted set lookup. Fan-out on read: when a user opens their feed, query all followed accounts and merge results. Feed reads = O(n) database queries where n = following count.",
              code: `// Fan-out on write: tweet posted
const followers = await getFollowers(userId)  // could be millions
for (const followerId of followers) {
  await redis.zadd(
    \`timeline:\${followerId}\`,  // sorted set per user
    Date.now(),                 // score = timestamp for ordering
    tweetId
  )
  // Keep only latest 800 tweets
  await redis.zremrangebyrank(\`timeline:\${followerId}\`, 0, -801)
}

// Feed read: single Redis lookup
const tweetIds = await redis.zrevrange(\`timeline:\${userId}\`, 0, 19)`,
              proTip:
                "Twitter uses fan-out on write for users with <10K followers. Above that threshold, tweets are fetched at read time and merged. This hybrid approach keeps both write amplification and read latency under control.",
            },
          },
          {
            id: "dc2",
            front: {
              label: "CONCEPT 2",
              title: "The Celebrity Problem",
              subtitle: "100M followers × every tweet = write amplification disaster",
              tag: "Architecture",
            },
            back: {
              explanation:
                "Pure fan-out on write fails for celebrity accounts. Pushing one tweet to 100M Redis sorted sets takes minutes — by which time the celebrity has tweeted 5 more times. The fan-out workers can never catch up.",
              code: `// Hybrid fan-out logic on tweet post:
const followerCount = await getFollowerCount(authorId)

if (followerCount < 10_000) {
  // Regular user: fan-out on write
  await fanOutToFollowers(tweetId, authorId)
} else {
  // Celebrity: just store the tweet, skip fan-out
  await storeTweet(tweetId, authorId)
  // No fan-out — followers will fetch at read time
}

// Feed read: merge pre-computed + celebrity tweets
async function getFeed(userId) {
  const [cachedFeed, followedCelebrities] = await Promise.all([
    redis.zrevrange(\`timeline:\${userId}\`, 0, 19),  // pre-computed
    getCelebrityFollows(userId)                       // who they follow
  ])
  const celebrityTweets = await fetchRecentTweets(followedCelebrities)
  return rankAndMerge(cachedFeed, celebrityTweets)
}`,
              trap:
                "The 10K follower threshold is tunable and should be based on your fanout worker capacity. Some systems set it as low as 1K during traffic spikes. The key insight: write amplification is proportional to follower count, so the cutoff determines your maximum write load.",
            },
          },
          {
            id: "dc3",
            front: {
              label: "CONCEPT 3",
              title: "ML Feed Ranking",
              subtitle: "Chronological feeds lose 60-70% of potential engagement",
              tag: "Product",
            },
            back: {
              explanation:
                "A user following 500 accounts who checks Twitter at 9 PM has missed 5,000+ tweets since morning. Chronological sorting means they see the most recent 20 — which might be from accounts they barely interact with. ML ranking surfaces the tweets they actually care about.",
              code: `// Simplified ranking signal calculation
function scoreTweet(tweet, viewerId) {
  const signals = {
    recency: timeDecayScore(tweet.createdAt),     // newer = higher
    relationshipStrength: interactionHistory(viewerId, tweet.authorId),
    authorEngagementRate: tweet.author.avgEngagementRate,
    contentType: tweet.hasVideo ? 1.3 : tweet.hasImage ? 1.1 : 1.0,
    networkActivity: friendsWhoLiked(viewerId, tweet.id).length * 0.5,
  }

  // Weighted combination (weights learned from click/engagement data)
  return (
    signals.recency * 0.35 +
    signals.relationshipStrength * 0.30 +
    signals.authorEngagementRate * 0.15 +
    signals.contentType * 0.10 +
    signals.networkActivity * 0.10
  )
}`,
              proTip:
                "In an interview, you don't need to know the exact ML model. The architecture insight is: ranking happens at read time on the candidate set from Redis. The candidate set (pre-computed) is separate from the ranking (computed fresh). This separation is key to why it's fast.",
            },
          },
          {
            id: "dc4",
            front: {
              label: "CONCEPT 4",
              title: "Cache Warm-up Strategy",
              subtitle: "Which 200M feeds do you actually keep in Redis?",
              tag: "Scaling",
            },
            back: {
              explanation:
                "At 200M DAU with 800 tweets cached per user, that's ~5.4TB of Redis. Your cache budget is 2TB. You can't cache everyone — only cache users who will actually use it.",
              code: `// Cache eviction: only active users' feeds stay warm
const ACTIVE_THRESHOLD_DAYS = 7

async function shouldCacheTimeline(userId) {
  const lastActive = await getLastActiveTime(userId)
  const daysSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60 * 24)
  return daysSinceActive <= ACTIVE_THRESHOLD_DAYS
}

// On user login after inactivity: rebuild timeline
async function handleLogin(userId) {
  const hasCache = await redis.exists(\`timeline:\${userId}\`)
  if (!hasCache) {
    // Rebuild from following accounts' recent tweets
    const following = await getFollowing(userId)
    const recentTweets = await fetchRecentTweets(following, limit: 800)
    await populateTimeline(userId, recentTweets)
  }
}`,
              proTip:
                "40% of DAU = 80M users. 80M × 800 tweets × 34 bytes = ~2.2TB. Fits in budget. Inactive user opening the app gets a slightly slower first load (timeline rebuild), but this only happens once. Twitter's actual threshold is around 7 days of inactivity.",
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
        "These tradeoffs are where junior and senior engineers diverge in feed system design.",
      interaction: {
        type: "tradeoff-picker",
        scenarios: [
          {
            id: "t1",
            scenario: "Should tweet storage use SQL or NoSQL?",
            context:
              "1,200 tweet writes/sec. Most queries are: 'get tweets by user_id ordered by created_at'. No complex joins. But analytics teams want to run aggregate queries.",
            options: [
              {
                id: "a",
                label: "SQL (MySQL sharded by user_id) — ACID, queryable, analytics-friendly",
                correct: true,
                consequence:
                  "Twitter actually uses MySQL sharded by user_id. The access pattern (get tweets by user) maps perfectly to SQL with the right shard key. Sharded SQL scales to 1,200 writes/sec easily. Analytics runs on a separate data warehouse, not production DB.",
              },
              {
                id: "b",
                label: "Cassandra — scales writes better, partition by user_id",
                correct: false,
                consequence:
                  "Cassandra is defensible and many social platforms use it. But 1,200 writes/sec is well within MySQL's range with sharding. Cassandra adds operational complexity without solving a problem that exists at this scale.",
              },
            ],
            seniorNote:
              "At tweet write scale (1,200/sec), both SQL and NoSQL work. The deciding factor is the access pattern: 'get user's recent tweets' is perfect for SQL with shard key = user_id. Twitter uses MySQL because the workload fits and SQL gives you ACID guarantees you occasionally need (tweet deletion must be consistent).",
          },
          {
            id: "t2",
            scenario: "How fresh should a user's feed be after they post a tweet?",
            context:
              "Fan-out to 100 followers takes ~500ms. Should the user see their own tweet immediately or wait for fan-out?",
            options: [
              {
                id: "a",
                label: "Optimistic update — show the tweet immediately in the poster's own feed, fan-out async",
                correct: true,
                consequence:
                  "Poster sees their tweet instantly (client-side injection into local feed). Fan-out completes async in the background. Followers see it within seconds. This matches user expectation — you should always see your own tweet immediately.",
              },
              {
                id: "b",
                label: "Wait for fan-out to complete — consistent view for everyone simultaneously",
                correct: false,
                consequence:
                  "Fan-out for a celebrity with 100M followers never fully completes. Waiting blocks the poster from seeing their own tweet. Not a viable UX decision at scale.",
              },
            ],
            seniorNote:
              "Client-side optimistic updates are standard in social feeds. The poster's own timeline gets the tweet injected immediately at the UI layer. The actual fan-out pipeline runs async. This separation of 'what the poster sees' from 'what the fan-out has delivered' is a key design decision — mention it explicitly in interviews.",
          },
          {
            id: "t3",
            scenario: "How do you handle feed delivery to users who are offline when a tweet is posted?",
            context:
              "User A is offline for 3 days. 10,000 tweets are posted by accounts they follow. When they open the app, what do they see?",
            options: [
              {
                id: "a",
                label: "Redis timeline stays intact (capped at 800 tweets). Show newest 20 from those 800 on load",
                correct: true,
                consequence:
                  "Fan-out on write already populated their Redis timeline while they were offline (since they're an active user within the cache window). On load, serve the most recent 800 tweets. The fan-out pipeline kept the cache warm regardless of whether they were online.",
              },
              {
                id: "b",
                label: "Queue all tweets posted while offline and deliver on reconnect",
                correct: false,
                consequence:
                  "Queueing delivery acknowledgement for offline users at Twitter scale (200M users, each potentially offline for days) creates enormous queue management overhead. And you don't need to — the Redis timeline already contains unread tweets.",
              },
              {
                id: "c",
                label: "Rebuild feed from scratch on first load after inactivity",
                correct: false,
                consequence:
                  "Rebuilding on demand is the right approach for users inactive >7 days (outside cache window). But users offline for 3 days are within the cache window — their Redis timeline is already populated. No rebuild needed.",
              },
            ],
            seniorNote:
              "The key insight: fan-out on write populates the cache regardless of whether the user is online. The Redis timeline is a pre-computed window of the latest 800 tweets from your feed. Online/offline status doesn't affect it — it only determines whether you're reading from the cache now or later.",
          },
        ],
      },
    },
    {
      type: "cheatSheet",
      components:
        "Tweet POST → Kafka → Fanout Workers → Redis (sorted set per user) | Feed GET → Redis → ML Ranker → Response",
      numbers: [
        { label: "DAU", value: "200M users" },
        { label: "Tweet write QPS", value: "~1,200 tweets/sec" },
        { label: "Fan-out write QPS", value: "~120,000 Redis writes/sec" },
        { label: "Celebrity threshold", value: "~10K followers" },
        { label: "Cached tweets per user", value: "~800 tweet IDs" },
        { label: "Redis cache size (active users)", value: "~2.2TB" },
      ],
      decisions: [
        {
          decision: "Fan-out on write for regular users",
          why: "Feed reads must be O(1); pre-computation is the only way to hit 200ms at 200M DAU",
        },
        {
          decision: "Fan-out on read for celebrities (>10K followers)",
          why: "100M-follower accounts make write amplification unsustainable",
        },
        {
          decision: "Redis sorted set for pre-computed timelines",
          why: "Sorted by timestamp score; ZREVRANGE fetches top-N in O(log n + N)",
        },
        {
          decision: "Hybrid ML ranking at read time",
          why: "Chronological sort loses 60-70% engagement; ranking happens on cached candidate set",
        },
        {
          decision: "Cache only weekly-active users",
          why: "5.4TB if all users cached; 2.2TB if only active users — fits budget",
        },
      ],
    },
  ],
};
