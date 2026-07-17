"use server";

import { getCurrentUser } from "@/features/auth/actions";
import {
  normalizeUserPreferences,
  type UserPreferences,
} from "./preferences";
import {
  settingsService,
  type SettingsActionResult,
} from "./server/settings-service";
import {
  discordBindingService,
  type DiscordBindingActionResult,
} from "./server/discord-binding-service";
import {
  discordTestMessageService,
  type DiscordTestMessageActionResult,
} from "./server/discord-test-message-service";

export async function getUserPreferences(): Promise<SettingsActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  return settingsService.getPreferences(user.id);
}

export async function saveUserPreferences(
  input: UserPreferences,
): Promise<SettingsActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  return settingsService.savePreferences(
    user.id,
    normalizeUserPreferences(input),
  );
}

export async function getDiscordBinding(): Promise<DiscordBindingActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedDiscordResult();
  }

  return discordBindingService.getBinding(user.id);
}

export async function createDiscordBindingCode(): Promise<
  DiscordBindingActionResult
> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedDiscordResult();
  }

  return discordBindingService.createBindingCode(user.id);
}

export async function unbindDiscordAccount(): Promise<
  DiscordBindingActionResult
> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedDiscordResult();
  }

  return discordBindingService.unbind(user.id);
}

export async function cancelDiscordBindingCode(): Promise<
  DiscordBindingActionResult
> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedDiscordResult();
  }

  return discordBindingService.cancelBindingCode(user.id);
}

export async function sendDiscordTestMessage(): Promise<
  DiscordTestMessageActionResult
> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedDiscordTestResult();
  }

  return discordTestMessageService.sendTestMessage(user.id);
}

function unauthorizedResult(): SettingsActionResult {
  return {
    ok: false,
    code: "settings_unauthorized",
    message: "Sign in before changing settings.",
  };
}

function unauthorizedDiscordResult(): DiscordBindingActionResult {
  return {
    ok: false,
    code: "settings_unauthorized",
    message: "Sign in before changing settings.",
  };
}

function unauthorizedDiscordTestResult(): DiscordTestMessageActionResult {
  return {
    ok: false,
    code: "settings_unauthorized",
    message: "Sign in before changing settings.",
  };
}
