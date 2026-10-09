import type { PageHelpContent } from "../components/page-help";

export const englishPageHelpMessages = {
  open: "Page information",
  close: "Close page information",
  pages: {
    login: {
      title: "Sign in",
      summary: "Open your personal workspace, or explore with the shared demo account.",
      sections: [
        { title: "Your account", body: "Enter your username and password, then choose Sign in. Switch to Sign up to create your own workspace." },
        { title: "Try demo", body: "Try demo signs into a real shared account without asking you to enter credentials. Other visitors use the same workspace and can see or change its data. Do not add private information." },
        { title: "Password changes", body: "After signing in, open Settings > Account to change your password using your current password." },
      ],
    },
    register: {
      title: "Sign up",
      summary: "Create your own workspace, or try the shared demo first.",
      sections: [
        { title: "Create an account", body: "Choose a username and enter the same password twice. Display name is optional. Passwords use 8–32 visible ASCII characters without spaces." },
        { title: "Explore first", body: "Try demo opens the shared demo account without creating a new account. Your unfinished registration stays unchanged if demo sign-in fails. Never put private information in the demo workspace." },
      ],
    },
    dashboard: {
      title: "Today",
      summary: "Work through today's tasks, flexible routines, and fixed events.",
      sections: [
        { title: "Tasks and routines", body: "Check an item when it is done. Available scheduling actions let you postpone flexible work; Tomorrow moves it to the next day. Completed items remain visible for today's review." },
        { title: "Fixed events", body: "Events represent appointments or other fixed commitments. Change their timing or cancel them from Events instead of treating them like flexible tasks." },
        { title: "Experiences", body: "Pinned memories and suggestions offer experiences to revisit. They are suggestions, not overdue commitments." },
      ],
    },
    daily: {
      title: "Progress",
      summary: "Record work, study, and exercise durations, then review the last seven days.",
      sections: [
        { title: "Record time", body: "Choose Work, Study, or Exercise and enter the minutes spent. You can adjust the recorded time and add a note. These records do not complete project tasks." },
        { title: "Weekly progress", body: "The bar chart shows daily totals in your configured timezone, from six days ago on the left to Today on the right. Select a day to review or edit its records. Older records remain stored." },
      ],
    },
    money: {
      title: "Money", summary: "Record expenses and review daily or monthly totals without currency conversion.",
      sections: [
        { title: "Capture", body: "Open New expense, choose a category, enter an amount and save. Other offers custom categories; their order can be managed without changing the fixed defaults." },
        { title: "Currencies", body: "Reorder your preferred currencies; the first is the default for new records. Other supported currencies remain available. Totals stay separate by currency." },
      ],
    },
    supplies: {
      title: "Supplies", summary: "Track remaining food and household supplies, and plan purchases abroad.",
      sections: [
        { title: "Stock", body: "New items use an approximate 0–5 scale, starting at 5. Click or drag the bar to update the remaining level. Red items appear first, then amber, then blue. Existing physical quantities stay unchanged." },
        { title: "Travel shopping", body: "The collapsed travel wishlist keeps optional links and purchase status. Marking purchased does not change stock or expenses." },
      ],
    },
    projects: {
      title: "Projects",
      summary: "Organize long-term goals into milestones and actionable tasks.",
      sections: [
        { title: "Create and open", body: "Add a project with its dates and description. Open a project from the list to review its milestones and tasks." },
        { title: "Keep goals accessible", body: "Pin a project to make it available in sidebar shortcuts. Page controls let you move through longer lists." },
      ],
    },
    project: {
      title: "Project details",
      summary: "Review one project's milestones, tasks, and progress.",
      sections: [
        { title: "Milestones and tasks", body: "Organize related tasks under milestones. Select a milestone to focus on that part of the project; use the title navigation to return to the project list or switch projects." },
        { title: "Today's plan", body: "Task dates and Today selections determine which work appears on Today. Mark finished tasks complete, or use available scheduling actions for unfinished work." },
      ],
    },
    milestone: {
      title: "Milestone details",
      summary: "Focus on the tasks that make up one project milestone.",
      sections: [
        { title: "Work within a milestone", body: "Add or edit tasks, review dates, and check completed work. Task progress contributes to the surrounding project's progress." },
        { title: "Navigate", body: "Use the project title navigation to return to the project overview. Milestone management lets you update the milestone's own details." },
      ],
    },
    routines: {
      title: "Routines",
      summary: "Define repeatable work and manage its individual scheduled instances.",
      sections: [
        { title: "Definitions and instances", body: "A definition stores the routine and repeat rule. Instances are individual scheduled dates. Editing a definition and completing an instance are separate actions." },
        { title: "Flexible work", body: "Complete a routine when it is done, or use available skip and scheduling actions. Routine work can be moved or made up, unlike a fixed appointment." },
        { title: "Filters and groups", body: "All shows every date. Recent covers yesterday through three days after today; Future starts four days ahead; Past ends two days before today. Groups narrow related routines. Each list has its own page controls." },
      ],
    },
    events: {
      title: "Events",
      summary: "Keep appointments and fixed commitments separate from flexible work.",
      sections: [
        { title: "Definitions and instances", body: "Create a once, daily, or weekly event definition with its timing and location. Instances represent individual appointments. Group related definitions even when their locations differ." },
        { title: "Change a commitment", body: "Reschedule or cancel the relevant instance when plans change. Events do not have a routine-style Tomorrow action." },
        { title: "Find a date", body: "Recent covers yesterday through three days after today; Future starts four days ahead; Past ends two days before today. All removes the date restriction. Groups and page controls help narrow long lists." },
      ],
    },
    memories: {
      title: "Memories",
      summary: "Save experiences worth returning to, without turning them into obligations.",
      sections: [
        { title: "Capture an experience", body: "Add a memory with a title and useful details. Use groups to organize related experiences, and edit an entry when those details change." },
        { title: "Revisit", body: "Pin useful memories so they are easy to find on Today. Memories can be suggested again; they do not become overdue tasks." },
      ],
    },
    ideas: {
      title: "Ideas",
      summary: "Capture thoughts now and return to them when you have time.",
      sections: [
        { title: "Capture and revise", body: "Add an idea from the page, then edit or delete it as your thinking changes. Ideas captured through Discord also appear here." },
        { title: "Browse", body: "Use the page controls to browse longer lists. Turning ideas into other kinds of work is a future workflow, not an automatic action here." },
      ],
    },
    settings: {
      title: "Settings",
      summary: "Manage account access, display preferences, and connected services.",
      sections: [
        { title: "Account", body: "Change your display name or password. Password changes require your current password; existing signed-in sessions remain active. Sign out ends this browser's session." },
        { title: "Preferences", body: "Choose your theme, language, timezone, and time format. Changes apply to the workspace. Chinese is an opt-in translation." },
        { title: "Discord", body: "Generate a binding code and follow the shown instructions to connect Discord. Send a test message to check the connection." },
      ],
    },
    design: {
      title: "Design",
      summary: "Review the shared components in both themes and languages.",
      sections: [
        { title: "Component views", body: "Switch among the available component tabs to compare colors, buttons, text, and spacing states." },
        { title: "Preview", body: "Theme and language previews apply across this page. Your previous browser preferences are restored when you leave Design. This page is available only with administrator Developer mode enabled." },
      ],
    },
  } satisfies Record<string, PageHelpContent>,
};

export type PageHelpKey = keyof typeof englishPageHelpMessages.pages;

export const simplifiedChinesePageHelpMessages: typeof englishPageHelpMessages = {
  open: "页面说明",
  close: "关闭页面说明",
  pages: {
    login: {
      title: "登录",
      summary: "打开个人工作区，或通过共享演示账户体验。",
      sections: [
        { title: "个人账户", body: "输入用户名和密码后选择登录。切换到注册可以创建自己的工作区。" },
        { title: "体验演示", body: "体验演示会直接登录真实的共享账户，无需输入凭据。其他访客也能查看和修改该工作区的数据，请勿添加私人信息。" },
        { title: "更改密码", body: "登录后打开设置中的账户区域，使用当前密码更改密码。" },
      ],
    },
    register: {
      title: "注册",
      summary: "创建自己的工作区，或先体验共享演示。",
      sections: [
        { title: "创建账户", body: "选择用户名并输入两次相同的密码，显示名称可以留空。密码需包含 8–32 个可见 ASCII 字符，且不含空格。" },
        { title: "先体验", body: "体验演示会打开共享演示账户，不会创建新账户。演示登录失败时，未完成的注册内容保持不变。请勿在演示工作区填写私人信息。" },
      ],
    },
    dashboard: {
      title: "今日",
      summary: "处理今天的任务、可调整的例行事项和固定日程。",
      sections: [
        { title: "任务和例行事项", body: "完成后勾选对应条目。可用的排期操作可以推迟灵活安排的工作，明天会将其移至下一天。已完成条目仍保留在今日页面，方便回顾。" },
        { title: "固定日程", body: "日程代表预约或其他固定承诺。需要调整时，请到日程页面更改时间或取消，而不是像灵活任务一样推迟。" },
        { title: "体验", body: "置顶记忆和推荐可以帮助重温体验。它们是建议，不是会逾期的承诺。" },
      ],
    },
    daily: {
      title: "进步",
      summary: "记录工作、学习和运动的时长，并回顾最近七天。",
      sections: [
        { title: "记录时长", body: "选择工作、学习或运动，填写投入的分钟数。可以调整记录时间并添加备注。这些记录不会自动完成项目任务。" },
        { title: "每周进步", body: "柱状图按当前时区显示每日总时长，从左侧的六天前到右侧的今天。选择某一天可查看或编辑记录。更早的记录仍然保留。" },
      ],
    },
    money: {
      title: "财务", summary: "记录支出并查看每日或每月总额，不进行货币转换。",
      sections: [
        { title: "记录支出", body: "打开新增支出，选择分类并输入金额后保存。其他选项提供自定义分类，可调整它们的顺序，不会改变固定的默认分类。" },
        { title: "货币", body: "调整常用货币顺序，第一项是新记录的默认货币。其他支持的货币仍可使用，不同货币分别计算总额。" },
      ],
    },
    supplies: {
      title: "物资", summary: "记录食品和日用品的剩余量，并计划海外采购。",
      sections: [
        { title: "余量", body: "新物资使用固定的 0–5 近似余量，初始值为 5。点击或拖动进度条即可更新。列表依次显示红色、琥珀色和蓝色项目，已有的实际数量保持不变。" },
        { title: "旅行购物", body: "折叠的旅行购物清单保留可选关联和采购状态。标记已购买不会修改物资余量或支出。" },
      ],
    },
    projects: {
      title: "项目",
      summary: "将长期目标整理为里程碑和可执行任务。",
      sections: [
        { title: "创建和打开", body: "添加项目并填写日期和说明。从列表打开项目，可以查看里程碑和任务。" },
        { title: "快速访问", body: "置顶项目后可从侧栏快捷访问。列表较长时，使用分页控件浏览。" },
      ],
    },
    project: {
      title: "项目详情",
      summary: "查看一个项目的里程碑、任务和进度。",
      sections: [
        { title: "里程碑和任务", body: "将相关任务归入里程碑。选择里程碑以专注查看该部分，使用标题导航返回项目列表或切换项目。" },
        { title: "今日计划", body: "任务日期和今日选择决定哪些工作出现在今日页面。完成后勾选任务，未完成的工作可以使用可用的排期操作。" },
      ],
    },
    milestone: {
      title: "里程碑详情",
      summary: "专注处理一个项目里程碑中的任务。",
      sections: [
        { title: "处理任务", body: "添加或编辑任务，查看日期并标记完成。任务进度会计入所属项目的进度。" },
        { title: "导航", body: "通过项目标题导航返回项目概览。里程碑管理可以更新里程碑自身的信息。" },
      ],
    },
    routines: {
      title: "日常",
      summary: "定义重复工作，并管理每一次安排的实例。",
      sections: [
        { title: "定义和实例", body: "定义保存例行事项和重复规则，实例代表各个安排日期。编辑定义与完成实例是不同的操作。" },
        { title: "灵活安排", body: "完成后标记事项，也可以使用可用的跳过和排期操作。与固定预约不同，例行工作可以调整或补做。" },
        { title: "筛选和分组", body: "全部显示所有日期。近期包含昨天至今天之后第三天；未来从第四天后开始；过去截至前天。分组可以缩小到相关事项，每个列表有独立的分页控件。" },
      ],
    },
    events: {
      title: "事件",
      summary: "将预约和固定承诺与灵活工作区分开。",
      sections: [
        { title: "定义和实例", body: "创建单次、每天或每周重复的日程定义，并填写时间和地点。实例代表一次具体预约，即使地点不同，也可以将相关定义归为一组。" },
        { title: "计划变化", body: "计划变化时，改期或取消对应实例。日程没有例行事项式的明天操作。" },
        { title: "查找日期", body: "近期包含昨天至今天之后第三天；未来从第四天后开始；过去截至前天。全部取消日期限制，分组和分页控件有助于查找较长列表。" },
      ],
    },
    memories: {
      title: "回忆",
      summary: "保存值得重温的体验，而不是增加待办义务。",
      sections: [
        { title: "记录体验", body: "添加记忆并填写标题和有用信息。通过分组整理相关体验，信息变化时可以编辑条目。" },
        { title: "重温", body: "置顶有用的记忆，便于在今日页面找到。记忆可以再次被推荐，但不会成为逾期任务。" },
      ],
    },
    ideas: {
      title: "想法",
      summary: "先记录想法，有时间时再回顾。",
      sections: [
        { title: "记录和修改", body: "从页面添加想法，思路变化后可编辑或删除。通过 Discord 记录的想法也会出现在这里。" },
        { title: "浏览", body: "使用分页控件浏览较长列表。将想法转为其他工作类型属于未来流程，不会在这里自动执行。" },
      ],
    },
    settings: {
      title: "设置",
      summary: "管理账户访问、显示偏好和已连接的服务。",
      sections: [
        { title: "账户", body: "更改显示名称或密码。更改密码需要当前密码，已有登录会话仍保持有效。退出登录会结束当前浏览器的会话。" },
        { title: "偏好", body: "选择主题、语言、时区和时间格式，更改将应用于工作区。中文翻译需要手动选择。" },
        { title: "Discord", body: "生成绑定码并按照显示的说明连接 Discord，发送测试消息以检查连接。" },
      ],
    },
    design: {
      title: "设计",
      summary: "在两种主题和语言中检查共享组件。",
      sections: [
        { title: "组件视图", body: "切换可用组件标签，比较颜色、按钮、文字和间距状态。" },
        { title: "预览", body: "主题和语言预览会应用于整个页面。离开设计页面时恢复之前的浏览器偏好，此页面仅在管理员开启开发者模式后可用。" },
      ],
    },
  },
};
