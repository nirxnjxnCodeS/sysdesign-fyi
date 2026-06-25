"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Node, Edge } from "@xyflow/react";
import { scoreDesign, type CanvasData } from "@/lib/canvas-scoring";

interface Props {
  nodes: Node[];
  edges: Edge[];
  canvas: CanvasData;
  systemTitle: string;
  systemId: string;
  onClose: () => void;
  onReset: () => void;
}

export function ResultsModal({
  nodes,
  edges,
  canvas,
  systemTitle,
  systemId,
  onClose,
  onReset,
}: Props) {
  const { nodeResults, edgeResults } = scoreDesign(nodes, edges, canvas);
  const correctNodes = nodeResults.filter((r) => r.present).length;
  const correctEdges = edgeResults.filter((r) => r.present).length;
  const totalNodes = nodeResults.length;
  const totalEdges = edgeResults.length;
  const missingCritical = nodeResults.filter((r) => r.critical && !r.present);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 80 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 80 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg"
          style={{
            background: "#161513",
            border: "1px solid #2A2724",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Amber top line */}
          <div style={{ height: 2, background: "#F59E0B" }} />

          <div className="p-6 flex flex-col gap-6">
            {/* Header */}
            <div>
              <p className="font-mono text-xs mb-1" style={{ color: "#524E4A" }}>
                design review · {systemTitle}
              </p>
              <h2 className="text-xl font-bold font-display" style={{ color: "#F5F0EB" }}>
                {correctNodes}/{totalNodes} components · {correctEdges}/{totalEdges} connections
              </h2>
            </div>

            {/* Component results */}
            <div>
              <p className="font-mono text-xs mb-3" style={{ color: "#524E4A" }}>components</p>
              <div className="flex flex-col gap-1.5">
                {nodeResults.map((r) => (
                  <div key={r.type} className="flex items-center gap-3">
                    <span
                      className="font-mono text-xs shrink-0"
                      style={{ color: r.present ? "#10B981" : "#F43F5E", width: 12 }}
                    >
                      {r.present ? "✓" : "✗"}
                    </span>
                    <span className="text-sm">{r.icon}</span>
                    <span
                      className="font-mono text-xs"
                      style={{ color: r.present ? "#8C8680" : "#524E4A" }}
                    >
                      {r.label}
                      {r.critical && !r.present && (
                        <span className="ml-1.5" style={{ color: "#F43F5E" }}>critical</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Edge results */}
            <div>
              <p className="font-mono text-xs mb-3" style={{ color: "#524E4A" }}>connections</p>
              <div className="flex flex-col gap-1.5">
                {edgeResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className="font-mono text-xs shrink-0"
                      style={{ color: r.present ? "#10B981" : "#F43F5E", width: 12 }}
                    >
                      {r.present ? "✓" : "✗"}
                    </span>
                    <span
                      className="font-mono text-xs"
                      style={{ color: r.present ? "#8C8680" : "#524E4A" }}
                    >
                      {r.sourceLabel} → {r.targetLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing critical hints */}
            {missingCritical.length > 0 && (
              <div
                className="flex flex-col gap-2 p-4"
                style={{ background: "#0F0E0D", borderLeft: "2px solid #F43F5E" }}
              >
                <p className="font-mono text-xs mb-1" style={{ color: "#524E4A" }}>
                  what you missed
                </p>
                {missingCritical.map((r) => {
                  const hint = (canvas.hints as Record<string, string>)[r.type];
                  return hint ? (
                    <div key={r.type} className="flex gap-2">
                      <span className="font-mono text-xs shrink-0 mt-0.5" style={{ color: "#F43F5E" }}>
                        {r.icon}
                      </span>
                      <p className="font-mono text-xs leading-relaxed" style={{ color: "#8C8680" }}>
                        {hint}
                      </p>
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={onReset}
                className="font-mono text-sm transition-colors"
                style={{ color: "#8C8680" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F0EB")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8C8680")}
              >
                ↺ try again
              </button>
              <Link
                href="/"
                className="font-mono text-sm ml-auto transition-colors"
                style={{ color: "#F59E0B" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FBB740")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#F59E0B")}
              >
                next system →
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
