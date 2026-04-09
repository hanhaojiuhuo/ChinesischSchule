"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useContent } from "@/contexts/ContentContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { defaultTranslations } from "@/i18n/translations";
import type { Language, SiteContent, NewsBodyBlock, CourseItem } from "@/i18n/translations";
import LoginScreen from "@/components/admin/LoginScreen";
import AdminDashboard from "@/components/admin/AdminDashboard";

const LOGIN_FAILURES_KEY = "yixin-login-failures";

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
  // Two-factor authentication state
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorMaskedEmail, setTwoFactorMaskedEmail] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

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
  const [forgotPwResendCount, setForgotPwResendCount] = useState(0); // eslint-disable-line @typescript-eslint/no-unused-vars
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
    if (result.twoFactorRequired) {
      // Credentials valid — 2FA code sent to email
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

  async function handleTwoFactorVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    if (!twoFactorCode.trim()) {
      setLoginError("请输入验证码 / Please enter the code / Bitte Code eingeben");
      return;
    }
    setTwoFactorLoading(true);
    const result = await auth.verifyLoginCode(userInput.trim(), twoFactorCode.trim());
    setTwoFactorLoading(false);
    if (!result.success) {
      setLoginError(result.error ?? "验证码无效 / Invalid code / Ungültiger Code");
    }
    // If successful, auth.isAdmin will become true and the UI will switch
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
  function updateAbout(key: string, val: string) {
    setDraft((d) => ({ ...d, about: { ...d.about, [key]: val } }));
  }

  function updateHero(key: string, val: string) {
    setDraft((d) => ({ ...d, hero: { ...d.hero, [key]: val } }));
  }

  function updateNav(key: string, val: string) {
    setDraft((d) => ({ ...d, nav: { ...d.nav, [key]: val } }));
  }

  function updateContact(key: string, val: string | string[]) {
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

  function updateNews(idx: number, key: string, val: string) {
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

  /* ── Extracted forgot-password handlers ─────────────────── */

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

  /* ── Extracted dev-mode handler ──────────────────────────── */

  async function handleDevModeReset() {
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
  }

  /* ── Render ──────────────────────────────────────────────── */


  if (!auth.isAdmin) {
    return (
      <LoginScreen
        userInput={userInput}
        setUserInput={setUserInput}
        pwInput={pwInput}
        setPwInput={setPwInput}
        loginError={loginError}
        showLoginPw={showLoginPw}
        setShowLoginPw={setShowLoginPw}
        handleLogin={handleLogin}
        twoFactorStep={twoFactorStep}
        twoFactorCode={twoFactorCode}
        setTwoFactorCode={setTwoFactorCode}
        twoFactorMaskedEmail={twoFactorMaskedEmail}
        twoFactorLoading={twoFactorLoading}
        handleTwoFactorVerify={handleTwoFactorVerify}
        setTwoFactorStep={setTwoFactorStep}
        setLoginError={setLoginError}
        forgotPwStep={forgotPwStep}
        setForgotPwStep={setForgotPwStep}
        forgotPwUsername={forgotPwUsername}
        setForgotPwUsername={setForgotPwUsername}
        forgotPwEmail={forgotPwEmail}
        setForgotPwEmail={setForgotPwEmail}
        forgotPwCode={forgotPwCode}
        setForgotPwCode={setForgotPwCode}
        forgotPwNewPw={forgotPwNewPw}
        setForgotPwNewPw={setForgotPwNewPw}
        forgotPwNewPwConfirm={forgotPwNewPwConfirm}
        setForgotPwNewPwConfirm={setForgotPwNewPwConfirm}
        forgotPwError={forgotPwError}
        forgotPwSuccess={forgotPwSuccess}
        forgotPwLoading={forgotPwLoading}
        showForgotPwNew={showForgotPwNew}
        setShowForgotPwNew={setShowForgotPwNew}
        showForgotPwConfirm={showForgotPwConfirm}
        setShowForgotPwConfirm={setShowForgotPwConfirm}
        forgotPwCooldownSecs={forgotPwCooldownSecs}
        fmtCooldown={fmtCooldown}
        forgotPwAdminInitiated={forgotPwAdminInitiated}
        forgotPwRateLimited={forgotPwRateLimited}
        handleForgotPwRequest={handleForgotPwRequest}
        handleForgotPwVerify={handleForgotPwVerify}
        handleForgotPwReset={handleForgotPwReset}
        handleForgotPwResend={handleForgotPwResend}
        failedAttempts={failedAttempts}
        DEV_MODE_THRESHOLD={DEV_MODE_THRESHOLD}
        devModeOpen={devModeOpen}
        setDevModeOpen={setDevModeOpen}
        devModeUsername={devModeUsername}
        setDevModeUsername={setDevModeUsername}
        devModeNewPw={devModeNewPw}
        setDevModeNewPw={setDevModeNewPw}
        devModeNewPwConfirm={devModeNewPwConfirm}
        setDevModeNewPwConfirm={setDevModeNewPwConfirm}
        devModeError={devModeError}
        devModeSuccess={devModeSuccess}
        devModePersisted={devModePersisted}
        devModePersistError={devModePersistError}
        devModeLoading={devModeLoading}
        showDevModePw={showDevModePw}
        setShowDevModePw={setShowDevModePw}
        showDevModeConfirm={showDevModeConfirm}
        setShowDevModeConfirm={setShowDevModeConfirm}
        handleDevModeReset={handleDevModeReset}
      />
    );
  }

  /* ── Admin panel ─────────────────────────────────────────── */
  return (
    <AdminDashboard
      currentUser={auth.currentUser}
      isRecoverySession={auth.isRecoverySession}
      logout={auth.logout}
      remainingSeconds={remainingSeconds}
      totalSeconds={totalSeconds}
      showWarning={showWarning}
      extendSession={extendSession}
      editLang={editLang}
      setEditLang={setEditLang}
      setLanguage={setLanguage}
      draft={draft}
      setDraft={setDraft}
      handleSave={handleSave}
      handleReset={handleReset}
      handleSectionSave={handleSectionSave}
      saving={saving}
      saved={saved}
      sectionStatus={sectionStatus}
      setField={(field, value) => setDraft((d) => ({ ...d, [field]: value }))}
      updateAbout={updateAbout}
      updateHero={updateHero}
      updateNav={updateNav}
      updateContact={updateContact}
      updateCourse={updateCourse}
      addCourse={addCourse}
      removeCourse={removeCourse}
      updateNews={updateNews}
      updateNewsBlocks={updateNewsBlocks}
      handleNewsImageUpload={handleNewsImageUpload}
      addNews={addNews}
      removeNews={removeNews}
      newsUploadingIdx={newsUploadingIdx}
      setNewsUploadingIdx={setNewsUploadingIdx}
      newsUploadError={newsUploadError}
      setNewsUploadError={setNewsUploadError}
      newsFileInputRef={newsFileInputRef}
      newsExpandedBlock={newsExpandedBlock}
      setNewsExpandedBlock={setNewsExpandedBlock}
      showChangePw={showChangePw}
      setShowChangePw={setShowChangePw}
      oldPw={oldPw}
      setOldPw={setOldPw}
      newPw={newPw}
      setNewPw={setNewPw}
      newPwConfirm={newPwConfirm}
      setNewPwConfirm={setNewPwConfirm}
      pwChangeMsg={pwChangeMsg}
      setPwChangeMsg={setPwChangeMsg}
      pwChangeMsgType={pwChangeMsgType}
      showChangePwOld={showChangePwOld}
      setShowChangePwOld={setShowChangePwOld}
      showChangePwNew={showChangePwNew}
      setShowChangePwNew={setShowChangePwNew}
      showChangePwConfirm={showChangePwConfirm}
      setShowChangePwConfirm={setShowChangePwConfirm}
      pwChangeStep={pwChangeStep}
      setPwChangeStep={setPwChangeStep}
      pwChangeCode={pwChangeCode}
      setPwChangeCode={setPwChangeCode}
      pwChangeMaskedEmail={pwChangeMaskedEmail}
      pwChangeLoading={pwChangeLoading}
      handleChangePw={handleChangePw}
      adminList={adminList}
      adminListKey={adminListKey}
      editingEmailUser={editingEmailUser}
      setEditingEmailUser={setEditingEmailUser}
      editEmailValue={editEmailValue}
      setEditEmailValue={setEditEmailValue}
      emailUpdateMsg={emailUpdateMsg}
      setEmailUpdateMsg={setEmailUpdateMsg}
      handleUpdateEmail={handleUpdateEmail}
      adminResetUser={adminResetUser}
      setAdminResetUser={setAdminResetUser}
      adminResetLoading={adminResetLoading}
      adminResetMsg={adminResetMsg}
      setAdminResetMsg={setAdminResetMsg}
      handleAdminResetPassword={handleAdminResetPassword}
      handleRemoveAdmin={handleRemoveAdmin}
      removeAdminMsg={removeAdminMsg}
      showAddAdmin={showAddAdmin}
      setShowAddAdmin={setShowAddAdmin}
      newAdminUser={newAdminUser}
      setNewAdminUser={setNewAdminUser}
      newAdminPw={newAdminPw}
      setNewAdminPw={setNewAdminPw}
      newAdminPwConfirm={newAdminPwConfirm}
      setNewAdminPwConfirm={setNewAdminPwConfirm}
      newAdminEmail={newAdminEmail}
      setNewAdminEmail={setNewAdminEmail}
      showNewAdminPw={showNewAdminPw}
      setShowNewAdminPw={setShowNewAdminPw}
      addAdminMsg={addAdminMsg}
      addAdminSuccess={addAdminSuccess}
      handleAddAdmin={handleAddAdmin}
      setAddAdminMsg={setAddAdminMsg}
    />
  );
}
