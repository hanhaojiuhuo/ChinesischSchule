/**
 * Unit tests for src/lib/ utility functions.
 *
 * Uses Node.js built-in `node:test` runner — no additional dependencies.
 * Run with: `npx tsx --test tests/unit/lib-utils.test.ts`
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ── validation.ts ──────────────────────────────────────────────────

import { countWords, validateImageFile, MAX_WORDS_NEWS, MAX_WORDS_DEFAULT } from "../../src/lib/validation";

describe("countWords", () => {
  it("returns 0 for empty or whitespace-only string", () => {
    assert.equal(countWords(""), 0);
    assert.equal(countWords("   "), 0);
    assert.equal(countWords("\n\t"), 0);
  });

  it("counts Latin words correctly", () => {
    assert.equal(countWords("Hello world"), 2);
    assert.equal(countWords("one two three four five"), 5);
  });

  it("counts CJK characters individually", () => {
    assert.equal(countWords("你好世界"), 4);
    assert.equal(countWords("中文学校"), 4);
  });

  it("counts mixed CJK and Latin together", () => {
    assert.equal(countWords("Hello 你好 world 世界"), 6);
  });

  it("handles punctuation within words", () => {
    assert.equal(countWords("don't"), 1);
  });
});

describe("validateImageFile", () => {
  it("returns null for valid JPEG file", () => {
    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    assert.equal(validateImageFile(file), null);
  });

  it("returns error for unsupported type", () => {
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    assert.notEqual(validateImageFile(file), null);
  });

  it("allows RAW files by extension", () => {
    const file = new File(["x"], "photo.cr2", { type: "" });
    assert.equal(validateImageFile(file), null);
  });

  it("returns error for oversized files", () => {
    const buf = new ArrayBuffer(4 * 1024 * 1024); // 4 MB
    const file = new File([buf], "large.jpg", { type: "image/jpeg" });
    assert.notEqual(validateImageFile(file), null);
  });
});

describe("MAX_WORDS constants", () => {
  it("MAX_WORDS_NEWS is 1000", () => assert.equal(MAX_WORDS_NEWS, 1000));
  it("MAX_WORDS_DEFAULT is 200", () => assert.equal(MAX_WORDS_DEFAULT, 200));
});

// ── sanitize.ts ────────────────────────────────────────────────────

import { escapeHtml } from "../../src/lib/sanitize";

describe("escapeHtml", () => {
  it("escapes angle brackets", () => {
    assert.equal(escapeHtml("<script>alert('xss')</script>"), "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
  });

  it("escapes ampersands", () => {
    assert.equal(escapeHtml("A & B"), "A &amp; B");
  });

  it("escapes double quotes", () => {
    assert.equal(escapeHtml('say "hello"'), "say &quot;hello&quot;");
  });

  it("leaves plain text unchanged", () => {
    assert.equal(escapeHtml("Hello World"), "Hello World");
  });
});

// ── text-utils.ts ──────────────────────────────────────────────────

import { maskEmail, formatTimer } from "../../src/lib/text-utils";

describe("maskEmail", () => {
  it("masks a normal email address", () => {
    assert.equal(maskEmail("john@example.com"), "j***n@example.com");
  });

  it("handles short local part (2 chars)", () => {
    assert.equal(maskEmail("ab@example.com"), "a***@example.com");
  });

  it("handles single-char local part", () => {
    assert.equal(maskEmail("a@example.com"), "a***@example.com");
  });

  it("handles invalid email without @", () => {
    assert.equal(maskEmail("invalid"), "***@***");
  });
});

describe("formatTimer", () => {
  it("formats 0 seconds", () => {
    assert.equal(formatTimer(0), "00:00");
  });

  it("formats 125 seconds as 02:05", () => {
    assert.equal(formatTimer(125), "02:05");
  });

  it("formats 60 seconds as 01:00", () => {
    assert.equal(formatTimer(60), "01:00");
  });

  it("formats 9 seconds as 00:09", () => {
    assert.equal(formatTimer(9), "00:09");
  });
});

// ── error-messages.ts ──────────────────────────────────────────────

import { ErrorMessages } from "../../src/lib/error-messages";

describe("ErrorMessages", () => {
  it("INTERNAL_SERVER_ERROR contains all three languages", () => {
    assert.ok(ErrorMessages.INTERNAL_SERVER_ERROR.includes("Internal server error"));
    assert.ok(ErrorMessages.INTERNAL_SERVER_ERROR.includes("Interner Serverfehler"));
    assert.ok(ErrorMessages.INTERNAL_SERVER_ERROR.includes("服务器内部错误"));
  });

  it("RATE_LIMITED is defined", () => {
    assert.ok(ErrorMessages.RATE_LIMITED.length > 0);
  });
});

// ── otp.ts (generateHmacCode / verifyHmacCode) ────────────────────

import { generateHmacCode, verifyHmacCode } from "../../src/lib/otp";

describe("generateHmacCode", () => {
  it("returns an 8-character uppercase hex string", () => {
    const code = generateHmacCode("test", "admin", "secret123", 5 * 60 * 1000);
    assert.match(code, /^[0-9A-F]{8}$/);
  });

  it("produces the same code within the same time slot", () => {
    const code1 = generateHmacCode("test", "admin", "secret123", 60 * 60 * 1000);
    const code2 = generateHmacCode("test", "admin", "secret123", 60 * 60 * 1000);
    assert.equal(code1, code2);
  });

  it("produces different codes for different usernames", () => {
    const code1 = generateHmacCode("test", "admin", "secret123", 60 * 60 * 1000);
    const code2 = generateHmacCode("test", "user2", "secret123", 60 * 60 * 1000);
    assert.notEqual(code1, code2);
  });

  it("produces different codes for different domains", () => {
    const code1 = generateHmacCode("login-2fa", "admin", "secret123", 60 * 60 * 1000);
    const code2 = generateHmacCode("password-reset", "admin", "secret123", 60 * 60 * 1000);
    assert.notEqual(code1, code2);
  });
});

describe("verifyHmacCode", () => {
  it("accepts a freshly generated code", () => {
    const code = generateHmacCode("test", "admin", "secret123", 5 * 60 * 1000);
    assert.ok(verifyHmacCode("test", "admin", "secret123", code, 5 * 60 * 1000));
  });

  it("accepts lowercase input (case insensitive)", () => {
    const code = generateHmacCode("test", "admin", "secret123", 5 * 60 * 1000);
    assert.ok(verifyHmacCode("test", "admin", "secret123", code.toLowerCase(), 5 * 60 * 1000));
  });

  it("rejects a wrong code", () => {
    assert.ok(!verifyHmacCode("test", "admin", "secret123", "WRONG123", 5 * 60 * 1000));
  });

  it("rejects a code from a different domain", () => {
    const code = generateHmacCode("login", "admin", "secret123", 5 * 60 * 1000);
    assert.ok(!verifyHmacCode("reset", "admin", "secret123", code, 5 * 60 * 1000));
  });
});

// ── session-token.ts ───────────────────────────────────────────────

import { createSessionToken, verifySessionToken } from "../../src/lib/session-token";

describe("createSessionToken + verifySessionToken", () => {
  it("creates a token that can be verified", () => {
    const token = createSessionToken("admin");
    const user = verifySessionToken(token);
    assert.equal(user, "admin");
  });

  it("returns null for a tampered token", () => {
    const token = createSessionToken("admin");
    const tampered = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
    assert.equal(verifySessionToken(tampered), null);
  });

  it("returns null for a garbage string", () => {
    assert.equal(verifySessionToken("not-a-token"), null);
  });

  it("returns null for an empty string", () => {
    assert.equal(verifySessionToken(""), null);
  });
});
