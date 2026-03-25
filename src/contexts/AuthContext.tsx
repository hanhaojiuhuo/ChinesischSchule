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
  login: (username: string, password: string) => { success: boolean; remainingAttempts?: number; blocked?: boolean };
  logout: () => void;
  addAdmin: (username: string, password: string, email?: string) => { success: boolean; error?: string };
  changePassword: (
    username: string,
    oldPassword: string,
    newPassword: string
  ) => { success: boolean; error?: string };
  removeAdmin: (username: string) => { success: boolean; error?: string };
  getAdmins: () => AdminUser[];
}

const AuthContext = createContext<AuthContextValue>({
  isAdmin: false,
  currentUser: null,
  login: () => ({ success: false }),
  logout: () => {},
  addAdmin: () => ({ success: false }),
  changePassword: () => ({ success: false }),
  removeAdmin: () => ({ success: false }),
  getAdmins: () => [],
});

const ADMINS_KEY = "yixin-admins";
const SESSION_KEY = "yixin-admin-session";
const LOGIN_FAILURES_KEY = "yixin-login-failures";
const MAX_DAILY_ATTEMPTS = 3;

const DEFAULT_ADMINS: AdminUser[] = [
  { username: "admin_yixin", password: "yixin" },
];

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

function loadAdmins(): AdminUser[] {
  try {
    const stored = localStorage.getItem(ADMINS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AdminUser[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_ADMINS;
}

function persistAdmins(admins: AdminUser[]) {
  try {
    localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        const admins = loadAdmins();
        if (admins.some((a) => a.username === session)) {
          setIsAdmin(true);
          setCurrentUser(session);
        } else {
          // Session user no longer exists — clear stale session
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback((username: string, password: string): { success: boolean; remainingAttempts?: number; blocked?: boolean } => {
    const failures = loadLoginFailures();
    if (failures.count >= MAX_DAILY_ATTEMPTS) {
      return { success: false, blocked: true, remainingAttempts: 0 };
    }
    const admins = loadAdmins();
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
      return { success: true };
    }
    const updated = { count: failures.count + 1, date: getTodayString() };
    persistLoginFailures(updated);
    const remaining = MAX_DAILY_ATTEMPTS - updated.count;
    return { success: false, remainingAttempts: remaining };
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  const addAdmin = useCallback(
    (username: string, password: string, email?: string): { success: boolean; error?: string } => {
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
      const admins = loadAdmins();
      if (admins.some((a) => a.username === trimmed)) {
        return {
          success: false,
          error:
            "用户名已存在 / Username already exists / Benutzername bereits vorhanden",
        };
      }
      const trimmedEmail = email?.trim() || undefined;
      const updated = [...admins, { username: trimmed, password, email: trimmedEmail }];
      persistAdmins(updated);
      return { success: true };
    },
    []
  );

  const changePassword = useCallback(
    (
      username: string,
      oldPassword: string,
      newPassword: string
    ): { success: boolean; error?: string } => {
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          error:
            "至少6个字符 / New password must be ≥ 6 characters / Mind. 6 Zeichen",
        };
      }
      const admins = loadAdmins();
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
      persistAdmins(updated);
      return { success: true };
    },
    []
  );

  const removeAdmin = useCallback(
    (username: string): { success: boolean; error?: string } => {
      if (username === currentUser) {
        return {
          success: false,
          error:
            "无法删除自己 / Cannot remove yourself / Sich selbst nicht entfernen",
        };
      }
      const admins = loadAdmins();
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
      persistAdmins(filtered);
      return { success: true };
    },
    [currentUser]
  );

  const getAdmins = useCallback((): AdminUser[] => {
    return loadAdmins();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        currentUser,
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
