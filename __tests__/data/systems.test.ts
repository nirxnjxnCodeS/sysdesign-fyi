// TEST 1 — Data integrity tests
// Validates that every story data file and canvas data file is structurally correct.

import { urlShortener } from "@/data/systems/url-shortener";
import { paymentSystem } from "@/data/systems/payment-system";
import { notificationSystem } from "@/data/systems/notification-system";
import { stockPriceTicker } from "@/data/systems/stock-price-ticker";
import { chatSystem } from "@/data/systems/chat-system";
import { videoStreaming } from "@/data/systems/video-streaming";

import { urlShortenerCanvas } from "@/data/systems/url-shortener-canvas";
import { paymentSystemCanvas } from "@/data/systems/payment-system-canvas";
import { notificationSystemCanvas } from "@/data/systems/notification-system-canvas";
import { stockPriceTickerCanvas } from "@/data/systems/stock-price-ticker-canvas";
import { chatSystemCanvas } from "@/data/systems/chat-system-canvas";
import { videoStreamingCanvas } from "@/data/systems/video-streaming-canvas";

const storyDataCases = [
  { id: "url-shortener", data: urlShortener },
  { id: "payment-system", data: paymentSystem },
  { id: "notification-system", data: notificationSystem },
  { id: "stock-price-ticker", data: stockPriceTicker },
  { id: "chat-system", data: chatSystem },
  { id: "video-streaming", data: videoStreaming },
];

const canvasDataCases = [
  { id: "url-shortener", data: urlShortenerCanvas },
  { id: "payment-system", data: paymentSystemCanvas },
  { id: "notification-system", data: notificationSystemCanvas },
  { id: "stock-price-ticker", data: stockPriceTickerCanvas },
  { id: "chat-system", data: chatSystemCanvas },
  { id: "video-streaming", data: videoStreamingCanvas },
];

// ── Story data structure ────────────────────────────────────────────────────────

describe.each(storyDataCases)("Story data: $id", ({ id, data }) => {
  test("id exists and matches filename", () => {
    expect(data.id).toBe(id);
  });

  test("title is a non-empty string", () => {
    expect(typeof data.title).toBe("string");
    expect(data.title.length).toBeGreaterThan(0);
  });

  test("scenario is a non-empty string", () => {
    expect(typeof data.scenario).toBe("string");
    expect(data.scenario.length).toBeGreaterThan(0);
  });

  test("decisions array has exactly 5 items", () => {
    expect(Array.isArray(data.decisions)).toBe(true);
    expect(data.decisions).toHaveLength(5);
  });

  test("finalArchitecture is a non-empty string", () => {
    expect(typeof data.finalArchitecture).toBe("string");
    expect(data.finalArchitecture.length).toBeGreaterThan(0);
  });

  test("score object has all required keys", () => {
    expect(data.score).toHaveProperty("perfect");
    expect(data.score).toHaveProperty("good");
    expect(data.score).toHaveProperty("average");
    expect(data.score).toHaveProperty("poor");
    expect(typeof data.score.perfect).toBe("string");
    expect(typeof data.score.good).toBe("string");
    expect(typeof data.score.average).toBe("string");
    expect(typeof data.score.poor).toBe("string");
  });

  describe.each(data.decisions)("decision $id", (decision) => {
    test("has required fields", () => {
      expect(decision.id).toBeDefined();
      expect(typeof decision.question).toBe("string");
      expect(decision.question.length).toBeGreaterThan(0);
      expect(typeof decision.context).toBe("string");
      expect(decision.context.length).toBeGreaterThan(0);
      expect(typeof decision.learning).toBe("string");
      expect(decision.learning.length).toBeGreaterThan(0);
    });

    test("has exactly 3 options", () => {
      expect(Array.isArray(decision.options)).toBe(true);
      expect(decision.options).toHaveLength(3);
    });

    test("has exactly 1 correct option", () => {
      const correctCount = decision.options.filter((o) => o.correct).length;
      expect(correctCount).toBe(1);
    });

    test.each(decision.options)("option $id has valid shape", (option) => {
      expect(typeof option.id).toBe("string");
      expect(option.id.length).toBeGreaterThan(0);
      expect(typeof option.text).toBe("string");
      expect(option.text.length).toBeGreaterThan(0);
      expect(typeof option.correct).toBe("boolean");
      expect(typeof option.consequence).toBe("string");
      expect(option.consequence.length).toBeGreaterThan(0);
      expect(["success", "failure"]).toContain(option.consequenceType);
    });

    test("correct option has consequenceType success", () => {
      const correct = decision.options.find((o) => o.correct)!;
      expect(correct.consequenceType).toBe("success");
    });

    test("incorrect options have consequenceType failure", () => {
      const incorrect = decision.options.filter((o) => !o.correct);
      incorrect.forEach((o) => expect(o.consequenceType).toBe("failure"));
    });
  });
});

// ── Canvas data structure ───────────────────────────────────────────────────────

describe.each(canvasDataCases)("Canvas data: $id", ({ data }) => {
  test("correctNodes is a non-empty array", () => {
    expect(Array.isArray(data.correctNodes)).toBe(true);
    expect(data.correctNodes.length).toBeGreaterThan(0);
  });

  test("criticalNodes is a non-empty array", () => {
    expect(Array.isArray(data.criticalNodes)).toBe(true);
    expect(data.criticalNodes.length).toBeGreaterThan(0);
  });

  test("all criticalNodes are present in correctNodes", () => {
    const correctSet = new Set(data.correctNodes);
    data.criticalNodes.forEach((n) => {
      expect(correctSet.has(n)).toBe(true);
    });
  });

  test("correctEdges is a non-empty array", () => {
    expect(Array.isArray(data.correctEdges)).toBe(true);
    expect(data.correctEdges.length).toBeGreaterThan(0);
  });

  test("hints object exists with at least one key", () => {
    expect(typeof data.hints).toBe("object");
    expect(Object.keys(data.hints).length).toBeGreaterThan(0);
  });

  test("every hint key references a valid componentType", () => {
    // Collect all componentTypes that appear in answerNodes
    const answerTypes = new Set(data.answerNodes.map((n) => n.componentType));
    Object.keys(data.hints).forEach((key) => {
      // A hint key should map to either a correctNode or an answerNode componentType
      const validInCorrect = data.correctNodes.includes(key);
      const validInAnswer = answerTypes.has(key);
      expect(validInCorrect || validInAnswer).toBe(true);
    });
  });

  test("answerNodes is a non-empty array", () => {
    expect(Array.isArray(data.answerNodes)).toBe(true);
    expect(data.answerNodes.length).toBeGreaterThan(0);
  });

  test("each answerNode has required shape", () => {
    data.answerNodes.forEach((n) => {
      expect(typeof n.componentType).toBe("string");
      expect(typeof n.label).toBe("string");
      expect(typeof n.icon).toBe("string");
      expect(typeof n.color).toBe("string");
      expect(typeof n.x).toBe("number");
      expect(typeof n.y).toBe("number");
    });
  });

  test("answerEdges references valid nodeIds / componentTypes", () => {
    const nodeIds = new Set(
      data.answerNodes.map((n) => n.nodeId ?? n.componentType)
    );
    data.answerEdges.forEach((e) => {
      expect(nodeIds.has(e.source)).toBe(true);
      expect(nodeIds.has(e.target)).toBe(true);
    });
  });
});
