type IdeaMessageSource = "web" | "discord" | "mobile" | "agent";

type IdeaPrototypeItem = {
  id: string;
  rawText: string;
  source: IdeaMessageSource;
  createdDate: string;
};

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
    prototypeLabel: string;
    prototypeItems: IdeaPrototypeItem[];
  };
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
    prototypeLabel: "Prototype",
    prototypeItems: [
      {
        id: "idea-prototype-1",
        rawText: "Check visa document checklist before the next appointment.",
        source: "discord",
        createdDate: "2026-07-17",
      },
      {
        id: "idea-prototype-2",
        rawText:
          "Turn the final exam preparation notes into a reusable study project.",
        source: "web",
        createdDate: "2026-07-17",
      },
    ],
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
    prototypeLabel: "原型",
    prototypeItems: [
      {
        id: "idea-prototype-1",
        rawText: "下次预约前检查签证材料清单。",
        source: "discord",
        createdDate: "2026-07-17",
      },
      {
        id: "idea-prototype-2",
        rawText: "把期末考试复习笔记整理成可复用的学习项目。",
        source: "web",
        createdDate: "2026-07-17",
      },
    ],
  },
};
