export const googleMaps = {
  id: "google-maps",
  title: "Google Maps",
  scenario:
    "1 billion users navigate with Google Maps every month. Someone in Bangalore asks for directions to the airport. Maps must return the fastest route in under 200ms — considering 20 million road segments, real-time traffic from 50 million active users, and road closures happening right now. Design the routing system.",
  decisions: [
    {
      id: 1,
      question:
        "The world's road network has 20 million road segments. A user wants directions from point A to point B. You need the shortest path. What algorithm do you use?",
      context:
        "Dijkstra's algorithm finds shortest paths but struggles at global scale. Think about how to make it practical.",
      options: [
        {
          id: "a",
          text: "Dijkstra's algorithm on the full 20 million node graph for every request",
          correct: false,
          consequence:
            "Dijkstra on 20M nodes takes minutes. At 100M route requests per day, that's impossible. Pure Dijkstra doesn't work at global road network scale.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Pre-compute routes between important waypoints (highway intersections), then Dijkstra on a dramatically smaller graph",
          correct: true,
          consequence:
            "Divide the world into small cells. Pre-compute optimal paths between cell borders. Route request: find path within source cell + path across cell borders + path within destination cell. Graph shrinks from 20M to thousands of nodes. Sub-second routing.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Store all possible routes between all pairs of locations in a database",
          correct: false,
          consequence:
            "20M locations × 20M locations = 4 × 10^14 pairs. Storing every possible route is physically impossible. The universe would end before this database is populated.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Hierarchical routing with Contraction Hierarchies (CH) or similar: pre-process the road graph by identifying 'important' nodes (highway junctions, city centers) and pre-computing shortest paths between them. Runtime queries then only need to search this contracted graph, which is orders of magnitude smaller. Google Maps, Apple Maps, and HERE all use hierarchical routing algorithms.",
    },
    {
      id: 2,
      question:
        "Real-time traffic data comes from 50 million active users sending their GPS speed every 30 seconds. That's 1.67 million updates per second. How do you process this to update traffic conditions?",
      context:
        "Raw GPS speed from phones is noisy, inconsistent, and arrives at massive volume.",
      options: [
        {
          id: "a",
          text: "Store every GPS ping in a database and query it for traffic calculations",
          correct: false,
          consequence:
            "1.67M writes/second to one database is impossible. And then you'd need to aggregate billions of rows per road segment to calculate speed. This doesn't scale.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Stream GPS updates through Kafka → aggregate by road segment → update traffic layer in real-time",
          correct: true,
          consequence:
            "GPS pings → Kafka (absorbs 1.67M/sec). Kafka consumers aggregate by road segment: 'average speed on MG Road in last 5 minutes = 23 km/h'. Traffic layer updated continuously. Route calculations use current traffic conditions.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Sample 1% of GPS pings — 99% accuracy is good enough",
          correct: false,
          consequence:
            "1% of 1.67M = 16,700 pings/second. Some road segments have sparse coverage — 1% might mean zero pings per minute on minor roads. Traffic data becomes unreliable for roads that matter most during rush hour.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Kafka is the right tool for GPS telemetry ingestion — exactly the high-volume, time-series event stream it was built for. Stream processing (Kafka Streams or Flink) aggregates speed data per road segment per time window. The output is a continuously updated traffic layer: a mapping of {road_segment_id → current_avg_speed}. Route calculations query this layer.",
    },
    {
      id: 3,
      question:
        "Maps needs to store the entire world's geographic data — roads, buildings, POIs (points of interest), terrain. This is petabytes of data. How do you serve map tiles to users efficiently?",
      context:
        "Users don't see the raw geographic data — they see rendered map tiles (images). Think about how to pre-render and cache them.",
      options: [
        {
          id: "a",
          text: "Render map tiles on-demand for every user request",
          correct: false,
          consequence:
            "Rendering a single map tile from raw geographic data takes 100ms-1 second. 100M users requesting tiles simultaneously = impossible real-time rendering demand.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Pre-render map tiles at multiple zoom levels, store in object storage, serve via CDN",
          correct: true,
          consequence:
            "World divided into tiles at zoom levels 1-20. Tiles pre-rendered offline and stored in S3. CDN serves tiles globally. User pans/zooms → tiles from nearby CDN edge node in milliseconds. Map never waits for rendering.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Send raw geographic vector data to the client, render locally on-device",
          correct: false,
          consequence:
            "Raw geographic data for a city is gigabytes. Sending gigabytes to render a map is impractical on mobile data. Though notably, modern maps do use vector tiles for interactivity — but the data must be heavily compressed and delivered incrementally.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Pre-rendered raster tile pyramid: the world is divided into tiles at each zoom level. Zoom 0 = 1 tile (whole world). Each zoom level has 4x more tiles. At zoom 15 (city block level), there are billions of tiles. Pre-rendered tiles stored in S3, served via CDN. When the user moves the map, the client requests tiles for the visible area from the nearest CDN edge. Tile pyramid + CDN = fast maps everywhere.",
    },
    {
      id: 4,
      question:
        "A user searches 'coffee near me' on Google Maps. The system must return relevant results within 500ms. How do you handle location-based search at scale?",
      context:
        "This combines geospatial querying with full-text search — two different problems.",
      options: [
        {
          id: "a",
          text: "Query a single database with both location and keyword filters",
          correct: false,
          consequence:
            "'Coffee' full-text search + distance calculation on millions of POIs simultaneously. Neither operation is fast alone — combined, the query takes seconds.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Geospatial index (geohash) to narrow to nearby POIs first, then Elasticsearch for keyword ranking",
          correct: true,
          consequence:
            "Step 1: Geohash query finds all POIs within 2km (fast, O(1)). Reduces from millions to maybe 500 nearby POIs. Step 2: Elasticsearch ranks those 500 by keyword match + rating + popularity. Sub-100ms total.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Pre-compute all possible search results for every location on Earth",
          correct: false,
          consequence:
            "Earth has infinite possible 'current locations'. Pre-computing results for all of them is not physically possible. Search must be dynamic.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Two-phase geospatial search: Phase 1 uses a geospatial index (PostGIS, Redis GEORADIUS, or custom geohash index) to quickly filter to nearby results. Phase 2 uses a search engine (Elasticsearch) for relevance ranking. This pattern appears everywhere location + search are combined: Yelp, Zomato, Google Maps, Swiggy. Never do text search before geospatial filtering — always narrow by location first.",
    },
    {
      id: 5,
      question:
        "A major highway is closed due to flooding. 10 million users currently navigating through that route need to be re-routed. How do you handle this?",
      context:
        "Real-time graph updates affecting millions of active navigation sessions simultaneously.",
      options: [
        {
          id: "a",
          text: "Invalidate all cached routes and force every user to re-request directions",
          correct: false,
          consequence:
            "10M simultaneous route requests to your routing service. Even at 10ms per route calculation, that's 10M × 10ms = impossible without massive servers. Your routing service collapses.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Publish road closure event to Kafka → routing service marks segment as closed → push re-route suggestions only to affected users",
          correct: true,
          consequence:
            "Road closure → Kafka event. Routing service updates its graph (road segment weight = infinity). Active navigation sessions subscribed to route updates receive a push notification: 'Route affected, re-routing.' Only affected users get re-routed. Smart, targeted, scalable.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Show users a warning but don't re-route automatically",
          correct: false,
          consequence:
            "10 million users see a warning and all simultaneously tap 'Get new route' manually. Same problem as option A — 10M simultaneous requests.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Event-driven re-routing: road condition changes (closures, accidents, traffic jams) published as events to Kafka. The routing service subscribes and updates its internal graph. Active navigation sessions are maintained as WebSocket connections. When a route segment is affected, only sessions using that segment receive a push re-route. This targeted approach prevents the thundering herd problem of mass simultaneous re-route requests.",
    },
  ],
  finalArchitecture:
    "GPS Telemetry → Kafka → Traffic Layer | Map Tiles → S3 → CDN | Route Request → Hierarchical Graph Algorithm → WebSocket navigation updates",
  score: {
    perfect: "Route returned in 150ms. Traffic updated in real-time. Road closure handled. 🗺️",
    good: "Solid maps engineer. Routing and traffic working.",
    average: "Maps working. Road closure handling is shaky.",
    poor: "10M users just got re-routed at the same time. Routing service is down.",
  },
};
