import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { channels, eventLog, subscriptions } from "@streamkit/db/schema";
import { db } from "@/lib/db";
import { getRedis } from "@/lib/redis";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getMonthlyEventLimit } from "@/lib/tier";

const eventSchema = z.object({
  channelId: z.string().uuid(),
  event: z.string().min(1).max(255),
  payload: z.unknown(),
});

export async function POST(request: Request) {
  const authResult = await authenticateApiKey(request);
  if (!authResult) {
    return NextResponse.json(
      { status: "fail", message: "Invalid API key" },
      { status: 401 }
    );
  }

  const { allowed, remaining } = await checkRateLimit(
    authResult.apiKeyId,
    authResult.rateLimitPerMin
  );
  if (!allowed) {
    return NextResponse.json(
      { status: "fail", message: "Rate limit exceeded" },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "fail", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "fail",
        message: "Validation error",
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
      { status: 422 }
    );
  }

  const { channelId, event, payload } = parsed.data;

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

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, authResult.workspaceId))
    .limit(1);

  const monthlyLimit = getMonthlyEventLimit(authResult.tier);
  if (sub[0] && sub[0].eventsThisMonth >= monthlyLimit) {
    return NextResponse.json(
      { status: "fail", message: "Monthly event limit exceeded" },
      { status: 429 }
    );
  }

  const [inserted] = await db
    .insert(eventLog)
    .values({ channelId, eventName: event, payload })
    .returning();

  const message = JSON.stringify({
    id: inserted.id,
    event,
    payload,
    timestamp: inserted.createdAt.toISOString(),
  });

  const redis = getRedis();
  await redis.publish(`streamkit:events:${channelId}`, message);

  await db
    .update(subscriptions)
    .set({ eventsThisMonth: sql`${subscriptions.eventsThisMonth} + 1` })
    .where(eq(subscriptions.workspaceId, authResult.workspaceId));

  await db
    .update(channels)
    .set({ eventsThisHour: sql`${channels.eventsThisHour} + 1` })
    .where(eq(channels.id, channelId));

  return NextResponse.json({
    status: "success",
    data: {
      id: inserted.id,
      channel: channelId,
      event,
      timestamp: inserted.createdAt.toISOString(),
    },
  });
}
