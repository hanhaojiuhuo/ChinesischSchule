"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setName("");
        setEmail("");
        setMessage("");
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        if (res.status === 503) {
          setErrorMsg("邮件服务暂不可用，请直接发送邮件联系我们。 / E-Mail-Service vorübergehend nicht verfügbar. / Email service temporarily unavailable.");
        } else {
          setErrorMsg(data.error ?? "发送失败 / Failed to send / Senden fehlgeschlagen");
        }
      }
    } catch {
      setStatus("error");
      setErrorMsg("网络错误 / Network error / Netzwerkfehler");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          姓名 · Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-[var(--school-border)] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--school-red)] transition-colors"
          placeholder="张三 / Max Mustermann"
          disabled={status === "sending"}
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          邮箱 · E-Mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-[var(--school-border)] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--school-red)] transition-colors"
          placeholder="example@email.com"
          disabled={status === "sending"}
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          留言 · Nachricht
        </label>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-[var(--school-border)] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--school-red)] transition-colors resize-y"
          placeholder="请输入留言内容… / Ihre Nachricht…"
          disabled={status === "sending"}
        />
      </div>

      {/* GDPR Privacy Consent */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="privacy-consent"
          required
          checked={privacyConsent}
          onChange={(e) => setPrivacyConsent(e.target.checked)}
          className="mt-1 accent-[var(--school-red)]"
          disabled={status === "sending"}
        />
        <label htmlFor="privacy-consent" className="text-xs text-gray-600 leading-relaxed">
          我已阅读并同意{" "}
          <a href="/privacy" className="text-[var(--school-red)] underline" target="_blank" rel="noopener noreferrer" aria-label="隐私政策 (opens in new tab)">
            隐私政策
          </a>{" "}
          / Ich akzeptiere die{" "}
          <a href="/privacy" className="text-[var(--school-red)] underline" target="_blank" rel="noopener noreferrer" aria-label="Datenschutzerklärung (opens in new tab)">
            Datenschutzerklärung
          </a>{" "}
          / I accept the{" "}
          <a href="/privacy" className="text-[var(--school-red)] underline" target="_blank" rel="noopener noreferrer" aria-label="Privacy Policy (opens in new tab)">
            Privacy Policy
          </a>
        </label>
      </div>

      {/* Status messages */}
      {status === "success" && (
        <p className="text-sm text-green-600 font-semibold text-center">
          ✓ 留言已发送！ / Nachricht gesendet! / Message sent!
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600 text-center">{errorMsg}</p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full px-4 py-2.5 bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] disabled:opacity-60 text-white text-sm font-semibold rounded transition-colors"
      >
        {status === "sending"
          ? "⏳ 发送中… / Senden…"
          : "📨 发送留言 · Nachricht senden · Send Message"}
      </button>
    </form>
  );
}
