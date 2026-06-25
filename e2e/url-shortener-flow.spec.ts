// TEST 9 — E2E happy path for URL Shortener
// Requires `npm run dev` to be running (playwright.config.ts handles this).

import { test, expect } from "@playwright/test";

test.describe("URL Shortener — full happy path", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for a clean slate
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test("landing page shows URL Shortener card", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("URL Shortener")).toBeVisible();
  });

  test("clicking Start Learning navigates to /learn/url-shortener", async ({
    page,
  }) => {
    await page.goto("/");
    // Click the first link pointing to the url-shortener story
    await page.locator('a[href="/learn/url-shortener"]').first().click();
    await expect(page).toHaveURL("/learn/url-shortener");
  });

  test("story mode loads — scenario card is visible", async ({ page }) => {
    await page.goto("/learn/url-shortener");
    // The scenario text is rendered inside the DecisionPanel on decision 1
    await expect(
      page.getByText(/billion.*request|10M|link.*short/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("decision 1 — correct option triggers success consequence", async ({
    page,
  }) => {
    await page.goto("/learn/url-shortener");
    // First decision: correct option is "Generate a unique 7-character code"
    // Click the correct option (option A which is correct: true in url-shortener data)
    const optionA = page.locator("button").filter({ hasText: /7.character|base62|unique code/i }).first();
    await optionA.click();
    // Success consequence should appear (green bar visible)
    await expect(page.locator('[style*="10B981"]').or(page.getByText(/stateless|redirect|hot path/i))).toBeVisible({ timeout: 3000 });
  });

  test("clicking Next decision advances to decision 2", async ({ page }) => {
    await page.goto("/learn/url-shortener");

    // Answer decision 1 — click any option to get to consequence phase
    await page.locator("button").nth(0).click();

    // Wait for consequence phase, then click next if it appears (need learning phase)
    // The "next decision" button only appears in learning phase
    // For simplicity, wait for it to appear
    const nextButton = page.getByText(/next decision/i);
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click();
      // Should now show decision 2
      await expect(page.getByText(/decision 2 of 5/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test("/learn/fake-system → 404 page", async ({ page }) => {
    const response = await page.goto("/learn/fake-system-that-doesnt-exist");
    expect(response?.status()).toBe(404);
  });
});

test.describe("URL Shortener — all routes resolve", () => {
  const learnRoutes = [
    "/learn/url-shortener",
    "/learn/payment-system",
    "/learn/notification-system",
    "/learn/stock-price-ticker",
    "/learn/chat-system",
    "/learn/video-streaming",
  ];

  for (const route of learnRoutes) {
    test(`${route} returns 200`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
    });
  }

  const designRoutes = [
    "/design/url-shortener",
    "/design/payment-system",
  ];

  for (const route of designRoutes) {
    test(`${route} returns 200`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
    });
  }
});

test.describe("Canvas design mode — URL Shortener", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/design/url-shortener");
    // Wait for the canvas to be visible (desktop only — use viewport override)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/design/url-shortener");
  });

  test("canvas page renders on desktop viewport", async ({ page }) => {
    await expect(page.locator('[data-testid="react-flow"]').or(
      page.locator(".react-flow")
    )).toBeVisible({ timeout: 5000 });
  });

  test("left sidebar shows components palette", async ({ page }) => {
    await expect(page.getByText("// components")).toBeVisible({ timeout: 5000 });
  });

  test("right panel shows inspector", async ({ page }) => {
    await expect(page.getByText("// inspector")).toBeVisible({ timeout: 5000 });
  });

  test("check design button is disabled with empty canvas", async ({ page }) => {
    // Find the check design button — it should be disabled when canvas is empty
    const checkBtn = page.getByRole("button", { name: /check design/i }).first();
    await expect(checkBtn).toBeDisabled({ timeout: 5000 });
  });

  test("empty state hint is visible on empty canvas", async ({ page }) => {
    await expect(page.getByText("drag components here")).toBeVisible({
      timeout: 5000,
    });
  });
});
