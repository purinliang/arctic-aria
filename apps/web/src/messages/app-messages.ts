import type { SupportedLanguage } from "./languages";

export type AppMessages = typeof englishMessages;
export type AppShellMessages = AppMessages["appShell"];
export type AuthMessages = AppMessages["auth"];
export type SettingsMessages = AppMessages["settings"];
export type VersionStatusMessages = AppMessages["versionStatus"];

const englishMessages = {
  appShell: {
    closeNavigation: "Close navigation",
    closeNavigationOverlay: "Close navigation overlay",
    openNavigation: "Open navigation",
    pages: {
      dashboard: "Dashboard",
      memories: "Memories",
      projects: "Projects",
      routines: "Routines",
      settings: "Settings",
    },
    sidebar: {
      darkMode: "Dark mode",
      lightMode: "Light mode",
      signOut: "Sign out",
      signingOut: "Signing out...",
    },
  },
  auth: {
    brandDescription: "Your personal life assistant under the aurora.",
    fields: {
      displayName: "Display name",
      password: "Password",
      repeatPassword: "Repeat password",
      username: "Username",
    },
    form: {
      alreadyHaveAccount: "Already have an account?",
      checking: "Checking...",
      continueWithGoogle: "Continue with Google",
      createAccount: "Create an account",
      forgotPassword: "Forgot your password?",
      hidePassword: "Hide password",
      newHere: "New here?",
      or: "or",
      resetPassword: "Reset password",
      showPassword: "Show password",
      signIn: "Sign in",
      signUp: "Sign up",
      welcomeBack: "Welcome back",
    },
    loading: {
      openingWorkspace: "Opening your workspace...",
    },
    notifications: {
      accountCreated: "Account created",
      checkFormMessage: "Please fix the highlighted fields.",
      checkFormTitle: "Check the form",
      googleMessage: "Google sign-in is not implemented in this prototype yet.",
      googleTitle: "Google sign-in unavailable",
      passwordResetMessage:
        "Password reset is not implemented in this prototype yet.",
      passwordResetTitle: "Password reset unavailable",
      signedIn: "Signed in",
      signedOutMessage: "You have signed out.",
      signedOutTitle: "Signed out",
      signInFailed: "Sign in failed",
      signUpFailed: "Sign up failed",
    },
    themeToggle: {
      dark: "Dark",
      light: "Light",
    },
  },
  settings: {
    description: "Theme, language, and app information.",
    languageLabel: "Language",
    languageOptions: {
      english: "English",
      simplifiedChinese: "简体中文",
      system: "Use system setting",
    },
    themeLabel: "Theme",
    themeOptions: {
      dark: "Dark",
      light: "Light",
      system: "Use system setting",
    },
    title: "Settings",
  },
  versionStatus: {
    appVersion: "App Version",
    databaseVersion: "Database Version",
    expected: "expected",
  },
};

const simplifiedChineseMessages: AppMessages = {
  appShell: {
    closeNavigation: "关闭导航",
    closeNavigationOverlay: "关闭导航遮罩",
    openNavigation: "打开导航",
    pages: {
      dashboard: "仪表盘",
      memories: "回忆",
      projects: "项目",
      routines: "例行事项",
      settings: "设置",
    },
    sidebar: {
      darkMode: "深色模式",
      lightMode: "浅色模式",
      signOut: "退出登录",
      signingOut: "正在退出...",
    },
  },
  auth: {
    brandDescription: "极光下的个人生活助手。",
    fields: {
      displayName: "显示名称",
      password: "密码",
      repeatPassword: "重复密码",
      username: "用户名",
    },
    form: {
      alreadyHaveAccount: "已有账户？",
      checking: "正在验证...",
      continueWithGoogle: "使用 Google 继续",
      createAccount: "创建账户",
      forgotPassword: "忘记密码？",
      hidePassword: "隐藏密码",
      newHere: "第一次使用？",
      or: "或",
      resetPassword: "重置密码",
      showPassword: "显示密码",
      signIn: "登录",
      signUp: "注册",
      welcomeBack: "欢迎回来",
    },
    loading: {
      openingWorkspace: "正在打开你的工作区...",
    },
    notifications: {
      accountCreated: "账户已创建",
      checkFormMessage: "请修正标出的字段。",
      checkFormTitle: "检查表单",
      googleMessage: "此原型暂未实现 Google 登录。",
      googleTitle: "Google 登录不可用",
      passwordResetMessage: "此原型暂未实现密码重置。",
      passwordResetTitle: "密码重置不可用",
      signedIn: "已登录",
      signedOutMessage: "你已退出登录。",
      signedOutTitle: "已退出登录",
      signInFailed: "登录失败",
      signUpFailed: "注册失败",
    },
    themeToggle: {
      dark: "深色",
      light: "浅色",
    },
  },
  settings: {
    description: "主题、语言和应用信息。",
    languageLabel: "语言",
    languageOptions: {
      english: "English",
      simplifiedChinese: "简体中文",
      system: "使用系统设置",
    },
    themeLabel: "主题",
    themeOptions: {
      dark: "深色",
      light: "浅色",
      system: "使用系统设置",
    },
    title: "设置",
  },
  versionStatus: {
    appVersion: "应用版本",
    databaseVersion: "数据库版本",
    expected: "预期",
  },
};

export function getAppMessages(language: SupportedLanguage): AppMessages {
  return language === "zh-CN" ? simplifiedChineseMessages : englishMessages;
}
