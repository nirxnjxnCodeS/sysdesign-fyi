export const twitterFeed = {
  id: "twitter-feed",
  title: "Twitter / X Feed",
  scenario:
    "You're the lead engineer at a new social platform. 200 million daily users. Each user follows ~100 accounts. They expect their feed to load in under 200ms. You have one week to design the feed system. Everything breaks if you get the fan-out strategy wrong.",
  decisions: [
    {
      id: 1,
      question:
        "A user posts a tweet. You need to show it to all their followers. What's your first instinct for how to build this?",
      context:
        "This is the fan-out problem. How you answer this determines your entire architecture.",
      options: [
        {
          id: "a",
          text: "When a user opens their feed, fetch tweets from all accounts they follow in real-time",
          correct: false,
          consequence:
            "User follows 500 accounts. You query 500 tables, merge the results, sort by time. That's a K-way merge on every feed load. At 200M DAU loading feeds simultaneously — your database collapses.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "When someone posts, immediately push the tweet ID to every follower's pre-computed feed cache",
          correct: true,
          consequence:
            "Feed reads become a single Redis lookup. Pre-computed, sorted, ready. 200ms target easily met. This is fan-out on write — the right default.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Store all tweets in one table, query by timestamp for each feed load",
          correct: false,
          consequence:
            "One massive table. Every feed load is a full table scan filtered by who the user follows. At 2 billion tweets/day, this table becomes unqueryable within weeks.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Fan-out on write (push model): when a tweet is posted, push the tweet ID to every follower's pre-computed feed in Redis. Feed reads become O(1) Redis lookups. This is what Twitter actually uses for regular users — pre-computed timelines stored in Redis as sorted sets.",
    },
    {
      id: 2,
      question:
        "Elon Musk (100M followers) posts a tweet. Your fan-out system tries to update 100M Redis entries simultaneously. What happens?",
      context: "This is the celebrity problem. It breaks pure fan-out on write.",
      options: [
        {
          id: "a",
          text: "It works fine — Redis is fast enough to handle 100M writes",
          correct: false,
          consequence:
            "100M Redis writes for one tweet. At peak, celebrities tweet multiple times per hour. Your fanout workers are permanently backlogged. Regular users wait minutes for tweets to appear. System melts.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Skip fan-out for celebrities. Instead, merge celebrity tweets at read time when users load their feed",
          correct: true,
          consequence:
            "No write amplification for celebrities. When a user loads their feed: take pre-computed timeline (regular users, fan-out on write) + real-time fetch of celebrity tweets + merge + return. Slightly more read latency but system stays alive.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Limit celebrities to 10 tweets per day",
          correct: false,
          consequence:
            "Elon Musk's lawyers are calling. Not a valid engineering solution.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Hybrid fan-out: regular users (<10K followers) get fan-out on write — tweet pushed to all follower caches. Celebrities (>10K followers) skip fan-out. Instead, their tweets are fetched at read time and merged into the requester's feed. This is exactly what Twitter and Instagram use. The threshold (~10K followers) is tunable.",
    },
    {
      id: 3,
      question:
        "Users complain the feed feels random. They miss important tweets. How do you rank tweets in the feed?",
      context:
        "Chronological vs algorithmic ranking — one of the most controversial product decisions in social media history.",
      options: [
        {
          id: "a",
          text: "Show tweets in reverse chronological order — newest first, no ranking",
          correct: false,
          consequence:
            "User follows 500 accounts. They check Twitter at 9 PM. 3,000 tweets since morning. The most important tweet from their friend at 8 AM is buried under 2,999 others. Engagement collapses.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "ML ranking — score each candidate tweet by predicted engagement and reorder",
          correct: true,
          consequence:
            "Each tweet scored by: relationship strength with author, tweet recency, media type (videos score higher), author engagement rate. Feed shows what the user is most likely to engage with. Engagement increases 3-5x versus chronological. This is what Twitter and Instagram switched to.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Random order — let users discover serendipitously",
          correct: false,
          consequence:
            "Nobody wants a randomised feed. This is not a product anyone uses.",
          consequenceType: "failure",
        },
      ],
      learning:
        "ML ranking is how all major social feeds work today. Key signals: recency (decay function), relationship strength (how often you interact with this author), engagement rate (author's historical engagement), content type (videos and images score higher than text), explicit signals (you liked/retweeted this author before). Ranking happens at read time on the candidate set fetched from the pre-computed timeline.",
    },
    {
      id: 4,
      question:
        "Your feed system needs to store tweet metadata and user relationships. What databases do you use?",
      context:
        "Two different data shapes — choose wrong and you'll hit scale problems.",
      options: [
        {
          id: "a",
          text: "One SQL database for everything — tweets, users, follows",
          correct: false,
          consequence:
            "User relationships (follows) form a graph — SQL handles this poorly. At 200M users each following 100 accounts, that's 20 billion follow relationships. SQL JOIN across 20B rows to build a feed is catastrophically slow.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "SQL for tweets/user profiles + Graph DB for follow relationships + Redis for pre-computed feeds",
          correct: true,
          consequence:
            "SQL stores tweets (structured, queryable). Graph DB (or sharded follows table) stores who-follows-who efficiently. Redis stores pre-computed feed per user as a sorted set. Each tool matches its data shape.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "NoSQL for everything — MongoDB handles all use cases",
          correct: false,
          consequence:
            "MongoDB for social graph queries is painful — no native graph traversal. Feed queries become application-level joins across multiple collections. Slow, complex, wrong tool.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Twitter actually uses: MySQL for user data and tweets (sharded), Redis for pre-computed home timelines, and a separate social graph service (who follows whom). The key insight: each data shape needs its optimal storage. Don't use one database for everything just because it's simpler.",
    },
    {
      id: 5,
      question:
        "Your Redis pre-computed feed cache gets too large. You have 200M users each with up to 800 tweets cached. What's your cache strategy?",
      context:
        "200M users × 800 tweets × ~34 bytes per entry = ~5.4 TB of Redis. Your cache budget is 2TB.",
      options: [
        {
          id: "a",
          text: "Cache every active user's full feed forever",
          correct: false,
          consequence:
            "5.4TB exceeds your budget. And 200M 'active users' includes users who haven't opened Twitter in months. You're caching feeds for people who never load them.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Only cache feeds for users active in the last 7 days. Rebuild on-demand for inactive users",
          correct: true,
          consequence:
            "~40% of users are weekly-active. Cache only those: 80M × 800 entries × 34 bytes ≈ 2.2TB. Fits budget. Inactive user opens app → rebuild their feed from scratch (slightly slower one-time load) → cache it again.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Only cache the last 20 tweets per user",
          correct: false,
          consequence:
            "User scrolls past 20 tweets. Cache miss. Hit the database. At 200M users scrolling simultaneously, your database dies. Cache too shallow defeats the purpose.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Cache only active users (logged in within 7 days). Twitter caches ~800 tweets per active user's home timeline. For inactive users, rebuild the timeline lazily on first load. The 80/20 rule applies: 80% of feed loads come from 20% of users (the most active ones). Cache those 20% perfectly.",
    },
  ],
  finalArchitecture:
    "Post → Fanout Service → Redis (active users) | Celebrity tweets fetched at read time → ML Ranking → Feed",
  score: {
    perfect: "The feed loads. Elon's tweet didn't crash the system. 🐦",
    good: "Solid feed engineer. Celebrity problem is handled.",
    average: "Feed works for most users. Celebrities are causing issues.",
    poor: "The fanout workers are on fire. Users are rioting.",
  },
};
