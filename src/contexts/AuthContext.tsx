"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export interface AdminUser {
  username: string;
  password: string;
  email?: string;
}

interface AuthContextValue {
  isAdmin: boolean;
  currentUser: string | null;
  authLoading: boolean;
  /** True when the current session was established via recovery mode. */
  isRecoverySession: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{
    success: boolean;
    remainingAttempts?: number;
    blocked?: boolean;
  }>;
  logout: () => Promise<void>;
  addAdmin: (
    username: string,
    password: string,
    email?: string
  ) => Promise<{ success: boolean; error?: string; warning?: string }>;
  changePassword: (
    username: string,
    oldPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string; warning?: string }>;
  updateEmail: (
    username: string,
    newEmail: string
  ) => Promise<{ success: boolean; error?: string; warning?: string }>;
  removeAdmin: (
    username: string
  ) => Promise<{ success: boolean; error?: string; warning?: string }>;
  getAdmins: () => Promise<AdminUser[]>;
}

const AuthContext = createContext<AuthContextValue>({
  isAdmin: false,
  currentUser: null,
  authLoading: true,
  isRecoverySession: false,
  login: async () => ({ success: false }),
  logout: async () => {},
  addAdmin: async () => ({ success: false }),
  changePassword: async () => ({ success: false }),
  updateEmail: async () => ({ success: false }),
  removeAdmin: async () => ({ success: false }),
  getAdmins: async () => [],
});

const SESSION_KEY = "yixin-admin-session";
const RECOVERY_SESSION_KEY = "yixin-recovery-session";
const LOGIN_FAILURES_KEY = "yixin-login-failures";
const LOCAL_ADMINS_KEY = "yixin-admins";
const MAX_DAILY_ATTEMPTS = 10;

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

interface LoginFailures {
  count: number;
  date: string;
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
      const parsed = JSON.parse(stored) as AdminUser[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
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
        // Server (Vercel Edge Config) is the source of truth.
        // Update localStorage as an offline cache.
        try {
          localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(apiAdmins));
        } catch {
          // ignore
        }
        return apiAdmins;
      }
    }
  } catch {
    // API unreachable — fall back to local cache
  }
  // Fallback: local cache → hardcoded default
  return loadLocalAdmins() ?? [{ username: "admin", password: "yixin" }];
}

interface SaveResult {
  ok: boolean;
  persistError?: string;
}

async function saveAdmins(admins: AdminUser[]): Promise<SaveResult> {
  // Always update localStorage as an offline cache.
  try {
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(admins));
  } catch {
    console.warn("[AuthContext] Failed to update localStorage cache.");
  }

  // Persist to the server (Vercel Edge Config) — this is the source of truth.
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
          const admins = await fetchAdmins();
          if (admins.some((a) => a.username === session)) {
            setIsAdmin(true);
            setCurrentUser(session);
            // Re-issue server-side session cookie (in case it expired)
            try {
              await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: session }),
              });
            } catch {
              // ignore
            }
          } else {
            // Check if this was a recovery session — re-verify with the recovery endpoint
            const wasRecovery = localStorage.getItem(RECOVERY_SESSION_KEY) === "1";
            if (wasRecovery) {
              try {
                const recovRes = await fetch("/api/recovery", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username: session }),
                });
                if (recovRes.ok) {
                  setIsAdmin(true);
                  setCurrentUser(session);
                  setIsRecoverySession(true);
                } else {
                  localStorage.removeItem(SESSION_KEY);
                  localStorage.removeItem(RECOVERY_SESSION_KEY);
                }
              } catch {
                localStorage.removeItem(SESSION_KEY);
                localStorage.removeItem(RECOVERY_SESSION_KEY);
              }
            } else {
              localStorage.removeItem(SESSION_KEY);
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setAuthLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string
    ): Promise<{
      success: boolean;
      remainingAttempts?: number;
      blocked?: boolean;
    }> => {
      // Quick client-side check (supplementary to server-side rate limiting)
      const failures = loadLoginFailures();
      if (failures.count >= MAX_DAILY_ATTEMPTS) {
        return { success: false, blocked: true, remainingAttempts: 0 };
      }

      // Server-side credential verification + rate limiting
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json().catch(() => ({}));

        // Handle HTTP errors (e.g. 400 Bad Request for missing credentials)
        // that don't carry rate-limit data – don't count them as failed attempts
        if (!res.ok && !("remainingAttempts" in data) && !data.success) {
          return { success: false, remainingAttempts: MAX_DAILY_ATTEMPTS - failures.count };
        }

        if (data.success) {
          resetLoginFailures();
          setIsAdmin(true);
          setCurrentUser(username);
          try {
            localStorage.setItem(SESSION_KEY, username);
          } catch {
            // ignore
          }
          // Session cookie is already set by the /api/login response
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
        // API unreachable – fall back to local credential check
        console.warn("[AuthContext] /api/login unreachable, falling back to local verification.");
      }

      // Offline fallback: verify credentials locally
      const admins = await fetchAdmins();
      const found = admins.find(
        (a) => a.username === username && a.password === password
      );
      if (found) {
        resetLoginFailures();
        setIsAdmin(true);
        setCurrentUser(username);
        try {
          localStorage.setItem(SESSION_KEY, username);
        } catch {
          // ignore
        }
        try {
          await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });
        } catch {
          // ignore — server session is best-effort
        }
        return { success: true };
      }

      // Normal login failed — try recovery mode (only active when
      // RECOVERY_MODE=true is set in the deployment environment).
      try {
        const recovRes = await fetch("/api/recovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        if (recovRes.ok) {
          resetLoginFailures();
          setIsAdmin(true);
          setCurrentUser(username);
          setIsRecoverySession(true);
          try {
            localStorage.setItem(SESSION_KEY, username);
            localStorage.setItem(RECOVERY_SESSION_KEY, "1");
          } catch {
            // ignore
          }
          return { success: true };
        }
      } catch {
        // Recovery endpoint unreachable — fall through to failure
      }

      const updated = { count: failures.count + 1, date: getTodayString() };
      persistLoginFailures(updated);
      const remaining = MAX_DAILY_ATTEMPTS - updated.count;
      return { success: false, remainingAttempts: remaining };
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
      const admins = await fetchAdmins();
      const idx = admins.findIndex(
        (a) => a.username === username && a.password === oldPassword
      );
      if (idx === -1) {
        return {
          success: false,
          error:
            "当前密码不正确 / Current password incorrect / Aktuelles Passwort falsch",
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
