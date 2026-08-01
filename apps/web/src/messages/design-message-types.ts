export type DesignMessages = {
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
    typography: string;
    spacing: string;
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
  typography: {
    title: string;
    description: string;
    sizesTitle: string;
    sizesDescription: string;
    weightsTitle: string;
    weightsDescription: string;
    tonesTitle: string;
    tonesDescription: string;
    languageTitle: string;
    languageDescription: string;
    sampleTitle: string;
    sampleDescription: string;
    sampleSupport: string;
    sizeLabels: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      page: string;
    };
    weightLabels: {
      light: string;
      normal: string;
      medium: string;
      semibold: string;
    };
    toneLabels: {
      primary: string;
      secondary: string;
      inverse: string;
      current: string;
    };
    englishSample: string;
    chineseSample: string;
    lineHeightSupport: string;
  };
  spacing: {
    title: string;
    description: string;
    rowsTitle: string;
    rowsDescription: string;
    normalRow: string;
    compactRow: string;
    tag: string;
    rowDescription: string;
    rowSupport: string;
  };
};
