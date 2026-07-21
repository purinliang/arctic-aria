import type { AuthActionResult } from "./server/auth-service";
import type { LoginInput, RegisterInput } from "./validation";

export function submitLogin(input: LoginInput): Promise<AuthActionResult> {
  return submitAuth("/api/auth/login", input);
}

export function submitRegister(input: RegisterInput): Promise<AuthActionResult> {
  return submitAuth("/api/auth/register", input);
}

async function submitAuth(
  url: string,
  input: LoginInput | RegisterInput,
): Promise<AuthActionResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const result = (await response.json()) as AuthActionResult;

    if (!response.ok && result.ok) {
      return failedAuthRequest();
    }

    return result;
  } catch {
    return failedAuthRequest();
  }
}

function failedAuthRequest(): AuthActionResult {
  return {
    ok: false,
    code: "auth_request_failed",
    message: "Server internal error.",
    category: "server",
  };
}
