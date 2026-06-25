import type { PrepData } from "./types";

export const chatSystemPrep: PrepData = {
  systemId: "chat-system",
  systemName: "Chat System",
  sections: [
    {
      type: "interactive",
      sectionId: "requirements",
      step: "Step 1 — Requirements",
      title: "Sort the Requirements",
      subtitle:
        "Chat systems seem simple but have nuanced requirements. Interviewers expect you to distinguish between 1-on-1 chat and group features explicitly.",
      interaction: {
        type: "requirements-sort",
        items: [
          {
            id: "r1",
            text: "Send and receive messages in real-time",
            correctBucket: "functional",
            explanation: "The core feature — bidirectional messaging.",
          },
          {
            id: "r2",
            text: "Messages must be delivered within 100ms when both users online",
            correctBucket: "non-functional",
            explanation: "Latency target — defines performance requirement.",
          },
          {
            id: "r3",
            text: "Support group chats up to 500 members",
            correctBucket: "functional",
            explanation: "Group chat is a distinct functional capability.",
          },
          {
            id: "r4",
            text: "Messages must never be lost — offline delivery required",
            correctBucket: "non-functional",
            explanation: "Durability/reliability guarantee — a quality attribute.",
          },
          {
            id: "r5",
            text: "End-to-end encryption",
            correctBucket: "out-of-scope",
            explanation:
              "E2E encryption is a separate cryptographic concern — explicitly out of scope unless asked.",
          },
          {
            id: "r6",
            text: "Show message delivery receipts (sent/delivered/read)",
            correctBucket: "functional",
            explanation: "Receipt ticks are a functional feature users see.",
          },
          {
            id: "r7",
            text: "Support 100 million daily active users",
            correctBucket: "non-functional",
            explanation: "Scale requirement — DAU is a performance constraint.",
          },
          {
            id: "r8",
            text: "Show online/offline presence status",
            correctBucket: "functional",
            explanation: "Presence is a distinct functional feature.",
          },
          {
            id: "r9",
            text: "AI-powered message suggestions",
            correctBucket: "out-of-scope",
            explanation: "Smart reply ML features are a separate system — out of scope.",
          },
          {
            id: "r10",
            text: "Messages must appear in the same order for all participants",
            correctBucket: "non-functional",
            explanation:
              "Message ordering consistency — a correctness/consistency requirement.",
          },
        ],
        buckets: [
          {
            id: "functional",
            label: "Functional",
            description: "What the system does — features users interact with",
          },
          {
            id: "non-functional",
            label: "Non-Functional",
            description: "How well it performs — speed, scale, correctness",
          },
          {
            id: "out-of-scope",
            label: "Out of Scope",
            description: "Explicitly excluded from this design",
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
        "Chat systems are both read and write heavy. The numbers drive your decision to use WebSockets and how to scale message storage.",
      interaction: {
        type: "estimation-calculator",
        steps: [
          {
            id: "e1",
            label: "Daily active users",
            formula: "Given assumption",
            answer: 100000000,
            unit: "DAU",
            userInput: false,
            hint: "",
            explanation: "100M DAU — WhatsApp/Telegram scale.",
          },
          {
            id: "e2",
            label: "Messages sent per user per day",
            formula: "Given assumption",
            answer: 40,
            unit: "messages/user/day",
            userInput: false,
            hint: "",
            explanation: "40 messages/day — active chat user average.",
          },
          {
            id: "e3",
            label: "Total messages per day",
            formula: "100M × 40",
            answer: 4000000000,
            unit: "messages/day",
            userInput: true,
            hint: "Multiply DAU by messages per user",
            explanation: "4 billion messages per day. This is your write volume — substantial.",
          },
          {
            id: "e4",
            label: "Write QPS (messages sent)",
            formula: "4B ÷ 86,400",
            answer: 46296,
            unit: "writes/sec",
            userInput: true,
            hint: "Divide daily messages by seconds in a day",
            explanation:
              "~46,000 writes/sec. This is high — you need a distributed message store, not a single SQL primary.",
          },
          {
            id: "e5",
            label: "Read QPS (messages read)",
            formula: "~4x write QPS (each message read by multiple people)",
            answer: 185000,
            unit: "reads/sec",
            userInput: true,
            hint: "Multiply write QPS by ~4 (sender reads + recipients)",
            explanation:
              "~185,000 reads/sec. Caching message history is critical — but recent messages are read far more than old ones.",
          },
          {
            id: "e6",
            label: "Storage per message",
            formula: "Given assumption",
            answer: 100,
            unit: "bytes",
            userInput: false,
            hint: "",
            explanation:
              "~100 bytes per message (text only). Images/video stored separately in blob storage with a URL reference.",
          },
        ],
        insight:
          "46,000 writes/sec rules out a single relational DB primary. The natural sharding key is conversation_id — all messages in a conversation live on the same shard, making message history queries efficient. WebSockets handle the real-time delivery. A separate blob store (S3) handles media — never store images in the message DB.",
      },
    },
    {
      type: "apiDesign",
      endpoints: [
        {
          method: "WS",
          path: "wss://api.whatsapp.com/v1/connect",
          description: "Establish persistent connection for real-time messaging",
          requestBody: `// On connect, authenticate and register:
{
  "action": "connect",
  "userId": "user_123",
  "token": "jwt_token_here",
  "lastSeenMessageId": "msg_9999"  // for catching up missed messages
}`,
          response: `// Server sends missed messages since lastSeenMessageId:
{ "type": "message", "id": "msg_10000", "from": "user_456",
  "conversationId": "conv_789", "content": "hey!",
  "sentAt": "2024-01-15T10:00:00Z" }

// Then real-time messages as they arrive`,
          notes:
            "lastSeenMessageId enables offline catch-up — server sends all missed messages on reconnect.",
        },
        {
          method: "POST",
          path: "/api/v1/messages",
          description: "Send a message (also sent via WebSocket in most implementations)",
          requestBody: `{
  "conversationId": "conv_789",
  "content": "Hey, are you free tonight?",
  "type": "text",               // text | image | video | audio
  "idempotencyKey": "msg_client_uuid"
}`,
          response: `// 201 Created
{
  "messageId": "msg_10001",
  "conversationId": "conv_789",
  "status": "SENT",             // SENT → DELIVERED → READ
  "serverTimestamp": "2024-01-15T10:00:00.123Z"
}`,
        },
        {
          method: "GET",
          path: "/api/v1/conversations/{conversationId}/messages",
          description: "Fetch message history (paginated)",
          response: `// 200 OK
{
  "messages": [...],
  "nextCursor": "msg_9500",   // cursor-based pagination
  "hasMore": true
}`,
          notes:
            "Cursor-based pagination, not offset. Offset pagination is O(n) at the DB level — cursor is O(1).",
        },
      ],
      trap: {
        title: "Offset pagination breaks at scale — use cursor-based",
        content: `OFFSET 10000 LIMIT 20 requires the DB to scan and discard 10,000 rows before returning 20. At billions of messages, this is catastrophically slow.
Cursor pagination: WHERE message_id < :cursor ORDER BY message_id DESC LIMIT 20.
This uses the index directly — O(log n) not O(n).
Every high-scale chat system uses cursor pagination. Mentioning this distinction is a strong signal.`,
      },
    },
    {
      type: "interactive",
      sectionId: "deepDive",
      step: "Step 4 — Deep Dive",
      title: "Core Chat Concepts",
      subtitle:
        "These four concepts separate a naive chat design from one that actually works at WhatsApp scale.",
      interaction: {
        type: "flashcard-deck",
        title: "Chat System Deep Dive",
        cards: [
          {
            id: "dc1",
            front: {
              label: "CONCEPT 1",
              title: "Message Ordering",
              subtitle: "Whose clock do you trust for message order?",
              tag: "Critical",
            },
            back: {
              explanation:
                "Device clocks drift. Your phone might be 500ms ahead, your friend's 200ms behind. If you sort by device timestamp, messages appear in different orders on different devices. Fix: server assigns timestamps on message receipt.",
              code: `// BAD — trust device timestamp
{
  "content": "I love you",
  "deviceTimestamp": "2024-01-15T10:00:00.500Z"  // might be wrong
}

// GOOD — server assigns canonical timestamp
// Server receives message at 10:00:00.612Z
{
  "messageId": "msg_10001",
  "content": "I love you",
  "serverTimestamp": "2024-01-15T10:00:00.612Z",  // source of truth
  "deviceTimestamp": "2024-01-15T10:00:00.500Z"   // keep for debugging
}
// All clients sort by serverTimestamp — same order for everyone`,
              proTip:
                "Always use server-assigned timestamps for ordering. Preserve device timestamp as metadata for debugging clock skew issues.",
            },
          },
          {
            id: "dc2",
            front: {
              label: "CONCEPT 2",
              title: "Offline Message Delivery",
              subtitle: "Messages must survive recipient being offline for days",
              tag: "Required",
            },
            back: {
              explanation:
                "When recipient is offline, there's no WebSocket to deliver to. The message must be persisted and delivered when they reconnect. On reconnect, server queries for all messages where status = UNDELIVERED for that user.",
              code: `-- Message stored with delivery status
INSERT INTO messages (id, conversation_id, sender_id, content, status)
VALUES ('msg_10001', 'conv_789', 'user_123', 'hey!', 'SENT');

INSERT INTO message_delivery (message_id, recipient_id, status)
VALUES ('msg_10001', 'user_456', 'UNDELIVERED');

-- On user_456 reconnects via WebSocket:
SELECT m.* FROM messages m
JOIN message_delivery md ON m.id = md.message_id
WHERE md.recipient_id = 'user_456'
AND md.status = 'UNDELIVERED'
ORDER BY m.server_timestamp ASC;

-- After delivery confirmed:
UPDATE message_delivery SET status = 'DELIVERED'
WHERE message_id = 'msg_10001' AND recipient_id = 'user_456';`,
              trap:
                "Don't store delivery status on the message row itself — for group chats, one message has N recipients each with their own delivery state. Always use a separate message_delivery table.",
            },
          },
          {
            id: "dc3",
            front: {
              label: "CONCEPT 3",
              title: "Presence System",
              subtitle: "How to show online/offline status for 100M users",
              tag: "Architecture",
            },
            back: {
              explanation:
                "Presence is harder than it looks. You need to know if a user is online in near-real-time, but you can't afford a DB write on every heartbeat for 100M users. Redis with short TTL is the standard solution.",
              code: `// On WebSocket connect:
redis.set(\`presence:\${userId}\`, 'online', 'EX', 60)  // 60-second TTL

// Client sends heartbeat every 30 seconds:
redis.set(\`presence:\${userId}\`, 'online', 'EX', 60)  // refresh TTL

// On WebSocket disconnect:
redis.del(\`presence:\${userId}\`)  // or let TTL expire

// To check if user is online:
const isOnline = await redis.exists(\`presence:\${userId}\`)

// To notify contacts of status change:
redis.publish(\`presence_change:\${userId}\`,
  JSON.stringify({ userId, status: 'offline' }))`,
              proTip:
                "The 60-second TTL is a safety net — if a client crashes without disconnecting, their presence automatically expires. Heartbeats every 30 seconds ensure active users stay marked online.",
            },
          },
          {
            id: "dc4",
            front: {
              label: "CONCEPT 4",
              title: "Cross-Server Message Routing",
              subtitle: "User A on Server 1 messages User B on Server 7",
              tag: "Distributed",
            },
            back: {
              explanation:
                "With 100M users across hundreds of WebSocket servers, two participants in a conversation are almost never on the same server. When user_123 (Server 1) sends a message to user_456 (Server 7), Server 1 must route it to Server 7.",
              code: `// Redis tracks which server each user is connected to
redis.hset('user_server_map', 'user_456', 'ws-server-7')

// user_123 (on Server 1) sends message to user_456:
const targetServer = await redis.hget('user_server_map', 'user_456')

if (targetServer === 'ws-server-1') {
  // Same server — deliver directly
  deliverToLocalConnection('user_456', message)
} else if (targetServer) {
  // Different server — route via internal pub/sub
  redis.publish(\`server:\${targetServer}\`,
    JSON.stringify({ recipient: 'user_456', message }))
} else {
  // User offline — store in DB for later
  await saveUndeliveredMessage('user_456', message)
}`,
              trap:
                "This cross-server routing problem is the most common miss in chat system design. Always ask: 'What if the sender and recipient are connected to different WebSocket servers?' The answer is always Redis-based routing.",
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
        "Chat system tradeoffs are subtle — the wrong call creates bugs that are hard to debug in production.",
      interaction: {
        type: "tradeoff-picker",
        scenarios: [
          {
            id: "t1",
            scenario: "Should message history be stored in SQL or NoSQL?",
            context:
              "46,000 writes/sec. Queries are almost always: 'get last N messages for conversation X'. No complex joins needed.",
            options: [
              {
                id: "a",
                label: "SQL (PostgreSQL) — ACID, familiar, reliable",
                correct: false,
                consequence:
                  "At 46,000 writes/sec, a single SQL primary hits its ceiling. Sharding SQL is painful. And the query pattern (get messages by conversation_id) is perfectly suited for NoSQL's partition key model.",
              },
              {
                id: "b",
                label:
                  "NoSQL (Cassandra) — shard by conversation_id, scales to 46k writes/sec",
                correct: true,
                consequence:
                  "conversation_id as partition key means all messages in a conversation live on the same node — perfect for history queries. Cassandra handles 46k writes/sec across a cluster trivially.",
              },
            ],
            seniorNote:
              "This is the opposite of the payment system. Payments need ACID (SQL). Chat history needs write scale and simple partition-based queries (NoSQL). The query pattern decides the database. Always ask: 'What are the access patterns?' before choosing a DB.",
          },
          {
            id: "t2",
            scenario:
              "When does a message get the double-tick (delivered) status vs the blue-tick (read) status?",
            context:
              "Group chat with 50 members. How do you define 'delivered' and 'read' at group scale?",
            options: [
              {
                id: "a",
                label: "Delivered = all 50 members received it. Read = all 50 read it.",
                correct: false,
                consequence:
                  "If one member's phone is off for a week, the message is never 'delivered' for everyone else. Blue ticks never appear. Terrible UX.",
              },
              {
                id: "b",
                label:
                  "Delivered = server confirmed receipt. Read = at least one member opened it.",
                correct: true,
                consequence:
                  "Matches WhatsApp's actual behavior. Delivered ticks appear when server acknowledges. Blue ticks appear when any member reads. Detailed per-member status available in message info screen.",
              },
            ],
            seniorNote:
              "Per-member status in a separate table is what enables the 'message info' screen that shows exactly who read a message and when. The group-level status (double tick = delivered, blue = read) is an aggregation over per-member rows. Design the data model to support both.",
          },
          {
            id: "t3",
            scenario:
              "How do you handle the case where a user sends a message but loses network before receiving the server ACK?",
            context:
              "Client sent 'msg_client_abc'. Server processed it as 'msg_10001'. Client doesn't know if it was received.",
            options: [
              {
                id: "a",
                label: "Client resends on reconnect — idempotency key prevents duplicate",
                correct: true,
                consequence:
                  "Client retries with same idempotencyKey='msg_client_abc'. Server finds existing message with that key, returns it without reprocessing. No duplicate. Client updates local message with server-assigned msg_10001.",
              },
              {
                id: "b",
                label: "Show message as 'failed' — user must manually retry",
                correct: false,
                consequence:
                  "Users hate 'failed to send' — it breaks the messaging experience. Automatic retry with idempotency is the correct pattern. Users expect chat to be reliable.",
              },
              {
                id: "c",
                label:
                  "Query recent messages on reconnect to see if it was delivered",
                correct: false,
                consequence:
                  "Querying all recent messages on every reconnect is expensive and scales poorly. Idempotent retry is far more efficient.",
              },
            ],
            seniorNote:
              "Client-generated idempotency keys are as important in chat as in payments. The flow: generate UUID before send → retry on failure with same UUID → server deduplicates. This pattern appears in every reliable messaging system.",
          },
        ],
      },
    },
    {
      type: "cheatSheet",
      components:
        "User ↔ WebSocket Servers → Redis (routing + presence) → Cassandra (messages) | Blob Store (media)",
      numbers: [
        { label: "DAU", value: "100M users" },
        { label: "Write QPS", value: "~46,000 messages/sec" },
        { label: "Read QPS", value: "~185,000/sec" },
        { label: "WebSocket servers", value: "2,000+ (50k connections each)" },
        { label: "Message size", value: "~100 bytes (text)" },
        { label: "Message retention", value: "Forever (or configurable)" },
      ],
      decisions: [
        {
          decision: "WebSockets for real-time",
          why: "Bidirectional — server pushes messages without client polling",
        },
        {
          decision: "Cassandra for message storage",
          why: "conversation_id partition key; 46k writes/sec; no joins needed",
        },
        {
          decision: "Server-assigned timestamps",
          why: "Device clocks drift — server timestamp is source of truth for ordering",
        },
        {
          decision: "Per-recipient delivery status table",
          why: "Group chats need per-member status; message row alone can't track this",
        },
        {
          decision: "Redis for presence + routing",
          why: "TTL-based online tracking; user→server mapping for cross-server delivery",
        },
      ],
    },
  ],
};
