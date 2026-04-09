"use client";

import { Field, SectionCard } from "@/components/admin/AdminHelpers";
import { HelpIcon } from "@/components/admin/Tooltip";
import type { AdminUser } from "@/types/auth";

export interface AdminManagementTabProps {
  currentUser: string | null;
  adminList: AdminUser[];
  adminListKey: number;
  editingEmailUser: string | null;
  setEditingEmailUser: (v: string | null) => void;
  editEmailValue: string;
  setEditEmailValue: (v: string) => void;
  emailUpdateMsg: string;
  setEmailUpdateMsg: (v: string) => void;
  handleUpdateEmail: (username: string) => void;
  adminResetUser: string | null;
  setAdminResetUser: (v: string | null) => void;
  adminResetLoading: boolean;
  adminResetMsg: string;
  setAdminResetMsg: (v: string) => void;
  handleAdminResetPassword: (username: string) => void;
  handleRemoveAdmin: (username: string) => void;
  removeAdminMsg: string;

  showAddAdmin: boolean;
  setShowAddAdmin: (v: boolean) => void;
  newAdminUser: string;
  setNewAdminUser: (v: string) => void;
  newAdminPw: string;
  setNewAdminPw: (v: string) => void;
  newAdminPwConfirm: string;
  setNewAdminPwConfirm: (v: string) => void;
  newAdminEmail: string;
  setNewAdminEmail: (v: string) => void;
  showNewAdminPw: boolean;
  setShowNewAdminPw: React.Dispatch<React.SetStateAction<boolean>>;
  addAdminMsg: string;
  addAdminSuccess: boolean;
  handleAddAdmin: (e: React.FormEvent) => void;
  setAddAdminMsg: (v: string) => void;
}

export default function AdminManagementTab({
  currentUser,
  adminList,
  adminListKey,
  editingEmailUser,
  setEditingEmailUser,
  editEmailValue,
  setEditEmailValue,
  emailUpdateMsg,
  setEmailUpdateMsg,
  handleUpdateEmail,
  adminResetUser,
  setAdminResetUser,
  adminResetLoading,
  adminResetMsg,
  setAdminResetMsg,
  handleAdminResetPassword,
  handleRemoveAdmin,
  removeAdminMsg,
  showAddAdmin,
  setShowAddAdmin,
  newAdminUser,
  setNewAdminUser,
  newAdminPw,
  setNewAdminPw,
  newAdminPwConfirm,
  setNewAdminPwConfirm,
  newAdminEmail,
  setNewAdminEmail,
  showNewAdminPw,
  setShowNewAdminPw,
  addAdminMsg,
  addAdminSuccess,
  handleAddAdmin,
  setAddAdminMsg,
}: AdminManagementTabProps) {
  return (
    <SectionCard title={<span className="flex items-center gap-2">👥 管理员管理 / Administrators / Administratoren <HelpIcon text="Manage admin accounts, reset passwords / 管理管理员账户" /></span>}>
      {/* Current admin list */}
      <div className="mb-4" key={adminListKey}>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          当前管理员 / Current Admins / Aktuelle Admins
        </h4>
        <div className="space-y-2">
          {adminList.map((a) => (
            <div
              key={a.username}
              className="bg-gray-50 border border-gray-200 rounded px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-school-dark">
                      {a.username}
                    </span>
                    {a.username === currentUser && (
                      <span className="text-xs bg-school-red text-white px-1.5 py-0.5 rounded">
                        当前 / you
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.email ? (
                      <span className="text-xs text-gray-400">✉ {a.email}</span>
                    ) : (
                      <span className="text-xs text-gray-300 italic">No email / 无邮箱</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEmailUser(a.username);
                        setEditEmailValue(a.email ?? "");
                        setEmailUpdateMsg("");
                      }}
                      className="text-xs text-school-red hover:opacity-80 underline"
                    >
                      ✏ Edit
                    </button>
                  </div>
                </div>
                {a.username !== currentUser && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAdminResetUser(adminResetUser === a.username ? null : a.username);
                        setAdminResetMsg("");
                      }}
                      disabled={adminResetLoading}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      🔑 重置密码 / Reset PW
                    </button>
                    <button
                      onClick={() => handleRemoveAdmin(a.username)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                    >
                      ✕ 删除 / Remove
                    </button>
                  </div>
                )}
              </div>
              {editingEmailUser === a.username && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="email"
                    value={editEmailValue}
                    onChange={(e) => setEditEmailValue(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-school-red"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateEmail(a.username)}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingEmailUser(null); setEditEmailValue(""); setEmailUpdateMsg(""); }}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-semibold rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {adminResetUser === a.username && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded space-y-2">
                  <p className="text-xs text-gray-600">
                    DE: Verifizierungscode an die E-Mail von <strong>{a.username}</strong> senden, damit dieser Admin sein Passwort zurücksetzen kann.<br />
                    EN: Send a verification code to <strong>{a.username}</strong>&apos;s email so they can reset their password.<br />
                    ZH: 向 <strong>{a.username}</strong> 的邮箱发送验证码，以便其重置密码。
                  </p>
                  {adminResetMsg && (
                    <p className={`text-xs ${adminResetMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                      {adminResetMsg}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={adminResetLoading}
                      onClick={() => handleAdminResetPassword(a.username)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded transition-colors"
                    >
                      {adminResetLoading ? "⏳ …" : "发送验证码 / Send Code / Code senden"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdminResetUser(null); setAdminResetMsg(""); }}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-semibold rounded transition-colors"
                    >
                      取消 / Cancel / Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {removeAdminMsg && (
          <p className={`mt-2 text-xs ${removeAdminMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{removeAdminMsg}</p>
        )}
        {emailUpdateMsg && (
          <p className={`mt-2 text-xs ${emailUpdateMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{emailUpdateMsg}</p>
        )}
      </div>

      {/* Add new admin */}
      {!showAddAdmin ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddAdmin(true)}
            className="text-sm text-school-red underline"
          >
            + 添加管理员 / Add administrator / Administrator hinzufügen
          </button>
          <HelpIcon text="Create a new admin account with username, password, and optional email / 创建新管理员" />
        </div>
      ) : (
        <form onSubmit={handleAddAdmin} className="max-w-sm space-y-3 border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-school-dark">
            添加新管理员 / Add New Administrator / Neuen Admin hinzufügen
          </h4>
          <Field
            label="用户名 / Username / Benutzername（至少4个字符 / min 4 chars）"
            value={newAdminUser}
            onChange={setNewAdminUser}
          />
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              密码 / Password / Passwort（至少6位 / min 6 chars）
            </label>
            <div className="relative">
              <input
                type={showNewAdminPw ? "text" : "password"}
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:border-school-red"
                value={newAdminPw}
                onChange={(e) => setNewAdminPw(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewAdminPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title={showNewAdminPw ? "隐藏密码 / Hide password" : "显示密码 / Show password"}
              >
                {showNewAdminPw ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <Field
            label="确认密码 / Confirm Password / Passwort bestätigen"
            value={newAdminPwConfirm}
            onChange={setNewAdminPwConfirm}
            type={showNewAdminPw ? "text" : "password"}
            autoComplete="new-password"
          />
          <Field
            label="邮箱（用于密码重置）/ Email (for password reset) / E-Mail (für Passwort-Reset)"
            value={newAdminEmail}
            onChange={setNewAdminEmail}
            type="email"
          />
          {addAdminMsg && (
            <p className={`text-xs ${addAdminSuccess ? "text-green-600" : "text-red-600"}`}>
              {addAdminMsg}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-school-red hover:bg-school-red-dark text-white text-sm font-semibold rounded transition-colors"
            >
              添加 / Add / Hinzufügen
            </button>
            <button
              type="button"
              onClick={() => { setShowAddAdmin(false); setAddAdminMsg(""); setNewAdminUser(""); setNewAdminPw(""); setNewAdminPwConfirm(""); setNewAdminEmail(""); }}
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
