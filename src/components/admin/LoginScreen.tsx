"use client";

import Link from "next/link";
import { HelpIcon } from "@/components/admin/Tooltip";
import TwoFactorForm from "@/components/admin/TwoFactorForm";
import LoginForm from "@/components/admin/LoginForm";
import ForgotPasswordForm from "@/components/admin/ForgotPasswordForm";
import DevModePanel from "@/components/admin/DevModePanel";

export interface LoginScreenProps {
  // Login form
  userInput: string;
  setUserInput: (v: string) => void;
  pwInput: string;
  setPwInput: (v: string) => void;
  loginError: string;
  showLoginPw: boolean;
  setShowLoginPw: (v: boolean) => void;
  handleLogin: (e: React.FormEvent) => void;

  // 2FA
  twoFactorStep: boolean;
  twoFactorCode: string;
  setTwoFactorCode: (v: string) => void;
  twoFactorMaskedEmail: string;
  twoFactorLoading: boolean;
  handleTwoFactorVerify: (e: React.FormEvent) => void;
  setTwoFactorStep: (v: boolean) => void;
  setLoginError: (v: string) => void;

  // Forgot password
  forgotPwStep: number;
  setForgotPwStep: (v: number) => void;
  forgotPwUsername: string;
  setForgotPwUsername: (v: string) => void;
  forgotPwEmail: string;
  setForgotPwEmail: (v: string) => void;
  forgotPwCode: string;
  setForgotPwCode: (v: string) => void;
  forgotPwNewPw: string;
  setForgotPwNewPw: (v: string) => void;
  forgotPwNewPwConfirm: string;
  setForgotPwNewPwConfirm: (v: string) => void;
  forgotPwError: string;
  forgotPwSuccess: string;
  forgotPwLoading: boolean;
  showForgotPwNew: boolean;
  setShowForgotPwNew: (v: boolean) => void;
  showForgotPwConfirm: boolean;
  setShowForgotPwConfirm: (v: boolean) => void;
  forgotPwCooldownSecs: number;
  fmtCooldown: (secs: number) => string;
  forgotPwAdminInitiated: boolean;
  forgotPwRateLimited: boolean;
  handleForgotPwRequest: () => void;
  handleForgotPwVerify: () => void;
  handleForgotPwReset: () => void;
  handleForgotPwResend: () => void;

  // Dev mode
  failedAttempts: number;
  DEV_MODE_THRESHOLD: number;
  devModeOpen: boolean;
  setDevModeOpen: (v: boolean) => void;
  devModeUsername: string;
  setDevModeUsername: (v: string) => void;
  devModeNewPw: string;
  setDevModeNewPw: (v: string) => void;
  devModeNewPwConfirm: string;
  setDevModeNewPwConfirm: (v: string) => void;
  devModeError: string;
  devModeSuccess: boolean;
  devModePersisted: boolean;
  devModePersistError: string;
  devModeLoading: boolean;
  showDevModePw: boolean;
  setShowDevModePw: (v: boolean) => void;
  showDevModeConfirm: boolean;
  setShowDevModeConfirm: (v: boolean) => void;
  handleDevModeReset: () => void;
}

export default function LoginScreen({
  userInput, setUserInput,
  pwInput, setPwInput,
  loginError, showLoginPw, setShowLoginPw,
  handleLogin,

  twoFactorStep, twoFactorCode, setTwoFactorCode,
  twoFactorMaskedEmail, twoFactorLoading,
  handleTwoFactorVerify, setTwoFactorStep, setLoginError,

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
}: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-school-gray flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="font-cn text-2xl font-bold text-school-dark mb-1 text-center">
          管理员登录
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Administrator Login · Admin-Anmeldung
        </p>

        {/* Two-factor authentication step */}
        {twoFactorStep ? (
          <TwoFactorForm
            twoFactorCode={twoFactorCode}
            setTwoFactorCode={setTwoFactorCode}
            twoFactorMaskedEmail={twoFactorMaskedEmail}
            twoFactorLoading={twoFactorLoading}
            handleTwoFactorVerify={handleTwoFactorVerify}
            loginError={loginError}
            setTwoFactorStep={setTwoFactorStep}
            setLoginError={setLoginError}
          />
        ) : (
          <LoginForm
            userInput={userInput}
            setUserInput={setUserInput}
            pwInput={pwInput}
            setPwInput={setPwInput}
            loginError={loginError}
            showLoginPw={showLoginPw}
            setShowLoginPw={setShowLoginPw}
            handleLogin={handleLogin}
          />
        )}

        {/* Forgot password */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setForgotPwStep(forgotPwStep === 0 ? 1 : 0);
              setForgotPwUsername("");
              setForgotPwEmail("");
              setForgotPwCode("");
              setForgotPwNewPw("");
              setForgotPwNewPwConfirm("");
            }}
            className="text-xs text-school-red underline hover:opacity-80 transition-opacity"
          >
            忘记密码？/ Passwort vergessen? / Forgot password?
          </button>
          <HelpIcon text="Request a password reset code via email / 通过邮箱请求密码重置" />
        </div>

        {/* ── Forgot-password multi-step form ── */}
        {forgotPwStep > 0 && (
          <ForgotPasswordForm
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
          />
        )}

        {/* ── Developer mode (appears after 3+ failed attempts) ── */}
        {failedAttempts >= DEV_MODE_THRESHOLD && (
          <DevModePanel
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
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          <Link href="/" className="underline hover:text-school-red">
            ← 返回网站 / Zurück zur Website / Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
