import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord.js";

export const ideaCommandName = "idea";
export const bindCommandName = "bind";

export const discordCommandData = [
  {
    name: ideaCommandName,
    description: "Capture a quick Arctic Aria idea.",
    integration_types: [ApplicationIntegrationType.UserInstall],
    contexts: [
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ],
    options: [
      {
        name: "text",
        description: "Idea text to save for later review.",
        type: ApplicationCommandOptionType.String,
        required: true,
        max_length: 2000,
      },
    ],
  },
  {
    name: bindCommandName,
    description: "Connect Discord to your Arctic Aria account.",
    integration_types: [ApplicationIntegrationType.UserInstall],
    contexts: [
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ],
    options: [
      {
        name: "code",
        description: "Connection code from Arctic Aria Settings.",
        type: ApplicationCommandOptionType.String,
        required: true,
        max_length: 32,
      },
    ],
  },
];
