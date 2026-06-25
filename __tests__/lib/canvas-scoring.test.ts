// TEST 4 — Canvas scoring logic
// Tests scoreDesign from lib/canvas-scoring.ts using URL Shortener canvas as fixture.

import { scoreDesign, type FlowNode, type FlowEdge } from "@/lib/canvas-scoring";
import { urlShortenerCanvas } from "@/data/systems/url-shortener-canvas";

function node(id: string, componentType: string): FlowNode {
  return { id, data: { componentType, label: componentType, icon: "?", color: "#000" } };
}

function edge(source: string, target: string): FlowEdge {
  return { id: `${source}-${target}`, source, target };
}

// Correct architecture for URL Shortener
// correctNodes: ["user", "load-balancer", "app-server", "redis-cache", "nosql-db"]
// correctEdges (first 4): user→load-balancer, load-balancer→app-server, app-server→redis-cache, redis-cache→nosql-db

const correctNodes: FlowNode[] = [
  node("n-user", "user"),
  node("n-lb", "load-balancer"),
  node("n-app", "app-server"),
  node("n-redis", "redis-cache"),
  node("n-nosql", "nosql-db"),
];

const correctEdges: FlowEdge[] = [
  edge("n-user", "n-lb"),
  edge("n-lb", "n-app"),
  edge("n-app", "n-redis"),
  edge("n-redis", "n-nosql"),
];

describe("scoreDesign — URL Shortener", () => {
  test("exact correct nodes + edges → all present", () => {
    const { nodeResults, edgeResults } = scoreDesign(
      correctNodes,
      correctEdges,
      urlShortenerCanvas
    );
    expect(nodeResults.every((r) => r.present)).toBe(true);
    expect(edgeResults.every((r) => r.present)).toBe(true);
  });

  test("exact correct nodes + edges → 5/5 nodes, 4/4 display edges", () => {
    const { nodeResults, edgeResults } = scoreDesign(
      correctNodes,
      correctEdges,
      urlShortenerCanvas
    );
    expect(nodeResults.filter((r) => r.present)).toHaveLength(5);
    expect(edgeResults.filter((r) => r.present)).toHaveLength(4);
  });

  test("missing one critical node (redis-cache) → that node is not present", () => {
    const nodesWithoutRedis = correctNodes.filter(
      (n) => n.data.componentType !== "redis-cache"
    );
    const { nodeResults } = scoreDesign(
      nodesWithoutRedis,
      correctEdges,
      urlShortenerCanvas
    );
    const redisResult = nodeResults.find((r) => r.type === "redis-cache")!;
    expect(redisResult.present).toBe(false);
    expect(redisResult.critical).toBe(true);
  });

  test("missing critical node reduces present node count", () => {
    const nodesWithoutRedis = correctNodes.filter(
      (n) => n.data.componentType !== "redis-cache"
    );
    const { nodeResults } = scoreDesign(
      nodesWithoutRedis,
      correctEdges,
      urlShortenerCanvas
    );
    expect(nodeResults.filter((r) => r.present)).toHaveLength(4);
  });

  test("extra irrelevant nodes do not penalise the score", () => {
    const extraNodes = [
      ...correctNodes,
      node("n-extra-1", "kafka"),
      node("n-extra-2", "auth-service"),
      node("n-extra-3", "cdn"),
    ];
    const { nodeResults } = scoreDesign(
      extraNodes,
      correctEdges,
      urlShortenerCanvas
    );
    // All 5 correct nodes are still present
    expect(nodeResults.filter((r) => r.present)).toHaveLength(5);
  });

  test("correct nodes but no edges → 0 edges present", () => {
    const { edgeResults } = scoreDesign(correctNodes, [], urlShortenerCanvas);
    expect(edgeResults.filter((r) => r.present)).toHaveLength(0);
  });

  test("correct nodes but wrong connections → partial edge score", () => {
    // Only user→load-balancer connected, rest missing
    const partialEdges: FlowEdge[] = [edge("n-user", "n-lb")];
    const { edgeResults } = scoreDesign(
      correctNodes,
      partialEdges,
      urlShortenerCanvas
    );
    const presentEdges = edgeResults.filter((r) => r.present);
    expect(presentEdges.length).toBeGreaterThan(0);
    expect(presentEdges.length).toBeLessThan(edgeResults.length);
  });

  test("empty canvas → 0 nodes present, 0 edges present, no crash", () => {
    expect(() => scoreDesign([], [], urlShortenerCanvas)).not.toThrow();
    const { nodeResults, edgeResults } = scoreDesign([], [], urlShortenerCanvas);
    expect(nodeResults.filter((r) => r.present)).toHaveLength(0);
    expect(edgeResults.filter((r) => r.present)).toHaveLength(0);
  });

  test("accepts reverse-direction edges as valid connections", () => {
    // Scoring accepts both a→b and b→a for undirected display
    const reversedEdges: FlowEdge[] = [
      edge("n-lb", "n-user"),         // reversed user→load-balancer
      edge("n-app", "n-lb"),          // reversed load-balancer→app-server
      edge("n-redis", "n-app"),       // reversed app-server→redis-cache
      edge("n-nosql", "n-redis"),     // reversed redis-cache→nosql-db
    ];
    const { edgeResults } = scoreDesign(
      correctNodes,
      reversedEdges,
      urlShortenerCanvas
    );
    expect(edgeResults.every((r) => r.present)).toBe(true);
  });

  test("only displays first 4 correct edges (primary path, not alternative)", () => {
    const { edgeResults } = scoreDesign(correctNodes, correctEdges, urlShortenerCanvas);
    // The canvas has 5 correctEdges, but scoreDesign slices to first 4
    expect(edgeResults).toHaveLength(4);
  });

  test("nodeResults include correct/critical metadata", () => {
    const { nodeResults } = scoreDesign(correctNodes, correctEdges, urlShortenerCanvas);
    const redis = nodeResults.find((r) => r.type === "redis-cache")!;
    const loadBalancer = nodeResults.find((r) => r.type === "load-balancer")!;

    expect(redis.critical).toBe(true);   // criticalNodes includes redis-cache
    expect(loadBalancer.critical).toBe(false); // load-balancer not in criticalNodes
  });
});

describe("scoreDesign — unknown component type fallback", () => {
  function node(id: string, componentType: string): FlowNode {
    return { id, data: { componentType, label: componentType, icon: "?", color: "#000" } };
  }

  test("unknown type uses fallback label and icon (does not crash)", () => {
    // 'super-custom-db' is not in TYPE_ITEM — exercises the ?? fallback branch
    const unknownNodes: FlowNode[] = [
      node("n-user", "user"),
      node("n-custom", "super-custom-db"),
    ];
    expect(() =>
      scoreDesign(unknownNodes, [], urlShortenerCanvas)
    ).not.toThrow();
  });

  test("unknown edge endpoint uses fallback label", () => {
    // correctEdges reference unknown types → fallback branch in edgeResults
    const customCanvas = {
      ...urlShortenerCanvas,
      correctNodes: ["unknown-source", "unknown-target"],
      criticalNodes: ["unknown-source"],
      correctEdges: [{ source: "unknown-source", target: "unknown-target" }],
    };
    expect(() => scoreDesign([], [], customCanvas)).not.toThrow();
    const { edgeResults } = scoreDesign([], [], customCanvas);
    expect(edgeResults[0].sourceLabel).toBe("unknown-source");
    expect(edgeResults[0].targetLabel).toBe("unknown-target");
  });
});

describe("scoreDesign — 100+ node canvas stress test", () => {
  test("does not crash with 100 nodes", () => {
    const manyNodes: FlowNode[] = Array.from({ length: 100 }, (_, i) =>
      node(`stress-${i}`, i % 2 === 0 ? "app-server" : "user")
    );
    const manyEdges: FlowEdge[] = Array.from({ length: 99 }, (_, i) =>
      edge(`stress-${i}`, `stress-${i + 1}`)
    );
    expect(() => scoreDesign(manyNodes, manyEdges, urlShortenerCanvas)).not.toThrow();
  });
});
