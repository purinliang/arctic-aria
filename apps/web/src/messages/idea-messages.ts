export const englishIdeaMessages = {
  page: {
    title: "Ideas",
    description: "Captured thoughts waiting for review.",
    emptyTitle: "No ideas yet",
    emptyDescription:
      "Future Discord /idea captures and web quick notes will appear here.",
    sourceDiscord: "Discord",
    sourceWeb: "Web",
    statusUntriaged: "Untriaged",
    prototypeLabel: "Prototype",
    prototypeItems: [
      {
        id: "idea-prototype-1",
        rawText: "Check visa document checklist before the next appointment.",
        source: "discord",
        createdLabel: "Jul 17, 2026 Fri",
      },
      {
        id: "idea-prototype-2",
        rawText:
          "Turn the final exam preparation notes into a reusable study project.",
        source: "web",
        createdLabel: "Jul 17, 2026 Fri",
      },
    ],
  },
};

export type IdeaMessages = typeof englishIdeaMessages;

export const simplifiedChineseIdeaMessages: IdeaMessages = {
  page: {
    title: "想法",
    description: "等待整理的临时想法。",
    emptyTitle: "还没有想法",
    emptyDescription: "未来的 Discord /idea 和网页快速记录会显示在这里。",
    sourceDiscord: "Discord",
    sourceWeb: "网页",
    statusUntriaged: "未整理",
    prototypeLabel: "原型",
    prototypeItems: [
      {
        id: "idea-prototype-1",
        rawText: "下次预约前检查签证材料清单。",
        source: "discord",
        createdLabel: "2026年7月17日 星期五",
      },
      {
        id: "idea-prototype-2",
        rawText: "把期末考试复习笔记整理成可复用的学习项目。",
        source: "web",
        createdLabel: "2026年7月17日 星期五",
      },
    ],
  },
};
