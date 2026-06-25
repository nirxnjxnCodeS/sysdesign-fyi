import { TYPE_ITEM } from "@/components/design/palette";

export interface CanvasData {
  correctNodes: string[];
  criticalNodes: string[];
  correctEdges: { source: string; target: string }[];
  hints: Record<string, string>;
  answerNodes: {
    nodeId?: string;
    componentType: string;
    label: string;
    icon: string;
    color: string;
    x: number;
    y: number;
  }[];
  answerEdges: { source: string; target: string; label?: string }[];
}

// Minimal node/edge shapes — compatible with @xyflow/react Node/Edge at runtime
export interface FlowNode {
  id: string;
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface NodeResult {
  type: string;
  label: string;
  icon: string;
  present: boolean;
  critical: boolean;
}

export interface EdgeResult {
  sourceLabel: string;
  targetLabel: string;
  present: boolean;
}

export function scoreDesign(
  nodes: FlowNode[],
  edges: FlowEdge[],
  canvas: CanvasData
): { nodeResults: NodeResult[]; edgeResults: EdgeResult[] } {
  const presentTypes = new Set(nodes.map((n) => n.data.componentType as string));
  const idToType = new Map(
    nodes.map((n) => [n.id, n.data.componentType as string])
  );

  const nodeResults: NodeResult[] = canvas.correctNodes.map((type) => {
    const item = TYPE_ITEM[type] ?? { label: type, icon: "?" };
    return {
      type,
      label: item.label,
      icon: item.icon,
      present: presentTypes.has(type),
      critical: canvas.criticalNodes.includes(type),
    };
  });

  const presentEdgePairs = edges.map((e) => ({
    source: idToType.get(e.source) ?? "",
    target: idToType.get(e.target) ?? "",
  }));

  const displayEdges = canvas.correctEdges.slice(0, 4);

  const edgeResults: EdgeResult[] = displayEdges.map((ce) => {
    const sourceItem = TYPE_ITEM[ce.source] ?? { label: ce.source, icon: "" };
    const targetItem = TYPE_ITEM[ce.target] ?? { label: ce.target, icon: "" };
    const present = presentEdgePairs.some(
      (p) =>
        (p.source === ce.source && p.target === ce.target) ||
        (p.source === ce.target && p.target === ce.source)
    );
    return {
      sourceLabel: sourceItem.label,
      targetLabel: targetItem.label,
      present,
    };
  });

  return { nodeResults, edgeResults };
}
