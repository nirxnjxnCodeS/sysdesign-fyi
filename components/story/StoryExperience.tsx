"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import type { SystemStoryData } from "@/lib/types";
import {
  loadProgress,
  saveProgress,
  clearProgress,
  type DecisionAnswer,
  type StoryProgress,
} from "@/lib/story-progress";
import { DecisionPanel } from "./DecisionPanel";
import { ArchitectureDiagram } from "./ArchitectureDiagram";
import { FinalScreen } from "./FinalScreen";

interface Props {
  systemData: SystemStoryData;
}

type Phase = "deciding" | "consequence" | "learning";

export function StoryExperience({ systemData }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("deciding");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, DecisionAnswer>>({});
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadProgress(systemData.id);
    if (saved) {
      setCurrentIdx(saved.currentIdx);
      setAnswers(saved.answers);
      if (saved.completed) setCompleted(true);
    }
    setHydrated(true);
  }, [systemData.id]);

  const persist = useCallback(
    (idx: number, ans: Record<number, DecisionAnswer>, done: boolean) => {
      const progress: StoryProgress = {
        systemId: systemData.id,
        currentIdx: idx,
        answers: ans,
        completed: done,
      };
      saveProgress(progress);
    },
    [systemData.id]
  );

  const handleSelect = useCallback(
    (optionId: string) => {
      if (phase !== "deciding") return;
      const decision = systemData.decisions[currentIdx];
      const option = decision.options.find((o) => o.id === optionId);
      if (!option) return;
      const answer: DecisionAnswer = { selectedId: optionId, isCorrect: option.correct };
      const newAnswers = { ...answers, [currentIdx]: answer };
      setSelectedId(optionId);
      setAnswers(newAnswers);
      setPhase("consequence");
      persist(currentIdx, newAnswers, false);
      setTimeout(() => setPhase("learning"), 1500);
    },
    [phase, currentIdx, answers, systemData.decisions, persist]
  );

  const handleNext = useCallback(() => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= systemData.decisions.length) {
      setCompleted(true);
      persist(nextIdx, answers, true);
    } else {
      setCurrentIdx(nextIdx);
      setSelectedId(null);
      setPhase("deciding");
      persist(nextIdx, answers, false);
    }
  }, [currentIdx, answers, systemData.decisions.length, persist]);

  const handleRestart = useCallback(() => {
    clearProgress(systemData.id);
    setCurrentIdx(0);
    setSelectedId(null);
    setPhase("deciding");
    setAnswers({});
    setCompleted(false);
  }, [systemData.id]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0E0D" }}>
        <div
          className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#F59E0B", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (completed) {
    return (
      <FinalScreen systemData={systemData} answers={answers} onRestart={handleRestart} />
    );
  }

  const decision = systemData.decisions[currentIdx];
  const selectedOption = decision.options.find((o) => o.id === selectedId);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-grid" style={{ background: "#0F0E0D" }}>
      {/* Fixed top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
        style={{ background: "rgba(15, 14, 13, 0.9)", borderColor: "#2A2724" }}
      >
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
          <Link
            href="/"
            className="font-mono text-xs transition-colors shrink-0"
            style={{ color: "#524E4A" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
          >
            ← home
          </Link>
          <span className="text-xs" style={{ color: "#2A2724" }}>·</span>
          <span className="font-mono text-xs truncate" style={{ color: "#524E4A" }}>
            {systemData.title}
          </span>
          <div className="flex-1" />
          <span className="font-mono text-xs shrink-0" style={{ color: "#3D3830" }}>
            {currentIdx + 1} / {systemData.decisions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-0.5" style={{ background: "#2A2724" }}>
          {(() => {
            const pct =
              ((currentIdx + (phase !== "deciding" ? 1 : 0.3)) /
                systemData.decisions.length) *
              100;
            const color = pct >= 80 ? "#10B981" : pct >= 40 ? "#FBB740" : "#F59E0B";
            return (
              <motion.div
                className="h-full"
                animate={{
                  width: `${pct}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 8px rgba(245, 158, 11, 0.4)`,
                }}
                transition={{
                  width: { type: "spring", stiffness: 180, damping: 28 },
                  backgroundColor: { duration: 0.6 },
                }}
              />
            );
          })()}
        </div>
      </div>

      {/* Spacer for fixed top bar */}
      <div className="h-[57px] shrink-0" />

      {/* Resizable split */}
      <PanelGroup
        direction="horizontal"
        autoSaveId="story-layout"
        style={{ flex: 1 }}
      >
        {/* Left: Decision panel */}
        <Panel defaultSize={62} minSize={35} maxSize={75}>
          <div style={{ height: "100%", overflowY: "auto" }}>
            <div className="max-w-[720px] flex flex-col justify-between px-5 sm:px-10 py-8 sm:py-10 min-h-full">
              <AnimatePresence mode="wait">
                <DecisionPanel
                  key={currentIdx}
                  decision={decision}
                  isFirstDecision={currentIdx === 0}
                  scenario={systemData.scenario}
                  phase={phase}
                  selectedId={selectedId}
                  selectedOption={selectedOption}
                  onSelect={handleSelect}
                  onNext={handleNext}
                  decisionIndex={currentIdx}
                  totalDecisions={systemData.decisions.length}
                />
              </AnimatePresence>

              {/* Dot progress indicator */}
              <div className="flex items-center justify-center gap-3 mt-8 pb-2">
                {systemData.decisions.map((_, i) => {
                  const isPast = i < currentIdx || (i === currentIdx && phase !== "deciding");
                  const isActive = i === currentIdx && phase === "deciding";
                  return (
                    <motion.div
                      key={i}
                      animate={{
                        background: isPast ? "#10B981" : isActive ? "#F59E0B" : "transparent",
                        borderColor: isPast ? "transparent" : isActive ? "transparent" : "#2A2724",
                      }}
                      transition={{ duration: 0.3 }}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        border: "1px solid #2A2724",
                        flexShrink: 0,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>

        {/* Drag handle */}
        <PanelResizeHandle className="resize-handle" />

        {/* Right: Architecture diagram */}
        <Panel defaultSize={38} minSize={25} maxSize={65}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              height: "100%",
              overflowY: "auto",
              borderLeft: "1px solid #2A2724",
              padding: "32px 24px",
            }}
          >
            <p className="font-mono text-xs mb-4" style={{ color: "#524E4A" }}>
              architecture
            </p>
            <ArchitectureDiagram answers={answers} systemId={systemData.id} />

            <AnimatePresence>
              {Object.keys(answers).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 flex items-center gap-2"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ background: "#F59E0B" }}
                  />
                  <span className="font-mono text-xs" style={{ color: "#524E4A" }}>
                    building in real-time
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
