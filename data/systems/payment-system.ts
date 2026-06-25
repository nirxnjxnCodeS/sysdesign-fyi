export const paymentSystem = {
  id: "payment-system",
  title: "Payment System",
  scenario:
    "It's Friday evening. You're the lead engineer at a fintech startup. The CEO just announced a partnership with 500 merchants. By Monday, your payment system needs to handle ₹10 crore in transactions per day. One bug could mean real money disappearing. Let's build it right.",
  decisions: [
    {
      id: 1,
      question:
        "A user taps 'Pay ₹500'. Their network cuts out mid-request. They panic and tap again. How do you make sure ₹500 doesn't get charged twice?",
      context:
        "Duplicate payments are a legal and trust nightmare. This is your first line of defense.",
      options: [
        {
          id: "a",
          text: "Generate a unique payment ID before sending — same ID = same payment",
          correct: true,
          consequence:
            "Every tap carries the same unique ID. Server sees it twice, processes it once. No duplicate charge.",
          consequenceType: "success",
        },
        {
          id: "b",
          text: "Check if the amount was already deducted before processing",
          correct: false,
          consequence:
            "Race condition — two requests arrive simultaneously, both check, both see 'not deducted yet', both charge. ₹1000 gone.",
          consequenceType: "failure",
        },
        {
          id: "c",
          text: "Limit users to one payment attempt every 30 seconds",
          correct: false,
          consequence:
            "Users with bad networks get locked out. Support tickets flood in. Merchants complain. Not a solution.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Idempotency — same request ID = same result, no matter how many times it arrives. Generate the payment ID on the client before the network call. The server deduplicates on that ID. This is the first rule of payment systems.",
    },
    {
      id: 2,
      question:
        "Your payment involves two banks — HDFC (sender) and SBI (receiver). Step 1 deducts ₹500 from HDFC. Server crashes before Step 2 adds it to SBI. Where did the money go?",
      context:
        "Partial transactions are worse than failed transactions. Money disappeared.",
      options: [
        {
          id: "a",
          text: "The bank's system will auto-recover it",
          correct: false,
          consequence:
            "Banks don't auto-recover what your server didn't tell them to. ₹500 is in limbo. Customer calls support.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Use a transaction — all steps succeed or all steps roll back",
          correct: true,
          consequence:
            "HDFC deduction rolls back automatically. ₹500 returns to sender. Clean state. No money lost.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Log the error and manually fix it later",
          correct: false,
          consequence:
            "At ₹10 crore/day, manual fixes don't scale. And customers don't wait for 'later'.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Atomicity — all steps in a transaction succeed together or none do. If your server crashes mid-payment, the transaction rolls back and money returns to the sender. Never a partial state.",
    },
    {
      id: 3,
      question:
        "HDFC and SBI run on completely separate databases. A single SQL transaction can't span both. How do you coordinate across two banks simultaneously?",
      context:
        "This is the hardest problem in distributed payments. One transaction, two isolated systems.",
      options: [
        {
          id: "a",
          text: "Just process both sequentially and hope nothing fails in between",
          correct: false,
          consequence:
            "HDFC succeeds. SBI times out. Money deducted, never received. The nightmare scenario.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Two-Phase Commit — ask both banks 'can you do it?' before anyone moves money",
          correct: true,
          consequence:
            "Phase 1: both banks confirm they're ready. Phase 2: both commit simultaneously. If either says no — nobody moves money.",
          consequenceType: "success",
        },
        {
          id: "c",
          text: "Process HDFC first, then SBI. If SBI fails, manually reverse HDFC",
          correct: false,
          consequence:
            "Manual reversal at scale is impossible. And what if the reversal also fails?",
          consequenceType: "failure",
        },
      ],
      learning:
        "Two-Phase Commit (2PC) — a coordinator asks all participants 'can you commit?' before anyone acts. Only when all say yes does the coordinator say 'go'. If anyone says no — full rollback. One authoritative coordinator, no partial states across systems.",
    },
    {
      id: 4,
      question:
        "Your system processes 50,000 transactions per day. A customer disputes a charge. Your support team asks: 'What exactly happened with payment PAY_001 at 10:00 AM?' Where do you find that information?",
      context: "Financial systems are legally required to explain every rupee.",
      options: [
        {
          id: "a",
          text: "Check the main transactions database",
          correct: false,
          consequence:
            "The DB shows current state — ₹500 deducted. But which step failed? When exactly? Who triggered it? The DB doesn't know.",
          consequenceType: "failure",
        },
        {
          id: "b",
          text: "Ask the banks directly",
          correct: false,
          consequence:
            "Banks have their own records but not your internal processing steps. You can't reconstruct what your system did.",
          consequenceType: "failure",
        },
        {
          id: "c",
          text: "Audit log — every event written permanently as it happens",
          correct: true,
          consequence:
            "10:00:00 — payment initiated. 10:00:01 — HDFC confirmed. 10:00:02 — SBI confirmed. 10:00:03 — committed. Every step, timestamped, immutable.",
          consequenceType: "success",
        },
      ],
      learning:
        "Audit logs — every payment event written to an immutable, append-only log as it happens. Initiation, preparation, commitment, failure, rollback — all timestamped. Required by law for financial systems. Essential for debugging. The paper trail that explains every rupee.",
    },
    {
      id: 5,
      question:
        "10 million users on Diwali day. Your single payment processor server is at 95% CPU. Queue is building. Payments are taking 8 seconds instead of 1. What do you do?",
      context: "Festival traffic is 10x normal. Your system is bending.",
      options: [
        {
          id: "a",
          text: "Add more payment processor servers behind a load balancer",
          correct: true,
          consequence:
            "Traffic distributed across 10 servers. Each handles 1M users. Latency drops to 0.8 seconds. Diwali saved.",
          consequenceType: "success",
        },
        {
          id: "b",
          text: "Increase server RAM and CPU (vertical scaling)",
          correct: false,
          consequence:
            "Helps temporarily but one server still has a ceiling. And it's expensive. Next festival you're back here.",
          consequenceType: "failure",
        },
        {
          id: "c",
          text: "Queue payments and process them overnight",
          correct: false,
          consequence:
            "'Your Diwali purchase will be processed tomorrow morning.' CEO is getting calls.",
          consequenceType: "failure",
        },
      ],
      learning:
        "Horizontal scaling — add more servers instead of making one server bigger. A load balancer distributes traffic evenly. Each server is stateless (thanks to idempotency keys), so any server can handle any payment. Scale out for peak traffic, scale in when it passes.",
    },
  ],
  finalArchitecture:
    "User → Load Balancer → Payment Service → 2PC Coordinator → HDFC + SBI → Audit Log",
  score: {
    perfect: "The money never got lost 💸",
    good: "Solid payments engineer. A few edge cases to tighten.",
    average: "The system works. Your CFO is nervous.",
    poor: "Finance team found some missing rupees. We need to talk.",
  },
};
