"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useContent } from "@/contexts/ContentContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useLoginState } from "@/hooks/useLoginState";
import { useDevModeState } from "@/hooks/useDevModeState";
import { defaultTranslations } from "@/i18n/translations";
import type { Language, SiteContent, NewsBodyBlock, CourseItem } from "@/i18n/translations";
import type { AdminUser } from "@/types/auth";
import type {
  AdminPageContextValue,
  AdminPageProviderProps,
} from "@/types/admin-page";

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

  // Login, 2FA, and forgot-password state (extracted hook)
  const loginState = useLoginState(
    authCtx,
    searchParams.get("reset"),
    searchParams.get("username"),
  );

  // Dev-mode / recovery state (extracted hook)
  const devMode = useDevModeState();

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

  /* ─── Handlers (login/2FA/forgot/devMode extracted into hooks) ── */

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
      userInput: loginState.userInput, setUserInput: loginState.setUserInput,
      pwInput: loginState.pwInput, setPwInput: loginState.setPwInput,
      loginError: loginState.loginError,
      showLoginPw: loginState.showLoginPw, setShowLoginPw: loginState.setShowLoginPw,
      handleLogin: loginState.handleLogin,
    },
    twoFactor: {
      twoFactorStep: loginState.twoFactorStep, twoFactorCode: loginState.twoFactorCode, setTwoFactorCode: loginState.setTwoFactorCode,
      twoFactorMaskedEmail: loginState.twoFactorMaskedEmail, twoFactorLoading: loginState.twoFactorLoading,
      handleTwoFactorVerify: loginState.handleTwoFactorVerify,
      setTwoFactorStep: loginState.setTwoFactorStep, setLoginError: loginState.setLoginError,
    },
    forgotPw: {
      forgotPwStep: loginState.forgotPwStep, setForgotPwStep: loginState.setForgotPwStep,
      forgotPwUsername: loginState.forgotPwUsername, setForgotPwUsername: loginState.setForgotPwUsername,
      forgotPwEmail: loginState.forgotPwEmail, setForgotPwEmail: loginState.setForgotPwEmail,
      forgotPwCode: loginState.forgotPwCode, setForgotPwCode: loginState.setForgotPwCode,
      forgotPwNewPw: loginState.forgotPwNewPw, setForgotPwNewPw: loginState.setForgotPwNewPw,
      forgotPwNewPwConfirm: loginState.forgotPwNewPwConfirm, setForgotPwNewPwConfirm: loginState.setForgotPwNewPwConfirm,
      forgotPwError: loginState.forgotPwError, forgotPwSuccess: loginState.forgotPwSuccess, forgotPwLoading: loginState.forgotPwLoading,
      showForgotPwNew: loginState.showForgotPwNew, setShowForgotPwNew: loginState.setShowForgotPwNew,
      showForgotPwConfirm: loginState.showForgotPwConfirm, setShowForgotPwConfirm: loginState.setShowForgotPwConfirm,
      forgotPwCooldownSecs: loginState.forgotPwCooldownSecs, fmtCooldown: loginState.fmtCooldown,
      forgotPwAdminInitiated: loginState.forgotPwAdminInitiated, forgotPwRateLimited: loginState.forgotPwRateLimited,
      handleForgotPwRequest: loginState.handleForgotPwRequest, handleForgotPwVerify: loginState.handleForgotPwVerify,
      handleForgotPwReset: loginState.handleForgotPwReset, handleForgotPwResend: loginState.handleForgotPwResend,
    },
    devMode: {
      failedAttempts: loginState.failedAttempts, DEV_MODE_THRESHOLD: devMode.DEV_MODE_THRESHOLD,
      devModeOpen: devMode.devModeOpen, setDevModeOpen: devMode.setDevModeOpen,
      devModeUsername: devMode.devModeUsername, setDevModeUsername: devMode.setDevModeUsername,
      devModeNewPw: devMode.devModeNewPw, setDevModeNewPw: devMode.setDevModeNewPw,
      devModeNewPwConfirm: devMode.devModeNewPwConfirm, setDevModeNewPwConfirm: devMode.setDevModeNewPwConfirm,
      devModeError: devMode.devModeError, devModeSuccess: devMode.devModeSuccess,
      devModePersisted: devMode.devModePersisted, devModePersistError: devMode.devModePersistError, devModeLoading: devMode.devModeLoading,
      showDevModePw: devMode.showDevModePw, setShowDevModePw: devMode.setShowDevModePw,
      showDevModeConfirm: devMode.showDevModeConfirm, setShowDevModeConfirm: devMode.setShowDevModeConfirm,
      handleDevModeReset: devMode.handleDevModeReset,
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
