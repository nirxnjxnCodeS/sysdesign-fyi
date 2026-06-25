import type { PrepData } from "./types";

export const notificationSystemPrep: PrepData = {
  systemId: "notification-system",
  systemName: "Notification System",
  sections: [
    {
      type: "interactive",
      sectionId: "requirements",
      step: "Step 1 — Requirements",
      title: "Sort the Requirements",
      subtitle:
        "Notification systems touch every part of a product. Know exactly what's in scope.",
      interaction: {
        type: "requirements-sort",
        items: [
          {
            id: "r1",
            text: "Send push notifications to mobile devices",
            correctBucket: "functional",
            explanation: "Core delivery channel — directly what the system does.",
          },
          {
            id: "r2",
            text: "Deliver notifications within 1 second of event",
            correctBucket: "non-functional",
            explanation: "Latency target — defines how fast, not what.",
          },
          {
            id: "r3",
            text: "Send SMS notifications",
            correctBucket: "functional",
            explanation: "Another delivery channel — a distinct functional capability.",
          },
          {
            id: "r4",
            text: "Support 1 million notifications per second at peak",
            correctBucket: "non-functional",
            explanation: "Scale requirement — throughput target, not a feature.",
          },
          {
            id: "r5",
            text: "Build the notification content (copy, images)",
            correctBucket: "out-of-scope",
            explanation:
              "Content creation is a separate concern — the system delivers notifications, not creates them.",
          },
          {
            id: "r6",
            text: "Send email notifications",
            correctBucket: "functional",
            explanation: "Third delivery channel — functional capability.",
          },
          {
            id: "r7",
            text: "Zero message loss — every notification must be delivered eventually",
            correctBucket: "non-functional",
            explanation: "Reliability/durability guarantee — a quality attribute.",
          },
          {
            id: "r8",
            text: "User can configure notification preferences",
            correctBucket: "functional",
            explanation: "Preference management is a feature users interact with.",
          },
          {
            id: "r9",
            text: "A/B testing different notification messages",
            correctBucket: "out-of-scope",
            explanation:
              "Experimentation platform is a separate system — out of scope.",
          },
          {
            id: "r10",
            text: "Retry failed notifications automatically",
            correctBucket: "functional",
            explanation:
              "Retry is a functional behavior the system must exhibit.",
          },
        ],
        buckets: [
          {
            id: "functional",
            label: "Functional",
            description: "What the system does — features and behaviors",
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
      },
    },
    {
      type: "interactive",
      sectionId: "estimation",
      step: "Step 2 — Estimation",
      title: "Work Through the Math",
      subtitle:
        "Notification systems are write-heavy and burst-heavy. Festival nights and product launches create massive spikes.",
      interaction: {
        type: "estimation-calculator",
        steps: [
          {
            id: "e1",
            label: "Daily active users",
            formula: "Given assumption",
            answer: 50000000,
            unit: "DAU",
            userInput: false,
            hint: "",
            explanation:
              "50M DAU — scale of a major food delivery or e-commerce app.",
          },
          {
            id: "e2",
            label: "Notifications per user per day",
            formula: "Given assumption",
            answer: 10,
            unit: "notifications/user",
            userInput: false,
            hint: "",
            explanation:
              "10 notifications/user/day — order updates, promos, reminders.",
          },
          {
            id: "e3",
            label: "Total daily notifications",
            formula: "50M × 10",
            answer: 500000000,
            unit: "notifications/day",
            userInput: true,
            hint: "Multiply DAU by notifications per user",
            explanation:
              "500M notifications per day. This is your throughput baseline.",
          },
          {
            id: "e4",
            label: "Average QPS",
            formula: "500M ÷ 86,400",
            answer: 5787,
            unit: "notifications/sec",
            userInput: true,
            hint: "Divide daily volume by seconds in a day",
            explanation:
              "~5,800/sec average. But at 9 PM (prime time), peak can be 5-10x: ~30,000-60,000/sec.",
          },
          {
            id: "e5",
            label: "Peak QPS (10x spike)",
            formula: "5,800 × 10",
            answer: 58000,
            unit: "notifications/sec at peak",
            userInput: true,
            hint: "Multiply average QPS by 10 for festival/launch peaks",
            explanation:
              "~58,000/sec at peak. This is why you need Kafka — a synchronous HTTP call for each would collapse the system.",
          },
          {
            id: "e6",
            label: "Storage per notification (log)",
            formula: "Given assumption",
            answer: 500,
            unit: "bytes",
            userInput: false,
            hint: "",
            explanation:
              "~500 bytes per notification record including metadata and delivery status.",
          },
        ],
        insight:
          "The peak QPS (58,000/sec) is what drives every architecture decision: (1) App server cannot send notifications synchronously — it must publish to Kafka and return immediately. (2) Separate worker pools per channel (push/SMS/email) — each can scale independently based on its own load. (3) Kafka's persistence means worker downtime loses zero messages — they resume from their offset.",
      },
    },
    {
      type: "apiDesign",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/notifications/send",
          description: "Send a notification to one or more users",
          requestBody: `{
  "recipients": ["user_123", "user_456"],  // or segment ID
  "channels": ["push", "sms", "email"],    // which channels to try
  "priority": "high",                       // high | normal | low
  "payload": {
    "title": "Your order is on the way!",
    "body": "Arrives in 15 minutes",
    "data": { "orderId": "ord_789" }        // deep-link data
  },
  "idempotencyKey": "notif_uuid_abc"
}`,
          response: `// 202 Accepted (not 200 — delivery is async)
{
  "notificationId": "notif_xyz",
  "status": "QUEUED",
  "estimatedDelivery": "2024-01-15T10:00:01Z"
}`,
          notes:
            "202 Accepted — not 200 OK. Delivery is async via Kafka workers. The API only guarantees the message was queued, not delivered.",
        },
        {
          method: "GET",
          path: "/api/v1/notifications/{notificationId}/status",
          description: "Check delivery status of a notification",
          response: `// 200 OK
{
  "notificationId": "notif_xyz",
  "push":  { "status": "DELIVERED", "deliveredAt": "2024-01-15T10:00:01Z" },
  "sms":   { "status": "FAILED", "failureReason": "invalid_number" },
  "email": { "status": "PENDING" }
}`,
        },
      ],
      trap: {
        title: "Return 202 Accepted, not 200 OK",
        content: `Notification delivery is asynchronous. The moment your API accepts the request and queues it to Kafka, return 202 Accepted.
200 OK implies the action is complete. It's not — the notification hasn't been delivered yet.
202 Accepted means "I received it and it's being processed."
Interviewers specifically check whether candidates understand this HTTP semantics distinction.`,
      },
    },
    {
      type: "interactive",
      sectionId: "deepDive",
      step: "Step 4 — Deep Dive",
      title: "Core Notification Concepts",
      subtitle:
        "The difference between a junior and senior answer on notification systems is understanding these four concepts deeply.",
      interaction: {
        type: "flashcard-deck",
        title: "Notification System Deep Dive",
        cards: [
          {
            id: "dc1",
            front: {
              label: "CONCEPT 1",
              title: "Kafka for Message Queue",
              subtitle: "Why Kafka, not Redis Pub/Sub or RabbitMQ",
              tag: "Critical",
            },
            back: {
              explanation:
                "At 58,000 notifications/sec peak, three properties make Kafka the right choice: (1) Persistence — if an SMS worker crashes, messages wait in the topic and resume on restart. (2) Multiple consumers — push, SMS, and email workers all read the same event without interfering. (3) Replay — if your email worker has a bug, fix it and replay the last hour of events.",
              code: `// One Kafka topic, three independent consumer groups
Topic: "notification-events"
  → Consumer Group "push-workers"   (Firebase FCM)
  → Consumer Group "sms-workers"    (Twilio)
  → Consumer Group "email-workers"  (SendGrid)

// Each consumer tracks its own offset
// Push worker at offset 1,000,000
// SMS worker at offset 999,850 (slightly behind — Twilio was slow)
// Email worker at offset 1,000,000
// None interfere with each other`,
              trap:
                "Redis Pub/Sub is fire-and-forget — if a worker is down when a message arrives, that message is gone. Never use Redis Pub/Sub for critical notifications.",
            },
          },
          {
            id: "dc2",
            front: {
              label: "CONCEPT 2",
              title: "Fallback Chain",
              subtitle: "Push fails → SMS → Email → In-app",
              tag: "Required",
            },
            back: {
              explanation:
                "Push notifications fail silently all the time — phone offline, notification disabled, app uninstalled. A robust notification system has a fallback chain: if push fails after 3 retries, try SMS. If SMS fails, try email. If all fail, store as in-app notification for next app open.",
              code: `async function deliverWithFallback(notification) {
  // Try push first
  const pushResult = await firebase.send(notification)
  if (pushResult.success) return

  // Push failed — try SMS
  await sleep(retry_delay)
  const smsResult = await twilio.send(notification)
  if (smsResult.success) return

  // SMS failed — try email
  const emailResult = await sendgrid.send(notification)
  if (emailResult.success) return

  // All failed — store for in-app
  await db.saveInAppNotification(notification)
}`,
              proTip:
                "The fallback chain is what separates a 'notification service' from a 'reliable notification service.' Always mention it — it shows you've thought about real-world delivery failures.",
            },
          },
          {
            id: "dc3",
            front: {
              label: "CONCEPT 3",
              title: "Worker Isolation",
              subtitle: "Separate worker pools per channel",
              tag: "Architecture",
            },
            back: {
              explanation:
                "If push, SMS, and email all run in the same worker process, a Twilio outage that blocks SMS threads also blocks push and email. Separate workers mean one channel's failure is contained.",
              code: `// BAD — one worker handles all channels
NotificationWorker.consume(event) {
  sendPush(event)   // if this blocks...
  sendSMS(event)    // ...this never runs
  sendEmail(event)  // ...or this
}

// GOOD — separate worker pools
PushWorker.consume(event)   { sendPush(event) }   // 50 instances
SMSWorker.consume(event)    { sendSMS(event) }    // 30 instances
EmailWorker.consume(event)  { sendEmail(event) }  // 20 instances
// Twilio down? Only SMS workers are stuck.
// Push and email keep running.`,
              proTip:
                "Each worker pool can also scale independently. SMS is slower than push — run more SMS worker instances. Email is cheapest — fewer instances. Separate pools = independent scaling.",
            },
          },
          {
            id: "dc4",
            front: {
              label: "CONCEPT 4",
              title: "Rate Limiting Outbound",
              subtitle: "Don't let your system spam users or violate provider limits",
              tag: "Operations",
            },
            back: {
              explanation:
                "Two rate limiting problems: (1) Provider limits — Twilio allows X SMS/second per account. Exceed it and requests fail. (2) User experience — sending 20 notifications in 2 seconds annoys users and gets your app disabled on their phone.",
              code: `// Provider rate limiting — token bucket per channel
const twilioRateLimiter = new TokenBucket({
  capacity: 1000,      // max burst
  refillRate: 100,     // tokens per second (Twilio limit)
})

// User rate limiting — don't spam individual users
const userRateLimiter = new SlidingWindow({
  maxMessages: 5,      // max 5 notifications
  windowSeconds: 3600, // per hour per user
})

// Before sending:
if (!userRateLimiter.allow(userId)) {
  // Queue for later or drop (based on priority)
}
if (!twilioRateLimiter.allow()) {
  // Wait or use exponential backoff
}`,
              trap:
                "Forgetting outbound rate limits is a common interview miss. Mention both provider limits and user experience limits — shows operational maturity.",
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
        "Notification tradeoffs affect user experience directly. Think about what the user feels, not just what the system does.",
      interaction: {
        type: "tradeoff-picker",
        scenarios: [
          {
            id: "t1",
            scenario:
              "Twilio goes down for 5 minutes during a flash sale. 50,000 SMS notifications are queued. When Twilio recovers, what happens?",
            context:
              "You chose Kafka as your message queue. What does Kafka's persistence guarantee here?",
            options: [
              {
                id: "a",
                label: "Messages are lost — Kafka only holds real-time events",
                correct: false,
                consequence:
                  "Wrong — this is exactly why you chose Kafka over Redis Pub/Sub. Kafka persists messages in topics until consumers acknowledge them.",
              },
              {
                id: "b",
                label:
                  "Messages wait in the Kafka topic, SMS workers resume from their last offset",
                correct: true,
                consequence:
                  "Kafka tracks each consumer group's offset. SMS workers reconnect, resume from where they stopped, and deliver all 50,000 queued messages. Zero messages lost.",
              },
              {
                id: "c",
                label:
                  "Kafka automatically retries failed messages every 30 seconds",
                correct: false,
                consequence:
                  "Kafka doesn't retry — the consumer application handles retry logic. Kafka just persists the messages and maintains the offset position.",
              },
            ],
            seniorNote:
              "Consumer offset is the key Kafka concept here. Each consumer group has its own pointer into the topic. Kafka never deletes messages until the retention period expires (default 7 days). This is why Kafka for critical notifications, not Redis Pub/Sub.",
          },
          {
            id: "t2",
            scenario:
              "A user has push disabled on their phone and no phone number. They only have email. Your code tries push → SMS → email in that order. What's the problem?",
            context:
              "You're spending time attempting channels that will definitely fail before reaching the one that will work.",
            options: [
              {
                id: "a",
                label: "No problem — the fallback chain handles it",
                correct: false,
                consequence:
                  "Technically true but inefficient. Push attempt takes 2-3 seconds to timeout. SMS lookup shows no number. You wasted 5+ seconds before reaching email. At scale, this burns resources.",
              },
              {
                id: "b",
                label: "Store user channel preferences and skip unavailable channels",
                correct: true,
                consequence:
                  "Check user preferences first. This user has push=disabled, sms=none, email=enabled. Skip straight to email. Faster delivery, less wasted work, better user experience.",
              },
            ],
            seniorNote:
              "User preference lookup before sending is the production-grade answer. Store a simple record: {userId, push: bool, sms: string|null, email: string|null, preferredChannel}. This transforms the fallback chain from 'try everything' to 'try what will work.'",
          },
          {
            id: "t3",
            scenario:
              "Product wants to send a promotional notification to all 50M users simultaneously. How do you handle this?",
            context:
              "50M messages at once. Your workers handle 58,000/sec at peak. How long does full delivery take?",
            options: [
              {
                id: "a",
                label:
                  "Publish all 50M events to Kafka at once and let workers process",
                correct: false,
                consequence:
                  "Publishing 50M events simultaneously creates a massive Kafka write spike. The broker handles it but your API service will spend minutes just publishing. Better to stagger the publishing.",
              },
              {
                id: "b",
                label:
                  "Batch and stagger — publish in chunks of 10,000, rate-controlled over time",
                correct: true,
                consequence:
                  "50M ÷ 58,000/sec = ~860 seconds (~14 minutes) for full delivery. Stagger the publishing at a controlled rate. Users at the front get it in seconds, users at the back in 14 minutes — acceptable for promotional content.",
              },
              {
                id: "c",
                label: "Refuse the request — 50M is too many",
                correct: false,
                consequence:
                  "This is a normal use case for notification systems at scale. The answer is rate-controlled batching, not refusal.",
              },
            ],
            seniorNote:
              "50M notifications at 58,000/sec = ~14 minutes for full delivery. That's fine for promotional content. For transactional notifications (OTP, payment), priority queues ensure they skip the promotional backlog and deliver in seconds.",
          },
        ],
      },
    },
    {
      type: "cheatSheet",
      components:
        "Event Source → Kafka → Push Workers (FCM) + SMS Workers (Twilio) + Email Workers (SendGrid) → Fallback Chain",
      numbers: [
        { label: "Average QPS", value: "~5,800 notifications/sec" },
        { label: "Peak QPS", value: "~58,000/sec (10x festival spike)" },
        { label: "Push delivery target", value: "<1 second" },
        { label: "SMS delivery target", value: "<5 seconds" },
        { label: "Email delivery target", value: "<30 seconds" },
        { label: "Kafka retention", value: "7 days (replay window)" },
      ],
      decisions: [
        {
          decision: "Kafka over Redis Pub/Sub",
          why: "Persistence — messages survive worker crashes; offset replay on recovery",
        },
        {
          decision: "Separate worker pools per channel",
          why: "Twilio outage doesn't block push or email; independent scaling per channel",
        },
        {
          decision: "Fallback chain (push→SMS→email)",
          why: "Delivery failure on one channel doesn't mean notification is lost",
        },
        {
          decision: "202 Accepted not 200 OK",
          why: "Delivery is async — API only guarantees queuing, not delivery",
        },
        {
          decision: "User preference lookup before sending",
          why: "Skip channels that will definitely fail; faster delivery, less wasted compute",
        },
      ],
    },
  ],
};
