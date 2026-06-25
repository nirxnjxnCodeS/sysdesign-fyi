// TEST 2 — Story progress logic
// Tests loadProgress / saveProgress / clearProgress / getScore.

import {
  loadProgress,
  saveProgress,
  clearProgress,
  getScore,
  type StoryProgress,
} from "@/lib/story-progress";

const SYSTEM_A = "url-shortener";
const SYSTEM_B = "payment-system";

function makeProgress(overrides: Partial<StoryProgress> = {}): StoryProgress {
  return {
    systemId: SYSTEM_A,
    currentIdx: 0,
    answers: {},
    completed: false,
    ...overrides,
  };
}

describe("saveProgress / loadProgress", () => {
  test("saveProgress then loadProgress returns the same data", () => {
    const progress = makeProgress({
      currentIdx: 2,
      answers: {
        0: { selectedId: "a", isCorrect: true },
        1: { selectedId: "b", isCorrect: false },
      },
    });
    saveProgress(progress);
    const loaded = loadProgress(SYSTEM_A);
    expect(loaded).toEqual(progress);
  });

  test("loadProgress returns null when nothing is saved", () => {
    expect(loadProgress("nonexistent-system")).toBeNull();
  });

  test("saveProgress with different systemId does not overwrite other system", () => {
    const progressA = makeProgress({ systemId: SYSTEM_A, currentIdx: 3 });
    const progressB = makeProgress({ systemId: SYSTEM_B, currentIdx: 1 });
    saveProgress(progressA);
    saveProgress(progressB);

    expect(loadProgress(SYSTEM_A)?.currentIdx).toBe(3);
    expect(loadProgress(SYSTEM_B)?.currentIdx).toBe(1);
  });

  test("returned progress has correct shape", () => {
    const progress = makeProgress({
      currentIdx: 4,
      answers: { 0: { selectedId: "a", isCorrect: true } },
      completed: true,
    });
    saveProgress(progress);
    const loaded = loadProgress(SYSTEM_A)!;

    expect(typeof loaded.currentIdx).toBe("number");
    expect(typeof loaded.answers).toBe("object");
    expect(typeof loaded.completed).toBe("boolean");
    expect(loaded.systemId).toBe(SYSTEM_A);
  });

  test("overwriting same system replaces the previous value", () => {
    saveProgress(makeProgress({ currentIdx: 0 }));
    saveProgress(makeProgress({ currentIdx: 4, completed: true }));
    const loaded = loadProgress(SYSTEM_A);
    expect(loaded?.currentIdx).toBe(4);
    expect(loaded?.completed).toBe(true);
  });
});

describe("clearProgress", () => {
  test("clearProgress makes loadProgress return null", () => {
    saveProgress(makeProgress());
    clearProgress(SYSTEM_A);
    expect(loadProgress(SYSTEM_A)).toBeNull();
  });

  test("clearProgress for system A does not affect system B", () => {
    saveProgress(makeProgress({ systemId: SYSTEM_A }));
    saveProgress(makeProgress({ systemId: SYSTEM_B }));
    clearProgress(SYSTEM_A);

    expect(loadProgress(SYSTEM_A)).toBeNull();
    expect(loadProgress(SYSTEM_B)).not.toBeNull();
  });

  test("clearProgress on already-empty slot does not throw", () => {
    expect(() => clearProgress("does-not-exist")).not.toThrow();
  });
});

describe("loadProgress error handling", () => {
  test("invalid JSON in localStorage returns null gracefully", () => {
    // Manually corrupt localStorage
    localStorage.setItem("sysdesign_story_url-shortener", "{ this is not json }");
    expect(() => loadProgress(SYSTEM_A)).not.toThrow();
    expect(loadProgress(SYSTEM_A)).toBeNull();
  });

  test("null entry in localStorage returns null", () => {
    // localStorage.getItem returns null if key missing — already the default
    expect(loadProgress("missing-key")).toBeNull();
  });
});

describe("getScore", () => {
  test("all correct returns total count", () => {
    const answers = {
      0: { selectedId: "a", isCorrect: true },
      1: { selectedId: "a", isCorrect: true },
      2: { selectedId: "b", isCorrect: true },
      3: { selectedId: "c", isCorrect: true },
      4: { selectedId: "a", isCorrect: true },
    };
    expect(getScore(answers, 5)).toBe(5);
  });

  test("mix of correct and incorrect returns correct count only", () => {
    const answers = {
      0: { selectedId: "a", isCorrect: true },
      1: { selectedId: "b", isCorrect: false },
      2: { selectedId: "a", isCorrect: true },
      3: { selectedId: "c", isCorrect: false },
      4: { selectedId: "a", isCorrect: true },
    };
    expect(getScore(answers, 5)).toBe(3);
  });

  test("all incorrect returns 0", () => {
    const answers = {
      0: { selectedId: "b", isCorrect: false },
      1: { selectedId: "c", isCorrect: false },
    };
    expect(getScore(answers, 5)).toBe(0);
  });

  test("empty answers returns 0", () => {
    expect(getScore({}, 5)).toBe(0);
  });
});
