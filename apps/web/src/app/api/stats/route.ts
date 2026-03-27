import { NextResponse } from "next/server";
import { eq, sql, and, gte } from "drizzle-orm";
import { channels, apiKeys, eventLog, subscriptions } from "@streamkit/db/schema";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized" },
      { status: 401 }
    );
  }

  const workspaceId = (session.user as { workspaceId?: string }).workspaceId;
  if (!workspaceId) {
    return NextResponse.json(
      { status: "fail", message: "No workspace" },
      { status: 400 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const workspaceChannels = await db
    .select({ id: channels.id })
    .from(channels)
    .where(eq(channels.workspaceId, workspaceId));

  const channelIds = workspaceChannels.map((c) => c.id);

  let eventsToday = 0;
  if (channelIds.length > 0) {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventLog)
      .where(
        and(
          sql`${eventLog.channelId} = ANY(${channelIds})`,
          gte(eventLog.createdAt, today)
        )
      );
    eventsToday = result[0]?.count ?? 0;
  }

  const activeChannels = workspaceChannels.length;

  const keyCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, workspaceId));

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, workspaceId))
    .limit(1);

  return NextResponse.json({
    status: "success",
    data: {
      eventsToday,
      activeChannels,
      totalApiKeys: keyCount[0]?.count ?? 0,
      eventsThisMonth: sub[0]?.eventsThisMonth ?? 0,
    },
  });
}
