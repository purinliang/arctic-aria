export type AIProviderMessages = {
  title: string; description: string; provider: string; providerDescription: string; disabled: string;
  apiKey: string; placeholder: string;
  model: string; modelDescription: string;
  savedKey: string; noKey: string; save: string; remove: string;
  loading: string; retry: string; saved: string;
  resultMessages: Record<string, string>;
};

export const englishAIProviderMessages: AIProviderMessages = {
  title: "AI Provider", description: "Your personal AI connection.",
  provider: "Provider", providerDescription: "Select the AI service to use.", disabled: "Disabled", apiKey: "API key",
  model: "Model", modelDescription: "Select the Gemini model to use.",
  placeholder: "Paste your API key",
  savedKey: "API key saved", noKey: "Not configured", save: "Save",
  remove: "Delete API key", loading: "Loading", retry: "Retry",
  saved: "AI settings saved.",
  resultMessages: {
    settings_unauthorized: "Sign in before changing AI settings.",
    ai_invalid: "Enter a valid API key and provider.",
    ai_key_required: "An API key is required.",
    ai_key_exists: "Delete the saved API key before adding another.",
    ai_encryption_unavailable: "Secure key storage is unavailable. Contact the administrator.",
    ai_key_rejected: "Google rejected this key. Check the key and its API restrictions.",
    ai_model_invalid: "Select a supported Gemini model.",
    ai_model_unavailable: "Google could not find the selected model for this request. Check model access.",
    ai_quota: "Google's quota or rate limit was reached.",
    ai_test_failed: "Gemini did not respond successfully. Check connectivity and model access.",
    ai_test_throttled: "Wait 30 seconds before checking an API key again.",
  },
};

export const chineseAIProviderMessages: AIProviderMessages = {
  title: "AI 提供商", description: "你的个人 AI 连接。",
  provider: "提供商", providerDescription: "选择要使用的 AI 服务。", disabled: "禁用", apiKey: "API 密钥",
  model: "模型", modelDescription: "选择要使用的 Gemini 模型。",
  placeholder: "粘贴你的 API 密钥",
  savedKey: "API 密钥已保存", noKey: "未配置", save: "保存",
  remove: "删除 API 密钥", loading: "加载中", retry: "重试",
  saved: "AI 设置已保存。",
  resultMessages: {
    settings_unauthorized: "请先登录再修改 AI 设置。",
    ai_invalid: "请输入有效的 API 密钥和提供商。",
    ai_key_required: "需要 API 密钥。",
    ai_key_exists: "请先删除已保存的 API 密钥，再添加新密钥。",
    ai_encryption_unavailable: "安全密钥存储不可用，请联系管理员。",
    ai_key_rejected: "Google 拒绝了此密钥，请检查密钥及其 API 限制。",
    ai_model_invalid: "请选择支持的 Gemini 模型。",
    ai_model_unavailable: "Google 无法为此请求找到所选模型，请检查模型访问权限。",
    ai_quota: "已达到 Google 的配额或请求频率限制。",
    ai_test_failed: "Gemini 未成功响应，请检查连接和模型访问权限。",
    ai_test_throttled: "请等待 30 秒后再检查 API 密钥。",
  },
};
