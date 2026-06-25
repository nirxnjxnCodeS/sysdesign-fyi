// TEST 3 — Scoring logic
// Tests getScoreLabel and getScorePercent from lib/scoring.ts.

import { getScoreLabel, getScorePercent } from "@/lib/scoring";

const labels = {
  perfect: "The money never got lost 💸",
  good: "Solid engineer. A few edge cases to tighten.",
  average: "The system works. Your CFO is nervous.",
  poor: "Finance team found some missing rupees.",
};

describe("getScoreLabel", () => {
  test("5/5 correct → perfect score label", () => {
    expect(getScoreLabel(5, 5, labels)).toBe(labels.perfect);
  });

  test("4/5 correct → good score label (80% >= 60% threshold)", () => {
    expect(getScoreLabel(4, 5, labels)).toBe(labels.good);
  });

  test("3/5 correct → good score label (60% == 60% threshold)", () => {
    expect(getScoreLabel(3, 5, labels)).toBe(labels.good);
  });

  test("2/5 correct → average score label (40% >= 40% threshold)", () => {
    expect(getScoreLabel(2, 5, labels)).toBe(labels.average);
  });

  test("1/5 correct → poor score label (20% < 40% threshold)", () => {
    expect(getScoreLabel(1, 5, labels)).toBe(labels.poor);
  });

  test("0/5 correct → poor score label", () => {
    expect(getScoreLabel(0, 5, labels)).toBe(labels.poor);
  });

  test("returns exact string from the labels object, not a hardcoded string", () => {
    const customLabels = {
      perfect: "Custom perfect!",
      good: "Custom good",
      average: "Custom average",
      poor: "Custom poor",
    };
    expect(getScoreLabel(5, 5, customLabels)).toBe("Custom perfect!");
    expect(getScoreLabel(4, 5, customLabels)).toBe("Custom good");
    expect(getScoreLabel(2, 5, customLabels)).toBe("Custom average");
    expect(getScoreLabel(0, 5, customLabels)).toBe("Custom poor");
  });

  test("works with different total decision counts", () => {
    // 3/3 = 100% → perfect
    expect(getScoreLabel(3, 3, labels)).toBe(labels.perfect);
    // 2/3 ≈ 67% → good
    expect(getScoreLabel(2, 3, labels)).toBe(labels.good);
    // 1/3 ≈ 33% → poor
    expect(getScoreLabel(1, 3, labels)).toBe(labels.poor);
  });
});

describe("getScorePercent", () => {
  test("5/5 → 100", () => {
    expect(getScorePercent(5, 5)).toBe(100);
  });

  test("4/5 → 80", () => {
    expect(getScorePercent(4, 5)).toBe(80);
  });

  test("3/5 → 60", () => {
    expect(getScorePercent(3, 5)).toBe(60);
  });

  test("2/5 → 40", () => {
    expect(getScorePercent(2, 5)).toBe(40);
  });

  test("0/5 → 0", () => {
    expect(getScorePercent(0, 5)).toBe(0);
  });

  test("rounds to nearest integer", () => {
    // 1/3 = 33.33... → 33
    expect(getScorePercent(1, 3)).toBe(33);
    // 2/3 = 66.66... → 67
    expect(getScorePercent(2, 3)).toBe(67);
  });
});
