"use client";

import { HelpIcon } from "@/components/admin/Tooltip";
import SessionTimeoutWarning from "@/components/SessionTimeoutWarning";
import type { Language, SiteContent, NewsBodyBlock, CourseItem } from "@/i18n/translations";
import type { AdminUser } from "@/contexts/AuthContext";
import DashboardTopBar from "@/components/admin/DashboardTopBar";
import ContentTab from "@/components/admin/ContentTab";
import AccountTab from "@/components/admin/AccountTab";
import AdminManagementTab from "@/components/admin/AdminManagementTab";

export interface AdminDashboardProps {
  // Auth / session
  currentUser: string | null;
  isRecoverySession: boolean;
  logout: () => void;
  remainingSeconds: number;
  totalSeconds: number;
  showWarning: boolean;
  extendSession: () => void;

  // Language
  editLang: Language;
  setEditLang: (lang: Language) => void;
  setLanguage: (lang: Language) => void;

  // Content draft
  draft: SiteContent;
  setDraft: React.Dispatch<React.SetStateAction<SiteContent>>;
  handleSave: () => void;
  handleReset: () => void;
  handleSectionSave: (sectionKey: string) => void;
  saving: boolean;
  saved: boolean;
  sectionStatus: Record<string, "idle" | "saving" | "saved">;

  // Field updaters
  setField: (field: string, value: string) => void;
  updateAbout: (key: string, value: string) => void;
  updateHero: (key: string, value: string) => void;
  updateNav: (key: string, value: string) => void;
  updateContact: (key: string, value: string | string[]) => void;
  updateCourse: (idx: number, key: keyof CourseItem, val: string) => void;
  addCourse: () => void;
  removeCourse: (idx: number) => void;
  updateNews: (idx: number, key: string, val: string) => void;
  updateNewsBlocks: (idx: number, blocks: NewsBodyBlock[]) => void;
  handleNewsImageUpload: (file: File, newsIdx: number, blockIdx: number) => void;
  addNews: () => void;
  removeNews: (idx: number) => void;
  newsUploadingIdx: { newsIdx: number; blockIdx: number } | null;
  setNewsUploadingIdx: React.Dispatch<React.SetStateAction<{ newsIdx: number; blockIdx: number } | null>>;
  newsUploadError: string;
  setNewsUploadError: React.Dispatch<React.SetStateAction<string>>;
  newsFileInputRef: React.RefObject<HTMLInputElement | null>;
  newsExpandedBlock: { newsIdx: number; blockIdx: number } | null;
  setNewsExpandedBlock: React.Dispatch<React.SetStateAction<{ newsIdx: number; blockIdx: number } | null>>;

  // Password change
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

  // Admin management
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

  // Add admin
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

const langLabels: Record<Language, string> = { de: "Deutsch", zh: "中文", en: "English" };

export default function AdminDashboard(props: AdminDashboardProps) {
  const {
    currentUser,
    isRecoverySession,
    logout,
    remainingSeconds,
    totalSeconds,
    showWarning,
    extendSession,
    editLang,
    setEditLang,
    setLanguage,
    draft,
    setDraft,
    handleSave,
    handleReset,
    handleSectionSave,
    saving,
    saved,
    sectionStatus,
    setField,
    updateAbout,
    updateHero,
    updateNav,
    updateContact,
    updateCourse,
    addCourse,
    removeCourse,
    updateNews,
    updateNewsBlocks,
    handleNewsImageUpload,
    addNews,
    removeNews,
    newsUploadingIdx,
    setNewsUploadingIdx,
    newsUploadError,
    setNewsUploadError,
    newsFileInputRef,
    newsExpandedBlock,
    setNewsExpandedBlock,
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
  } = props;

  return (
    <div className="min-h-screen bg-school-gray">
      {/* Session timeout warning popup */}
      {showWarning && (
        <SessionTimeoutWarning
          remainingSeconds={remainingSeconds}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}

      {/* Top bar */}
      <DashboardTopBar
        currentUser={currentUser}
        remainingSeconds={remainingSeconds}
        totalSeconds={totalSeconds}
        editLang={editLang}
        setEditLang={setEditLang}
        setLanguage={setLanguage}
        handleSave={handleSave}
        handleReset={handleReset}
        saving={saving}
        saved={saved}
        logout={logout}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isRecoverySession && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-400 rounded-lg text-sm text-amber-900">
            <strong>⚠️ 恢复模式已激活 / Recovery Mode Active / Wiederherstellungsmodus aktiv</strong>
            <p className="mt-1">
              您正在通过恢复模式访问管理面板。请立即在下方【管理员管理】部分创建一个新管理员账户，然后在 Vercel 环境变量中删除 <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> 并重新部署。
            </p>
            <p className="mt-1 text-xs opacity-80">
              You are logged in via recovery mode. Create a new admin account below, then remove <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> from your Vercel environment variables and redeploy. ·
              Sie sind im Wiederherstellungsmodus angemeldet. Erstellen Sie unten ein neues Admin-Konto und entfernen Sie anschließend <code className="bg-amber-100 px-1 rounded">RECOVERY_MODE=true</code> aus den Vercel-Umgebungsvariablen.
            </p>
          </div>
        )}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Sprache bearbeiten / Editing language:</strong> {langLabels[editLang]} &nbsp;|&nbsp;
          Änderungen werden in der Vercel-Cloud gespeichert.
          Changes are saved in Vercel cloud.
          更改保存在 Vercel 云端。
          <HelpIcon text="Switch between DE / ZH / EN tabs to edit content for each language independently. Each tab edits only that language's content. / 切换语言标签以分别编辑各语言的内容。" />
        </div>

        {/* Content editing sections */}
        <ContentTab
          draft={draft}
          setDraft={setDraft}
          handleSectionSave={handleSectionSave}
          sectionStatus={sectionStatus}
          setField={setField}
          updateAbout={updateAbout}
          updateHero={updateHero}
          updateNav={updateNav}
          updateContact={updateContact}
          updateCourse={updateCourse}
          addCourse={addCourse}
          removeCourse={removeCourse}
          updateNews={updateNews}
          updateNewsBlocks={updateNewsBlocks}
          handleNewsImageUpload={handleNewsImageUpload}
          addNews={addNews}
          removeNews={removeNews}
          newsUploadingIdx={newsUploadingIdx}
          setNewsUploadingIdx={setNewsUploadingIdx}
          newsUploadError={newsUploadError}
          setNewsUploadError={setNewsUploadError}
          newsFileInputRef={newsFileInputRef}
          newsExpandedBlock={newsExpandedBlock}
          setNewsExpandedBlock={setNewsExpandedBlock}
        />

        {/* Change password */}
        <AccountTab
          showChangePw={showChangePw}
          setShowChangePw={setShowChangePw}
          oldPw={oldPw}
          setOldPw={setOldPw}
          newPw={newPw}
          setNewPw={setNewPw}
          newPwConfirm={newPwConfirm}
          setNewPwConfirm={setNewPwConfirm}
          pwChangeMsg={pwChangeMsg}
          setPwChangeMsg={setPwChangeMsg}
          pwChangeMsgType={pwChangeMsgType}
          showChangePwOld={showChangePwOld}
          setShowChangePwOld={setShowChangePwOld}
          showChangePwNew={showChangePwNew}
          setShowChangePwNew={setShowChangePwNew}
          showChangePwConfirm={showChangePwConfirm}
          setShowChangePwConfirm={setShowChangePwConfirm}
          pwChangeStep={pwChangeStep}
          setPwChangeStep={setPwChangeStep}
          pwChangeCode={pwChangeCode}
          setPwChangeCode={setPwChangeCode}
          pwChangeMaskedEmail={pwChangeMaskedEmail}
          pwChangeLoading={pwChangeLoading}
          handleChangePw={handleChangePw}
        />

        {/* Admin management */}
        <AdminManagementTab
          currentUser={currentUser}
          adminList={adminList}
          adminListKey={adminListKey}
          editingEmailUser={editingEmailUser}
          setEditingEmailUser={setEditingEmailUser}
          editEmailValue={editEmailValue}
          setEditEmailValue={setEditEmailValue}
          emailUpdateMsg={emailUpdateMsg}
          setEmailUpdateMsg={setEmailUpdateMsg}
          handleUpdateEmail={handleUpdateEmail}
          adminResetUser={adminResetUser}
          setAdminResetUser={setAdminResetUser}
          adminResetLoading={adminResetLoading}
          adminResetMsg={adminResetMsg}
          setAdminResetMsg={setAdminResetMsg}
          handleAdminResetPassword={handleAdminResetPassword}
          handleRemoveAdmin={handleRemoveAdmin}
          removeAdminMsg={removeAdminMsg}
          showAddAdmin={showAddAdmin}
          setShowAddAdmin={setShowAddAdmin}
          newAdminUser={newAdminUser}
          setNewAdminUser={setNewAdminUser}
          newAdminPw={newAdminPw}
          setNewAdminPw={setNewAdminPw}
          newAdminPwConfirm={newAdminPwConfirm}
          setNewAdminPwConfirm={setNewAdminPwConfirm}
          newAdminEmail={newAdminEmail}
          setNewAdminEmail={setNewAdminEmail}
          showNewAdminPw={showNewAdminPw}
          setShowNewAdminPw={setShowNewAdminPw}
          addAdminMsg={addAdminMsg}
          addAdminSuccess={addAdminSuccess}
          handleAddAdmin={handleAddAdmin}
          setAddAdminMsg={setAddAdminMsg}
        />

        {/* Save button (bottom) */}
        <div className="sticky bottom-6 flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-lg shadow-lg transition-colors text-base"
          >
            {saving ? "⏳ Speichern…" : saved ? "✓ Gespeichert! / Saved! / 已保存！" : "💾 Speichern / Save / 保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
