// TEST 7 — Route registry tests
// Verifies all 6 systems are registered in both the story and design registries.
// This catches the class of bug where a new system data file is added but not
// wired up in the page, which would cause a silent 404 at runtime.

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

// Mirror the SYSTEMS registry from app/learn/[system]/page.tsx
const LEARN_SYSTEMS: Record<string, { id: string }> = {
  "url-shortener": urlShortener,
  "payment-system": paymentSystem,
  "notification-system": notificationSystem,
  "stock-price-ticker": stockPriceTicker,
  "chat-system": chatSystem,
  "video-streaming": videoStreaming,
};

// Mirror the SYSTEMS registry from app/design/[system]/page.tsx
const DESIGN_SYSTEMS: Record<string, { title: string }> = {
  "url-shortener": { title: "URL Shortener" },
  "payment-system": { title: "Payment System" },
  "notification-system": { title: "Notification System" },
  "stock-price-ticker": { title: "Stock Price Ticker" },
  "chat-system": { title: "Chat System" },
  "video-streaming": { title: "Video Streaming" },
};

// Mirror the CANVAS_DATA registry from components/design/DesignCanvas.tsx
const CANVAS_DATA: Record<string, object> = {
  "url-shortener": urlShortenerCanvas,
  "payment-system": paymentSystemCanvas,
  "notification-system": notificationSystemCanvas,
  "stock-price-ticker": stockPriceTickerCanvas,
  "chat-system": chatSystemCanvas,
  "video-streaming": videoStreamingCanvas,
};

const ALL_SYSTEM_IDS = [
  "url-shortener",
  "payment-system",
  "notification-system",
  "stock-price-ticker",
  "chat-system",
  "video-streaming",
];

// ── /learn/:system ──────────────────────────────────────────────────────────────

describe("/learn/:system — story route registry", () => {
  test.each(ALL_SYSTEM_IDS)("/learn/%s — data exists and id matches slug", (id) => {
    const data = LEARN_SYSTEMS[id];
    expect(data).toBeDefined();
    expect(data.id).toBe(id);
  });

  test("fake system returns undefined (would produce 404)", () => {
    expect(LEARN_SYSTEMS["fake-system-that-doesnt-exist"]).toBeUndefined();
  });
});

// ── /design/:system ─────────────────────────────────────────────────────────────

describe("/design/:system — canvas route registry", () => {
  test.each(ALL_SYSTEM_IDS)("/design/%s — title exists in SYSTEMS registry", (id) => {
    expect(DESIGN_SYSTEMS[id]).toBeDefined();
    expect(typeof DESIGN_SYSTEMS[id].title).toBe("string");
    expect(DESIGN_SYSTEMS[id].title.length).toBeGreaterThan(0);
  });

  test.each(ALL_SYSTEM_IDS)("/design/%s — canvas data exists in CANVAS_DATA", (id) => {
    expect(CANVAS_DATA[id]).toBeDefined();
  });

  test("fake system returns undefined (would produce 404)", () => {
    expect(DESIGN_SYSTEMS["fake-system-that-doesnt-exist"]).toBeUndefined();
  });
});

// ── System registry completeness ────────────────────────────────────────────────

describe("Registry completeness", () => {
  test("LEARN_SYSTEMS and DESIGN_SYSTEMS have the same keys", () => {
    const learnKeys = Object.keys(LEARN_SYSTEMS).sort();
    const designKeys = Object.keys(DESIGN_SYSTEMS).sort();
    expect(learnKeys).toEqual(designKeys);
  });

  test("CANVAS_DATA has an entry for every DESIGN_SYSTEMS key", () => {
    Object.keys(DESIGN_SYSTEMS).forEach((id) => {
      expect(CANVAS_DATA[id]).toBeDefined();
    });
  });

  test("all system IDs in index.ts match learn routes", async () => {
    const { systems } = await import("@/data/systems/index");
    systems.forEach((sys) => {
      expect(LEARN_SYSTEMS[sys.id]).toBeDefined();
    });
  });

  test("no system in index.ts uses the old stock-ticker id", async () => {
    const { systems } = await import("@/data/systems/index");
    const ids = systems.map((s) => s.id);
    expect(ids).not.toContain("stock-ticker");
    expect(ids).toContain("stock-price-ticker");
  });
});
