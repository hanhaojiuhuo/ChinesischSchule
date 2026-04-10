"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { AuthContextValue } from "@/types/auth";

const LOGIN_FAILURES_KEY = "yixin-login-failures";

/**
 * State and handlers for login, 2FA, and forgot-password flows.
 * Extracted from AdminPageContext to reduce file size.
 */
export function useLoginState(authCtx: AuthContextValue, resetParam?: string | null, usernameParam?: string | null) {
  // Login form state
  const [userInput, setUserInput] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [, setLoginBlocked] = useState(false);

  // Two-factor authentication state
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorMaskedEmail, setTwoFactorMaskedEmail] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  // Forgot-password state
  const [forgotPwStep, setForgotPwStep] = useState(0);
  const [forgotPwUsername, setForgotPwUsername] = useState("");
  const [forgotPwEmail, setForgotPwEmail] = useState("");
  const [forgotPwCode, setForgotPwCode] = useState("");
  const [forgotPwNewPw, setForgotPwNewPw] = useState("");
  const [forgotPwNewPwConfirm, setForgotPwNewPwConfirm] = useState("");
  const [forgotPwError, setForgotPwError] = useState("");
  const [forgotPwSuccess, setForgotPwSuccess] = useState("");
  const [forgotPwLoading, setForgotPwLoading] = useState(false);
  const [forgotPwResendCount, setForgotPwResendCount] = useState(0); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [forgotPwRateLimited, setForgotPwRateLimited] = useState(false);
  const [showForgotPwNew, setShowForgotPwNew] = useState(false);
  const [showForgotPwConfirm, setShowForgotPwConfirm] = useState(false);
  const [forgotPwMismatchCount, setForgotPwMismatchCount] = useState(0);
  const FORGOT_PW_MISMATCH_MAX = 3;
  const [forgotPwAdminInitiated, setForgotPwAdminInitiated] = useState(false);

  // 3-minute cooldown between forgot-password code requests
  const FORGOT_PW_COOLDOWN_MS = 3 * 60 * 1000;
  const [forgotPwCooldownEnd, setForgotPwCooldownEnd] = useState(0);
  const [forgotPwCooldownSecs, setForgotPwCooldownSecs] = useState(0);

  // Failed attempts (for dev mode threshold)
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      const stored = localStorage.getItem(LOGIN_FAILURES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === new Date().toISOString().slice(0, 10)) {
          return parsed.count as number;
        }
      }
    } catch { /* ignore */ }
    return 0;
  });

  const fmtCooldown = (secs: number) =>
    `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  // Pre-fill username from last session
  useEffect(() => {
    try {
      const lastUser = localStorage.getItem("yixin-admin-session");
      if (lastUser) setUserInput(lastUser);
    } catch { /* ignore */ }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (forgotPwCooldownEnd <= 0) {
      setForgotPwCooldownSecs(0);
      return;
    }
    const remaining = Math.max(0, Math.ceil((forgotPwCooldownEnd - Date.now()) / 1000));
    setForgotPwCooldownSecs(remaining);
    if (remaining <= 0) return;

    const tick = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((forgotPwCooldownEnd - Date.now()) / 1000));
      setForgotPwCooldownSecs(left);
    }, 1000);
    return () => window.clearInterval(tick);
  }, [forgotPwCooldownEnd]);

  // Auto-open forgot-password flow when URL has ?reset=1&username=xxx
  useEffect(() => {
    if (resetParam === "1" && usernameParam && !authCtx.currentUser) {
      setForgotPwAdminInitiated(true);
      setForgotPwStep(2);
      setForgotPwUsername(usernameParam);
    }
  }, [resetParam, usernameParam, authCtx.currentUser]);

  /* ── Login handlers ────────────────────────────────── */

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginBlocked(false);
    if (!userInput.trim() || !pwInput.trim()) {
      setLoginError(
        "请输入用户名和密码 / Please enter username and password / Bitte Benutzername und Passwort eingeben"
      );
      return;
    }
    const result = await authCtx.login(userInput.trim(), pwInput);
    if (result.twoFactorRequired) {
      setTwoFactorStep(true);
      setTwoFactorMaskedEmail(result.maskedEmail ?? "");
      setLoginError("");
      return;
    }
    if (!result.success) {
      setFailedAttempts((c) => c + 1);
      if (result.blocked) {
        setLoginBlocked(true);
        setLoginError(
          "登录已被暂时封锁 / Login temporarily blocked / Anmeldung vorübergehend gesperrt"
        );
      } else {
        const rem = result.remainingAttempts ?? 0;
        setLoginError(
          rem > 0
            ? `密码错误，还剩 ${rem} 次 / Wrong password, ${rem} attempt(s) left / Falsches Passwort, noch ${rem} Versuch(e)`
            : "登录已被暂时封锁 / Login temporarily blocked / Anmeldung vorübergehend gesperrt"
        );
      }
    }
  }

  async function handleTwoFactorVerify(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    if (!twoFactorCode.trim()) {
      setLoginError("请输入验证码 / Please enter the code / Bitte Code eingeben");
      return;
    }
    setTwoFactorLoading(true);
    const result = await authCtx.verifyLoginCode(userInput.trim(), twoFactorCode.trim());
    setTwoFactorLoading(false);
    if (!result.success) {
      setLoginError(result.error ?? "验证码无效 / Invalid code / Ungültiger Code");
    }
  }

  /* ── Forgot-password handlers ─────────────────────── */

  async function handleForgotPwRequest() {
    if (!forgotPwUsername.trim() || !forgotPwEmail.trim()) return;
    setForgotPwLoading(true);
    setForgotPwError("");
    setForgotPwSuccess("");
    setForgotPwRateLimited(false);
    try {
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", username: forgotPwUsername.trim(), email: forgotPwEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.blocked) {
          setForgotPwMismatchCount(FORGOT_PW_MISMATCH_MAX);
          setForgotPwStep(5);
        } else if (data.rateLimited) {
          setForgotPwRateLimited(true);
          setForgotPwError(data.error ?? "Error");
        } else {
          const newCount = forgotPwMismatchCount + 1;
          setForgotPwMismatchCount(newCount);
          if (newCount >= FORGOT_PW_MISMATCH_MAX) {
            setForgotPwStep(5);
          } else {
            setForgotPwError(
              `${data.error ?? "Error"}\n(${FORGOT_PW_MISMATCH_MAX - newCount} attempt(s) remaining / noch ${FORGOT_PW_MISMATCH_MAX - newCount} Versuch(e) / 剩余 ${FORGOT_PW_MISMATCH_MAX - newCount} 次尝试)`
            );
          }
        }
      } else {
        setForgotPwStep(2);
        setForgotPwResendCount(0);
        setForgotPwMismatchCount(0);
        setForgotPwCooldownEnd(Date.now() + FORGOT_PW_COOLDOWN_MS);
        setForgotPwSuccess("✅ 验证码已发送 / Code erfolgreich gesendet / Code sent successfully");
      }
    } catch {
      setForgotPwError("Network error / Netzwerkfehler");
    } finally {
      setForgotPwLoading(false);
    }
  }

  async function handleForgotPwVerify() {
    if (forgotPwAdminInitiated && !forgotPwUsername.trim()) return;
    if (!forgotPwCode.trim()) return;
    setForgotPwLoading(true);
    setForgotPwError("");
    setForgotPwSuccess("");
    try {
      const verifyBody: Record<string, string> = {
        action: "verify",
        username: forgotPwUsername.trim(),
        code: forgotPwCode.trim(),
      };
      if (forgotPwEmail.trim()) {
        verifyBody.email = forgotPwEmail.trim();
      }
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyBody),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotPwError(data.error ?? "Invalid code / Ungültiger Code / 验证码无效");
      } else {
        setForgotPwStep(3);
      }
    } catch {
      setForgotPwError("Network error / Netzwerkfehler");
    } finally {
      setForgotPwLoading(false);
    }
  }

  async function handleForgotPwReset() {
    if (forgotPwNewPw.length < 6) {
      setForgotPwError("至少6个字符 / Min. 6 Zeichen / Min 6 characters");
      return;
    }
    if (forgotPwNewPw !== forgotPwNewPwConfirm) {
      setForgotPwError("密码不匹配 / Passwörter stimmen nicht überein / Passwords do not match");
      return;
    }
    setForgotPwLoading(true);
    setForgotPwError("");
    try {
      const resetBody: Record<string, string> = {
        action: "reset",
        username: forgotPwUsername.trim(),
        code: forgotPwCode.trim(),
        newPassword: forgotPwNewPw,
      };
      if (forgotPwEmail.trim()) {
        resetBody.email = forgotPwEmail.trim();
      }
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetBody),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotPwError(data.error ?? "Error");
      } else {
        try { localStorage.removeItem("yixin-admins"); } catch { /* ignore */ }
        try { localStorage.removeItem(LOGIN_FAILURES_KEY); } catch { /* ignore */ }
        setLoginBlocked(false);
        setForgotPwStep(4);
      }
    } catch {
      setForgotPwError("Network error / Netzwerkfehler");
    } finally {
      setForgotPwLoading(false);
    }
  }

  async function handleForgotPwResend() {
    setForgotPwLoading(true);
    setForgotPwError("");
    setForgotPwSuccess("");
    setForgotPwRateLimited(false);
    try {
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", username: forgotPwUsername.trim(), email: forgotPwEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.rateLimited) {
          setForgotPwRateLimited(true);
        }
        setForgotPwError(data.error ?? "Error");
      } else {
        setForgotPwResendCount((c) => c + 1);
        setForgotPwCode("");
        setForgotPwError("");
        setForgotPwCooldownEnd(Date.now() + FORGOT_PW_COOLDOWN_MS);
        setForgotPwSuccess("✅ 新验证码已发送 / Neuer Code erfolgreich gesendet / New code sent successfully");
      }
    } catch {
      setForgotPwError("Network error / Netzwerkfehler");
    } finally {
      setForgotPwLoading(false);
    }
  }

  return {
    // Login state
    userInput, setUserInput,
    pwInput, setPwInput,
    loginError, setLoginError,
    showLoginPw, setShowLoginPw,
    handleLogin,
    failedAttempts,

    // Two-factor state
    twoFactorStep, setTwoFactorStep,
    twoFactorCode, setTwoFactorCode,
    twoFactorMaskedEmail,
    twoFactorLoading,
    handleTwoFactorVerify,

    // Forgot-password state
    forgotPwStep, setForgotPwStep,
    forgotPwUsername, setForgotPwUsername,
    forgotPwEmail, setForgotPwEmail,
    forgotPwCode, setForgotPwCode,
    forgotPwNewPw, setForgotPwNewPw,
    forgotPwNewPwConfirm, setForgotPwNewPwConfirm,
    forgotPwError, forgotPwSuccess, forgotPwLoading,
    showForgotPwNew, setShowForgotPwNew,
    showForgotPwConfirm, setShowForgotPwConfirm,
    forgotPwCooldownSecs, fmtCooldown,
    forgotPwAdminInitiated, forgotPwRateLimited,
    handleForgotPwRequest, handleForgotPwVerify,
    handleForgotPwReset, handleForgotPwResend,
  };
}
