import type { PrepData } from "./types";

export const googleMapsPrep: PrepData = {
  systemId: "google-maps",
  systemName: "Google Maps",
  sections: [
    {
      type: "interactive",
      sectionId: "requirements",
      step: "Step 1 — Requirements",
      title: "Sort the Requirements",
      subtitle:
        "Google Maps combines routing, real-time traffic, map tile serving, and search — each is a distinct system. Interviewers want to see you separate them.",
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
            text: "Return the fastest route between two locations",
            correctBucket: "functional",
            explanation: "Core routing function — the primary product feature.",
          },
          {
            id: "r2",
            text: "Route must be returned in under 200ms",
            correctBucket: "non-functional",
            explanation: "Routing latency SLA — drives hierarchical pre-computation of the road graph.",
          },
          {
            id: "r3",
            text: "Support 1 billion monthly users",
            correctBucket: "non-functional",
            explanation: "Scale constraint — drives CDN and distributed architecture.",
          },
          {
            id: "r4",
            text: "Show real-time traffic conditions on the map",
            correctBucket: "functional",
            explanation: "Traffic layer is a product feature that users see and depend on.",
          },
          {
            id: "r5",
            text: "Street View 360° imagery",
            correctBucket: "out-of-scope",
            explanation: "Street View is a separate product with its own data pipeline and serving infrastructure.",
          },
          {
            id: "r6",
            text: "50 million active users sending GPS updates — traffic must stay current",
            correctBucket: "non-functional",
            explanation: "GPS ingestion scale — drives the Kafka stream processing architecture.",
          },
          {
            id: "r7",
            text: "Search for places ('coffee near me')",
            correctBucket: "functional",
            explanation: "Location-based search is a distinct functional feature.",
          },
          {
            id: "r8",
            text: "Directions booking and turn-by-turn voice navigation",
            correctBucket: "functional",
            explanation: "Navigation mode is a core feature — requires real-time route updates via WebSocket.",
          },
          {
            id: "r9",
            text: "Re-route users when road conditions change",
            correctBucket: "functional",
            explanation: "Dynamic re-routing is a functional feature that requires event-driven updates.",
          },
          {
            id: "r10",
            text: "Flight and hotel booking integration",
            correctBucket: "out-of-scope",
            explanation: "Third-party booking integrations are a separate product layer — out of scope.",
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
        "GPS ingestion volume and map tile request rate are the two numbers that drive the whole architecture.",
      interaction: {
        type: "estimation-calculator",
        steps: [
          {
            id: "e1",
            label: "Active GPS-sharing users",
            formula: "Given assumption",
            answer: 50000000,
            unit: "users",
            userInput: false,
            hint: "",
            explanation: "50M active navigating users sending GPS at any given time.",
          },
          {
            id: "e2",
            label: "GPS update interval",
            formula: "Given assumption",
            answer: 30,
            unit: "seconds per update",
            userInput: false,
            hint: "",
            explanation: "GPS ping every 30 seconds per navigating user.",
          },
          {
            id: "e3",
            label: "GPS writes per second",
            formula: "50M ÷ 30",
            answer: 1666667,
            unit: "GPS updates/sec",
            userInput: true,
            hint: "Divide active users by update interval",
            explanation: "1.67M GPS writes/second — this is why a single database is impossible and Kafka is necessary.",
          },
          {
            id: "e4",
            label: "Route requests per day",
            formula: "Given assumption",
            answer: 100000000,
            unit: "route requests/day",
            userInput: false,
            hint: "",
            explanation: "100M route calculations per day — Google Maps estimates.",
          },
          {
            id: "e5",
            label: "Route calculation QPS",
            formula: "100M ÷ 86,400",
            answer: 1157,
            unit: "route requests/sec",
            userInput: true,
            hint: "Divide daily route requests by seconds per day",
            explanation: "~1,200 route calculations/sec. With hierarchical pre-computation, each takes <50ms — manageable on a cluster.",
          },
          {
            id: "e6",
            label: "Map tile requests per day",
            formula: "1B monthly users × 50 tiles per session ÷ 30",
            answer: 1666666666,
            unit: "tile requests/day",
            userInput: true,
            hint: "1B users × 50 tiles / 30 days",
            explanation: "~1.67B tile requests/day. With 95% CDN hit rate: only ~83M reach S3 origin. CDN is not optional.",
          },
        ],
        insight:
          "1.67M GPS writes/second is the hardest number in this system. No database handles this without Kafka as a buffer. The second critical insight: 1.67B daily tile requests at 95% CDN hit = only 83M origin requests. CDN is the only reason map tiles are economically viable to serve.",
      },
    },
    {
      type: "apiDesign",
      endpoints: [
        {
          method: "GET",
          path: "/api/v1/directions",
          description: "Get route from origin to destination",
          requestBody: `// Query params:
?origin=12.9716,77.5946
&destination=12.9352,77.6245
&mode=driving               // driving | walking | transit | cycling
&departure_time=now
&alternatives=true          // return multiple route options`,
          response: `// 200 OK
{
  "routes": [
    {
      "summary": "Outer Ring Road",
      "durationSeconds": 1420,
      "distanceMeters": 18500,
      "trafficCondition": "moderate",
      "steps": [
        {
          "instruction": "Turn left onto MG Road",
          "distanceMeters": 2300,
          "durationSeconds": 180
        }
      ],
      "polyline": "encoded_polyline_string"
    }
  ],
  "calculatedAt": "2024-01-15T09:00:00Z"
}`,
          notes:
            "Route calculation uses current traffic layer from Redis. Response includes encoded polyline for client-side rendering — don't send raw coordinate arrays.",
        },
        {
          method: "POST",
          path: "/api/v1/telemetry/location",
          description: "User app sends GPS location during navigation",
          requestBody: `{
  "userId": "user_789",
  "sessionId": "nav_session_abc",
  "lat": 12.9716,
  "lng": 77.5946,
  "speed": 35,              // km/h
  "heading": 45,
  "accuracy": 8,            // meters
  "timestamp": 1705312800000
}`,
          response: `// 200 OK - fire and forget
{ "received": true }`,
          notes:
            "This endpoint is called every 30 seconds by 50M navigating users. Writes to Kafka immediately — never blocks on database writes. Kafka consumers aggregate into the traffic layer.",
        },
        {
          method: "GET",
          path: "/tiles/{zoom}/{x}/{y}.png",
          description: "Fetch a map tile at given zoom level and coordinates",
          response: `// 200 OK — binary PNG tile (~15-50KB)
// Served directly by CDN in most cases
// Headers:
Cache-Control: public, max-age=86400  // tiles updated daily
ETag: "abc123"`,
          notes:
            "Tile coordinates use the slippy map (XYZ) convention. Tiles at low zoom are stable (world map barely changes). High-zoom tiles refresh daily for road changes.",
        },
      ],
      trap: {
        title: "Running Dijkstra on the raw road graph for every request",
        content: `The world's road network has 20 million nodes. Naive Dijkstra: O(E log V).
On 20M nodes, this takes minutes per query. At 1,200 route requests/second, this is impossible.

The fix: Contraction Hierarchies (CH) preprocessing.
1. Offline: pre-process the graph, identify "important" nodes (highway junctions, city centers)
2. Build a contracted graph: skip less-important nodes, add shortcut edges
3. At runtime: run bidirectional Dijkstra on the contracted graph (~thousands of nodes)

Result: route calculation on a global road network takes <200ms instead of minutes.

The key insight for interviews: the road graph is pre-processed, not queried raw.
This is why Google Maps can return routes in under a second — the hard work happens offline.`,
      },
    },
    {
      type: "interactive",
      sectionId: "deepDive",
      step: "Step 4 — Deep Dive",
      title: "Core Maps Concepts",
      subtitle:
        "Three concepts covering the hardest sub-problems in mapping systems.",
      interaction: {
        type: "flashcard-deck",
        title: "Google Maps Deep Dive",
        cards: [
          {
            id: "dc1",
            front: {
              label: "CONCEPT 1",
              title: "Map Tile Pyramid",
              subtitle: "How the entire world fits in a pre-rendered cache",
              tag: "Architecture",
            },
            back: {
              explanation:
                "The world is divided into a grid at each zoom level. Zoom 0 = 1 tile (whole world). Each zoom level quadruples the tile count. At zoom 15 (city block level), there are 1 billion tiles. All pre-rendered offline, stored in S3, cached by CDN.",
              code: `// Tile coordinate system (XYZ / 'slippy map' convention)
// At zoom level z: there are 2^z × 2^z tiles
// Tile covers: (360 / 2^z) degrees longitude

// Tile count by zoom level:
// z=0:  1 tile  (whole world)
// z=5:  1,024 tiles  (continents)
// z=10: 1,048,576 tiles  (cities)
// z=15: 1,073,741,824 tiles  (city blocks) ← most common zoom

// URL structure used by all mapping APIs:
// /tiles/{zoom}/{x}/{y}.png
// e.g., /tiles/15/1234/5678.png

// Pre-rendering at z=15: 1B tiles × ~25KB avg = ~25TB of tile storage
// CDN caches the hot tiles; most tiles near major cities get cache hits

// Tile update cadence:
// z < 10: monthly updates (continent/country level rarely changes)
// z 10-14: weekly updates (new roads, buildings)
// z >= 15: daily updates (real-time road closures, construction)`,
              proTip:
                "Don't try to remember the tile counts — derive them. 2^z × 2^z tiles at zoom z. What matters for interviews: tiles are immutable snapshots, CDN is mandatory, and high-zoom tiles need more frequent updates than low-zoom.",
            },
          },
          {
            id: "dc2",
            front: {
              label: "CONCEPT 2",
              title: "Real-Time Traffic Layer",
              subtitle: "How 50M phones become a traffic sensor network",
              tag: "Critical",
            },
            back: {
              explanation:
                "Every phone running Google Maps with location sharing enabled anonymously contributes speed data. Kafka aggregates 1.67M pings/second. Stream processors compute average speed per road segment per time window and update the traffic layer in Redis.",
              code: `// Kafka Streams: aggregate GPS data per road segment
const trafficStream = kafka
  .stream('gps_telemetry')
  .groupBy(event => mapToRoadSegment(event.lat, event.lng))
  .windowedBy(TimeWindows.of(Duration.ofMinutes(5)))
  .aggregate(() => ({ speeds: [], count: 0 }), (segment, event, agg) => ({
    speeds: [...agg.speeds, event.speed],
    count: agg.count + 1
  }))
  .mapValues(agg => ({
    avgSpeed: average(agg.speeds),
    sampleCount: agg.count,
    congestion: classifyCongestion(average(agg.speeds))
    // FREE_FLOW | LIGHT | MODERATE | HEAVY | STOP_AND_GO
  }))

trafficStream.to('traffic_conditions')

// Consumer updates Redis:
kafka.consume('traffic_conditions', async (segment) => {
  await redis.hset('traffic', segment.id, JSON.stringify(segment))
  await redis.expire(\`traffic:\${segment.id}\`, 600)  // 10-min TTL
})

// Route calculation queries Redis for current speeds:
async function getSegmentSpeed(segmentId) {
  const cached = await redis.hget('traffic', segmentId)
  return cached ? JSON.parse(cached).avgSpeed : DEFAULT_SPEED
}`,
              proTip:
                "The 5-minute window is a key design choice: shorter windows are noisier (one fast car makes a road look clear), longer windows miss the traffic jam that just appeared. 5 minutes balances freshness vs noise. Google Maps uses shorter windows for highway segments (fast-changing) and longer for city streets (slower-changing).",
            },
          },
          {
            id: "dc3",
            front: {
              label: "CONCEPT 3",
              title: "Location-Based Search (Two-Phase)",
              subtitle: "Find 'coffee near me' in 500ms across millions of POIs",
              tag: "Indexing",
            },
            back: {
              explanation:
                "Full-text search across millions of POIs is too slow. Proximity filtering is also slow on its own. The solution: two-phase search — narrow by geography first, then rank by text relevance.",
              code: `// Phase 1: Geospatial filter (Redis GEORADIUS)
// Find all POIs within 2km radius — O(log n + m)
const nearbyPoiIds = await redis.georadius(
  'pois:bangalore',
  userLng, userLat,
  2, 'km',
  'ASC', 'COUNT', 500   // at most 500 nearby candidates
)

// Phase 2: Text ranking (Elasticsearch)
// Search only among the 500 nearby candidates
const results = await elasticsearch.search({
  index: 'pois',
  query: {
    bool: {
      must: {
        multi_match: {
          query: 'coffee',
          fields: ['name^3', 'category^2', 'description']
        }
      },
      filter: {
        ids: { values: nearbyPoiIds }  // only search these 500
      }
    }
  },
  sort: [
    { _score: 'desc' },           // text relevance
    { rating: 'desc' },           // review rating
    { review_count: 'desc' }      // popularity
  ],
  size: 20
})`,
              proTip:
                "The order matters: geospatial first (fast), text search second (expensive). Doing it in reverse — text search 10M POIs, then filter by location — is orders of magnitude slower. Always narrow by geography before applying text ranking.",
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
      subtitle: "Maps tradeoffs involve freshness vs. performance across multiple data types.",
      interaction: {
        type: "tradeoff-picker",
        scenarios: [
          {
            id: "t1",
            scenario: "How fresh should the traffic layer be?",
            context:
              "Fresher data requires more processing. A 1-minute traffic window is fresher but noisier than a 5-minute window.",
            options: [
              {
                id: "a",
                label: "5-minute aggregation windows — balance freshness vs. noise",
                correct: true,
                consequence:
                  "5-minute window averages out outliers (one speeding car doesn't show as 'free flow'). Traffic conditions change at minute-level scale — 5 minutes is fresh enough. Used by most navigation apps.",
              },
              {
                id: "b",
                label: "30-second windows — maximum freshness",
                correct: false,
                consequence:
                  "30-second windows are extremely noisy. A single emergency vehicle at 80km/h makes the segment look clear. Small sample sizes mean random variance in speed readings. And 12x more aggregation jobs to run.",
              },
            ],
            seniorNote:
              "The right aggregation window depends on how fast the underlying phenomenon changes. Traffic jams develop over minutes, not seconds. 5-minute windows balance: enough samples to be statistically meaningful, fresh enough to reflect current conditions. Different road types might use different windows (highways: 2 min; city streets: 5 min).",
          },
          {
            id: "t2",
            scenario: "How do you handle map data updates (new roads, building changes)?",
            context:
              "Map data changes continuously: new roads built, streets renamed, buildings demolished. How often do you re-render tiles?",
            options: [
              {
                id: "a",
                label: "Tiered refresh: high-zoom tiles (city blocks) daily; low-zoom tiles weekly/monthly",
                correct: true,
                consequence:
                  "City-block-level tiles (z15+) change most often — road closures, new buildings. World/continent tiles (z0-10) are stable for months. Tiered refresh minimizes unnecessary re-rendering while keeping high-zoom tiles current.",
              },
              {
                id: "b",
                label: "Re-render all tiles daily — always fresh, cache TTL = 24 hours",
                correct: false,
                consequence:
                  "1B+ tiles × daily re-render = enormous compute cost. And the world map (z0) doesn't change from day to day. Re-rendering all zoom levels daily wastes resources without benefit.",
              },
            ],
            seniorNote:
              "Tiered refresh is standard in mapping systems. The insight: tile update frequency should match the rate of change of the underlying data. Low zoom levels (countries, continents) are stable for weeks. High zoom levels (streets, buildings) need daily updates. CDN TTL should match the update cadence: Cache-Control: max-age=86400 for z15+, max-age=604800 for z5-10.",
          },
        ],
      },
    },
    {
      type: "cheatSheet",
      components:
        "GPS Telemetry → Kafka → Stream Processor → Redis (traffic layer) | Route Request → Contracted Graph Algorithm → Response | Map Tiles → S3 → CDN",
      numbers: [
        { label: "Monthly active users", value: "1 billion" },
        { label: "GPS writes per second", value: "1.67 million" },
        { label: "Daily route calculations", value: "~100 million" },
        { label: "Route calculation SLA", value: "<200ms" },
        { label: "Daily tile requests", value: "~1.67 billion" },
        { label: "CDN hit rate (tiles)", value: "~95%" },
      ],
      decisions: [
        {
          decision: "Hierarchical routing (Contraction Hierarchies)",
          why: "Raw Dijkstra on 20M nodes takes minutes; contracted graph reduces to thousands of nodes",
        },
        {
          decision: "Kafka for GPS telemetry ingestion",
          why: "1.67M writes/sec exceeds any single database; Kafka absorbs and fans out to consumers",
        },
        {
          decision: "Redis for real-time traffic layer",
          why: "Traffic data is read 1,200 times/sec during routing; needs sub-millisecond lookup",
        },
        {
          decision: "Pre-rendered tile pyramid + CDN",
          why: "1.67B daily tile requests; tiles are immutable snapshots — perfect for aggressive CDN caching",
        },
        {
          decision: "Two-phase geospatial search",
          why: "Geospatial filter narrows from millions to hundreds of POIs before expensive text ranking",
        },
      ],
    },
  ],
};
