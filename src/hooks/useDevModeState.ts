"use client";

import { useState } from "react";

const LOGIN_FAILURES_KEY = "yixin-login-failures";

/**
 * State and handlers for recovery / dev-mode login flow.
 * Extracted from AdminPageContext to reduce file size.
 */
export function useDevModeState() {
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
          localStorage.setItem("yixin-admin-session", "1");
          sessionStorage.setItem("yixin-session-user", uname);
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

  return {
    DEV_MODE_THRESHOLD,
    devModeOpen, setDevModeOpen,
    devModeUsername, setDevModeUsername,
    devModeNewPw, setDevModeNewPw,
    devModeNewPwConfirm, setDevModeNewPwConfirm,
    devModeError, devModeSuccess,
    devModePersisted, devModePersistError, devModeLoading,
    showDevModePw, setShowDevModePw,
    showDevModeConfirm, setShowDevModeConfirm,
    handleDevModeReset,
  };
}
