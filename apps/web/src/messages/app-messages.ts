import type { SupportedLanguage } from "./languages";
import {
  englishDashboardMessages,
  simplifiedChineseDashboardMessages,
} from "./dashboard-messages";
import {
  englishFormMessages,
  simplifiedChineseFormMessages,
} from "./form-messages";
import {
  englishIdeaMessages,
  simplifiedChineseIdeaMessages,
} from "./idea-messages";
import {
  englishMemoryMessages,
  simplifiedChineseMemoryMessages,
} from "./memory-messages";
import {
  englishProjectMessages,
  simplifiedChineseProjectMessages,
} from "./project-messages";
import {
  englishRoutineMessages,
  simplifiedChineseRoutineMessages,
} from "./routine-messages";

export type AppMessages = typeof englishMessages;
export type AppShellMessages = AppMessages["appShell"];
export type AuthMessages = AppMessages["auth"];
export type DashboardMessages = AppMessages["dashboard"];
export type FormMessages = AppMessages["forms"];
export type IdeaMessages = AppMessages["ideas"];
export type MemoryMessages = AppMessages["memories"];
export type ProjectMessages = AppMessages["projects"];
export type RoutineMessages = AppMessages["routines"];
export type SettingsMessages = AppMessages["settings"];
export type NotificationMessages = AppMessages["notifications"];
export type VersionStatusMessages = AppMessages["versionStatus"];

const englishMessages = {
  appShell: {
    closeNavigation: "Close navigation",
    closeNavigationOverlay: "Close navigation overlay",
    openNavigation: "Open navigation",
    pages: {
      dashboard: "Today",
      ideas: "Ideas",
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
    results: {
      auth_account_created: "Account created successfully.",
      auth_signed_in: "Signed in successfully.",
      auth_validation_failed: "Please fix the highlighted fields.",
      auth_username_taken: "Username is already taken.",
      auth_invalid_credentials: "Invalid username or password.",
      auth_request_failed: "Authentication request failed.",
      auth_request_invalid: "Authentication request was invalid.",
    },
    themeToggle: {
      dark: "Dark",
      light: "Light",
    },
  },
  settings: {
    description: "Theme, language, and app information.",
    discord: {
      bindInstruction: "Run /bind code:<code> in Discord.",
      cancel: "Cancel",
      checking: "Checking Discord connection...",
      closeUnbindConfirmation: "Close Discord disconnect confirmation",
      confirmUnbindDescription:
        "This disconnects Discord from this Arctic Aria account. You can reconnect later with a new code.",
      confirmUnbindTitle: "Disconnect Discord?",
      connect: "Connect",
      connectedAs: (name: string) => `Connected as ${name}.`,
      expiresAt: (time: string) => `Expires at ${time}.`,
      genericError: "Discord settings could not be updated.",
      label: "Discord",
      notConnected: "Discord is not connected.",
      notifications: {
        codeCanceled: "Connection code canceled",
        codeCancelFailed: "Code not canceled",
        codeCreated: "Connection code created",
        codeCreateFailed: "Code not created",
        loadFailed: "Discord unavailable",
        unbound: "Discord disconnected",
        unbindFailed: "Discord not disconnected",
      },
      reconnect: "Reconnect",
      refresh: "Refresh Discord connection",
      regenerate: "Regenerate",
      results: {
        settings_discord_binding_loaded: "Discord connection loaded.",
        settings_discord_binding_unavailable: "Discord binding is unavailable.",
        settings_discord_code_canceled: "Discord connection code canceled.",
        settings_discord_code_cancel_failed:
          "Discord connection code could not be canceled.",
        settings_discord_code_created:
          "Use the code in Discord to connect your account.",
        settings_discord_code_create_failed:
          "Discord connection code could not be created.",
        settings_discord_unbound: "Discord disconnected.",
        settings_discord_unbind_failed:
          "Discord account could not be disconnected.",
        settings_unauthorized: "Sign in before changing settings.",
      },
      unbind: "Unbind",
    },
    languageLabel: "Language",
    languageOptions: {
      english: "English",
      simplifiedChinese: "简体中文",
      system: "Use system setting",
    },
    languageSupport: "Some translations are incomplete and machine translated.",
    notifications: {
      preferencesLoadFailed: "Settings unavailable",
      preferencesSaveFailed: "Settings not saved",
    },
    results: {
      settings_preferences_unavailable: "Settings are unavailable.",
      settings_preferences_save_failed: "Settings could not be saved.",
      settings_unauthorized: "Sign in before changing settings.",
    },
    themeLabel: "Theme",
    themeOptions: {
      dark: "Dark",
      light: "Light",
      system: "Use system setting",
    },
    timeFormatLabel: "Time format",
    timeFormatOptions: {
      twelveHour: "12-hour",
      twentyFourHour: "24-hour",
    },
    title: "Settings",
  },
  notifications: {
    actionFailed: "Action failed",
    notAvailableYet: "Not available yet",
    done: "Done",
    dismiss: "Dismiss notification",
  },
  dashboard: englishDashboardMessages,
  forms: englishFormMessages,
  ideas: englishIdeaMessages,
  memories: englishMemoryMessages,
  projects: englishProjectMessages,
  routines: englishRoutineMessages,
  versionStatus: {
    appVersion: "App Version",
    databaseVersion: "Database Version",
    expected: "expected",
    checking: "Checking...",
    unavailable: "Unavailable",
    databaseUnavailable: "Database version unavailable.",
  },
};

const simplifiedChineseMessages: AppMessages = {
  appShell: {
    closeNavigation: "关闭导航",
    closeNavigationOverlay: "关闭导航遮罩",
    openNavigation: "打开导航",
    pages: {
      dashboard: "今日",
      ideas: "想法",
      memories: "回忆",
      projects: "项目",
      routines: "日常",
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
    results: {
      auth_account_created: "账户创建成功。",
      auth_signed_in: "登录成功。",
      auth_validation_failed: "请修正标出的字段。",
      auth_username_taken: "用户名已被使用。",
      auth_invalid_credentials: "用户名或密码无效。",
      auth_request_failed: "认证请求失败。",
      auth_request_invalid: "认证请求无效。",
    },
    themeToggle: {
      dark: "深色",
      light: "浅色",
    },
  },
  settings: {
    description: "主题、语言和应用信息。",
    discord: {
      bindInstruction: "在 Discord 中运行 /bind code:<code>。",
      cancel: "取消",
      checking: "正在检查 Discord 连接...",
      closeUnbindConfirmation: "关闭 Discord 断开确认",
      confirmUnbindDescription:
        "这会断开 Discord 与此 Arctic Aria 账户的连接。之后可以使用新代码重新连接。",
      confirmUnbindTitle: "断开 Discord？",
      connect: "连接",
      connectedAs: (name: string) => `已连接为 ${name}。`,
      expiresAt: (time: string) => `过期时间 ${time}。`,
      genericError: "Discord 设置无法更新。",
      label: "Discord",
      notConnected: "Discord 尚未连接。",
      notifications: {
        codeCanceled: "连接代码已取消",
        codeCancelFailed: "代码未取消",
        codeCreated: "连接代码已创建",
        codeCreateFailed: "代码未创建",
        loadFailed: "Discord 不可用",
        unbound: "Discord 已断开",
        unbindFailed: "Discord 未断开",
      },
      reconnect: "重新连接",
      refresh: "刷新 Discord 连接",
      regenerate: "重新生成",
      results: {
        settings_discord_binding_loaded: "Discord 连接已加载。",
        settings_discord_binding_unavailable: "Discord 绑定暂不可用。",
        settings_discord_code_canceled: "Discord 连接代码已取消。",
        settings_discord_code_cancel_failed: "Discord 连接代码无法取消。",
        settings_discord_code_created: "请在 Discord 中使用此代码连接账户。",
        settings_discord_code_create_failed: "Discord 连接代码无法创建。",
        settings_discord_unbound: "Discord 已断开。",
        settings_discord_unbind_failed: "Discord 账户无法断开。",
        settings_unauthorized: "请先登录再更改设置。",
      },
      unbind: "解绑",
    },
    languageLabel: "语言",
    languageOptions: {
      english: "English",
      simplifiedChinese: "简体中文",
      system: "使用系统设置",
    },
    languageSupport: "部分翻译尚未完成，且由机器翻译。",
    notifications: {
      preferencesLoadFailed: "设置不可用",
      preferencesSaveFailed: "设置未保存",
    },
    results: {
      settings_preferences_unavailable: "设置暂不可用。",
      settings_preferences_save_failed: "设置无法保存。",
      settings_unauthorized: "请先登录再更改设置。",
    },
    themeLabel: "主题",
    themeOptions: {
      dark: "深色",
      light: "浅色",
      system: "使用系统设置",
    },
    timeFormatLabel: "时间格式",
    timeFormatOptions: {
      twelveHour: "12 小时制",
      twentyFourHour: "24 小时制",
    },
    title: "设置",
  },
  notifications: {
    actionFailed: "操作失败",
    notAvailableYet: "暂不可用",
    done: "完成",
    dismiss: "关闭通知",
  },
  dashboard: simplifiedChineseDashboardMessages,
  forms: simplifiedChineseFormMessages,
  ideas: simplifiedChineseIdeaMessages,
  memories: simplifiedChineseMemoryMessages,
  projects: simplifiedChineseProjectMessages,
  routines: simplifiedChineseRoutineMessages,
  versionStatus: {
    appVersion: "应用版本",
    databaseVersion: "数据库版本",
    expected: "预期",
    checking: "正在检查...",
    unavailable: "不可用",
    databaseUnavailable: "数据库版本不可用。",
  },
};

export function getAppMessages(language: SupportedLanguage): AppMessages {
  return language === "zh-CN" ? simplifiedChineseMessages : englishMessages;
}
