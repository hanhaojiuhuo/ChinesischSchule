"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useContent } from "@/contexts/ContentContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import SessionTimeoutWarning from "@/components/SessionTimeoutWarning";
import Image from "next/image";
import Link from "next/link";
import { defaultTranslations } from "@/i18n/translations";
import type { Language, SiteContent, NewsItem, NewsBodyBlock, CourseItem } from "@/i18n/translations";
import { getNewsBodyBlocks } from "@/i18n/translations";
import {
  countWords,
  MAX_WORDS_NEWS,
  MAX_WORDS_DEFAULT,
  validateImageFile,
  IMAGE_ACCEPT,
} from "@/lib/validation";

const LOGIN_FAILURES_KEY = "yixin-login-failures";

/* ─── Small helpers ─────────────────────────────────────────── */

function ExpandModal({
  label,
  value,
  onChange,
  onClose,
  maxWords,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  maxWords?: number;
}) {
  const wc = maxWords != null ? countWords(value) : 0;
  const overLimit = maxWords != null && wc > maxWords;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] flex flex-col p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">{label}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg font-bold px-2"
            title="Close"
          >✕</button>
        </div>
        <textarea
          className={`flex-1 w-full border rounded px-4 py-3 text-sm focus:outline-none resize-none min-h-[60vh] ${overLimit ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[var(--school-red)]"}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
        {maxWords != null && (
          <p className={`text-xs mt-1 text-right ${overLimit ? "text-red-600 font-semibold" : "text-gray-400"}`}>
            {wc} / {maxWords} words
          </p>
        )}
      </div>
    </div>
  );
}

function ExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-2 text-gray-400 hover:text-[var(--school-red)] transition-colors"
      title="Expand editor / Vergrößern / 展开编辑器"
    >
      <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
        <path d="M3 3h4V1H1v6h2V3zm14 0h-4V1h6v6h-2V3zM3 17h4v2H1v-6h2v4zm14 0h-4v2h6v-6h-2v4z" />
      </svg>
    </button>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
      title={show ? "隐藏密码 / Hide password" : "显示密码 / Show password"}
    >
      {show ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  expandable = false,
  type = "text",
  autoComplete,
  showPassword,
  onTogglePassword,
  maxWords,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  expandable?: boolean;
  type?: string;
  autoComplete?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  maxWords?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword && showPassword ? "text" : type;
  const wc = maxWords != null ? countWords(value) : 0;
  const overLimit = maxWords != null && wc > maxWords;
  return (
    <div className="mb-3">
      <div className="flex items-center mb-1">
        <label className="block text-xs font-semibold text-gray-600">{label}</label>
        {multiline && expandable && (
          <ExpandButton onClick={() => setExpanded(true)} />
        )}
      </div>
      {expanded && (
        <ExpandModal
          label={label}
          value={value}
          onChange={onChange}
          onClose={() => setExpanded(false)}
          maxWords={maxWords}
        />
      )}
      {multiline ? (
        <>
          <textarea
            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none resize-y min-h-[80px] ${overLimit ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[var(--school-red)]"}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {maxWords != null && (
            <p className={`text-xs mt-0.5 text-right ${overLimit ? "text-red-600 font-semibold" : "text-gray-400"}`}>
              {wc} / {maxWords} words
            </p>
          )}
        </>
      ) : isPassword && onTogglePassword ? (
        <div className="relative">
          <input
            type={effectiveType}
            autoComplete={autoComplete}
            className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--school-red)]"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <EyeToggle show={!!showPassword} onToggle={onTogglePassword} />
        </div>
      ) : (
        <>
          <input
            type={effectiveType}
            autoComplete={autoComplete}
            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none ${overLimit ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[var(--school-red)]"}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {maxWords != null && (
            <p className={`text-xs mt-0.5 text-right ${overLimit ? "text-red-600 font-semibold" : "text-gray-400"}`}>
              {wc} / {maxWords} words
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SectionCard({
  title,
  children,
  onSave,
  saveStatus = "idle",
}: {
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  saveStatus?: "idle" | "saving" | "saved";
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 mb-6 bg-white shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-4">
        <h3 className="font-bold text-[var(--school-dark)] text-base">
          {title}
        </h3>
        {onSave && (
          <button
            onClick={onSave}
            disabled={saveStatus === "saving"}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold rounded transition-colors"
          >
            {saveStatus === "saving"
              ? "⏳ …"
              : saveStatus === "saved"
              ? "✓ Gespeichert!"
              : "💾 Speichern"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Admin Page ────────────────────────────────────────────── */
export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">⏳</div>}>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const { setLanguage } = useLanguage();
  const { getContent, saveContent, resetContent } = useContent();
  const auth = useAuth();
  const searchParams = useSearchParams();

  // Auto-logout after 10 minutes – only extendable via popup confirmation
  const { remainingSeconds, totalSeconds, showWarning, extendSession } =
    useAutoLogout(auth.isAdmin, auth.logout);

  // Login form state
  const [userInput, setUserInput] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [, setLoginBlocked] = useState(false);

  // Pre-fill username from last session (runs once on mount)
  useEffect(() => {
    try {
      const lastUser = localStorage.getItem("yixin-admin-session");
      if (lastUser) {
        setUserInput(lastUser);
      }
    } catch { /* ignore */ }
  }, []);

  // Draft content for the currently edited language
  const [draft, setDraft] = useState<SiteContent>(() => defaultTranslations["de"]);
  const [editLang, setEditLang] = useState<Language>("de");

  // Change-password state
  const [showChangePw, setShowChangePw] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [pwChangeMsg, setPwChangeMsg] = useState("");
  const [pwChangeMsgType, setPwChangeMsgType] = useState<"success" | "info" | "error">("error");
  const [showChangePwOld, setShowChangePwOld] = useState(false);
  const [showChangePwNew, setShowChangePwNew] = useState(false);
  const [showChangePwConfirm, setShowChangePwConfirm] = useState(false);

  // Password change email verification state
  const [pwChangeStep, setPwChangeStep] = useState<"form" | "verify">("form");
  const [pwChangeCode, setPwChangeCode] = useState("");
  const [pwChangeMaskedEmail, setPwChangeMaskedEmail] = useState("");
  const [pwChangeLoading, setPwChangeLoading] = useState(false);

  // Add-admin state
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPw, setNewAdminPw] = useState("");
  const [newAdminPwConfirm, setNewAdminPwConfirm] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [showNewAdminPw, setShowNewAdminPw] = useState(false);
  const [addAdminMsg, setAddAdminMsg] = useState("");
  const [addAdminSuccess, setAddAdminSuccess] = useState(false);

  // Remove-admin feedback
  const [removeAdminMsg, setRemoveAdminMsg] = useState("");

  // Update-email state
  const [editingEmailUser, setEditingEmailUser] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState("");
  const [emailUpdateMsg, setEmailUpdateMsg] = useState("");

  // Admin-reset-password state (admin resets password for another admin)
  const [adminResetUser, setAdminResetUser] = useState<string | null>(null);
  const [adminResetLoading, setAdminResetLoading] = useState(false);
  const [adminResetMsg, setAdminResetMsg] = useState("");

  // Developer mode state (appears after 3 failed login attempts)
  const DEV_MODE_THRESHOLD = 3;
  const [devModeOpen, setDevModeOpen] = useState(false);
  const [devModeUsername, setDevModeUsername] = useState("admin");
  const [devModeNewPw, setDevModeNewPw] = useState("");
  const [devModeNewPwConfirm, setDevModeNewPwConfirm] = useState("");
  const [devModeError, setDevModeError] = useState("");
  const [devModeSuccess, setDevModeSuccess] = useState(false);
  const [devModePersisted, setDevModePersisted] = useState(true);
  const [devModePersistError, setDevModePersistError] = useState("");
  const [devModeLoading, setDevModeLoading] = useState(false);
  const [showDevModePw, setShowDevModePw] = useState(false);
  const [showDevModeConfirm, setShowDevModeConfirm] = useState(false);
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

  // Forgot-password state (0=hidden, 1=request, 2=verify, 3=new-password, 4=done, 5=blocked)
  const [forgotPwStep, setForgotPwStep] = useState(0);
  const [forgotPwUsername, setForgotPwUsername] = useState("");
  const [forgotPwEmail, setForgotPwEmail] = useState("");
  const [forgotPwCode, setForgotPwCode] = useState("");
  const [forgotPwNewPw, setForgotPwNewPw] = useState("");
  const [forgotPwNewPwConfirm, setForgotPwNewPwConfirm] = useState("");
  const [forgotPwError, setForgotPwError] = useState("");
  const [forgotPwSuccess, setForgotPwSuccess] = useState("");
  const [forgotPwLoading, setForgotPwLoading] = useState(false);
  const [forgotPwResendCount, setForgotPwResendCount] = useState(0);
  const [forgotPwRateLimited, setForgotPwRateLimited] = useState(false);
  const [showForgotPwNew, setShowForgotPwNew] = useState(false);
  const [showForgotPwConfirm, setShowForgotPwConfirm] = useState(false);
  const [forgotPwMismatchCount, setForgotPwMismatchCount] = useState(0);
  const FORGOT_PW_MISMATCH_MAX = 3;
  // True when the forgot-password flow was triggered by an admin-initiated
  // reset link (?reset=1&username=xxx). The verification code was already
  // sent, so the user only needs to enter username + code (no email).
  const [forgotPwAdminInitiated, setForgotPwAdminInitiated] = useState(false);

  // 3-minute cooldown between forgot-password code requests
  const FORGOT_PW_COOLDOWN_MS = 3 * 60 * 1000;
  const [forgotPwCooldownEnd, setForgotPwCooldownEnd] = useState(0);
  const [forgotPwCooldownSecs, setForgotPwCooldownSecs] = useState(0);

  /** Format seconds as MM:SS for countdown display. */
  const fmtCooldown = (secs: number) =>
    `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (forgotPwCooldownEnd <= 0) {
      setForgotPwCooldownSecs(0);
      return;
    }
    // Initial calculation
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
  // (admin-initiated reset). The verification code was already sent, so
  // skip step 1 (email entry) and go directly to step 2 (code entry).
  useEffect(() => {
    const reset = searchParams.get("reset");
    const usernameParam = searchParams.get("username");
    if (reset === "1" && usernameParam && !auth.currentUser) {
      setForgotPwAdminInitiated(true);
      setForgotPwStep(2);
      setForgotPwUsername(usernameParam);
    }
  }, [searchParams, auth.currentUser]);

  // Admin list (loaded async from API)
  const [adminList, setAdminList] = useState<import("@/contexts/AuthContext").AdminUser[]>([]);
  const [adminListKey, setAdminListKey] = useState(0);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // News image upload state
  const [newsUploadingIdx, setNewsUploadingIdx] = useState<{ newsIdx: number; blockIdx: number } | null>(null);
  const [newsUploadError, setNewsUploadError] = useState("");
  const newsFileInputRef = useRef<HTMLInputElement>(null);
  const [newsExpandedBlock, setNewsExpandedBlock] = useState<{ newsIdx: number; blockIdx: number } | null>(null);

  // Per-section save status
  type SaveStatus = "idle" | "saving" | "saved";
  const [sectionStatus, setSectionStatus] = useState<Record<string, SaveStatus>>({});

  // When edit language changes, load its content into the draft
  useEffect(() => {
    setDraft(getContent(editLang));
  }, [editLang, getContent]);

  // Load admin list whenever adminListKey changes or admin logs in
  useEffect(() => {
    if (auth.isAdmin) {
      auth.getAdmins().then(setAdminList);
    }
  }, [auth, adminListKey]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginBlocked(false);
    // Client-side validation: require non-empty credentials
    if (!userInput.trim() || !pwInput.trim()) {
      setLoginError(
        "请输入用户名和密码 / Please enter username and password / Bitte Benutzername und Passwort eingeben"
      );
      return;
    }
    const result = await auth.login(userInput.trim(), pwInput);
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

  async function handleSave() {
    setSaving(true);
    await saveContent(editLang, draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleReset() {
    if (confirm("Alle Änderungen zurücksetzen? / Reset all changes? / 重置所有更改？")) {
      await resetContent(editLang);
      setDraft(defaultTranslations[editLang]);
    }
  }

  async function handleSectionSave(sectionKey: string) {
    setSectionStatus((s) => ({ ...s, [sectionKey]: "saving" }));
    try {
      await saveContent(editLang, draft);
      setSectionStatus((s) => ({ ...s, [sectionKey]: "saved" }));
      setTimeout(() => setSectionStatus((s) => ({ ...s, [sectionKey]: "idle" })), 2500);
    } catch {
      setSectionStatus((s) => ({ ...s, [sectionKey]: "idle" }));
    }
  }

  async function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!newPw || newPw.length < 6) {
      setPwChangeMsg("Mindestens 6 Zeichen / Min 6 characters / 至少6个字符");
      setPwChangeMsgType("error");
      return;
    }
    if (newPw !== newPwConfirm) {
      setPwChangeMsg(
        "Passwörter stimmen nicht überein / Passwords do not match / 密码不匹配"
      );
      setPwChangeMsgType("error");
      return;
    }

    // Step 1: If email verification is needed, request a code first
    if (pwChangeStep === "form") {
      setPwChangeLoading(true);
      setPwChangeMsg("");
      try {
        const res = await fetch("/api/password-change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "request", username: auth.currentUser }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPwChangeMaskedEmail(data.maskedEmail ?? "");
          setPwChangeStep("verify");
          setPwChangeMsg(
            `验证码已发送至 ${data.maskedEmail ?? "您的邮箱"} / Code sent to ${data.maskedEmail ?? "your email"} / Code gesendet an ${data.maskedEmail ?? "Ihre E-Mail"}`
          );
          setPwChangeMsgType("info");
        } else if (data.noEmail) {
          // No email bound — fall back to direct password change (no verification)
          await doDirectPasswordChange();
        } else {
          setPwChangeMsg(data.error ?? "Fehler / Error / 错误");
          setPwChangeMsgType("error");
        }
      } catch {
        // API unreachable — fall back to direct password change
        await doDirectPasswordChange();
      } finally {
        setPwChangeLoading(false);
      }
      return;
    }

    // Step 2: Verify code and then change password
    if (pwChangeStep === "verify") {
      if (!pwChangeCode.trim()) {
        setPwChangeMsg("请输入验证码 / Enter the code / Bitte Code eingeben");
        setPwChangeMsgType("error");
        return;
      }
      setPwChangeLoading(true);
      setPwChangeMsg("");
      try {
        const verifyRes = await fetch("/api/password-change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify",
            username: auth.currentUser,
            code: pwChangeCode.trim(),
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          setPwChangeMsg(
            verifyData.error ?? "验证码无效 / Invalid code / Ungültiger Code"
          );
          setPwChangeMsgType("error");
          setPwChangeLoading(false);
          return;
        }
        // Code verified — now change the password
        await doDirectPasswordChange();
      } catch {
        setPwChangeMsg("网络错误 / Network error / Netzwerkfehler");
        setPwChangeMsgType("error");
      } finally {
        setPwChangeLoading(false);
      }
    }
  }

  async function doDirectPasswordChange() {
    const result = await auth.changePassword(auth.currentUser!, oldPw, newPw);
    if (result.success) {
      const msg = "✓ Passwort geändert! / Password changed! / 密码已修改！";
      setPwChangeMsg(
        result.warning
          ? `${msg}\n⚠️ ${result.warning}`
          : msg
      );
      setPwChangeMsgType("success");
      setOldPw("");
      setNewPw("");
      setNewPwConfirm("");
      setPwChangeCode("");
      setPwChangeStep("form");
      setTimeout(() => {
        setShowChangePw(false);
        setPwChangeMsg("");
      }, result.warning ? 5000 : 2000);
    } else {
      setPwChangeMsg(result.error ?? "Fehler / Error / 错误");
      setPwChangeMsgType("error");
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (newAdminPw !== newAdminPwConfirm) {
      setAddAdminMsg(
        "密码不匹配 / Passwords do not match / Passwörter stimmen nicht überein"
      );
      setAddAdminSuccess(false);
      return;
    }
    const result = await auth.addAdmin(newAdminUser.trim(), newAdminPw, newAdminEmail.trim());
    if (result.success) {
      setAddAdminMsg(
        `✓ 管理员 "${newAdminUser.trim()}" 已添加！/ Administrator "${newAdminUser.trim()}" added / hinzugefügt！`
      );
      setAddAdminSuccess(true);

      // Send email notification (best-effort, don't block on failure)
      try {
        await fetch("/api/notify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newUsername: newAdminUser.trim(),
            newEmail: newAdminEmail.trim() || undefined,
            addedBy: auth.currentUser ?? "unknown",
          }),
        });
      } catch {
        // Notification is best-effort — don't show errors to user
      }

      setNewAdminUser("");
      setNewAdminPw("");
      setNewAdminPwConfirm("");
      setNewAdminEmail("");
      setAdminListKey((k) => k + 1);
      setTimeout(() => {
        setAddAdminMsg("");
        setAddAdminSuccess(false);
      }, 3000);
    } else {
      setAddAdminMsg(result.error ?? "错误 / Error / Fehler");
      setAddAdminSuccess(false);
    }
  }

  async function handleRemoveAdmin(username: string) {
    if (
      !confirm(
        `确认删除管理员 "${username}"？/ Remove administrator "${username}"? / Admin "${username}" entfernen?`
      )
    )
      return;
    const result = await auth.removeAdmin(username);
    if (result.success) {
      setRemoveAdminMsg(`✓ "${username}" 已删除 / removed / entfernt`);
      setAdminListKey((k) => k + 1);
      setTimeout(() => setRemoveAdminMsg(""), 3000);
    } else {
      setRemoveAdminMsg(result.error ?? "错误 / Fehler");
    }
  }

  async function handleUpdateEmail(username: string) {
    const result = await auth.updateEmail(username, editEmailValue);
    if (result.success) {
      setEmailUpdateMsg("✓ Email updated / 邮箱已更新 / E-Mail aktualisiert");
      setEditingEmailUser(null);
      setEditEmailValue("");
      setAdminListKey((k) => k + 1);
      setTimeout(() => setEmailUpdateMsg(""), 3000);
    } else {
      setEmailUpdateMsg(result.error ?? "错误 / Fehler");
    }
  }

  async function handleAdminResetPassword(username: string) {
    setAdminResetLoading(true);
    setAdminResetMsg("");
    try {
      // Get the admin's email to send a verification code
      const admins = await auth.getAdmins();
      const targetAdmin = admins.find((a) => a.username === username);
      if (!targetAdmin?.email) {
        setAdminResetMsg("❌ This admin has no email configured. / Kein E-Mail konfiguriert. / 该管理员未配置邮箱。");
        setAdminResetLoading(false);
        return;
      }

      // Use the password-reset API to send a verification code to the target admin's email
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", username, email: targetAdmin.email, adminInitiated: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminResetMsg(`❌ ${data.error ?? "Error"}`);
      } else {
        setAdminResetMsg(
          `✓ Verification code sent to ${targetAdmin.email}. The admin can use "Forgot password?" to complete the reset. / Verifizierungscode an ${targetAdmin.email} gesendet. / 验证码已发送至 ${targetAdmin.email}，该管理员可通过"忘记密码"完成重置。`
        );
        setTimeout(() => { setAdminResetMsg(""); setAdminResetUser(null); }, 8000);
      }
    } catch {
      setAdminResetMsg("❌ Network error / Netzwerkfehler / 网络错误");
    } finally {
      setAdminResetLoading(false);
    }
  }

  // Helpers to update nested draft fields
  function setField<K extends keyof SiteContent>(section: K, value: SiteContent[K]) {
    setDraft((d) => ({ ...d, [section]: value }));
  }

  function updateAbout(key: keyof SiteContent["about"], val: string) {
    setDraft((d) => ({ ...d, about: { ...d.about, [key]: val } }));
  }

  function updateHero(key: keyof SiteContent["hero"], val: string) {
    setDraft((d) => ({ ...d, hero: { ...d.hero, [key]: val } }));
  }

  function updateNav(key: keyof SiteContent["nav"], val: string) {
    setDraft((d) => ({ ...d, nav: { ...d.nav, [key]: val } }));
  }

  function updateContact(key: keyof SiteContent["contact"], val: string | string[]) {
    setDraft((d) => ({ ...d, contact: { ...d.contact, [key]: val } }));
  }

  function updateCourse(idx: number, key: keyof CourseItem, val: string) {
    setDraft((d) => {
      const items = d.courses.items.map((item, i) =>
        i === idx ? { ...item, [key]: val } : item
      );
      return { ...d, courses: { ...d.courses, items } };
    });
  }

  function addCourse() {
    setDraft((d) => ({
      ...d,
      courses: {
        ...d.courses,
        items: [...d.courses.items, { level: "", levelLabel: "", ages: "", time: "", desc: "" }],
      },
    }));
  }

  function removeCourse(idx: number) {
    setDraft((d) => ({
      ...d,
      courses: { ...d.courses, items: d.courses.items.filter((_, i) => i !== idx) },
    }));
  }

  function updateNews(idx: number, key: keyof Pick<NewsItem, "date" | "title" | "body">, val: string) {
    setDraft((d) => {
      const items = d.news.items.map((item, i) =>
        i === idx ? { ...item, [key]: val } : item
      );
      return { ...d, news: { ...d.news, items } };
    });
  }

  function updateNewsBlocks(idx: number, blocks: NewsBodyBlock[]) {
    setDraft((d) => {
      const items = d.news.items.map((item, i) =>
        i === idx ? { ...item, bodyBlocks: blocks } : item
      );
      return { ...d, news: { ...d.news, items } };
    });
  }

  async function handleNewsImageUpload(file: File, newsIdx: number, blockIdx: number) {
    setNewsUploadingIdx({ newsIdx, blockIdx });
    setNewsUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setDraft((d) => {
          const items = d.news.items.map((item, i) => {
            if (i !== newsIdx) return item;
            const blocks = (item.bodyBlocks ?? []).map((b, bi) =>
              bi === blockIdx && b.type === "image" ? { ...b, url: data.url } : b
            );
            return { ...item, bodyBlocks: blocks };
          });
          return { ...d, news: { ...d.news, items } };
        });
      } else {
        setNewsUploadError(data.error ?? "Upload failed");
      }
    } catch {
      setNewsUploadError("Upload failed / 上传失败");
    } finally {
      setNewsUploadingIdx(null);
    }
  }

  function addNews() {
    setDraft((d) => ({
      ...d,
      news: {
        ...d.news,
        items: [{ date: "", title: "", body: "", bodyBlocks: [{ type: "text", content: "" }] }, ...d.news.items],
      },
    }));
  }

  function removeNews(idx: number) {
    setDraft((d) => ({
      ...d,
      news: { ...d.news, items: d.news.items.filter((_, i) => i !== idx) },
    }));
  }

  /* ── Login screen ────────────────────────────────────────── */
  if (!auth.isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--school-gray)] flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
          <h1 className="font-cn text-2xl font-bold text-[var(--school-dark)] mb-1 text-center">
            管理员登录
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            Administrator Login · Admin-Anmeldung
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                用户名 / Username / Benutzername
              </label>
              <input
                type="text"
                autoComplete="username"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                密码 / Password / Passwort
              </label>
              <div className="relative">
                <input
                  type={showLoginPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={pwInput}
                  onChange={(e) => setPwInput(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--school-red)]"
                  placeholder="••••••••"
                />
                <EyeToggle show={showLoginPw} onToggle={() => setShowLoginPw((v) => !v)} />
              </div>
            </div>
            {loginError && (
              <p className="text-xs text-red-600 text-center">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white font-semibold py-2 rounded transition-colors"
            >
              登录 / Anmelden / Login
            </button>
          </form>

          {/* Forgot password */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setForgotPwStep((s) => (s === 0 ? 1 : 0));
                setForgotPwError("");
                setForgotPwSuccess("");
                setForgotPwUsername("");
                setForgotPwCode("");
                setForgotPwNewPw("");
                setForgotPwNewPwConfirm("");
                setForgotPwResendCount(0);
                setForgotPwRateLimited(false);
                setForgotPwMismatchCount(0);
                setForgotPwCooldownEnd(0);
                setForgotPwAdminInitiated(false);
              }}
              className="text-xs text-[var(--school-red)] underline hover:opacity-80 transition-opacity"
            >
              忘记密码？/ Passwort vergessen? / Forgot password?
            </button>
          </div>

          {/* ── Forgot-password multi-step form ── */}
          {forgotPwStep > 0 && (
            <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
              {/* Step indicator */}
              <p className="text-xs font-semibold text-gray-700 text-center">
                🔐{" "}
                {forgotPwStep === 1 && "密码重置 · Passwort-Reset · Password Reset"}
                {forgotPwStep === 2 && "输入验证码 · Code eingeben · Enter Code"}
                {forgotPwStep === 3 && "设置新密码 · Neues Passwort · New Password"}
                {forgotPwStep === 4 && "✅ 密码已重置 · Passwort zurückgesetzt · Password Reset"}
                {forgotPwStep === 5 && "🚫 已封锁 · Gesperrt · Blocked"}
              </p>

              {/* Step 1 – enter username + email */}
              {forgotPwStep === 1 && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
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
                          // Mismatch error (username not found or email doesn't match)
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
                  }}
                  className="space-y-2"
                >
                  <p className="text-xs text-gray-600">
                    DE: Geben Sie Ihren Benutzernamen und Ihre E-Mail-Adresse ein. Der Verifizierungscode wird nur gesendet, wenn beide übereinstimmen.<br />
                    EN: Enter your username and email address. The verification code will only be sent if both match.<br />
                    ZH: 请输入您的用户名和邮箱地址。只有两者匹配时才会发送验证码。
                  </p>
                  <input
                    type="text"
                    value={forgotPwUsername}
                    onChange={(e) => setForgotPwUsername(e.target.value)}
                    placeholder="用户名 / Username / Benutzername"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
                    autoComplete="username"
                    required
                  />
                  <input
                    type="email"
                    value={forgotPwEmail}
                    onChange={(e) => setForgotPwEmail(e.target.value)}
                    placeholder="E-Mail / Email / 邮箱"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
                    autoComplete="email"
                    required
                  />
                  {forgotPwError && <p className="text-xs text-red-600 whitespace-pre-line">{forgotPwError}</p>}
                  {forgotPwRateLimited && (
                    <p className="text-xs text-amber-600">
                      DE: Bitte kontaktieren Sie einen Administrator, falls Sie keinen Zugang erhalten.<br />
                      EN: Please contact an administrator if you are unable to reset your password.<br />
                      ZH: 如果无法重置密码，请联系管理员。
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={forgotPwLoading || forgotPwCooldownSecs > 0}
                    className="w-full bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] disabled:opacity-60 text-white text-sm font-semibold py-2 rounded transition-colors"
                  >
                    {forgotPwCooldownSecs > 0
                      ? `⏳ ${fmtCooldown(forgotPwCooldownSecs)} — 请等待 / Bitte warten / Please wait`
                      : forgotPwLoading ? "⏳ …" : "发送验证码 / Code senden / Send Code"}
                  </button>
                </form>
              )}

              {/* Step 2 – enter verification code */}
              {forgotPwStep === 2 && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
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
                      // Only include email when available (normal flow); admin-initiated flow skips email.
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
                  }}
                  className="space-y-2"
                >
                  {forgotPwAdminInitiated ? (
                    <p className="text-xs text-gray-600">
                      DE: Ein Administrator hat einen Passwort-Reset für Ihr Konto angefordert. Bitte geben Sie Ihren Benutzernamen und den per E-Mail erhaltenen 6-stelligen Verifizierungscode ein.<br />
                      EN: An administrator has requested a password reset for your account. Please enter your username and the 6-digit verification code you received by email.<br />
                      ZH: 管理员已为您的账户发起密码重置。请输入您的用户名和通过邮件收到的6位验证码。
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600">
                      DE: Falls die E-Mail-Adresse im System registriert ist, wurde ein Verifizierungscode gesendet (gültig 30 Min.). Nach Ablauf muss ein neuer Code angefordert werden.<br />
                      EN: If the email is registered in the system, a verification code was sent (valid 30 min). After expiry, a new code must be requested.<br />
                      ZH: 如果该邮箱已在系统中注册，验证码已发送（有效期 30 分钟）。过期后需重新申请。
                    </p>
                  )}
                  {forgotPwSuccess && <p className="text-xs text-green-600 font-semibold" role="status">{forgotPwSuccess}</p>}
                  {forgotPwCooldownSecs > 0 && (
                    <p className="text-xs text-amber-600 font-mono text-center">
                      ⏳ {fmtCooldown(forgotPwCooldownSecs)}{" "}
                      — 重新发送前请等待 / Bitte warten Sie vor dem erneuten Senden / Please wait before resending
                    </p>
                  )}
                  {/* Show editable username field in admin-initiated flow */}
                  {forgotPwAdminInitiated && (
                    <input
                      type="text"
                      value={forgotPwUsername}
                      onChange={(e) => setForgotPwUsername(e.target.value)}
                      placeholder="用户名 / Username / Benutzername"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
                      autoComplete="username"
                      required
                    />
                  )}
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={forgotPwCode}
                    onChange={(e) => setForgotPwCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-stelliger Code / 6-digit code / 6位验证码"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-center tracking-widest focus:outline-none focus:border-[var(--school-red)]"
                    autoComplete="one-time-code"
                    required
                  />
                  {forgotPwError && <p className="text-xs text-red-600">{forgotPwError}</p>}
                  <button
                    type="submit"
                    disabled={forgotPwLoading}
                    className="w-full bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] disabled:opacity-60 text-white text-sm font-semibold py-2 rounded transition-colors"
                  >
                    {forgotPwLoading ? "⏳ …" : "验证 / Bestätigen / Verify"}
                  </button>
                  {/* Retry / Resend code — only in normal flow (email known) */}
                  {!forgotPwAdminInitiated && (
                    <button
                      type="button"
                      disabled={forgotPwLoading || forgotPwRateLimited || forgotPwCooldownSecs > 0}
                      onClick={async () => {
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
                      }}
                      className="w-full text-xs text-[var(--school-red)] underline hover:opacity-80 disabled:opacity-40"
                    >
                      {forgotPwCooldownSecs > 0
                        ? `⏳ ${fmtCooldown(forgotPwCooldownSecs)} — 请等待 / Bitte warten / Please wait`
                        : forgotPwResendCount > 0
                          ? `🔁 Code erneut gesendet (${forgotPwResendCount}×) / Resent / 已重发`
                          : "🔁 Code erneut senden / Resend code / 重新发送验证码"}
                    </button>
                  )}
                  {forgotPwRateLimited && (
                    <p className="text-xs text-amber-600">
                      DE: Zu viele Versuche. Bitte kontaktieren Sie einen Administrator.<br />
                      EN: Too many attempts. Please contact an administrator.<br />
                      ZH: 尝试次数过多，请联系管理员。
                    </p>
                  )}
                  {forgotPwAdminInitiated ? (
                    <p className="text-xs text-gray-400">
                      DE: Code abgelaufen? Bitten Sie einen Administrator, den Code erneut zu senden.<br />
                      EN: Code expired? Ask an administrator to resend the code.<br />
                      ZH: 验证码过期？请联系管理员重新发送。
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      DE: Kein Code erhalten? Prüfen Sie Ihren Spam-Ordner oder kontaktieren Sie den Administrator.<br />
                      EN: Didn&apos;t receive a code? Check your spam folder or contact the administrator.<br />
                      ZH: 没收到验证码？请检查垃圾邮件或联系管理员。
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => { setForgotPwStep(1); setForgotPwError(""); setForgotPwSuccess(""); setForgotPwCode(""); setForgotPwAdminInitiated(false); }}
                    className="w-full text-xs text-gray-500 underline hover:opacity-80"
                  >
                    ← 返回 / Zurück / Back
                  </button>
                </form>
              )}

              {/* Step 3 – enter new password */}
              {forgotPwStep === 3 && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
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
                      // Only include email when available (normal flow); admin-initiated flow skips email.
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
                        // Clear any stale local admin cache so next login
                        // fetches the updated list from the server.
                        try { localStorage.removeItem("yixin-admins"); } catch { /* ignore */ }
                        // Clear login lockout so the user can log in immediately
                        // with their new password.
                        try { localStorage.removeItem(LOGIN_FAILURES_KEY); } catch { /* ignore */ }
                        setLoginBlocked(false);
                        setForgotPwStep(4);
                      }
                    } catch {
                      setForgotPwError("Network error / Netzwerkfehler");
                    } finally {
                      setForgotPwLoading(false);
                    }
                  }}
                  className="space-y-2"
                >
                  <p className="text-xs text-gray-600">
                    DE: Legen Sie Ihr neues Passwort fest (mind. 6 Zeichen).<br />
                    EN: Set your new password (minimum 6 characters).<br />
                    ZH: 请设置新密码（至少6个字符）。
                  </p>
                  <div className="relative">
                    <input
                      type={showForgotPwNew ? "text" : "password"}
                      value={forgotPwNewPw}
                      onChange={(e) => setForgotPwNewPw(e.target.value)}
                      placeholder="新密码 / Neues Passwort / New password"
                      className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--school-red)]"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                    <EyeToggle show={showForgotPwNew} onToggle={() => setShowForgotPwNew((v) => !v)} />
                  </div>
                  <div className="relative">
                    <input
                      type={showForgotPwConfirm ? "text" : "password"}
                      value={forgotPwNewPwConfirm}
                      onChange={(e) => setForgotPwNewPwConfirm(e.target.value)}
                      placeholder="确认密码 / Passwort bestätigen / Confirm password"
                      className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--school-red)]"
                      autoComplete="new-password"
                      required
                    />
                    <EyeToggle show={showForgotPwConfirm} onToggle={() => setShowForgotPwConfirm((v) => !v)} />
                  </div>
                  {forgotPwError && <p className="text-xs text-red-600">{forgotPwError}</p>}
                  <button
                    type="submit"
                    disabled={forgotPwLoading}
                    className="w-full bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] disabled:opacity-60 text-white text-sm font-semibold py-2 rounded transition-colors"
                  >
                    {forgotPwLoading ? "⏳ …" : "保存新密码 / Speichern / Save"}
                  </button>
                </form>
              )}

              {/* Step 4 – success */}
              {forgotPwStep === 4 && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-green-700 font-semibold">
                    密码已成功重置！/ Passwort erfolgreich zurückgesetzt! / Password reset successfully!
                  </p>
                  <p className="text-xs text-gray-600">
                    DE: Sie erhalten eine Bestätigungs-E-Mail. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.<br />
                    EN: A confirmation email has been sent. You can now log in with your new password.<br />
                    ZH: 确认邮件已发送。您现在可以使用新密码登录。
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPwStep(0);
                      setForgotPwUsername("");
                      setForgotPwEmail("");
                      setForgotPwCode("");
                      setForgotPwNewPw("");
                      setForgotPwNewPwConfirm("");
                      setForgotPwError("");
                      setForgotPwSuccess("");
                      setForgotPwResendCount(0);
                      setForgotPwRateLimited(false);
                      setForgotPwMismatchCount(0);
                      setForgotPwCooldownEnd(0);
                    }}
                    className="text-xs text-[var(--school-red)] underline hover:opacity-80"
                  >
                    ← 返回登录 / Zurück zur Anmeldung / Back to Login
                  </button>
                </div>
              )}

              {/* Step 5 – blocked after 3 mismatch attempts */}
              {forgotPwStep === 5 && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-red-700 font-semibold">
                    🚫 操作已被封锁 / Activity blocked / Aktivität gesperrt
                  </p>
                  <p className="text-xs text-gray-600">
                    DE: Zu viele Fehlversuche. Bitte warten Sie 24 Stunden, bevor Sie es erneut versuchen.<br />
                    EN: Too many incorrect attempts. Please wait 24 hours before trying again.<br />
                    ZH: 错误尝试次数过多，请等待24小时后再试。
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPwStep(0);
                      setForgotPwUsername("");
                      setForgotPwEmail("");
                      setForgotPwCode("");
                      setForgotPwNewPw("");
                      setForgotPwNewPwConfirm("");
                      setForgotPwError("");
                      setForgotPwSuccess("");
                      setForgotPwResendCount(0);
                      setForgotPwRateLimited(false);
                      setForgotPwMismatchCount(0);
                      setForgotPwCooldownEnd(0);
                    }}
                    className="text-xs text-[var(--school-red)] underline hover:opacity-80"
                  >
                    ← 返回登录 / Zurück zur Anmeldung / Back to Login
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Developer mode (appears after 3+ failed attempts) ── */}
          {failedAttempts >= DEV_MODE_THRESHOLD && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setDevModeOpen((v) => !v);
                  setDevModeError("");
                  setDevModeSuccess(false);
                }}
                className="text-xs text-amber-600 underline hover:opacity-80 transition-opacity"
              >
                🔧 开发者模式 / Developer Mode / Entwicklermodus
              </button>
            </div>
          )}

          {devModeOpen && (
            <div className="mt-3 p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-amber-800 text-center">
                🔧 开发者模式 · Developer Mode · Entwicklermodus
              </p>
              {devModeSuccess ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-green-700 font-semibold">
                    ✅ 密码已保存！/ Password saved! / Passwort gespeichert!
                  </p>
                  {!devModePersisted && (
                    <p className="text-xs text-amber-700 bg-amber-100 rounded p-2">
                      ⚠️ ZH: Edge Config 未配置或写入失败。密码仅临时保存，重新部署后将丢失。<br />
                      ⚠️ EN: Edge Config not configured or write failed. Password is saved temporarily and will be lost after redeployment.<br />
                      ⚠️ DE: Edge Config nicht konfiguriert oder Schreibvorgang fehlgeschlagen. Passwort ist nur temporär gespeichert und geht nach einem Redeployment verloren.
                      {devModePersistError && (
                        <>
                          <br /><br />
                          <span className="font-mono text-[10px] text-amber-800 break-all">
                            Details: {devModePersistError}
                          </span>
                        </>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    DE: Sie können sich jetzt mit dem neuen Passwort anmelden. Vergessen Sie nicht, <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE</code> danach in Vercel zu deaktivieren.<br />
                    EN: You can now log in with the new password. Remember to disable <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE</code> in Vercel afterwards.<br />
                    ZH: 您现在可以使用新密码登录了。请记得之后在 Vercel 中关闭 <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE</code>。
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Session cookie is already set by the dev-reset response
                      // and localStorage session is saved. Reload to enter admin panel.
                      window.location.reload();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded transition-colors"
                  >
                    ✅ 进入管理面板 / Enter Admin Panel / Zum Admin-Panel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDevModeOpen(false);
                      setDevModeSuccess(false);
                      setDevModeNewPw("");
                      setDevModeNewPwConfirm("");
                      setDevModeError("");
                      setLoginBlocked(false);
                      setFailedAttempts(0);
                    }}
                    className="text-xs text-[var(--school-red)] underline hover:opacity-80"
                  >
                    ← 返回登录 / Zurück zur Anmeldung / Back to Login
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setDevModeError("");
                    const uname = devModeUsername.trim();
                    if (!uname || uname.length < 4) {
                      setDevModeError("用户名至少4个字符 / Username ≥ 4 chars / Benutzername mind. 4 Zeichen");
                      return;
                    }
                    if (devModeNewPw.length < 6) {
                      setDevModeError("密码至少6个字符 / Password ≥ 6 chars / Passwort mind. 6 Zeichen");
                      return;
                    }
                    if (devModeNewPw !== devModeNewPwConfirm) {
                      setDevModeError("密码不匹配 / Passwords do not match / Passwörter stimmen nicht überein");
                      return;
                    }
                    setDevModeLoading(true);
                    try {
                      const res = await fetch("/api/dev-reset", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: uname, newPassword: devModeNewPw }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        if (data.recoveryNotEnabled) {
                          setDevModeError(
                            "⚠️ RECOVERY_MODE 未启用。请在 Vercel 环境变量中设置 RECOVERY_MODE=true 并重新部署。\n" +
                            "⚠️ RECOVERY_MODE is not enabled. Set RECOVERY_MODE=true in Vercel environment variables and redeploy.\n" +
                            "⚠️ RECOVERY_MODE ist nicht aktiviert. Setzen Sie RECOVERY_MODE=true in den Vercel-Umgebungsvariablen und deployen Sie erneut."
                          );
                        } else {
                          setDevModeError(data.error ?? "Error");
                        }
                      } else {
                        setDevModeSuccess(true);
                        setDevModePersisted(data.persisted !== false);
                        setDevModePersistError(data.persistError ?? "");
                        // Save the new admin to localStorage so the client
                        // has the latest credentials for AuthContext fallback.
                        // NOTE: Passwords are stored in plaintext in localStorage
                        // consistent with the existing AuthContext pattern
                        // (fetchAdmins/saveAdmins). A future improvement could
                        // hash them, but that requires a broader refactor.
                        try {
                          let existing: { username: string; password?: string }[] = [];
                          try {
                            const raw = localStorage.getItem("yixin-admins");
                            const parsed = raw ? JSON.parse(raw) : [];
                            if (Array.isArray(parsed)) existing = parsed;
                          } catch { /* malformed data – start fresh */ }
                          const filtered = existing.filter((a) => a.username !== uname);
                          filtered.push({ username: uname, password: devModeNewPw });
                          localStorage.setItem("yixin-admins", JSON.stringify(filtered));
                        } catch { /* ignore */ }
                        // The dev-reset response already set a session cookie.
                        // Store the session in localStorage too, and mark it as
                        // a recovery session so AuthContext.restoreSession can
                        // validate it via /api/recovery while RECOVERY_MODE is
                        // still enabled.
                        try {
                          localStorage.setItem("yixin-admin-session", uname);
                          localStorage.setItem("yixin-recovery-session", "1");
                          localStorage.removeItem(LOGIN_FAILURES_KEY);
                        } catch { /* ignore */ }
                      }
                    } catch {
                      setDevModeError("Network error / Netzwerkfehler / 网络错误");
                    } finally {
                      setDevModeLoading(false);
                    }
                  }}
                  className="space-y-2"
                >
                  <p className="text-xs text-amber-700">
                    DE: Setzen Sie ein neues Passwort. Voraussetzung: <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> muss in den Vercel-Umgebungsvariablen gesetzt sein.<br />
                    EN: Set a new password. Requires <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> to be set in Vercel environment variables.<br />
                    ZH: 设置新密码。需要在 Vercel 环境变量中设置 <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code>。
                  </p>
                  <input
                    type="text"
                    value={devModeUsername}
                    onChange={(e) => setDevModeUsername(e.target.value)}
                    placeholder="用户名 / Username / Benutzername"
                    className="w-full border border-amber-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    autoComplete="username"
                    minLength={4}
                    required
                  />
                  <div className="relative">
                    <input
                      type={showDevModePw ? "text" : "password"}
                      value={devModeNewPw}
                      onChange={(e) => setDevModeNewPw(e.target.value)}
                      placeholder="新密码 / New password / Neues Passwort"
                      className="w-full border border-amber-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-amber-500"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                    <EyeToggle show={showDevModePw} onToggle={() => setShowDevModePw((v) => !v)} />
                  </div>
                  <div className="relative">
                    <input
                      type={showDevModeConfirm ? "text" : "password"}
                      value={devModeNewPwConfirm}
                      onChange={(e) => setDevModeNewPwConfirm(e.target.value)}
                      placeholder="确认密码 / Confirm password / Passwort bestätigen"
                      className="w-full border border-amber-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-amber-500"
                      autoComplete="new-password"
                      required
                    />
                    <EyeToggle show={showDevModeConfirm} onToggle={() => setShowDevModeConfirm((v) => !v)} />
                  </div>
                  {devModeError && (
                    <p className="text-xs text-red-600 whitespace-pre-line">{devModeError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={devModeLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded transition-colors"
                  >
                    {devModeLoading ? "⏳ …" : "💾 保存到 Vercel / Save to Vercel / In Vercel speichern"}
                  </button>
                </form>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            <Link href="/" className="underline hover:text-[var(--school-red)]">
              ← 返回网站 / Zurück zur Website / Back to site
            </Link>
          </p>
        </div>
      </div>
    );
  }

  /* ── Admin panel ─────────────────────────────────────────── */
  const langLabels: Record<Language, string> = { de: "Deutsch", zh: "中文", en: "English" };

  return (
    <div className="min-h-screen bg-[var(--school-gray)]">
      {/* Session timeout warning popup */}
      {showWarning && (
        <SessionTimeoutWarning
          remainingSeconds={remainingSeconds}
          onExtend={extendSession}
          onLogout={auth.logout}
        />
      )}
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[var(--school-dark)] text-white px-4 py-3 flex items-center justify-between gap-4 flex-wrap shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-cn font-bold text-lg">管理面板</span>
          <span className="text-gray-400 text-sm hidden sm:inline">
            Admin Panel · {auth.currentUser}
          </span>
          {/* Auto-logout countdown + total limit */}
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded ${
              remainingSeconds <= 60
                ? "bg-red-600 text-white animate-pulse"
                : remainingSeconds <= 180
                ? "bg-yellow-500 text-black"
                : "bg-white/10 text-gray-300"
            }`}
            title="自动登出倒计时 / Auto-logout countdown / Automatische Abmeldung"
          >
            ⏱ {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
            {String(remainingSeconds % 60).padStart(2, "0")}
            {" / "}
            {String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:
            {String(totalSeconds % 60).padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs font-semibold">
            {(["de", "zh", "en"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setEditLang(l)}
                className={`px-2 py-1 rounded transition-colors ${
                  editLang === l
                    ? "bg-[var(--school-red)] text-white"
                    : "bg-white/10 hover:bg-white/20 text-gray-200"
                }`}
              >
                {langLabels[l]}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded transition-colors"
          >
            {saving ? "⏳ Speichern…" : saved ? "✓ Gespeichert!" : "Speichern / Save / 保存"}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded transition-colors"
          >
            Zurücksetzen / Reset
          </button>
          <button
            onClick={() => { setLanguage(editLang); window.location.href = "/"; }}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
          >
            ← Zur Website
          </button>
          <button
            onClick={auth.logout}
            className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded transition-colors"
          >
            Abmelden / Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {auth.isRecoverySession && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-400 rounded-lg text-sm text-amber-900">
            <strong>⚠️ 恢复模式已激活 / Recovery Mode Active / Wiederherstellungsmodus aktiv</strong>
            <p className="mt-1">
              您正在通过恢复模式访问管理面板。请立即在下方【管理员管理】部分创建一个新管理员账户，然后在 Vercel 环境变量中删除 <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> 并重新部署。
            </p>
            <p className="mt-1 text-xs opacity-80">
              You are logged in via recovery mode. Create a new admin account below, then remove <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> from your Vercel environment variables and redeploy. ·
              Sie sind im Wiederherstellungsmodus angemeldet. Erstellen Sie unten ein neues Admin-Konto und entfernen Sie anschließend <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> aus den Vercel-Umgebungsvariablen.
            </p>
          </div>
        )}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Sprache bearbeiten / Editing language:</strong> {langLabels[editLang]} &nbsp;|&nbsp;
          Änderungen werden in der Vercel-Cloud gespeichert.
          Changes are saved in Vercel cloud.
          更改保存在 Vercel 云端。
        </div>

        {/* ── School identity ─────────────────────────────── */}
        <SectionCard title="🏫 Schulinfo / School Info / 学校信息" onSave={() => handleSectionSave("schoolInfo")} saveStatus={sectionStatus["schoolInfo"]}>
          <Field label="School Name (full)" value={draft.schoolName} onChange={(v) => setField("schoolName", v)} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="School Name (short)" value={draft.schoolNameShort} onChange={(v) => setField("schoolNameShort", v)} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="School Subtitle" value={draft.schoolSubtitle} onChange={(v) => setField("schoolSubtitle", v)} maxWords={MAX_WORDS_DEFAULT} />
        </SectionCard>

        {/* ── Navigation ──────────────────────────────────── */}
        <SectionCard title="🔗 Navigation" onSave={() => handleSectionSave("nav")} saveStatus={sectionStatus["nav"]}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(draft.nav) as (keyof SiteContent["nav"])[]).map((key) => (
              <Field key={key} label={key} value={draft.nav[key]} onChange={(v) => updateNav(key, v)} maxWords={MAX_WORDS_DEFAULT} />
            ))}
          </div>
        </SectionCard>

        {/* ── Hero ────────────────────────────────────────── */}
        <SectionCard title="🌟 Hero Section" onSave={() => handleSectionSave("hero")} saveStatus={sectionStatus["hero"]}>
          <Field label="Tagline (main)" value={draft.hero.tagline} onChange={(v) => updateHero("tagline", v)} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="Tagline 2 (sub)" value={draft.hero.tagline2} onChange={(v) => updateHero("tagline2", v)} maxWords={MAX_WORDS_DEFAULT} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button: Discover Courses" value={draft.hero.discoverCourses} onChange={(v) => updateHero("discoverCourses", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Button: Contact Us" value={draft.hero.contactUs} onChange={(v) => updateHero("contactUs", v)} maxWords={MAX_WORDS_DEFAULT} />
          </div>
        </SectionCard>

        {/* ── About ───────────────────────────────────────── */}
        <SectionCard title="ℹ️ About Section / Über uns / 关于我们" onSave={() => handleSectionSave("about")} saveStatus={sectionStatus["about"]}>
          <Field label="Section title" value={draft.about.sectionTitle} onChange={(v) => updateAbout("sectionTitle", v)} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="Description paragraph 1" value={draft.about.desc1} onChange={(v) => updateAbout("desc1", v)} multiline maxWords={MAX_WORDS_DEFAULT} />
          <Field label="Description paragraph 2" value={draft.about.desc2} onChange={(v) => updateAbout("desc2", v)} multiline maxWords={MAX_WORDS_DEFAULT} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Years" value={draft.about.years} onChange={(v) => updateAbout("years", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Students" value={draft.about.students} onChange={(v) => updateAbout("students", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Teachers" value={draft.about.teachers} onChange={(v) => updateAbout("teachers", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Courses count" value={draft.about.coursesCount} onChange={(v) => updateAbout("coursesCount", v)} maxWords={MAX_WORDS_DEFAULT} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
            <Field label="Years label" value={draft.about.yearsLabel} onChange={(v) => updateAbout("yearsLabel", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Students label" value={draft.about.studentsLabel} onChange={(v) => updateAbout("studentsLabel", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Teachers label" value={draft.about.teachersLabel} onChange={(v) => updateAbout("teachersLabel", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Courses label" value={draft.about.coursesLabel} onChange={(v) => updateAbout("coursesLabel", v)} maxWords={MAX_WORDS_DEFAULT} />
          </div>
        </SectionCard>

        {/* ── Courses ─────────────────────────────────────── */}
        <SectionCard title="📚 Courses / Kurse / 课程" onSave={() => handleSectionSave("courses")} saveStatus={sectionStatus["courses"]}>
          <Field
            label="Section title"
            value={draft.courses.sectionTitle}
            onChange={(v) => setDraft((d) => ({ ...d, courses: { ...d.courses, sectionTitle: v } }))}
            maxWords={MAX_WORDS_DEFAULT}
          />
          {draft.courses.items.map((course, idx) => (
            <div key={idx} className="border border-gray-200 rounded p-4 mb-3 bg-gray-50 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Course {idx + 1}</span>
                <button onClick={() => removeCourse(idx)} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                  ✕ Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="课程 / Kurs" value={course.level} onChange={(v) => updateCourse(idx, "level", v)} maxWords={MAX_WORDS_DEFAULT} />
                <Field label="级别标签 / Level label" value={course.levelLabel} onChange={(v) => updateCourse(idx, "levelLabel", v)} maxWords={MAX_WORDS_DEFAULT} />
                <Field label="年龄 / Age range" value={course.ages} onChange={(v) => updateCourse(idx, "ages", v)} maxWords={MAX_WORDS_DEFAULT} />
                <Field label="上课时间 / Class time / Unterrichtszeit" value={course.time ?? ""} onChange={(v) => updateCourse(idx, "time", v)} maxWords={MAX_WORDS_DEFAULT} />
                <Field label="描述 / Description" value={course.desc} onChange={(v) => updateCourse(idx, "desc", v)} maxWords={MAX_WORDS_DEFAULT} />
              </div>
            </div>
          ))}
          <button
            onClick={addCourse}
            className="px-4 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-[var(--school-red)] hover:text-[var(--school-red)] w-full transition-colors"
          >
            + Kurs hinzufügen / Add course / 添加课程
          </button>
        </SectionCard>

        {/* ── News ────────────────────────────────────────── */}
        {/* Hidden file input for news image uploads */}
        <input
          ref={newsFileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && newsUploadingIdx) {
              const err = validateImageFile(file);
              if (err) {
                setNewsUploadError(err);
              } else {
                handleNewsImageUpload(file, newsUploadingIdx.newsIdx, newsUploadingIdx.blockIdx);
              }
            } else {
              setNewsUploadingIdx(null);
            }
            e.target.value = "";
          }}
        />
        <SectionCard title="📰 News / Aktuelles / 学校新闻" onSave={() => handleSectionSave("news")} saveStatus={sectionStatus["news"]}>
          <Field
            label="Section title"
            value={draft.news.sectionTitle}
            onChange={(v) => setDraft((d) => ({ ...d, news: { ...d.news, sectionTitle: v } }))}
            maxWords={MAX_WORDS_DEFAULT}
          />
          <button
            onClick={addNews}
            className="mb-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-[var(--school-red)] hover:text-[var(--school-red)] w-full transition-colors"
          >
            + Neuigkeit hinzufügen / Add news / 添加新闻
          </button>
          {draft.news.items.map((item, idx) => {
            const blocks = getNewsBodyBlocks(item).length > 0 ? getNewsBodyBlocks(item) : [{ type: "text" as const, content: "" }];
            return (
            <div key={idx} className="border border-gray-200 rounded p-4 mb-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">News {idx + 1}</span>
                <button onClick={() => removeNews(idx)} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                  ✕ Remove
                </button>
              </div>
              <Field label="Date (e.g. 2025-09)" value={item.date} onChange={(v) => updateNews(idx, "date", v)} />
              <Field label="Title" value={item.title} onChange={(v) => updateNews(idx, "title", v)} maxWords={MAX_WORDS_DEFAULT} />

              {/* Body blocks */}
              <div className="mt-3 mb-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Body Blocks / Inhaltsblöcke / 内容块</label>
                {blocks.map((block, bIdx) => (
                  <div key={bIdx} className="flex gap-2 mb-2 items-start">
                    <div className="flex flex-col gap-1 mt-1">
                      {bIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newBlocks = [...blocks];
                            [newBlocks[bIdx - 1], newBlocks[bIdx]] = [newBlocks[bIdx], newBlocks[bIdx - 1]];
                            updateNewsBlocks(idx, newBlocks);
                          }}
                          className="text-xs text-gray-400 hover:text-gray-700"
                          title="Move up"
                        >▲</button>
                      )}
                      {bIdx < blocks.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newBlocks = [...blocks];
                            [newBlocks[bIdx], newBlocks[bIdx + 1]] = [newBlocks[bIdx + 1], newBlocks[bIdx]];
                            updateNewsBlocks(idx, newBlocks);
                          }}
                          className="text-xs text-gray-400 hover:text-gray-700"
                          title="Move down"
                        >▼</button>
                      )}
                    </div>
                    <div className="flex-1">
                      {block.type === "text" ? (
                        <div>
                          <div className="flex items-center mb-1">
                            <span className="text-xs text-gray-500">Text</span>
                            <ExpandButton onClick={() => setNewsExpandedBlock({ newsIdx: idx, blockIdx: bIdx })} />
                          </div>
                          {newsExpandedBlock?.newsIdx === idx && newsExpandedBlock?.blockIdx === bIdx && (
                            <ExpandModal
                              label={`News ${idx + 1} – Text block ${bIdx + 1}`}
                              value={block.content}
                              onChange={(v) => {
                                const newBlocks = blocks.map((b, i) =>
                                  i === bIdx ? { ...b, content: v } : b
                                ) as typeof blocks;
                                updateNewsBlocks(idx, newBlocks);
                              }}
                              onClose={() => setNewsExpandedBlock(null)}
                              maxWords={MAX_WORDS_NEWS}
                            />
                          )}
                          <textarea
                            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none resize-y min-h-[60px] ${countWords(block.content) > MAX_WORDS_NEWS ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[var(--school-red)]"}`}
                            value={block.content}
                            placeholder="Text…"
                            onChange={(e) => {
                              const newBlocks = blocks.map((b, i) =>
                                i === bIdx ? { ...b, content: e.target.value } : b
                              ) as typeof blocks;
                              updateNewsBlocks(idx, newBlocks);
                            }}
                          />
                          <p className={`text-xs mt-0.5 text-right ${countWords(block.content) > MAX_WORDS_NEWS ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                            {countWords(block.content)} / {MAX_WORDS_NEWS} words
                          </p>
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded p-2 bg-white">
                          <div
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files?.[0];
                              if (file) {
                                const err = validateImageFile(file);
                                if (err) {
                                  setNewsUploadError(err);
                                } else {
                                  handleNewsImageUpload(file, idx, bIdx);
                                }
                              }
                            }}
                            onClick={() => {
                              setNewsUploadingIdx({ newsIdx: idx, blockIdx: bIdx });
                              newsFileInputRef.current?.click();
                            }}
                            className="border-2 border-dashed border-gray-300 hover:border-[var(--school-red)] rounded-lg p-3 text-center cursor-pointer transition-colors mb-1"
                          >
                            {newsUploadingIdx?.newsIdx === idx && newsUploadingIdx?.blockIdx === bIdx ? (
                              <p className="text-sm text-gray-500">⏳ Uploading… / 上传中…</p>
                            ) : block.url ? (
                              <div>
                                <Image src={block.url} alt={block.caption ?? ""} width={400} height={128} unoptimized className="mx-auto max-h-32 object-cover rounded border border-gray-200 mb-1" />
                                <p className="text-xs text-gray-400">Click or drop to replace / 点击或拖拽替换图片</p>
                                <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, GIF, TIFF, SVG, RAW · max 3 MB</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xl mb-1">📎</p>
                                <p className="text-sm text-gray-500">Drop image here or click to upload</p>
                                <p className="text-xs text-gray-400">Bild hierher ziehen oder klicken / 拖拽图片到此处或点击上传</p>
                                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, TIFF, SVG, RAW · max 3 MB</p>
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--school-red)]"
                            value={block.caption ?? ""}
                            placeholder="Caption (optional) / Bildunterschrift"
                            onChange={(e) => {
                              const newBlocks = blocks.map((b, i) =>
                                i === bIdx ? { ...b, caption: e.target.value || undefined } : b
                              ) as typeof blocks;
                              updateNewsBlocks(idx, newBlocks);
                            }}
                          />
                          {newsUploadError && newsUploadingIdx?.newsIdx === idx && (
                            <p className="text-xs text-red-600 mt-1">{newsUploadError}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newBlocks = blocks.filter((_, i) => i !== bIdx);
                        updateNewsBlocks(idx, newBlocks.length > 0 ? newBlocks : [{ type: "text", content: "" }]);
                      }}
                      className="text-xs text-red-400 hover:text-red-600 mt-2"
                      title="Remove block"
                    >✕</button>
                  </div>
                ))}
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => updateNewsBlocks(idx, [...blocks, { type: "text", content: "" }])}
                    className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-[var(--school-red)] hover:text-[var(--school-red)] transition-colors"
                  >
                    + Text / 添加文本
                  </button>
                  <button
                    type="button"
                    onClick={() => updateNewsBlocks(idx, [...blocks, { type: "image", url: "" }])}
                    className="text-xs px-3 py-1 border border-dashed border-gray-300 rounded hover:border-[var(--school-red)] hover:text-[var(--school-red)] transition-colors"
                  >
                    + Image / 添加图片
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </SectionCard>

        {/* ── Contact ─────────────────────────────────────── */}
        <SectionCard title="📍 Contact / Kontakt / 联系我们" onSave={() => handleSectionSave("contact")} saveStatus={sectionStatus["contact"]}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Section title" value={draft.contact.sectionTitle} onChange={(v) => updateContact("sectionTitle", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Address title" value={draft.contact.addressTitle} onChange={(v) => updateContact("addressTitle", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Email title" value={draft.contact.emailTitle} onChange={(v) => updateContact("emailTitle", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Email address" value={draft.contact.email} onChange={(v) => updateContact("email", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Phone title" value={draft.contact.phoneTitle} onChange={(v) => updateContact("phoneTitle", v)} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Phone number" value={draft.contact.phone} onChange={(v) => updateContact("phone", v)} maxWords={MAX_WORDS_DEFAULT} />
          </div>
          <div className="mt-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Address lines (one per line)</label>
            <textarea
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none min-h-[60px] ${countWords(draft.contact.addressLines.join("\n")) > MAX_WORDS_DEFAULT ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[var(--school-red)]"}`}
              value={draft.contact.addressLines.join("\n")}
              onChange={(e) => updateContact("addressLines", e.target.value.split("\n"))}
            />
            <p className={`text-xs mt-0.5 text-right ${countWords(draft.contact.addressLines.join("\n")) > MAX_WORDS_DEFAULT ? "text-red-600 font-semibold" : "text-gray-400"}`}>
              {countWords(draft.contact.addressLines.join("\n"))} / {MAX_WORDS_DEFAULT} words
            </p>
          </div>
        </SectionCard>

        {/* ── Footer labels ────────────────────────────────── */}
        <SectionCard title="🔻 Footer" onSave={() => handleSectionSave("footer")} saveStatus={sectionStatus["footer"]}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Navigation section title" value={draft.footer.navigationTitle} onChange={(v) => setDraft((d) => ({ ...d, footer: { ...d.footer, navigationTitle: v } }))} maxWords={MAX_WORDS_DEFAULT} />
            <Field label="Contact section title" value={draft.footer.contactTitle} onChange={(v) => setDraft((d) => ({ ...d, footer: { ...d.footer, contactTitle: v } }))} maxWords={MAX_WORDS_DEFAULT} />
          </div>
        </SectionCard>

        {/* ── Impressum ───────────────────────────────────── */}
        <SectionCard title="📋 Impressum / Legal Notice / 法律声明" onSave={() => handleSectionSave("impressum")} saveStatus={sectionStatus["impressum"]}>
          <Field label="Page title" value={draft.impressum.pageTitle} onChange={(v) => setDraft((d) => ({ ...d, impressum: { ...d.impressum, pageTitle: v } }))} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="Content" value={draft.impressum.content} onChange={(v) => setDraft((d) => ({ ...d, impressum: { ...d.impressum, content: v } }))} multiline expandable />
        </SectionCard>

        {/* ── Privacy / Datenschutz ───────────────────────── */}
        <SectionCard title="🔒 Datenschutz / Privacy / 隐私政策" onSave={() => handleSectionSave("privacy")} saveStatus={sectionStatus["privacy"]}>
          <Field label="Page title" value={draft.privacy.pageTitle} onChange={(v) => setDraft((d) => ({ ...d, privacy: { ...d.privacy, pageTitle: v } }))} maxWords={MAX_WORDS_DEFAULT} />
          <Field label="Content" value={draft.privacy.content} onChange={(v) => setDraft((d) => ({ ...d, privacy: { ...d.privacy, content: v } }))} multiline expandable />
        </SectionCard>

        {/* ── Change password ──────────────────────────────── */}
        <SectionCard title="🔐 修改密码 / Change Password / Passwort ändern">
          {!showChangePw ? (
            <button onClick={() => setShowChangePw(true)} className="text-sm text-[var(--school-red)] underline">
              修改密码 / Change password / Passwort ändern
            </button>
          ) : (
            <form onSubmit={handleChangePw} className="max-w-sm space-y-3">
              {pwChangeStep === "form" && (
                <>
                  <Field label="当前密码 / Current password / Aktuelles Passwort" value={oldPw} onChange={setOldPw} type="password" autoComplete="current-password" showPassword={showChangePwOld} onTogglePassword={() => setShowChangePwOld((v) => !v)} />
                  <Field label="新密码（至少6位）/ New password (min 6 chars) / Neues Passwort" value={newPw} onChange={setNewPw} type="password" autoComplete="new-password" showPassword={showChangePwNew} onTogglePassword={() => setShowChangePwNew((v) => !v)} />
                  <Field label="确认新密码 / Confirm new password / Neues Passwort bestätigen" value={newPwConfirm} onChange={setNewPwConfirm} type="password" autoComplete="new-password" showPassword={showChangePwConfirm} onTogglePassword={() => setShowChangePwConfirm((v) => !v)} />
                </>
              )}
              {pwChangeStep === "verify" && (
                <>
                  <p className="text-xs text-gray-500">
                    验证码已发送至 {pwChangeMaskedEmail} / Code sent to {pwChangeMaskedEmail} / Code gesendet an {pwChangeMaskedEmail}
                  </p>
                  <Field
                    label="验证码 / Verification code / Verifizierungscode"
                    value={pwChangeCode}
                    onChange={setPwChangeCode}
                  />
                </>
              )}
              {pwChangeMsg && (
                <p className={`text-xs whitespace-pre-line ${pwChangeMsgType === "success" ? "text-green-600" : pwChangeMsgType === "info" ? "text-blue-600" : "text-red-600"}`}>
                  {pwChangeMsg}
                </p>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={pwChangeLoading} className="px-4 py-2 bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] disabled:opacity-60 text-white text-sm font-semibold rounded transition-colors">
                  {pwChangeLoading ? "⏳" : pwChangeStep === "verify" ? "✓ 验证并保存 / Verify & Save / Verifizieren & Speichern" : "保存 / Save / Speichern"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowChangePw(false); setPwChangeMsg(""); setOldPw(""); setNewPw(""); setNewPwConfirm(""); setPwChangeStep("form"); setPwChangeCode(""); }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded transition-colors"
                >
                  取消 / Cancel / Abbrechen
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        {/* ── Admin management ─────────────────────────────── */}
        <SectionCard title="👥 管理员管理 / Administrators / Administratoren">
          {/* Current admin list */}
          <div className="mb-4" key={adminListKey}>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              当前管理员 / Current Admins / Aktuelle Admins
            </h4>
            <div className="space-y-2">
              {adminList.map((a) => (
                <div
                  key={a.username}
                  className="bg-gray-50 border border-gray-200 rounded px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--school-dark)]">
                          {a.username}
                        </span>
                        {a.username === auth.currentUser && (
                          <span className="text-xs bg-[var(--school-red)] text-white px-1.5 py-0.5 rounded">
                            当前 / you
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {a.email ? (
                          <span className="text-xs text-gray-400">✉ {a.email}</span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">No email / 无邮箱</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEmailUser(a.username);
                            setEditEmailValue(a.email ?? "");
                            setEmailUpdateMsg("");
                          }}
                          className="text-xs text-[var(--school-red)] hover:opacity-80 underline"
                        >
                          ✏ Edit
                        </button>
                      </div>
                    </div>
                    {a.username !== auth.currentUser && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAdminResetUser(adminResetUser === a.username ? null : a.username);
                            setAdminResetMsg("");
                          }}
                          disabled={adminResetLoading}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                        >
                          🔑 重置密码 / Reset PW
                        </button>
                        <button
                          onClick={() => handleRemoveAdmin(a.username)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                        >
                          ✕ 删除 / Remove
                        </button>
                      </div>
                    )}
                  </div>
                  {editingEmailUser === a.username && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="email"
                        value={editEmailValue}
                        onChange={(e) => setEditEmailValue(e.target.value)}
                        placeholder="email@example.com"
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[var(--school-red)]"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateEmail(a.username)}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingEmailUser(null); setEditEmailValue(""); setEmailUpdateMsg(""); }}
                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-semibold rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {adminResetUser === a.username && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded space-y-2">
                      <p className="text-xs text-gray-600">
                        DE: Verifizierungscode an die E-Mail von <strong>{a.username}</strong> senden, damit dieser Admin sein Passwort zurücksetzen kann.<br />
                        EN: Send a verification code to <strong>{a.username}</strong>&apos;s email so they can reset their password.<br />
                        ZH: 向 <strong>{a.username}</strong> 的邮箱发送验证码，以便其重置密码。
                      </p>
                      {adminResetMsg && (
                        <p className={`text-xs ${adminResetMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                          {adminResetMsg}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={adminResetLoading}
                          onClick={() => handleAdminResetPassword(a.username)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded transition-colors"
                        >
                          {adminResetLoading ? "⏳ …" : "发送验证码 / Send Code / Code senden"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAdminResetUser(null); setAdminResetMsg(""); }}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-semibold rounded transition-colors"
                        >
                          取消 / Cancel / Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {removeAdminMsg && (
              <p className={`mt-2 text-xs ${removeAdminMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{removeAdminMsg}</p>
            )}
            {emailUpdateMsg && (
              <p className={`mt-2 text-xs ${emailUpdateMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{emailUpdateMsg}</p>
            )}
          </div>

          {/* Add new admin */}
          {!showAddAdmin ? (
            <button
              onClick={() => setShowAddAdmin(true)}
              className="text-sm text-[var(--school-red)] underline"
            >
              + 添加管理员 / Add administrator / Administrator hinzufügen
            </button>
          ) : (
            <form onSubmit={handleAddAdmin} className="max-w-sm space-y-3 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-[var(--school-dark)]">
                添加新管理员 / Add New Administrator / Neuen Admin hinzufügen
              </h4>
              <Field
                label="用户名 / Username / Benutzername（至少4个字符 / min 4 chars）"
                value={newAdminUser}
                onChange={setNewAdminUser}
              />
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  密码 / Password / Passwort（至少6位 / min 6 chars）
                </label>
                <div className="relative">
                  <input
                    type={showNewAdminPw ? "text" : "password"}
                    autoComplete="new-password"
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--school-red)]"
                    value={newAdminPw}
                    onChange={(e) => setNewAdminPw(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewAdminPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    title={showNewAdminPw ? "隐藏密码 / Hide password" : "显示密码 / Show password"}
                  >
                    {showNewAdminPw ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <Field
                label="确认密码 / Confirm Password / Passwort bestätigen"
                value={newAdminPwConfirm}
                onChange={setNewAdminPwConfirm}
                type={showNewAdminPw ? "text" : "password"}
                autoComplete="new-password"
              />
              <Field
                label="邮箱（用于密码重置）/ Email (for password reset) / E-Mail (für Passwort-Reset)"
                value={newAdminEmail}
                onChange={setNewAdminEmail}
                type="email"
              />
              {addAdminMsg && (
                <p className={`text-xs ${addAdminSuccess ? "text-green-600" : "text-red-600"}`}>
                  {addAdminMsg}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white text-sm font-semibold rounded transition-colors"
                >
                  添加 / Add / Hinzufügen
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddAdmin(false); setAddAdminMsg(""); setNewAdminUser(""); setNewAdminPw(""); setNewAdminPwConfirm(""); setNewAdminEmail(""); }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded transition-colors"
                >
                  取消 / Cancel / Abbrechen
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        {/* Save button (bottom) */}
        <div className="sticky bottom-6 flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-lg shadow-lg transition-colors text-base"
          >
            {saving ? "⏳ Speichern…" : saved ? "✓ Gespeichert! / Saved! / 已保存！" : "💾 Speichern / Save / 保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
