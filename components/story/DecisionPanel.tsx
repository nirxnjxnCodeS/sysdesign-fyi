"use client";

import { useEffect } from "react";
import { motion, AnimatePresence, useAnimate } from "framer-motion";
import type { StoryDecisionData, StoryOptionData } from "@/lib/types";

type Phase = "deciding" | "consequence" | "learning";

interface Props {
  decision: StoryDecisionData;
  isFirstDecision: boolean;
  scenario: string;
  phase: Phase;
  selectedId: string | null;
  selectedOption: StoryOptionData | undefined;
  onSelect: (optionId: string) => void;
  onNext: () => void;
  decisionIndex: number;
  totalDecisions: number;
}

const SHAKE = [0, -10, 10, -9, 9, -6, 6, -3, 3, 0];

function OptionButton({
  option,
  phase,
  selectedId,
  onSelect,
}: {
  option: StoryOptionData;
  phase: Phase;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [scope, animate] = useAnimate();
  const isSelected = selectedId === option.id;
  const isDisabled = phase !== "deciding";
  const isCorrect = isSelected && option.correct;
  const isWrong = isSelected && !option.correct;
  const isDimmed = isDisabled && !isSelected;

  useEffect(() => {
    if (phase !== "consequence") return;
    if (isCorrect) {
      animate(scope.current, { scale: [1, 1.02, 1] }, { duration: 0.4, ease: "easeInOut" });
    }
    if (isWrong) {
      animate(scope.current, { x: SHAKE }, { duration: 0.55, ease: "easeOut" });
      animate(
        scope.current,
        { backgroundColor: ["transparent", "rgba(244, 63, 94, 0.06)", "transparent"] },
        { duration: 0.8 }
      );
    }
  }, [phase, isCorrect, isWrong, animate, scope]);

  const letterBg = isCorrect
    ? "#064e3b"
    : isWrong
    ? "#4c0519"
    : "#2A2724";
  const letterColor = isCorrect
    ? "#10B981"
    : isWrong
    ? "#F43F5E"
    : "#8C8680";

  const textColor = isCorrect
    ? "#10B981"
    : isWrong
    ? "#F43F5E"
    : isDimmed
    ? "#524E4A"
    : "#F5F0EB";

  return (
    <motion.div ref={scope}>
      <button
        onClick={() => !isDisabled && onSelect(option.id)}
        disabled={isDisabled}
        className={`group w-full text-left flex items-center gap-4 py-4 border-b transition-all ${
          isDimmed ? "opacity-30" : ""
        }`}
        style={{
          borderColor: "#2A2724",
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245, 158, 11, 0.4)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(245, 158, 11, 0.03)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#2A2724";
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        {/* Letter square */}
        <span
          className="shrink-0 w-7 h-7 flex items-center justify-center font-mono text-xs rounded transition-colors"
          style={{ background: letterBg, color: letterColor }}
        >
          {option.id.toUpperCase()}
        </span>

        {/* Text */}
        <span
          className="text-sm flex-1 leading-relaxed transition-colors"
          style={{ color: textColor }}
        >
          {option.text}
        </span>

        {/* Result glyph */}
        {isSelected && phase !== "deciding" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="shrink-0 font-mono text-sm"
            style={{ color: option.correct ? "#10B981" : "#F43F5E" }}
          >
            {option.correct ? "✓" : "✗"}
          </motion.span>
        )}
      </button>
    </motion.div>
  );
}

const slideIn = {
  enter: { opacity: 0, x: 32 },
  center: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -32, transition: { duration: 0.2 } },
};

export function DecisionPanel({
  decision,
  isFirstDecision,
  scenario,
  phase,
  selectedId,
  selectedOption,
  onSelect,
  onNext,
  decisionIndex,
  totalDecisions,
}: Props) {
  return (
    <motion.div
      variants={slideIn}
      initial="enter"
      animate="center"
      exit="exit"
      className="flex flex-col gap-5 max-w-2xl"
    >
      {/* Scenario card */}
      <AnimatePresence>
        {isFirstDecision && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="flex"
            style={{
              borderLeft: "2px solid #F59E0B",
              background: "rgba(245, 158, 11, 0.04)",
            }}
          >
            <div className="pl-4 pr-5 py-3">
              <p className="font-mono text-xs mb-2" style={{ color: "#F59E0B" }}>
                09:00 AM — CEO Message
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#8C8680" }}>
                {scenario}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decision counter */}
      <p className="font-mono text-xs" style={{ color: "#524E4A" }}>
        decision {decisionIndex + 1} of {totalDecisions}
      </p>

      {/* Question */}
      <div>
        <h2
          className="text-xl font-bold tracking-tight leading-tight mb-2"
          style={{ color: "#F5F0EB" }}
        >
          {decision.question}
          {phase === "deciding" && (
            <span
              className="cursor-blink inline-block align-middle ml-1.5"
              style={{
                width: "2px",
                height: "16px",
                borderRadius: "1px",
                background: "#F59E0B",
              }}
            />
          )}
        </h2>
        <p className="font-mono text-xs" style={{ color: "#524E4A" }}>
          {decision.context}
        </p>
      </div>

      {/* Options */}
      <div style={{ borderTop: "1px solid #2A2724" }}>
        {decision.options.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            phase={phase}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Consequence + learning */}
      <AnimatePresence>
        {phase !== "deciding" && selectedOption && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            {/* Consequence */}
            <div
              className="pl-4"
              style={{
                borderLeft: `2px solid ${selectedOption.correct ? "#10B981" : "#F43F5E"}`,
              }}
            >
              <p
                className="text-sm leading-relaxed"
                style={{ color: selectedOption.correct ? "#10B981" : "#F43F5E" }}
              >
                {selectedOption.consequence}
              </p>
            </div>

            {/* Learning moment */}
            <AnimatePresence>
              {phase === "learning" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="relative pl-4 py-3 overflow-hidden"
                  style={{ background: "rgba(245, 158, 11, 0.04)" }}
                >
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-[2px]"
                    style={{ background: "#F59E0B", originY: 0 }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
                  />
                  <p className="font-mono text-xs mb-2" style={{ color: "#F59E0B" }}>
                    learning moment
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#8C8680" }}>
                    {decision.learning}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next CTA */}
            <AnimatePresence>
              {phase === "learning" && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.18 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onNext}
                  className="font-mono text-sm transition-colors flex items-center gap-2"
                  style={{ color: "#F59E0B" }}
                >
                  {decisionIndex + 1 === totalDecisions ? "see results" : "next decision"}
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  >
                    →
                  </motion.span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
