"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { DecisionAnswer } from "@/lib/story-progress";

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  answers: Record<number, DecisionAnswer>;
  systemId?: string;
  /** Pass true on FinalScreen — shows all nodes without animation */
  staticMode?: boolean;
}

// ── Diagram spec types ─────────────────────────────────────────────────────

interface NodeSpec {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeRevealOn?: number;
}

interface SingleRowSpec {
  kind: "single";
  node: NodeSpec;
  revealOn?: number;
}

interface BranchRowSpec {
  kind: "branch";
  nodes: NodeSpec[];
  revealOn: number;
}

type RowSpec = SingleRowSpec | BranchRowSpec;

interface SystemSpec {
  rows: RowSpec[];
  flowLabel: string;
}

// ── Node accent colors (keyed by node id) ─────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  // users / external sources
  user:     "#3B82F6",
  client:   "#3B82F6",
  clients:  "#3B82F6",
  feed:     "#3B82F6",
  producer: "#3B82F6",

  // load balancers / gateways
  lb:       "#8B5CF6",

  // app servers / services
  app:      "#F59E0B",
  svc:      "#F59E0B",
  ws:       "#F59E0B",
  origin:   "#F59E0B",

  // caches / pub-sub
  redis:    "#F97316",
  pubsub:   "#F97316",

  // databases
  db:       "#10B981",
  sql:      "#10B981",
  tsdb:     "#10B981",

  // queues / kafka
  queue:    "#EF4444",
  kafka:    "#EF4444",

  // workers
  push:     "#06B6D4",
  sms:      "#06B6D4",
  email:    "#06B6D4",

  // CDN / storage
  cdn:      "#A78BFA",
  blob:     "#A78BFA",

  // other infra
  coord:    "#8B5CF6",
};

function nodeColor(id: string): string {
  return NODE_COLORS[id] ?? "#524E4A";
}

// ── Per-system diagram specs ───────────────────────────────────────────────

const DIAGRAMS: Record<string, SystemSpec> = {

  "url-shortener": {
    flowLabel: "User → Load Balancer → App Server → Redis Cache · NoSQL DB",
    rows: [
      {
        kind: "single",
        node: { id: "user", label: "user", sublabel: "10M req / day" },
      },
      {
        kind: "single", revealOn: 3,
        node: { id: "lb", label: "load_balancer", sublabel: "round-robin" },
      },
      {
        kind: "single", revealOn: 0,
        node: {
          id: "app", label: "app_server", sublabel: "stateless · http",
          badge: "base62_code_gen()", badgeRevealOn: 1,
        },
      },
      {
        kind: "branch", revealOn: 2,
        nodes: [
          { id: "redis", label: "redis_cache", sublabel: "in-memory · hot URLs" },
          { id: "db",    label: "nosql_db",    sublabel: "cassandra / dynamodb" },
        ],
      },
    ],
  },

  "notification-system": {
    flowLabel: "Payment Svc → Message Queue → Kafka → Push · SMS · Email",
    rows: [
      {
        kind: "single",
        node: { id: "producer", label: "payment_svc", sublabel: "event producer" },
      },
      {
        kind: "single", revealOn: 0,
        node: { id: "queue", label: "message_queue", sublabel: "decoupled delivery" },
      },
      {
        kind: "single", revealOn: 1,
        node: {
          id: "kafka", label: "kafka", sublabel: "persistent event log",
          badge: "consumer_offsets", badgeRevealOn: 3,
        },
      },
      {
        kind: "branch", revealOn: 2,
        nodes: [
          { id: "push",  label: "push",  sublabel: "FCM · APNS" },
          { id: "sms",   label: "sms",   sublabel: "Twilio · SNS" },
          { id: "email", label: "email", sublabel: "SES · SendGrid" },
        ],
      },
    ],
  },

  "payment-system": {
    flowLabel: "Client → Load Balancer → Payment Svc → 2PC Coordinator → SQL DB",
    rows: [
      {
        kind: "single",
        node: { id: "client", label: "client", sublabel: "mobile / web" },
      },
      {
        kind: "single", revealOn: 4,
        node: { id: "lb", label: "load_balancer", sublabel: "horizontal scale" },
      },
      {
        kind: "single", revealOn: 0,
        node: {
          id: "svc", label: "payment_svc", sublabel: "stateless · idempotent",
          badge: "idempotency_key", badgeRevealOn: 0,
        },
      },
      {
        kind: "single", revealOn: 2,
        node: { id: "coord", label: "2pc_coordinator", sublabel: "distributed commit" },
      },
      {
        kind: "single", revealOn: 1,
        node: {
          id: "db", label: "sql_db", sublabel: "ACID transactions",
          badge: "audit_log", badgeRevealOn: 3,
        },
      },
    ],
  },

  "stock-price-ticker": {
    flowLabel: "Market Feed → Pub/Sub Broker → WebSocket Server → Clients · Timeseries DB",
    rows: [
      {
        kind: "single",
        node: { id: "feed", label: "market_feed", sublabel: "NSE · BSE live prices" },
      },
      {
        kind: "single", revealOn: 2,
        node: { id: "pubsub", label: "pub_sub_broker", sublabel: "redis pub/sub" },
      },
      {
        kind: "single", revealOn: 1,
        node: {
          id: "ws", label: "websocket_server", sublabel: "2M concurrent conns",
          badge: "reconnect_handler", badgeRevealOn: 3,
        },
      },
      {
        kind: "branch", revealOn: 4,
        nodes: [
          { id: "clients", label: "clients",       sublabel: "iOS · Android · web" },
          { id: "tsdb",    label: "timeseries_db", sublabel: "OHLC · 6 months" },
        ],
      },
    ],
  },

  "chat-system": {
    flowLabel: "User → WebSocket Server → Cache · SQL DB · Kafka",
    rows: [
      {
        kind: "single",
        node: { id: "user", label: "user_a", sublabel: "sender" },
      },
      {
        kind: "single", revealOn: 0,
        node: { id: "ws", label: "websocket_server", sublabel: "persistent conn" },
      },
      {
        kind: "branch", revealOn: 1,
        nodes: [
          { id: "redis", label: "cache",   sublabel: "session · presence" },
          { id: "sql",   label: "sql_db",  sublabel: "messages · receipts" },
          { id: "kafka", label: "kafka",   sublabel: "cross-server fan-out" },
        ],
      },
    ],
  },

  "video-streaming": {
    flowLabel: "User → CDN Edge → Origin Server · Blob Storage",
    rows: [
      {
        kind: "single",
        node: { id: "user", label: "user", sublabel: "viewer" },
      },
      {
        kind: "single", revealOn: 2,
        node: { id: "cdn", label: "cdn_edge", sublabel: "Cloudflare · Akamai" },
      },
      {
        kind: "branch", revealOn: 3,
        nodes: [
          { id: "origin", label: "origin_server", sublabel: "HLS · DASH chunks" },
          { id: "blob",   label: "blob_storage",  sublabel: "S3 · encoded chunks" },
        ],
      },
    ],
  },
};

const DEFAULT_SPEC: SystemSpec = {
  flowLabel: "Client → App Server → Database",
  rows: [
    {
      kind: "single",
      node: { id: "client", label: "client", sublabel: "requests" },
    },
    {
      kind: "single", revealOn: 0,
      node: { id: "app", label: "app_server", sublabel: "handles logic" },
    },
    {
      kind: "single", revealOn: 2,
      node: { id: "db", label: "database", sublabel: "persists data" },
    },
  ],
};

// ── Row evaluation ─────────────────────────────────────────────────────────

interface EvaluatedRow {
  spec: RowSpec;
  isNew: boolean;
}

function evaluateRows(
  rows: RowSpec[],
  answers: Record<number, DecisionAnswer>,
  staticMode: boolean,
): EvaluatedRow[] {
  const c = (idx: number) => answers[idx]?.isCorrect ?? false;
  const keys = Object.keys(answers).map(Number);
  const lastIdx = keys.length > 0 ? Math.max(...keys) : -1;

  const result: EvaluatedRow[] = [];

  for (const row of rows) {
    const revealOn = row.kind === "single" ? row.revealOn : row.revealOn;

    if (revealOn === undefined) {
      result.push({ spec: row, isNew: false });
      continue;
    }

    if (!c(revealOn)) continue;

    const isNew = !staticMode && revealOn === lastIdx;
    result.push({ spec: row, isNew });
  }

  return result;
}

// ── Connectors ─────────────────────────────────────────────────────────────

const LINE_COLOR = "#3D3830";

function SimpleArrow({ isNew }: { isNew: boolean }) {
  return (
    <motion.div
      initial={isNew ? { scaleY: 0, opacity: 0 } : false}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      style={{
        transformOrigin: "top",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: 32,
      }}
    >
      <div style={{ flex: 1, width: 2, background: LINE_COLOR }} />
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: `6px solid ${LINE_COLOR}`,
        }}
      />
    </motion.div>
  );
}

function BranchConnector2({ isNew }: { isNew: boolean }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, scaleY: 0 } : false}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ transformOrigin: "top", width: "100%" }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* stem */}
        <div style={{ width: 2, height: 16, background: LINE_COLOR }} />

        {/* crossbar container — height 2 is the bar itself; drops are absolute and overflow */}
        <div style={{ position: "relative", width: "100%", height: 2 }}>
          {/* left half of crossbar */}
          <div style={{ position: "absolute", left: "25%", right: "50%", height: 2, background: LINE_COLOR }} />
          {/* right half of crossbar */}
          <div style={{ position: "absolute", left: "50%", right: "25%", height: 2, background: LINE_COLOR }} />
          {/* left drop */}
          <div style={{ position: "absolute", left: "25%", top: 0, width: 2, height: 16, background: LINE_COLOR }} />
          {/* right drop */}
          <div style={{ position: "absolute", right: "25%", top: 0, width: 2, height: 16, background: LINE_COLOR }} />
          {/* left arrowhead */}
          <div style={{
            position: "absolute", left: "calc(25% - 4px)", top: 16,
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `6px solid ${LINE_COLOR}`,
          }} />
          {/* right arrowhead */}
          <div style={{
            position: "absolute", right: "calc(25% - 4px)", top: 16,
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `6px solid ${LINE_COLOR}`,
          }} />
        </div>

        {/* spacer for the drop overflow */}
        <div style={{ height: 16 }} />
      </div>
    </motion.div>
  );
}

function BranchConnector3({ isNew }: { isNew: boolean }) {
  // Drops at ~16.5% (left), 50% (center), ~83.5% (right)
  return (
    <motion.div
      initial={isNew ? { opacity: 0, scaleY: 0 } : false}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ transformOrigin: "top", width: "100%" }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* stem */}
        <div style={{ width: 2, height: 16, background: LINE_COLOR }} />

        <div style={{ position: "relative", width: "100%", height: 2 }}>
          {/* crossbar spanning from 16.5% to 83.5% */}
          <div style={{ position: "absolute", left: "16.5%", right: "16.5%", height: 2, background: LINE_COLOR }} />
          {/* left drop */}
          <div style={{ position: "absolute", left: "16.5%", top: 0, width: 2, height: 16, background: LINE_COLOR }} />
          {/* center drop */}
          <div style={{ position: "absolute", left: "50%", top: 0, width: 2, height: 16, background: LINE_COLOR, transform: "translateX(-50%)" }} />
          {/* right drop */}
          <div style={{ position: "absolute", right: "16.5%", top: 0, width: 2, height: 16, background: LINE_COLOR }} />
          {/* left arrowhead */}
          <div style={{
            position: "absolute", left: "calc(16.5% - 4px)", top: 16,
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `6px solid ${LINE_COLOR}`,
          }} />
          {/* center arrowhead */}
          <div style={{
            position: "absolute", left: "calc(50% - 4px)", top: 16,
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `6px solid ${LINE_COLOR}`,
          }} />
          {/* right arrowhead */}
          <div style={{
            position: "absolute", right: "calc(16.5% - 4px)", top: 16,
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `6px solid ${LINE_COLOR}`,
          }} />
        </div>

        <div style={{ height: 16 }} />
      </div>
    </motion.div>
  );
}

// ── Node ───────────────────────────────────────────────────────────────────

function DiagramNode({
  node,
  isNew,
  compact,
  answers,
}: {
  node: NodeSpec;
  isNew: boolean;
  compact?: boolean;
  answers: Record<number, DecisionAnswer>;
}) {
  const c = (idx: number) => answers[idx]?.isCorrect ?? false;
  const showBadge = node.badgeRevealOn !== undefined && c(node.badgeRevealOn);
  const color = nodeColor(node.id);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.86, y: 6 },
        visible: { opacity: 1, scale: 1, y: 0 },
      }}
      initial={isNew ? "hidden" : false}
      animate="visible"
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 6,
        background: "#1C1A18",
        border: "1px solid #2A2724",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: 3,
          background: color,
          transformOrigin: "top",
        }}
        initial={{ scaleY: isNew ? 0 : 1 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: isNew ? 0.1 : 0 }}
      />

      <div style={{ paddingLeft: 13, paddingRight: 10, paddingTop: 9, paddingBottom: 9 }}>
        <p
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: compact ? 11 : 13,
            color: "#F5F0EB",
            lineHeight: 1.35,
          }}
        >
          {node.label}
        </p>

        {node.sublabel && (
          <p
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: compact ? 10 : 11,
              color: "#8C8680",
              marginTop: 2,
              lineHeight: 1.3,
            }}
          >
            {node.sublabel}
          </p>
        )}

        <AnimatePresence>
          {showBadge && node.badge && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, color: "#F59E0B" }}>›</span>
                <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, color: "#8C8680" }}>
                  {node.badge}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ArchitectureDiagram({
  answers,
  systemId = "url-shortener",
  staticMode = false,
}: Props) {
  const { rows: rowSpecs, flowLabel } = DIAGRAMS[systemId] ?? DEFAULT_SPEC;
  const rows = evaluateRows(rowSpecs, answers, staticMode);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <AnimatePresence mode="popLayout">
        {rows.map((row, i) => {
          const isBranch = row.spec.kind === "branch";
          const branchCount = isBranch ? (row.spec as BranchRowSpec).nodes.length : 0;

          const rowKey =
            row.spec.kind === "single"
              ? row.spec.node.id
              : `branch-${(row.spec as BranchRowSpec).nodes[0].id}`;

          return (
            <div key={rowKey}>
              {i > 0 && (
                isBranch ? (
                  branchCount === 3
                    ? <BranchConnector3 isNew={row.isNew} />
                    : <BranchConnector2 isNew={row.isNew} />
                ) : (
                  <SimpleArrow isNew={row.isNew} />
                )
              )}

              {row.spec.kind === "single" ? (
                <DiagramNode
                  node={row.spec.node}
                  isNew={row.isNew}
                  answers={answers}
                />
              ) : (
                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  {(row.spec as BranchRowSpec).nodes.map((node) => (
                    <div key={node.id} style={{ flex: 1, minWidth: 0 }}>
                      <DiagramNode
                        node={node}
                        isNew={row.isNew}
                        compact
                        answers={answers}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </AnimatePresence>

      {rows.length === 1 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 11,
            color: "#524E4A",
            marginTop: 16,
          }}
        >
          // builds as you decide correctly
        </motion.p>
      )}

      {rows.length > 1 && (
        <p
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 11,
            color: "#524E4A",
            marginTop: 16,
          }}
        >
          {flowLabel}
        </p>
      )}
    </div>
  );
}
