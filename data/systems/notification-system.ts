export const notificationSystem = {
  id: "notification-system",
  title: "Notification System",
  scenario:
    "You just joined a fintech app used by 50 million people. Your team owns notifications — the system that tells users 'your payment landed', 'your OTP is here', 'suspicious login detected'. It's 11 PM. A push notification just failed silently for 2 million users. Let's rebuild this right.",
  decisions: [
    {
      id: 1,
      question:
        "A payment completes. Your Payment Service needs to send a push notification to the user immediately. Should it send the notification directly, or hand it off to a queue?",
      context:
        "The Payment Service is already under load. The push provider (FCM) can be slow or fail.",
      options: [
        {
          id: "a",
          text: "Send directly from the Payment Service — faster and simpler",
          correct: false,
          consequence:
            "FCM is down for 30 seconds. Payments fail too — the entire service is blocked waiting for a notification that nobody will see.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Drop an event onto a message queue — let a separate worker handle it",
          correct: true,
          consequence:
            "Payment Service writes to queue in 1ms and returns. Notification worker picks it up, retries on failure. Two systems, two failure domains.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Fire-and-forget — send async but don't confirm delivery",
          correct: false,
          consequence:
            "Works until FCM drops 10,000 notifications silently. No retry, no log, no idea who missed what. Support queue explodes.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Decoupling with a message queue — the producer (Payment Service) drops a job and moves on. The consumer (Notification Worker) processes it independently with retries. One slow dependency can't cascade into another. This is the foundational pattern for reliable notifications at scale.",
    },
    {
      id: 2,
      question:
        "You need a message queue. Your infra team offers two options: Kafka or Redis Pub/Sub. A missed notification is a compliance problem — you're legally required to prove delivery.",
      context: "50M users. Notifications must be auditable. Some bursts hit 500K/sec.",
      options: [
        {
          id: "a",
          text: "Redis Pub/Sub — simpler, faster, easy to set up",
          correct: false,
          consequence:
            "Redis Pub/Sub has no persistence. If the consumer is down for 2 minutes, all messages during that window are lost permanently. The compliance team calls.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Kafka — persistent log, replay on failure, consumer groups",
          correct: true,
          consequence:
            "Kafka stores every message for 7 days. Consumer crashes? It restarts, reads from where it left off. Zero messages lost. Auditors are satisfied.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "A simple database table as a queue — we already have Postgres",
          correct: false,
          consequence:
            "Polling a DB at 500K/sec is a disaster. Locks, table bloat, missed messages under load. Database becomes the bottleneck for the entire system.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Kafka vs Pub/Sub — Kafka is a persistent, ordered log. Messages survive consumer restarts. Consumer groups allow parallel processing with guaranteed at-least-once delivery. Redis Pub/Sub is ephemeral — great for real-time fanout where losing a message is acceptable. For financial notifications, Kafka wins.",
    },
    {
      id: 3,
      question:
        "You support 3 channels: Push (FCM), SMS (Twilio), Email (SendGrid). Each has different rate limits, retry logic, and failure modes. One service for all, or separate workers per channel?",
      context:
        "FCM fails silently. SMS is expensive. Email is slow. Each provider has its own SDK and error codes.",
      options: [
        {
          id: "a",
          text: "One worker handles all three channels — simpler codebase",
          correct: false,
          consequence:
            "Twilio hits a rate limit. The single worker backs off — now push notifications are also delayed even though FCM is fine. One slow channel blocks all others.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Separate worker per channel — push-worker, sms-worker, email-worker",
          correct: true,
          consequence:
            "SMS worker slows down from Twilio rate limits. Push and Email workers continue at full speed. Isolated failure domains, independent scaling.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Fan out notifications synchronously at request time",
          correct: false,
          consequence:
            "Sending a payment notification now involves 3 sequential API calls. One timeout adds 30 seconds to your API response time.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Worker isolation — one Kafka topic per channel, one consumer group per worker type. SMS worker can scale independently, apply SMS-specific retry logic, and fail without impacting push or email. This is why microservices exist: blast radius containment. One service per concern.",
    },
    {
      id: 4,
      question:
        "Your SMS worker crashes mid-batch — it processed 40,000 of 100,000 notifications. When it restarts, how does it know where to pick up?",
      context:
        "You cannot resend 40,000 SMS messages — that's ₹80,000 in duplicate charges and angry users.",
      options: [
        {
          id: "a",
          text: "Start from the beginning of the batch — better safe than sorry",
          correct: false,
          consequence:
            "40,000 users get a duplicate 'Payment received' SMS. Some call banks. Some panic. You've burned both money and trust.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Kafka consumer offsets — commit only after successful delivery",
          correct: true,
          consequence:
            "Worker restarts. Kafka knows the last committed offset was message 40,001. It resumes from exactly there. No duplicates, no gaps.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Track processed IDs in Redis — skip if already processed",
          correct: false,
          consequence:
            "Works but Redis is another dependency. If Redis is also down, you're deduplicating nothing. Complexity without reliability.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Consumer offsets — Kafka tracks per-consumer-group the last message offset confirmed. A worker only commits its offset after successful delivery. Crash mid-batch? Restart from the uncommitted offset. This gives exactly-once semantics without any external state store — it's built into Kafka's protocol.",
    },
    {
      id: 5,
      question:
        "It's 2 AM. FCM is having an outage. 800,000 push notifications are queued. Your CTO asks: 'Will these users miss their alerts?' How do you handle a channel-level failure?",
      context:
        "Some alerts are critical — OTPs expire, fraud windows close. Users need to know.",
      options: [
        {
          id: "a",
          text: "Wait for FCM to recover — retry the push notifications",
          correct: false,
          consequence:
            "OTPs expire in 5 minutes. A user can't log in for 2 hours. Fraud alerts never land. Waiting isn't a strategy for time-sensitive notifications.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Mark notifications as failed — log and move on",
          correct: false,
          consequence:
            "A fraud alert that never reached the user led to ₹2 lakh stolen. 'We logged it' isn't an answer to 'why didn't you tell me?'",
          consequenceType: "failure",
        },
        {
          id: "c",
          text: "Fallback chain — push fails → try SMS → try email → try in-app",
          correct: true,
          consequence:
            "FCM is down. The system automatically falls back to SMS for critical alerts. User gets the OTP. Fraud is stopped. FCM outage is invisible to users.",
          consequenceType: "success",
        },
      ],
      learning:
        "Fallback chains — every critical notification has a priority-ordered list of channels. Push fails? Escalate to SMS. SMS fails? Escalate to email. Each channel is a separate worker, separately healthy. This is how production notification systems survive provider outages — never rely on a single channel for anything that matters.",
    },
  ],
  finalArchitecture:
    "Payment Service → Kafka → Push Worker + SMS Worker + Email Worker → FCM / Twilio / SendGrid (with fallback chain)",
  score: {
    perfect: "Zero missed notifications. Compliance team sends a thank-you.",
    good: "Solid system. One edge case could bite you at 3 AM.",
    average: "Users get most alerts. The ones they miss are the important ones.",
    poor: "2 million users still waiting for their OTP. Support is overwhelmed.",
  },
};
