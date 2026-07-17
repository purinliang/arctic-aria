import {
  discordInteractionHelpResponse,
  handleDiscordInteractionRequest,
} from "@/features/discord/server/interaction-endpoint";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return discordInteractionHelpResponse();
}

export async function POST(request: Request) {
  return handleDiscordInteractionRequest({ request });
}
