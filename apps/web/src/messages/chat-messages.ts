import type { SupportedLanguage } from './languages';

const en = {
  title: 'Aria Chat', open: 'Open chat', close: 'Close chat',
  search: 'Search the last 7 days', input: 'Message', placeholder: 'Ask a question...', send: 'Send message',
  empty: 'Hello. What’s on your mind?', noResults: 'No matching messages', older: 'Older messages',
  processing: 'Thinking...', tool_execution: 'Working on it...', retry: 'Retry', loading: 'Loading history...',
  settingsAction: 'Settings', today: 'Today', yesterday: 'Yesterday', searchAction: 'Search history',
  results: {
    chat_unauthorized: 'Sign in to use chat.', chat_invalid: 'Enter a message of up to 4,000 characters.',
    chat_not_configured: 'Set up your AI provider in Settings to get started.', chat_busy: 'A reply is already in progress. Please wait.',
    chat_internal: 'Something went wrong. Please try again.',
    chat_provider_unavailable: 'AI service is unavailable. Try another provider.',
    chat_invalid_key: 'Invalid API key. Check your AI settings.',
    chat_rate_limited: 'Too many requests. Please try again later.',
    chat_network: 'Connection failed. Check your network and try again.',
    chat_timeout: 'Request timed out. Please try again.',
  },
};
export type ChatMessages = typeof en;
const zh: ChatMessages = {
  title: 'Aria 聊天', open: '打开聊天', close: '关闭聊天',
  search: '搜索最近 7 天的聊天', input: '消息', placeholder: '输入问题...', send: '发送消息',
  empty: '你好，有什么想聊的吗？', noResults: '没有匹配的消息', older: '更早的消息', processing: '思考中...',
  tool_execution: '正在处理...', retry: '重试', loading: '正在加载记录...',
  settingsAction: '设置', today: '今天', yesterday: '昨天', searchAction: '搜索记录',
  results: {
    chat_unauthorized: '请登录后使用聊天。', chat_invalid: '请输入不超过 4,000 字符的消息。',
    chat_not_configured: '请在设置中配置 AI 服务后开始聊天。', chat_busy: '正在生成回复，请稍候。',
    chat_internal: '出现了问题，请重试。', chat_provider_unavailable: 'AI 服务暂时不可用，请尝试其他服务。',
    chat_invalid_key: 'API 密钥无效，请检查 AI 设置。', chat_rate_limited: '请求过多，请稍后重试。',
    chat_network: '连接失败，请检查网络后重试。', chat_timeout: '请求超时，请重试。',
  },
};
export function chatMessages(language: SupportedLanguage): ChatMessages { return language === 'zh-CN' ? zh : en; }
