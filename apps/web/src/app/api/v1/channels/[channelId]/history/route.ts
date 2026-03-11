import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { channels, eventLog } from "@streamkit/db/schema";
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

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "50", 10) || 50, 1), 200);

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

  const events = await db
    .select()
    .from(eventLog)
    .where(eq(eventLog.channelId, channelId))
    .orderBy(desc(eventLog.createdAt))
    .limit(limit);

  return NextResponse.json({
    status: "success",
    data: events.map((e) => ({
      id: e.id,
      event: e.eventName,
      payload: e.payload,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
