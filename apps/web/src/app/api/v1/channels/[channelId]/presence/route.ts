import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { channels } from "@streamkit/db/schema";
import { db } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-key-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;

  const authResult = await authenticateApiKey(request);
  if (!authResult) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized" },
      { status: 401 }
    );
  }

  const channel = await db
    .select()
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1);

  if (channel.length === 0 || channel[0].workspaceId !== authResult.workspaceId) {
    return NextResponse.json(
      { status: "fail", message: "Channel not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "success",
    data: { subscriberCount: channel[0].subscriberCount },
  });
}
