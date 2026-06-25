"use client";

import { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export function SystemNode({ data, selected }: NodeProps) {
  const label = data.label as string;
  const icon = data.icon as string;
  const color = data.color as string;
  const isAnswer = data.isAnswer as boolean | undefined;
  const hint = data.hint as string | undefined;

  const [showHint, setShowHint] = useState(false);

  const accentColor = isAnswer ? "#F59E0B" : color;
  const borderColor = isAnswer
    ? "rgba(245, 158, 11, 0.5)"
    : selected
    ? "#F59E0B"
    : "#2A2724";
  const boxShadow = isAnswer
    ? "0 0 0 2px rgba(245, 158, 11, 0.08)"
    : selected
    ? "0 0 0 3px rgba(245, 158, 11, 0.15)"
    : "0 1px 4px rgba(0,0,0,0.5)";

  return (
    <div
      style={{
        width: 160,
        background: "#1C1A18",
        border: `1.5px solid ${borderColor}`,
        borderRadius: 6,
        boxShadow,
        display: "flex",
        alignItems: "stretch",
        overflow: "visible",
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          width: 3,
          background: accentColor,
          flexShrink: 0,
          borderRadius: "4px 0 0 4px",
        }}
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains), JetBrains Mono, ui-monospace, monospace",
            fontSize: 12,
            color: "#F5F0EB",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {label}
        </span>
      </div>

      {/* Answer-mode badges */}
      {isAnswer && (
        <div
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            display: "flex",
            alignItems: "center",
            gap: 3,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#F59E0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#0F0E0D",
              fontFamily: "ui-monospace, monospace",
              flexShrink: 0,
              boxShadow: "0 0 0 2px #1C1A18",
              fontWeight: 700,
            }}
          >
            ✓
          </div>

          {hint && (
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#2A2724",
                border: "1px solid #3D3830",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#8C8680",
                fontFamily: "ui-monospace, monospace",
                cursor: "help",
                flexShrink: 0,
                boxShadow: "0 0 0 2px #1C1A18",
              }}
              onMouseEnter={() => setShowHint(true)}
              onMouseLeave={() => setShowHint(false)}
            >
              ?
            </div>
          )}
        </div>
      )}

      {/* Hint tooltip */}
      {showHint && hint && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: 44,
            width: 200,
            background: "#2A2724",
            border: "1px solid #3D3830",
            padding: "8px 10px",
            borderRadius: 4,
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: 11,
            color: "#8C8680",
            lineHeight: 1.6,
            zIndex: 9999,
            pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          {hint}
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 8, height: 8, background: "#3D3830", border: "1px solid #524E4A", top: -4 }}
        className="system-handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 8, height: 8, background: "#3D3830", border: "1px solid #524E4A", bottom: -4 }}
        className="system-handle"
      />
    </div>
  );
}
