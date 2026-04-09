"use client";

import { Field, SectionCard } from "@/components/admin/AdminHelpers";
import { HelpIcon } from "@/components/admin/Tooltip";

export interface AccountTabProps {
  showChangePw: boolean;
  setShowChangePw: (v: boolean) => void;
  oldPw: string;
  setOldPw: (v: string) => void;
  newPw: string;
  setNewPw: (v: string) => void;
  newPwConfirm: string;
  setNewPwConfirm: (v: string) => void;
  pwChangeMsg: string;
  setPwChangeMsg: (v: string) => void;
  pwChangeMsgType: "success" | "info" | "error";
  showChangePwOld: boolean;
  setShowChangePwOld: React.Dispatch<React.SetStateAction<boolean>>;
  showChangePwNew: boolean;
  setShowChangePwNew: React.Dispatch<React.SetStateAction<boolean>>;
  showChangePwConfirm: boolean;
  setShowChangePwConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  pwChangeStep: "form" | "verify";
  setPwChangeStep: (v: "form" | "verify") => void;
  pwChangeCode: string;
  setPwChangeCode: (v: string) => void;
  pwChangeMaskedEmail: string;
  pwChangeLoading: boolean;
  handleChangePw: (e: React.FormEvent) => void;
}

export default function AccountTab({
  showChangePw,
  setShowChangePw,
  oldPw,
  setOldPw,
  newPw,
  setNewPw,
  newPwConfirm,
  setNewPwConfirm,
  pwChangeMsg,
  setPwChangeMsg,
  pwChangeMsgType,
  showChangePwOld,
  setShowChangePwOld,
  showChangePwNew,
  setShowChangePwNew,
  showChangePwConfirm,
  setShowChangePwConfirm,
  pwChangeStep,
  setPwChangeStep,
  pwChangeCode,
  setPwChangeCode,
  pwChangeMaskedEmail,
  pwChangeLoading,
  handleChangePw,
}: AccountTabProps) {
  return (
    <SectionCard title={<span className="flex items-center gap-2">🔐 修改密码 / Change Password / Passwort ändern <HelpIcon text="Change your admin login password / 修改管理员密码" /></span>}>
      {!showChangePw ? (
        <button onClick={() => setShowChangePw(true)} className="text-sm text-school-red underline">
          修改密码 / Change password / Passwort ändern
        </button>
      ) : (
        <form onSubmit={handleChangePw} className="max-w-sm space-y-3">
          {pwChangeStep === "form" && (
            <>
              <Field label="当前密码 / Current password / Aktuelles Passwort" value={oldPw} onChange={setOldPw} type="password" autoComplete="current-password" showPassword={showChangePwOld} onTogglePassword={() => setShowChangePwOld((v) => !v)} />
              <Field label="新密码（至少6位）/ New password (min 6 chars) / Neues Passwort" value={newPw} onChange={setNewPw} type="password" autoComplete="new-password" showPassword={showChangePwNew} onTogglePassword={() => setShowChangePwNew((v) => !v)} />
              <Field label="确认新密码 / Confirm new password / Neues Passwort bestätigen" value={newPwConfirm} onChange={setNewPwConfirm} type="password" autoComplete="new-password" showPassword={showChangePwConfirm} onTogglePassword={() => setShowChangePwConfirm((v) => !v)} />
            </>
          )}
          {pwChangeStep === "verify" && (
            <>
              <p className="text-xs text-gray-500">
                验证码已发送至 {pwChangeMaskedEmail} / Code sent to {pwChangeMaskedEmail} / Code gesendet an {pwChangeMaskedEmail}
              </p>
              <Field
                label="验证码 / Verification code / Verifizierungscode"
                value={pwChangeCode}
                onChange={setPwChangeCode}
              />
            </>
          )}
          {pwChangeMsg && (
            <p className={`text-xs whitespace-pre-line ${pwChangeMsgType === "success" ? "text-green-600" : pwChangeMsgType === "info" ? "text-blue-600" : "text-red-600"}`}>
              {pwChangeMsg}
            </p>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={pwChangeLoading} className="px-4 py-2 bg-school-red hover:bg-school-red-dark disabled:opacity-60 text-white text-sm font-semibold rounded transition-colors">
              {pwChangeLoading ? "⏳" : pwChangeStep === "verify" ? "✓ 验证并保存 / Verify & Save / Verifizieren & Speichern" : "保存 / Save / Speichern"}
            </button>
            <button
              type="button"
              onClick={() => { setShowChangePw(false); setPwChangeMsg(""); setOldPw(""); setNewPw(""); setNewPwConfirm(""); setPwChangeStep("form"); setPwChangeCode(""); }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded transition-colors"
            >
              取消 / Cancel / Abbrechen
            </button>
          </div>
        </form>
      )}
    </SectionCard>
  );
}
