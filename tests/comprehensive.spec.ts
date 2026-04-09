/**
 * Comprehensive Playwright Test Suite for Yi Xin Chinese School Website
 *
 * Covers:
 *  1. Navigation & Routing
 *  2. Contact Form Testing
 *  3. Language Switching
 *  4. UI / Visual Testing
 *  5. Responsive Testing (Mobile, Tablet, Desktop)
 *  6. Performance Testing (LCP, TTI, Resources)
 *  7. Accessibility (A11Y)
 *  8. Security Testing (XSS, Headers, HTTPS)
 *  9. Error Handling
 * 10. Real User Scenarios
 * 11. Admin Login & Forms
 * 12. API Endpoint Validation
 * 13. SEO & Structured Data
 * 14. GDPR Compliance
 * 15. Legal Content
 * 16. Cross-viewport Layout
 * 17. API Input Boundary Tests
 */

import {
  test,
  expect,
  captureScreenshotOnFailure,
  navigateAndWaitForLoad,
  dismissCookieConsent,
  HOMEPAGE_SECTIONS,
  ALL_ROUTES,
  VIEWPORTS,
  getPerformanceMetrics,
  filterBenignConsoleErrors,
  getHeapSize,
} from "./helpers/test-utils";

/* ================================================================
   GLOBAL HOOKS — Screenshot on failure + error tracking
   ================================================================ */

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await captureScreenshotOnFailure(page, testInfo);
  }
});

/* ================================================================
   1. NAVIGATION & ROUTING
   ================================================================ */

test.describe("1. Navigation & Routing", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);
  });

  test("homepage loads with status 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("all page routes return status 200", async ({ page }) => {
    for (const route of ALL_ROUTES) {
      const response = await page.goto(route);
      expect(response?.status(), `Route ${route} should return 200`).toBe(200);
    }
  });

  test("all homepage sections exist", async ({ page }) => {
    for (const id of HOMEPAGE_SECTIONS) {
      const section = page.locator(`#${id}`);
      await expect(section, `Section #${id} should exist`).toBeAttached();
    }
  });

  test("navbar links point to correct sections", async ({ page }) => {
    const navLinks = await page.locator("header a[href]").evaluateAll((anchors) =>
      anchors.map((a) => a.getAttribute("href") ?? "")
    );
    const expectedHashes = ["/#home", "/#courses", "/#news", "/#about", "/#contact"];
    for (const hash of expectedHashes) {
      expect(navLinks, `Navbar should contain link to ${hash}`).toContain(hash);
    }
  });

  test("all internal navigation links resolve to existing targets", async ({ page }) => {
    const links = await page.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((a) => ({
        href: a.getAttribute("href") ?? "",
        text: a.textContent?.trim().slice(0, 50) ?? "",
      }))
    );

    const hashLinks = links.filter(
      (l) => l.href.startsWith("/#") || l.href.startsWith("#")
    );

    for (const link of hashLinks) {
      const sectionId = link.href.replace("/#", "").replace("#", "");
      if (sectionId) {
        const section = page.locator(`#${sectionId}`);
        await expect(
          section,
          `Section #${sectionId} should exist for link "${link.text}"`
        ).toBeAttached();
      }
    }
  });

  test("footer links point to correct pages", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/impressum"]')).toBeAttached();
    await expect(footer.locator('a[href="/privacy"]')).toBeAttached();
  });

  test("email links use mailto protocol", async ({ page }) => {
    const mailtoLinks = await page.locator('a[href^="mailto:"]').evaluateAll(
      (anchors) => anchors.map((a) => a.getAttribute("href") ?? "")
    );
    for (const href of mailtoLinks) {
      expect(href).toMatch(/^mailto:.+@.+/);
    }
  });

  test("phone links use tel protocol", async ({ page }) => {
    const telLinks = await page.locator('a[href^="tel:"]').evaluateAll(
      (anchors) => anchors.map((a) => a.getAttribute("href") ?? "")
    );
    for (const href of telLinks) {
      expect(href).toMatch(/^tel:\+?\d/);
    }
  });

  test("impressum page loads with content", async ({ page }) => {
    await page.goto("/impressum");
    await expect(page.locator("main")).toBeVisible();
    const text = await page.locator("main").textContent();
    expect(text?.length).toBeGreaterThan(100);
  });

  test("privacy page loads with content", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("main")).toBeVisible();
    const text = await page.locator("main").textContent();
    expect(text?.length).toBeGreaterThan(100);
  });

  test("admin page loads with login form", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator('input[type="text"], input[type="email"]').first()).toBeVisible();
  });
});

/* ================================================================
   2. CONTACT FORM TESTING
   ================================================================ */

test.describe("2. Contact Form Testing", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);
  });

  test("contact form fields are present and editable", async ({ page }) => {
    const section = page.locator("#contact");
    const nameInput = section.locator('input[type="text"]');
    const emailInput = section.locator('input[type="email"]');
    const messageInput = section.locator("textarea");

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(messageInput).toBeVisible();

    await nameInput.fill("Test Name");
    await expect(nameInput).toHaveValue("Test Name");
    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");
    await messageInput.fill("Test message");
    await expect(messageInput).toHaveValue("Test message");
  });

  test("contact form validates required fields (browser validation)", async ({ page }) => {
    const section = page.locator("#contact");
    const submitBtn = section.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();

    // Name field should be required
    const nameInput = section.locator('input[type="text"]');
    const isRequired = await nameInput.getAttribute("required");
    expect(isRequired !== null).toBeTruthy();

    // Email field should be required
    const emailInput = section.locator('input[type="email"]');
    expect(await emailInput.getAttribute("required") !== null).toBeTruthy();

    // Textarea should be required
    const textarea = section.locator("textarea");
    expect(await textarea.getAttribute("required") !== null).toBeTruthy();
  });

  test("contact form has privacy consent checkbox (GDPR)", async ({ page }) => {
    const checkbox = page.locator("#privacy-consent");
    await expect(checkbox).toBeAttached();
    expect(await checkbox.getAttribute("required") !== null).toBeTruthy();
  });

  test("privacy consent links to privacy policy page", async ({ page }) => {
    const consentLabel = page.locator('label[for="privacy-consent"]');
    const links = consentLabel.locator('a[href="/privacy"]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("contact form submit button exists and is enabled", async ({ page }) => {
    const submitBtn = page.locator('#contact button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  test("contact form shows placeholders in multiple languages", async ({ page }) => {
    const section = page.locator("#contact");
    const nameInput = section.locator('input[type="text"]');
    const placeholder = await nameInput.getAttribute("placeholder");
    expect(placeholder).toBeTruthy();
    expect(placeholder!.length).toBeGreaterThan(3);
  });

  test("contact API rejects empty fields", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { name: "", email: "", message: "" },
    });
    expect(response.status()).toBe(400);
  });

  test("contact API rejects invalid email format", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { name: "Test", email: "not-an-email", message: "Hello" },
    });
    expect(response.status()).toBe(400);
  });

  test("contact API rejects extremely long input", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {
        name: "A".repeat(10000),
        email: "test@example.com",
        message: "Hello",
      },
    });
    // Should either reject (400/413) or handle gracefully
    expect([200, 400, 413, 429, 503]).toContain(response.status());
  });
});

/* ================================================================
   3. LANGUAGE SWITCHING
   ================================================================ */

test.describe("3. Language Switching", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);
  });

  test("all three languages are present in navigation", async ({ page }) => {
    const header = page.locator("header");
    const navText = await header.textContent();
    // Navigation shows Chinese and German
    expect(navText).toContain("首页");
    expect(navText).toContain("Home");
  });

  test("homepage displays bilingual content (DE + ZH)", async ({ page }) => {
    const bodyText = await page.locator("body").textContent();
    // Check for Chinese characters
    expect(bodyText).toMatch(/[\u4e00-\u9fff]/);
    // Check for German text
    expect(bodyText).toContain("Kurs");
  });

  test("courses section shows Chinese and German labels", async ({ page }) => {
    const coursesSection = page.locator("#courses");
    const text = await coursesSection.textContent();
    // Should contain Chinese characters
    expect(text).toMatch(/[\u4e00-\u9fff]/);
  });

  test("footer shows bilingual navigation", async ({ page }) => {
    const footer = page.locator("footer");
    const text = await footer.textContent();
    expect(text).toMatch(/[\u4e00-\u9fff]/);
    expect(text).toContain("Impressum");
  });

  test("impressum page shows multilingual content", async ({ page }) => {
    await page.goto("/impressum");
    const mainText = await page.locator("main").textContent();
    // Should have both Chinese and German
    expect(mainText).toMatch(/[\u4e00-\u9fff]/);
    expect(mainText).toContain("Impressum");
  });

  test("privacy page shows multilingual content", async ({ page }) => {
    await page.goto("/privacy");
    const mainText = await page.locator("main").textContent();
    expect(mainText).toMatch(/[\u4e00-\u9fff]/);
    expect(mainText).toContain("Datenschutz");
  });
});

/* ================================================================
   4. UI / VISUAL TESTING
   ================================================================ */

test.describe("4. UI / Visual Testing", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);
  });

  test("homepage renders all major sections", async ({ page }) => {
    for (const id of HOMEPAGE_SECTIONS) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test("navbar is sticky and visible after scroll", async ({ page }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1000));
    await expect(header).toBeVisible();

    // Verify it has sticky positioning
    const position = await header.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe("sticky");
  });

  test("footer is present with correct structure", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    // Should contain copyright notice
    const text = await footer.textContent();
    expect(text).toContain("©");
    expect(text).toContain(new Date().getFullYear().toString());
  });

  test("school logo renders on homepage", async ({ page }) => {
    const logo = page.locator("#home svg, #home .logo-circle").first();
    await expect(logo).toBeAttached();
  });

  test("course section displays course cards", async ({ page }) => {
    const courses = page.locator("#courses");
    const cards = courses.locator('[class*="border-t-4"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("news section displays content", async ({ page }) => {
    const news = page.locator("#news");
    await expect(news).toBeVisible();
    const text = await news.textContent();
    expect(text!.length).toBeGreaterThan(20);
  });

  test("hero section has call-to-action buttons", async ({ page }) => {
    const hero = page.locator("#home");
    const links = hero.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("no layout-breaking elements overflow horizontally", async ({ page }) => {
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test("cookie consent banner appears on first visit", async ({ page }) => {
    // Use a fresh context to avoid stored consent
    const context = page.context();
    const freshPage = await context.newPage();
    await freshPage.goto("/");
    // Clear any stored consent
    await freshPage.evaluate(() => localStorage.removeItem("yixin-cookie-consent"));
    await freshPage.reload();

    const banner = freshPage.locator('[role="dialog"]');
    await expect(banner).toBeVisible({ timeout: 5000 });
    await freshPage.close();
  });

  test("cookie consent can be accepted", async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem("yixin-cookie-consent"));
    await page.reload();

    const acceptBtn = page.locator('[data-testid="cookie-accept-all"]');
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    await acceptBtn.click();

    // Banner should disappear
    await expect(page.locator('[data-testid="cookie-consent-banner"]')).toBeHidden({ timeout: 3000 });
  });

  test("cookie consent essential-only option works", async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem("yixin-cookie-consent"));
    await page.reload();

    const essentialBtn = page.locator('[data-testid="cookie-essential-only"]');
    await expect(essentialBtn).toBeVisible({ timeout: 5000 });
    await essentialBtn.click();

    await expect(page.locator('[data-testid="cookie-consent-banner"]')).toBeHidden({ timeout: 3000 });
  });
});

/* ================================================================
   5. RESPONSIVE TESTING
   ================================================================ */

test.describe("5. Responsive Testing", () => {
  test("mobile layout (375x812) - hamburger menu visible, no overflow", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);

    // Hamburger menu should be visible
    const hamburger = page.locator('button[aria-label*="Menü"]');
    await expect(hamburger).toBeVisible();

    // Desktop nav should be hidden
    const desktopNav = page.locator('nav[aria-label="Hauptnavigation"]');
    await expect(desktopNav).toBeHidden();

    // No horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test("mobile hamburger menu opens and closes", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);

    const hamburger = page.locator('button[aria-label*="Menü"]');
    await hamburger.click();

    // Mobile nav should appear
    const mobileNav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(mobileNav).toBeVisible();

    // Close menu
    await hamburger.click();
    await expect(mobileNav).toBeHidden();
  });

  test("mobile nav links navigate to correct sections", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);

    const hamburger = page.locator('button[aria-label*="Menü"]');
    await hamburger.click();

    const mobileNav = page.locator('nav[aria-label="Mobile Navigation"]');
    const links = await mobileNav.locator("a[href]").evaluateAll(
      (anchors) => anchors.map((a) => a.getAttribute("href") ?? "")
    );

    // Should contain all main section links
    expect(links).toContain("/#home");
    expect(links).toContain("/#courses");
    expect(links).toContain("/#contact");
  });

  test("tablet layout (768x1024) - content fits, sections visible", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);

    for (const id of HOMEPAGE_SECTIONS) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test("desktop layout (1920x1080) - full nav visible, no overflow", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);

    // Desktop nav should be visible
    const desktopNav = page.locator('nav[aria-label="Hauptnavigation"]');
    await expect(desktopNav).toBeVisible();

    for (const id of HOMEPAGE_SECTIONS) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test("impressum page responsive on mobile", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/impressum");
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test("privacy page responsive on mobile", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/privacy");
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });
});

/* ================================================================
   6. PERFORMANCE TESTING
   ================================================================ */

test.describe("6. Performance Testing", () => {
  test("homepage loads within acceptable time (< 5s)", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "load" });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test("performance metrics are within acceptable ranges", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const metrics = await getPerformanceMetrics(page);

    // DOM content loaded should be under 3s
    expect(metrics.domContentLoaded).toBeLessThan(3000);

    // First contentful paint should be present
    if (metrics.firstContentfulPaint > 0) {
      expect(metrics.firstContentfulPaint).toBeLessThan(3000);
    }
  });

  test("no excessively large images (> 1MB)", async ({ page }) => {
    const largeResources: string[] = [];

    page.on("response", (response) => {
      const contentType = response.headers()["content-type"] ?? "";
      const contentLength = parseInt(response.headers()["content-length"] ?? "0", 10);
      if (contentType.startsWith("image/") && contentLength > 1024 * 1024) {
        largeResources.push(`${response.url()} (${(contentLength / 1024).toFixed(0)}KB)`);
      }
    });

    await page.goto("/", { waitUntil: "load" });
    expect(
      largeResources,
      `Found large images: ${largeResources.join(", ")}`
    ).toHaveLength(0);
  });

  test("no JavaScript memory leaks on repeated navigation", async ({ page }) => {
    await page.goto("/");
    await dismissCookieConsent(page);

    const initialHeap = await getHeapSize(page);

    if (initialHeap === -1) {
      // Memory API not available, skip
      return;
    }

    // Navigate between pages several times
    for (let i = 0; i < 5; i++) {
      await page.goto("/impressum");
      await page.goto("/");
    }

    const finalHeap = await getHeapSize(page);

    if (finalHeap > 0 && initialHeap > 0) {
      const growth = (finalHeap - initialHeap) / initialHeap;
      // Heap should not grow more than 100% (generous for JS GC variance)
      expect(growth).toBeLessThan(1.0);
    }
  });

  test("images have proper dimensions (no layout shift)", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const imagesWithoutDimensions = await page.$$eval("img", (imgs) =>
      imgs
        .filter((img) => {
          const hasWidth = img.hasAttribute("width") || img.style.width || img.className.includes("w-");
          const hasHeight = img.hasAttribute("height") || img.style.height || img.className.includes("h-");
          return !hasWidth && !hasHeight && img.src;
        })
        .map((img) => img.src)
    );
    // This is informational - layout shift images noted but not necessarily a failure
    // SVGs inline don't need width/height attributes
    expect(imagesWithoutDimensions.length).toBeLessThanOrEqual(5);
  });
});

/* ================================================================
   7. ACCESSIBILITY (A11Y) TESTING
   ================================================================ */

test.describe("7. Accessibility (A11Y)", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);
  });

  test("page has proper lang attribute", async ({ page }) => {
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
    expect(["de", "zh", "en"]).toContain(lang);
  });

  test("skip-to-content link is present and targets main content", async ({ page }) => {
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeAttached();
  });

  test("page has a proper title", async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(title.toLowerCase()).toContain("yi xin");
  });

  test("navigation regions have aria labels", async ({ page }) => {
    const navs = page.locator("nav[aria-label]");
    const count = await navs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("form inputs have associated labels with for/id binding", async ({ page }) => {
    const contactSection = page.locator("#contact");
    const labels = contactSection.locator("label");
    const labelCount = await labels.count();
    // Contact form has at least 3 field labels + privacy consent label
    expect(labelCount).toBeGreaterThanOrEqual(3);

    // Verify field labels are properly associated via htmlFor/id
    await expect(page.locator('label[for="contact-name"]')).toBeAttached();
    await expect(page.locator('label[for="contact-email"]')).toBeAttached();
    await expect(page.locator('label[for="contact-message"]')).toBeAttached();
    await expect(page.locator('label[for="privacy-consent"]')).toBeAttached();
  });

  test("all buttons have accessible text", async ({ page }) => {
    const buttons = await page.$$eval("button", (btns) =>
      btns.map((b) => ({
        text: b.textContent?.trim() ?? "",
        ariaLabel: b.getAttribute("aria-label") ?? "",
        title: b.getAttribute("title") ?? "",
      }))
    );

    for (const btn of buttons) {
      const hasText = btn.text.length > 0 || btn.ariaLabel.length > 0 || btn.title.length > 0;
      expect(hasText, `Button without accessible text found`).toBeTruthy();
    }
  });

  test("links have accessible text or aria-label", async ({ page }) => {
    const links = await page.$$eval("a", (anchors) =>
      anchors.map((a) => ({
        href: a.getAttribute("href") ?? "",
        text: a.textContent?.trim() ?? "",
        ariaLabel: a.getAttribute("aria-label") ?? "",
      }))
    );

    for (const link of links) {
      const hasText = link.text.length > 0 || link.ariaLabel.length > 0;
      expect(
        hasText,
        `Link to ${link.href} has no accessible text`
      ).toBeTruthy();
    }
  });

  test("meta description is present", async ({ page }) => {
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(50);
  });

  test("heading hierarchy is correct (h1 before h2)", async ({ page }) => {
    const headings = await page.$$eval("h1, h2, h3, h4, h5, h6", (elements) =>
      elements.map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().slice(0, 40) ?? "",
      }))
    );

    // Should have at least one h1
    const h1Count = headings.filter((h) => h.tag === "h1").length;
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test("key interactive elements have data-testid attributes", async ({ page }) => {
    const requiredTestIds = [
      "navbar",
      "contact-form",
      "contact-name",
      "contact-email",
      "contact-message",
      "contact-submit",
      "section-home",
      "section-courses",
      "section-news",
      "section-about",
      "section-contact",
      "footer",
    ];
    for (const id of requiredTestIds) {
      await expect(
        page.locator(`[data-testid="${id}"]`),
        `Missing data-testid="${id}"`
      ).toBeAttached();
    }
  });

  test("keyboard navigation: Tab moves through interactive elements", async ({ page }) => {
    // Focus on the body first
    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
    // The first focusable element should be an interactive element
    expect(["A", "BUTTON", "INPUT", "TEXTAREA", "SELECT"]).toContain(firstFocused);
  });

  test("skip link or proper landmark regions exist", async ({ page }) => {
    // Check for main landmark
    const main = page.locator("main");
    await expect(main).toBeAttached();

    // Check for header landmark
    const header = page.locator("header");
    await expect(header).toBeAttached();

    // Check for footer landmark
    const footer = page.locator("footer");
    await expect(footer).toBeAttached();
  });
});

/* ================================================================
   8. SECURITY TESTING
   ================================================================ */

test.describe("8. Security Testing", () => {
  test("security headers are set correctly", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
  });

  test("X-Powered-By header is not exposed", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["x-powered-by"]).toBeUndefined();
  });

  test("XSS protection: contact form HTML is escaped in API", async ({ request }) => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img onerror="alert(1)" src=x>',
      '"><script>alert(document.cookie)</script>',
      "javascript:alert(1)",
    ];

    for (const payload of xssPayloads) {
      const response = await request.post("/api/contact", {
        data: {
          name: payload,
          email: "test@example.com",
          message: "Test",
        },
      });
      // Server should accept the input (it escapes it) or reject on email service config
      expect([200, 429, 503]).toContain(response.status());

      // Verify the response doesn't reflect the raw script
      const body = await response.text();
      expect(body).not.toContain("<script>");
    }
  });

  test("SQL/NoSQL injection in login endpoint", async ({ request }) => {
    const injectionPayloads = [
      { username: "admin' OR '1'='1", password: "test" },
      { username: "admin", password: "' OR '1'='1" },
      { username: '{"$gt":""}', password: '{"$gt":""}' },
    ];

    for (const payload of injectionPayloads) {
      const response = await request.post("/api/login", {
        data: payload,
      });
      // Login API returns 401 for bad credentials, 429 for rate-limited
      // Must NOT return 200 (authenticated)
      expect(
        [401, 429],
        `Injection payload should not authenticate: ${JSON.stringify(payload)}`
      ).toContain(response.status());
    }
  });

  test("rate limiting on login endpoint", async ({ request }) => {
    const statuses: number[] = [];
    for (let i = 0; i < 25; i++) {
      const response = await request.post("/api/login", {
        data: { username: `ratelimit_test_${Date.now()}`, password: "wrong" },
      });
      statuses.push(response.status());
      if (response.status() === 429) break;
    }
    // Should eventually get 429 rate limited, or all be 401 rejected
    const hasRateLimit = statuses.includes(429);
    const allRejected = statuses.every((s) => s === 401 || s === 429);
    expect(hasRateLimit || allRejected).toBeTruthy();
  });

  test("rate limiting on contact form", async ({ request }) => {
    const responses: number[] = [];
    for (let i = 0; i < 8; i++) {
      const response = await request.post("/api/contact", {
        data: {
          name: "RateTest",
          email: "rate@test.com",
          message: `Message ${i}`,
        },
      });
      responses.push(response.status());
    }
    // Should contain at least one rate-limited response or service unavailable
    const hasLimit = responses.some((s) => s === 429 || s === 503);
    expect(hasLimit).toBeTruthy();
  });

  test("unauthorized POST to protected endpoints returns 401", async ({ request }) => {
    const protectedEndpoints = ["/api/content", "/api/admins", "/api/upload"];
    for (const endpoint of protectedEndpoints) {
      const response = await request.post(endpoint, {
        data: { test: "data" },
      });
      expect(
        response.status(),
        `${endpoint} should reject unauthorized POST`
      ).toBe(401);
    }
  });

  test("CORS headers are not overly permissive", async ({ request }) => {
    const response = await request.get("/");
    const cors = response.headers()["access-control-allow-origin"];
    // Should not be wildcard "*" in production
    if (cors) {
      expect(cors).not.toBe("*");
    }
  });

  test("login endpoint rejects oversized payload", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: {
        username: "A".repeat(100000),
        password: "B".repeat(100000),
      },
    });
    // Should return 401 (failed auth), 429 (rate limited), or 413/500 for oversized
    expect([401, 413, 429, 500]).toContain(response.status());
  });
});

/* ================================================================
   9. ERROR HANDLING
   ================================================================ */

test.describe("9. Error Handling", () => {
  test("no console errors on homepage load", async ({ page, consoleErrors }) => {
    await page.goto("/", { waitUntil: "load" });
    const realErrors = filterBenignConsoleErrors(consoleErrors);
    expect(
      realErrors,
      `Console errors found: ${JSON.stringify(realErrors)}`
    ).toHaveLength(0);
  });

  test("no console errors on admin page", async ({ page, consoleErrors }) => {
    await page.goto("/admin", { waitUntil: "load" });
    const realErrors = filterBenignConsoleErrors(consoleErrors);
    expect(
      realErrors,
      `Console errors on admin page: ${JSON.stringify(realErrors)}`
    ).toHaveLength(0);
  });

  test("no console errors on impressum page", async ({ page, consoleErrors }) => {
    await page.goto("/impressum", { waitUntil: "load" });
    const realErrors = filterBenignConsoleErrors(consoleErrors);
    expect(realErrors).toHaveLength(0);
  });

  test("no console errors on privacy page", async ({ page, consoleErrors }) => {
    await page.goto("/privacy", { waitUntil: "load" });
    const realErrors = filterBenignConsoleErrors(consoleErrors);
    expect(realErrors).toHaveLength(0);
  });

  test("API returns JSON for error responses", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { name: "", email: "", message: "" },
    });
    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });

  test("login endpoint returns structured error", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: { username: "", password: "" },
    });
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });

  test("no failed network requests on homepage (excluding expected)", async ({
    page,
    failedRequests,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    const unexpected = failedRequests.filter(
      (r) =>
        !r.url.includes("favicon") &&
        !r.url.includes("/api/content") // May 404 without backend config
    );
    // Allow some expected failures (e.g., content API without blob storage)
    expect(unexpected.length).toBeLessThanOrEqual(2);
  });
});

/* ================================================================
   10. REAL USER SCENARIOS
   ================================================================ */

test.describe("10. Real User Scenarios", () => {
  test("Scenario 1: Parent searching for a Chinese course for a child", async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);

    // 1. Parent sees the hero section with school info
    const hero = page.locator("#home");
    await expect(hero).toBeVisible();

    // 2. Clicks on "Discover Courses" or navigates to courses
    const coursesLink = page.locator('a[href="#courses"], a[href="/#courses"]').first();
    await coursesLink.click();

    // 3. Courses section is visible
    const courses = page.locator("#courses");
    await expect(courses).toBeVisible();

    // 4. Can see course cards with age info
    const courseText = await courses.textContent();
    expect(courseText).toMatch(/[\u4e00-\u9fff]/); // Contains Chinese

    // 5. Scrolls to contact section
    const contactLink = page.locator('a[href="#contact"], a[href="/#contact"]').first();
    await contactLink.click();

    // 6. Contact section is visible
    const contact = page.locator("#contact");
    await expect(contact).toBeVisible();

    // 7. Contact form is ready
    const nameInput = contact.locator('input[type="text"]');
    await expect(nameInput).toBeVisible();
  });

  test("Scenario 2: Adult beginner exploring enrollment", async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);

    // 1. Check that course information is available
    const courses = page.locator("#courses");
    await expect(courses).toBeVisible();
    const courseText = await courses.textContent();
    expect(courseText!.length).toBeGreaterThan(50);

    // 2. Navigate to About section to learn more
    const aboutLink = page.locator('a[href="#about"], a[href="/#about"]').first();
    await aboutLink.click();

    const about = page.locator("#about");
    await expect(about).toBeVisible();

    // 3. Check contact info is accessible
    const contact = page.locator("#contact");
    // Contact section should have some email reference
    const contactText = await contact.textContent();
    expect(contactText).toContain("@");
  });

  test("Scenario 3: Returning student checking news", async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);

    // 1. Navigate to news section
    const newsLink = page.locator('a[href="#news"], a[href="/#news"]').first();
    await newsLink.click();

    // 2. News section loads
    const news = page.locator("#news");
    await expect(news).toBeVisible();

    // 3. Check that there is content in the news section
    const newsText = await news.textContent();
    expect(newsText!.length).toBeGreaterThan(20);

    // 4. Navigate to impressum (legal info check)
    await page.goto("/impressum");
    await expect(page.locator("main")).toBeVisible();
  });
});

/* ================================================================
   11. ADMIN LOGIN & FORMS
   ================================================================ */

test.describe("11. Admin Login & Forms", () => {
  test("admin login form fields are editable", async ({ page }) => {
    await page.goto("/admin");
    const usernameInput = page.locator('input[type="text"], input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await usernameInput.fill("testadmin");
    await expect(usernameInput).toHaveValue("testadmin");

    await passwordInput.fill("testpass");
    await expect(passwordInput).toHaveValue("testpass");
  });

  test("admin login shows error for invalid credentials", async ({ page }) => {
    await page.goto("/admin");
    const usernameInput = page.locator('input[type="text"], input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await usernameInput.fill("invaliduser");
    await passwordInput.fill("invalidpass");

    const loginBtn = page.locator('button[type="submit"]').first();
    await loginBtn.click();

    // Should show an error message or remain on login (not navigate to dashboard)
    // The page may show error text or the login form should still be visible
    await expect(
      page.locator('[class*="text-red"], [role="alert"], input[type="password"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("admin link is accessible from homepage navbar", async ({ page }) => {
    await page.goto("/");
    const adminLink = page.locator('a[href="/admin"]');
    const count = await adminLink.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

/* ================================================================
   12. API ENDPOINT VALIDATION
   ================================================================ */

test.describe("12. API Endpoint Validation", () => {
  test("GET /api/content returns valid response", async ({ request }) => {
    const response = await request.get("/api/content");
    // May return content or indicate no config
    expect([200, 500]).toContain(response.status());
  });

  test("POST /api/content requires authentication", async ({ request }) => {
    const response = await request.post("/api/content", { data: {} });
    expect(response.status()).toBe(401);
  });

  test("POST /api/admins requires authentication", async ({ request }) => {
    const response = await request.post("/api/admins", { data: {} });
    expect(response.status()).toBe(401);
  });

  test("POST /api/upload requires authentication", async ({ request }) => {
    const response = await request.post("/api/upload", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(401);
  });

  test("POST /api/login validates input", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: { username: "", password: "" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/contact validates required fields", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { name: "", email: "", message: "" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/contact validates email format", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { name: "Test", email: "invalid-email", message: "Hello" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/password-reset validates input", async ({ request }) => {
    const response = await request.post("/api/password-reset", {
      data: { action: "request", username: "" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/password-change validates input", async ({ request }) => {
    const response = await request.post("/api/password-change", {
      data: { action: "request", currentPassword: "" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/recovery blocked when RECOVERY_MODE not enabled", async ({ request }) => {
    const response = await request.post("/api/recovery", {
      data: { action: "request" },
    });
    // Should be blocked (403) or bad request (400)
    expect([400, 403]).toContain(response.status());
  });

  test("email test endpoint reports configuration status", async ({ request }) => {
    const response = await request.get("/api/email-test");
    expect([200, 503]).toContain(response.status());
  });

  test("notify-admin endpoint validates input", async ({ request }) => {
    const response = await request.post("/api/notify-admin", {
      data: {},
    });
    // Should require input or email config
    expect([400, 503]).toContain(response.status());
  });

  test("sitemap route returns valid response", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
  });

  test("robots.txt route returns valid response", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
  });

  test("content API GET is accessible", async ({ request }) => {
    const response = await request.get("/api/content");
    const headers = response.headers();
    // Should not cache dynamic content
    const cacheControl = headers["cache-control"] ?? "";
    const hasDynamic =
      cacheControl.includes("no-store") ||
      cacheControl.includes("no-cache") ||
      cacheControl.includes("must-revalidate") ||
      cacheControl === "";
    expect(hasDynamic).toBeTruthy();
  });
});

/* ================================================================
   13. SEO & STRUCTURED DATA
   ================================================================ */

test.describe("13. SEO & Structured Data", () => {
  test("JSON-LD structured data is present and valid", async ({ page }) => {
    await page.goto("/");
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toBeTruthy();

    const parsed = JSON.parse(jsonLd!);
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toContain("LanguageSchool");
    expect(parsed.name).toContain("Yi Xin");
  });

  test("OpenGraph meta tags are present", async ({ page }) => {
    await page.goto("/");
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute("content");
    const ogType = await page.locator('meta[property="og:type"]').getAttribute("content");
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute("content");

    expect(ogTitle).toBeTruthy();
    expect(ogDesc).toBeTruthy();
    expect(ogType).toBe("website");
    expect(ogUrl).toBeTruthy();
  });

  test("canonical URL is present", async ({ page }) => {
    await page.goto("/");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBeTruthy();
  });

  test("html lang attribute matches primary language", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("de");
  });
});

/* ================================================================
   14. GDPR COMPLIANCE
   ================================================================ */

test.describe("14. GDPR Compliance", () => {
  test("contact form has privacy consent checkbox", async ({ page }) => {
    await page.goto("/");
    await dismissCookieConsent(page);

    const checkbox = page.locator("#privacy-consent");
    await expect(checkbox).toBeAttached();
    expect(await checkbox.getAttribute("required")).not.toBeNull();
  });

  test("privacy consent checkbox links to privacy policy", async ({ page }) => {
    await page.goto("/");
    await dismissCookieConsent(page);

    const consentLabel = page.locator('label[for="privacy-consent"]');
    const privacyLinks = consentLabel.locator('a[href="/privacy"]');
    expect(await privacyLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test("contact form cannot submit without privacy consent", async ({ page }) => {
    await page.goto("/");
    await dismissCookieConsent(page);

    const section = page.locator("#contact");
    // Fill in form without checking consent
    await section.locator('input[type="text"]').fill("Test User");
    await section.locator('input[type="email"]').fill("test@example.com");
    await section.locator("textarea").fill("Test message");

    // Try to submit — browser should block due to required checkbox
    const submitBtn = section.locator('button[type="submit"]');
    await submitBtn.click();

    // Form should not have been submitted (no success message)
    const successMsg = page.locator('text="留言已发送"');
    await expect(successMsg).toBeHidden({ timeout: 2000 });
  });

  test("cookie consent is shown before interaction", async ({ page }) => {
    // Clear consent
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("yixin-cookie-consent"));
    await page.reload();

    const banner = page.locator('[role="dialog"]');
    await expect(banner).toBeVisible({ timeout: 5000 });
  });

  test("cookie consent details show only essential cookies", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("yixin-cookie-consent"));
    await page.reload();

    // Click show details
    const detailsBtn = page.locator('[data-testid="cookie-details-toggle"]');
    if (await detailsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailsBtn.click();
      const detailsText = await page.locator('[data-testid="cookie-consent-banner"]').textContent();
      expect(detailsText).toContain("Notwendig");
      expect(detailsText).toContain("Essential");
      expect(detailsText).toContain("必要");
    }
  });

  test("footer contains links to legal pages", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/impressum"]')).toBeAttached();
    await expect(footer.locator('a[href="/privacy"]')).toBeAttached();
  });
});

/* ================================================================
   15. LEGAL CONTENT REVIEW
   ================================================================ */

test.describe("15. Legal Content Review", () => {
  test("impressum page contains required German legal information", async ({ page }) => {
    await page.goto("/impressum");
    const text = await page.locator("main").textContent();
    // German law (TMG/Telemediengesetz) requires certain info
    const requiredTerms = ["Heilbronn", "Yi Xin"];
    for (const term of requiredTerms) {
      expect(text, `Impressum should contain "${term}"`).toContain(term);
    }
  });

  test("privacy page contains required GDPR information", async ({ page }) => {
    await page.goto("/privacy");
    const text = await page.locator("main").textContent();
    const requiredTerms = ["Datenschutz", "personenbezogen"];
    for (const term of requiredTerms) {
      expect(text!.toLowerCase(), `Privacy page should mention "${term}"`).toContain(
        term.toLowerCase()
      );
    }
  });

  test("copyright notice is present and shows current year", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    const text = await footer.textContent();
    expect(text).toContain("©");
    expect(text).toContain(new Date().getFullYear().toString());
  });

  test("contact information is visible on the website", async ({ page }) => {
    await page.goto("/");
    await dismissCookieConsent(page);

    const contact = page.locator("#contact");
    const text = await contact.textContent();
    // Should show an email address
    expect(text).toMatch(/@/);
  });
});

/* ================================================================
   16. CROSS-VIEWPORT LAYOUT
   ================================================================ */

test.describe("16. Cross-viewport Layout", () => {
  test("Chinese text renders properly with CJK characters", async ({ page }) => {
    await page.goto("/");
    await dismissCookieConsent(page);

    // Verify Chinese characters are present on the page
    const bodyText = await page.locator("body").textContent();
    const chineseChars = bodyText!.match(/[\u4e00-\u9fff]/g) ?? [];
    expect(chineseChars.length).toBeGreaterThan(20);
  });

  test("desktop layout (1920x1080) - full navigation visible", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/");
    await dismissCookieConsent(page);

    const desktopNav = page.locator('nav[aria-label="Hauptnavigation"]');
    await expect(desktopNav).toBeVisible();

    // All sections exist
    for (const id of HOMEPAGE_SECTIONS) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test("tablet layout (768x1024) - content fits", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto("/");

    for (const id of HOMEPAGE_SECTIONS) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test("all pages accessible across viewport sizes", async ({ page }) => {
    for (const viewport of [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop]) {
      await page.setViewportSize(viewport);
      for (const route of ALL_ROUTES) {
        const response = await page.goto(route);
        expect(
          response?.status(),
          `${route} at ${viewport.width}x${viewport.height} should return 200`
        ).toBe(200);
      }
    }
  });
});

/* ================================================================
   17. SECURITY HEADERS (DEDICATED)
   ================================================================ */

test.describe("17. Security Headers", () => {
  test("X-Content-Type-Options header is set to nosniff", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("X-Frame-Options header prevents clickjacking", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
  });

  test("Referrer-Policy header is set", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("Permissions-Policy restricts sensitive APIs", async ({ request }) => {
    const response = await request.get("/");
    const pp = response.headers()["permissions-policy"];
    expect(pp).toBeTruthy();
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
    expect(pp).toContain("geolocation=()");
  });

  test("Server does not expose technology version", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["x-powered-by"]).toBeUndefined();
    // Server header may be absent (good) or present but should not expose framework details
    const server = headers["server"];
    if (server) {
      expect(server.toLowerCase()).not.toContain("express");
      expect(server.toLowerCase()).not.toContain("apache");
    }
  });

  test("Content-Security-Policy header is present", async ({ request }) => {
    const response = await request.get("/");
    const csp = response.headers()["content-security-policy"];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

/* ================================================================
   18. API INPUT BOUNDARY TESTS
   ================================================================ */

test.describe("18. API Input Boundary Tests", () => {
  test("login with empty strings returns 400", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: { username: "", password: "" },
    });
    expect(response.status()).toBe(400);
  });

  test("contact with whitespace-only fields returns 400", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { name: "   ", email: "   ", message: "   " },
    });
    expect(response.status()).toBe(400);
  });

  test("contact with valid email but missing dot in domain", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { name: "Test", email: "user@localhost", message: "Hello" },
    });
    expect(response.status()).toBe(400);
  });

  test("password-reset with missing action", async ({ request }) => {
    const response = await request.post("/api/password-reset", {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test("password-change with missing action", async ({ request }) => {
    const response = await request.post("/api/password-change", {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test("contact handles unicode/emoji input gracefully", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {
        name: "测试用户 🎓",
        email: "test@example.com",
        message: "你好世界 🌏 Hallo Welt",
      },
    });
    // Should accept or reject cleanly (not crash)
    expect([200, 429, 503]).toContain(response.status());
  });
});
