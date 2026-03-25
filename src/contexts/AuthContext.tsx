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
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    username: string,
    oldPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  removeAdmin: (
    username: string
  ) => Promise<{ success: boolean; error?: string }>;
  getAdmins: () => Promise<AdminUser[]>;
}

const AuthContext = createContext<AuthContextValue>({
  isAdmin: false,
  currentUser: null,
  authLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  addAdmin: async () => ({ success: false }),
  changePassword: async () => ({ success: false }),
  removeAdmin: async () => ({ success: false }),
  getAdmins: async () => [],
});

const SESSION_KEY = "yixin-admin-session";
const LOGIN_FAILURES_KEY = "yixin-login-failures";
const MAX_DAILY_ATTEMPTS = 3;

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

async function fetchAdmins(): Promise<AdminUser[]> {
  try {
    const res = await fetch("/api/admins");
    if (res.ok) {
      return (await res.json()) as AdminUser[];
    }
  } catch {
    // ignore
  }
  return [{ username: "admin_yixin", password: "yixin" }];
}

async function saveAdmins(admins: AdminUser[]): Promise<boolean> {
  try {
    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(admins),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
            // Session user no longer exists — clear stale session
            localStorage.removeItem(SESSION_KEY);
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
      const failures = loadLoginFailures();
      if (failures.count >= MAX_DAILY_ATTEMPTS) {
        return { success: false, blocked: true, remainingAttempts: 0 };
      }
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
        // Set server-side session cookie for API route authentication
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
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
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
    ): Promise<{ success: boolean; error?: string }> => {
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
      if (!ok) {
        return {
          success: false,
          error: "保存失败 / Failed to save / Speichern fehlgeschlagen",
        };
      }
      return { success: true };
    },
    []
  );

  const changePassword = useCallback(
    async (
      username: string,
      oldPassword: string,
      newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
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
      if (!ok) {
        return {
          success: false,
          error: "保存失败 / Failed to save / Speichern fehlgeschlagen",
        };
      }
      return { success: true };
    },
    []
  );

  const removeAdmin = useCallback(
    async (
      username: string
    ): Promise<{ success: boolean; error?: string }> => {
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
      if (!ok) {
        return {
          success: false,
          error: "保存失败 / Failed to save / Speichern fehlgeschlagen",
        };
      }
      return { success: true };
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
        login,
        logout,
        addAdmin,
        changePassword,
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
