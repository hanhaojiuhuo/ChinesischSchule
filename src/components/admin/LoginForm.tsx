"use client";

import { EyeToggle } from "@/components/admin/AdminHelpers";

export interface LoginFormProps {
  userInput: string;
  setUserInput: (v: string) => void;
  pwInput: string;
  setPwInput: (v: string) => void;
  loginError: string;
  showLoginPw: boolean;
  setShowLoginPw: (v: boolean) => void;
  handleLogin: (e: React.FormEvent) => void;
}

export default function LoginForm({
  userInput,
  setUserInput,
  pwInput,
  setPwInput,
  loginError,
  showLoginPw,
  setShowLoginPw,
  handleLogin,
}: LoginFormProps) {
  return (
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
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-school-red"
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
            className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-school-red"
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
        className="w-full bg-school-red hover:bg-school-red-dark text-white font-semibold py-2 rounded transition-colors"
      >
        登录 / Anmelden / Login
      </button>
    </form>
  );
}
