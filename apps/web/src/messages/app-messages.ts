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
        settings_discord_code_canceled: "Discord binding code canceled.",
        settings_discord_code_created:
          "Use the code in Discord to connect your account.",
        settings_discord_test_no_binding: "No active Discord binding.",
        settings_discord_test_sent: "Check your Discord DM.",
        settings_discord_unbound: "Discord unbound.",
        settings_unauthorized: "Sign in before changing settings.",
      },
      sendTest: "Send Test",
      title: "Discord Binding",
      unbind: "Unbind",
      viewAccountId: "View",
    },
    developerImport: {
      ambiguousInputMessage:
        "Paste either project templates or routine templates, not both.",
      copyProjectTemplate: "Copy Project Template",
      copyRoutineTemplate: "Copy Routine Template",
      description: "Paste your project or routine templates to import.",
      emptyInputMessage: "Paste a project or routine template first.",
      emptyInputTitle: "Template missing",
      failedFallbackMessage: "The import tool could not process this template.",
      failedTitle: "Import tool failed",
      import: "Import",
      importing: "Importing...",
      importSuccessTitle: "Import complete",
      inputLabel: "Template",
      inputPlaceholder: "Paste Markdown or canonical JSON here.",
      parse: "Parse",
      parsing: "Parsing...",
      parseSuccessMessage: "Template is valid.",
      parseSuccessTitle: "Template parsed",
      projectImportSuccessMessage: "Project imported.",
      resultTitle: "Result",
      routineImportSuccessMessage: "Routine imported.",
      templateCopiedMessage: "Prompt copied to clipboard.",
      templateCopiedTitle: "Template copied",
      templateCopyFailedMessage: "Template prompt could not be copied.",
      templateCopyFailedTitle: "Template not copied",
      title: "Import from Templates",
      unknownInputMessage:
        "Start the template with Project: or Routine:, or paste matching JSON.",
      unknownInputTitle: "Template type unknown",
    },
    developerTools: {
      avg: "Avg",
      copyMarkdown: "Copy Markdown",
      lastRun: (sampleCount: number, measuredAt: string) =>
        `Last run: ${sampleCount} samples · ${measuredAt}`,
      latencyActionDescription: "Run 30 samples and show compact statistics.",
      latencyDescription:
        "Test latency between frontend, server, and database.",
      latencyTitle: "Latency Test",
      markdownTitle: (sampleCount: number, measuredAt: string) =>
        `Latency diagnostics, ${sampleCount} samples, ${measuredAt}`,
      max: "Max",
      metric: "Metric",
      metrics: {
        frontendBackendMs: "Frontend-Backend RTT",
        backendDatabaseMs: "Backend-Database RTT",
      },
      min: "Min",
      notifications: {
        latencyFailed: "Latency test failed.",
        reportCopied: "Latency report copied.",
        reportCopyFailed: "Report not copied.",
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
    },
    developerModeDescription: "Show developer tools in Settings.",
    developerModeTitle: "Developer Mode",
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
    actionFailedTitle: (action: string, subject: string) =>
      `${action} ${subject.toLowerCase()} failed`,
    actionWords: {
      add: "Add",
      archive: "Archive",
      delete: "Delete",
      edit: "Edit",
      pin: "Pin",
      saving: "Saving",
      save: "Save",
      unpin: "Unpin",
      update: "Update",
    },
    subjectWords: {
      category: "Category",
      discord: "Discord",
      group: "Group",
      idea: "Idea",
      memory: "Memory",
      milestone: "Milestone",
      project: "Project",
      routine: "Routine",
      settings: "Settings",
      suggestion: "Suggestion",
      task: "Task",
    },
    fieldWords: {
      category: "category",
      category_name: "name",
      date: "date",
      dates: "dates",
      deadline: "deadline",
      description: "description",
      end_date: "end date",
      expected_duration: "expected duration",
      first_start_date: "first start date",
      group: "group",
      name: "name",
      objective: "objective",
      preferred_time: "preferred time",
      rule: "rule",
      start_date: "start date",
      text: "text",
      timezone: "timezone",
      title: "title",
    },
    parameterFailureMessages: {
      beforeStart: (field: string, startField: string) =>
        `${field} cannot be before ${startField}.`,
      chooseRequired: (field: string) => `Choose ${field}.`,
      duplicateName: (subject: string) =>
        `A ${subject} with that name already exists.`,
      inUse: (subject: string) => `This ${subject} is still in use.`,
      invalidFormatDate: (field: string) =>
        `${field} must be a real date in YYYY-MM-DD format.`,
      invalidFormatTime: (field: string) =>
        `${field} must use HH:MM format.`,
      invalidValue: (field: string) => `${field} is invalid.`,
      limitReached: (action: string, subject: string, limit?: number) =>
        limit === undefined
          ? `${action} ${subject} limit reached.`
          : `You can ${action} up to ${limit} ${subject}s.`,
      protected: (subject: string) => `This ${subject} is protected.`,
      required: (field: string) => `${field} is required.`,
      selectRequired: (field: string) => `Select ${field}.`,
      tooLong: (field: string, limit?: number) =>
        limit === undefined
          ? `${field} is too long.`
          : `${field} must be ${limit} characters or fewer.`,
      tooShort: (field: string, limit?: number) =>
        limit === undefined
          ? `${field} is too short.`
          : `${field} must be at least ${limit} characters.`,
    },
    databaseConnectionFailedMessage:
      "Database connection failed. Please try again.",
    databaseConnectionFailedTitle: "Database connection failed",
    databaseUpdateFailedMessage: "Database update failed. Please try again.",
    databaseUpdateFailedTitle: "Database update failed",
    invalidParameterMessage: "A parameter is invalid.",
    invalidParameterTitle: "Parameter invalid",
    missingParameterMessage: "A required parameter is missing.",
    missingParameterTitle: "Parameter missing",
    serverActionFailedMessage:
      "The server hit an internal error. Please try again.",
    serverActionFailedTitle: "Server error",
    targetNotFoundMessage: "The requested item was not found.",
    targetNotFoundTitle: "Target not found",
    notAvailableYet: "Not available yet",
    operationTooFrequentMessage: "Please wait before trying again.",
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
        settings_discord_code_canceled: "Discord 绑定代码已取消。",
        settings_discord_code_created: "请在 Discord 中使用此代码连接账户。",
        settings_discord_test_no_binding: "没有有效的 Discord 绑定。",
        settings_discord_test_sent: "请检查你的 Discord 私信。",
        settings_discord_unbound: "Discord 已解绑。",
        settings_unauthorized: "请先登录再更改设置。",
      },
      sendTest: "发送测试",
      title: "Discord 绑定",
      unbind: "解绑",
      viewAccountId: "查看",
    },
    developerImport: {
      ambiguousInputMessage: "请只粘贴项目模板或日常模板，不要混在一起。",
      copyProjectTemplate: "复制项目模板",
      copyRoutineTemplate: "复制日常模板",
      description: "粘贴项目或日常模板来导入。",
      emptyInputMessage: "请先粘贴项目或日常模板。",
      emptyInputTitle: "缺少模板",
      failedFallbackMessage: "无法处理这个模板。",
      failedTitle: "导入失败",
      import: "导入",
      importing: "正在导入...",
      importSuccessTitle: "导入完成",
      inputLabel: "模板",
      inputPlaceholder: "在这里粘贴 Markdown 或标准 JSON。",
      parse: "解析",
      parsing: "正在解析...",
      parseSuccessMessage: "模板有效。",
      parseSuccessTitle: "模板已解析",
      projectImportSuccessMessage: "项目已导入。",
      resultTitle: "结果",
      routineImportSuccessMessage: "日常已导入。",
      templateCopiedMessage: "提示词已复制到剪贴板。",
      templateCopiedTitle: "模板已复制",
      templateCopyFailedMessage: "模板提示词无法复制。",
      templateCopyFailedTitle: "模板未复制",
      title: "从模板导入",
      unknownInputMessage:
        "请以 Project: 或 Routine: 开始，或粘贴对应的 JSON。",
      unknownInputTitle: "无法判断模板类型",
    },
    developerTools: {
      avg: "平均",
      copyMarkdown: "复制 Markdown",
      lastRun: (sampleCount, measuredAt) =>
        `上次运行：${sampleCount} 次采样 · ${measuredAt}`,
      latencyActionDescription: "运行 30 次采样并显示简要统计。",
      latencyDescription: "测试前端、服务器与数据库之间的延迟。",
      latencyTitle: "延迟测试",
      markdownTitle: (sampleCount, measuredAt) =>
        `延迟诊断，${sampleCount} 次采样，${measuredAt}`,
      max: "最大",
      metric: "指标",
      metrics: {
        frontendBackendMs: "前端-后端 RTT",
        backendDatabaseMs: "后端-数据库 RTT",
      },
      min: "最小",
      notifications: {
        latencyFailed: "延迟测试失败",
        reportCopied: "延迟报告已复制",
        reportCopyFailed: "延迟报告复制失败",
      },
      p10: "P10",
      p50: "P50",
      p90: "P90",
      results: {
        performance_latency_copied: "Markdown 报告已复制。",
        performance_latency_copy_failed: "Markdown 报告复制失败。",
        performance_latency_failed: "延迟诊断失败。",
      },
      testLatency: "测试延迟",
      testing: "正在测试...",
    },
    developerModeDescription: "在设置中显示开发者工具。",
    developerModeTitle: "开发者模式",
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
    actionFailedTitle: (action: string, subject: string) =>
      `${action} ${subject} 失败`,
    actionWords: {
      add: "添加",
      archive: "归档",
      delete: "删除",
      edit: "编辑",
      pin: "置顶",
      saving: "保存中",
      save: "保存",
      unpin: "取消置顶",
      update: "更新",
    },
    subjectWords: {
      category: "分类",
      discord: "Discord",
      group: "分组",
      idea: "想法",
      memory: "回忆",
      milestone: "里程碑",
      project: "项目",
      routine: "日常",
      settings: "设置",
      suggestion: "建议",
      task: "任务",
    },
    fieldWords: {
      category: "分类",
      category_name: "名称",
      date: "日期",
      dates: "日期",
      deadline: "截止日期",
      description: "描述",
      end_date: "结束日期",
      expected_duration: "预计持续时间",
      first_start_date: "首次开始日期",
      group: "分组",
      name: "名称",
      objective: "目标",
      preferred_time: "偏好时间",
      rule: "规则",
      start_date: "开始日期",
      text: "内容",
      timezone: "时区",
      title: "标题",
    },
    parameterFailureMessages: {
      beforeStart: (field: string, startField: string) =>
        `${field}不能早于${startField}。`,
      chooseRequired: (field: string) => `请选择${field}。`,
      duplicateName: (subject: string) => `同名${subject}已存在。`,
      inUse: (subject: string) => `这个${subject}仍在使用中。`,
      invalidFormatDate: (field: string) =>
        `${field}必须是真实日期，格式为 YYYY-MM-DD。`,
      invalidFormatTime: (field: string) =>
        `${field}必须使用 HH:MM 格式。`,
      invalidValue: (field: string) => `${field}无效。`,
      limitReached: (action: string, subject: string, limit?: number) =>
        limit === undefined
          ? `${action}${subject}已达到上限。`
          : `最多只能${action} ${limit} 个${subject}。`,
      protected: (subject: string) => `这个${subject}受保护。`,
      required: (field: string) => `${field}不能为空。`,
      selectRequired: (field: string) => `请选择${field}。`,
      tooLong: (field: string, limit?: number) =>
        limit === undefined
          ? `${field}过长。`
          : `${field}必须不超过 ${limit} 个字符。`,
      tooShort: (field: string, limit?: number) =>
        limit === undefined
          ? `${field}过短。`
          : `${field}至少需要 ${limit} 个字符。`,
    },
    databaseConnectionFailedMessage: "数据库连接失败，请稍后再试。",
    databaseConnectionFailedTitle: "数据库连接失败",
    databaseUpdateFailedMessage: "数据库更新失败，请稍后再试。",
    databaseUpdateFailedTitle: "数据库更新失败",
    invalidParameterMessage: "参数无效。",
    invalidParameterTitle: "参数无效",
    missingParameterMessage: "缺少必要参数。",
    missingParameterTitle: "缺少参数",
    serverActionFailedMessage: "服务器内部错误，请稍后再试。",
    serverActionFailedTitle: "服务器错误",
    targetNotFoundMessage: "没有找到请求的项目。",
    targetNotFoundTitle: "目标不存在",
    notAvailableYet: "暂不可用",
    operationTooFrequentMessage: "你的操作太频繁啦，先休息一下吧。",
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
