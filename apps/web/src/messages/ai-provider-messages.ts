export type AIProviderMessages = {
  title: string; description: string; enabled: string; provider: string;
  apiKey: string; placeholder: string; replacePlaceholder: string;
  savedKey: string; noKey: string; save: string; test: string; remove: string;
  loading: string; retry: string; saved: string; tested: string;
  resultMessages: Record<string, string>;
};

export const englishAIProviderMessages: AIProviderMessages = {
  title: "AI Provider", description: "Your personal AI connection.",
  enabled: "Enable AI", provider: "Provider", apiKey: "API key",
  placeholder: "Paste your API key", replacePlaceholder: "Replace saved API key",
  savedKey: "API key saved", noKey: "Not configured", save: "Save", test: "Test",
  remove: "Remove API key", loading: "Loading", retry: "Retry",
  saved: "AI settings saved.", tested: "Gemini connection successful.",
  resultMessages: {
    settings_unauthorized: "Sign in before changing AI settings.",
    ai_invalid: "Enter a valid API key and provider.",
    ai_key_required: "An API key is required.",
    ai_encryption_unavailable: "Secure key storage is unavailable. Contact the administrator.",
    ai_key_rejected: "Google rejected this key. Check the key and its API restrictions.",
    ai_model_unavailable: "Gemini 2.5 Flash is not available for this key.",
    ai_quota: "Google's quota or rate limit was reached.",
    ai_test_failed: "Gemini did not respond successfully. Check connectivity and model access.",
    ai_test_throttled: "Wait 30 seconds before testing again.",
  },
};

export const chineseAIProviderMessages: AIProviderMessages = {
  title: "AI 提供商", description: "你的个人 AI 连接。",
  enabled: "启用 AI", provider: "提供商", apiKey: "API 密钥",
  placeholder: "粘贴你的 API 密钥", replacePlaceholder: "替换已保存的 API 密钥",
  savedKey: "API 密钥已保存", noKey: "未配置", save: "保存", test: "测试",
  remove: "移除 API 密钥", loading: "加载中", retry: "重试",
  saved: "AI 设置已保存。", tested: "Gemini 连接成功。",
  resultMessages: {
    settings_unauthorized: "请先登录再修改 AI 设置。",
    ai_invalid: "请输入有效的 API 密钥和提供商。",
    ai_key_required: "需要 API 密钥。",
    ai_encryption_unavailable: "安全密钥存储不可用，请联系管理员。",
    ai_key_rejected: "Google 拒绝了此密钥，请检查密钥及其 API 限制。",
    ai_model_unavailable: "此密钥无法使用 Gemini 2.5 Flash。",
    ai_quota: "已达到 Google 的配额或请求频率限制。",
    ai_test_failed: "Gemini 未成功响应，请检查连接和模型访问权限。",
    ai_test_throttled: "请等待 30 秒后再测试。",
  },
};
