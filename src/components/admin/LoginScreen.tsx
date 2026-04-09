"use client";

import Link from "next/link";
import { HelpIcon } from "@/components/admin/Tooltip";
import TwoFactorForm from "@/components/admin/TwoFactorForm";
import LoginForm from "@/components/admin/LoginForm";
import ForgotPasswordForm from "@/components/admin/ForgotPasswordForm";
import DevModePanel from "@/components/admin/DevModePanel";
import { useAdminPage } from "@/contexts/AdminPageContext";

export default function LoginScreen() {
  const { login, twoFactor, forgotPw, devMode } = useAdminPage();

  const {
    userInput, setUserInput,
    pwInput, setPwInput,
    loginError, showLoginPw, setShowLoginPw,
    handleLogin,
  } = login;

  const {
    twoFactorStep, twoFactorCode, setTwoFactorCode,
    twoFactorMaskedEmail, twoFactorLoading,
    handleTwoFactorVerify, setTwoFactorStep, setLoginError,
  } = twoFactor;

  const {
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
  } = forgotPw;

  const {
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
  } = devMode;
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
