"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EstimationCalculatorProps } from "@/data/prep/types";

function shake(el: HTMLElement | null) {
  if (!el) return;
  el.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(6px)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 350, easing: "ease-in-out" }
  );
}

type RowState =
  | { status: "idle" }
  | { status: "correct" }
  | { status: "wrong"; attempts: number; revealed: boolean };

export function EstimationCalculator({
  steps,
  insight,
}: EstimationCalculatorProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(steps.filter((s) => s.userInput).map((s) => [s.id, ""]))
  );
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      steps.filter((s) => s.userInput).map((s) => [s.id, { status: "idle" }])
    )
  );
  const [calculated, setCalculated] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const inputSteps = steps.filter((s) => s.userInput);
  const allFilled = inputSteps.every((s) => values[s.id]?.trim() !== "");
  const allCorrect =
    calculated && inputSteps.every((s) => rowStates[s.id]?.status === "correct");

  function parseUserValue(raw: string): number {
    const cleaned = raw.replace(/,/g, "").toLowerCase();
    if (cleaned.endsWith("k")) return parseFloat(cleaned) * 1_000;
    if (cleaned.endsWith("m")) return parseFloat(cleaned) * 1_000_000;
    if (cleaned.endsWith("b")) return parseFloat(cleaned) * 1_000_000_000;
    if (cleaned.endsWith("t")) return parseFloat(cleaned) * 1_000_000_000_000;
    return parseFloat(cleaned);
  }

  function withinTolerance(userVal: number, answer: number) {
    if (answer === 0) return userVal === 0;
    return Math.abs((userVal - answer) / answer) <= 0.1;
  }

  function handleCalculate() {
    const newStates: Record<string, RowState> = {};
    let anyWrong = false;

    for (const step of inputSteps) {
      const userNum = parseUserValue(values[step.id] ?? "");
      if (isNaN(userNum) || !withinTolerance(userNum, step.answer)) {
        anyWrong = true;
        const prev = rowStates[step.id];
        const prevAttempts =
          prev.status === "wrong" ? prev.attempts : 0;
        newStates[step.id] = {
          status: "wrong",
          attempts: prevAttempts + 1,
          revealed: prevAttempts + 1 >= 2,
        };
        // Shake the row
        requestAnimationFrame(() => shake(rowRefs.current[step.id]));
      } else {
        newStates[step.id] = { status: "correct" };
      }
    }

    setRowStates((prev) => ({ ...prev, ...newStates }));
    setCalculated(true);

    if (!anyWrong) {
      setTimeout(() => setShowInsight(true), 400);
    }
  }

  function handleReveal(stepId: string) {
    setRowStates((prev) => ({
      ...prev,
      [stepId]: { status: "wrong", attempts: 2, revealed: true },
    }));
  }

  function handleReset() {
    setValues(
      Object.fromEntries(inputSteps.map((s) => [s.id, ""]))
    );
    setRowStates(
      Object.fromEntries(inputSteps.map((s) => [s.id, { status: "idle" }]))
    );
    setCalculated(false);
    setShowInsight(false);
  }

  const correctCount = inputSteps.filter(
    (s) => rowStates[s.id]?.status === "correct"
  ).length;

  return (
    <div>
      <p className="text-xs font-mono mb-6" style={{ color: "#524E4A" }}>
        fill in the blanks — within ±10% is accepted
      </p>

      {/* Step rows */}
      <div
        className="rounded-xl overflow-hidden mb-5"
        style={{ border: "1px solid #2A2724" }}
      >
        {steps.map((step, i) => {
          const state = step.userInput ? rowStates[step.id] : null;
          const isCorrect = state?.status === "correct";
          const isWrong = state?.status === "wrong";
          const revealed = state?.status === "wrong" && state.revealed;

          const rowBg = isCorrect
            ? "rgba(16,185,129,0.05)"
            : isWrong
            ? "rgba(244,63,94,0.05)"
            : i % 2 === 0
            ? "#1C1A18"
            : "#161513";

          return (
            <div
              key={step.id}
              ref={(el) => {
                rowRefs.current[step.id] = el;
              }}
              style={{
                background: rowBg,
                borderBottom:
                  i < steps.length - 1 ? "1px solid #2A2724" : "none",
                transition: "background 0.25s",
              }}
            >
              <div
                className="px-5 py-3 flex items-center gap-3"
                style={{ minHeight: 52 }}
              >
                {/* Label */}
                <div style={{ flex: "0 0 180px" }}>
                  <p
                    className="text-xs font-mono"
                    style={{ color: "#8C8680" }}
                  >
                    {step.label}
                  </p>
                </div>

                {/* Formula */}
                <div style={{ flex: 1 }}>
                  <p
                    className="text-xs font-mono"
                    style={{ color: "#3D3830" }}
                  >
                    {step.formula}
                  </p>
                </div>

                {/* Input or computed value */}
                <div
                  style={{ flex: "0 0 120px", display: "flex", justifyContent: "flex-end" }}
                >
                  {step.userInput ? (
                    <div className="relative">
                      {revealed ? (
                        <span
                          className="font-mono text-sm font-medium"
                          style={{ color: "#F43F5E" }}
                        >
                          {step.answer.toLocaleString()}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={values[step.id] ?? ""}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              [step.id]: e.target.value,
                            }))
                          }
                          disabled={isCorrect || revealed || (isWrong && revealed)}
                          placeholder="?"
                          className="font-mono text-sm text-right outline-none rounded-lg px-2 py-1 transition-all"
                          style={{
                            width: 100,
                            background: "#0F0E0D",
                            border: isCorrect
                              ? "1px solid rgba(16,185,129,0.5)"
                              : isWrong
                              ? "1px solid rgba(244,63,94,0.5)"
                              : "1px solid #2A2724",
                            color: isCorrect
                              ? "#10B981"
                              : isWrong
                              ? "#F43F5E"
                              : "#F5F0EB",
                          }}
                          onFocus={(e) => {
                            if (!isCorrect && !isWrong)
                              e.currentTarget.style.borderColor =
                                "rgba(245,158,11,0.5)";
                          }}
                          onBlur={(e) => {
                            if (!isCorrect && !isWrong)
                              e.currentTarget.style.borderColor = "#2A2724";
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <span
                      className="font-mono text-sm font-medium"
                      style={{ color: "#524E4A" }}
                    >
                      {step.answer.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Unit */}
                <div style={{ flex: "0 0 120px" }}>
                  <p
                    className="text-xs font-mono"
                    style={{ color: "#3D3830" }}
                  >
                    {step.unit}
                  </p>
                </div>

                {/* Status icon */}
                <div style={{ width: 20, textAlign: "center" }}>
                  {isCorrect && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ color: "#10B981", fontSize: 14 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Hint / reveal row */}
              <AnimatePresence>
                {isWrong && !revealed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      className="px-5 pb-3 flex items-center justify-between gap-3"
                    >
                      <p
                        className="text-xs font-mono"
                        style={{ color: "#F43F5E" }}
                      >
                        Hint: {step.hint}
                      </p>
                      {state.attempts >= 2 && (
                        <button
                          onClick={() => handleReveal(step.id)}
                          className="text-xs font-mono shrink-0 transition-colors"
                          style={{ color: "#524E4A" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#8C8680")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#524E4A")
                          }
                        >
                          reveal answer
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mb-5">
        {!allCorrect && (
          <button
            onClick={handleCalculate}
            disabled={!allFilled}
            className="text-sm font-mono px-4 py-2 rounded-lg transition-all"
            style={{
              background: allFilled ? "rgba(245,158,11,0.12)" : "#1C1A18",
              color: allFilled ? "#F59E0B" : "#3D3830",
              border: allFilled
                ? "1px solid rgba(245,158,11,0.3)"
                : "1px solid #2A2724",
              cursor: allFilled ? "pointer" : "not-allowed",
            }}
          >
            Calculate
          </button>
        )}

        {calculated && (
          <span
            className="font-mono text-sm"
            style={{ color: allCorrect ? "#10B981" : "#8C8680" }}
          >
            {correctCount}/{inputSteps.length} correct
          </span>
        )}

        {calculated && (
          <button
            onClick={handleReset}
            className="text-xs font-mono transition-colors"
            style={{ color: "#524E4A" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
          >
            ↺ reset
          </button>
        )}
      </div>

      {/* Insight */}
      <AnimatePresence>
        {showInsight && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-xl p-5"
            style={{
              border: "1px solid rgba(245,158,11,0.3)",
              borderLeft: "3px solid rgba(245,158,11,0.5)",
              background: "rgba(245,158,11,0.04)",
            }}
          >
            <p
              className="text-xs font-mono mb-2"
              style={{ color: "#F59E0B" }}
            >
              // what the math tells you
            </p>
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: "#A09890" }}
            >
              {insight}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
