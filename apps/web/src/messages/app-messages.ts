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
    brandName: "Arctic Aria",
    closeNavigation: "Close navigation",
    closeNavigationOverlay: "Close navigation overlay",
    openNavigation: "Open navigation",
    workspace: "Workspace",
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
      signingOut: "Signing out",
    },
  },
  auth: {
    brandName: "Arctic Aria",
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
      signingIn: "Signing in",
      signUp: "Sign up",
      signingUp: "Signing up",
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
  },
  settings: {
    description: "Theme, language, and app information.",
    appInformationDescription: "Current app version.",
    appInformationTitle: "About",
    discord: {
      bind: "Bind",
      bindInstructionActive:
        "Send {command} to Arctic Aria in Discord in {status}.",
      bindInstructionExpired:
        "Send {command} to Arctic Aria in Discord. {status}",
      bound: "Bound account.",
      boundAccountId: (accountId: string) => `Bound Account ID: ${accountId}`,
      boundAccountIdLabel: "Bound Account ID",
      cancel: "Cancel",
      checkAgain: "Check Again",
      checkFailed: "Binding status unavailable.",
      checking: "Checking binding status...",
      closeUnbindConfirmation: "Close Discord disconnect confirmation",
      confirmUnbindDescription:
        "This unbinds Discord from this Arctic Aria account. You can bind it again later with a new code.",
      confirmUnbindTitle: "Unbind Discord?",
      description:
        "Bind Discord so Arctic Aria can receive ideas from you and send messages to you.",
      bindCodeRemaining: (minutes: number) =>
        minutes === 1 ? "1 minute" : `${minutes} minutes`,
      expired: "Expired",
      genericError: "Discord settings could not be updated.",
      hideAccountId: "Hide",
      label: "Discord",
      notConnected: "No bound account.",
      notifications: {
        codeCanceled: "Connection code canceled",
        codeCancelFailed: "Code not canceled",
        codeCreated: "Connection code created",
        codeCreateFailed: "Code not created",
        loadFailed: "Discord unavailable",
        testFailed: "Test message not sent",
        testSent: "Test message sent",
        unbound: "Discord disconnected",
        unbindFailed: "Discord not disconnected",
      },
      results: {
        settings_discord_binding_loaded: "Discord binding loaded.",
        settings_discord_binding_unavailable: "Discord binding is unavailable.",
        settings_discord_code_canceled: "Discord binding code canceled.",
        settings_discord_code_cancel_failed:
          "Discord binding code could not be canceled.",
        settings_discord_code_created:
          "Use the code in Discord to connect your account.",
        settings_discord_code_create_failed:
          "Discord connection code could not be created.",
        settings_discord_test_bot_unavailable:
          "Discord configuration is missing. Check the web server log.",
        settings_discord_test_config_missing:
          "Discord configuration is missing. Check the web server log.",
        settings_discord_test_delivery_failed:
          "Discord test message could not be delivered. Check the web server log for settings_test_message_handled.",
        settings_discord_test_no_binding: "No active Discord binding.",
        settings_discord_test_sent: "Check your Discord DM.",
        settings_discord_unbound: "Discord unbound.",
        settings_discord_unbind_failed:
          "Discord account could not be disconnected.",
        settings_unauthorized: "Sign in before changing settings.",
      },
      sendTest: "Send Test",
      title: "Discord Binding",
      unbind: "Unbind",
      viewAccountId: "View",
    },
    developerTools: {
      avg: "Avg",
      copyMarkdown: "Copy Markdown",
      description: "Production-safe diagnostics for the current app.",
      lastRun: (sampleCount: number, measuredAt: string) =>
        `Last run: ${sampleCount} samples · ${measuredAt}`,
      markdownTitle: (sampleCount: number, measuredAt: string) =>
        `Latency diagnostics, ${sampleCount} samples, ${measuredAt}`,
      max: "Max",
      metric: "Metric",
      metrics: {
        clientTotalMs: "Frontend -> Backend -> Database",
        databaseMs: "Backend -> Database",
        networkEstimateMs: "Frontend/backend overhead",
        serverTotalMs: "Backend handler",
      },
      min: "Min",
      notifications: {
        latencyFailed: "Latency test failed",
        reportCopied: "Latency report copied",
        reportCopyFailed: "Report not copied",
      },
      p10: "P10",
      p50: "P50",
      p90: "P90",
      results: {
        performance_latency_copied: "Markdown report copied.",
        performance_latency_copy_failed: "Markdown report could not be copied.",
        performance_latency_failed: "Latency diagnostics failed.",
      },
      testLatency: "Test Latency",
      testing: "Testing...",
      title: "Developer Tools",
      visibility: "Only visible to administrators.",
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
      settings_resolved_timezone_invalid: "Timezone could not be resolved.",
      settings_timezone_preferences_disabled:
        "Timezone preferences are not available yet.",
      settings_preferences_unavailable: "Settings are unavailable.",
      settings_preferences_save_failed: "Settings could not be saved.",
      settings_unauthorized: "Sign in before changing settings.",
    },
    preferencesDescription: "Display, language, and time preferences.",
    preferencesTitle: "Preferences",
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
    timeZoneLabel: "Timezone",
    timeZoneDescription: (timeZone: string, offset: string) =>
      `${timeZone} · ${offset}`,
    timeZoneSystemDescription: (timeZone: string, offset: string) =>
      `Browser timezone: ${timeZone} · ${offset}`,
    timeZoneOptions: {
      system: "Use system setting",
    },
    multipleTimezonesLabel: "Use multiple timezones",
    multipleTimezonesDescription:
      "For overseas meetings or routines coordinated with people in another timezone.",
    title: "Settings",
  },
  notifications: {
    actionFailed: "Action failed",
    notAvailableYet: "Not available yet",
    operationTooFrequentMessage: "Try again in a couple of seconds.",
    operationTooFrequentTitle: "Please wait a moment",
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
    brandName: "北极阿莉雅",
    closeNavigation: "关闭导航",
    closeNavigationOverlay: "关闭导航遮罩",
    openNavigation: "打开导航",
    workspace: "工作区",
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
      signingOut: "正在退出登录",
    },
  },
  auth: {
    brandName: "北极阿莉雅",
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
      signingIn: "正在登录",
      signUp: "注册",
      signingUp: "正在注册",
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
  },
  settings: {
    description: "主题、语言和应用信息。",
    appInformationDescription: "当前应用版本。",
    appInformationTitle: "关于",
    discord: {
      bind: "绑定",
      bindInstructionActive:
        "在 Discord 中向 Arctic Aria 发送 {command}，请在 {status}内完成。",
      bindInstructionExpired:
        "在 Discord 中向 Arctic Aria 发送 {command}。 {status}",
      bound: "已绑定账户。",
      boundAccountId: (accountId: string) => `已绑定账户 ID：${accountId}`,
      boundAccountIdLabel: "已绑定账户 ID",
      cancel: "取消",
      checkAgain: "重新检查",
      checkFailed: "绑定状态不可用。",
      checking: "正在检查绑定状态...",
      closeUnbindConfirmation: "关闭 Discord 断开确认",
      confirmUnbindDescription:
        "这会解除 Discord 与此 Arctic Aria 账户的绑定。之后可以使用新代码再次绑定。",
      confirmUnbindTitle: "解绑 Discord？",
      description:
        "绑定 Discord 后，Arctic Aria 可以接收你的想法并向你发送消息。",
      bindCodeRemaining: (minutes: number) => `${minutes} 分钟`,
      expired: "已过期",
      genericError: "Discord 设置无法更新。",
      hideAccountId: "隐藏",
      label: "Discord",
      notConnected: "没有绑定账户。",
      notifications: {
        codeCanceled: "连接代码已取消",
        codeCancelFailed: "代码未取消",
        codeCreated: "连接代码已创建",
        codeCreateFailed: "代码未创建",
        loadFailed: "Discord 不可用",
        testFailed: "测试消息未发送",
        testSent: "测试消息已发送",
        unbound: "Discord 已断开",
        unbindFailed: "Discord 未断开",
      },
      results: {
        settings_discord_binding_loaded: "Discord 绑定已加载。",
        settings_discord_binding_unavailable: "Discord 绑定暂不可用。",
        settings_discord_code_canceled: "Discord 绑定代码已取消。",
        settings_discord_code_cancel_failed: "Discord 绑定代码无法取消。",
        settings_discord_code_created: "请在 Discord 中使用此代码连接账户。",
        settings_discord_code_create_failed: "Discord 连接代码无法创建。",
        settings_discord_test_bot_unavailable:
          "Discord 配置缺失。请检查 web 服务器日志。",
        settings_discord_test_config_missing:
          "Discord 配置缺失。请检查 web 服务器日志。",
        settings_discord_test_delivery_failed:
          "Discord 测试消息无法送达。请检查 web 服务器日志中的 settings_test_message_handled。",
        settings_discord_test_no_binding: "没有有效的 Discord 绑定。",
        settings_discord_test_sent: "请检查你的 Discord 私信。",
        settings_discord_unbound: "Discord 已解绑。",
        settings_discord_unbind_failed: "Discord 账户无法断开。",
        settings_unauthorized: "请先登录再更改设置。",
      },
      sendTest: "发送测试",
      title: "Discord 绑定",
      unbind: "解绑",
      viewAccountId: "查看",
    },
    developerTools: {
      avg: "平均",
      copyMarkdown: "复制 Markdown",
      description: "当前应用的生产安全诊断。",
      lastRun: (sampleCount, measuredAt) =>
        `上次运行：${sampleCount} 次采样 · ${measuredAt}`,
      markdownTitle: (sampleCount, measuredAt) =>
        `延迟诊断，${sampleCount} 次采样，${measuredAt}`,
      max: "最大",
      metric: "指标",
      metrics: {
        clientTotalMs: "前端 -> 后端 -> 数据库",
        databaseMs: "后端 -> 数据库",
        networkEstimateMs: "前端/后端开销估算",
        serverTotalMs: "后端处理",
      },
      min: "最小",
      notifications: {
        latencyFailed: "延迟测试失败",
        reportCopied: "延迟报告已复制",
        reportCopyFailed: "报告未复制",
      },
      p10: "P10",
      p50: "P50",
      p90: "P90",
      results: {
        performance_latency_copied: "Markdown 报告已复制。",
        performance_latency_copy_failed: "Markdown 报告无法复制。",
        performance_latency_failed: "延迟诊断失败。",
      },
      testLatency: "测试延迟",
      testing: "正在测试...",
      title: "开发者工具",
      visibility: "仅管理员可见。",
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
      settings_resolved_timezone_invalid: "无法识别当前时区。",
      settings_timezone_preferences_disabled: "时区偏好暂不可用。",
      settings_preferences_unavailable: "设置暂不可用。",
      settings_preferences_save_failed: "设置无法保存。",
      settings_unauthorized: "请先登录再更改设置。",
    },
    preferencesDescription: "显示、语言和时间偏好。",
    preferencesTitle: "偏好设置",
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
    timeZoneLabel: "时区",
    timeZoneDescription: (timeZone, offset) => `${timeZone} · ${offset}`,
    timeZoneSystemDescription: (timeZone, offset) =>
      `浏览器时区：${timeZone} · ${offset}`,
    timeZoneOptions: {
      system: "使用系统设置",
    },
    multipleTimezonesLabel: "使用多个时区",
    multipleTimezonesDescription:
      "适合海外会议，或需要和不同时区的人一起安排的日常。",
    title: "设置",
  },
  notifications: {
    actionFailed: "操作失败",
    notAvailableYet: "暂不可用",
    operationTooFrequentMessage: "请过几秒再试。",
    operationTooFrequentTitle: "请稍等一下",
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
