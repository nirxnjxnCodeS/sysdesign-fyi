import type { PrepData } from "./types";

export const paymentSystemPrep: PrepData = {
  systemId: "payment-system",
  systemName: "Payment System",
  sections: [
    {
      type: "interactive",
      sectionId: "requirements",
      step: "Step 1 — Requirements",
      title: "Sort the Requirements",
      subtitle:
        "Payment systems have strict requirements. Classify each one correctly — interviewers mark you down for confusing functional with non-functional here.",
      interaction: {
        type: "requirements-sort",
        items: [
          {
            id: "r1",
            text: "User can send money to another user",
            correctBucket: "functional",
            explanation: "Core feature — the primary action the system must support.",
          },
          {
            id: "r2",
            text: "System must process payments with exactly-once semantics",
            correctBucket: "non-functional",
            explanation:
              "Exactly-once delivery is a reliability guarantee — a non-functional requirement.",
          },
          {
            id: "r3",
            text: "Payment must complete in under 3 seconds",
            correctBucket: "non-functional",
            explanation: "Latency target — defines performance, not the feature itself.",
          },
          {
            id: "r4",
            text: "User can view transaction history",
            correctBucket: "functional",
            explanation: "A feature users interact with — clearly functional.",
          },
          {
            id: "r5",
            text: "Cryptocurrency payments",
            correctBucket: "out-of-scope",
            explanation:
              "Unless explicitly asked, crypto is out of scope for a basic payment system.",
          },
          {
            id: "r6",
            text: "System must handle 10,000 transactions per second at peak",
            correctBucket: "non-functional",
            explanation: "Scale requirement — defines how much, not what.",
          },
          {
            id: "r7",
            text: "99.999% uptime — financial systems cannot go down",
            correctBucket: "non-functional",
            explanation: "Availability SLA — a quality attribute, not a feature.",
          },
          {
            id: "r8",
            text: "User can request a refund",
            correctBucket: "functional",
            explanation: "Refunds are a functional capability users need.",
          },
          {
            id: "r9",
            text: "Fraud detection and prevention",
            correctBucket: "out-of-scope",
            explanation:
              "Fraud detection is a separate system — out of scope unless specified.",
          },
          {
            id: "r10",
            text: "All transactions must be auditable for 7 years",
            correctBucket: "non-functional",
            explanation:
              "Compliance/durability requirement — defines how data must be retained.",
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
            description: "How well it performs — reliability, speed, scale",
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
        "Payment systems are write-heavy unlike most systems. The numbers here justify your architecture choices.",
      interaction: {
        type: "estimation-calculator",
        steps: [
          {
            id: "e1",
            label: "Daily active users",
            formula: "Given assumption",
            answer: 10000000,
            unit: "DAU",
            userInput: false,
            hint: "",
            explanation:
              "10M DAU — similar to a mid-scale fintech like Razorpay India.",
          },
          {
            id: "e2",
            label: "Transactions per user per day",
            formula: "Given assumption",
            answer: 3,
            unit: "txns/user/day",
            userInput: false,
            hint: "",
            explanation:
              "3 transactions per user per day is a reasonable fintech assumption.",
          },
          {
            id: "e3",
            label: "Daily transactions",
            formula: "10M × 3",
            answer: 30000000,
            unit: "transactions/day",
            userInput: true,
            hint: "Multiply DAU by transactions per user",
            explanation: "30M transactions per day — this is your write volume.",
          },
          {
            id: "e4",
            label: "Write QPS (average)",
            formula: "30M ÷ 86,400",
            answer: 347,
            unit: "writes/sec",
            userInput: true,
            hint: "Divide daily transactions by seconds in a day",
            explanation:
              "~350 writes/sec average. But Diwali/festival peaks can be 10x — plan for 3,500 writes/sec.",
          },
          {
            id: "e5",
            label: "Storage per transaction",
            formula: "Given assumption",
            answer: 1000,
            unit: "bytes (~1KB)",
            userInput: false,
            hint: "",
            explanation:
              "~1KB per transaction including metadata, audit fields, and indexes.",
          },
          {
            id: "e6",
            label: "Storage for 5 years",
            formula: "30M × 365 × 5 × 1KB",
            answer: 54750000000000,
            unit: "bytes (~55 TB)",
            userInput: true,
            hint: "Daily transactions × days × years × bytes per transaction",
            explanation:
              "~55TB over 5 years. SQL handles this with proper sharding — payment data needs ACID, so NoSQL is not the right call here.",
          },
        ],
        insight:
          "Payment systems are write-heavy, not read-heavy — opposite of URL shorteners. This means: (1) SQL with ACID transactions, not NoSQL. (2) Write throughput is your bottleneck, not read throughput. (3) At 3,500 writes/sec peak, a single DB primary handles it — but add read replicas for balance/history queries. The 55TB storage is manageable with proper indexing and archival.",
      },
    },
    {
      type: "apiDesign",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/payments",
          description: "Initiate a payment",
          requestBody: `{
  "senderId": "user_123",
  "receiverId": "user_456",
  "amount": 50000,        // in paise (₹500.00)
  "currency": "INR",
  "idempotencyKey": "pay_uuid_abc123",  // REQUIRED
  "description": "Dinner split"
}`,
          response: `// 201 Created
{
  "paymentId": "txn_xyz789",
  "status": "PENDING",
  "amount": 50000,
  "currency": "INR",
  "createdAt": "2024-01-15T10:00:00Z"
}`,
          errors:
            "400 (invalid amount), 402 (insufficient funds), 409 (duplicate idempotencyKey)",
          notes:
            "Amount in smallest currency unit (paise) to avoid floating point bugs. idempotencyKey is REQUIRED — prevents duplicate charges on retry.",
        },
        {
          method: "GET",
          path: "/api/v1/payments/{paymentId}",
          description: "Get payment status",
          response: `// 200 OK
{
  "paymentId": "txn_xyz789",
  "status": "COMPLETED",  // PENDING | PROCESSING | COMPLETED | FAILED | REFUNDED
  "amount": 50000,
  "senderId": "user_123",
  "receiverId": "user_456",
  "completedAt": "2024-01-15T10:00:02Z"
}`,
        },
        {
          method: "POST",
          path: "/api/v1/payments/{paymentId}/refund",
          description: "Refund a completed payment",
          requestBody: `{
  "amount": 50000,          // partial refunds allowed
  "reason": "duplicate_charge",
  "idempotencyKey": "refund_uuid_def456"
}`,
          response: `// 201 Created
{
  "refundId": "ref_abc123",
  "originalPaymentId": "txn_xyz789",
  "status": "PENDING",
  "amount": 50000
}`,
        },
      ],
      trap: {
        title: "Money must NEVER be stored as float",
        content: `Float arithmetic is imprecise. 0.1 + 0.2 = 0.30000000000000004 in IEEE 754.
For money: always store amounts as integers in the smallest currency unit.
₹500.00 → store as 50000 paise. Never as 500.00.
This is not a preference — it's a requirement. Every financial system does this.`,
      },
    },
    {
      type: "interactive",
      sectionId: "deepDive",
      step: "Step 4 — Deep Dive",
      title: "Core Payment Concepts",
      subtitle:
        "Flip each card. These are the concepts that distinguish candidates who understand payments from those who memorize diagrams.",
      interaction: {
        type: "flashcard-deck",
        title: "Payment System Deep Dive",
        cards: [
          {
            id: "dc1",
            front: {
              label: "CONCEPT 1",
              title: "Idempotency",
              subtitle: "Same request N times = same result as once",
              tag: "Critical",
            },
            back: {
              explanation:
                "Networks are unreliable. Users tap Pay twice. Retry logic fires. Without idempotency, a ₹500 payment becomes ₹1000. The fix: client generates a unique idempotencyKey before the request. Server stores (key → result). On duplicate: return stored result without processing again.",
              code: `// Client generates before network call
idempotencyKey = UUID.generate()  // "pay_abc123"

// Server logic
if (cache.exists(idempotencyKey)):
    return cache.get(idempotencyKey)  // return previous result

result = processPayment(request)
cache.set(idempotencyKey, result, TTL=24h)
return result`,
              proTip:
                "Stripe, Razorpay, and every serious payment API require an Idempotency-Key header. It's the first thing you mention when designing payment APIs.",
            },
          },
          {
            id: "dc2",
            front: {
              label: "CONCEPT 2",
              title: "ACID Transactions",
              subtitle: "All steps succeed or all steps roll back",
              tag: "Critical",
            },
            back: {
              explanation:
                "A payment has two steps: deduct from sender, credit to receiver. If step 1 succeeds and the server crashes before step 2 — money disappears. ACID transactions guarantee atomicity: either both happen or neither does.",
              code: `BEGIN TRANSACTION;
  UPDATE accounts
    SET balance = balance - 50000
    WHERE user_id = 'sender' AND balance >= 50000;

  UPDATE accounts
    SET balance = balance + 50000
    WHERE user_id = 'receiver';

  INSERT INTO transactions (sender, receiver, amount, status)
    VALUES ('sender', 'receiver', 50000, 'COMPLETED');
COMMIT;
-- If ANYTHING fails above, entire transaction ROLLS BACK`,
              trap:
                "NoSQL databases typically don't support multi-row ACID transactions. This is why payment systems use SQL (PostgreSQL, MySQL), not Cassandra or DynamoDB.",
            },
          },
          {
            id: "dc3",
            front: {
              label: "CONCEPT 3",
              title: "Two-Phase Commit",
              subtitle: "Coordinating transactions across two separate banks",
              tag: "Advanced",
            },
            back: {
              explanation:
                "When sender and receiver are at different banks, a single DB transaction doesn't work — the banks have separate systems. Two-Phase Commit (2PC) coordinates: Phase 1 asks both banks 'can you commit?' Phase 2 says 'go' only if both say yes.",
              code: `// Coordinator (your payment service)
Phase 1 — Prepare:
  → HDFC: "Can you deduct ₹500 from account X?"
  ← HDFC: "Yes, I've reserved it."
  → SBI:  "Can you credit ₹500 to account Y?"
  ← SBI:  "Yes, ready to commit."

Phase 2 — Commit (both said yes):
  → HDFC: "Commit."  ← HDFC: "Done."
  → SBI:  "Commit."  ← SBI:  "Done."

// If EITHER bank says No in Phase 1:
  → Both banks: "Rollback." // No money moves`,
              proTip:
                "2PC is slow (two network round-trips) and has failure modes (coordinator crashes between phases). Production systems often use Saga pattern instead for long-running distributed transactions.",
            },
          },
          {
            id: "dc4",
            front: {
              label: "CONCEPT 4",
              title: "Audit Log",
              subtitle: "Immutable record of every payment event",
              tag: "Required",
            },
            back: {
              explanation:
                "Every payment event — initiated, processing, completed, failed, refunded — gets written to an append-only audit log. No updates, no deletes. Required by financial regulations in every jurisdiction.",
              code: `-- Audit log table (append-only, no UPDATE/DELETE)
CREATE TABLE payment_audit (
  id          BIGSERIAL PRIMARY KEY,
  payment_id  VARCHAR NOT NULL,
  event_type  VARCHAR NOT NULL,  -- INITIATED/PROCESSING/COMPLETED/FAILED
  event_data  JSONB,             -- full snapshot of payment state
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  -- No updated_at — this table is append-only
);

-- On every state change:
INSERT INTO payment_audit (payment_id, event_type, event_data)
VALUES ('txn_xyz', 'COMPLETED', '{"amount": 50000, "sender": "..."}');`,
              proTip:
                "Audit logs answer: 'What happened to payment X at 10:00 AM?' This is legally required and the first thing support teams ask for. Design it from day one, not as an afterthought.",
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
        "Payment tradeoffs have real financial consequences. Think before you pick.",
      interaction: {
        type: "tradeoff-picker",
        scenarios: [
          {
            id: "t1",
            scenario:
              "User taps Pay. Network drops. App retries the request 3 times. How do you prevent triple charging?",
            context:
              "This happens to real users constantly. Your API must handle it correctly.",
            options: [
              {
                id: "a",
                label:
                  "Check if a payment for the same amount was made in the last 60 seconds",
                correct: false,
                consequence:
                  "What if the user legitimately pays the same amount twice in 60 seconds? You block a valid payment. This logic has false positives and doesn't scale.",
              },
              {
                id: "b",
                label:
                  "Require an idempotencyKey header — same key = same payment, processed once",
                correct: true,
                consequence:
                  "Client generates a UUID before the first attempt. All retries send the same UUID. Server deduplicates. Three requests = one charge. Correct, scalable, industry standard.",
              },
              {
                id: "c",
                label: "Disable retries in the client — only allow one attempt",
                correct: false,
                consequence:
                  "Networks fail. Without retries, failed payments just fail. User experience destroyed. Not viable in production.",
              },
            ],
            seniorNote:
              "Idempotency keys are non-negotiable in payment APIs. Every major payment processor (Stripe, Razorpay, PayPal) requires them. The key insight: the client is responsible for generating the key before the network call, not after.",
          },
          {
            id: "t2",
            scenario: "Should your payment database use SQL or NoSQL?",
            context:
              "You have 55TB projected over 5 years. Payments require strict consistency.",
            options: [
              {
                id: "a",
                label: "SQL (PostgreSQL) — ACID transactions, strict consistency",
                correct: true,
                consequence:
                  "ACID guarantees atomicity — sender deducted AND receiver credited, or neither. Multi-row transactions work natively. Audit trail with strong consistency. The right tool for financial data.",
              },
              {
                id: "b",
                label: "NoSQL (Cassandra/DynamoDB) — scales better at 55TB",
                correct: false,
                consequence:
                  "NoSQL sacrifices ACID for scale. A payment touching two accounts in two rows is not atomic in most NoSQL systems. You'd need application-level transactions — complex, error-prone, and exactly what SQL gives you for free.",
              },
            ],
            seniorNote:
              "This is the most common mistake in payment system design. Scale arguments are real but secondary. 55TB is manageable with PostgreSQL sharding. The ACID requirement is not negotiable. Use SQL. Add read replicas for scale. Shard by user_id if needed.",
          },
          {
            id: "t3",
            scenario:
              "A payment is stuck in PROCESSING status for 10 minutes. What do you do?",
            context:
              "The bank API timed out. Money may or may not have moved. You don't know.",
            options: [
              {
                id: "a",
                label: "Mark it FAILED and refund the sender",
                correct: false,
                consequence:
                  "What if the bank actually processed it and just timed out on the response? You'd refund money that was already sent, creating a double-pay situation.",
              },
              {
                id: "b",
                label: "Retry immediately and hope it resolves",
                correct: false,
                consequence:
                  "Without idempotency on the bank side, retrying could create a duplicate charge at the bank. You don't control the bank's idempotency.",
              },
              {
                id: "c",
                label:
                  "Query the bank for the actual payment status, then update accordingly",
                correct: true,
                consequence:
                  "Banks provide a status query API. Poll until you get a definitive COMPLETED or FAILED response. Only then update your records. Never assume — always verify with the source of truth.",
              },
            ],
            seniorNote:
              "Stuck transactions are a real operational nightmare in payment systems. The answer is always: query the authoritative source (the bank) for ground truth. Build a reconciliation job that runs every 5 minutes checking all PROCESSING payments older than 2 minutes against the bank status API.",
          },
        ],
      },
    },
    {
      type: "cheatSheet",
      components:
        "User → Load Balancer → Payment Service → DB (SQL/ACID) → Audit Log + Bank APIs",
      numbers: [
        { label: "Write QPS (avg)", value: "~350/sec" },
        { label: "Write QPS (peak)", value: "~3,500/sec (10x festival)" },
        { label: "Storage (5yr)", value: "~55 TB" },
        { label: "Uptime target", value: "99.999% (5 nines)" },
        { label: "Payment latency target", value: "<3 seconds end-to-end" },
        { label: "Audit retention", value: "7 years (regulatory)" },
      ],
      decisions: [
        {
          decision: "SQL over NoSQL",
          why: "ACID transactions required — NoSQL can't atomically update sender + receiver in two rows",
        },
        {
          decision: "Idempotency keys",
          why: "Network retries are guaranteed — without idempotency, retries become duplicate charges",
        },
        {
          decision: "Integer amounts (paise)",
          why: "Float arithmetic is imprecise — ₹500.00 stored as 50000 paise, always",
        },
        {
          decision: "Audit log is append-only",
          why: "No UPDATE/DELETE on audit records — regulators require immutable history",
        },
        {
          decision: "2PC for cross-bank",
          why: "Atomic commit across two independent bank systems — all succeed or all roll back",
        },
      ],
    },
  ],
};
