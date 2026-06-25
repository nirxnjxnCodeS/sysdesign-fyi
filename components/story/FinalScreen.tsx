"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import type { SystemStoryData } from "@/lib/types";
import type { DecisionAnswer } from "@/lib/story-progress";
import { getScoreLabel, getScorePercent } from "@/lib/scoring";
import { ArchitectureDiagram } from "./ArchitectureDiagram";

interface Props {
  systemData: SystemStoryData;
  answers: Record<number, DecisionAnswer>;
  onRestart: () => void;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export function FinalScreen({ systemData, answers, onRestart }: Props) {
  const total = systemData.decisions.length;
  const correct = Object.values(answers).filter((a) => a.isCorrect).length;

  const allCorrectAnswers: Record<number, DecisionAnswer> = {};
  for (let i = 0; i < total; i++) {
    allCorrectAnswers[i] = { selectedId: "", isCorrect: true };
  }

  const scoreLabel = getScoreLabel(correct, total, systemData.score);
  const pct = getScorePercent(correct, total);

  useEffect(() => {
    if (pct === 100) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  }, [pct]);

  const arcStroke =
    pct === 100 ? "#10B981" : pct >= 60 ? "#F59E0B" : pct >= 40 ? "#92600A" : "#F43F5E";

  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="h-screen overflow-hidden flex flex-col bg-grid"
      style={{ background: "#0F0E0D" }}
    >
      {/* Top bar */}
      <div
        className="shrink-0 flex items-center gap-3 px-6 py-4 border-b"
        style={{ borderColor: "#2A2724" }}
      >
        <Link
          href="/"
          className="font-mono text-xs transition-colors"
          style={{ color: "#524E4A" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
        >
          ← home
        </Link>
        <span style={{ color: "#2A2724" }}>·</span>
        <span className="font-mono text-xs" style={{ color: "#524E4A" }}>
          {systemData.title}
        </span>
      </div>

      {/* Resizable split — shares autoSaveId with StoryExperience */}
      <PanelGroup
        direction="horizontal"
        autoSaveId="story-layout"
        style={{ flex: 1 }}
      >
        {/* Left — scrollable content */}
        <Panel defaultSize={62} minSize={35} maxSize={75}>
          <div style={{ height: "100%", overflowY: "auto" }}>
            <div className="max-w-[720px] px-6 py-10 flex flex-col gap-8">

              {/* Score */}
              <motion.div variants={item}>
                <p className="font-mono text-xs mb-4" style={{ color: "#524E4A" }}>final score</p>
                <div className="flex items-center gap-6">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r={radius} fill="none" stroke="#2A2724" strokeWidth="10" />
                      <motion.circle
                        cx="50" cy="50" r={radius}
                        fill="none"
                        stroke={arcStroke}
                        strokeWidth="10"
                        strokeLinecap="butt"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-lg font-bold" style={{ color: "#F5F0EB" }}>
                        {correct}/{total}
                      </span>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.2 }}
                  >
                    <p className="text-xl font-bold tracking-tight leading-tight font-display" style={{ color: "#F5F0EB" }}>
                      {scoreLabel}
                    </p>
                    <p className="font-mono text-xs mt-1" style={{ color: "#524E4A" }}>
                      {correct} of {total} correct
                    </p>
                  </motion.div>
                </div>
              </motion.div>

              {/* Decision breakdown */}
              <motion.div variants={item}>
                <p className="font-mono text-xs mb-3" style={{ color: "#524E4A" }}>decision breakdown</p>
                <div style={{ borderTop: "1px solid #2A2724" }}>
                  {systemData.decisions.map((decision, i) => {
                    const isCorrect = answers[i]?.isCorrect ?? false;
                    return (
                      <motion.div
                        key={decision.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.35,
                          delay: 0.4 + i * 0.08,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="flex items-center gap-3 py-2.5 border-b"
                        style={{ borderColor: "#2A2724" }}
                      >
                        <span
                          className={`shrink-0 w-2 h-2 rounded-full ${isCorrect ? "animate-pulse" : ""}`}
                          style={{ background: isCorrect ? "#10B981" : "#F43F5E" }}
                        />
                        <p
                          className="font-mono text-xs truncate"
                          style={{ color: isCorrect ? "#8C8680" : "#524E4A" }}
                        >
                          {decision.question}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Shareable card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="font-mono text-xs mb-3" style={{ color: "#524E4A" }}>shareable</p>
                <div
                  className="relative overflow-hidden w-full"
                  style={{
                    maxWidth: "480px",
                    minWidth: "360px",
                    backgroundColor: "#161513",
                    border: "1px solid #2A2724",
                    padding: "24px",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0"
                    style={{ height: "2px", background: "#F59E0B" }}
                  />
                  <div className="flex items-start justify-between mb-5">
                    <span className="font-mono text-xs" style={{ color: "#524E4A" }}>sysdesign.fyi</span>
                    <span className="font-mono text-2xl font-bold leading-none" style={{ color: "#F5F0EB" }}>
                      {correct}/{total}
                    </span>
                  </div>
                  <div className="mb-5">
                    <p className="text-xl font-bold leading-tight" style={{ color: "#F5F0EB" }}>
                      {systemData.title}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: "#8C8680" }}>{scoreLabel}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: total }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: "24px",
                          height: "6px",
                          borderRadius: "2px",
                          backgroundColor: answers[i]?.isCorrect
                            ? "#10B981"
                            : answers[i]
                            ? "#F43F5E"
                            : "#2A2724",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div variants={item} className="flex flex-col gap-4">
                <Link
                  href={`/prep/${systemData.id}`}
                  className="font-mono text-sm flex items-center gap-2 transition-all px-4 py-2.5 rounded-lg w-fit"
                  style={{
                    color: "#F59E0B",
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(245,158,11,0.12)";
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(245,158,11,0.08)";
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)";
                  }}
                >
                  Go to Interview Prep →
                </Link>
                <div className="flex flex-wrap items-center gap-5">
                  <Link
                    href={`/design/${systemData.id}`}
                    className="font-mono text-sm flex items-center gap-2 transition-colors"
                    style={{ color: "#8C8680" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#A09890")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#8C8680")}
                  >
                    design it yourself →
                  </Link>
                  <Link
                    href="/"
                    className="font-mono text-sm transition-colors"
                    style={{ color: "#524E4A" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
                  >
                    try another system
                  </Link>
                  <button
                    onClick={onRestart}
                    className="font-mono text-sm transition-colors"
                    style={{ color: "#524E4A" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
                  >
                    ↺ restart
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </Panel>

        {/* Drag handle */}
        <PanelResizeHandle className="resize-handle" />

        {/* Right: final architecture */}
        <Panel defaultSize={38} minSize={25} maxSize={65}>
          <motion.div
            variants={item}
            style={{
              height: "100%",
              overflowY: "auto",
              borderLeft: "1px solid #2A2724",
              padding: "32px 24px",
            }}
          >
            <p className="font-mono text-xs mb-4" style={{ color: "#524E4A" }}>final architecture</p>
            <ArchitectureDiagram answers={allCorrectAnswers} systemId={systemData.id} staticMode />
            <p className="font-mono text-xs mt-5" style={{ color: "#3D3830" }}>
              {systemData.finalArchitecture}
            </p>
          </motion.div>
        </Panel>
      </PanelGroup>
    </motion.div>
  );
}
