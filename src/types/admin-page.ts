import type {
  Dispatch,
  FormEvent,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";
import type { AdminUser } from "@/types/auth";
import type {
  CourseItem,
  Language,
  NewsBodyBlock,
  SiteContent,
} from "@/i18n/translations";

export interface AuthGroup {
  currentUser: string | null;
  isAdmin: boolean;
  isRecoverySession: boolean;
  logout: () => void;
}

export interface SessionGroup {
  remainingSeconds: number;
  totalSeconds: number;
  showWarning: boolean;
  extendSession: () => void;
}

export interface LoginGroup {
  userInput: string;
  setUserInput: (v: string) => void;
  pwInput: string;
  setPwInput: (v: string) => void;
  loginError: string;
  showLoginPw: boolean;
  setShowLoginPw: (v: boolean) => void;
  handleLogin: (e: FormEvent) => void;
}

export interface TwoFactorGroup {
  twoFactorStep: boolean;
  twoFactorCode: string;
  setTwoFactorCode: (v: string) => void;
  twoFactorMaskedEmail: string;
  twoFactorLoading: boolean;
  handleTwoFactorVerify: (e: FormEvent) => void;
  setTwoFactorStep: (v: boolean) => void;
  setLoginError: (v: string) => void;
}

export interface ForgotPwGroup {
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
}

export interface DevModeGroup {
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

export interface ContentGroup {
  draft: SiteContent;
  setDraft: Dispatch<SetStateAction<SiteContent>>;
  editLang: Language;
  setEditLang: (lang: Language) => void;
  setLanguage: (lang: Language) => void;
  handleSave: () => void;
  handleReset: () => void;
  handleSectionSave: (sectionKey: string) => void;
  saving: boolean;
  saved: boolean;
  sectionStatus: Record<string, "idle" | "saving" | "saved">;
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
  setNewsUploadingIdx: Dispatch<
    SetStateAction<{ newsIdx: number; blockIdx: number } | null>
  >;
  newsUploadError: string;
  setNewsUploadError: Dispatch<SetStateAction<string>>;
  newsFileInputRef: RefObject<HTMLInputElement | null>;
  newsExpandedBlock: { newsIdx: number; blockIdx: number } | null;
  setNewsExpandedBlock: Dispatch<
    SetStateAction<{ newsIdx: number; blockIdx: number } | null>
  >;
}

export interface PasswordChangeGroup {
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
  setShowChangePwOld: Dispatch<SetStateAction<boolean>>;
  showChangePwNew: boolean;
  setShowChangePwNew: Dispatch<SetStateAction<boolean>>;
  showChangePwConfirm: boolean;
  setShowChangePwConfirm: Dispatch<SetStateAction<boolean>>;
  pwChangeStep: "form" | "verify";
  setPwChangeStep: (v: "form" | "verify") => void;
  pwChangeCode: string;
  setPwChangeCode: (v: string) => void;
  pwChangeMaskedEmail: string;
  pwChangeLoading: boolean;
  handleChangePw: (e: FormEvent) => void;
}

export interface AdminManagementGroup {
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
}

export interface AddAdminGroup {
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
  setShowNewAdminPw: Dispatch<SetStateAction<boolean>>;
  addAdminMsg: string;
  addAdminSuccess: boolean;
  handleAddAdmin: (e: FormEvent) => void;
  setAddAdminMsg: (v: string) => void;
}

export interface ResetDialogGroup {
  showResetDialog: boolean;
  setShowResetDialog: (v: boolean) => void;
  confirmReset: () => void;
}

export interface AdminPageContextValue {
  auth: AuthGroup;
  session: SessionGroup;
  login: LoginGroup;
  twoFactor: TwoFactorGroup;
  forgotPw: ForgotPwGroup;
  devMode: DevModeGroup;
  content: ContentGroup;
  passwordChange: PasswordChangeGroup;
  adminManagement: AdminManagementGroup;
  addAdmin: AddAdminGroup;
  resetDialog: ResetDialogGroup;
}

export interface AdminPageProviderProps {
  children: ReactNode;
}
