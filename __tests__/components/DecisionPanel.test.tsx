// TEST 5 — DecisionPanel component rendering and interaction
// Tests the decision UI in all three phases: deciding, consequence, learning.

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { StoryDecisionData, StoryOptionData } from "@/lib/types";

// Mock framer-motion so animations don't interfere with synchronous assertions
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
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useAnimate: () => [React.createRef(), jest.fn()],
  };
});

// Import after mocks are set up
import { DecisionPanel } from "@/components/story/DecisionPanel";

const CORRECT_OPTION: StoryOptionData = {
  id: "a",
  text: "Use idempotency keys",
  correct: true,
  consequence: "Perfect! No duplicate charges.",
  consequenceType: "success",
};

const WRONG_OPTION_B: StoryOptionData = {
  id: "b",
  text: "Check the amount again",
  correct: false,
  consequence: "Race condition! Double charged.",
  consequenceType: "failure",
};

const WRONG_OPTION_C: StoryOptionData = {
  id: "c",
  text: "Throttle requests to 30s",
  correct: false,
  consequence: "Users get locked out.",
  consequenceType: "failure",
};

const MOCK_DECISION: StoryDecisionData = {
  id: 1,
  question: "How do you prevent duplicate payments?",
  context: "Network can cut out mid-request.",
  options: [CORRECT_OPTION, WRONG_OPTION_B, WRONG_OPTION_C],
  learning: "Idempotency — same request ID, same result.",
};

type Phase = "deciding" | "consequence" | "learning";

interface RenderProps {
  phase?: Phase;
  selectedId?: string | null;
  selectedOption?: StoryOptionData | undefined;
}

function renderDecisionPanel({
  phase = "deciding",
  selectedId = null,
  selectedOption = undefined,
}: RenderProps = {}) {
  const onSelect = jest.fn();
  const onNext = jest.fn();

  render(
    <DecisionPanel
      decision={MOCK_DECISION}
      isFirstDecision={false}
      scenario="Test scenario"
      phase={phase}
      selectedId={selectedId}
      selectedOption={selectedOption}
      onSelect={onSelect}
      onNext={onNext}
      decisionIndex={0}
      totalDecisions={5}
    />
  );

  return { onSelect, onNext };
}

// ── Phase: deciding ─────────────────────────────────────────────────────────────

describe("DecisionPanel — deciding phase", () => {
  test("renders the question text", () => {
    renderDecisionPanel();
    expect(screen.getByText(MOCK_DECISION.question)).toBeInTheDocument();
  });

  test("renders the context text", () => {
    renderDecisionPanel();
    expect(screen.getByText(MOCK_DECISION.context)).toBeInTheDocument();
  });

  test("renders exactly 3 option buttons", () => {
    renderDecisionPanel();
    const buttons = screen.getAllByRole("button");
    // There may be no extra buttons in deciding phase (no next button yet)
    expect(buttons).toHaveLength(3);
  });

  test("option buttons are enabled in deciding phase", () => {
    renderDecisionPanel();
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).not.toBeDisabled());
  });

  test("clicking an option calls onSelect with the option id", () => {
    const { onSelect } = renderDecisionPanel();
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]); // option A
    expect(onSelect).toHaveBeenCalledWith("a");
  });

  test("Next decision button is NOT visible before answering", () => {
    renderDecisionPanel();
    expect(screen.queryByText(/next decision/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/see results/i)).not.toBeInTheDocument();
  });

  test("consequence text is NOT visible before answering", () => {
    renderDecisionPanel();
    expect(screen.queryByText(CORRECT_OPTION.consequence)).not.toBeInTheDocument();
    expect(screen.queryByText(WRONG_OPTION_B.consequence)).not.toBeInTheDocument();
  });
});

// ── Phase: consequence ──────────────────────────────────────────────────────────

describe("DecisionPanel — consequence phase (correct answer)", () => {
  test("shows success consequence text", () => {
    renderDecisionPanel({
      phase: "consequence",
      selectedId: "a",
      selectedOption: CORRECT_OPTION,
    });
    expect(screen.getByText(CORRECT_OPTION.consequence)).toBeInTheDocument();
  });

  test("all 3 option buttons are disabled after answering", () => {
    renderDecisionPanel({
      phase: "consequence",
      selectedId: "a",
      selectedOption: CORRECT_OPTION,
    });
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  test("learning moment is NOT shown in consequence phase", () => {
    renderDecisionPanel({
      phase: "consequence",
      selectedId: "a",
      selectedOption: CORRECT_OPTION,
    });
    expect(screen.queryByText("learning moment")).not.toBeInTheDocument();
  });

  test("Next decision button is NOT visible in consequence phase", () => {
    renderDecisionPanel({
      phase: "consequence",
      selectedId: "a",
      selectedOption: CORRECT_OPTION,
    });
    expect(screen.queryByText(/next decision/i)).not.toBeInTheDocument();
  });
});

describe("DecisionPanel — consequence phase (wrong answer)", () => {
  test("shows failure consequence text", () => {
    renderDecisionPanel({
      phase: "consequence",
      selectedId: "b",
      selectedOption: WRONG_OPTION_B,
    });
    expect(screen.getByText(WRONG_OPTION_B.consequence)).toBeInTheDocument();
  });

  test("all 3 option buttons are disabled after wrong answer", () => {
    renderDecisionPanel({
      phase: "consequence",
      selectedId: "b",
      selectedOption: WRONG_OPTION_B,
    });
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});

// ── Phase: learning ─────────────────────────────────────────────────────────────

describe("DecisionPanel — learning phase", () => {
  function renderLearning() {
    return renderDecisionPanel({
      phase: "learning",
      selectedId: "a",
      selectedOption: CORRECT_OPTION,
    });
  }

  test("learning moment label appears", () => {
    renderLearning();
    expect(screen.getByText("learning moment")).toBeInTheDocument();
  });

  test("decision.learning text appears", () => {
    renderLearning();
    expect(screen.getByText(MOCK_DECISION.learning)).toBeInTheDocument();
  });

  test("consequence text is still visible", () => {
    renderLearning();
    expect(screen.getByText(CORRECT_OPTION.consequence)).toBeInTheDocument();
  });

  test("Next decision button appears in learning phase", () => {
    renderLearning();
    expect(screen.getByText(/next decision/i)).toBeInTheDocument();
  });

  test("clicking Next decision calls onNext", () => {
    const { onNext } = renderLearning();
    fireEvent.click(screen.getByText(/next decision/i));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test("last decision shows 'see results' instead of 'next decision'", () => {
    const onSelect = jest.fn();
    const onNext = jest.fn();
    render(
      <DecisionPanel
        decision={MOCK_DECISION}
        isFirstDecision={false}
        scenario="Test"
        phase="learning"
        selectedId="a"
        selectedOption={CORRECT_OPTION}
        onSelect={onSelect}
        onNext={onNext}
        decisionIndex={4}
        totalDecisions={5}
      />
    );
    expect(screen.getByText(/see results/i)).toBeInTheDocument();
    expect(screen.queryByText(/next decision/i)).not.toBeInTheDocument();
  });
});

// ── First decision scenario card ────────────────────────────────────────────────

describe("DecisionPanel — first decision scenario card", () => {
  test("shows scenario text on first decision", () => {
    const onSelect = jest.fn();
    const onNext = jest.fn();
    render(
      <DecisionPanel
        decision={MOCK_DECISION}
        isFirstDecision={true}
        scenario="The CEO just announced a partnership."
        phase="deciding"
        selectedId={null}
        selectedOption={undefined}
        onSelect={onSelect}
        onNext={onNext}
        decisionIndex={0}
        totalDecisions={5}
      />
    );
    expect(screen.getByText("The CEO just announced a partnership.")).toBeInTheDocument();
  });

  test("does NOT show scenario text on subsequent decisions", () => {
    const onSelect = jest.fn();
    render(
      <DecisionPanel
        decision={MOCK_DECISION}
        isFirstDecision={false}
        scenario="The CEO just announced a partnership."
        phase="deciding"
        selectedId={null}
        selectedOption={undefined}
        onSelect={onSelect}
        onNext={jest.fn()}
        decisionIndex={2}
        totalDecisions={5}
      />
    );
    expect(screen.queryByText("The CEO just announced a partnership.")).not.toBeInTheDocument();
  });
});
