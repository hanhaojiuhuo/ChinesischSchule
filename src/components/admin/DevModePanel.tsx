"use client";

import { EyeToggle } from "@/components/admin/AdminHelpers";
import { HelpIcon } from "@/components/admin/Tooltip";

export interface DevModePanelProps {
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

export default function DevModePanel({
  devModeOpen,
  setDevModeOpen,
  devModeUsername,
  setDevModeUsername,
  devModeNewPw,
  setDevModeNewPw,
  devModeNewPwConfirm,
  setDevModeNewPwConfirm,
  devModeError,
  devModeSuccess,
  devModePersisted,
  devModePersistError,
  devModeLoading,
  showDevModePw,
  setShowDevModePw,
  showDevModeConfirm,
  setShowDevModeConfirm,
  handleDevModeReset,
}: DevModePanelProps) {
  return (
    <>
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
                className="text-xs text-school-red underline hover:opacity-80"
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
    </>
  );
}
