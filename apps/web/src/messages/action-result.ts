export type ActionFailureResult = {
  ok: false;
  message: string;
  code?: string;
};

export function localizedActionMessage(
  result: { message: string; code?: string },
  messages?: Record<string, string>,
) {
  return result.code ? messages?.[result.code] ?? result.message : result.message;
}
