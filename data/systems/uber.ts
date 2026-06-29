export const uber = {
  id: "uber",
  title: "Uber / Ride Sharing",
  scenario:
    "You're the first engineer at a ride-sharing startup. Week one: the app needs to find drivers near a rider and match them within 5 seconds. 100,000 concurrent drivers sending GPS updates every 4 seconds. One rider request should never be sent to two drivers. Let's build it.",
  decisions: [
    {
      id: 1,
      question:
        "100,000 drivers are online, each sending their GPS location every 4 seconds. That's 25,000 location updates per second. A rider requests a ride — you need to find nearby drivers instantly. How do you store and query driver locations?",
      context:
        "Raw latitude/longitude is useless for 'find nearby' queries. Think about how geography can be indexed.",
      options: [
        {
          id: "a",
          text: "Store lat/lng in a SQL table, query with WHERE distance < 2km calculation",
          correct: false,
          consequence:
            "Distance formula (Haversine) on every row, every query. With 100,000 drivers, that's 100,000 calculations per ride request. At scale, this takes seconds. Riders get frustrated.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Use geohashing — encode each location into a string where nearby locations share the same prefix",
          correct: true,
          consequence:
            "Driver at (12.9716, 77.5946) encodes to geohash '7zzzzz'. Nearby locations share prefix '7zzz'. Finding nearby drivers becomes a Redis prefix lookup — microseconds, not seconds.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Store locations in memory on one server, scan all 100,000 drivers per request",
          correct: false,
          consequence:
            "One server, 100,000 drivers, 25,000 updates/second. Server CPU maxes out. Single point of failure. Cannot scale past one city.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Geohashing divides Earth into a grid of cells with string IDs. Nearby locations share common prefixes. 'Find drivers within 2km' becomes 'find all geohash keys with prefix X' — a Redis scan that takes microseconds. Uber uses Google's S2 library (similar concept). This is the core insight of Uber's location system.",
    },
    {
      id: 2,
      question:
        "A rider requests a ride. Your system finds 5 nearby drivers. You send the request to Driver A. While Driver A is deciding, you also send it to Driver B. Both accept. Now two drivers are heading to the same rider. How do you prevent this?",
      context:
        "This is the double-dispatch problem — a race condition with real-world consequences.",
      options: [
        {
          id: "a",
          text: "First driver to accept gets the ride — handle conflicts in the app UI",
          correct: false,
          consequence:
            "Both drivers are already navigating to the rider. Both drivers wasted fuel. Rider gets two cars. This destroys driver trust and your rating.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Use a distributed lock on the driver ID — only one request can be assigned to a driver at a time",
          correct: true,
          consequence:
            "Redis SETNX (set if not exists) on driver_id. First ride request acquires the lock. Second request for the same driver fails — that driver is already locked. No double dispatch.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Send the request to only one driver at a time, wait for response before trying next",
          correct: false,
          consequence:
            "Driver A takes 8 seconds to respond. Rider waited 8 seconds for nothing. Then Driver B takes 6 seconds. Average wait: 10+ seconds per ride request. Users immediately switch to competitors.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Distributed lock with Redis SETNX: when a ride is offered to Driver A, set key 'driver:A:lock' with TTL of 10 seconds. If Driver B is offered the same ride simultaneously, the lock check fails — Driver A is locked. Lock releases when driver accepts/declines or TTL expires. This prevents double-dispatch atomically.",
    },
    {
      id: 3,
      question:
        "The ride is matched. Now the rider needs to see the driver's location moving on the map in real-time. The driver sends GPS updates every 4 seconds. How do you get those updates to the rider?",
      context:
        "Same real-time problem you've seen before — but now it's location data, not messages.",
      options: [
        {
          id: "a",
          text: "Rider app polls the server every second — 'where is my driver?'",
          correct: false,
          consequence:
            "1 request/second × 1M concurrent rides = 1M API calls/second just for location polling. Your servers are doing nothing but answering 'same as before' 80% of the time.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "WebSocket connection — driver app streams location to server, server pushes to rider app",
          correct: true,
          consequence:
            "One persistent connection per active ride. Driver sends GPS → server → instantly pushed to rider's WebSocket. Rider sees smooth movement. 1M rides = 1M WebSocket connections — need 20+ servers but manageable.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "SMS the rider the driver's location every 30 seconds",
          correct: false,
          consequence:
            "Prohibitive SMS costs × 1M active rides. Also 30-second updates means the map barely moves. Terrible UX.",
          consequenceType: "failure",
        },
      ],
      learning:
        "WebSockets for real-time location streaming — same pattern as chat and stock tickers. The difference here: Kafka sits between the driver location ingestion and the WebSocket push. Driver GPS → Kafka (durable) → Location service → WebSocket → rider. Kafka decouples GPS ingestion from delivery, absorbing spikes during rush hour.",
    },
    {
      id: 4,
      question:
        "New Year's Eve. Every user in Bangalore requests Uber simultaneously. Demand spikes 10x. Supply stays the same. How does Uber respond?",
      context:
        "Surge pricing is a system design problem, not just a business decision.",
      options: [
        {
          id: "a",
          text: "Serve requests first-come-first-served — fair to users, system stays stable",
          correct: false,
          consequence:
            "With 10x demand and 1x supply, 90% of requests find no driver and fail. Users get error screens. Drivers who are available get assigned but at normal prices — no incentive for off-duty drivers to come online.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Dynamic surge pricing — multiply base fare by demand/supply ratio to attract more drivers and reduce demand",
          correct: true,
          consequence:
            "Price doubles. Some riders cancel (demand drops). Off-duty drivers see high earnings and come online (supply increases). System rebalances. Riders who really need a ride get one at higher price. Drivers earn more. Classic supply-demand economics.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Cap the number of simultaneous requests — only 10,000 users can request at a time",
          correct: false,
          consequence:
            "You arbitrarily block 90% of users from even trying. They immediately open a competitor app. You lose market share permanently.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Surge pricing is implemented by the pricing service monitoring demand (ride requests per minute per geohash cell) and supply (available drivers per geohash cell). Surge multiplier = f(demand/supply). This updates every few minutes per geographic cell. The system design challenge: real-time aggregation of demand and supply signals per geographic region using Kafka streams.",
    },
    {
      id: 5,
      question:
        "How do you store the data for this system? You have: driver locations (ephemeral, high write), ride records (must never be lost), and geospatial index (needs fast prefix queries).",
      context:
        "Three different data types with completely different requirements — one database won't serve all three well.",
      options: [
        {
          id: "a",
          text: "PostgreSQL for everything — ACID compliance handles all cases",
          correct: false,
          consequence:
            "Geospatial prefix queries on PostgreSQL require PostGIS and are slow at scale. 25,000 location writes/second overwhelms a single PostgreSQL primary. Wrong tool for all three cases.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Redis for live locations + geospatial index | SQL for ride records | Kafka for location event stream",
          correct: true,
          consequence:
            "Redis: GEOADD for driver locations (built-in geospatial commands), expired automatically via TTL when driver goes offline. SQL: ride records with ACID guarantees — money is involved. Kafka: absorbs 25,000 GPS writes/second, durable, consumers process at their own rate.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "One MongoDB cluster for everything — flexible schema handles all cases",
          correct: false,
          consequence:
            "MongoDB's geospatial support is limited. Ride records without ACID transactions risk double charging. 25,000 writes/second to one MongoDB cluster causes write bottlenecks. Jack of all trades, master of none.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Redis GEOSET: native geospatial commands. GEOADD stores lat/lng with automatic geohash indexing. GEORADIUS finds all drivers within X km in one command. Perfect for ephemeral, fast-changing location data. SQL for ride records (ACID is mandatory when money changes hands). Kafka for the write firehose. Three tools, three different jobs.",
    },
  ],
  finalArchitecture:
    "Driver GPS → Kafka → Location Service (Redis GEOSET) → Matching Service → WebSocket → Rider",
  score: {
    perfect: "Drivers matched. No double dispatch. Surge pricing saved New Year's Eve. 🚗",
    good: "Solid ride-sharing engineer. Most edge cases handled.",
    average: "Riders are getting matched. Double dispatch happening occasionally.",
    poor: "Two drivers just arrived at the same rider. Again.",
  },
};
