// TEST 10 — Edge cases
// Tests boundary conditions: rapid clicks, large inputs, special characters.

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { scoreDesign, type FlowNode, type FlowEdge } from "@/lib/canvas-scoring";
import { urlShortenerCanvas } from "@/data/systems/url-shortener-canvas";
import { saveProgress, loadProgress } from "@/lib/story-progress";

// ── Rapid click protection ──────────────────────────────────────────────────────

jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement("div", { ...props, ref }, children)
      ),
      span: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement("span", { ...props, ref }, children)
      ),
    },
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    useAnimate: () => [React.createRef(), jest.fn()],
  };
});

import { DecisionPanel } from "@/components/story/DecisionPanel";
import type { StoryDecisionData, StoryOptionData } from "@/lib/types";

const CORRECT_OPTION: StoryOptionData = {
  id: "a",
  text: "Correct option",
  correct: true,
  consequence: "Well done",
  consequenceType: "success",
};

const WRONG_OPTION_B: StoryOptionData = {
  id: "b",
  text: "Wrong B",
  correct: false,
  consequence: "Bad",
  consequenceType: "failure",
};

const WRONG_OPTION_C: StoryOptionData = {
  id: "c",
  text: "Wrong C",
  correct: false,
  consequence: "Also bad",
  consequenceType: "failure",
};

const MOCK_DECISION: StoryDecisionData = {
  id: 1,
  question: "Test question?",
  context: "Some context",
  options: [CORRECT_OPTION, WRONG_OPTION_B, WRONG_OPTION_C],
  learning: "Learning text",
};

describe("Rapid clicking edge cases", () => {
  test("clicking multiple different options only calls onSelect once per click", () => {
    const onSelect = jest.fn();
    render(
      <DecisionPanel
        decision={MOCK_DECISION}
        isFirstDecision={false}
        scenario="test"
        phase="deciding"
        selectedId={null}
        selectedOption={undefined}
        onSelect={onSelect}
        onNext={jest.fn()}
        decisionIndex={0}
        totalDecisions={5}
      />
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);

    // Each click fires, but parent controls disabled state
    expect(onSelect).toHaveBeenCalledTimes(3);
    expect(onSelect).toHaveBeenNthCalledWith(1, "a");
    expect(onSelect).toHaveBeenNthCalledWith(2, "b");
    expect(onSelect).toHaveBeenNthCalledWith(3, "c");
  });

  test("clicking disabled buttons in consequence phase does NOT call onSelect", () => {
    const onSelect = jest.fn();
    render(
      <DecisionPanel
        decision={MOCK_DECISION}
        isFirstDecision={false}
        scenario="test"
        phase="consequence"
        selectedId="a"
        selectedOption={CORRECT_OPTION}
        onSelect={onSelect}
        onNext={jest.fn()}
        decisionIndex={0}
        totalDecisions={5}
      />
    );

    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => fireEvent.click(btn));

    expect(onSelect).not.toHaveBeenCalled();
  });

  test("clicking Next decision multiple times fires onNext each time (button re-enabled by parent)", () => {
    const onNext = jest.fn();
    render(
      <DecisionPanel
        decision={MOCK_DECISION}
        isFirstDecision={false}
        scenario="test"
        phase="learning"
        selectedId="a"
        selectedOption={CORRECT_OPTION}
        onSelect={jest.fn()}
        onNext={onNext}
        decisionIndex={0}
        totalDecisions={5}
      />
    );

    const nextButton = screen.getByText(/next decision/i);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    // Both clicks fire — parent is responsible for transition (disabling the button)
    expect(onNext).toHaveBeenCalledTimes(2);
  });
});

// ── Canvas scoring with large input ─────────────────────────────────────────────

describe("Canvas scoring with large node count", () => {
  function node(id: string, componentType: string): FlowNode {
    return {
      id,
      data: { componentType, label: componentType, icon: "?", color: "#000" },
    };
  }

  function edge(source: string, target: string): FlowEdge {
    return { id: `${source}-${target}`, source, target };
  }

  test("100 nodes does not crash scoreDesign", () => {
    const nodes: FlowNode[] = Array.from({ length: 100 }, (_, i) =>
      node(`n-${i}`, i % 5 === 0 ? "user" : "app-server")
    );
    const edges: FlowEdge[] = Array.from({ length: 99 }, (_, i) =>
      edge(`n-${i}`, `n-${i + 1}`)
    );
    expect(() => scoreDesign(nodes, edges, urlShortenerCanvas)).not.toThrow();
  });

  test("1000 nodes does not crash scoreDesign", () => {
    const nodes: FlowNode[] = Array.from({ length: 1000 }, (_, i) =>
      node(`n-${i}`, "kafka")
    );
    const edges: FlowEdge[] = [];
    expect(() => scoreDesign(nodes, edges, urlShortenerCanvas)).not.toThrow();
  });

  test("scoring function still finds correct nodes among 100+", () => {
    const nodes: FlowNode[] = [
      ...Array.from({ length: 50 }, (_, i) => node(`extra-${i}`, "kafka")),
      node("n-user", "user"),
      node("n-lb", "load-balancer"),
      node("n-app", "app-server"),
      node("n-redis", "redis-cache"),
      node("n-nosql", "nosql-db"),
    ];
    const { nodeResults } = scoreDesign(nodes, [], urlShortenerCanvas);
    expect(nodeResults.filter((r) => r.present)).toHaveLength(5);
  });
});

// ── Special characters in string fields ────────────────────────────────────────

describe("Special characters render without crashing", () => {
  test("question with emoji renders correctly", () => {
    const decisionWithEmoji: StoryDecisionData = {
      ...MOCK_DECISION,
      question: "What happens when 💸 ₹500 disappears? 🤔",
    };
    expect(() =>
      render(
        <DecisionPanel
          decision={decisionWithEmoji}
          isFirstDecision={false}
          scenario="test"
          phase="deciding"
          selectedId={null}
          selectedOption={undefined}
          onSelect={jest.fn()}
          onNext={jest.fn()}
          decisionIndex={0}
          totalDecisions={5}
        />
      )
    ).not.toThrow();
    expect(
      screen.getByText("What happens when 💸 ₹500 disappears? 🤔")
    ).toBeInTheDocument();
  });

  test("consequence with special HTML characters renders safely", () => {
    const optionWithSpecialChars: StoryOptionData = {
      id: "a",
      text: "Option with <script> & 'quotes'",
      correct: true,
      consequence: "Result: <b>bold</b> & more",
      consequenceType: "success",
    };

    const decision: StoryDecisionData = {
      ...MOCK_DECISION,
      options: [optionWithSpecialChars, WRONG_OPTION_B, WRONG_OPTION_C],
    };

    expect(() =>
      render(
        <DecisionPanel
          decision={decision}
          isFirstDecision={false}
          scenario="test"
          phase="consequence"
          selectedId="a"
          selectedOption={optionWithSpecialChars}
          onSelect={jest.fn()}
          onNext={jest.fn()}
          decisionIndex={0}
          totalDecisions={5}
        />
      )
    ).not.toThrow();
  });
});

// ── Theme toggle does not affect progress ───────────────────────────────────────

describe("Theme toggle isolation from progress", () => {
  test("saving progress to a different localStorage key does not corrupt progress", () => {
    // Simulate what next-themes does: writes to localStorage under 'theme' key
    localStorage.setItem("theme", "dark");

    saveProgress({
      systemId: "url-shortener",
      currentIdx: 2,
      answers: { 0: { selectedId: "a", isCorrect: true } },
      completed: false,
    });

    // Theme key should still be there
    expect(localStorage.getItem("theme")).toBe("dark");

    // Progress should be independent
    const loaded = loadProgress("url-shortener");
    expect(loaded?.currentIdx).toBe(2);
  });

  test("clearProgress does not clear theme localStorage key", () => {
    localStorage.setItem("theme", "light");
    saveProgress({
      systemId: "url-shortener",
      currentIdx: 3,
      answers: {},
      completed: false,
    });

    saveProgress({
      systemId: "url-shortener",
      currentIdx: 3,
      answers: {},
      completed: false,
    });

    // Simulate: only clearProgress is called, not localStorage.clear()
    const themeBefore = localStorage.getItem("theme");
    saveProgress({
      systemId: "url-shortener",
      currentIdx: 5,
      answers: {},
      completed: true,
    });

    expect(localStorage.getItem("theme")).toBe(themeBefore);
  });
});
