import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord.js";
import { discordCommandData } from "../discord-commands.ts";

describe("discordCommandData", () => {
  it("registers idea as a user-install command for personal Discord use", () => {
    assert.deepEqual(discordCommandData[0].integration_types, [
      ApplicationIntegrationType.UserInstall,
    ]);
    assert.deepEqual(discordCommandData[0].contexts, [
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ]);
  });
});
