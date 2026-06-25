// TEST 6 — ArchitectureDiagram builds progressively as answers are revealed
// The diagram is URL-Shortener-specific: its nodes are unlocked by decision index.

import React from "react";
import { render, screen } from "@testing-library/react";
import type { DecisionAnswer } from "@/lib/story-progress";

jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement("div", { ...props, ref }, children)
      ),
      p: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement("p", { ...props, ref }, children)
      ),
    },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

import { ArchitectureDiagram } from "@/components/story/ArchitectureDiagram";

function correct(idx: number): DecisionAnswer {
  return { selectedId: "a", isCorrect: true };
}

function wrong(idx: number): DecisionAnswer {
  return { selectedId: "b", isCorrect: false };
}

// ── Node visibility ─────────────────────────────────────────────────────────────

describe("ArchitectureDiagram — node visibility", () => {
  test("initially renders only 'user' node with empty answers", () => {
    render(<ArchitectureDiagram answers={{}} />);
    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.queryByText("app_server")).not.toBeInTheDocument();
    expect(screen.queryByText("redis_cache")).not.toBeInTheDocument();
    expect(screen.queryByText("load_balancer")).not.toBeInTheDocument();
  });

  test("shows placeholder hint when no decisions answered", () => {
    render(<ArchitectureDiagram answers={{}} />);
    expect(
      screen.getByText("// builds as you decide correctly")
    ).toBeInTheDocument();
  });

  test("decision 0 correct → app_server node appears", () => {
    const answers = { 0: correct(0) };
    render(<ArchitectureDiagram answers={answers} />);
    expect(screen.getByText("app_server")).toBeInTheDocument();
  });

  test("decision 0 wrong → app_server node does NOT appear", () => {
    const answers = { 0: wrong(0) };
    render(<ArchitectureDiagram answers={answers} />);
    expect(screen.queryByText("app_server")).not.toBeInTheDocument();
  });

  test("decision 2 correct → redis_cache node appears", () => {
    const answers = {
      0: correct(0),
      1: correct(1),
      2: correct(2),
    };
    render(<ArchitectureDiagram answers={answers} />);
    expect(screen.getByText("redis_cache")).toBeInTheDocument();
  });

  test("decision 2 correct → sql_db node appears (default before NoSQL decision)", () => {
    const answers = {
      0: correct(0),
      2: correct(2),
    };
    render(<ArchitectureDiagram answers={answers} />);
    expect(screen.getByText("sql_db")).toBeInTheDocument();
  });

  test("decision 3 correct → load_balancer node appears", () => {
    const answers = {
      0: correct(0),
      3: correct(3),
    };
    render(<ArchitectureDiagram answers={answers} />);
    expect(screen.getByText("load_balancer")).toBeInTheDocument();
  });

  test("decision 3 correct → app_server label changes to app_server[1..3]", () => {
    const answers = {
      0: correct(0),
      3: correct(3),
    };
    render(<ArchitectureDiagram answers={answers} />);
    expect(screen.getByText("app_server[1..3]")).toBeInTheDocument();
    expect(screen.queryByText("app_server")).not.toBeInTheDocument();
  });

  test("decision 4 correct → nosql_db label appears instead of sql_db", () => {
    const answers = {
      0: correct(0),
      2: correct(2),
      4: correct(4),
    };
    render(<ArchitectureDiagram answers={answers} />);
    expect(screen.getByText("nosql_db")).toBeInTheDocument();
    expect(screen.queryByText("sql_db")).not.toBeInTheDocument();
  });

  test("all correct → all nodes visible", () => {
    const answers = {
      0: correct(0),
      1: correct(1),
      2: correct(2),
      3: correct(3),
      4: correct(4),
    };
    render(<ArchitectureDiagram answers={answers} />);
    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByText("load_balancer")).toBeInTheDocument();
    expect(screen.getByText("app_server[1..3]")).toBeInTheDocument();
    expect(screen.getByText("redis_cache")).toBeInTheDocument();
    expect(screen.getByText("nosql_db")).toBeInTheDocument();
  });

  test("wrong answers for decisions 0 and 3 → no app_server and no load_balancer", () => {
    const answers = {
      0: wrong(0),
      1: correct(1),
      2: correct(2),
      3: wrong(3),
      4: correct(4),
    };
    render(<ArchitectureDiagram answers={answers} />);
    expect(screen.queryByText("app_server")).not.toBeInTheDocument();
    expect(screen.queryByText("app_server[1..3]")).not.toBeInTheDocument();
    expect(screen.queryByText("load_balancer")).not.toBeInTheDocument();
    // redis and sql nodes also won't appear since hasAppServer (c(0)) is false
    // but hasRedisAndDB depends on c(2) - redis only shows if we have somewhere to connect
    // (the component still renders redis/db based on c(2) alone)
    expect(screen.getByText("user")).toBeInTheDocument();
  });
});

// ── Badge / sublabel visibility ─────────────────────────────────────────────────

describe("ArchitectureDiagram — sublabels and badges", () => {
  test("always shows 'stateless · http' sublabel when app_server is present", () => {
    render(<ArchitectureDiagram answers={{ 0: correct(0) }} />);
    expect(screen.getByText("stateless · http")).toBeInTheDocument();
  });

  test("decision 1 correct → base62_code_gen() badge appears on app_server", () => {
    const answers = {
      0: correct(0),
      1: correct(1),
    };
    render(<ArchitectureDiagram answers={answers} />);
    expect(screen.getByText("base62_code_gen()")).toBeInTheDocument();
  });

  test("decision 1 wrong → base62_code_gen() badge does NOT appear", () => {
    const answers = {
      0: correct(0),
      1: wrong(1),
    };
    render(<ArchitectureDiagram answers={answers} />);
    expect(screen.queryByText("base62_code_gen()")).not.toBeInTheDocument();
  });
});
