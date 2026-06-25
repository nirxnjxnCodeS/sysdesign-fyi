"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import type { RequirementsSorterProps, RequirementItem } from "@/data/prep/types";

// ── Colour maps ────────────────────────────────────────────────────────────

const BUCKET_STYLES: Record<
  string,
  { border: string; bg: string; title: string; dimBorder: string }
> = {
  functional: {
    border: "rgba(245,158,11,0.5)",
    bg: "rgba(245,158,11,0.05)",
    title: "#F59E0B",
    dimBorder: "rgba(245,158,11,0.2)",
  },
  "non-functional": {
    border: "rgba(16,185,129,0.5)",
    bg: "rgba(16,185,129,0.05)",
    title: "#10B981",
    dimBorder: "rgba(16,185,129,0.2)",
  },
  "out-of-scope": {
    border: "rgba(244,63,94,0.5)",
    bg: "rgba(244,63,94,0.05)",
    title: "#F43F5E",
    dimBorder: "rgba(244,63,94,0.2)",
  },
};

// ── DraggableItemCard ──────────────────────────────────────────────────────

function DraggableItemCard({
  item,
  checked,
  isCorrect,
  disabled,
  overlay = false,
}: {
  item: RequirementItem;
  checked: boolean;
  isCorrect: boolean | null;
  disabled: boolean;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: item.id, disabled });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const borderColor = checked
    ? isCorrect
      ? "rgba(16,185,129,0.6)"
      : "rgba(244,63,94,0.6)"
    : "#2A2724";

  const bgColor = checked
    ? isCorrect
      ? "rgba(16,185,129,0.06)"
      : "rgba(244,63,94,0.06)"
    : "#1C1A18";

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={{
        ...style,
        opacity: isDragging && !overlay ? 0.3 : 1,
        cursor: disabled ? "default" : "grab",
        touchAction: "none",
        border: `1px solid ${borderColor}`,
        background: bgColor,
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 13,
        color: "#A09890",
        transition: "border-color 0.2s, background 0.2s",
        userSelect: "none",
      }}
      {...(overlay ? {} : { ...listeners, ...attributes })}
    >
      <p className="leading-snug">{item.text}</p>
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 6 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            {isCorrect ? (
              <p
                className="text-xs font-mono leading-relaxed"
                style={{ color: "#10B981" }}
              >
                ✓ {item.explanation}
              </p>
            ) : (
              <div>
                <p
                  className="text-xs font-mono"
                  style={{ color: "#F43F5E" }}
                >
                  Actually:{" "}
                  {item.correctBucket === "functional"
                    ? "Functional"
                    : item.correctBucket === "non-functional"
                    ? "Non-Functional"
                    : "Out of Scope"}
                </p>
                <p
                  className="text-xs font-mono mt-1 leading-relaxed"
                  style={{ color: "#524E4A" }}
                >
                  {item.explanation}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── DroppableBucket ────────────────────────────────────────────────────────

function DroppableBucket({
  bucket,
  assignedItems,
  checked,
  assignments,
}: {
  bucket: { id: string; label: string; description: string };
  assignedItems: RequirementItem[];
  checked: boolean;
  assignments: Record<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: bucket.id });
  const s = BUCKET_STYLES[bucket.id] ?? BUCKET_STYLES["functional"];
  const isEmpty = assignedItems.length === 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minHeight: 160,
        borderRadius: 12,
        border: isOver
          ? `2px solid ${s.border}`
          : isEmpty
          ? `1.5px dashed ${s.dimBorder}`
          : `1.5px solid ${s.border}`,
        background: isOver ? s.bg : isEmpty ? "transparent" : s.bg,
        transition: "border-color 0.15s, background 0.15s",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div className="mb-1">
        <p
          className="text-xs font-mono font-semibold"
          style={{ color: s.title }}
        >
          {bucket.label}
        </p>
        <p className="text-xs" style={{ color: "#524E4A" }}>
          {bucket.description}
        </p>
      </div>

      {isEmpty && !isOver && (
        <p
          className="text-xs font-mono text-center mt-4"
          style={{ color: "#3D3830" }}
        >
          drop here
        </p>
      )}

      {assignedItems.map((item) => (
        <DraggableItemCard
          key={item.id}
          item={item}
          checked={checked}
          isCorrect={
            checked
              ? item.correctBucket === bucket.id
              : null
          }
          disabled={checked}
        />
      ))}
    </div>
  );
}

// ── DroppablePile ──────────────────────────────────────────────────────────

function DroppablePile({
  unassignedItems,
  checked,
}: {
  unassignedItems: RequirementItem[];
  checked: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "__pile__" });

  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: 12,
        border: isOver ? "1.5px solid rgba(245,158,11,0.3)" : "1.5px solid #2A2724",
        background: isOver ? "rgba(245,158,11,0.03)" : "transparent",
        padding: "16px",
        transition: "border-color 0.15s, background 0.15s",
        minHeight: 80,
      }}
    >
      <p
        className="text-xs font-mono mb-3"
        style={{ color: "#524E4A" }}
      >
        drag items into the buckets above
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {unassignedItems.map((item) => (
          <DraggableItemCard
            key={item.id}
            item={item}
            checked={checked}
            isCorrect={null}
            disabled={checked}
          />
        ))}
        {unassignedItems.length === 0 && !checked && (
          <p className="text-xs font-mono" style={{ color: "#3D3830" }}>
            all items placed ✓
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function RequirementsSorter({ items, buckets }: RequirementsSorterProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((i) => [i.id, "__pile__"]))
  );
  const [checked, setChecked] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const unassigned = items.filter((i) => assignments[i.id] === "__pile__");
  const allPlaced = unassigned.length === 0;

  const score = checked
    ? items.filter((i) => i.correctBucket === assignments[i.id]).length
    : 0;
  const isPerfect = score === items.length;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    setAssignments((prev) => ({
      ...prev,
      [active.id as string]: over.id as string,
    }));
  }

  function handleCheck() {
    setChecked(true);
  }

  function handleReset() {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setAssignments(Object.fromEntries(shuffled.map((i) => [i.id, "__pile__"])));
    setChecked(false);
    setShowAll(false);
  }

  function handleShowAll() {
    const correct = Object.fromEntries(
      items.map((i) => [i.id, i.correctBucket])
    );
    setAssignments(correct);
    setShowAll(true);
  }

  const activeItem = activeId
    ? items.find((i) => i.id === activeId)
    : null;

  return (
    <div>
      <p className="text-xs font-mono mb-6" style={{ color: "#524E4A" }}>
        drag each item into the correct bucket
      </p>

      <DndContext id="requirements-sorter" onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Buckets */}
        <div className="flex gap-3 mb-4" style={{ flexWrap: "wrap" }}>
          {buckets.map((bucket) => (
            <DroppableBucket
              key={bucket.id}
              bucket={bucket}
              assignedItems={items.filter(
                (i) => assignments[i.id] === bucket.id
              )}
              checked={checked || showAll}
              assignments={assignments}
            />
          ))}
        </div>

        {/* Pile */}
        {!showAll && (
          <DroppablePile
            unassignedItems={unassigned}
            checked={checked}
          />
        )}

        {/* Drag overlay */}
        <DragOverlay>
          {activeItem ? (
            <div
              style={{
                border: "1px solid rgba(245,158,11,0.5)",
                background: "#1C1A18",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#F5F0EB",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                cursor: "grabbing",
                maxWidth: 300,
              }}
            >
              {activeItem.text}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-5">
        {!checked && !showAll && (
          <button
            onClick={handleCheck}
            disabled={!allPlaced}
            className="text-sm font-mono px-4 py-2 rounded-lg transition-all"
            style={{
              background: allPlaced ? "rgba(245,158,11,0.12)" : "#1C1A18",
              color: allPlaced ? "#F59E0B" : "#3D3830",
              border: allPlaced
                ? "1px solid rgba(245,158,11,0.3)"
                : "1px solid #2A2724",
              cursor: allPlaced ? "pointer" : "not-allowed",
            }}
          >
            Check answers
          </button>
        )}

        {checked && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <span
                className="font-mono text-sm font-medium"
                style={{ color: isPerfect ? "#10B981" : "#F59E0B" }}
              >
                {score}/{items.length} correct
              </span>
              {!isPerfect && !showAll && (
                <button
                  onClick={handleShowAll}
                  className="text-xs font-mono transition-colors"
                  style={{ color: "#524E4A" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#8C8680")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#524E4A")
                  }
                >
                  see all answers →
                </button>
              )}
              <button
                onClick={handleReset}
                className="text-xs font-mono transition-colors"
                style={{ color: "#524E4A" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#8C8680")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#524E4A")
                }
              >
                ↺ try again
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
