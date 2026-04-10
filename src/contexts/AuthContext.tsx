"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type {
  AdminUser,
  AuthContextValue,
  AuthProviderProps,
  LoginFailures,
  LoginResult,
  SaveResult,
} from "@/types/auth";

const AuthContext = createContext<AuthContextValue>({
  isAdmin: false,
  currentUser: null,
  authLoading: true,
  isRecoverySession: false,
  login: async () => ({ success: false }),
  verifyLoginCode: async () => ({ success: false }),
  logout: async () => {},
  addAdmin: async () => ({ success: false }),
  changePassword: async () => ({ success: false }),
  updateEmail: async () => ({ success: false }),
  removeAdmin: async () => ({ success: false }),
  getAdmins: async () => [],
});

const SESSION_KEY = "yixin-admin-session";
const SESSION_USER_KEY = "yixin-session-user";
const RECOVERY_SESSION_KEY = "yixin-recovery-session";
const LOGIN_FAILURES_KEY = "yixin-login-failures";
const LOCAL_ADMINS_KEY = "yixin-admins";
const MAX_DAILY_ATTEMPTS = 10;

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadLoginFailures(): LoginFailures {
  try {
    const stored = localStorage.getItem(LOGIN_FAILURES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as LoginFailures;
      if (parsed.date === getTodayString()) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return { count: 0, date: getTodayString() };
}

function persistLoginFailures(failures: LoginFailures) {
  try {
    localStorage.setItem(LOGIN_FAILURES_KEY, JSON.stringify(failures));
  } catch {
    // ignore
  }
}

function resetLoginFailures() {
  try {
    localStorage.removeItem(LOGIN_FAILURES_KEY);
  } catch {
    // ignore
  }
}

function loadLocalAdmins(): AdminUser[] | null {
  try {
    const stored = localStorage.getItem(LOCAL_ADMINS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        // New format: array of username strings
        if (typeof parsed[0] === "string") {
          return (parsed as string[]).map((u) => ({
            username: u,
            password: "********",
          }));
        }
        // Legacy format: array of AdminUser objects (migrate on next fetch)
        return parsed as AdminUser[];
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function fetchAdmins(): Promise<AdminUser[]> {
  try {
    const res = await fetch("/api/admins");
    if (res.ok) {
      const apiAdmins = (await res.json()) as AdminUser[];
      if (Array.isArray(apiAdmins) && apiAdmins.length > 0) {
        // Server is the source of truth.
        // Cache only usernames (no passwords/hashes/emails) for offline display.
        try {
          const usernamesOnly = apiAdmins.map((a) => a.username);
          localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(usernamesOnly));
        } catch {
          // ignore
        }
        return apiAdmins;
      }
    }
  } catch {
    // API unreachable — fall back to local cache
  }
  // Fallback: local cache → empty list (no hardcoded credentials)
  return loadLocalAdmins() ?? [];
}

async function saveAdmins(admins: AdminUser[]): Promise<SaveResult> {
  // Persist to the server (Vercel Edge Config) — this is the source of truth.
  // Never cache full admin objects (passwords/hashes/emails) in localStorage.
  try {
    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(admins),
    });
    if (!res.ok) {
      console.warn(
        `[AuthContext] Failed to save admin list to server (API returned ${res.status}).`
      );
      return { ok: false };
    }
    const data = await res.json().catch(() => ({}));
    // Update username-only cache after successful save
    try {
      const usernamesOnly = admins.map((a) => a.username);
      localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(usernamesOnly));
    } catch {
      // ignore
    }
    return {
      ok: true,
      persistError: data.persistError ?? undefined,
    };
  } catch {
    console.warn(
      "[AuthContext] Failed to save admin list to server (API unreachable)."
    );
    return { ok: false };
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        // Check if the server-side signed session cookie is still valid.
        // This replaces the old approach of re-issuing cookies via POST.
        const res = await fetch("/api/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.username) {
            setIsAdmin(true);
            setCurrentUser(data.username);
            try {
              localStorage.setItem(SESSION_KEY, "1");
            } catch { /* ignore */ }
            try {
              sessionStorage.setItem(SESSION_USER_KEY, data.username);
            } catch { /* ignore */ }
            // Check if this was a recovery session
            const wasRecovery = localStorage.getItem(RECOVERY_SESSION_KEY) === "1";
            if (wasRecovery) {
              setIsRecoverySession(true);
            }
          } else {
            // Cookie invalid or expired — clean up
            try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
            try { localStorage.removeItem(RECOVERY_SESSION_KEY); } catch { /* ignore */ }
            try { sessionStorage.removeItem(SESSION_USER_KEY); } catch { /* ignore */ }
          }
        } else {
          // No valid session — clean up
          try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
          try { localStorage.removeItem(RECOVERY_SESSION_KEY); } catch { /* ignore */ }
          try { sessionStorage.removeItem(SESSION_USER_KEY); } catch { /* ignore */ }
        }
      } catch {
        // ignore
      } finally {
        setAuthLoading(false);
      }
    }
    restoreSession();
  }, []);

  // Cross-tab logout: when another tab removes the session key from
  // localStorage, log out in this tab as well.
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === SESSION_KEY && e.newValue === null) {
        // Another tab removed the session — log out locally.
        setIsAdmin(false);
        setCurrentUser(null);
        setIsRecoverySession(false);
        // Clear the session data in this tab.
        try { sessionStorage.removeItem(SESSION_USER_KEY); } catch { /* ignore */ }
        try {
          sessionStorage.removeItem("yixin-session-deadline");
        } catch { /* ignore */ }
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string
    ): Promise<LoginResult> => {
      // Quick client-side check (supplementary to server-side rate limiting)
      const failures = loadLoginFailures();
      if (failures.count >= MAX_DAILY_ATTEMPTS) {
        return { success: false, blocked: true, remainingAttempts: 0 };
      }

      // Use the 2FA-aware login endpoint
      try {
        const res = await fetch("/api/login-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "request", username, password }),
        });
        const data = await res.json().catch(() => ({}));

        // Handle HTTP errors that don't carry rate-limit data
        if (!res.ok && !("remainingAttempts" in data)) {
          return { success: false, remainingAttempts: MAX_DAILY_ATTEMPTS - failures.count };
        }

        if (data.success && data.twoFactorRequired) {
          // Credentials valid but 2FA code needed
          resetLoginFailures();
          return {
            success: false,
            twoFactorRequired: true,
            maskedEmail: data.maskedEmail,
          };
        }

        if (data.success && !data.twoFactorRequired) {
          // Login completed (no 2FA needed — no email configured)
          resetLoginFailures();
          setIsAdmin(true);
          setCurrentUser(username);
          try {
            localStorage.setItem(SESSION_KEY, "1");
          } catch {
            // ignore
          }
          try {
            sessionStorage.setItem(SESSION_USER_KEY, username);
          } catch {
            // ignore
          }
          return { success: true };
        }

        // Server reports blocked or remaining attempts
        if (data.blocked) {
          const updated = { count: MAX_DAILY_ATTEMPTS, date: getTodayString() };
          persistLoginFailures(updated);
          return { success: false, blocked: true, remainingAttempts: 0 };
        }

        const serverRemaining: number = data.remainingAttempts ?? 0;
        const updated = {
          count: failures.count + 1,
          date: getTodayString(),
        };
        persistLoginFailures(updated);
        const clientRemaining = MAX_DAILY_ATTEMPTS - updated.count;
        const remaining = Math.min(serverRemaining, clientRemaining);

        return { success: false, remainingAttempts: remaining };
      } catch {
        // API unreachable – fall back to legacy /api/login
        console.warn("[AuthContext] /api/login-2fa unreachable, falling back to /api/login.");
      }

      // Fallback: use legacy /api/login endpoint (no 2FA)
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json().catch(() => ({}));

        if (data.success) {
          resetLoginFailures();
          setIsAdmin(true);
          setCurrentUser(username);
          try {
            localStorage.setItem(SESSION_KEY, "1");
          } catch {
            // ignore
          }
          try {
            sessionStorage.setItem(SESSION_USER_KEY, username);
          } catch {
            // ignore
          }
          return { success: true };
        }

        if (data.blocked) {
          const updated = { count: MAX_DAILY_ATTEMPTS, date: getTodayString() };
          persistLoginFailures(updated);
          return { success: false, blocked: true, remainingAttempts: 0 };
        }

        const serverRemaining: number = data.remainingAttempts ?? 0;
        const updated = { count: failures.count + 1, date: getTodayString() };
        persistLoginFailures(updated);
        return { success: false, remainingAttempts: Math.min(serverRemaining, MAX_DAILY_ATTEMPTS - updated.count) };
      } catch {
        // Both endpoints unreachable
      }

      const updated = { count: failures.count + 1, date: getTodayString() };
      persistLoginFailures(updated);
      const remaining = MAX_DAILY_ATTEMPTS - updated.count;
      return { success: false, remainingAttempts: remaining };
    },
    []
  );

  const verifyLoginCode = useCallback(
    async (
      username: string,
      code: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/login-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", username, code }),
        });
        const data = await res.json().catch(() => ({}));

        if (data.success) {
          setIsAdmin(true);
          setCurrentUser(username);
          try {
            localStorage.setItem(SESSION_KEY, "1");
          } catch {
            // ignore
          }
          try {
            sessionStorage.setItem(SESSION_USER_KEY, username);
          } catch {
            // ignore
          }
          return { success: true };
        }

        return {
          success: false,
          error: data.error ?? "验证码无效 / Invalid code / Ungültiger Code",
        };
      } catch {
        return { success: false, error: "网络错误 / Network error / Netzwerkfehler" };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsAdmin(false);
    setCurrentUser(null);
    setIsRecoverySession(false);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    try { localStorage.removeItem(RECOVERY_SESSION_KEY); } catch { /* ignore */ }
    try { sessionStorage.removeItem(SESSION_USER_KEY); } catch { /* ignore */ }
    // Clear server-side session cookie
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch {
      // ignore
    }
  }, []);

  const addAdmin = useCallback(
    async (
      username: string,
      password: string,
      email?: string
    ): Promise<{ success: boolean; error?: string; warning?: string }> => {
      const trimmed = username.trim();
      if (!trimmed || trimmed.length < 4) {
        return {
          success: false,
          error:
            "用户名至少4个字符 / Username must be ≥ 4 characters / Benutzername mind. 4 Zeichen",
        };
      }
      if (!password || password.length < 6) {
        return {
          success: false,
          error:
            "密码至少6个字符 / Password must be ≥ 6 characters / Passwort mind. 6 Zeichen",
        };
      }
      const admins = await fetchAdmins();
      if (admins.some((a) => a.username === trimmed)) {
        return {
          success: false,
          error:
            "用户名已存在 / Username already exists / Benutzername bereits vorhanden",
        };
      }
      const trimmedEmail = email?.trim() || undefined;
      const updated = [
        ...admins,
        { username: trimmed, password, email: trimmedEmail },
      ];
      const ok = await saveAdmins(updated);
      if (!ok.ok) {
        return {
          success: false,
          error: "保存失败 / Failed to save / Speichern fehlgeschlagen",
        };
      }
      return { success: true, warning: ok.persistError };
    },
    []
  );

  const changePassword = useCallback(
    async (
      username: string,
      oldPassword: string,
      newPassword: string
    ): Promise<{ success: boolean; error?: string; warning?: string }> => {
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          error:
            "至少6个字符 / New password must be ≥ 6 characters / Mind. 6 Zeichen",
        };
      }
      // Verify old password via the server login endpoint (supports bcrypt)
      try {
        const verifyRes = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password: oldPassword }),
        });
        const verifyData = await verifyRes.json().catch(() => ({}));
        if (!verifyData.success) {
          return {
            success: false,
            error:
              "当前密码不正确 / Current password incorrect / Aktuelles Passwort falsch",
          };
        }
      } catch {
        return {
          success: false,
          error: "网络错误 / Network error / Netzwerkfehler",
        };
      }
      // Old password verified — update with new password
      // The /api/admins POST auto-hashes plaintext passwords
      const admins = await fetchAdmins();
      const idx = admins.findIndex((a) => a.username === username);
      if (idx === -1) {
        return {
          success: false,
          error: "用户不存在 / User not found / Benutzer nicht gefunden",
        };
      }
      const updated = admins.map((a, i) =>
        i === idx ? { ...a, password: newPassword } : a
      );
      const ok = await saveAdmins(updated);
      if (!ok.ok) {
        return {
          success: false,
          error: "保存失败 / Failed to save / Speichern fehlgeschlagen",
        };
      }
      return { success: true, warning: ok.persistError };
    },
    []
  );

  const updateEmail = useCallback(
    async (
      username: string,
      newEmail: string
    ): Promise<{ success: boolean; error?: string; warning?: string }> => {
      const admins = await fetchAdmins();
      const idx = admins.findIndex((a) => a.username === username);
      if (idx === -1) {
        return {
          success: false,
          error: "用户不存在 / User not found / Benutzer nicht gefunden",
        };
      }
      const trimmedEmail = newEmail.trim() || undefined;
      const updated = admins.map((a, i) =>
        i === idx ? { ...a, email: trimmedEmail } : a
      );
      const ok = await saveAdmins(updated);
      if (!ok.ok) {
        return {
          success: false,
          error: "保存失败 / Failed to save / Speichern fehlgeschlagen",
        };
      }
      return { success: true, warning: ok.persistError };
    },
    []
  );

  const removeAdmin = useCallback(
    async (
      username: string
    ): Promise<{ success: boolean; error?: string; warning?: string }> => {
      if (username === currentUser) {
        return {
          success: false,
          error:
            "无法删除自己 / Cannot remove yourself / Sich selbst nicht entfernen",
        };
      }
      const admins = await fetchAdmins();
      const filtered = admins.filter((a) => a.username !== username);
      if (filtered.length === admins.length) {
        return { success: false, error: "用户不存在 / User not found" };
      }
      if (filtered.length === 0) {
        return {
          success: false,
          error:
            "无法删除最后一个管理员 / Cannot remove the last administrator / Letzten Admin nicht entfernen",
        };
      }
      const ok = await saveAdmins(filtered);
      if (!ok.ok) {
        return {
          success: false,
          error: "保存失败 / Failed to save / Speichern fehlgeschlagen",
        };
      }
      return { success: true, warning: ok.persistError };
    },
    [currentUser]
  );

  const getAdmins = useCallback(async (): Promise<AdminUser[]> => {
    return fetchAdmins();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        currentUser,
        authLoading,
        isRecoverySession,
        login,
        verifyLoginCode,
        logout,
        addAdmin,
        changePassword,
        updateEmail,
        removeAdmin,
        getAdmins,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
