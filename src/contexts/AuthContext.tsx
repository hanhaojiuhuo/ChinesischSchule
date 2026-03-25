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
}

interface AuthContextValue {
  isAdmin: boolean;
  currentUser: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addAdmin: (username: string, password: string) => { success: boolean; error?: string };
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
  login: () => false,
  logout: () => {},
  addAdmin: () => ({ success: false }),
  changePassword: () => ({ success: false }),
  removeAdmin: () => ({ success: false }),
  getAdmins: () => [],
});

const ADMINS_KEY = "yixin-admins";
const SESSION_KEY = "yixin-admin-session";

const DEFAULT_ADMINS: AdminUser[] = [
  { username: "admin_yixin", password: "yixin" },
];

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

  const login = useCallback((username: string, password: string): boolean => {
    const admins = loadAdmins();
    const found = admins.find(
      (a) => a.username === username && a.password === password
    );
    if (found) {
      setIsAdmin(true);
      setCurrentUser(username);
      try {
        localStorage.setItem(SESSION_KEY, username);
      } catch {
        // ignore
      }
      return true;
    }
    return false;
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
    (username: string, password: string): { success: boolean; error?: string } => {
      const trimmed = username.trim();
      if (!trimmed || trimmed.length < 4) {
        return {
          success: false,
          error:
            "Username must be ≥ 4 characters / Benutzername mind. 4 Zeichen / 用户名至少4个字符",
        };
      }
      if (!password || password.length < 6) {
        return {
          success: false,
          error:
            "Password must be ≥ 6 characters / Passwort mind. 6 Zeichen / 密码至少6个字符",
        };
      }
      const admins = loadAdmins();
      if (admins.some((a) => a.username === trimmed)) {
        return {
          success: false,
          error:
            "Username already exists / Benutzername bereits vorhanden / 用户名已存在",
        };
      }
      const updated = [...admins, { username: trimmed, password }];
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
            "New password must be ≥ 6 characters / Mind. 6 Zeichen / 至少6个字符",
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
            "Current password incorrect / Aktuelles Passwort falsch / 当前密码不正确",
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
            "Cannot remove yourself / Sich selbst nicht entfernen / 无法删除自己",
        };
      }
      const admins = loadAdmins();
      const filtered = admins.filter((a) => a.username !== username);
      if (filtered.length === admins.length) {
        return { success: false, error: "User not found" };
      }
      if (filtered.length === 0) {
        return {
          success: false,
          error:
            "Cannot remove the last administrator / Letzten Admin nicht entfernen / 无法删除最后一个管理员",
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
