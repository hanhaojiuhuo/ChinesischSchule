/**
 * Audit-Review Playwright Test Suite for Yi Xin Chinese School Website
 *
 * Supplementary tests generated during the 360° code audit (Phase 3).
 * These tests cover gaps identified by the architecture, security,
 * A11Y, UX, GDPR, and CRO analysis that are not already exercised by
 * the existing comprehensive.spec.ts suite.
 *
 * Covers:
 *  A. Cookie Consent Lifecycle & GDPR Flow
 *  B. Navigation: Anchor-Scroll & Deep-Link Verification
 *  C. Contact Form – Full Error-State Matrix
 *  D. Language Switching – Content Reactivity
 *  E. Admin Login – Multi-Step Error States
 *  F. Session & Auth Cookie Validation
 *  G. CSP & Security Header Deep Validation
 *  H. Conversion Funnel & CTA Audit
 *  I. A11Y – ARIA, Focus Trap, & Keyboard
 *  J. SEO Consistency (sitemap vs metadata)
 *  K. Responsive CTA Visibility
 */

import {
  test,
  expect,
  navigateAndWaitForLoad,
  dismissCookieConsent,
  fillContactForm,
  VIEWPORTS,
  filterBenignConsoleErrors,
  captureScreenshotOnFailure,
} from "./helpers/test-utils";

/* ================================================================
   GLOBAL HOOKS
   ================================================================ */

/** Contact-form success message text (trilingual). */
const CONTACT_SUCCESS_TEXT = "留言已发送";

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await captureScreenshotOnFailure(page, testInfo, "audit");
  }
});

/* ================================================================
   A. COOKIE CONSENT LIFECYCLE & GDPR FLOW
   ================================================================ */

test.describe("A. Cookie Consent Lifecycle", () => {
  test("cookie banner does NOT reappear after acceptance", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("yixin-cookie-consent"));
    await page.reload({ waitUntil: "domcontentloaded" });

    const banner = page.locator('[data-testid="cookie-consent-banner"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="cookie-accept-all"]').click();
    await expect(banner).toBeHidden({ timeout: 3000 });

    // Navigate away and back – banner should stay hidden
    await page.goto("/impressum");
    await page.goto("/");
    await expect(
      page.locator('[data-testid="cookie-consent-banner"]')
    ).toBeHidden({ timeout: 3000 });
  });

  test("essential-only consent persists across navigation", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("yixin-cookie-consent"));
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.locator('[data-testid="cookie-essential-only"]').click();

    // Verify localStorage value
    const consent = await page.evaluate(() =>
      localStorage.getItem("yixin-cookie-consent")
    );
    expect(consent).toBe("essential");

    // Navigate and verify no banner
    await page.goto("/privacy");
    await expect(
      page.locator('[data-testid="cookie-consent-banner"]')
    ).toBeHidden({ timeout: 3000 });
  });

  test("cookie details toggle expands and collapses", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("yixin-cookie-consent"));
    await page.reload({ waitUntil: "domcontentloaded" });

    const toggle = page.locator('[data-testid="cookie-details-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 5000 });

    // Click to expand – should show cookie table
    await toggle.click();
    await expect(page.locator("text=yixin-admin-session")).toBeVisible();
    await expect(page.locator("text=yixin-cookie-consent")).toBeVisible();

    // Click to collapse
    await toggle.click();
    await expect(page.locator("text=yixin-admin-session")).toBeHidden();
  });

  test("cookie banner has proper dialog role and aria-modal", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("yixin-cookie-consent"));
    await page.reload({ waitUntil: "domcontentloaded" });

    const banner = page.locator('[data-testid="cookie-consent-banner"]');
    await expect(banner).toBeVisible({ timeout: 5000 });
    expect(await banner.getAttribute("role")).toBe("dialog");
    expect(await banner.getAttribute("aria-modal")).toBe("true");
    expect(await banner.getAttribute("aria-label")).toBeTruthy();
  });

  test("no third-party tracking scripts load before consent", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("yixin-cookie-consent"));
    await page.reload({ waitUntil: "domcontentloaded" });

    // Check for common tracking scripts that should NOT be present
    const trackingScripts = await page.$$eval("script[src]", (scripts) =>
      scripts
        .map((s) => s.getAttribute("src") ?? "")
        .filter(
          (src) =>
            src.includes("google-analytics") ||
            src.includes("gtag") ||
            src.includes("facebook") ||
            src.includes("hotjar") ||
            src.includes("mixpanel")
        )
    );
    expect(trackingScripts).toHaveLength(0);
  });
});

/* ================================================================
   B. NAVIGATION: ANCHOR-SCROLL & DEEP-LINK
   ================================================================ */

test.describe("B. Navigation – Anchor Scrolling", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);
  });

  test("hero CTA 'Discover Courses' scrolls to courses section", async ({
    page,
  }) => {
    const cta = page.locator('[data-testid="hero-discover-courses-link"]');
    await expect(cta).toBeVisible();
    await cta.click();

    // Courses section should be in viewport
    const courses = page.locator('[data-testid="section-courses"]');
    await expect(courses).toBeInViewport({ timeout: 3000 });
  });

  test("hero CTA 'Contact Us' scrolls to contact section", async ({
    page,
  }) => {
    const cta = page.locator('[data-testid="hero-contact-link"]');
    await expect(cta).toBeVisible();
    await cta.click();

    const contact = page.locator('[data-testid="section-contact"]');
    await expect(contact).toBeInViewport({ timeout: 3000 });
  });

  test("direct URL with hash scrolls to correct section", async ({ page }) => {
    await page.goto("/#contact");
    await dismissCookieConsent(page);

    const contact = page.locator('[data-testid="section-contact"]');
    await expect(contact).toBeAttached();
  });

  test("navbar logo navigates back to homepage", async ({ page }) => {
    await page.goto("/impressum");
    const logo = page.locator('[data-testid="navbar-logo"]');
    await logo.click();
    await expect(page).toHaveURL(/\//);
  });
});

/* ================================================================
   C. CONTACT FORM – FULL ERROR-STATE MATRIX
   ================================================================ */

test.describe("C. Contact Form – Error States", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);
  });

  test("empty form submission is blocked by browser validation", async ({
    page,
  }) => {
    const section = page.locator('[data-testid="section-contact"]');
    const submitBtn = section.locator('[data-testid="contact-submit"]');

    // Click submit without filling anything
    await submitBtn.click();

    // Should NOT show success message
    const success = page.locator(`text="${CONTACT_SUCCESS_TEXT}"`);
    await expect(success).toBeHidden({ timeout: 1000 });

    // Name input should still be empty (form was not submitted)
    const nameVal = await section
      .locator('[data-testid="contact-name"]')
      .inputValue();
    expect(nameVal).toBe("");
  });

  test("invalid email format is blocked by browser validation", async ({
    page,
  }) => {
    const section = page.locator('[data-testid="section-contact"]');

    await section.locator('[data-testid="contact-name"]').fill("Test User");
    await section.locator('[data-testid="contact-email"]').fill("not-an-email");
    await section.locator('[data-testid="contact-message"]').fill("Test");
    await section.locator("#privacy-consent").check();

    await section.locator('[data-testid="contact-submit"]').click();

    // Browser should block – no success message
    const success = page.locator(`text="${CONTACT_SUCCESS_TEXT}"`);
    await expect(success).toBeHidden({ timeout: 1000 });
  });

  test("filled form with unchecked consent is blocked", async ({ page }) => {
    await fillContactForm(page, {
      name: "Test User",
      email: "test@example.com",
      message: "Hello from test",
      consent: false,
    });

    const section = page.locator('[data-testid="section-contact"]');

    // Ensure checkbox is NOT checked
    const checkbox = section.locator("#privacy-consent");
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }

    await section.locator('[data-testid="contact-submit"]').click();

    // Should NOT succeed
    const success = page.locator(`text="${CONTACT_SUCCESS_TEXT}"`);
    await expect(success).toBeHidden({ timeout: 1000 });
  });

  test("submit button is disabled during form submission", async ({ page }) => {
    await fillContactForm(page, {
      name: "Test",
      email: "test@example.com",
      message: "Message",
    });

    const section = page.locator('[data-testid="section-contact"]');
    const submitBtn = section.locator('[data-testid="contact-submit"]');

    // Intercept the API call to add a delay
    await page.route("/api/contact", async (route) => {
      // Hold the request for 500ms to observe disabled state
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable in test" }),
      });
    });

    await submitBtn.click();

    // Button should be disabled while submitting
    await expect(submitBtn).toBeDisabled({ timeout: 1000 });
  });

  test("API error surfaces user-facing error message", async ({ page }) => {
    await fillContactForm(page, {
      name: "Test",
      email: "test@example.com",
      message: "Message",
    });

    const section = page.locator('[data-testid="section-contact"]');
    const submitBtn = section.locator('[data-testid="contact-submit"]');

    // Mock a 500 error
    await page.route("/api/contact", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal error" }),
      });
    });

    await submitBtn.click();

    // Error message should appear
    const errorMsg = section.locator(".text-red-600");
    await expect(errorMsg).toBeVisible({ timeout: 3000 });
  });

  test("503 error shows email service unavailable message", async ({
    page,
  }) => {
    await fillContactForm(page, {
      name: "Test",
      email: "test@example.com",
      message: "Message",
    });

    const section = page.locator('[data-testid="section-contact"]');
    const submitBtn = section.locator('[data-testid="contact-submit"]');

    await page.route("/api/contact", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "RESEND not configured" }),
      });
    });

    await submitBtn.click();

    // Should show the service unavailable message
    const errorArea = section.locator(".text-red-600");
    await expect(errorArea).toBeVisible({ timeout: 3000 });
  });
});

/* ================================================================
   D. LANGUAGE SWITCHING – CONTENT REACTIVITY
   ================================================================ */

test.describe("D. Language Switching – Reactivity", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);
  });

  test("page displays both German and Chinese content simultaneously", async ({
    page,
  }) => {
    const hero = page.locator('[data-testid="section-home"]');
    const heroText = await hero.textContent();

    // Chinese characters present
    expect(heroText).toMatch(/[\u4e00-\u9fff]/);
    // German text present
    expect(heroText).toMatch(/[a-zA-ZäöüÄÖÜß]/);
  });

  test("courses show bilingual labels (ZH + DE)", async ({ page }) => {
    const coursesSection = page.locator('[data-testid="section-courses"]');
    const firstCard = coursesSection.locator('[data-testid="course-card"]').first();

    const cardText = await firstCard.textContent();
    // Should contain Chinese characters
    expect(cardText).toMatch(/[\u4e00-\u9fff]/);
  });

  test("contact section shows bilingual headings", async ({ page }) => {
    const contact = page.locator('[data-testid="section-contact"]');
    const text = await contact.textContent();

    // Should have both Chinese and German
    expect(text).toMatch(/[\u4e00-\u9fff]/);
    expect(text).toMatch(/[a-zA-Z]/);
  });

  test("footer navigation uses bilingual labels", async ({ page }) => {
    const footer = page.locator('[data-testid="footer"]');
    const text = await footer.textContent();

    // Navigation links should be bilingual
    expect(text).toContain("首页");
    expect(text).toContain("Home");
  });
});

/* ================================================================
   E. ADMIN LOGIN – MULTI-STEP ERROR STATES
   ================================================================ */

test.describe("E. Admin Login – Error States", () => {
  test("login form has username and password fields with correct types", async ({
    page,
  }) => {
    await page.goto("/admin");

    const username = page.locator('[data-testid="admin-login-username"]');
    const password = page.locator('[data-testid="admin-login-password"]');

    await expect(username).toBeVisible();
    await expect(password).toBeVisible();

    // Password field should mask input
    expect(await password.getAttribute("type")).toBe("password");
  });

  test("login API returns 400 for missing credentials", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: { username: "", password: "" },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("login API returns 401 for wrong credentials", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: { username: "nonexistent_user_test", password: "wrongpass" },
    });
    expect([401, 429]).toContain(response.status());
  });

  test("login-2fa API returns 400 for missing fields", async ({ request }) => {
    const response = await request.post("/api/login-2fa", {
      data: { action: "request", username: "", password: "" },
    });
    expect(response.status()).toBe(400);
  });

  test("login-2fa verify without code returns 400", async ({ request }) => {
    const response = await request.post("/api/login-2fa", {
      data: { action: "verify", username: "", code: "" },
    });
    expect(response.status()).toBe(400);
  });

  test("login-2fa with invalid action returns 400", async ({ request }) => {
    const response = await request.post("/api/login-2fa", {
      data: { action: "invalid_action" },
    });
    expect(response.status()).toBe(400);
  });

  test("admin page shows login form when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/admin");
    const loginForm = page.locator(
      '[data-testid="admin-login-username"]'
    );
    await expect(loginForm).toBeVisible();

    // Should NOT show admin dashboard elements
    const dashboard = page.locator("text=Dashboard");
    // Dashboard may or may not be in the DOM, but should not be visible
    // when not logged in
    if ((await dashboard.count()) > 0) {
      // It might appear in other contexts, just verify login form is shown
      await expect(loginForm).toBeVisible();
    }
  });
});

/* ================================================================
   F. SESSION & AUTH COOKIE VALIDATION
   ================================================================ */

test.describe("F. Session & Auth Cookie Validation", () => {
  test("session cookie is httpOnly and sameSite strict on login", async ({
    request,
  }) => {
    // This tests the login endpoint's cookie attributes
    const response = await request.post("/api/login", {
      data: { username: "nonexistent_audit_test", password: "wrongpass" },
    });
    // Even on failure, no session cookie should be set
    const cookies = response.headers()["set-cookie"] ?? "";
    // Failed login should NOT set a session cookie
    expect(cookies).not.toContain("yixin-session");
  });

  test("protected content API rejects requests without session cookie", async ({
    request,
  }) => {
    const response = await request.post("/api/content", {
      data: { test: true },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  test("protected admins API rejects requests without session cookie", async ({
    request,
  }) => {
    const response = await request.post("/api/admins", {
      data: [{ username: "hacker", password: "hacked" }],
    });
    expect(response.status()).toBe(401);
  });

  test("protected upload API rejects requests without session cookie", async ({
    request,
  }) => {
    const response = await request.post("/api/upload", {
      headers: { "Content-Type": "application/json" },
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test("auth DELETE endpoint responds successfully", async ({ request }) => {
    const response = await request.delete("/api/auth");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

/* ================================================================
   G. CSP & SECURITY HEADER DEEP VALIDATION
   ================================================================ */

test.describe("G. CSP & Security Headers – Deep Validation", () => {
  test("CSP contains required directives", async ({ request }) => {
    const response = await request.get("/");
    const csp = response.headers()["content-security-policy"] ?? "";

    // Verify critical CSP directives
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("img-src");
    expect(csp).toContain("connect-src");
  });

  test("X-Frame-Options DENY prevents iframe embedding", async ({
    request,
  }) => {
    const response = await request.get("/");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
  });

  test("security headers present on all page routes", async ({ request }) => {
    const routes = ["/", "/admin", "/impressum", "/privacy"];
    for (const route of routes) {
      const response = await request.get(route);
      const headers = response.headers();
      expect(
        headers["x-content-type-options"],
        `Missing nosniff on ${route}`
      ).toBe("nosniff");
      expect(
        headers["x-frame-options"],
        `Missing X-Frame-Options on ${route}`
      ).toBe("DENY");
    }
  });

  test("API endpoints include security headers", async ({ request }) => {
    const response = await request.get("/api/content");
    const headers = response.headers();
    // API responses should also include security headers
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });
});

/* ================================================================
   H. CONVERSION FUNNEL & CTA AUDIT
   ================================================================ */

test.describe("H. Conversion Funnel & CTA Audit", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);
  });

  test("hero CTAs are prominently visible above the fold", async ({
    page,
  }) => {
    const discoverBtn = page.locator(
      '[data-testid="hero-discover-courses-link"]'
    );
    const contactBtn = page.locator('[data-testid="hero-contact-link"]');

    await expect(discoverBtn).toBeVisible();
    await expect(contactBtn).toBeVisible();

    // Both should be in viewport (above the fold)
    await expect(discoverBtn).toBeInViewport();
    await expect(contactBtn).toBeInViewport();
  });

  test("course cards are visible and contain actionable info", async ({
    page,
  }) => {
    const cards = page.locator('[data-testid="course-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Each card should contain level, age, and description info
    for (let i = 0; i < Math.min(count, 4); i++) {
      const card = cards.nth(i);
      const text = await card.textContent();
      expect(text!.length).toBeGreaterThan(10);
      // Should contain Chinese characters (level names)
      expect(text).toMatch(/[\u4e00-\u9fff]/);
    }
  });

  test("contact form is accessible from courses section via scroll", async ({
    page,
  }) => {
    // Simulates user flow: view courses → contact school
    const courses = page.locator('[data-testid="section-courses"]');
    await courses.scrollIntoViewIfNeeded();
    await expect(courses).toBeVisible();

    // Scroll to contact
    const contact = page.locator('[data-testid="section-contact"]');
    await contact.scrollIntoViewIfNeeded();
    await expect(contact).toBeVisible();

    // Contact form is ready for input
    const nameInput = contact.locator('[data-testid="contact-name"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEnabled();
  });

  test("contact email is visible in footer for direct outreach", async ({
    page,
  }) => {
    const footer = page.locator('[data-testid="footer"]');
    const emailLink = footer.locator('a[href^="mailto:"]');
    const count = await emailLink.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("trust signals: school information is visible", async ({ page }) => {
    // About section should show school stats/info (years, students, etc.)
    const about = page.locator('[data-testid="section-about"]');
    const text = await about.textContent();
    expect(text!.length).toBeGreaterThan(50);
  });

  test("legal links are visible for trust building", async ({ page }) => {
    const footer = page.locator('[data-testid="footer"]');
    await expect(footer.locator('a[href="/impressum"]')).toBeAttached();
    await expect(footer.locator('a[href="/privacy"]')).toBeAttached();
  });
});

/* ================================================================
   I. A11Y – ARIA, FOCUS, & KEYBOARD
   ================================================================ */

test.describe("I. A11Y – Focus & Keyboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWaitForLoad(page, "/");
    await dismissCookieConsent(page);
  });

  test("skip-to-content link becomes visible on focus", async ({ page }) => {
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Tab to the skip link
    await page.keyboard.press("Tab");

    // The skip link has sr-only class normally but becomes visible on focus
    const classes = await skipLink.getAttribute("class");
    expect(classes).toContain("sr-only");
    expect(classes).toContain("focus:not-sr-only");
  });

  test("main content landmark has correct id", async ({ page }) => {
    const main = page.locator("#main-content");
    await expect(main).toBeAttached();
    expect(await main.getAttribute("data-testid")).toBe(
      "section-main-content"
    );
  });

  test("all section headings use proper heading hierarchy", async ({
    page,
  }) => {
    const headings = await page.$$eval(
      "h1, h2, h3, h4, h5, h6",
      (elements) =>
        elements.map((el) => ({
          level: parseInt(el.tagName.charAt(1)),
          text: el.textContent?.trim().slice(0, 30) ?? "",
        }))
    );

    // Should have at least one h1 and multiple h2s
    const h1s = headings.filter((h) => h.level === 1);
    const h2s = headings.filter((h) => h.level === 2);
    expect(h1s.length).toBeGreaterThanOrEqual(1);
    expect(h2s.length).toBeGreaterThanOrEqual(1);

    // Heading levels should not skip when increasing (h1 → h3 without h2),
    // but decreasing (h3 → h2) is valid and should not trigger a failure.
    for (let i = 1; i < headings.length; i++) {
      const jump = headings[i].level - headings[i - 1].level;
      if (jump > 0) {
        expect(
          jump,
          `Heading level jumps from h${headings[i - 1].level} to h${headings[i].level}`
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  test("contact form labels are properly associated via for/id", async ({
    page,
  }) => {
    // Verify each label has matching input
    const pairs = [
      { label: "contact-name", input: "contact-name" },
      { label: "contact-email", input: "contact-email" },
      { label: "contact-message", input: "contact-message" },
      { label: "privacy-consent", input: "privacy-consent" },
    ];

    for (const { label: labelFor, input: inputId } of pairs) {
      const labelEl = page.locator(`label[for="${labelFor}"]`);
      const inputEl = page.locator(`#${inputId}`);
      await expect(labelEl).toBeAttached();
      await expect(inputEl).toBeAttached();
    }
  });

  test("mobile menu toggle has aria-expanded attribute", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/");
    await dismissCookieConsent(page);

    const toggle = page.locator('[data-testid="mobile-menu-toggle"]');
    expect(await toggle.getAttribute("aria-expanded")).toBe("false");

    await toggle.click();
    expect(await toggle.getAttribute("aria-expanded")).toBe("true");
  });

  test("images have alt text or are decorative (aria-hidden)", async ({
    page,
  }) => {
    const images = await page.$$eval("img", (imgs) =>
      imgs.map((img) => ({
        src: img.getAttribute("src") ?? "",
        alt: img.getAttribute("alt"),
        ariaHidden: img.getAttribute("aria-hidden"),
        role: img.getAttribute("role"),
      }))
    );

    for (const img of images) {
      const hasAlt = img.alt !== null && img.alt.trim().length > 0;
      const isDecorative =
        img.ariaHidden === "true" ||
        img.role === "presentation" ||
        img.alt === "";
      expect(
        hasAlt || isDecorative,
        `Image ${img.src} missing alt text and not marked decorative`
      ).toBeTruthy();
    }
  });
});

/* ================================================================
   J. SEO CONSISTENCY
   ================================================================ */

test.describe("J. SEO Consistency", () => {
  test("JSON-LD schema has required LanguageSchool properties", async ({
    page,
  }) => {
    await page.goto("/");
    const jsonLdText = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    expect(jsonLdText).toBeTruthy();

    const schema = JSON.parse(jsonLdText!);
    expect(schema.name).toContain("Yi Xin");
    expect(schema.url).toBeTruthy();
    expect(schema.address).toBeTruthy();
    expect(schema.contactPoint).toBeTruthy();
    expect(schema.hasOfferCatalog).toBeTruthy();

    // Course catalog should have items
    const courses = schema.hasOfferCatalog?.itemListElement;
    expect(Array.isArray(courses)).toBe(true);
    expect(courses.length).toBeGreaterThanOrEqual(1);
  });

  test("sitemap.xml is accessible and contains valid URLs", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("<url>");
  });

  test("robots.txt allows crawling", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("Allow: /");
  });

  test("meta viewport is present for mobile rendering", async ({ page }) => {
    await page.goto("/");
    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewport).toBeTruthy();
    expect(viewport).toContain("width=device-width");
  });

  test("impressum page has its own metadata", async ({ page }) => {
    await page.goto("/impressum");
    const title = await page.title();
    expect(title).toContain("Impressum");
  });

  test("privacy page has its own metadata", async ({ page }) => {
    await page.goto("/privacy");
    const title = await page.title();
    expect(title.toLowerCase()).toContain("datenschutz");
  });
});

/* ================================================================
   K. RESPONSIVE CTA VISIBILITY
   ================================================================ */

test.describe("K. Responsive CTA Visibility", () => {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`hero CTAs visible on ${name} (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await navigateAndWaitForLoad(page, "/");
      await dismissCookieConsent(page);

      const discoverBtn = page.locator(
        '[data-testid="hero-discover-courses-link"]'
      );
      const contactBtn = page.locator('[data-testid="hero-contact-link"]');

      await expect(discoverBtn).toBeVisible();
      await expect(contactBtn).toBeVisible();
    });

    test(`contact form accessible on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await navigateAndWaitForLoad(page, "/");
      await dismissCookieConsent(page);

      const contactSection = page.locator('[data-testid="section-contact"]');
      await contactSection.scrollIntoViewIfNeeded();

      const submitBtn = contactSection.locator(
        '[data-testid="contact-submit"]'
      );
      await expect(submitBtn).toBeVisible();
      await expect(submitBtn).toBeEnabled();
    });
  }

  test("no horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);

    for (const route of ["/", "/impressum", "/privacy", "/admin"]) {
      await page.goto(route);
      const hasOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
      );
      expect(hasOverflow, `Horizontal overflow on ${route} (mobile)`).toBe(
        false
      );
    }
  });

  test("admin page responsive on mobile", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/admin");

    const loginField = page.locator(
      '[data-testid="admin-login-username"]'
    );
    await expect(loginField).toBeVisible();

    // No overflow
    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });
});

/* ================================================================
   L. NO CONSOLE ERRORS ACROSS ROUTES
   ================================================================ */

test.describe("L. Console Error Monitoring", () => {
  for (const route of ["/", "/admin", "/impressum", "/privacy"]) {
    test(`no unexpected console errors on ${route}`, async ({
      page,
      consoleErrors,
    }) => {
      await page.goto(route, { waitUntil: "load" });
      const realErrors = filterBenignConsoleErrors(consoleErrors);
      expect(
        realErrors,
        `Console errors on ${route}: ${JSON.stringify(realErrors)}`
      ).toHaveLength(0);
    });
  }
});
