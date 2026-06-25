export const chatSystem = {
  id: "chat-system",
  title: "Chat System",
  scenario:
    "You're building the messaging backend for a superapp — think WhatsApp + payments in one. Day 1 you have 10,000 users. By month 3, you're at 50 million. Messages must never be lost, must arrive in order, and must sync across devices. Your first message just failed to deliver. Let's fix the architecture.",
  decisions: [
    {
      id: 1,
      question:
        "Priya sends Rohan a message. Your server needs to deliver it to Rohan's phone in real-time. How does Rohan's app know a new message arrived?",
      context:
        "HTTP is request/response — the client must ask. But Rohan's phone is idle, waiting. You can't predict when a message arrives.",
      options: [
        {
          id: "a",
          text: "Polling — Rohan's app asks 'any new messages?' every 2 seconds",
          correct: false,
          consequence:
            "50M users × 30 polls/min = 1.5B requests/minute. Server is at 100% CPU from empty polls. Battery on Rohan's phone drains in 2 hours.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "WebSockets — keep a persistent connection, server pushes when message arrives",
          correct: true,
          consequence:
            "Rohan opens app, WebSocket connects. Priya sends message — server pushes instantly. Zero polling overhead. Message appears in <100ms.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Webhooks — server calls Rohan's phone when a message arrives",
          correct: false,
          consequence:
            "Mobile phones don't expose public endpoints. Webhooks work for server-to-server. A phone behind NAT can't receive inbound connections.",
          consequenceType: "failure",
        },
      ],
      learning:
        "WebSockets for real-time messaging — when the server can't predict when events occur, the client must maintain a persistent connection. HTTP polling is the wrong model for push events. WebSockets keep a single TCP connection alive, allowing the server to push the moment a message arrives. This is how WhatsApp, Slack, and Discord all work.",
    },
    {
      id: 2,
      question:
        "Rohan's phone dies mid-conversation. He's offline for 4 hours. When he turns his phone back on, he expects to see all the messages Priya sent. Where were they stored?",
      context:
        "WebSocket connections die when the user goes offline. You can't push to a closed connection.",
      options: [
        {
          id: "a",
          text: "Messages are only stored in the WebSocket server's memory",
          correct: false,
          consequence:
            "WebSocket server restarts at 3 AM for a deployment. All messages in memory — gone. Rohan wakes up to silence instead of 27 messages.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Persist every message to the database before attempting delivery",
          correct: true,
          consequence:
            "Message written to DB first. WebSocket delivery is a best-effort bonus. Rohan reconnects, app fetches unread messages from DB. Nothing lost.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Rely on FCM push notifications to buffer messages",
          correct: false,
          consequence:
            "FCM delivery isn't guaranteed. Network outages, phone in airplane mode, FCM rate limits — any of these and messages disappear. Not a storage layer.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Persistence before delivery — write to durable storage first, then deliver. If delivery fails (user offline, connection dropped), the message is safe in the database. On reconnect, the client syncs from its last seen message ID. This is the 'at-least-once delivery' guarantee. The database is the source of truth, not the connection.",
    },
    {
      id: 3,
      question:
        "Rohan reads Priya's message on his phone. The message should show 'Read' on Priya's screen. You're also tracking 'Delivered' and 'Sent' separately. How do you store these statuses per recipient?",
      context:
        "In group chats, a message might be read by 50 people at different times. You need individual status per person.",
      options: [
        {
          id: "a",
          text: "Add a 'status' column to the messages table — last status wins",
          correct: false,
          consequence:
            "In a group of 50, message is 'read' by person 1, 'delivered' to person 47. One column can't hold 50 statuses. You're overwriting, not tracking.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Per-recipient status rows — message_id + recipient_id + status",
          correct: true,
          consequence:
            "Each user gets their own row. Priya sees: 'Delivered to 48, Read by 12'. Rohan's 'Read' status doesn't overwrite anyone else's row.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Store a JSON blob of {userId: status} per message",
          correct: false,
          consequence:
            "At 1M messages/day in group chats with 50 members — querying and updating JSON blobs is slow. Concurrent writes cause JSON corruption without row-level locks.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Per-recipient status table — a join table (message_id, recipient_id, status, updated_at). Each recipient has exactly one row per message. Queries like 'all unread messages for user X' become simple index scans. Group read receipts aggregate across rows. This is the relational data model for one-to-many relationships — don't fight it.",
    },
    {
      id: 4,
      question:
        "Priya sends 3 messages quickly: 'Hey', 'Are you there?', 'Hello??'. Rohan's app receives them out of order: 'Hello??', 'Hey', 'Are you there?'. How do you guarantee message ordering?",
      context:
        "Network packets can arrive out of order. Client clocks drift. You can't trust client timestamps.",
      options: [
        {
          id: "a",
          text: "Sort by client timestamp — each phone timestamps its own messages",
          correct: false,
          consequence:
            "Priya's phone clock is 3 minutes ahead of Rohan's. Messages from different senders interleave incorrectly. 'Hello' arrives before 'Hey' was even sent.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Server assigns a monotonic sequence ID — ordering is server-authoritative",
          correct: true,
          consequence:
            "Server stamps message_1, message_2, message_3 as they arrive. Clients sort by server sequence. Order is canonical. No clock drift.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Use message IDs as ordering (UUIDs) — they're unique",
          correct: false,
          consequence:
            "UUIDs are random. UUID ordering has no relationship to insertion order. 'b3a1...' might be message 3, 'a4c2...' might be message 1. Alphabetical ≠ chronological.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Server-side sequence IDs — the server is the single authority for message order. Each message gets a monotonically increasing ID within a conversation (auto-increment PK, or a sequence per chat_id). Clients render messages sorted by this server-assigned sequence, not wall-clock time. No distributed clock problem, no out-of-order rendering.",
    },
    {
      id: 5,
      question:
        "You now have 50M users. One WebSocket server can hold 50K connections. You've scaled to 1,000 WebSocket servers. Priya is on server A. Rohan is on server B. How do you route Priya's message to Rohan's server?",
      context:
        "Two users on different WebSocket servers — their connections are on completely different machines.",
      options: [
        {
          id: "a",
          text: "Each WebSocket server checks all other servers for the target connection",
          correct: false,
          consequence:
            "1,000 servers × each checking 999 others = 999,000 inter-server calls per message. Latency compounds. This is an O(n²) design.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Kafka routing — publish message to Kafka, each server subscribes to its users' topics",
          correct: true,
          consequence:
            "Priya's message → Kafka topic 'user:rohan'. Server B is subscribed to that topic. Message delivered in <50ms regardless of which server each user is on.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Sticky sessions — always route the same user to the same WebSocket server",
          correct: false,
          consequence:
            "Server B crashes. 50,000 users lose connection. Sessions are sticky — they can't simply reconnect to another server and resume. Reconnect storm ensues.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Kafka as a message bus for WebSocket fan-out — each user has a Kafka topic (or partition). When Server A receives a message for user B, it publishes to Kafka. Server B (which holds user B's WebSocket) is a consumer on that topic and receives the message. This removes the need for server-to-server knowledge. Any server can publish; the right server consumes. It's the architecture behind WhatsApp's ejabberd cluster and Slack's message routing.",
    },
  ],
  finalArchitecture:
    "Client → WebSocket Server (Kafka consumer) → DB | Message Bus: Kafka → target WebSocket Server → Recipient",
  score: {
    perfect: "Messages delivered in under 100ms. WhatsApp is nervous.",
    good: "Reliable delivery. One edge case in group ordering.",
    average: "Messages arrive. Sometimes twice. Sometimes out of order.",
    poor: "Rohan still hasn't received Priya's 'Hey'. It's been 4 hours.",
  },
};
