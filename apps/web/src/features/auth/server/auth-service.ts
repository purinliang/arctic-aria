import {
  hasAuthErrors,
  normalizeLoginInput,
  normalizeRegisterInput,
  validateLoginTyping,
  validateRegisterTyping,
  type AuthFieldErrors,
  type LoginInput,
  type RegisterInput,
} from "../validation.ts";
import { prototypePasswordHasher, type PasswordHasher } from "./password.ts";
import {
  authUserRepository,
  type UserRepository,
} from "./user-repository.ts";

export type AuthActionResult =
  | {
      ok: true;
      message: string;
      displayName: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: AuthFieldErrors;
    };

type AuthServiceOptions = {
  users?: UserRepository;
  passwordHasher?: PasswordHasher;
  log?: (event: string, details: Record<string, unknown>) => void;
};

function defaultAuthLog(event: string, details: Record<string, unknown>) {
  console.log("[auth]", event, details);
}

export function createAuthService(options: AuthServiceOptions = {}) {
  const users = options.users ?? authUserRepository;
  const passwordHasher = options.passwordHasher ?? prototypePasswordHasher;
  const log = options.log ?? defaultAuthLog;

  return {
    async register(input: RegisterInput): Promise<AuthActionResult> {
      const normalizedInput = normalizeRegisterInput(input);
      const fieldErrors = validateRegisterTyping(normalizedInput);

      if (hasAuthErrors(fieldErrors)) {
        log("register_validation_failed", {
          username: normalizedInput.username,
          fields: Object.keys(fieldErrors),
        });

        return {
          ok: false,
          message: "Please fix the highlighted fields.",
          fieldErrors,
        };
      }

      const existingUser = await users.findByUsername(normalizedInput.username);

      if (existingUser) {
        log("register_username_taken", { username: normalizedInput.username });

        return {
          ok: false,
          message: "Username is already taken.",
          fieldErrors: { username: "Username is already taken." },
        };
      }

      const passwordHash = await passwordHasher.hash(normalizedInput.password);

      await users.create({
        username: normalizedInput.username,
        displayName: normalizedInput.displayName,
        passwordHash,
      });

      log("register_success", { username: normalizedInput.username });

      return {
        ok: true,
        message: "Account created. Opening dashboard...",
        displayName: normalizedInput.displayName,
      };
    },

    async login(input: LoginInput): Promise<AuthActionResult> {
      const normalizedInput = normalizeLoginInput(input);
      const fieldErrors = validateLoginTyping(normalizedInput);

      if (hasAuthErrors(fieldErrors)) {
        log("login_validation_failed", {
          username: normalizedInput.username,
          fields: Object.keys(fieldErrors),
        });

        return {
          ok: false,
          message: "Please fix the highlighted fields.",
          fieldErrors,
        };
      }

      const user = await users.findByUsername(normalizedInput.username);
      const passwordValid = user
        ? await passwordHasher.verify(normalizedInput.password, user.passwordHash)
        : false;

      if (!user || !passwordValid) {
        log("login_failed", { username: normalizedInput.username });

        return {
          ok: false,
          message: "Invalid username or password.",
        };
      }

      log("login_success", { username: normalizedInput.username });

      return {
        ok: true,
        message: "Signed in. Opening dashboard...",
        displayName: user.displayName,
      };
    },
  };
}

export const authService = createAuthService();
