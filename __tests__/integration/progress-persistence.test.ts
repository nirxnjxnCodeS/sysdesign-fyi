// TEST 8 — localStorage persistence integration tests
// Simulates the full save/load/clear cycle across systems.

import {
  loadProgress,
  saveProgress,
  clearProgress,
  type StoryProgress,
} from "@/lib/story-progress";

const SYSTEM_A = "url-shortener";
const SYSTEM_B = "chat-system";

function makeProgress(
  systemId: string,
  overrides: Partial<StoryProgress> = {}
): StoryProgress {
  return {
    systemId,
    currentIdx: 0,
    answers: {},
    completed: false,
    ...overrides,
  };
}

describe("Progress persistence across decisions", () => {
  test("answer decision 1 → load returns currentIdx 1", () => {
    const progress = makeProgress(SYSTEM_A, {
      currentIdx: 1,
      answers: { 0: { selectedId: "a", isCorrect: true } },
    });
    saveProgress(progress);

    const loaded = loadProgress(SYSTEM_A)!;
    expect(loaded.currentIdx).toBe(1);
    expect(loaded.answers[0].isCorrect).toBe(true);
  });

  test("answer decisions 1-3 → load shows progress at decision 3", () => {
    const progress = makeProgress(SYSTEM_A, {
      currentIdx: 3,
      answers: {
        0: { selectedId: "a", isCorrect: true },
        1: { selectedId: "b", isCorrect: false },
        2: { selectedId: "a", isCorrect: true },
      },
    });
    saveProgress(progress);

    const loaded = loadProgress(SYSTEM_A)!;
    expect(loaded.currentIdx).toBe(3);
    expect(Object.keys(loaded.answers)).toHaveLength(3);
  });

  test("complete all 5 decisions → completed flag is set", () => {
    const progress = makeProgress(SYSTEM_A, {
      currentIdx: 5,
      answers: {
        0: { selectedId: "a", isCorrect: true },
        1: { selectedId: "a", isCorrect: true },
        2: { selectedId: "b", isCorrect: true },
        3: { selectedId: "a", isCorrect: true },
        4: { selectedId: "a", isCorrect: true },
      },
      completed: true,
    });
    saveProgress(progress);

    const loaded = loadProgress(SYSTEM_A)!;
    expect(loaded.completed).toBe(true);
    expect(Object.keys(loaded.answers)).toHaveLength(5);
  });
});

describe("clearProgress", () => {
  test("clearProgress → subsequent loadProgress returns null", () => {
    saveProgress(makeProgress(SYSTEM_A, { currentIdx: 3 }));
    clearProgress(SYSTEM_A);
    expect(loadProgress(SYSTEM_A)).toBeNull();
  });

  test("clearing one system does not affect another", () => {
    saveProgress(makeProgress(SYSTEM_A, { currentIdx: 2 }));
    saveProgress(makeProgress(SYSTEM_B, { currentIdx: 4 }));

    clearProgress(SYSTEM_A);

    expect(loadProgress(SYSTEM_A)).toBeNull();
    expect(loadProgress(SYSTEM_B)?.currentIdx).toBe(4);
  });
});

describe("Cross-system isolation", () => {
  test("progress for system A does not affect system B", () => {
    const progressA = makeProgress(SYSTEM_A, { currentIdx: 4, completed: true });
    const progressB = makeProgress(SYSTEM_B, { currentIdx: 1, completed: false });

    saveProgress(progressA);
    saveProgress(progressB);

    expect(loadProgress(SYSTEM_A)?.completed).toBe(true);
    expect(loadProgress(SYSTEM_B)?.completed).toBe(false);
    expect(loadProgress(SYSTEM_A)?.currentIdx).toBe(4);
    expect(loadProgress(SYSTEM_B)?.currentIdx).toBe(1);
  });

  test("overwriting system A progress does not change system B", () => {
    saveProgress(makeProgress(SYSTEM_A, { currentIdx: 1 }));
    saveProgress(makeProgress(SYSTEM_B, { currentIdx: 3 }));

    // Overwrite A
    saveProgress(makeProgress(SYSTEM_A, { currentIdx: 5, completed: true }));

    expect(loadProgress(SYSTEM_A)?.currentIdx).toBe(5);
    expect(loadProgress(SYSTEM_B)?.currentIdx).toBe(3); // unchanged
  });

  test("all 6 systems can hold independent progress simultaneously", () => {
    const systems = [
      "url-shortener",
      "payment-system",
      "notification-system",
      "stock-price-ticker",
      "chat-system",
      "video-streaming",
    ];

    systems.forEach((id, i) => {
      saveProgress(makeProgress(id, { currentIdx: i }));
    });

    systems.forEach((id, i) => {
      expect(loadProgress(id)?.currentIdx).toBe(i);
    });
  });
});

describe("Storage format resilience", () => {
  test("progress survives a serialise→deserialise round-trip with nested answers", () => {
    const original: StoryProgress = {
      systemId: SYSTEM_A,
      currentIdx: 3,
      answers: {
        0: { selectedId: "a", isCorrect: true },
        1: { selectedId: "c", isCorrect: false },
        2: { selectedId: "b", isCorrect: true },
      },
      completed: false,
    };

    saveProgress(original);
    const loaded = loadProgress(SYSTEM_A);

    expect(loaded).toEqual(original);
  });

  test("corrupted localStorage returns null without throwing", () => {
    localStorage.setItem("sysdesign_story_url-shortener", "CORRUPTED_JSON{{{{");
    expect(() => loadProgress(SYSTEM_A)).not.toThrow();
    expect(loadProgress(SYSTEM_A)).toBeNull();
  });
});
