type IdeaMessagesDefinition = {
  page: {
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    loading: string;
    sourceAgent: string;
    sourceDiscord: string;
    sourceMobile: string;
    sourceWeb: string;
    statusUntriaged: string;
    new: string;
    edit: string;
  };
  editor: {
    add: string;
    edit: string;
    close: string;
    idea: string;
    placeholder: string;
    save: string;
    saving: string;
    delete: string;
  };
  confirm: {
    title: string;
    description: (idea: string) => string;
    fallbackIdea: string;
    cancel: string;
    confirm: string;
    deleting: string;
    close: string;
  };
  results: Record<string, string>;
};

export const englishIdeaMessages: IdeaMessagesDefinition = {
  page: {
    title: "Ideas",
    description: "Captured thoughts waiting for review.",
    emptyTitle: "No ideas yet",
    emptyDescription:
      "Future Discord /idea captures and web quick notes will appear here.",
    loading: "Loading ideas...",
    sourceAgent: "Agent",
    sourceDiscord: "Discord",
    sourceMobile: "Mobile",
    sourceWeb: "Web",
    statusUntriaged: "Untriaged",
    new: "New",
    edit: "Edit",
  },
  editor: {
    add: "Add Idea",
    edit: "Edit Idea",
    close: "Close idea editor",
    idea: "Idea",
    placeholder: "Capture the thought before deciding what it becomes.",
    save: "Save",
    saving: "Saving",
    delete: "Delete",
  },
  confirm: {
    title: "Delete Idea",
    description: (idea) => `Delete "${idea}"?`,
    fallbackIdea: "this idea",
    cancel: "Cancel",
    confirm: "Delete",
    deleting: "Deleting...",
    close: "Close delete confirmation",
  },
  results: {
    auth_required: "Please sign in again.",
    idea_text_required: "Idea can't be empty.",
    idea_text_too_long: "Idea must be 2000 characters or fewer.",
    idea_not_found: "Idea was not found.",
  },
};

export type IdeaMessages = IdeaMessagesDefinition;

export const simplifiedChineseIdeaMessages: IdeaMessages = {
  page: {
    title: "想法",
    description: "等待整理的临时想法。",
    emptyTitle: "还没有想法",
    emptyDescription: "未来的 Discord /idea 和网页快速记录会显示在这里。",
    loading: "正在加载想法...",
    sourceAgent: "智能助手",
    sourceDiscord: "Discord",
    sourceMobile: "手机",
    sourceWeb: "网页",
    statusUntriaged: "未整理",
    new: "新建",
    edit: "编辑",
  },
  editor: {
    add: "新建想法",
    edit: "编辑想法",
    close: "关闭想法编辑器",
    idea: "想法",
    placeholder: "先记录下来，之后再决定它应该变成什么。",
    save: "保存",
    saving: "正在保存",
    delete: "删除",
  },
  confirm: {
    title: "删除想法",
    description: (idea) => `删除“${idea}”？`,
    fallbackIdea: "这个想法",
    cancel: "取消",
    confirm: "删除",
    deleting: "正在删除...",
    close: "关闭删除确认",
  },
  results: {
    auth_required: "请重新登录。",
    idea_text_required: "想法不能为空。",
    idea_text_too_long: "想法不能超过 2000 个字符。",
    idea_not_found: "没有找到这个想法。",
  },
};
