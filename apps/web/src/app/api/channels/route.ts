import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { channels } from "@streamkit/db/schema";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  isPresenceEnabled: z.boolean().optional().default(false),
});

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

  const result = await db
    .select()
    .from(channels)
    .where(eq(channels.workspaceId, workspaceId));

  return NextResponse.json({
    status: "success",
    data: result.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      isPresenceEnabled: c.isPresenceEnabled,
      subscriberCount: c.subscriberCount,
      eventsThisHour: c.eventsThisHour,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "fail", message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const parsed = createChannelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "fail", message: "Validation error", errors: parsed.error.errors },
      { status: 422 }
    );
  }

  const slug = nanoid(8);
  const [channel] = await db
    .insert(channels)
    .values({
      workspaceId,
      name: parsed.data.name,
      slug,
      isPresenceEnabled: parsed.data.isPresenceEnabled,
    })
    .returning();

  return NextResponse.json(
    {
      status: "success",
      data: {
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
        isPresenceEnabled: channel.isPresenceEnabled,
        createdAt: channel.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
