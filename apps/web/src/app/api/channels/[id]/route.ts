import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { channels, eventLog } from "@streamkit/db/schema";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isPresenceEnabled: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized" },
      { status: 401 }
    );
  }

  const workspaceId = (session.user as { workspaceId?: string }).workspaceId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "fail", message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const parsed = updateChannelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "fail", message: "Validation error" },
      { status: 422 }
    );
  }

  const existing = await db
    .select()
    .from(channels)
    .where(and(eq(channels.id, id), eq(channels.workspaceId, workspaceId!)))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json(
      { status: "fail", message: "Channel not found" },
      { status: 404 }
    );
  }

  const [updated] = await db
    .update(channels)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(channels.id, id))
    .returning();

  return NextResponse.json({
    status: "success",
    data: {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      isPresenceEnabled: updated.isPresenceEnabled,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized" },
      { status: 401 }
    );
  }

  const workspaceId = (session.user as { workspaceId?: string }).workspaceId;

  const existing = await db
    .select()
    .from(channels)
    .where(and(eq(channels.id, id), eq(channels.workspaceId, workspaceId!)))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json(
      { status: "fail", message: "Channel not found" },
      { status: 404 }
    );
  }

  await db.delete(eventLog).where(eq(eventLog.channelId, id));
  await db.delete(channels).where(eq(channels.id, id));

  return new Response(null, { status: 204 });
}
