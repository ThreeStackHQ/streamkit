import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcryptjs from "bcryptjs";
import { apiKeys } from "@streamkit/db/schema";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
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

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, workspaceId));

  return NextResponse.json({
    status: "success",
    data: keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
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

  const parsed = createKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "fail", message: "Validation error" },
      { status: 422 }
    );
  }

  const rawKey = `sk_live_${nanoid(32)}`;
  const keyPrefix = rawKey.slice(0, 8);
  const keyHash = await bcryptjs.hash(rawKey, 12);

  const [created] = await db
    .insert(apiKeys)
    .values({
      workspaceId,
      name: parsed.data.name,
      keyPrefix,
      keyHash,
    })
    .returning();

  return NextResponse.json(
    {
      status: "success",
      data: {
        id: created.id,
        name: created.name,
        key: rawKey,
        keyPrefix,
        createdAt: created.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
