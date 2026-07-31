import type { SupportedLanguage } from "./languages";

type DesignMessagesDefinition = {
  preview: {
    title: string;
    description: string;
    themeTitle: string;
    themeDescription: string;
    languageTitle: string;
    languageDescription: string;
    light: string;
    dark: string;
    english: string;
    simplifiedChinese: string;
  };
  tabs: {
    ariaLabel: string;
    colors: string;
    buttons: string;
  };
  colors: {
    title: string;
    description: string;
    paletteTitle: string;
    paletteDescription: string;
    states: {
      default: string;
      hover: string;
      disabled: string;
    };
    unavailable: string;
    tokens: {
      page: string;
      panel: string;
      panelHeader: string;
      primaryButton: string;
      secondaryButton: string;
      textInput: string;
    };
    semanticTitle: string;
    semanticDescription: string;
    semanticTones: {
      neutral: {
        label: string;
        usage: string;
      };
      blue: {
        label: string;
        usage: string;
      };
      emerald: {
        label: string;
        usage: string;
      };
      red: {
        label: string;
        usage: string;
      };
    };
  };
  buttons: {
    title: string;
    description: string;
    tones: {
      primary: {
        title: string;
        description: string;
      };
      secondary: {
        title: string;
        description: string;
      };
      ghost: {
        title: string;
        description: string;
      };
    };
    states: {
      normal: string;
      disabled: string;
    };
    examples: {
      withIcon: string;
      withoutIcon: string;
      iconOnly: string;
    };
  };
};

export const englishDesignMessages: DesignMessagesDefinition = {
  preview: {
    title: "Preview Controls",
    description: "Temporary theme and language inspection.",
    themeTitle: "Theme preview",
    themeDescription: "Applies a temporary light or dark workspace theme.",
    languageTitle: "Language preview",
    languageDescription: "Applies temporary labels for spacing review.",
    light: "Light",
    dark: "Dark",
    english: "English",
    simplifiedChinese: "简体中文",
  },
  tabs: {
    ariaLabel: "Design pages",
    colors: "Color",
    buttons: "Buttons",
  },
  colors: {
    title: "Color",
    description: "Background tokens used by shared components.",
    paletteTitle: "Background Tokens",
    paletteDescription:
      "Default, hover, and disabled backgrounds where each component family defines them.",
    states: {
      default: "Default",
      hover: "Hover",
      disabled: "Disabled",
    },
    unavailable: "N/A",
    tokens: {
      page: "Page",
      panel: "Panel",
      panelHeader: "Panel header",
      primaryButton: "Primary button",
      secondaryButton: "Secondary button",
      textInput: "Text input",
    },
    semanticTitle: "Semantic Tones",
    semanticDescription:
      "Current meaning and production usage for shared status colors.",
    semanticTones: {
      neutral: {
        label: "Neutral",
        usage:
          "Preserve operation badges in template previews; default tone for shared tags and inline messages.",
      },
      blue: {
        label: "Blue",
        usage:
          "Information notifications and update operation badges in template previews.",
      },
      emerald: {
        label: "Emerald",
        usage:
          "Success notifications and create operation badges in template previews.",
      },
      red: {
        label: "Red",
        usage:
          "Error notifications and delete operation badges in template previews.",
      },
    },
  },
  buttons: {
    title: "Buttons",
    description: "Command tones, icon rhythm, disabled state, and sizes.",
    tones: {
      primary: {
        title: "Primary",
        description: "Main actions and selected tab state.",
      },
      secondary: {
        title: "Secondary",
        description: "Normal actions, panel actions, and row controls.",
      },
      ghost: {
        title: "Ghost",
        description: "Low-emphasis icon and utility actions.",
      },
    },
    states: {
      normal: "Normal",
      disabled: "Disabled",
    },
    examples: {
      withIcon: "With icon",
      withoutIcon: "No icon",
      iconOnly: "Icon-only",
    },
  },
};

export type DesignMessages = DesignMessagesDefinition;

export const simplifiedChineseDesignMessages: DesignMessages = {
  preview: {
    title: "预览控制",
    description: "临时检查主题和语言。",
    themeTitle: "主题预览",
    themeDescription: "临时切换工作区的浅色或深色主题。",
    languageTitle: "语言预览",
    languageDescription: "临时切换标签语言以检查间距。",
    light: "浅色",
    dark: "深色",
    english: "English",
    simplifiedChinese: "简体中文",
  },
  tabs: {
    ariaLabel: "设计页面",
    colors: "颜色",
    buttons: "按钮",
  },
  colors: {
    title: "颜色",
    description: "共享组件使用的背景变量。",
    paletteTitle: "背景变量",
    paletteDescription:
      "展示每个组件族定义的默认、悬停和禁用背景。",
    states: {
      default: "默认",
      hover: "悬停",
      disabled: "禁用",
    },
    unavailable: "无",
    tokens: {
      page: "页面",
      panel: "面板",
      panelHeader: "面板标题栏",
      primaryButton: "主要按钮",
      secondaryButton: "次要按钮",
      textInput: "文本输入",
    },
    semanticTitle: "语义色",
    semanticDescription: "共享状态颜色当前的含义和生产使用位置。",
    semanticTones: {
      neutral: {
        label: "中性",
        usage: "模板预览中的保留操作徽标；共享标签和行内消息的默认色。",
      },
      blue: {
        label: "蓝色",
        usage: "信息通知，以及模板预览中的更新操作徽标。",
      },
      emerald: {
        label: "绿色",
        usage: "成功通知，以及模板预览中的创建操作徽标。",
      },
      red: {
        label: "红色",
        usage: "错误通知，以及模板预览中的删除操作徽标。",
      },
    },
  },
  buttons: {
    title: "按钮",
    description: "命令语气、图标节奏、禁用状态和尺寸。",
    tones: {
      primary: {
        title: "主要",
        description: "主操作和选中的标签页状态。",
      },
      secondary: {
        title: "次要",
        description: "普通操作、面板操作和列表行控件。",
      },
      ghost: {
        title: "幽灵按钮",
        description: "低强调的图标和工具操作。",
      },
    },
    states: {
      normal: "普通",
      disabled: "禁用",
    },
    examples: {
      withIcon: "带图标",
      withoutIcon: "无图标",
      iconOnly: "仅图标",
    },
  },
};

export function getDesignMessages(language: SupportedLanguage) {
  return language === "zh-CN"
    ? simplifiedChineseDesignMessages
    : englishDesignMessages;
}
