"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useContent } from "@/contexts/ContentContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { defaultTranslations } from "@/i18n/translations";
import type { Language, SiteContent, NewsBodyBlock, CourseItem } from "@/i18n/translations";
import type { AdminUser } from "@/types/auth";
import type {
  AdminPageContextValue,
  AdminPageProviderProps,
} from "@/types/admin-page";

const LOGIN_FAILURES_KEY = "yixin-login-failures";

/* ─── Context ───────────────────────────────────────────────── */

const AdminPageContext = createContext<AdminPageContextValue | null>(null);

export function useAdminPage(): AdminPageContextValue {
  const ctx = useContext(AdminPageContext);
  if (!ctx) throw new Error("useAdminPage must be used within AdminPageProvider");
  return ctx;
}

/* ─── Provider ──────────────────────────────────────────────── */

export function AdminPageProvider({ children }: AdminPageProviderProps) {
  const { setLanguage } = useLanguage();
  const { getContent, saveContent, resetContent } = useContent();
  const authCtx = useAuth();
  const searchParams = useSearchParams();

  // Auto-logout after 10 minutes
  const { remainingSeconds, totalSeconds, showWarning, extendSession } =
    useAutoLogout(authCtx.isAdmin, authCtx.logout);

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

  // Pre-fill username from last session
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

  // Reset confirmation dialog state
  const [showResetDialog, setShowResetDialog] = useState(false);

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

  // Admin-reset-password state
  const [adminResetUser, setAdminResetUser] = useState<string | null>(null);
  const [adminResetLoading, setAdminResetLoading] = useState(false);
  const [adminResetMsg, setAdminResetMsg] = useState("");

  // Developer mode state
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

  const fmtCooldown = (secs: number) =>
    `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

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
    const reset = searchParams.get("reset");
    const usernameParam = searchParams.get("username");
    if (reset === "1" && usernameParam && !authCtx.currentUser) {
      setForgotPwAdminInitiated(true);
      setForgotPwStep(2);
      setForgotPwUsername(usernameParam);
    }
  }, [searchParams, authCtx.currentUser]);

  // Admin list
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
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
    if (authCtx.isAdmin) {
      authCtx.getAdmins().then(setAdminList);
    }
  }, [authCtx, adminListKey]);

  /* ─── Handlers ──────────────────────────────────────────── */

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

  async function handleSave() {
    setSaving(true);
    await saveContent(editLang, draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    setShowResetDialog(true);
  }

  async function confirmReset() {
    setShowResetDialog(false);
    await resetContent(editLang);
    setDraft(defaultTranslations[editLang]);
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

  async function handleChangePw(e: FormEvent) {
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

    if (pwChangeStep === "form") {
      setPwChangeLoading(true);
      setPwChangeMsg("");
      try {
        const res = await fetch("/api/password-change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "request", username: authCtx.currentUser }),
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
          await doDirectPasswordChange();
        } else {
          setPwChangeMsg(data.error ?? "Fehler / Error / 错误");
          setPwChangeMsgType("error");
        }
      } catch {
        await doDirectPasswordChange();
      } finally {
        setPwChangeLoading(false);
      }
      return;
    }

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
            username: authCtx.currentUser,
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
    const result = await authCtx.changePassword(authCtx.currentUser!, oldPw, newPw);
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

  async function handleAddAdmin(e: FormEvent) {
    e.preventDefault();
    if (newAdminPw !== newAdminPwConfirm) {
      setAddAdminMsg(
        "密码不匹配 / Passwords do not match / Passwörter stimmen nicht überein"
      );
      setAddAdminSuccess(false);
      return;
    }
    const result = await authCtx.addAdmin(newAdminUser.trim(), newAdminPw, newAdminEmail.trim());
    if (result.success) {
      setAddAdminMsg(
        `✓ 管理员 "${newAdminUser.trim()}" 已添加！/ Administrator "${newAdminUser.trim()}" added / hinzugefügt！`
      );
      setAddAdminSuccess(true);

      try {
        await fetch("/api/notify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newUsername: newAdminUser.trim(),
            newEmail: newAdminEmail.trim() || undefined,
            addedBy: authCtx.currentUser ?? "unknown",
          }),
        });
      } catch {
        // Notification is best-effort
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
    const result = await authCtx.removeAdmin(username);
    if (result.success) {
      setRemoveAdminMsg(`✓ "${username}" 已删除 / removed / entfernt`);
      setAdminListKey((k) => k + 1);
      setTimeout(() => setRemoveAdminMsg(""), 3000);
    } else {
      setRemoveAdminMsg(result.error ?? "错误 / Fehler");
    }
  }

  async function handleUpdateEmail(username: string) {
    const result = await authCtx.updateEmail(username, editEmailValue);
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
      const admins = await authCtx.getAdmins();
      const targetAdmin = admins.find((a) => a.username === username);
      if (!targetAdmin?.email) {
        setAdminResetMsg("❌ This admin has no email configured. / Kein E-Mail konfiguriert. / 该管理员未配置邮箱。");
        setAdminResetLoading(false);
        return;
      }

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

  function setField(field: string, value: string) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  /* ── Forgot-password handlers ─────────────────────────── */

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

  /* ── Dev-mode handler ──────────────────────────────────── */

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

  /* ─── Assemble context value ────────────────────────────── */

  const value: AdminPageContextValue = {
    auth: {
      currentUser: authCtx.currentUser,
      isAdmin: authCtx.isAdmin,
      isRecoverySession: authCtx.isRecoverySession,
      logout: authCtx.logout,
    },
    session: { remainingSeconds, totalSeconds, showWarning, extendSession },
    login: {
      userInput, setUserInput,
      pwInput, setPwInput,
      loginError,
      showLoginPw, setShowLoginPw,
      handleLogin,
    },
    twoFactor: {
      twoFactorStep, twoFactorCode, setTwoFactorCode,
      twoFactorMaskedEmail, twoFactorLoading,
      handleTwoFactorVerify,
      setTwoFactorStep, setLoginError,
    },
    forgotPw: {
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
    },
    devMode: {
      failedAttempts, DEV_MODE_THRESHOLD,
      devModeOpen, setDevModeOpen,
      devModeUsername, setDevModeUsername,
      devModeNewPw, setDevModeNewPw,
      devModeNewPwConfirm, setDevModeNewPwConfirm,
      devModeError, devModeSuccess,
      devModePersisted, devModePersistError, devModeLoading,
      showDevModePw, setShowDevModePw,
      showDevModeConfirm, setShowDevModeConfirm,
      handleDevModeReset,
    },
    content: {
      draft, setDraft,
      editLang, setEditLang,
      setLanguage,
      handleSave, handleReset, handleSectionSave,
      saving, saved, sectionStatus,
      setField,
      updateAbout, updateHero, updateNav, updateContact,
      updateCourse, addCourse, removeCourse,
      updateNews, updateNewsBlocks, handleNewsImageUpload,
      addNews, removeNews,
      newsUploadingIdx, setNewsUploadingIdx,
      newsUploadError, setNewsUploadError,
      newsFileInputRef,
      newsExpandedBlock, setNewsExpandedBlock,
    },
    passwordChange: {
      showChangePw, setShowChangePw,
      oldPw, setOldPw,
      newPw, setNewPw,
      newPwConfirm, setNewPwConfirm,
      pwChangeMsg, setPwChangeMsg, pwChangeMsgType,
      showChangePwOld, setShowChangePwOld,
      showChangePwNew, setShowChangePwNew,
      showChangePwConfirm, setShowChangePwConfirm,
      pwChangeStep, setPwChangeStep,
      pwChangeCode, setPwChangeCode,
      pwChangeMaskedEmail, pwChangeLoading,
      handleChangePw,
    },
    adminManagement: {
      adminList, adminListKey,
      editingEmailUser, setEditingEmailUser,
      editEmailValue, setEditEmailValue,
      emailUpdateMsg, setEmailUpdateMsg,
      handleUpdateEmail,
      adminResetUser, setAdminResetUser,
      adminResetLoading, adminResetMsg, setAdminResetMsg,
      handleAdminResetPassword,
      handleRemoveAdmin, removeAdminMsg,
    },
    addAdmin: {
      showAddAdmin, setShowAddAdmin,
      newAdminUser, setNewAdminUser,
      newAdminPw, setNewAdminPw,
      newAdminPwConfirm, setNewAdminPwConfirm,
      newAdminEmail, setNewAdminEmail,
      showNewAdminPw, setShowNewAdminPw,
      addAdminMsg, addAdminSuccess,
      handleAddAdmin, setAddAdminMsg,
    },
    resetDialog: {
      showResetDialog, setShowResetDialog, confirmReset,
    },
  };

  return (
    <AdminPageContext.Provider value={value}>
      {children}
    </AdminPageContext.Provider>
  );
}
