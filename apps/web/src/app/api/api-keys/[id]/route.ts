import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { apiKeys } from "@streamkit/db/schema";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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
    .from(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.workspaceId, workspaceId!)))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json(
      { status: "fail", message: "API key not found" },
      { status: 404 }
    );
  }

  await db.delete(apiKeys).where(eq(apiKeys.id, id));

  return new Response(null, { status: 204 });
}
