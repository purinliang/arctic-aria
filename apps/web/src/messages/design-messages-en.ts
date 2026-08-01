import type { DesignMessages } from "./design-message-types";

export const englishDesignMessages: DesignMessages = {
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
    typography: "Typography",
    spacing: "Spacing",
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
  typography: {
    title: "Typography",
    description:
      "Composable text size, weight, tone, and language line-height tokens.",
    sizesTitle: "Sizes",
    sizesDescription: "Product text sizes and their default line-height.",
    weightsTitle: "Weights",
    weightsDescription: "Allowed product font weights.",
    tonesTitle: "Tones",
    tonesDescription: "Primary, secondary, inverse, and inherited text color.",
    languageTitle: "Language Rhythm",
    languageDescription:
      "English and Chinese samples use the same API with language-aware line-height tokens.",
    sampleTitle: "Sample title",
    sampleDescription:
      "Description text explains the surrounding content without becoming a new heading.",
    sampleSupport: "Supporting metadata · Secondary detail",
    sizeLabels: {
      xs: "Extra small",
      sm: "Small",
      md: "Medium",
      lg: "Large",
      xl: "Extra large",
      page: "Page",
    },
    weightLabels: {
      light: "Light",
      normal: "Normal",
      medium: "Medium",
      semibold: "Semibold",
    },
    toneLabels: {
      primary: "Primary",
      secondary: "Secondary",
      inverse: "Inverse",
      current: "Current",
    },
    englishSample:
      "Arctic Aria keeps dense product text readable across panels, dialogs, and list rows.",
    chineseSample:
      "北极阿莉雅需要在中文界面中保留更舒适的多行阅读节奏。",
    lineHeightSupport: "14px body copy · Language-aware line-height",
  },
  spacing: {
    title: "Spacing",
    description:
      "Reusable padding and stack rhythm for lists, surfaces, popovers, tags, and text stacks.",
    rowsTitle: "Rows",
    rowsDescription: "Normal and compact row rhythm for user-generated lists.",
    surfacesTitle: "Surfaces",
    surfacesDescription:
      "Shared padding used by card bodies, dialogs, popovers, and tags.",
    textStackTitle: "Text Stacks",
    textStackDescription:
      "Title, description, and supporting metadata use tokenized vertical rhythm.",
    normalRow: "Normal row",
    compactRow: "Compact row",
    cardBody: "Card body",
    dialogBody: "Dialog body",
    popover: "Popover",
    tag: "Tag",
    rowTitle: "Row title",
    rowDescription: "Description line for the row content.",
    rowSupport: "Supporting metadata",
  },
};
