"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type OnConnect,
  type NodeTypes,
  type OnSelectionChangeFunc,
} from "@xyflow/react";
import Link from "next/link";
import { SystemNode } from "./SystemNode";
import { COMPONENT_GROUPS, COMPONENT_DESCRIPTIONS } from "./palette";
import { ResultsModal } from "./ResultsModal";
import { urlShortenerCanvas } from "@/data/systems/url-shortener-canvas";
import { paymentSystemCanvas } from "@/data/systems/payment-system-canvas";
import { notificationSystemCanvas } from "@/data/systems/notification-system-canvas";
import { stockPriceTickerCanvas } from "@/data/systems/stock-price-ticker-canvas";
import { chatSystemCanvas } from "@/data/systems/chat-system-canvas";
import { videoStreamingCanvas } from "@/data/systems/video-streaming-canvas";

const nodeTypes: NodeTypes = { system: SystemNode };

type CanvasData = {
  correctNodes: string[];
  criticalNodes: string[];
  correctEdges: { source: string; target: string }[];
  hints: Record<string, string>;
  answerNodes: { nodeId?: string; componentType: string; label: string; icon: string; color: string; x: number; y: number }[];
  answerEdges: { source: string; target: string; label?: string }[];
};

const CANVAS_DATA: Record<string, CanvasData> = {
  "url-shortener": urlShortenerCanvas,
  "payment-system": paymentSystemCanvas,
  "notification-system": notificationSystemCanvas,
  "stock-price-ticker": stockPriceTickerCanvas,
  "chat-system": chatSystemCanvas,
  "video-streaming": videoStreamingCanvas,
};

function DesignCanvasInner({
  systemId,
  systemTitle,
}: {
  systemId: string;
  systemTitle: string;
}) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showAnswerConfirm, setShowAnswerConfirm] = useState(false);
  const [isViewingAnswer, setIsViewingAnswer] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [draggingType, setDraggingType] = useState<string | null>(null);

  const past = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const future = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);

  const pushHistory = useCallback((n: Node[], e: Edge[]) => {
    past.current.push({ nodes: n, edges: e });
    future.current = [];
  }, []);

  useEffect(() => {
    const key = `sysdesign_canvas_${systemId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const { nodes: n, edges: e } = JSON.parse(saved);
        if (Array.isArray(n)) setNodes(n);
        if (Array.isArray(e)) setEdges(e);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [systemId, setNodes, setEdges]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      `sysdesign_canvas_${systemId}`,
      JSON.stringify({ nodes, edges })
    );
  }, [nodes, edges, hydrated, systemId]);

  const onConnect: OnConnect = useCallback(
    (params) => {
      pushHistory([...nodes], [...edges]);
      setEdges((eds) =>
        addEdge(
          { ...params, type: "smoothstep", style: { stroke: "#3D3830", strokeWidth: 1.5 } },
          eds
        )
      );
    },
    [nodes, edges, setEdges, pushHistory]
  );

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: sel }) => setSelectedNodeId(sel.length > 0 ? sel[0].id : null),
    []
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/reactflow");
      if (!raw) return;
      const { componentType, label, icon, color } = JSON.parse(raw);
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode: Node = {
        id: `${componentType}-${Date.now()}`,
        type: "system",
        position,
        data: { componentType, label, icon, color },
      };
      pushHistory([...nodes], [...edges]);
      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, nodes, edges, setNodes, pushHistory]
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedNodeId) return;
    pushHistory([...nodes], [...edges]);
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, nodes, edges, setNodes, setEdges, pushHistory]);

  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;
    pushHistory([...nodes], [...edges]);
    setNodes((nds) => nds.map((n, i) => ({ ...n, position: { x: 300, y: i * 150 } })));
  }, [nodes, edges, setNodes, pushHistory]);

  const handleClear = useCallback(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    if (!confirm("Clear the canvas? This cannot be undone.")) return;
    past.current = [];
    future.current = [];
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    localStorage.removeItem(`sysdesign_canvas_${systemId}`);
  }, [nodes, edges, setNodes, setEdges, systemId]);

  const handleUndo = useCallback(() => {
    if (past.current.length === 0) return;
    const prev = past.current.pop()!;
    future.current.push({ nodes: [...nodes], edges: [...edges] });
    setNodes(prev.nodes);
    setEdges(prev.edges);
  }, [nodes, edges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current.pop()!;
    past.current.push({ nodes: [...nodes], edges: [...edges] });
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [nodes, edges, setNodes, setEdges]);

  const handleShowAnswer = useCallback(() => {
    const cd = CANVAS_DATA[systemId] ?? CANVAS_DATA["url-shortener"];
    past.current = [];
    future.current = [];
    setSelectedNodeId(null);

    const answerNodes: Node[] = cd.answerNodes.map((n) => ({
      id: `answer-${n.nodeId ?? n.componentType}`,
      type: "system",
      position: { x: n.x, y: n.y },
      draggable: false,
      selectable: false,
      connectable: false,
      data: {
        componentType: n.componentType,
        label: n.label,
        icon: n.icon,
        color: n.color,
        isAnswer: true,
        hint:
          (cd.hints as Record<string, string>)[n.nodeId ?? n.componentType] ??
          (cd.hints as Record<string, string>)[n.componentType],
      },
    }));

    const answerEdges: Edge[] = cd.answerEdges.map((e, i) => ({
      id: `answer-edge-${i}`,
      source: `answer-${e.source}`,
      target: `answer-${e.target}`,
      type: "smoothstep",
      ...(e.label
        ? {
            label: e.label,
            labelStyle: { fontFamily: "ui-monospace, monospace", fontSize: 11, fill: "#8C8680" },
            labelBgStyle: { fill: "#161513", fillOpacity: 1 },
            labelBgPadding: [4, 8] as [number, number],
            labelBgBorderRadius: 2,
          }
        : {}),
      style: { stroke: "#F59E0B", strokeWidth: 1.5 },
    }));

    setNodes(answerNodes);
    setEdges(answerEdges);
    setIsViewingAnswer(true);
    setShowAnswerConfirm(false);
    setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 80);
  }, [systemId, setNodes, setEdges, fitView]);

  const clearAnswerView = useCallback(() => {
    past.current = [];
    future.current = [];
    setNodes([]);
    setEdges([]);
    setIsViewingAnswer(false);
    setSelectedNodeId(null);
    localStorage.removeItem(`sysdesign_canvas_${systemId}`);
  }, [setNodes, setEdges, systemId]);

  const canCheck = nodes.length >= 3 && edges.length >= 2 && !isViewingAnswer;

  const handleCheckDesign = useCallback(() => {
    if (!canCheck) return;
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setShowResults(true);
    }, 800);
  }, [canCheck]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const canvasData = CANVAS_DATA[systemId] ?? CANVAS_DATA["url-shortener"];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0F0E0D" }}>
      {/* Top bar */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "#0F0E0D", borderColor: "#2A2724" }}
      >
        <Link
          href={`/learn/${systemId}`}
          className="font-mono text-xs transition-colors"
          style={{ color: "#524E4A" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
        >
          ← story
        </Link>
        <span style={{ color: "#2A2724" }}>·</span>
        <span className="font-mono text-xs truncate" style={{ color: "#524E4A" }}>
          {systemTitle}
        </span>
        <span className="font-mono text-xs" style={{ color: "#2A2724" }}>
          / design mode
        </span>
        <div className="flex-1" />
        <button
          onClick={handleCheckDesign}
          disabled={!canCheck || isChecking}
          className="font-mono text-xs px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canCheck && !isChecking ? "#F59E0B" : "#2A2724",
            color: canCheck && !isChecking ? "#0F0E0D" : "#524E4A",
          }}
        >
          {isChecking ? "checking..." : "check design →"}
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — Component Palette */}
        <div
          className="w-[260px] shrink-0 flex flex-col overflow-y-auto border-r"
          style={{ background: "#0F0E0D", borderColor: "#2A2724" }}
        >
          <div className="px-4 pt-5 pb-2">
            <p className="font-mono text-xs" style={{ color: "#524E4A" }}>// components</p>
          </div>

          {COMPONENT_GROUPS.map((group) => (
            <div key={group.label} className="px-3 py-1.5">
              <p
                className="font-mono text-[10px] px-1 mb-1 tracking-widest"
                style={{ color: "#3D3830" }}
              >
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => {
                      setDraggingType(item.type);
                      e.dataTransfer.setData(
                        "application/reactflow",
                        JSON.stringify({
                          componentType: item.type,
                          label: item.label,
                          icon: item.icon,
                          color: group.color,
                        })
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDraggingType(null)}
                    className="flex items-center gap-2.5 h-10 px-2 cursor-grab active:cursor-grabbing select-none transition-all"
                    style={{
                      borderLeft: `3px solid ${group.color}`,
                      background: "#1C1A18",
                      opacity: draggingType === item.type ? 0.45 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (draggingType !== item.type)
                        (e.currentTarget as HTMLDivElement).style.background = "#2A2724";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "#1C1A18";
                    }}
                  >
                    <span className="text-sm leading-none">{item.icon}</span>
                    <span className="font-mono text-xs" style={{ color: "#8C8680" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="h-6" />
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div
            className="shrink-0 flex items-center gap-4 px-4 py-2 border-b"
            style={{ background: "#0F0E0D", borderColor: "#2A2724" }}
          >
            {["undo", "redo"].map((action) => (
              <button
                key={action}
                onClick={action === "undo" ? handleUndo : handleRedo}
                className="font-mono text-xs transition-colors"
                style={{ color: "#3D3830" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#3D3830")}
              >
                {action}
              </button>
            ))}
            <span className="text-xs select-none" style={{ color: "#2A2724" }}>|</span>
            <button
              onClick={handleAutoLayout}
              className="font-mono text-xs transition-colors"
              style={{ color: "#3D3830" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3D3830")}
            >
              auto layout
            </button>
            <button
              onClick={handleClear}
              className="font-mono text-xs transition-colors"
              style={{ color: "#3D3830" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F43F5E")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3D3830")}
            >
              clear
            </button>
            <span className="h-4 border-l" style={{ borderColor: "#2A2724" }} />
            <button
              onClick={() => setShowAnswerConfirm(true)}
              className="font-mono text-xs px-2 py-0.5 border transition-colors"
              style={{ borderColor: "rgba(245, 158, 11, 0.2)", color: "#8C8680" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#F59E0B";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245, 158, 11, 0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#8C8680";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245, 158, 11, 0.2)";
              }}
            >
              // show answer
            </button>
            <div className="flex-1" />
            <span className="font-mono text-xs select-none" style={{ color: "#2A2724" }}>
              {nodes.length} nodes · {edges.length} edges
            </span>
          </div>

          {/* Answer view banner */}
          {isViewingAnswer && (
            <div
              className="shrink-0 flex items-center gap-3 px-4 py-2 border-b"
              style={{
                background: "rgba(245, 158, 11, 0.05)",
                borderColor: "rgba(245, 158, 11, 0.2)",
              }}
            >
              <span className="font-mono text-xs" style={{ color: "#F59E0B" }}>
                // viewing correct architecture — try designing it yourself
              </span>
              <div className="flex-1" />
              <button
                onClick={clearAnswerView}
                className="font-mono text-xs transition-colors"
                style={{ color: "#8C8680" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F0EB")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8C8680")}
              >
                clear and retry →
              </button>
            </div>
          )}

          {/* React Flow */}
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              onDrop={isViewingAnswer ? undefined : onDrop}
              onDragOver={isViewingAnswer ? undefined : onDragOver}
              nodeTypes={nodeTypes}
              colorMode="dark"
              defaultEdgeOptions={{
                type: "smoothstep",
                style: { stroke: "#3D3830", strokeWidth: 1.5 },
              }}
              deleteKeyCode={isViewingAnswer ? null : "Delete"}
              nodesDraggable={!isViewingAnswer}
              nodesConnectable={!isViewingAnswer}
              elementsSelectable={!isViewingAnswer}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background variant={BackgroundVariant.Dots} color="#2A2724" gap={24} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="font-mono text-sm" style={{ color: "#3D3830" }}>
                  drag components here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — Inspector */}
        <div
          className="w-[280px] shrink-0 flex flex-col border-l"
          style={{ background: "#0F0E0D", borderColor: "#2A2724" }}
        >
          <div className="flex-1 px-4 pt-5 overflow-y-auto">
            <p className="font-mono text-xs mb-4" style={{ color: "#524E4A" }}>// inspector</p>

            {!selectedNode ? (
              <p className="font-mono text-xs" style={{ color: "#3D3830" }}>
                {isViewingAnswer
                  ? "hover a node ? to see why it's needed"
                  : "select a component"}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">{selectedNode.data.icon as string}</span>
                  <span className="font-mono text-sm font-medium" style={{ color: "#F5F0EB" }}>
                    {selectedNode.data.label as string}
                  </span>
                </div>
                <p className="font-mono text-xs leading-relaxed" style={{ color: "#524E4A" }}>
                  {COMPONENT_DESCRIPTIONS[selectedNode.data.componentType as string] ??
                    "A system component."}
                </p>
                <button
                  onClick={handleDeleteSelected}
                  className="font-mono text-xs transition-colors text-left"
                  style={{ color: "#F43F5E" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  // remove
                </button>
              </div>
            )}
          </div>

          {/* Check design */}
          <div className="shrink-0 p-4 border-t" style={{ borderColor: "#2A2724" }}>
            <button
              onClick={handleCheckDesign}
              disabled={!canCheck || isChecking}
              className="w-full font-mono text-sm py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canCheck && !isChecking ? "#F59E0B" : "#2A2724",
                color: canCheck && !isChecking ? "#0F0E0D" : "#524E4A",
              }}
            >
              {isChecking ? "checking..." : "check design →"}
            </button>
            {!canCheck && !isViewingAnswer && (
              <p className="font-mono text-[10px] mt-2 text-center leading-relaxed" style={{ color: "#3D3830" }}>
                {nodes.length < 3 && `add ${3 - nodes.length} more node${3 - nodes.length > 1 ? "s" : ""}`}
                {nodes.length < 3 && edges.length < 2 && " · "}
                {edges.length < 2 && `add ${2 - edges.length} more connection${2 - edges.length > 1 ? "s" : ""}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Answer confirmation modal */}
      {showAnswerConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowAnswerConfirm(false)}
        >
          <div
            className="w-full max-w-sm mx-4"
            style={{ background: "#161513", border: "1px solid #2A2724", padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-xs mb-3" style={{ color: "#524E4A" }}>// show answer</p>
            <p className="text-sm mb-1 leading-relaxed" style={{ color: "#8C8680" }}>
              This will reveal the correct architecture.
            </p>
            <p className="font-mono text-xs mb-6" style={{ color: "#3D3830" }}>
              Your current design will be cleared.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShowAnswer}
                className="font-mono text-xs px-4 py-2 transition-colors"
                style={{ background: "#F59E0B", color: "#0F0E0D" }}
              >
                show me
              </button>
              <button
                onClick={() => setShowAnswerConfirm(false)}
                className="font-mono text-xs transition-colors"
                style={{ color: "#524E4A" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
              >
                cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results modal */}
      {showResults && (
        <ResultsModal
          nodes={nodes}
          edges={edges}
          canvas={canvasData}
          systemTitle={systemTitle}
          systemId={systemId}
          onClose={() => setShowResults(false)}
          onReset={() => {
            setShowResults(false);
            handleClear();
          }}
        />
      )}
    </div>
  );
}

export function DesignCanvas({
  systemId,
  systemTitle,
}: {
  systemId: string;
  systemTitle: string;
}) {
  return (
    <ReactFlowProvider>
      <DesignCanvasInner systemId={systemId} systemTitle={systemTitle} />
    </ReactFlowProvider>
  );
}
