export interface AdminUser {
  username: string;
  password: string;
  email?: string;
}

export interface LoginResult {
  success: boolean;
  remainingAttempts?: number;
  blocked?: boolean;
  twoFactorRequired?: boolean;
  maskedEmail?: string;
}

export interface VerifyLoginCodeResult {
  success: boolean;
  error?: string;
}

export interface MutateAdminResult {
  success: boolean;
  error?: string;
  warning?: string;
}

export interface LoginFailures {
  count: number;
  date: string;
}

export interface SaveResult {
  ok: boolean;
  persistError?: string;
}

export interface AuthContextValue {
  isAdmin: boolean;
  currentUser: string | null;
  authLoading: boolean;
  /** True when the current session was established via recovery mode. */
  isRecoverySession: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<LoginResult>;
  verifyLoginCode: (
    username: string,
    code: string
  ) => Promise<VerifyLoginCodeResult>;
  logout: () => Promise<void>;
  addAdmin: (
    username: string,
    password: string,
    email?: string
  ) => Promise<MutateAdminResult>;
  changePassword: (
    username: string,
    oldPassword: string,
    newPassword: string
  ) => Promise<MutateAdminResult>;
  updateEmail: (
    username: string,
    newEmail: string
  ) => Promise<MutateAdminResult>;
  removeAdmin: (
    username: string
  ) => Promise<MutateAdminResult>;
  getAdmins: () => Promise<AdminUser[]>;
}

export interface AuthProviderProps {
  children: ReactNode;
}
import type { ReactNode } from "react";
