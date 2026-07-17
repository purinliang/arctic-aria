import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord.js";
import {
  bindCommandName,
  discordCommandData,
  ideaCommandName,
} from "../interactions/commands.ts";

describe("discordCommandData", () => {
  it("registers slash commands as user-install commands for personal Discord use", () => {
    assert.deepEqual(
      discordCommandData.map((command) => command.name),
      [ideaCommandName, bindCommandName],
    );

    for (const command of discordCommandData) {
      assert.deepEqual(command.integration_types, [
        ApplicationIntegrationType.UserInstall,
      ]);
      assert.deepEqual(command.contexts, [
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel,
      ]);
    }
  });
});
