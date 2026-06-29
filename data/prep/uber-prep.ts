import type { PrepData } from "./types";

export const uberPrep: PrepData = {
  systemId: "uber",
  systemName: "Uber / Ride Sharing",
  sections: [
    {
      type: "interactive",
      sectionId: "requirements",
      step: "Step 1 — Requirements",
      title: "Sort the Requirements",
      subtitle:
        "Ride-sharing design has a tight set of core constraints. Interviewers want to see you isolate the matching problem from billing and other adjacent concerns.",
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
            text: "Rider requests a ride and gets matched to a nearby driver",
            correctBucket: "functional",
            explanation: "The core matching function — the primary problem to solve.",
          },
          {
            id: "r2",
            text: "Driver match must happen within 5 seconds of request",
            correctBucket: "non-functional",
            explanation: "Matching latency SLA — drives the geospatial indexing design.",
          },
          {
            id: "r3",
            text: "One ride request must never be sent to two drivers simultaneously",
            correctBucket: "non-functional",
            explanation: "Double-dispatch prevention — a correctness constraint, not a feature.",
          },
          {
            id: "r4",
            text: "Rider can see driver location moving on the map in real-time",
            correctBucket: "functional",
            explanation: "Live location tracking — requires WebSocket push, not polling.",
          },
          {
            id: "r5",
            text: "100,000 concurrent drivers sending GPS updates every 4 seconds",
            correctBucket: "non-functional",
            explanation: "GPS ingestion scale — drives the Kafka + Redis geospatial architecture.",
          },
          {
            id: "r6",
            text: "Payment processing and charging the rider after the ride",
            correctBucket: "out-of-scope",
            explanation: "Payments are a separate system — different ACID requirements, different service.",
          },
          {
            id: "r7",
            text: "Surge pricing during high demand",
            correctBucket: "functional",
            explanation: "Surge pricing affects what price is shown — a product feature of the matching flow.",
          },
          {
            id: "r8",
            text: "Driver ratings and reputation system",
            correctBucket: "out-of-scope",
            explanation: "Ratings are a post-ride feature — separate service, separate data model.",
          },
          {
            id: "r9",
            text: "System must handle city-level geographic sharding",
            correctBucket: "non-functional",
            explanation: "Geographic partitioning is a scalability constraint for the location index.",
          },
          {
            id: "r10",
            text: "Estimated time of arrival (ETA) calculation",
            correctBucket: "functional",
            explanation: "ETA is shown before ride acceptance — a functional feature that queries the routing service.",
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
        "The GPS write volume and matching QPS determine your entire infrastructure.",
      interaction: {
        type: "estimation-calculator",
        steps: [
          {
            id: "e1",
            label: "Concurrent active drivers",
            formula: "Given assumption",
            answer: 100000,
            unit: "drivers",
            userInput: false,
            hint: "",
            explanation: "100,000 concurrent drivers — comparable to Uber in a major city cluster.",
          },
          {
            id: "e2",
            label: "GPS update frequency",
            formula: "Given assumption",
            answer: 0.25,
            unit: "updates/sec per driver",
            userInput: false,
            hint: "",
            explanation: "Every 4 seconds = 0.25 updates/second per driver.",
          },
          {
            id: "e3",
            label: "Total GPS writes per second",
            formula: "100,000 × 0.25",
            answer: 25000,
            unit: "GPS updates/sec",
            userInput: true,
            hint: "Multiply active drivers by update frequency",
            explanation: "25,000 GPS writes/second — too high for a standard SQL database, perfect for Kafka + Redis.",
          },
          {
            id: "e4",
            label: "Ride requests per second (peak)",
            formula: "Given assumption",
            answer: 5000,
            unit: "requests/sec",
            userInput: false,
            hint: "",
            explanation: "5,000 ride requests/sec at peak — each requiring a geospatial lookup and driver match.",
          },
          {
            id: "e5",
            label: "Redis memory for driver locations",
            formula: "100K drivers × ~64 bytes per geohash entry",
            answer: 6400000,
            unit: "bytes",
            userInput: true,
            hint: "Multiply drivers by ~64 bytes per entry",
            explanation: "~6.4MB for all driver locations. Trivially small for Redis — the entire active driver location index fits in memory easily.",
          },
          {
            id: "e6",
            label: "Concurrent active rides (WebSocket connections)",
            formula: "Given assumption",
            answer: 500000,
            unit: "active rides",
            userInput: false,
            hint: "",
            explanation: "500K concurrent rides = 500K WebSocket connections per rider + 500K per driver = 1M total WebSocket connections. Need ~20 WebSocket servers at 50K connections each.",
          },
        ],
        insight:
          "25,000 GPS writes/second is the defining constraint. Standard SQL collapses at this rate. Redis handles it trivially (it's built for high-frequency small writes). The other key number: 6.4MB for the entire driver location index. It all fits in memory — which is why Redis GEOSET (not a geospatial database) is the right tool.",
      },
    },
    {
      type: "apiDesign",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/rides/request",
          description: "Rider requests a ride — triggers driver matching",
          requestBody: `{
  "riderId": "user_789",
  "pickupLocation": { "lat": 12.9716, "lng": 77.5946 },
  "dropoffLocation": { "lat": 12.9352, "lng": 77.6245 },
  "rideType": "standard"   // standard | premium | pool
}`,
          response: `// 200 OK — match found
{
  "rideId": "ride_abc123",
  "driver": {
    "id": "driver_456",
    "name": "Ravi Kumar",
    "rating": 4.8,
    "vehicle": "Honda City, KA-01-AB-1234"
  },
  "etaSeconds": 240,
  "surgeMultiplier": 1.4,   // 1.0 = no surge
  "estimatedFare": 185
}`,
          notes:
            "Response includes surge multiplier — calculated by pricing service based on demand/supply ratio in this geohash cell.",
        },
        {
          method: "PATCH",
          path: "/api/v1/drivers/{driverId}/location",
          description: "Driver app updates GPS location — high frequency",
          requestBody: `{
  "lat": 12.9716,
  "lng": 77.5946,
  "heading": 45,
  "speed": 28,
  "timestamp": 1705312800000
}`,
          response: `// 200 OK
{ "received": true }`,
          notes:
            "This endpoint is called every 4 seconds per driver. Writes to Kafka — not directly to Redis. Kafka consumers update Redis GEOSET asynchronously.",
        },
        {
          method: "WS",
          path: "wss://api.uber.com/v1/rides/{rideId}/track",
          description: "Real-time driver location stream to rider",
          response: `// Server pushes every 4 seconds during active ride:
{
  "type": "location_update",
  "driverLocation": { "lat": 12.9756, "lng": 77.5987 },
  "etaSeconds": 180,
  "routePolyline": "encoded_polyline_string"
}`,
          notes:
            "WebSocket connection maintained per active ride. Server pushes when driver location updates in Redis. Rider app renders smooth movement client-side.",
        },
      ],
      trap: {
        title: "The double-dispatch race condition is harder than it looks",
        content: `Naive approach: find 5 nearby drivers, send ride request to all simultaneously, first to accept wins.
Problem: Drivers A and B both accept at the exact same millisecond. Both get confirmed. Two drivers now navigating to same rider.

Fix: Redis distributed lock with SETNX (Set if Not eXists):
  SETNX driver:456:lock ride_abc123  // "lock this driver for this ride"
  EXPIRE driver:456:lock 10          // 10-second TTL (driver response window)

First request acquires the lock. Second request finds key exists — driver is locked, try next candidate.

The atomic nature of SETNX is critical. Redis is single-threaded — there is no race condition in SETNX. This is why Redis distributed locks work: the check and set happen atomically.`,
      },
    },
    {
      type: "interactive",
      sectionId: "deepDive",
      step: "Step 4 — Deep Dive",
      title: "Core Ride-Sharing Concepts",
      subtitle:
        "These concepts cover the three hardest problems in ride-sharing system design.",
      interaction: {
        type: "flashcard-deck",
        title: "Uber Deep Dive",
        cards: [
          {
            id: "dc1",
            front: {
              label: "CONCEPT 1",
              title: "Geohashing for Proximity Search",
              subtitle: "How to find nearby drivers in microseconds",
              tag: "Critical",
            },
            back: {
              explanation:
                "Raw lat/lng can't be efficiently queried for proximity. Geohashing encodes any location into a string where nearby locations share the same prefix. 'Find drivers within 2km' becomes a Redis prefix scan — O(1) instead of O(n) distance calculations.",
              code: `// Driver sends GPS update
const geohash = encodeGeohash(12.9716, 77.5946, precision: 7)
// → "tdr1wz5" (7-char = ~150m cell accuracy)

// Redis: store driver's geohash
await redis.geoadd('drivers:online', 77.5946, 12.9716, 'driver:456')

// Rider requests ride at their location
const nearbyDrivers = await redis.georadius(
  'drivers:online',
  77.5946, 12.9716,  // rider's lng, lat
  2,                 // 2km radius
  'km',
  'ASC',             // sorted by distance
  'COUNT', 10        // top 10 nearest
)
// Returns: ['driver:456', 'driver:789', ...]
// All in ~1ms regardless of total driver count`,
              proTip:
                "Redis has native geospatial commands (GEOADD, GEORADIUS, GEODIST). The internal storage uses a geohash at 52-bit precision. For Uber's use case, this is exactly the right tool — ephemeral location data, high write frequency, proximity queries.",
            },
          },
          {
            id: "dc2",
            front: {
              label: "CONCEPT 2",
              title: "Surge Pricing Architecture",
              subtitle: "How demand/supply ratio becomes a price in real-time",
              tag: "Architecture",
            },
            back: {
              explanation:
                "Surge pricing is not just a business decision — it's a distributed systems problem. The pricing service must continuously monitor demand (ride requests) and supply (available drivers) per geographic cell and update surge multipliers in near-real-time.",
              code: `// Kafka stream processing for surge calculation
// Runs every 60 seconds per geohash cell

const SURGE_WINDOW = 60_000  // 1 minute

// Aggregate from Kafka streams
const demandSignals = await kafka.consume('ride_requests', {
  geohash: 'tdr1wz',  // city-block level
  window: SURGE_WINDOW
})

const supplySignals = await kafka.consume('driver_locations', {
  geohash: 'tdr1wz',
  status: 'available',
  window: SURGE_WINDOW
})

const surgeMultiplier = calculateSurge(
  demandSignals.count,  // ride requests in last minute
  supplySignals.count   // available drivers in cell
)

// Store surge factor per cell for pricing lookups
await redis.set(\`surge:tdr1wz\`, surgeMultiplier, 'EX', 120)

// Rider's ride request checks surge:
const cellGeohash = encodeGeohash(riderLat, riderLng, precision: 6)
const surge = await redis.get(\`surge:\${cellGeohash}\`) ?? 1.0`,
              proTip:
                "The geohash precision for surge calculation (6 chars ≈ 1.2km cells) differs from driver matching (7 chars ≈ 150m cells). Surge is calculated at neighborhood level; matching happens at street level. Different precision for different problems.",
            },
          },
          {
            id: "dc3",
            front: {
              label: "CONCEPT 3",
              title: "GPS Telemetry Pipeline",
              subtitle: "25,000 location updates per second — without losing any",
              tag: "Scale",
            },
            back: {
              explanation:
                "25,000 GPS writes/second cannot go directly to Redis or a database. The write burst during rush hour (all drivers simultaneously updating) would overwhelm any single server. Kafka absorbs the burst; Redis is updated at a controlled rate by consumers.",
              code: `// Driver app: fire-and-forget GPS updates
// Every 4 seconds:
await fetch('/api/v1/drivers/456/location', {
  method: 'PATCH',
  body: JSON.stringify({ lat: 12.9716, lng: 77.5946 })
})
// Server writes to Kafka topic 'driver_locations'

// Location consumer (runs on multiple workers):
kafka.consume('driver_locations', async (message) => {
  const { driverId, lat, lng } = message

  // Update Redis GEOSET (O(log n))
  await redis.geoadd('drivers:online', lng, lat, \`driver:\${driverId}\`)

  // Set TTL: if no update for 30 sec, driver considered offline
  await redis.expire(\`driver:\${driverId}:active\`, 30)

  // If driver has active ride: push to rider's WebSocket
  const activeRide = await redis.get(\`driver:\${driverId}:ride\`)
  if (activeRide) {
    await websocketServer.push(\`ride:\${activeRide}\`, {
      type: 'location_update',
      lat, lng
    })
  }
})`,
              proTip:
                "Kafka decouples the write burst from the Redis update rate. During rush hour, Kafka buffers the GPS spike. Consumers process at their own pace. The rider's map still updates smoothly because the consumer lag is typically under 500ms — well within the 4-second GPS update interval.",
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
        "Ride-sharing tradeoffs involve real-world consequences — wrong choices mean drivers and riders having bad experiences.",
      interaction: {
        type: "tradeoff-picker",
        scenarios: [
          {
            id: "t1",
            scenario: "Should GPS updates go directly to Redis or through Kafka first?",
            context:
              "25,000 GPS writes/second. Redis handles ~1M ops/sec. So direct writes technically work. But should they?",
            options: [
              {
                id: "a",
                label: "Kafka first — decouple GPS ingestion from Redis updates",
                correct: true,
                consequence:
                  "Kafka absorbs burst spikes (rush hour: 2x normal GPS volume). Multiple consumers can process the stream independently — one updates Redis, one builds traffic data, one logs for analytics. Decoupled, fault-tolerant, extensible.",
              },
              {
                id: "b",
                label: "Direct to Redis — it's fast enough and simpler",
                correct: false,
                consequence:
                  "Technically works at 25K/sec. But you lose: (1) durability if Redis fails, (2) ability to replay GPS events for analytics, (3) decoupling from downstream consumers. Every additional GPS consumer (traffic, analytics, ETA) adds direct load to Redis.",
              },
            ],
            seniorNote:
              "The Kafka-first decision isn't about Redis capacity — it's about separation of concerns. GPS telemetry is raw input data. Redis is operational state. Keeping them separate via Kafka means you can replay GPS events for debugging, add new consumers without changing the driver app, and handle Redis failures without losing GPS data.",
          },
          {
            id: "t2",
            scenario: "How do you handle a driver who goes offline mid-ride?",
            context:
              "Driver's phone battery dies at 60% of the ride. The WebSocket disconnects. The rider is in the car but the app shows 'connection lost'.",
            options: [
              {
                id: "a",
                label: "Rider app reconnects via WebSocket and resumes tracking from last known location",
                correct: true,
                consequence:
                  "Client reconnects with rideId and last known GPS timestamp. Server resumes pushing updates once driver's phone reconnects. Ride state (REQUESTED → IN_PROGRESS) is in SQL — persists through disconnection. The map shows last known position during gap.",
              },
              {
                id: "b",
                label: "Cancel the ride and refund the rider if WebSocket drops for >30 seconds",
                correct: false,
                consequence:
                  "Phone tunnels, dead zones, and battery issues cause WebSocket drops frequently. Cancelling rides on network hiccups would cancel 20% of all rides. Not a viable product decision.",
              },
            ],
            seniorNote:
              "Ride state must be stored durably in SQL, not in memory or WebSocket session. The WebSocket is just a delivery channel — if it breaks, the ride continues. This separation (durable state in DB, real-time delivery via WebSocket) is the fundamental pattern for any real-time stateful system.",
          },
        ],
      },
    },
    {
      type: "cheatSheet",
      components:
        "Driver GPS → Kafka → Location Consumer → Redis GEOSET | Ride Request → Match Service (Redis GEORADIUS + distributed lock) → WebSocket → Rider",
      numbers: [
        { label: "Concurrent drivers", value: "100,000" },
        { label: "GPS write QPS", value: "25,000 updates/sec" },
        { label: "Driver location index size", value: "~6.4MB in Redis" },
        { label: "Concurrent active rides", value: "~500,000" },
        { label: "WebSocket connections", value: "~1M (rider + driver per ride)" },
        { label: "Match SLA", value: "<5 seconds" },
      ],
      decisions: [
        {
          decision: "Redis GEOSET for driver locations",
          why: "Native geospatial commands; GEORADIUS finds nearby drivers in O(log n); entire index fits in 6MB",
        },
        {
          decision: "Kafka for GPS telemetry ingestion",
          why: "Absorbs burst spikes; decouples ingestion from consumers; GPS events replayable for analytics",
        },
        {
          decision: "Redis SETNX for distributed locks",
          why: "Prevents double-dispatch atomically; TTL ensures lock release even on driver crash",
        },
        {
          decision: "SQL for ride records",
          why: "ACID is mandatory — money changes hands; ride state (REQUESTED → COMPLETED) must be durable",
        },
        {
          decision: "WebSockets for real-time location push",
          why: "Server pushes driver GPS to rider without polling; 1M connections across ~20 servers",
        },
      ],
    },
  ],
};
