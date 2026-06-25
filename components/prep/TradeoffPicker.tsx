"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TradeoffPickerProps, TradeoffScenario } from "@/data/prep/types";

interface PickRecord {
  scenarioId: string;
  optionId: string;
  correct: boolean;
}

function ScenarioView({
  scenario,
  onPick,
  pick,
}: {
  scenario: TradeoffScenario;
  onPick: (optionId: string) => void;
  pick: PickRecord | null;
}) {
  const [showSeniorNote, setShowSeniorNote] = useState(false);

  function handlePick(optionId: string) {
    if (pick) return;
    onPick(optionId);
    setTimeout(() => setShowSeniorNote(true), 800);
  }

  return (
    <div>
      {/* Scenario */}
      <p
        className="text-base font-bold font-display mb-2"
        style={{ color: "#F5F0EB" }}
      >
        {scenario.scenario}
      </p>
      {scenario.context && (
        <p
          className="text-xs font-mono mb-5 leading-relaxed"
          style={{ color: "#524E4A" }}
        >
          {scenario.context}
        </p>
      )}

      {/* Options */}
      <div className="space-y-2">
        {scenario.options.map((option) => {
          const isPicked = pick?.optionId === option.id;
          const isCorrect = option.correct;
          const revealed = pick !== null;

          let borderColor = "#2A2724";
          let bgColor = "#1C1A18";
          let textColor = "#A09890";

          if (revealed) {
            if (isPicked && isCorrect) {
              borderColor = "rgba(16,185,129,0.6)";
              bgColor = "rgba(16,185,129,0.08)";
              textColor = "#F5F0EB";
            } else if (isPicked && !isCorrect) {
              borderColor = "rgba(244,63,94,0.6)";
              bgColor = "rgba(244,63,94,0.08)";
              textColor = "#F5F0EB";
            } else if (!isPicked && isCorrect) {
              borderColor = "rgba(16,185,129,0.3)";
              bgColor = "transparent";
              textColor = "#8C8680";
            } else {
              textColor = "#3D3830";
            }
          }

          return (
            <div key={option.id}>
              <button
                onClick={() => handlePick(option.id)}
                disabled={revealed}
                className="w-full text-left rounded-xl transition-all"
                style={{
                  border: `1px solid ${borderColor}`,
                  background: bgColor,
                  padding: "14px 16px",
                  cursor: revealed ? "default" : "pointer",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!revealed) {
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)";
                    e.currentTarget.style.background = "rgba(245,158,11,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!revealed) {
                    e.currentTarget.style.borderColor = "#2A2724";
                    e.currentTarget.style.background = "#1C1A18";
                  }
                }}
              >
                <p className="text-sm" style={{ color: textColor }}>
                  {option.label}
                </p>
              </button>

              {/* Consequence */}
              <AnimatePresence>
                {revealed && isPicked && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 6 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="text-xs font-mono px-2 leading-relaxed"
                    style={{
                      color: isCorrect ? "#10B981" : "#F43F5E",
                      overflow: "hidden",
                    }}
                  >
                    {isCorrect ? "✓" : "✗"} {option.consequence}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Senior note */}
      <AnimatePresence>
        {showSeniorNote && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5 rounded-xl p-4"
            style={{
              borderLeft: "3px solid rgba(245,158,11,0.5)",
              background: "rgba(245,158,11,0.04)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <p
              className="text-xs font-mono mb-1.5"
              style={{ color: "#F59E0B" }}
            >
              Senior engineer adds:
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#A09890" }}
            >
              {scenario.seniorNote}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryScreen({
  scenarios,
  picks,
  onReset,
}: {
  scenarios: TradeoffScenario[];
  picks: PickRecord[];
  onReset: () => void;
}) {
  const correct = picks.filter((p) => p.correct).length;
  const total = scenarios.length;
  const pct = Math.round((correct / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Score */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center font-mono text-lg font-bold"
          style={{
            border: `2px solid ${pct === 100 ? "#10B981" : "#F59E0B"}`,
            color: pct === 100 ? "#10B981" : "#F59E0B",
          }}
        >
          {correct}/{total}
        </div>
        <div>
          <p
            className="text-lg font-bold font-display"
            style={{ color: "#F5F0EB" }}
          >
            {pct === 100
              ? "Perfect score"
              : pct >= 75
              ? "Strong instincts"
              : pct >= 50
              ? "Good start"
              : "Keep studying"}
          </p>
          <p className="text-xs font-mono" style={{ color: "#524E4A" }}>
            {correct} of {total} correct
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div
        className="rounded-xl overflow-hidden mb-6"
        style={{ border: "1px solid #2A2724" }}
      >
        {scenarios.map((scenario, i) => {
          const pick = picks.find((p) => p.scenarioId === scenario.id);
          const isCorrect = pick?.correct ?? false;
          const correctOption = scenario.options.find((o) => o.correct);
          const pickedOption = scenario.options.find(
            (o) => o.id === pick?.optionId
          );

          return (
            <div
              key={scenario.id}
              className="px-5 py-4"
              style={{
                borderBottom:
                  i < scenarios.length - 1 ? "1px solid #2A2724" : "none",
                background: i % 2 === 0 ? "#1C1A18" : "#161513",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="shrink-0 mt-0.5"
                  style={{ color: isCorrect ? "#10B981" : "#F43F5E" }}
                >
                  {isCorrect ? "✓" : "✗"}
                </span>
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "#F5F0EB" }}
                  >
                    {scenario.scenario}
                  </p>
                  {!isCorrect && correctOption && (
                    <p
                      className="text-xs font-mono"
                      style={{ color: "#524E4A" }}
                    >
                      Correct answer: {correctOption.label}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onReset}
        className="text-sm font-mono px-4 py-2 rounded-lg transition-all"
        style={{
          background: "rgba(245,158,11,0.12)",
          color: "#F59E0B",
          border: "1px solid rgba(245,158,11,0.3)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(245,158,11,0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(245,158,11,0.12)";
        }}
      >
        ↺ try again
      </button>
    </motion.div>
  );
}

export function TradeoffPicker({ scenarios }: TradeoffPickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [picks, setPicks] = useState<PickRecord[]>([]);
  const [done, setDone] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const currentScenario = scenarios[currentIndex];
  const currentPick = picks.find((p) => p.scenarioId === currentScenario?.id) ?? null;
  const isLast = currentIndex === scenarios.length - 1;

  function handlePick(optionId: string) {
    const option = currentScenario.options.find((o) => o.id === optionId);
    if (!option) return;

    const record: PickRecord = {
      scenarioId: currentScenario.id,
      optionId,
      correct: option.correct,
    };
    setPicks((prev) => [...prev, record]);
    // Show next button after senior note delay
    setTimeout(() => setShowNext(true), 1200);
  }

  function handleNext() {
    setShowNext(false);
    if (isLast) {
      setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleReset() {
    setCurrentIndex(0);
    setPicks([]);
    setDone(false);
    setShowNext(false);
  }

  if (done) {
    return (
      <SummaryScreen
        scenarios={scenarios}
        picks={picks}
        onReset={handleReset}
      />
    );
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center gap-3 mb-6">
        <p className="text-xs font-mono" style={{ color: "#524E4A" }}>
          Scenario {currentIndex + 1} of {scenarios.length}
        </p>
        <div className="flex gap-1.5">
          {scenarios.map((_, i) => {
            const pick = picks.find(
              (p) => p.scenarioId === scenarios[i].id
            );
            return (
              <div
                key={i}
                style={{
                  width: 24,
                  height: 4,
                  borderRadius: 2,
                  background:
                    i < currentIndex
                      ? pick?.correct
                        ? "#10B981"
                        : "#F43F5E"
                      : i === currentIndex
                      ? "#F59E0B"
                      : "#2A2724",
                  transition: "background 0.2s",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Scenario */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScenario.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <ScenarioView
            scenario={currentScenario}
            onPick={handlePick}
            pick={currentPick}
          />
        </motion.div>
      </AnimatePresence>

      {/* Next button */}
      <AnimatePresence>
        {showNext && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <button
              onClick={handleNext}
              className="text-sm font-mono px-4 py-2 rounded-lg transition-all"
              style={{
                background: "rgba(245,158,11,0.12)",
                color: "#F59E0B",
                border: "1px solid rgba(245,158,11,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(245,158,11,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(245,158,11,0.12)";
              }}
            >
              {isLast ? "See results →" : "Next scenario →"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
