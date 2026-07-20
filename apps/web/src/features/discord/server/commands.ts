const applicationCommandOptionTypeString = 3;
const applicationIntegrationTypeUserInstall = 1;
const interactionContextTypeGuild = 0;
const interactionContextTypeBotDm = 1;
const interactionContextTypePrivateChannel = 2;

export const ideaCommandName = "idea";
export const bindCommandName = "bind";

export const discordCommandData = [
  {
    name: ideaCommandName,
    description: "Capture a quick Arctic Aria idea.",
    integration_types: [applicationIntegrationTypeUserInstall],
    contexts: [
      interactionContextTypeGuild,
      interactionContextTypeBotDm,
      interactionContextTypePrivateChannel,
    ],
    options: [
      {
        name: "text",
        description: "Idea text to save for later review.",
        type: applicationCommandOptionTypeString,
        required: true,
        max_length: 2000,
      },
    ],
  },
  {
    name: bindCommandName,
    description: "Connect Discord to your Arctic Aria account.",
    integration_types: [applicationIntegrationTypeUserInstall],
    contexts: [
      interactionContextTypeGuild,
      interactionContextTypeBotDm,
      interactionContextTypePrivateChannel,
    ],
    options: [
      {
        name: "code",
        description: "Connection code from Arctic Aria Settings.",
        type: applicationCommandOptionTypeString,
        required: true,
        max_length: 32,
      },
    ],
  },
];
