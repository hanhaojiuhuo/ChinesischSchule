"use client";

import Link from "next/link";
import { EyeToggle, Field } from "@/components/admin/AdminHelpers";
import { HelpIcon } from "@/components/admin/Tooltip";

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
    <div className="min-h-screen bg-[var(--school-gray)] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="font-cn text-2xl font-bold text-[var(--school-dark)] mb-1 text-center">
          管理员登录
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Administrator Login · Admin-Anmeldung
        </p>

        {/* Two-factor authentication step */}
        {twoFactorStep ? (
          <form onSubmit={handleTwoFactorVerify} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-center">
              <p className="text-xs text-blue-700 font-semibold mb-1">
                🔐 两步验证 / Zwei-Faktor-Authentifizierung / Two-Factor Authentication
              </p>
              <p className="text-xs text-blue-600">
                验证码已发送至 / Code gesendet an / Code sent to: <strong>{twoFactorMaskedEmail}</strong>
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                验证码 / Verification Code / Verifizierungscode
              </label>
              <input
                type="text"
                autoComplete="one-time-code"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.toUpperCase())}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-center font-mono tracking-widest focus:outline-none focus:border-[var(--school-red)]"
                placeholder="8位验证码 / 8-char code / 8-Zeichen-Code"
                maxLength={8}
                autoFocus
              />
            </div>
            {loginError && (
              <p className="text-xs text-red-600 text-center">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={twoFactorLoading}
              className="w-full bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] disabled:opacity-60 text-white font-semibold py-2 rounded transition-colors"
            >
              {twoFactorLoading ? "⏳ ..." : "验证 / Verifizieren / Verify"}
            </button>
            <button
              type="button"
              onClick={() => {
                setTwoFactorStep(false);
                setTwoFactorCode("");
                setLoginError("");
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
            >
              ← 返回 / Zurück / Back
            </button>
          </form>
        ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              用户名 / Username / Benutzername
            </label>
            <input
              type="text"
              autoComplete="username"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              密码 / Password / Passwort
            </label>
            <div className="relative">
              <input
                type={showLoginPw ? "text" : "password"}
                autoComplete="current-password"
                value={pwInput}
                onChange={(e) => setPwInput(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--school-red)]"
                placeholder="••••••••"
              />
              <EyeToggle show={showLoginPw} onToggle={() => setShowLoginPw(!showLoginPw)} />
            </div>
          </div>
          {loginError && (
            <p className="text-xs text-red-600 text-center">{loginError}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] text-white font-semibold py-2 rounded transition-colors"
          >
            登录 / Anmelden / Login
          </button>
        </form>
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
            className="text-xs text-[var(--school-red)] underline hover:opacity-80 transition-opacity"
          >
            忘记密码？/ Passwort vergessen? / Forgot password?
          </button>
          <HelpIcon text="Request a password reset code via email / 通过邮箱请求密码重置" />
        </div>

        {/* ── Forgot-password multi-step form ── */}
        {forgotPwStep > 0 && (
          <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            {/* Step indicator */}
            <p className="text-xs font-semibold text-gray-700 text-center">
              🔐{" "}
              {forgotPwStep === 1 && "密码重置 · Passwort-Reset · Password Reset"}
              {forgotPwStep === 2 && "输入验证码 · Code eingeben · Enter Code"}
              {forgotPwStep === 3 && "设置新密码 · Neues Passwort · New Password"}
              {forgotPwStep === 4 && "✅ 密码已重置 · Passwort zurückgesetzt · Password Reset"}
              {forgotPwStep === 5 && "🚫 已封锁 · Gesperrt · Blocked"}
            </p>

            {/* Step 1 – enter username + email */}
            {forgotPwStep === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleForgotPwRequest();
                }}
                className="space-y-2"
              >
                <p className="text-xs text-gray-600">
                  DE: Geben Sie Ihren Benutzernamen und Ihre E-Mail-Adresse ein. Der Verifizierungscode wird nur gesendet, wenn beide übereinstimmen.<br />
                  EN: Enter your username and email address. The verification code will only be sent if both match.<br />
                  ZH: 请输入您的用户名和邮箱地址。只有两者匹配时才会发送验证码。
                </p>
                <input
                  type="text"
                  value={forgotPwUsername}
                  onChange={(e) => setForgotPwUsername(e.target.value)}
                  placeholder="用户名 / Username / Benutzername"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
                  autoComplete="username"
                  required
                />
                <input
                  type="email"
                  value={forgotPwEmail}
                  onChange={(e) => setForgotPwEmail(e.target.value)}
                  placeholder="E-Mail / Email / 邮箱"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
                  autoComplete="email"
                  required
                />
                {forgotPwError && <p className="text-xs text-red-600 whitespace-pre-line">{forgotPwError}</p>}
                {forgotPwRateLimited && (
                  <p className="text-xs text-amber-600">
                    DE: Bitte kontaktieren Sie einen Administrator, falls Sie keinen Zugang erhalten.<br />
                    EN: Please contact an administrator if you are unable to reset your password.<br />
                    ZH: 如果无法重置密码，请联系管理员。
                  </p>
                )}
                <button
                  type="submit"
                  disabled={forgotPwLoading || forgotPwCooldownSecs > 0}
                  className="w-full bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] disabled:opacity-60 text-white text-sm font-semibold py-2 rounded transition-colors"
                >
                  {forgotPwCooldownSecs > 0
                    ? `⏳ ${fmtCooldown(forgotPwCooldownSecs)} — 请等待 / Bitte warten / Please wait`
                    : forgotPwLoading ? "⏳ …" : "发送验证码 / Code senden / Send Code"}
                </button>
              </form>
            )}

            {/* Step 2 – enter verification code */}
            {forgotPwStep === 2 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleForgotPwVerify();
                }}
                className="space-y-2"
              >
                {forgotPwAdminInitiated ? (
                  <p className="text-xs text-gray-600">
                    DE: Ein Administrator hat einen Passwort-Reset für Ihr Konto angefordert. Bitte geben Sie Ihren Benutzernamen und den per E-Mail erhaltenen 8-stelligen Verifizierungscode ein.<br />
                    EN: An administrator has requested a password reset for your account. Please enter your username and the 8-character verification code you received by email.<br />
                    ZH: 管理员已为您的账户发起密码重置。请输入您的用户名和通过邮件收到的8位验证码。
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">
                    DE: Falls die E-Mail-Adresse im System registriert ist, wurde ein Verifizierungscode gesendet (gültig 30 Min.). Nach Ablauf muss ein neuer Code angefordert werden.<br />
                    EN: If the email is registered in the system, a verification code was sent (valid 30 min). After expiry, a new code must be requested.<br />
                    ZH: 如果该邮箱已在系统中注册，验证码已发送（有效期 30 分钟）。过期后需重新申请。
                  </p>
                )}
                {forgotPwSuccess && <p className="text-xs text-green-600 font-semibold" role="status">{forgotPwSuccess}</p>}
                {forgotPwCooldownSecs > 0 && (
                  <p className="text-xs text-amber-600 font-mono text-center">
                    ⏳ {fmtCooldown(forgotPwCooldownSecs)}{" "}
                    — 重新发送前请等待 / Bitte warten Sie vor dem erneuten Senden / Please wait before resending
                  </p>
                )}
                {/* Show editable username field in admin-initiated flow */}
                {forgotPwAdminInitiated && (
                  <input
                    type="text"
                    value={forgotPwUsername}
                    onChange={(e) => setForgotPwUsername(e.target.value)}
                    placeholder="用户名 / Username / Benutzername"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--school-red)]"
                    autoComplete="username"
                    required
                  />
                )}
                <input
                  type="text"
                  inputMode="text"
                  pattern="[A-Za-z0-9]{8}"
                  maxLength={8}
                  value={forgotPwCode}
                  onChange={(e) => setForgotPwCode(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
                  placeholder="8-stelliger Code / 8-char code / 8位验证码"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-center font-mono tracking-widest focus:outline-none focus:border-[var(--school-red)]"
                  autoComplete="one-time-code"
                  required
                />
                {forgotPwError && <p className="text-xs text-red-600">{forgotPwError}</p>}
                <button
                  type="submit"
                  disabled={forgotPwLoading}
                  className="w-full bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] disabled:opacity-60 text-white text-sm font-semibold py-2 rounded transition-colors"
                >
                  {forgotPwLoading ? "⏳ …" : "验证 / Bestätigen / Verify"}
                </button>
                {/* Retry / Resend code — only in normal flow (email known) */}
                {!forgotPwAdminInitiated && (
                  <button
                    type="button"
                    disabled={forgotPwLoading || forgotPwRateLimited || forgotPwCooldownSecs > 0}
                    onClick={() => handleForgotPwResend()}
                    className="w-full text-xs text-[var(--school-red)] underline hover:opacity-80 disabled:opacity-40"
                  >
                    {forgotPwCooldownSecs > 0
                      ? `⏳ ${fmtCooldown(forgotPwCooldownSecs)} — 请等待 / Bitte warten / Please wait`
                      : "🔁 Code erneut senden / Resend code / 重新发送验证码"}
                  </button>
                )}
                {forgotPwRateLimited && (
                  <p className="text-xs text-amber-600">
                    DE: Zu viele Versuche. Bitte kontaktieren Sie einen Administrator.<br />
                    EN: Too many attempts. Please contact an administrator.<br />
                    ZH: 尝试次数过多，请联系管理员。
                  </p>
                )}
                {forgotPwAdminInitiated ? (
                  <p className="text-xs text-gray-400">
                    DE: Code abgelaufen? Bitten Sie einen Administrator, den Code erneut zu senden.<br />
                    EN: Code expired? Ask an administrator to resend the code.<br />
                    ZH: 验证码过期？请联系管理员重新发送。
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    DE: Kein Code erhalten? Prüfen Sie Ihren Spam-Ordner oder kontaktieren Sie den Administrator.<br />
                    EN: Didn&apos;t receive a code? Check your spam folder or contact the administrator.<br />
                    ZH: 没收到验证码？请检查垃圾邮件或联系管理员。
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => { setForgotPwStep(1); setForgotPwCode(""); }}
                  className="w-full text-xs text-gray-500 underline hover:opacity-80"
                >
                  ← 返回 / Zurück / Back
                </button>
              </form>
            )}

            {/* Step 3 – enter new password */}
            {forgotPwStep === 3 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleForgotPwReset();
                }}
                className="space-y-2"
              >
                <p className="text-xs text-gray-600">
                  DE: Legen Sie Ihr neues Passwort fest (mind. 6 Zeichen).<br />
                  EN: Set your new password (minimum 6 characters).<br />
                  ZH: 请设置新密码（至少6个字符）。
                </p>
                <div className="relative">
                  <input
                    type={showForgotPwNew ? "text" : "password"}
                    value={forgotPwNewPw}
                    onChange={(e) => setForgotPwNewPw(e.target.value)}
                    placeholder="新密码 / Neues Passwort / New password"
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--school-red)]"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <EyeToggle show={showForgotPwNew} onToggle={() => setShowForgotPwNew(!showForgotPwNew)} />
                </div>
                <div className="relative">
                  <input
                    type={showForgotPwConfirm ? "text" : "password"}
                    value={forgotPwNewPwConfirm}
                    onChange={(e) => setForgotPwNewPwConfirm(e.target.value)}
                    placeholder="确认密码 / Passwort bestätigen / Confirm password"
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--school-red)]"
                    autoComplete="new-password"
                    required
                  />
                  <EyeToggle show={showForgotPwConfirm} onToggle={() => setShowForgotPwConfirm(!showForgotPwConfirm)} />
                </div>
                {forgotPwError && <p className="text-xs text-red-600">{forgotPwError}</p>}
                <button
                  type="submit"
                  disabled={forgotPwLoading}
                  className="w-full bg-[var(--school-red)] hover:bg-[var(--school-red-dark)] disabled:opacity-60 text-white text-sm font-semibold py-2 rounded transition-colors"
                >
                  {forgotPwLoading ? "⏳ …" : "保存新密码 / Speichern / Save"}
                </button>
              </form>
            )}

            {/* Step 4 – success */}
            {forgotPwStep === 4 && (
              <div className="text-center space-y-2">
                <p className="text-sm text-green-700 font-semibold">
                  密码已成功重置！/ Passwort erfolgreich zurückgesetzt! / Password reset successfully!
                </p>
                <p className="text-xs text-gray-600">
                  DE: Sie erhalten eine Bestätigungs-E-Mail. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.<br />
                  EN: A confirmation email has been sent. You can now log in with your new password.<br />
                  ZH: 确认邮件已发送。您现在可以使用新密码登录。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPwStep(0);
                    setForgotPwUsername("");
                    setForgotPwEmail("");
                    setForgotPwCode("");
                    setForgotPwNewPw("");
                    setForgotPwNewPwConfirm("");
                  }}
                  className="text-xs text-[var(--school-red)] underline hover:opacity-80"
                >
                  ← 返回登录 / Zurück zur Anmeldung / Back to Login
                </button>
              </div>
            )}

            {/* Step 5 – blocked after 3 mismatch attempts */}
            {forgotPwStep === 5 && (
              <div className="text-center space-y-2">
                <p className="text-sm text-red-700 font-semibold">
                  🚫 操作已被封锁 / Activity blocked / Aktivität gesperrt
                </p>
                <p className="text-xs text-gray-600">
                  DE: Zu viele Fehlversuche. Bitte warten Sie 24 Stunden, bevor Sie es erneut versuchen.<br />
                  EN: Too many incorrect attempts. Please wait 24 hours before trying again.<br />
                  ZH: 错误尝试次数过多，请等待24小时后再试。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPwStep(0);
                    setForgotPwUsername("");
                    setForgotPwEmail("");
                    setForgotPwCode("");
                    setForgotPwNewPw("");
                    setForgotPwNewPwConfirm("");
                  }}
                  className="text-xs text-[var(--school-red)] underline hover:opacity-80"
                >
                  ← 返回登录 / Zurück zur Anmeldung / Back to Login
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Developer mode (appears after 3+ failed attempts) ── */}
        {failedAttempts >= DEV_MODE_THRESHOLD && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setDevModeOpen(!devModeOpen);
              }}
              className="text-xs text-amber-600 underline hover:opacity-80 transition-opacity"
            >
              🔧 开发者模式 / Developer Mode / Entwicklermodus
            </button>
          </div>
        )}

        {devModeOpen && (
          <div className="mt-3 p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-amber-800 text-center">
              🔧 开发者模式 · Developer Mode · Entwicklermodus{" "}
              <HelpIcon text="Emergency password recovery for developers / 开发者紧急密码恢复" />
            </p>
            {devModeSuccess ? (
              <div className="text-center space-y-2">
                <p className="text-sm text-green-700 font-semibold">
                  ✅ 密码已保存！/ Password saved! / Passwort gespeichert!
                </p>
                {!devModePersisted && (
                  <p className="text-xs text-amber-700 bg-amber-100 rounded p-2">
                    ⚠️ ZH: Edge Config 未配置或写入失败。密码仅临时保存，重新部署后将丢失。<br />
                    ⚠️ EN: Edge Config not configured or write failed. Password is saved temporarily and will be lost after redeployment.<br />
                    ⚠️ DE: Edge Config nicht konfiguriert oder Schreibvorgang fehlgeschlagen. Passwort ist nur temporär gespeichert und geht nach einem Redeployment verloren.
                    {devModePersistError && (
                      <>
                        <br /><br />
                        <span className="font-mono text-[10px] text-amber-800 break-all">
                          Details: {devModePersistError}
                        </span>
                      </>
                    )}
                  </p>
                )}
                <p className="text-xs text-gray-600">
                  DE: Sie können sich jetzt mit dem neuen Passwort anmelden. Vergessen Sie nicht, <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE</code> danach in Vercel zu deaktivieren.<br />
                  EN: You can now log in with the new password. Remember to disable <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE</code> in Vercel afterwards.<br />
                  ZH: 您现在可以使用新密码登录了。请记得之后在 Vercel 中关闭 <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE</code>。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded transition-colors"
                >
                  ✅ 进入管理面板 / Enter Admin Panel / Zum Admin-Panel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDevModeOpen(false);
                    setDevModeNewPw("");
                    setDevModeNewPwConfirm("");
                  }}
                  className="text-xs text-[var(--school-red)] underline hover:opacity-80"
                >
                  ← 返回登录 / Zurück zur Anmeldung / Back to Login
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDevModeReset();
                }}
                className="space-y-2"
              >
                <p className="text-xs text-amber-700">
                  DE: Setzen Sie ein neues Passwort. Voraussetzung: <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> muss in den Vercel-Umgebungsvariablen gesetzt sein.<br />
                  EN: Set a new password. Requires <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> to be set in Vercel environment variables.<br />
                  ZH: 设置新密码。需要在 Vercel 环境变量中设置 <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code>。
                </p>
                <input
                  type="text"
                  value={devModeUsername}
                  onChange={(e) => setDevModeUsername(e.target.value)}
                  placeholder="用户名 / Username / Benutzername"
                  className="w-full border border-amber-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  autoComplete="username"
                  minLength={4}
                  required
                />
                <div className="relative">
                  <input
                    type={showDevModePw ? "text" : "password"}
                    value={devModeNewPw}
                    onChange={(e) => setDevModeNewPw(e.target.value)}
                    placeholder="新密码 / New password / Neues Passwort"
                    className="w-full border border-amber-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-amber-500"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <EyeToggle show={showDevModePw} onToggle={() => setShowDevModePw(!showDevModePw)} />
                </div>
                <div className="relative">
                  <input
                    type={showDevModeConfirm ? "text" : "password"}
                    value={devModeNewPwConfirm}
                    onChange={(e) => setDevModeNewPwConfirm(e.target.value)}
                    placeholder="确认密码 / Confirm password / Passwort bestätigen"
                    className="w-full border border-amber-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-amber-500"
                    autoComplete="new-password"
                    required
                  />
                  <EyeToggle show={showDevModeConfirm} onToggle={() => setShowDevModeConfirm(!showDevModeConfirm)} />
                </div>
                {devModeError && (
                  <p className="text-xs text-red-600 whitespace-pre-line">{devModeError}</p>
                )}
                <button
                  type="submit"
                  disabled={devModeLoading}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded transition-colors"
                >
                  {devModeLoading ? "⏳ …" : "💾 保存到 Vercel / Save to Vercel / In Vercel speichern"}
                </button>
              </form>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          <Link href="/" className="underline hover:text-[var(--school-red)]">
            ← 返回网站 / Zurück zur Website / Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
