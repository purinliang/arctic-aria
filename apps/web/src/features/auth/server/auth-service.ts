import {
  hasAuthErrors,
  normalizeLoginInput,
  normalizeRegisterInput,
  validateLoginSubmit,
  validateRegisterSubmit,
  type AuthFieldErrors,
  type LoginInput,
  type RegisterInput,
} from "../validation.ts";
import { bcryptPasswordHasher, type PasswordHasher } from "./password.ts";
import { PostgresUserRepository } from "./postgres-user-repository.ts";
import {
  DuplicateUsernameError,
  type UserRecord,
  type UserRepository,
} from "./user-repository.ts";

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
};

export type AuthActionResult =
  | {
      ok: true;
      code: string;
      message: string;
      displayName: string;
      user: AuthUser;
    }
  | {
      ok: false;
      code: string;
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

function toAuthUser(user: Pick<UserRecord, "id" | "username" | "displayName">) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

function usernameTakenResult(): AuthActionResult {
  return {
    ok: false,
    code: "auth_username_taken",
    message: "Username is already taken.",
    fieldErrors: { username: "Username is already taken." },
  };
}

export function createAuthService(options: AuthServiceOptions = {}) {
  const users = options.users ?? new PostgresUserRepository();
  const passwordHasher = options.passwordHasher ?? bcryptPasswordHasher;
  const log = options.log ?? defaultAuthLog;

  return {
    async register(input: RegisterInput): Promise<AuthActionResult> {
      const normalizedInput = normalizeRegisterInput(input);
      const fieldErrors = validateRegisterSubmit(normalizedInput);

      if (hasAuthErrors(fieldErrors)) {
        log("register_validation_failed", {
          username: normalizedInput.username,
          fields: Object.keys(fieldErrors),
        });

        return {
          ok: false,
          code: "auth_validation_failed",
          message: "Please fix the highlighted fields.",
          fieldErrors,
        };
      }

      const existingUser = await users.findByUsername(normalizedInput.username);

      if (existingUser) {
        log("register_username_taken", { username: normalizedInput.username });

        return usernameTakenResult();
      }

      const passwordHash = await passwordHasher.hash(normalizedInput.password);

      let user: UserRecord;

      try {
        user = await users.create({
          username: normalizedInput.username,
          displayName: normalizedInput.displayName,
          passwordHash,
        });
      } catch (error) {
        if (error instanceof DuplicateUsernameError) {
          log("register_username_taken_after_create", {
            username: normalizedInput.username,
          });

          return usernameTakenResult();
        }

        throw error;
      }

      log("register_success", { username: normalizedInput.username });

      return {
        ok: true,
        code: "auth_account_created",
        message: "Account created successfully.",
        displayName: normalizedInput.displayName,
        user: toAuthUser(user),
      };
    },

    async login(input: LoginInput): Promise<AuthActionResult> {
      const normalizedInput = normalizeLoginInput(input);
      const fieldErrors = validateLoginSubmit(normalizedInput);

      if (hasAuthErrors(fieldErrors)) {
        log("login_validation_failed", {
          username: normalizedInput.username,
          fields: Object.keys(fieldErrors),
        });

        return {
          ok: false,
          code: "auth_validation_failed",
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
          code: "auth_invalid_credentials",
          message: "Invalid username or password.",
        };
      }

      log("login_success", { username: normalizedInput.username });

      return {
        ok: true,
        code: "auth_signed_in",
        message: "Signed in successfully.",
        displayName: user.displayName,
        user: toAuthUser(user),
      };
    },
  };
}

export const authService = createAuthService();
