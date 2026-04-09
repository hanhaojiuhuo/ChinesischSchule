/**
 * Reusable test helpers and fixtures for Yi Xin Chinese School tests.
 */
import { test as base, expect, type Page } from "@playwright/test";

/* ──────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────── */
export interface ConsoleEntry {
  type: string;
  text: string;
  url: string;
}

export interface FailedRequest {
  url: string;
  status: number;
  method: string;
}

/* ──────────────────────────────────────────────────────────────
   Extended test fixture with console/network error tracking
   ────────────────────────────────────────────────────────────── */
export const test = base.extend<{
  consoleErrors: ConsoleEntry[];
  failedRequests: FailedRequest[];
}>({
  consoleErrors: async ({ page }, use) => {
    const errors: ConsoleEntry[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push({
          type: msg.type(),
          text: msg.text(),
          url: page.url(),
        });
      }
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(errors);
  },

  failedRequests: async ({ page }, use) => {
    const failed: FailedRequest[] = [];
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failed.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
        });
      }
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(failed);
  },
});

export { expect };

/* ──────────────────────────────────────────────────────────────
   Screenshot helper: capture on test failure
   ────────────────────────────────────────────────────────────── */
export async function captureScreenshotOnFailure(
  page: Page,
  testInfo: { title: string; status?: string },
  prefix = "failure"
) {
  const safeName = testInfo.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 80);
  await page.screenshot({
    path: `test-results/${prefix}-${safeName}-${Date.now()}.png`,
    fullPage: true,
  });
}

/* ──────────────────────────────────────────────────────────────
   Navigation helpers
   ────────────────────────────────────────────────────────────── */
export async function navigateAndWaitForLoad(page: Page, url: string) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  return response;
}

export async function dismissCookieConsent(page: Page) {
  const acceptBtn = page.locator('[data-testid="cookie-accept-all"]');
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    await acceptBtn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
}

/* ──────────────────────────────────────────────────────────────
   Section IDs used on the homepage
   ────────────────────────────────────────────────────────────── */
export const HOMEPAGE_SECTIONS = ["home", "courses", "news", "about", "contact"] as const;

/* ──────────────────────────────────────────────────────────────
   Routes to test
   ────────────────────────────────────────────────────────────── */
export const ALL_ROUTES = ["/", "/admin", "/impressum", "/privacy"] as const;

/* ──────────────────────────────────────────────────────────────
   Viewport presets
   ────────────────────────────────────────────────────────────── */
export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },    // iPhone X
  tablet: { width: 768, height: 1024 },   // iPad
  desktop: { width: 1920, height: 1080 }, // Full HD
} as const;

/* ──────────────────────────────────────────────────────────────
   Contact form helper
   ────────────────────────────────────────────────────────────── */
export async function fillContactForm(
  page: Page,
  data: { name: string; email: string; message: string; consent?: boolean }
) {
  const section = page.locator("#contact");
  await section.locator('input[type="text"]').fill(data.name);
  await section.locator('input[type="email"]').fill(data.email);
  await section.locator("textarea").fill(data.message);
  if (data.consent !== false) {
    const checkbox = section.locator("#privacy-consent");
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
  }
}

/* ──────────────────────────────────────────────────────────────
   Performance measurement helper
   ────────────────────────────────────────────────────────────── */
export async function getPerformanceMetrics(page: Page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType("paint");

    return {
      domContentLoaded: nav?.domContentLoadedEventEnd - nav?.fetchStart,
      loadComplete: nav?.loadEventEnd - nav?.fetchStart,
      firstPaint: paint.find((p) => p.name === "first-paint")?.startTime ?? -1,
      firstContentfulPaint: paint.find((p) => p.name === "first-contentful-paint")?.startTime ?? -1,
      transferSize: nav?.transferSize ?? -1,
    };
  });
}

/* ──────────────────────────────────────────────────────────────
   Accessibility helpers
   ────────────────────────────────────────────────────────────── */
export async function getImagesWithoutAlt(page: Page) {
  return page.$$eval("img", (imgs) =>
    imgs
      .filter((img) => !img.getAttribute("alt")?.trim())
      .map((img) => ({
        src: img.getAttribute("src") ?? "",
        width: img.naturalWidth,
        height: img.naturalHeight,
      }))
  );
}

export async function getFormFieldsWithoutLabels(page: Page) {
  return page.$$eval(
    "input:not([type='hidden']):not([type='submit']), textarea, select",
    (fields) =>
      fields
        .filter((f) => {
          const id = f.getAttribute("id");
          const ariaLabel = f.getAttribute("aria-label");
          const ariaLabelledBy = f.getAttribute("aria-labelledby");
          const hasLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false;
          const parentLabel = f.closest("label");
          return !hasLabel && !parentLabel && !ariaLabel && !ariaLabelledBy;
        })
        .map((f) => ({
          tag: f.tagName.toLowerCase(),
          type: f.getAttribute("type") ?? "",
          name: f.getAttribute("name") ?? "",
          id: f.getAttribute("id") ?? "",
        }))
  );
}

/* ──────────────────────────────────────────────────────────────
   Console error filter — removes benign/expected messages
   ────────────────────────────────────────────────────────────── */
export function filterBenignConsoleErrors(errors: ConsoleEntry[]): ConsoleEntry[] {
  return errors.filter(
    (e) =>
      !e.text.includes("favicon") &&
      !e.text.includes("Download the React DevTools") &&
      !e.text.includes("Third-party cookie")
  );
}

/* ──────────────────────────────────────────────────────────────
   JS heap size helper (Chromium-only)
   ────────────────────────────────────────────────────────────── */
export async function getHeapSize(page: Page): Promise<number> {
  return page.evaluate(() => {
    const perf = performance as unknown as Record<string, unknown>;
    if (perf.memory) {
      return (perf.memory as { usedJSHeapSize: number }).usedJSHeapSize;
    }
    return -1;
  });
}
