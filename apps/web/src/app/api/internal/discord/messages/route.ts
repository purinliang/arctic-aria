import {
  discordMessagePushHelpResponse,
  handleDiscordMessagePushRequest,
} from "@/features/discord/server/message-push-endpoint";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return discordMessagePushHelpResponse();
}

export async function POST(request: Request) {
  return handleDiscordMessagePushRequest({ request });
}
