"use client";

export interface TwoFactorFormProps {
  twoFactorCode: string;
  setTwoFactorCode: (v: string) => void;
  twoFactorMaskedEmail: string;
  twoFactorLoading: boolean;
  handleTwoFactorVerify: (e: React.FormEvent) => void;
  loginError: string;
  setTwoFactorStep: (v: boolean) => void;
  setLoginError: (v: string) => void;
}

export default function TwoFactorForm({
  twoFactorCode,
  setTwoFactorCode,
  twoFactorMaskedEmail,
  twoFactorLoading,
  handleTwoFactorVerify,
  loginError,
  setTwoFactorStep,
  setLoginError,
}: TwoFactorFormProps) {
  return (
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
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-center font-mono tracking-widest focus:outline-none focus:border-school-red"
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
        className="w-full bg-school-red hover:bg-school-red-dark disabled:opacity-60 text-white font-semibold py-2 rounded transition-colors"
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
  );
}
